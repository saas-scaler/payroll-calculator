import { useMemo } from 'react';
import { formatCurrency, formatPercent } from '../utils/format';
import { calculate } from '../utils/calculate';

function SummaryRow({ label, value, prominent, negative }) {
  const isNeg = typeof value === 'number' && value < -0.5;
  const isRefund = negative && isNeg;

  return (
    <div
      className={`flex justify-between items-baseline py-1.5 px-2 text-sm ${
        prominent ? 'bg-blue-50 font-bold text-base border-t-2 border-blue-600 mt-1' : ''
      }`}
    >
      <span className="text-slate-700">{label}</span>
      <span
        className={`font-mono text-right ${
          prominent ? 'text-blue-900' : isRefund ? 'text-green-600' : 'text-slate-900'
        }`}
      >
        {typeof value === 'string' ? value : formatCurrency(value)}
      </span>
    </div>
  );
}

export default function SummaryPanel({ inputs, results }) {
  const r = results;
  const employerCosts = r.totalEmployerNIDirectorNet + r.employerNI5k + r.employerPension5k;

  // Scenario comparison — vary salary equally for all directors
  const scenarioSalaries = useMemo(() => {
    // Use first director's salary as the "custom" reference
    const customSalary = inputs.directors[0]?.salary ?? 12570;
    const salaries = [0, 5000, 9100, 12570];
    if (!salaries.includes(customSalary)) {
      salaries.push(customSalary);
    }
    return salaries;
  }, [inputs.directors]);

  const scenarios = useMemo(() => {
    const customSalary = inputs.directors[0]?.salary ?? 12570;
    return scenarioSalaries.map((salary) => {
      // Apply this salary to ALL directors, keep each director's dividends
      const scenarioDirectors = inputs.directors.map((d) => ({
        ...d,
        salary,
      }));
      const scenarioInputs = { ...inputs, directors: scenarioDirectors };
      const res = calculate(scenarioInputs);
      return {
        salary,
        isCustom: salary === customSalary,
        ...res,
      };
    });
  }, [inputs, scenarioSalaries]);

  const minTax = Math.min(...scenarios.map((s) => s.totalTax));
  const multipleDirectors = inputs.directors.length > 1;

  const rows = [
    { label: `Director Salary${multipleDirectors ? ' (each)' : ''}`, fmt: (s) => formatCurrency(s.salary) },
    { label: 'Taxable Profit', key: 'taxableCompanyProfit' },
    { label: 'Corp Tax', key: 'corporationTax' },
    { label: 'Post-Tax Profit', key: 'postTaxProfit' },
    { label: 'Income Tax (total)', key: 'totalIncomeTax' },
    { label: 'Employee NI (total)', key: 'totalEmployeeNI' },
    { label: 'Dividend Tax (total)', key: 'totalDividendTax' },
    { label: 'Net Take-Home (total)', key: 'totalNetTakeHome', bold: true },
    { label: 'Total Tax', key: 'totalTax', bold: true },
    { label: 'Eff. Rate', fmt: (s) => formatPercent(s.effectiveTaxRate) },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
      {/* Tax Summary */}
      <h3 className="text-base font-semibold text-slate-800 mb-2 pb-1 border-b-2 border-blue-600">
        Tax Summary
      </h3>
      <div className="divide-y divide-slate-100 mb-6">
        <SummaryRow label="Corporation Tax" value={r.corporationTax} />
        <SummaryRow label="Income Tax (all directors)" value={r.totalIncomeTax} />
        <SummaryRow label="Employee NI (all directors)" value={r.totalEmployeeNI} />
        <SummaryRow label="Employer NI + Pension Costs" value={employerCosts} />
        <SummaryRow label="Dividend Tax (all directors)" value={r.totalDividendTax} />
        <SummaryRow label="TOTAL TAX" value={r.totalTax} prominent />
        <SummaryRow label="Effective Tax Rate" value={formatPercent(r.effectiveTaxRate)} />
        <SummaryRow label="Take-Home as % of Revenue" value={formatPercent(r.takeHomeAsPercentOfRevenue)} />
      </div>

      {/* Scenario Comparison */}
      <h3 className="text-base font-semibold text-slate-800 mb-2 pb-1 border-b-2 border-blue-600">
        Scenario Comparison
      </h3>
      {multipleDirectors && (
        <p className="text-xs text-slate-500 mb-2 italic">
          Each scenario applies the same salary to all {inputs.directors.length} directors. Dividends remain as set per director.
        </p>
      )}
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-1.5 text-slate-600 font-medium">Scenario</th>
              {scenarios.map((s, i) => {
                const customSalary = inputs.directors[0]?.salary ?? 12570;
                return (
                  <th
                    key={i}
                    className={`text-right py-2 px-1.5 font-medium ${
                      Math.abs(s.totalTax - minTax) < 1 ? 'bg-green-50 text-green-800' : 'text-slate-600'
                    } ${s.isCustom && ![0, 5000, 9100, 12570].includes(s.salary) ? 'border-x-2 border-blue-200' : ''}`}
                  >
                    {s.isCustom && ![0, 5000, 9100, 12570].includes(s.salary)
                      ? 'Custom'
                      : `£${s.salary.toLocaleString()}`}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className={`py-1.5 px-1.5 text-slate-700 ${row.bold ? 'font-semibold' : ''}`}>
                  {row.label}
                </td>
                {scenarios.map((s, i) => (
                  <td
                    key={i}
                    className={`py-1.5 px-1.5 text-right font-mono ${
                      row.bold ? 'font-semibold' : ''
                    } ${Math.abs(s.totalTax - minTax) < 1 ? 'bg-green-50' : ''} ${
                      s.isCustom && ![0, 5000, 9100, 12570].includes(s.salary) ? 'border-x-2 border-blue-200' : ''
                    }`}
                  >
                    {row.fmt ? row.fmt(s) : formatCurrency(s[row.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-2 italic">
        Green column = lowest total tax. All scenarios use your current revenue, costs, dividends and toggle settings.
      </p>
    </div>
  );
}
