# Claude Code Prompt: UK Director Payroll & Tax Calculator Web App (FY 2026/27)

## Project overview

Build a single-page web application: a UK limited company director payroll and tax calculator for FY 2026/27. The app calculates the total tax position — combining company-level costs (corporation tax, employer NI, salary, pension) with personal tax (income tax, employee NI, dividend tax) — and shows net take-home pay and overall tax efficiency.

## Tech stack

- **React** (with hooks) as the UI framework
- **Tailwind CSS** for styling
- No backend required — all calculations are pure client-side JavaScript
- No external dependencies beyond React and Tailwind
- Deploy as a static site (Vite + React is fine)

---

## Inputs (user-editable)

The app should have a clearly labelled inputs panel with these fields:

| Field | Type | Default |
|---|---|---|
| Company Revenue (£) | Number input | 113,200 |
| Other Business Costs, excl. salary/NI (£) | Number input | 3,000 |
| Director Salary (£) | Number input | 12,570 |
| Dividends Drawn (£) | Number input | 87,430 |
| Include £5,001 Employee? | Toggle YES/NO | NO |
| Director Pension Sacrifice? | Toggle YES/NO | NO |

All number inputs should accept comma-formatted values and update results instantly on change (no submit button).

---

## Tax rates (FY 2026/27) — hardcoded constants, clearly named

```js
const RATES = {
  // Employer NI
  secondaryThreshold: 5000,
  employerNIRate: 0.15,
  employmentAllowance: 10500,

  // Pension
  employerPensionMatch: 0.03,      // 3% of £5,001 employee salary
  directorPensionSacrifice: 0.05,  // 5% of director salary (salary sacrifice)

  // Corporation Tax
  ctSmallProfitsLimit: 50000,
  ctSmallProfitsRate: 0.19,
  ctMainRateLimit: 250000,
  ctMainRate: 0.25,
  ctMarginalReliefDenominator: 200000,

  // Income Tax
  personalAllowance: 12570,
  paTaperThreshold: 100000,
  basicRateBandWidth: 37700,       // £12,571 to £50,270
  basicRate: 0.20,
  higherRateBandUpperAbovePA: 112570, // £50,271 to £125,140
  higherRate: 0.40,
  additionalRate: 0.45,

  // Employee NI
  employeeNIPrimaryThreshold: 12570,
  employeeNIMainRate: 0.08,        // 8% on £12,570–£50,270
  upperEarningsLimit: 50270,
  employeeNIUpperRate: 0.02,       // 2% above UEL

  // Dividend Tax
  dividendAllowance: 500,
  dividendBasicRate: 0.1075,       // increased from 8.75% April 2026
  dividendHigherRate: 0.3575,      // increased from 33.75% April 2026
  dividendAdditionalRate: 0.3935,
  additionalRateThreshold: 125140,
};
```

These should be displayed in a collapsible "Rates & Assumptions" section at the bottom of the page so they are visible but not cluttering the main UI.

---

## Calculation logic

Implement a pure function `calculate(inputs)` that returns a results object. All logic below must be implemented exactly as specified.

### Step 1 — Company section

```
pensionableSalary = directorSalary - directorPensionSacrificeAmount

directorPensionSacrificeAmount =
  IF(pensionToggle=YES) ROUND(directorSalary × directorPensionSacrificeRate, 2)
  ELSE 0

employee5kSalary      = IF(eaToggle=YES) 5001 ELSE 0
employerPension5k     = IF(eaToggle=YES) ROUND(5001 × employerPensionMatch, 2) ELSE 0
employerNI5k          = IF(eaToggle=YES) MAX(0, (5001 − secondaryThreshold) × employerNIRate) ELSE 0

employerNIDirectorGross = MAX(0, (pensionableSalary − secondaryThreshold) × employerNIRate)

employmentAllowanceUsed =
  IF(eaToggle=YES) MIN(employmentAllowance, employerNIDirectorGross) ELSE 0

employerNIDirectorNet = MAX(0, employerNIDirectorGross − employmentAllowanceUsed)

taxableCompanyProfit =
  revenue
  − otherCosts
  − employee5kSalary
  − directorPensionSacrificeAmount   ← sacrifice reduces taxable profit
  − directorSalary
  − employerPension5k
  − employerNI5k
  − employerNIDirectorNet
```

