import { RATES } from '../constants/rates';

/**
 * Pure calculation function for UK director payroll & tax.
 * @param {Object} inputs
 * @param {number} inputs.revenue
 * @param {number} inputs.otherCosts
 * @param {number} inputs.directorSalary
 * @param {number} inputs.dividends
 * @param {boolean} inputs.eaToggle - Include Employee
 * @param {number} inputs.employeeSalary - Employee salary amount
 * @param {string} inputs.pensionMethod - 'none' | 'salary_sacrifice' | 'relief_at_source'
 * @param {number} inputs.directorPensionRate - Pension rate as percentage (e.g. 5 for 5%)
 * @param {number} inputs.directorPensionFixed - Fixed employer pension contribution
 * @returns {Object} Full calculation results
 */
export function calculate(inputs) {
  const { revenue, otherCosts, directorSalary, dividends, eaToggle, employeeSalary = 5001, pensionMethod = 'none', directorPensionRate = 5, directorPensionFixed = 0 } = inputs;
  const R = RATES;
  const pensionRate = directorPensionRate / 100;

  // ── Step 1: Company Section ──

  const isSalarySacrifice = pensionMethod === 'salary_sacrifice';
  const isReliefAtSource = pensionMethod === 'relief_at_source';

  const directorPensionSacrificeAmount = isSalarySacrifice
    ? Math.round(directorSalary * pensionRate * 100) / 100
    : 0;

  // Relief at source: director pays from net pay, not a company cost
  const directorPensionRASGross = isReliefAtSource
    ? Math.round(directorSalary * pensionRate * 100) / 100
    : 0;
  const directorPensionRASNetCost = Math.round(directorPensionRASGross * 0.8 * 100) / 100;

  // Total employer pension contribution (fixed + salary sacrifice)
  const employerPensionContribution = directorPensionFixed + directorPensionSacrificeAmount;

  const pensionableSalary = directorSalary - directorPensionSacrificeAmount;

  const employee5kSalary = eaToggle ? employeeSalary : 0;
  const employerPension5k = eaToggle
    ? Math.round(employeeSalary * R.employerPensionMatch * 100) / 100
    : 0;
  const employerNI5kGross = eaToggle
    ? Math.max(0, (employeeSalary - R.secondaryThreshold) * R.employerNIRate)
    : 0;

  const employerNIDirectorGross = Math.max(
    0,
    (pensionableSalary - R.secondaryThreshold) * R.employerNIRate
  );

  // Employment Allowance offsets combined employer NI (director + employee)
  const totalEmployerNIGross = employerNIDirectorGross + employerNI5kGross;

  const employmentAllowanceUsed = eaToggle
    ? Math.min(R.employmentAllowance, totalEmployerNIGross)
    : 0;

  // Apply EA to employee NI first, remainder offsets director NI
  const eaAppliedToEmployee = Math.min(employmentAllowanceUsed, employerNI5kGross);
  const eaAppliedToDirector = employmentAllowanceUsed - eaAppliedToEmployee;

  const employerNI5kNet = employerNI5kGross - eaAppliedToEmployee;
  const employerNIDirectorNet = Math.max(0, employerNIDirectorGross - eaAppliedToDirector);

  const taxableCompanyProfit =
    revenue
    - otherCosts
    - employee5kSalary
    - directorPensionSacrificeAmount
    - directorPensionFixed
    - directorSalary
    - employerPension5k
    - employerNI5kNet
    - employerNIDirectorNet;

  // Corporation Tax
  let corporationTax;
  if (taxableCompanyProfit >= 0) {
    if (taxableCompanyProfit <= R.ctSmallProfitsLimit) {
      corporationTax = taxableCompanyProfit * R.ctSmallProfitsRate;
    } else if (taxableCompanyProfit >= R.ctMainRateLimit) {
      corporationTax = taxableCompanyProfit * R.ctMainRate;
    } else {
      // Marginal relief
      corporationTax =
        taxableCompanyProfit * R.ctMainRate
        - (R.ctMainRateLimit - taxableCompanyProfit)
          * (taxableCompanyProfit / R.ctMarginalReliefDenominator)
          * (R.ctMainRate - R.ctSmallProfitsRate);
    }
  } else {
    // Loss carry-back refund
    corporationTax = taxableCompanyProfit * R.ctSmallProfitsRate;
  }

  const postTaxProfit = taxableCompanyProfit - corporationTax;

  // ── Step 2: Personal Tax ──

  const taxableSalary = directorSalary - directorPensionSacrificeAmount;
  const totalPersonalIncome = taxableSalary + dividends;

  // Personal Allowance taper
  const adjustedPA = Math.max(
    0,
    R.personalAllowance - Math.max(0, (totalPersonalIncome - R.paTaperThreshold) / 2)
  );

  // Relief at source extends the basic rate band by the gross pension contribution
  const effectiveBasicRateBandWidth = R.basicRateBandWidth + directorPensionRASGross;
  const effectiveHigherRateBandUpper = R.higherRateBandUpperAbovePA + directorPensionRASGross;

  // Income Tax on salary
  const salaryAbovePA = Math.max(0, taxableSalary - adjustedPA);
  const incomeTax =
    Math.min(salaryAbovePA, effectiveBasicRateBandWidth) * R.basicRate
    + Math.max(0, Math.min(
      salaryAbovePA - effectiveBasicRateBandWidth,
      effectiveHigherRateBandUpper - effectiveBasicRateBandWidth
    )) * R.higherRate
    + Math.max(0, salaryAbovePA - effectiveHigherRateBandUpper) * R.additionalRate;

  // Employee NI
  const employeeNI =
    Math.max(0, Math.min(taxableSalary, R.upperEarningsLimit) - R.employeeNIPrimaryThreshold) * R.employeeNIMainRate
    + Math.max(0, taxableSalary - R.upperEarningsLimit) * R.employeeNIUpperRate;

  // Dividend Tax — bands extended by RAS gross contribution
  const effectiveAdditionalRateThreshold = R.additionalRateThreshold + directorPensionRASGross;
  const basicRateBandRemaining = Math.max(0, adjustedPA + effectiveBasicRateBandWidth - taxableSalary);
  const higherRateBandRemaining = Math.max(
    0,
    effectiveAdditionalRateThreshold - taxableSalary - basicRateBandRemaining
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

  const netTakeHome = directorSalary + dividends - incomeTax - employeeNI - dividendTax - directorPensionRASNetCost;

  // ── Step 3: Summary ──

  // corporationTax is positive when payable, negative when refund
  const totalTax =
    corporationTax
    + incomeTax
    + employeeNI
    + employerNIDirectorNet
    + employerNI5kNet
    + employerPension5k
    + dividendTax;

  const effectiveTaxRate = revenue > 0 ? totalTax / revenue : 0;
  const takeHomeAsPercentOfRevenue = revenue > 0 ? netTakeHome / revenue : 0;

  // ── Warnings ──
  const warnings = [];

  if (dividends > postTaxProfit) {
    warnings.push({
      type: 'warning',
      message: `Dividends drawn (£${Math.round(dividends).toLocaleString()}) exceed post-tax profit available (£${Math.round(postTaxProfit).toLocaleString()}). You may need retained profits from previous years.`,
    });
  }

  if (totalPersonalIncome > 100000 && totalPersonalIncome < 125140) {
    warnings.push({
      type: 'warning',
      message: `Personal Allowance tapered to £${Math.round(adjustedPA).toLocaleString()} (income exceeds £100,000). Effective marginal rate is 60% between £100k–£125,140.`,
    });
  }

  if (totalPersonalIncome >= 125140) {
    warnings.push({
      type: 'warning',
      message: 'Personal Allowance fully lost (income ≥ £125,140). Note: 60% effective marginal rate applies between £100k–£125,140.',
    });
  }

  if (taxableCompanyProfit < 0) {
    warnings.push({
      type: 'info',
      message: 'Company is in a loss position. CT refund assumes historic profits are available for carry-back — verify with your accountant.',
    });
  }

  if (!eaToggle) {
    warnings.push({
      type: 'tip',
      message: 'Employing one person on £5,001 could unlock £10,500 Employment Allowance, potentially reducing your total tax bill.',
    });
  }

  return {
    // Company
    directorPensionSacrificeAmount,
    directorPensionFixed,
    directorPensionRASGross,
    directorPensionRASNetCost,
    employerPensionContribution,
    pensionableSalary,
    employee5kSalary,
    employerPension5k,
    employerNI5kGross,
    employerNI5kNet,
    employerNIDirectorGross,
    employmentAllowanceUsed,
    employerNIDirectorNet,
    taxableCompanyProfit,
    corporationTax,
    postTaxProfit,

    // Personal
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

    // Summary
    totalTax,
    effectiveTaxRate,
    takeHomeAsPercentOfRevenue,

    // Warnings
    warnings,
  };
}
