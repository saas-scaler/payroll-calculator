import { RATES } from '../constants/rates';

/**
 * Calculate personal tax for a single director.
 * @param {Object} director - { name, salary, dividends }
 * @param {Object} opts - { pensionMethod, pensionRate, directorPensionFixed }
 * @param {Object} R - RATES constants
 * @returns {Object} Per-director tax results
 */
function calculateDirectorPersonalTax(director, opts, R) {
  const { salary: directorSalary, dividends } = director;
  const { pensionMethod, pensionRate, directorPensionFixed } = opts;

  const isSalarySacrifice = pensionMethod === 'salary_sacrifice';
  const isReliefAtSource = pensionMethod === 'relief_at_source';

  const directorPensionSacrificeAmount = isSalarySacrifice
    ? Math.round(directorSalary * pensionRate * 100) / 100
    : 0;

  const directorPensionRASGross = isReliefAtSource
    ? Math.round(directorSalary * pensionRate * 100) / 100
    : 0;
  const directorPensionRASNetCost = Math.round(directorPensionRASGross * 0.8 * 100) / 100;

  const pensionableSalary = directorSalary - directorPensionSacrificeAmount;
  const taxableSalary = pensionableSalary;

  // Employer NI on this director (gross, before EA)
  const employerNIDirectorGross = Math.max(
    0,
    (pensionableSalary - R.secondaryThreshold) * R.employerNIRate
  );

  // Total employer pension contribution (fixed + salary sacrifice)
  const employerPensionContribution = directorPensionFixed + directorPensionSacrificeAmount;

  // ── Personal Tax ──
  const totalPersonalIncome = taxableSalary + dividends;

  // Personal Allowance taper
  const adjustedPA = Math.max(
    0,
    R.personalAllowance - Math.max(0, (totalPersonalIncome - R.paTaperThreshold) / 2)
  );

  // Relief at source extends the basic rate band
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
  const effectiveAdditionalRateThreshold = R.additionalRateThreshold + directorPensionRASGross;
  const unusedPA = Math.max(0, adjustedPA - taxableSalary);

  const basicBandForDividends = Math.max(0, effectiveBasicRateBandWidth - salaryAbovePA);
  const salaryInHigherBand = Math.max(0, salaryAbovePA - effectiveBasicRateBandWidth);
  const higherBandTotal = Math.max(0, effectiveAdditionalRateThreshold - adjustedPA - effectiveBasicRateBandWidth);
  const higherBandForDividends = Math.max(0, higherBandTotal - salaryInHigherBand);

  const divsInPA = Math.min(dividends, unusedPA);
  const divsInBasicBand = Math.min(Math.max(0, dividends - unusedPA), basicBandForDividends);
  const divsInHigherBand = Math.min(Math.max(0, dividends - unusedPA - basicBandForDividends), higherBandForDividends);
  const divsInAdditBand = Math.max(0, dividends - unusedPA - basicBandForDividends - higherBandForDividends);

  let allowanceLeft = R.dividendAllowance;
  const basicNilRate = Math.min(divsInBasicBand, allowanceLeft);
  allowanceLeft -= basicNilRate;
  const higherNilRate = Math.min(divsInHigherBand, allowanceLeft);
  allowanceLeft -= higherNilRate;
  const additNilRate = Math.min(divsInAdditBand, allowanceLeft);

  const dividendBasicTaxed = divsInBasicBand - basicNilRate;
  const dividendHigherTaxed = divsInHigherBand - higherNilRate;
  const dividendAdditTaxed = divsInAdditBand - additNilRate;
  const taxableDividends = dividendBasicTaxed + dividendHigherTaxed + dividendAdditTaxed;

  const dividendTax =
    dividendBasicTaxed * R.dividendBasicRate
    + dividendHigherTaxed * R.dividendHigherRate
    + dividendAdditTaxed * R.dividendAdditionalRate;

  // Net take-home = cash salary (after sacrifice) + dividends − personal taxes
  const netTakeHome = (directorSalary - directorPensionSacrificeAmount) + dividends - incomeTax - employeeNI - dividendTax;

  // Pension contribution (not cash — goes to pension pot)
  const pensionPotContribution = directorPensionFixed + directorPensionSacrificeAmount + directorPensionRASGross;
  const totalWealthCreated = netTakeHome + pensionPotContribution;

  return {
    name: director.name,
    directorSalary,
    dividends,
    directorPensionSacrificeAmount,
    directorPensionFixed,
    directorPensionRASGross,
    directorPensionRASNetCost,
    employerPensionContribution,
    pensionableSalary,
    taxableSalary,
    totalPersonalIncome,
    adjustedPA,
    salaryAbovePA,
    incomeTax,
    employeeNI,
    employerNIDirectorGross,
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
  };
}

/**
 * Main calculation function for UK director payroll & tax.
 * Supports 1-4 directors with individual salary/dividends.
 * @param {Object} inputs
 * @returns {Object} Full calculation results
 */