**Corporation Tax with marginal relief and loss carry-back:**
```
IF taxableCompanyProfit >= 0:
  IF profit <= ctSmallProfitsLimit:
    ct = profit × ctSmallProfitsRate
  ELSE IF profit >= ctMainRateLimit:
    ct = profit × ctMainRate
  ELSE (marginal relief):
    ct = profit × ctMainRate
      − (ctMainRateLimit − profit) × (profit / ctMarginalReliefDenominator)
      × (ctMainRate − ctSmallProfitsRate)
ELSE (loss — refund against historic profits):
  ct = taxableCompanyProfit × ctSmallProfitsRate
  // result is negative (a refund). Show as NEGATIVE in the summary.

corporationTax = ct  ← negative means payable, positive means refund
postTaxProfit = taxableCompanyProfit − ct
```

### Step 2 — Personal tax

```
// Taxable/pensionable salary = gross salary reduced by sacrifice
taxableSalary = directorSalary − directorPensionSacrificeAmount

totalPersonalIncome = taxableSalary + dividends

// Personal Allowance — tapers above £100k
adjustedPA = MAX(0, personalAllowance − MAX(0, (totalPersonalIncome − paTaperThreshold) / 2))
// Note: dividends count towards the taper even though £500 is tax-free

// Income Tax on salary (layered bands, salary uses PA first)
salaryAbovePA = MAX(0, taxableSalary − adjustedPA)
incomeTax =
  MIN(salaryAbovePA, basicRateBandWidth) × basicRate
  + MAX(0, MIN(salaryAbovePA − basicRateBandWidth, higherRateBandUpperAbovePA − basicRateBandWidth)) × higherRate
  + MAX(0, salaryAbovePA − higherRateBandUpperAbovePA) × additionalRate

// Employee NI (on pensionable/taxable salary)
employeeNI =
  MAX(0, MIN(taxableSalary, upperEarningsLimit) − employeeNIPrimaryThreshold) × employeeNIMainRate
  + MAX(0, taxableSalary − upperEarningsLimit) × employeeNIUpperRate

// Dividend tax — dividends stack on top of salary
// How much basic rate band is left after salary?
basicRateBandRemaining = MAX(0, adjustedPA + basicRateBandWidth − taxableSalary)
// How much higher rate band space is left?
higherRateBandRemaining = MAX(0, additionalRateThreshold − taxableSalary − basicRateBandRemaining)

taxableDividends = MAX(0, dividends − dividendAllowance)

dividendBasicTaxed  = MIN(taxableDividends, basicRateBandRemaining)
dividendHigherTaxed = MAX(0, MIN(taxableDividends − basicRateBandRemaining, higherRateBandRemaining))
dividendAdditTaxed  = MAX(0, taxableDividends − basicRateBandRemaining − higherRateBandRemaining)

dividendTax =
  dividendBasicTaxed × dividendBasicRate
  + dividendHigherTaxed × dividendHigherRate
  + dividendAdditTaxed × dividendAdditionalRate

// Net take-home = gross salary + dividends − all personal taxes
// Note: uses gross salary (director receives gross salary in cash)
netTakeHome = directorSalary + dividends − incomeTax − employeeNI − dividendTax
```

### Step 3 — Summary

```
totalTax =
  −corporationTax    ← flip sign: negative CT (payable) becomes positive cost
                       positive CT (refund) becomes NEGATIVE in summary
  + incomeTax
  + employeeNI
  + employerNIDirectorNet + employerNI5k + employerPension5k
  + dividendTax

effectiveTaxRate = totalTax / revenue   (if revenue > 0)
takeHomeAsPercentOfRevenue = netTakeHome / revenue
```

---

## Validation warnings (show inline, non-blocking)

1. **Dividends exceed post-tax profit** — warn if `dividends > postTaxProfit`
2. **Personal Allowance tapered** — warn if `totalPersonalIncome > 100,000`, show effective amount
3. **Allowance fully lost** — warn if `totalPersonalIncome >= 125,140`, note 60% effective marginal rate between £100k–£125,140
4. **Loss scenario** — if `taxableCompanyProfit < 0`, note "CT refund assumes historic profits available — verify with your accountant"
5. **EA eligibility** — if eaToggle = NO, show a tip: "Employing one person on £5,001 could unlock £10,500 Employment Allowance"

---

## Results display

Show two panels side by side on desktop, stacked on mobile:

### Left panel — Detailed breakdown

Show each line item in three sections exactly matching the Excel structure:

**Company Tax Calculation**
- Revenue
- Less: Other Business Costs
- Less: £5,001 Employee Salary (if applicable)
- Less: Director Pension Sacrifice (if applicable)
- Less: Director Salary
- Less: Employer Pension on Employee (if applicable)
- Less: Employer NI on Employee (if applicable)
- Employer NI on Director (gross)
- Add: Employment Allowance (if applicable)
- Less: Employer NI on Director (net)
- = **Taxable Company Profit** (highlighted)
- Less: Corporation Tax (show as negative if refund)
- = **Post-Tax Profit Available for Dividends** (highlighted)

