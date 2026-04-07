# Change Spec: Multi-Director Support + Employment Allowance Auto-Eligibility

## Summary

Two changes to the existing UK Director Payroll & Tax Calculator at payroll.saas-scaler.com:

1. **Multi-director support** — allow 1–4 directors, each with their own salary and dividends, with individual personal tax calculations and aggregated company-level costs.
2. **Employment Allowance auto-eligibility** — automatically apply EA when 2+ directors are on payroll earning more than £5,000 each (not just via the £5,001 employee toggle).

---

## Change 1: Multi-Director Support

### Input changes

Replace the single Director Salary and Dividends Drawn fields with a **directors array**. The state shape changes from:

```js
// BEFORE
{ revenue, otherCosts, directorSalary, dividends, eaToggle, pensionToggle }

// AFTER
{ revenue, otherCosts, directors: [{ name, salary, dividends }, ...], eaToggle, pensionToggle }
```

Default state: one director with `{ name: '', salary: 12570, dividends: 87430 }`.

**UI requirements:**
- Show a "Directors" heading between the company inputs and the toggles, with an **"Add Director"** button (max 4 directors)
- Each director renders in a distinct card (subtle background, e.g. `bg-slate-50` with border) showing:
  - Header: "Director N" with a **"Remove"** button (hidden when only 1 director)
  - Name (optional text input, placeholder "Director N")
  - Salary (£) — currency input, default £12,570
  - Dividends Drawn (£) — currency input, default £0 for added directors
- Revenue, Other Business Costs, and the two toggles remain as company-level inputs outside the director cards

### Calculation changes — Company section

Per-director employer NI is calculated individually, then aggregated:

```
// For EACH director:
directorPensionSacrificeAmount[i] =
  IF(pensionToggle) ROUND(directors[i].salary × 0.05, 2) ELSE 0

pensionableSalary[i] = directors[i].salary − directorPensionSacrificeAmount[i]

employerNIDirectorGross[i] = MAX(0, (pensionableSalary[i] − 5000) × 0.15)

// Aggregate:
totalDirectorSalaries = SUM(directors[*].salary)
totalDirectorPensionSacrifice = SUM(directorPensionSacrificeAmount[*])
totalEmployerNIDirectorGross = SUM(employerNIDirectorGross[*])
```

Employment Allowance offsets the **combined** employer NI across all directors (not per-director). The rest of the company calculation (taxable profit, corporation tax) works the same but uses these aggregated totals.

### Calculation changes — Personal tax

Each director gets their own **complete, independent** personal tax calculation — their own Personal Allowance, their own tax bands, their own £500 dividend allowance. No sharing or pooling between directors.

The existing personal tax logic doesn't change; it just runs once per director instead of once overall. Aggregate totals for the summary:

```
totalIncomeTax = SUM(incomeTax[*])
totalEmployeeNI = SUM(employeeNI[*])
totalDividendTax = SUM(dividendTax[*])
totalNetTakeHome = SUM(netTakeHome[*])
totalDividends = SUM(directors[*].dividends)
```

### Display changes — Company section

- "Less: Director Salary" becomes "Less: Director Salaries (total)" when 2+ directors, with indented sub-lines showing each director's name and salary
- "Less: Director Pension Sacrifice" appends "(all directors)" when multiple
- "Employer NI on Director" becomes "Employer NI on Directors" when multiple
- All other company lines work the same (they already use totals)

### Display changes — Personal section

- **Single director:** display as before, no heading above the breakdown
- **Multiple directors:** show each director's full breakdown under their name (or "Director N"), each with their own highlighted "Net Take-Home" row
- After all directors, show a **"Combined Net Take-Home (all directors)"** summary in a blue highlighted box

### Display changes — Tax Summary

When multiple directors, append "(all directors)" to the Income Tax, Employee NI, and Dividend Tax labels.

### Display changes — Scenario comparison

