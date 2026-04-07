import { RATES } from '../constants/rates';

/**
 * Calculate personal tax for a single director.
 */
function calculatePersonalTax(directorSalary, dividends, pensionToggle, R) {
  const directorPensionSacrificeAmount = pensionToggle
    ? Math.round(directorSalary * R.directorPensionSacrifice * 100) / 100
    : 0;

  const taxableSalary = directorSalary - directorPensionSacrificeAmount;
  const totalPersonalIncome = taxableSalary + dividends;

  // Personal Allowance taper
  const adjustedPA = Math.max(
    0,
    R.personalAllowance - Math.max(0, (totalPersonalIncome - R.paTaperThreshold) / 2)
  );

  // Income Tax on salary
  const salaryAbovePA = Math.max(0, taxableSalary - adjustedPA);
  const incomeTax =
    Math.min(salaryAbovePA, R.basicRateBandWidth) * R.basicRate
    + Math.max(0, Math.min(
      salaryAbovePA - R.basicRateBandWidth,
      R.higherRateBandUpperAbovePA - R.basicRateBandWidth
    )) * R.higherRate
    + Math.max(0, salaryAbovePA - R.higherRateBandUpperAbovePA) * R.additionalRate;

  // Employee NI
  const employeeNI =
    Math.max(0, Math.min(taxableSalary, R.upperEarningsLimit) - R.employeeNIPrimaryThreshold) * R.employeeNIMainRate
    + Math.max(0, taxableSalary - R.upperEarningsLimit) * R.employeeNIUpperRate;

  // Dividend Tax
  const basicRateBandRemaining = Math.max(0, adjustedPA + R.basicRateBandWidth - taxableSalary);
  const higherRateBandRemaining = Math.max(
    0,
    R.additionalRateThreshold - taxableSalary - basicRateBandRemaining
  );

  const taxableDividends = Math.max(0, dividends - R.dividendAllowance);
  const dividendBasicTaxed = Math.min(taxableDividends, basicRateBandRemaining);
  const dividendHigherTaxed = Math.max(
    0,
    Math.min(taxableDividends - basicRateBandRemaining, higherRateBandRemaining)
  );
  const dividendAdditTaxed = Math.max(
    0,
    taxableDividends - basicRateBandRemaining - higherRateBandRemaining
  );

  const dividendTax =
    dividendBasicTaxed * R.dividendBasicRate
    + dividendHigherTaxed * R.dividendHigherRate
    + dividendAdditTaxed * R.dividendAdditionalRate;

  const netTakeHome = directorSalary + dividends - incomeTax - employeeNI - dividendTax;

  return {
    directorPensionSacrificeAmount,
    taxableSalary,
    totalPersonalIncome,
    adjustedPA,
    salaryAbovePA,
    incomeTax,
    employeeNI,
    basicRateBandRemaining,
    higherRateBandRemaining,
    taxableDividends,
    dividendBasicTaxed,
    dividendHigherTaxed,
    dividendAdditTaxed,
    dividendTax,
    netTakeHome,
  };
}

/**
 * Calculate employer NI for a single director (before EA offset).
 */
function calculateDirectorEmployerNI(directorSalary, pensionToggle, R) {
  const directorPensionSacrificeAmount = pensionToggle
    ? Math.round(directorSalary * R.directorPensionSacrifice * 100) / 100
    : 0;
  const pensionableSalary = directorSalary - directorPensionSacrificeAmount;
  const employerNIGross = Math.max(0, (pensionableSalary - R.secondaryThreshold) * R.employerNIRate);
  return { employerNIGross, directorPensionSacrificeAmount, pensionableSalary };
}

/**
 * Pure calculation function for UK director payroll & tax.
 * Supports multiple directors with individual salary/dividends.
 *
 * @param {Object} inputs
 * @param {number} inputs.revenue
 * @param {number} inputs.otherCosts
 * @param {Array} inputs.directors - Array of { name, salary, dividends }
 * @param {boolean} inputs.eaToggle - Include £5,001 Employee
 * @param {boolean} inputs.pensionToggle - Director Pension Sacrifice
 * @returns {Object} Full calculation results
 */
