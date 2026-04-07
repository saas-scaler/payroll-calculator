import { formatCurrency } from '../utils/format';
import Tooltip from './Tooltip';

function Row({ label, value, highlight, tooltip }) {
  const isNeg = value < -0.5;

  return (
    <div
      className={`flex justify-between items-baseline py-1.5 px-2 text-sm ${
        highlight ? 'bg-slate-50 font-semibold border-t border-b border-slate-200' : ''
      }`}
    >
      <span className="text-slate-700">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </span>
      <span className={`font-mono text-right ${isNeg ? 'text-red-600' : 'text-slate-900'}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function DirectorPersonalBreakdown({ d }) {
  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-slate-600 mb-1 px-2">{d.name}</h4>
      <div className="divide-y divide-slate-100">
        <Row label="Salary (pensionable)" value={d.taxableSalary} />
        <Row label="Dividends Drawn" value={d.dividends} />
        <Row label="Total Personal Income" value={d.totalPersonalIncome} />
        <Row
          label="Adjusted Personal Allowance"
          value={d.adjustedPA}
          tooltip="Personal Allowance of £12,570 tapers by £1 for every £2 of income above £100,000."
        />
        <Row label="Income Tax on Salary" value={-d.incomeTax} />
        <Row label="Employee NI" value={-d.employeeNI} />
        <Row
          label="Dividend Tax"
          value={-d.dividendTax}
          tooltip="First £500 of dividends is tax-free. Remaining dividends are taxed at 10.75% (basic), 35.75% (higher) or 39.35% (additional)."
        />
        <Row label="Net Take-Home" value={d.netTakeHome} highlight />
        {d.pensionPotContribution > 0 && (
          <div className="flex justify-between items-baseline py-1.5 px-2 text-sm">
            <span className="text-slate-500 italic">
              Pension Contribution (locked until age 57)
            </span>
            <span className="font-mono text-right text-slate-500 italic">
              {formatCurrency(d.pensionPotContribution)}
            </span>
          </div>
        )}
        {d.pensionPotContribution > 0 && (
          <div className="flex justify-between items-baseline py-1.5 px-2 text-sm bg-slate-50/50 border-t border-slate-100">
            <span className="text-slate-600 italic">
              Total Wealth (cash + pension)
            </span>
            <span className="font-mono text-right text-slate-600 italic">
              {formatCurrency(d.totalWealthCreated)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PersonalSection({ inputs, results }) {
  const r = results;
  const isMultiDirector = r.directorResults.length > 1;

  if (!isMultiDirector) {
    // Single director — show exactly as before
    const d = r.directorResults[0];
    return (
      <div className="mb-6">
        <h3 className="text-base font-semibold text-slate-800 mb-2 pb-1 border-b-2 border-blue-600">
          Personal Tax Calculation
        </h3>
        <div className="divide-y divide-slate-100">
          <Row label="Director Salary (pensionable)" value={d.taxableSalary} />
          <Row label="Dividends Drawn" value={d.dividends} />
          <Row label="Total Personal Income" value={d.totalPersonalIncome} />
          <Row
            label="Adjusted Personal Allowance"
            value={d.adjustedPA}
            tooltip="Personal Allowance of £12,570 tapers by £1 for every £2 of income above £100,000. Dividends count towards the taper threshold even though £500 is tax-free."
          />
          <Row label="Income Tax on Salary" value={-d.incomeTax} />
          <Row label="Employee NI" value={-d.employeeNI} />
          <Row
            label="Dividend Tax"
            value={-d.dividendTax}
            tooltip="First £500 of dividends is tax-free. Remaining dividends are taxed at 10.75% (basic), 35.75% (higher) or 39.35% (additional) depending on which band they fall in."
          />
          <Row label="Net Personal Take-Home" value={d.netTakeHome} highlight />
          {d.pensionPotContribution > 0 && (
            <div className="flex justify-between items-baseline py-1.5 px-2 text-sm">
              <span className="text-slate-500 italic">
                Pension Contribution (not cash — locked until age 57)
              </span>
              <span className="font-mono text-right text-slate-500 italic">
                {formatCurrency(d.pensionPotContribution)}
              </span>
            </div>
          )}
          {d.pensionPotContribution > 0 && (
            <div className="flex justify-between items-baseline py-1.5 px-2 text-sm bg-slate-50/50 border-t border-slate-100">
              <span className="text-slate-600 italic">
                Total Wealth Created (cash + pension)
              </span>
              <span className="font-mono text-right text-slate-600 italic">
                {formatCurrency(d.totalWealthCreated)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Multi-director: show each director's breakdown + combined totals
  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-slate-800 mb-2 pb-1 border-b-2 border-blue-600">
        Personal Tax Calculations
      </h3>

      {r.directorResults.map((d, i) => (
        <DirectorPersonalBreakdown key={i} d={d} />
      ))}

      {/* Combined totals */}
      <div className="border-t-2 border-slate-300 pt-2 mt-2">
        <h4 className="text-sm font-semibold text-slate-700 mb-1 px-2">Combined Totals</h4>
        <div className="divide-y divide-slate-100">
          <Row label="Total Income Tax" value={-r.totalIncomeTax} />
          <Row label="Total Employee NI" value={-r.totalEmployeeNI} />
          <Row label="Total Dividend Tax" value={-r.totalDividendTax} />
          <Row label="Combined Net Take-Home" value={r.totalNetTakeHome} highlight />
          {r.totalPensionPotContribution > 0 && (
            <div className="flex justify-between items-baseline py-1.5 px-2 text-sm">
              <span className="text-slate-500 italic">
                Combined Pension Contributions
              </span>
              <span className="font-mono text-right text-slate-500 italic">
                {formatCurrency(r.totalPensionPotContribution)}
              </span>
            </div>
          )}
          {r.totalPensionPotContribution > 0 && (
            <div className="flex justify-between items-baseline py-1.5 px-2 text-sm bg-slate-50/50 border-t border-slate-100">
              <span className="text-slate-600 italic">
                Combined Total Wealth (cash + pension)
              </span>
              <span className="font-mono text-right text-slate-600 italic">
                {formatCurrency(r.totalWealthCreated)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