- Apply the scenario salary to **ALL directors** equally (each director's dividends stay as set)
- When multiple directors, show a note: *"Each scenario applies the same salary to all X directors. Dividends remain as set per director."*
- Row labels change to "Director Salary (each)", "Income Tax (total)", "Employee NI (total)", "Dividend Tax (total)", "Net Take-Home (total)"
- The "Custom" column uses the first director's salary as the reference

### Warning changes

- "Dividends exceed post-tax profit" compares `totalDividends` (sum across all directors) vs `postTaxProfit`
- Personal Allowance taper warnings are **per-director**, prefixed with the director's name: e.g. "Director 1: Personal Allowance tapered to £X,XXX..."

---

## Change 2: Employment Allowance Auto-Eligibility

### Rule

EA is available when the company has more than one person on payroll earning above the secondary threshold (£5,000):

```
directorsAboveThreshold = directors.filter(d => d.salary > 5000).length
eaEligible = (directorsAboveThreshold >= 2) OR (eaToggle === true)
```

The £5,001 employee costs (salary, pension, employer NI) still only apply when `eaToggle = true`. But `employmentAllowanceUsed` is calculated whenever `eaEligible = true`.

### Calculation change

```
// BEFORE
employmentAllowanceUsed = IF(eaToggle) MIN(10500, totalEmployerNIDirectorGross) ELSE 0

// AFTER
employmentAllowanceUsed = IF(eaEligible) MIN(10500, totalEmployerNIDirectorGross) ELSE 0
```

Everything else in the company calculation stays the same.

### UI changes

When 2+ directors are earning above £5,000:
- Show a **green banner** above the EA toggle: *"Employment Allowance automatically available — you have X directors on payroll earning above £5,000."*
- Relabel the toggle from "Include £5,001 Employee?" to **"Also include £5,001 Employee?"**
- Change the toggle description from "Adds a £5,001 employee to unlock Employment Allowance" to **"EA is already unlocked. This adds a £5,001 employee salary, pension and NI costs."**

Otherwise (single director, or multiple directors but fewer than 2 above £5,000):
- No banner, toggle label and description unchanged from current behaviour

### Warning changes

- The existing EA tip ("Employing one person on £5,001 could unlock...") should only show when `eaEligible = false` (not just when `eaToggle = false`)
- Add a new info-level warning when EA is auto-enabled via multiple directors and eaToggle is off: *"Employment Allowance is automatically available because you have 2+ directors on payroll earning above £5,000. You can still add a £5,001 employee if needed."*

---

## Also fix: Corporation Tax sign convention

The current `totalTax` formula has a sign error. Corporation tax is positive when payable and negative when a refund. The formula should use `+ corporationTax`, not `- corporationTax`:

```
// WRONG (current)
totalTax = −corporationTax + incomeTax + ...

// CORRECT
totalTax = corporationTax + totalIncomeTax + totalEmployeeNI
         + totalEmployerNIDirectorNet + employerNI5k + employerPension5k
         + totalDividendTax
```

Similarly in the Tax Summary display, Corporation Tax should show `r.corporationTax` directly (not negated). It will naturally be positive for a payable amount and negative for a refund.

---

## Expected results for verification

### Single director defaults (salary £12,570, dividends £87,430, no EA, no pension)
- Employer NI Director (gross): £1,135.50
- Taxable Company Profit: £96,494.50
- Corporation Tax: £19,679.89
- Dividend Tax: £21,652.47
- Net Take-Home: £78,347.52
- **Total Tax: £42,467.87**
- **Effective Rate: 37.5%**

### Two equal directors (each: salary £12,570, dividends £43,715, EA auto-enabled, no pension)
- EA automatically applied: £2,271.00
- Taxable Company Profit: £82,789.00
- Corporation Tax: £16,544.28
- Each director's Net Take-Home: £50,260.64
- **Total Tax: £29,104.79**
- **Effective Rate: 25.7%**
