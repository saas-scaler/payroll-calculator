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

export default function PersonalSection({ inputs, results }) {
  const r = results;

  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-slate-800 mb-2 pb-1 border-b-2 border-blue-600">
        Personal Tax Calculation
      </h3>
      <div className="divide-y divide-slate-100">
        <Row label="Director Salary (pensionable)" value={r.taxableSalary} />
        <Row label="Dividends Drawn" value={inputs.dividends} />
        <Row label="Total Personal Income" value={r.totalPersonalIncome} />
        <Row
          label="Adjusted Personal Allowance"
          value={r.adjustedPA}
          tooltip="Personal Allowance of £12,570 tapers by £1 for every £2 of income above £100,000. Dividends count towards the taper threshold even though £500 is tax-free."
        />
        <Row label="Income Tax on Salary" value={-r.incomeTax} />
        <Row label="Employee NI" value={-r.employeeNI} />
        <Row
          label="Dividend Tax"
          value={-r.dividendTax}
          tooltip="First £500 of dividends is tax-free. Remaining dividends are taxed at 10.75% (basic), 35.75% (higher) or 39.35% (additional) depending on which band they fall in."
        />
        <Row label="Net Personal Take-Home" value={r.netTakeHome} highlight />
        {r.pensionPotContribution > 0 && (
          <Row
            label="Pension pot contribution (not cash)"
            value={r.pensionPotContribution}
            tooltip="Total pension contributions from all sources: employer fixed amount, salary sacrifice, and/or relief at source. This goes into the director's pension — it is not part of cash take-home pay."
          />
        )}
      </div>
    </div>
  );
}
