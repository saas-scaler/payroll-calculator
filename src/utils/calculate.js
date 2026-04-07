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

  // EA only available if employee is paid above the secondary threshold (£5,000)
  const eaEligible = eaToggle && employeeSalary > R.secondaryThreshold;

  const employmentAllowanceUsed = eaEligible
    ? Math.min(R.employmentAllowance, totalEmployerNIGross)
    : 0;

  // Apply EA to employee NI first, remainder offsets director NI
  const eaAppliedToEmployee = Math.min(employmentAllowanceUsed, employerNI5kGross);
  const eaAppliedToDirector = employmentAllowanceUsed - eaAppliedToEmployee;

  const employerNI5kNet = employerNI5kGross - eaAppliedToEmployee;
  const employerNIDirectorNet = Math.max(0, employerNIDirectorGross - eaAppliedToDirector);

  // Salary sacrifice is part of directorSalary (not an additional cost)
  // Only directorPensionFixed is an extra company cost
  const taxableCompanyProfit =
    revenue
    - otherCosts
    - employee5kSalary
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
      // Marginal relief — HMRC standard fraction 3/200
      corporationTax =
        taxableCompanyProfit * R.ctMainRate
        - (R.ctMainRateLimit - taxableCompanyProfit)
          * R.ctMarginalReliefFraction;
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

  // Dividend Tax — dividends stack on top of salary in income bands
  // The £500 dividend allowance is a nil-rate band applied within whichever
  // tax band the first £500 of dividends falls in. Dividends covered by the
  // allowance still occupy band space (they are NOT removed upfront).
  const effectiveAdditionalRateThreshold = R.additionalRateThreshold + directorPensionRASGross;

  // Unused personal allowance shelters dividends at 0%
  const unusedPA = Math.max(0, adjustedPA - taxableSalary);

  // Band widths available for dividends (after salary has used its share)
  const basicBandForDividends = Math.max(0, effectiveBasicRateBandWidth - salaryAbovePA);
  const salaryInHigherBand = Math.max(0, salaryAbovePA - effectiveBasicRateBandWidth);
  const higherBandTotal = Math.max(0, effectiveAdditionalRateThreshold - adjustedPA - effectiveBasicRateBandWidth);
  const higherBandForDividends = Math.max(0, higherBandTotal - salaryInHigherBand);

  // Allocate dividends into bands (full amount, not reduced by allowance)
  const divsInPA = Math.min(dividends, unusedPA);
  const divsInBasicBand = Math.min(Math.max(0, dividends - unusedPA), basicBandForDividends);
  const divsInHigherBand = Math.min(Math.max(0, dividends - unusedPA - basicBandForDividends), higherBandForDividends);
  const divsInAdditBand = Math.max(0, dividends - unusedPA - basicBandForDividends - higherBandForDividends);

  // Apply dividend allowance (nil-rate) to the first £500 of dividends
  // starting from the lowest taxable band upward
  let allowanceLeft = R.dividendAllowance;
  const basicNilRate = Math.min(divsInBasicBand, allowanceLeft);
  allowanceLeft -= basicNilRate;
  const higherNilRate = Math.min(divsInHigherBand, allowanceLeft);
  allowanceLeft -= higherNilRate;
  const additNilRate = Math.min(divsInAdditBand, allowanceLeft);

  const dividendBasicTaxed = divsInBasicBand - basicNilRate;
  const dividendHigherTaxed = divsInHigherBand - higherNilRate;
  const dividendAdditTaxed = divsInAdditBand - additNilRate;

  // For reporting: total taxable dividends (excluding allowance)
  const taxableDividends = dividendBasicTaxed + dividendHigherTaxed + dividendAdditTaxed;

  const dividendTax =
    dividendBasicTaxed * R.dividendBasicRate
    + dividendHigherTaxed * R.dividendHigherRate
    + dividendAdditTaxed * R.dividendAdditionalRate;

  // Net take-home = cash salary (after sacrifice) + dividends − personal taxes
  const netTakeHome = (directorSalary - directorPensionSacrificeAmount) + dividends - incomeTax - employeeNI - dividendTax;

  // Pension contribution (not cash — goes to pension pot)
  // Includes: fixed employer contribution + salary sacrifice + relief at source gross
  const pensionPotContribution = directorPensionFixed + directorPensionSacrificeAmount + directorPensionRASGross;

  // Total wealth = cash take-home + pension
  const totalWealthCreated = netTakeHome + pensionPotContribution;

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
      message: 'Employing one person above £5,000 could unlock £10,500 Employment Allowance, potentially reducing your total tax bill.',
    });
  }

  if (eaToggle && !eaEligible) {
    warnings.push({
      type: 'warning',
      message: 'Employment Allowance requires the employee to be paid above the £5,000 secondary threshold. Increase employee salary above £5,000 to unlock EA.',
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
    basicRateBandRemaining: basicBandForDividends,
    higherRateBandRemaining: higherBandForDividends,
    unusedPA,
    divsInPA,
    taxableDividends,
    dividendBasicTaxed,
    dividendHigherTaxed,
    dividendAdditTaxed,
    dividendTax,
    netTakeHome,
    pensionPotContribution,
    totalWealthCreated,

    // Summary
    totalTax,
    effectiveTaxRate,
    takeHomeAsPercentOfRevenue,

    // Warnings
    warnings,
  };
}