export function calculate(inputs) {
  const { revenue, otherCosts, directors, eaToggle, pensionToggle } = inputs;
  const R = RATES;

  // ── Step 1: Company Section ──

  // EA eligibility: available if 2+ directors earning above secondary threshold OR £5,001 employee toggle is on
  const directorsAboveThreshold = directors.filter(d => d.salary > R.secondaryThreshold).length;
  const eaEligible = directorsAboveThreshold >= 2 || eaToggle;
  const eaViaMultipleDirectors = directorsAboveThreshold >= 2;

  // £5,001 employee costs (only when toggle is on, regardless of director count)
  const employee5kSalary = eaToggle ? 5001 : 0;
  const employerPension5k = eaToggle
    ? Math.round(5001 * R.employerPensionMatch * 100) / 100
    : 0;
  const employerNI5k = eaToggle
    ? Math.max(0, (5001 - R.secondaryThreshold) * R.employerNIRate)
    : 0;

  // Per-director employer NI (gross, before EA)
  const directorCompanyCalcs = directors.map((d) =>
    calculateDirectorEmployerNI(d.salary, pensionToggle, R)
  );

  const totalDirectorSalaries = directors.reduce((sum, d) => sum + d.salary, 0);
  const totalDirectorPensionSacrifice = directorCompanyCalcs.reduce(
    (sum, c) => sum + c.directorPensionSacrificeAmount, 0
  );
  const totalEmployerNIDirectorGross = directorCompanyCalcs.reduce(
    (sum, c) => sum + c.employerNIGross, 0
  );

  // Employment Allowance offsets total employer NI (eligible via 2+ directors or £5k employee)
  const employmentAllowanceUsed = eaEligible
    ? Math.min(R.employmentAllowance, totalEmployerNIDirectorGross)
    : 0;

  const totalEmployerNIDirectorNet = Math.max(0, totalEmployerNIDirectorGross - employmentAllowanceUsed);

  const taxableCompanyProfit =
    revenue
    - otherCosts
    - employee5kSalary
    - totalDirectorPensionSacrifice
    - totalDirectorSalaries
    - employerPension5k
    - employerNI5k
    - totalEmployerNIDirectorNet;

  // Corporation Tax
  let corporationTax;
  if (taxableCompanyProfit >= 0) {
    if (taxableCompanyProfit <= R.ctSmallProfitsLimit) {
      corporationTax = taxableCompanyProfit * R.ctSmallProfitsRate;
    } else if (taxableCompanyProfit >= R.ctMainRateLimit) {
      corporationTax = taxableCompanyProfit * R.ctMainRate;
    } else {
      corporationTax =
        taxableCompanyProfit * R.ctMainRate
        - (R.ctMainRateLimit - taxableCompanyProfit)
          * (taxableCompanyProfit / R.ctMarginalReliefDenominator)
          * (R.ctMainRate - R.ctSmallProfitsRate);
    }
  } else {
    corporationTax = taxableCompanyProfit * R.ctSmallProfitsRate;
  }

  const postTaxProfit = taxableCompanyProfit - corporationTax;

  // ── Step 2: Personal Tax (per director) ──

  const directorResults = directors.map((d) =>
    calculatePersonalTax(d.salary, d.dividends, pensionToggle, R)
  );

  // Totals across all directors
  const totalIncomeTax = directorResults.reduce((s, d) => s + d.incomeTax, 0);
  const totalEmployeeNI = directorResults.reduce((s, d) => s + d.employeeNI, 0);
  const totalDividendTax = directorResults.reduce((s, d) => s + d.dividendTax, 0);
  const totalNetTakeHome = directorResults.reduce((s, d) => s + d.netTakeHome, 0);
  const totalDividends = directors.reduce((s, d) => s + d.dividends, 0);

  // ── Step 3: Summary ──

  const totalTax =
    corporationTax
    + totalIncomeTax
    + totalEmployeeNI
    + totalEmployerNIDirectorNet
    + employerNI5k
    + employerPension5k
    + totalDividendTax;

  const effectiveTaxRate = revenue > 0 ? totalTax / revenue : 0;
  const takeHomeAsPercentOfRevenue = revenue > 0 ? totalNetTakeHome / revenue : 0;

  // ── Warnings ──
  const warnings = [];

  if (totalDividends > postTaxProfit) {
    warnings.push({
      type: 'warning',
      message: `Total dividends drawn (£${Math.round(totalDividends).toLocaleString()}) exceed post-tax profit available (£${Math.round(postTaxProfit).toLocaleString()}). You may need retained profits from previous years.`,
    });
  }

  // Per-director PA warnings
  directorResults.forEach((dr, i) => {
    const name = directors[i].name || `Director ${i + 1}`;
    if (dr.totalPersonalIncome > 100000 && dr.totalPersonalIncome < 125140) {
      warnings.push({
        type: 'warning',
        message: `${name}: Personal Allowance tapered to £${Math.round(dr.adjustedPA).toLocaleString()} (income exceeds £100,000). 60% effective marginal rate applies between £100k–£125,140.`,
      });
    }
    if (dr.totalPersonalIncome >= 125140) {
      warnings.push({
        type: 'warning',
        message: `${name}: Personal Allowance fully lost (income ≥ £125,140). 60% effective marginal rate applies between £100k–£125,140.`,
      });
    }
  });

  if (taxableCompanyProfit < 0) {
    warnings.push({
      type: 'info',
      message: 'Company is in a loss position. CT refund assumes historic profits are available for carry-back — verify with your accountant.',
    });
  }

  if (!eaEligible) {
    warnings.push({
      type: 'tip',
      message: 'Employing one person on £5,001 could unlock £10,500 Employment Allowance, potentially reducing your total tax bill.',
    });
  }

  if (eaViaMultipleDirectors && !eaToggle) {
    warnings.push({
      type: 'info',
      message: 'Employment Allowance is automatically available because you have 2+ directors on payroll. You can still add a £5,001 employee if needed.',
    });
  }

  return {
    // Company
    eaEligible,
    eaViaMultipleDirectors,
    totalDirectorSalaries,
    totalDirectorPensionSacrifice,
    directorCompanyCalcs,
    employee5kSalary,
    employerPension5k,
    employerNI5k,
    totalEmployerNIDirectorGross,
    employmentAllowanceUsed,
    totalEmployerNIDirectorNet,
    taxableCompanyProfit,
    corporationTax,
    postTaxProfit,

    // Personal (per-director array)
    directorResults,

    // Aggregated personal totals
    totalIncomeTax,
    totalEmployeeNI,
    totalDividendTax,
    totalDividends,
    totalNetTakeHome,

    // Summary
    totalTax,
    effectiveTaxRate,
    takeHomeAsPercentOfRevenue,

    // Warnings
    warnings,
  };
}
