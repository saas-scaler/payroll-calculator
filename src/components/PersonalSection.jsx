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

function SingleDirectorSection({ director, dirResult, pensionToggle, label }) {
  return (
    <div className="mb-4">
      {label && (
        <h4 className="text-sm font-semibold text-blue-700 mb-1 px-2">{label}</h4>
      )}
      <div className="divide-y divide-slate-100">
        <Row label="Director Salary (pensionable)" value={dirResult.taxableSalary} />
        <Row label="Dividends Drawn" value={director.dividends} />
        <Row label="Total Personal Income" value={dirResult.totalPersonalIncome} />
        <Row
          label="Adjusted Personal Allowance"
          value={dirResult.adjustedPA}
          tooltip="Personal Allowance of £12,570 tapers by £1 for every £2 of income above £100,000. Dividends count towards the taper threshold even though £500 is tax-free."
        />
        <Row label="Income Tax on Salary" value={-dirResult.incomeTax} />
        <Row label="Employee NI" value={-dirResult.employeeNI} />
        <Row
          label="Dividend Tax"
          value={-dirResult.dividendTax}
          tooltip="First £500 of dividends is tax-free. Remaining dividends are taxed at 10.75% (basic), 35.75% (higher) or 39.35% (additional) depending on which band they fall in."
        />
        {pensionToggle && (
          <Row
            label="Director Pension (company contribution)"
            value={dirResult.directorPensionSacrificeAmount}
            tooltip="This amount is paid by the company into the director's pension via salary sacrifice. It's not part of take-home pay but is a tax-efficient benefit."
          />
        )}
        <Row label="Net Take-Home" value={dirResult.netTakeHome} highlight />
      </div>
    </div>
  );
}

export default function PersonalSection({ inputs, results }) {
  const { directors, pensionToggle } = inputs;
  const { directorResults, totalNetTakeHome } = results;
  const multipleDirectors = directors.length > 1;

  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-slate-800 mb-2 pb-1 border-b-2 border-blue-600">
        Personal Tax Calculation
      </h3>

      {directors.map((director, i) => (
        <SingleDirectorSection
          key={i}
          director={director}
          dirResult={directorResults[i]}
          pensionToggle={pensionToggle}
          label={multipleDirectors ? (director.name || `Director ${i + 1}`) : null}
        />
      ))}

      {multipleDirectors && (
        <div className="bg-blue-50 rounded-md p-2 mt-2">
          <div className="flex justify-between items-baseline text-sm font-bold text-blue-900">
            <span>Combined Net Take-Home (all directors)</span>
            <span className="font-mono">{formatCurrency(totalNetTakeHome)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