**Personal Tax Calculation**
- Director Salary (pensionable)
- Dividends Drawn
- Total Personal Income
- Adjusted Personal Allowance
- Income Tax on Salary
- Employee NI
- Dividend Tax
- Director Pension (company contribution) — only if pension=YES
- = **Net Personal Take-Home** (highlighted)

### Right panel — Summary & scenario comparison

**Tax Summary block** (show each component, subtotal = Total Tax):
- Corporation Tax (negative if refund)
- Income Tax
- Employee NI
- Employer NI + Pension costs
- Dividend Tax
- **TOTAL TAX** (prominent)
- Effective Tax Rate %
- Take-Home as % of Revenue

**Scenario comparison table** — automatically recalculate the same revenue/costs/dividends for 5 salary levels:

| Scenario | £0 | £5,000 | £9,100 | £12,570 | Custom (your input) |
|---|---|---|---|---|---|
| Director Salary | | | | | |
| Taxable Profit | | | | | |
| Corp Tax | | | | | |
| Post-Tax Profit | | | | | |
| Personal Allowance | | | | | |
| Income Tax | | | | | |
| Employee NI | | | | | |
| Dividend Tax | | | | | |
| Net Take-Home | | | | | |
| **Total Tax** | | | | | |
| **Eff. Rate** | | | | | |

Highlight the column with the lowest Total Tax in green. All scenario columns use the same EA toggle, pension toggle, revenue, costs and dividends as the main inputs — only the salary varies.

---

## UI design requirements

- **Clean, professional** — suitable for showing clients. Navy/blue header, white card panels, subtle grey section dividers
- **Currency formatting** throughout — all £ values formatted as `£X,XXX` with commas, negative values shown in red with parentheses e.g. `(£1,234)`
- **Percentage formatting** — one decimal place e.g. `37.7%`
- **Instant recalculation** — all results update as the user types, no loading states needed
- **Mobile responsive** — inputs stack above results on small screens
- **Colour coding**:
  - Positive tax values (costs) — standard black
  - Negative CT (refund) — green text
  - Warning messages — amber banner
  - Total/subtotal rows — slightly shaded background
  - Lowest-tax scenario column — green highlight
- **Tooltips or info icons** on complex items: personal allowance taper, marginal relief, salary sacrifice, dividend allowance, CT loss carry-back

---

## Collapsible "Rates & Assumptions" section

At the bottom, show all the hardcoded rates in a read-only table with labels, values and a brief note. Include:
- Source: `gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027`
- A note that dividend rates increased by 2ppts from 6 April 2026 (Budget 2025)
- A note that the employer pension match and director sacrifice rates are assumptions — a real-world figure would depend on the pension scheme

---

## Key notes for implementation

1. **Salary sacrifice reduces the NI base** — the employer NI on the director is calculated on `(directorSalary − pensionSacrifice)`, not gross salary. Make sure this flows through correctly.

2. **The £500 dividend allowance reduces tax but NOT the personal allowance taper** — dividends count in full towards the `totalPersonalIncome` figure used for the taper calculation, even though the first £500 is tax-free.

3. **CT loss carry-back** — when `taxableCompanyProfit < 0`, apply the small profits rate (19%) to the loss to produce a refund. The result is a positive number (refund to company). In the summary, this appears as a **negative** total tax contribution (it reduces the total tax bill). Always show a warning that this assumes historic profits are available.

4. **Employment Allowance** — only available if `eaToggle = YES`. A sole director with no other employees is **not** eligible. The toggle in the app represents the scenario where one additional employee is on payroll at £5,001.

5. **Scenario comparison** — each scenario column must run the full `calculate()` function with the scenario salary substituted in, but all other inputs (revenue, costs, dividends, toggles) remain as the user has set them.

6. **No form submission** — everything recalculates on every input change using React state/`useMemo`.

---

## File structure suggestion

```
src/
  App.jsx              — main layout
  components/
    InputPanel.jsx     — all user inputs
    CompanySection.jsx — company tax breakdown
    PersonalSection.jsx — personal tax breakdown
    SummaryPanel.jsx   — total tax summary + scenario table
    RatesSection.jsx   — collapsible rates display
    Warnings.jsx       — validation warning banners
  utils/
    calculate.js       — pure calculate(inputs) function
    format.js          — currency and percentage formatters
  constants/
    rates.js           — RATES object
```

---

## Scotland note

Add a small disclaimer below the inputs: *"This calculator applies England, Wales and Northern Ireland income tax rates. Scottish taxpayers have different non-savings income bands."*