export function calculate(inputs) {
  const { revenue, otherCosts, directors = [{ salary: 0, dividends: 0 }], eaToggle, employeeSalary = 0, pensionMethod = 'none', directorPensionRate = 5, directorPensionFixed = 0 } = inputs;
  const R = RATES;
  const pensionRate = directorPensionRate / 100;

  // ── Per-director calculations ──
  const directorResults = directors.map((d) =>
    calculateDirectorPersonalTax(d, { pensionMethod, pensionRate, directorPensionFixed }, R)
  );

  // ── Aggregate company-level figures ──
  const totalDirectorSalary = directorResults.reduce((s, d) => s + d.directorSalary, 0);
  const totalDividends = directorResults.reduce((s, d) => s + d.dividends, 0);
  const totalPensionSacrifice = directorResults.reduce((s, d) => s + d.directorPensionSacrificeAmount, 0);
  const totalPensionFixed = directorResults.reduce((s, d) => s + d.directorPensionFixed, 0);
  const totalEmployerNIDirectorGross = directorResults.reduce((s, d) => s + d.employerNIDirectorGross, 0);

  // Employee costs
  const employee5kSalary = eaToggle ? employeeSalary : 0;
  const employerPension5k = eaToggle
    ? Math.round(employeeSalary * R.employerPensionMatch * 100) / 100
    : 0;
  const employerNI5kGross = eaToggle
    ? Math.max(0, (employeeSalary - R.secondaryThreshold) * R.employerNIRate)
    : 0;

  // Employment Allowance eligibility
  // EA available if: employee toggle on and employee > £5k threshold
  // OR: 2+ directors have salary > £5,000
  const directorsAboveThreshold = directors.filter((d) => d.salary > R.secondaryThreshold).length;
  const eaEligibleViaEmployee = eaToggle && employeeSalary > R.secondaryThreshold;
  const eaEligibleViaDirectors = directorsAboveThreshold >= 2;
  const eaEligible = eaEligibleViaEmployee || eaEligibleViaDirectors;

  const totalEmployerNIGross = totalEmployerNIDirectorGross + employerNI5kGross;

  const employmentAllowanceUsed = eaEligible
    ? Math.min(R.employmentAllowance, totalEmployerNIGross)
    : 0;

  // Apply EA to employee NI first, remainder offsets director NI
  const eaAppliedToEmployee = Math.min(employmentAllowanceUsed, employerNI5kGross);
  const eaAppliedToDirector = employmentAllowanceUsed - eaAppliedToEmployee;

  const employerNI5kNet = employerNI5kGross - eaAppliedToEmployee;
  const totalEmployerNIDirectorNet = Math.max(0, totalEmployerNIDirectorGross - eaAppliedToDirector);

  // Taxable company profit
  const taxableCompanyProfit =
    revenue
    - otherCosts
    - employee5kSalary
    - totalPensionFixed
    - totalDirectorSalary
    - employerPension5k
    - employerNI5kNet
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
          * R.ctMarginalReliefFraction;
    }
  } else {
    corporationTax = taxableCompanyProfit * R.ctSmallProfitsRate;
  }

  const postTaxProfit = taxableCompanyProfit - corporationTax;

  // ── Aggregated personal totals ──
  const totalIncomeTax = directorResults.reduce((s, d) => s + d.incomeTax, 0);
  const totalEmployeeNI = directorResults.reduce((s, d) => s + d.employeeNI, 0);
  const totalDividendTax = directorResults.reduce((s, d) => s + d.dividendTax, 0);
  const totalNetTakeHome = directorResults.reduce((s, d) => s + d.netTakeHome, 0);
  const totalPensionPotContribution = directorResults.reduce((s, d) => s + d.pensionPotContribution, 0);
  const totalWealthCreated = directorResults.reduce((s, d) => s + d.totalWealthCreated, 0);

  // ── Summary ──
  const totalTax =
    corporationTax
    + totalIncomeTax
    + totalEmployeeNI
    + totalEmployerNIDirectorNet
    + employerNI5kNet
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

  directorResults.forEach((d) => {
    if (d.totalPersonalIncome > 100000 && d.totalPersonalIncome < 125140) {
      warnings.push({
        type: 'warning',
        message: `${d.name}: Personal Allowance tapered to £${Math.round(d.adjustedPA).toLocaleString()} (income exceeds £100,000). Effective marginal rate is 60% between £100k–£125,140.`,
      });
    }
    if (d.totalPersonalIncome >= 125140) {
      warnings.push({
        type: 'warning',
        message: `${d.name}: Personal Allowance fully lost (income ≥ £125,140). Note: 60% effective marginal rate applies between £100k–£125,140.`,
      });
    }
  });

  if (taxableCompanyProfit < 0) {
    warnings.push({
      type: 'info',
      message: 'Company is in a loss position. CT refund assumes historic profits are available for carry-back — verify with your accountant.',
    });
  }

  if (!eaEligible && !eaToggle && directors.length === 1) {
    warnings.push({
      type: 'tip',
      message: 'Employing one person above £5,000 could unlock £10,500 Employment Allowance, potentially reducing your total tax bill.',
    });
  }

  if (eaToggle && !eaEligibleViaEmployee && !eaEligibleViaDirectors) {
    warnings.push({
      type: 'warning',
      message: 'Employment Allowance requires the employee to be paid above the £5,000 secondary threshold. Increase employee salary above £5,000 to unlock EA.',
    });
  }

  if (eaEligibleViaDirectors && !eaEligibleViaEmployee) {
    warnings.push({
      type: 'info',
      message: `Employment Allowance unlocked: ${directorsAboveThreshold} directors have salary above £5,000.`,
    });
  }

  return {
    // Per-director results
    directorResults,

    // Company
    totalDirectorSalary,
    totalDividends,
    totalPensionSacrifice,
    totalPensionFixed,
    totalEmployerNIDirectorGross,
    employee5kSalary,
    employerPension5k,
    employerNI5kGross,
    employerNI5kNet,
    employmentAllowanceUsed,
    totalEmployerNIDirectorNet,
    eaEligible,
    eaEligibleViaDirectors,
    taxableCompanyProfit,
    corporationTax,
    postTaxProfit,

    // Aggregated personal
    totalIncomeTax,
    totalEmployeeNI,
    totalDividendTax,
    totalNetTakeHome,
    totalPensionPotContribution,
    totalWealthCreated,

    // Summary
    totalTax,
    effectiveTaxRate,
    takeHomeAsPercentOfRevenue,

    // Warnings
    warnings,
  };
}
