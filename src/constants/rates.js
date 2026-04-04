export const RATES = {
  // Employer NI
  secondaryThreshold: 5000,
  employerNIRate: 0.15,
  employmentAllowance: 10500,

  // Pension
  employerPensionMatch: 0.03,      // 3% of £5,001 employee salary
  directorPensionSacrificeDefault: 0.05, // default 5% — now user-configurable

  // Corporation Tax
  ctSmallProfitsLimit: 50000,
  ctSmallProfitsRate: 0.19,
  ctMainRateLimit: 250000,
  ctMainRate: 0.25,
  ctMarginalReliefFraction: 3 / 200,  // HMRC standard fraction for marginal relief

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

export const RATES_DISPLAY = [
  { category: 'Employer NI', label: 'Secondary Threshold', value: '£5,000', note: 'Per employee per year' },
  { category: 'Employer NI', label: 'Employer NI Rate', value: '15%', note: 'On earnings above secondary threshold' },
  { category: 'Employer NI', label: 'Employment Allowance', value: '£10,500', note: 'Available if ≥1 employee on payroll' },
  { category: 'Pension', label: 'Employer Pension Match', value: '3%', note: 'Assumption — depends on pension scheme' },
  { category: 'Pension', label: 'Director Pension Rate', value: '5% (default)', note: 'User-configurable — depends on pension scheme' },
  { category: 'Corporation Tax', label: 'Small Profits Rate', value: '19%', note: 'Profits ≤ £50,000' },
  { category: 'Corporation Tax', label: 'Main Rate', value: '25%', note: 'Profits ≥ £250,000' },
  { category: 'Corporation Tax', label: 'Marginal Relief', value: '£50,001–£249,999', note: 'Effective rate between 19%–25%' },
  { category: 'Income Tax', label: 'Personal Allowance', value: '£12,570', note: 'Tapers £1 for every £2 above £100k' },
  { category: 'Income Tax', label: 'Basic Rate', value: '20%', note: '£12,571 to £50,270' },
  { category: 'Income Tax', label: 'Higher Rate', value: '40%', note: '£50,271 to £125,140' },
  { category: 'Income Tax', label: 'Additional Rate', value: '45%', note: 'Above £125,140' },
  { category: 'Employee NI', label: 'Primary Threshold', value: '£12,570', note: 'NI starts above this amount' },
  { category: 'Employee NI', label: 'Main Rate', value: '8%', note: '£12,570 to £50,270' },
  { category: 'Employee NI', label: 'Upper Rate', value: '2%', note: 'Above £50,270' },
  { category: 'Dividend Tax', label: 'Dividend Allowance', value: '£500', note: 'Tax-free dividend income' },
  { category: 'Dividend Tax', label: 'Basic Rate', value: '10.75%', note: 'Increased from 8.75% April 2026' },
  { category: 'Dividend Tax', label: 'Higher Rate', value: '35.75%', note: 'Increased from 33.75% April 2026' },
  { category: 'Dividend Tax', label: 'Additional Rate', value: '39.35%', note: 'Increased from 39.35% — unchanged' },
];
