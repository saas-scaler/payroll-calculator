import { formatCurrency } from '../utils/format';
import Tooltip from './Tooltip';

function Row({ label, value, indent, highlight, negative, tooltip }) {
  const isNeg = value < -0.5;
  const isRefund = negative && isNeg;

  return (
    <div
      className={`flex justify-between items-baseline py-1.5 px-2 text-sm ${
        highlight ? 'bg-slate-50 font-semibold border-t border-b border-slate-200' : ''
      } ${indent ? 'pl-6' : ''}`}
    >
      <span className="text-slate-700">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </span>
      <span className={`font-mono text-right ${isRefund ? 'text-green-600' : isNeg ? 'text-red-600' : 'text-slate-900'}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

export default function CompanySection({ inputs, results }) {
  const { revenue, otherCosts, directors } = inputs;
  const r = results;

  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-slate-800 mb-2 pb-1 border-b-2 border-blue-600">
        Company Tax Calculation
      </h3>
      <div className="divide-y divide-slate-100">
        <Row label="Revenue" value={revenue} />
        <Row label="Less: Other Business Costs" value={-otherCosts} />
        {r.employee5kSalary > 0 && (
          <Row label="Less: £5,001 Employee Salary" value={-r.employee5kSalary} />
        )}
        {r.totalDirectorPensionSacrifice > 0 && (
          <Row
            label={`Less: Director Pension Sacrifice${directors.length > 1 ? ' (all directors)' : ''}`}
            value={-r.totalDirectorPensionSacrifice}
            tooltip="Salary sacrifice reduces both taxable salary and employer NI base. The sacrificed amount goes directly into each director's pension."
          />
        )}
        {directors.length === 1 ? (
          <Row label="Less: Director Salary" value={-r.totalDirectorSalaries} />
        ) : (
          <>
            <Row label="Less: Director Salaries (total)" value={-r.totalDirectorSalaries} />
            {directors.map((d, i) => (
              <Row
                key={i}
                label={`  ${d.name || `Director ${i + 1}`}: £${d.salary.toLocaleString()}`}
                value={-d.salary}
                indent
              />
            ))}
          </>
        )}
        {r.employerPension5k > 0 && (
          <Row label="Less: Employer Pension on Employee" value={-r.employerPension5k} />
        )}
        {r.employerNI5k > 0 && (
          <Row label="Less: Employer NI on Employee" value={-r.employerNI5k} />
        )}
        <Row
          label={`Employer NI on Director${directors.length > 1 ? 's' : ''} (gross)`}
          value={-r.totalEmployerNIDirectorGross}
        />
        {r.employmentAllowanceUsed > 0 && (
          <Row
            label="Add: Employment Allowance"
            value={r.employmentAllowanceUsed}
            tooltip="Employment Allowance of up to £10,500 offsets employer NI. Available when at least one employee is on payroll."
          />
        )}
        <Row
          label={`Less: Employer NI on Director${directors.length > 1 ? 's' : ''} (net)`}
          value={-r.totalEmployerNIDirectorNet}
        />
        <Row label="Taxable Company Profit" value={r.taxableCompanyProfit} highlight />
        <Row
          label="Less: Corporation Tax"
          value={-r.corporationTax}
          negative
          tooltip={
            r.taxableCompanyProfit < 0
              ? 'Loss carry-back: 19% refund on losses, assuming historic profits are available.'
              : r.taxableCompanyProfit > 50000 && r.taxableCompanyProfit < 250000
              ? 'Marginal relief applies between £50k–£250k profits, giving an effective rate between 19%–25%.'
              : undefined
          }
        />
        <Row label="Post-Tax Profit Available for Dividends" value={r.postTaxProfit} highlight />
      </div>
    </div>
  );
}
