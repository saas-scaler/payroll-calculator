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
  const isMultiDirector = directors.length > 1;

  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-slate-800 mb-2 pb-1 border-b-2 border-blue-600">
        Company Tax Calculation
      </h3>
      <div className="divide-y divide-slate-100">
        <Row label="Revenue" value={revenue} />
        <Row label="Less: Other Business Costs" value={-otherCosts} />
        {r.employee5kSalary > 0 && (
          <Row label="Less: Employee Salary" value={-r.employee5kSalary} />
        )}

        {/* Director costs */}
        {isMultiDirector ? (
          <>
            {r.directorResults.map((d, i) => (
              <div key={i}>
                {d.directorPensionSacrificeAmount > 0 && (
                  <Row
                    label={`Less: ${d.name} Pension Sacrifice`}
                    value={-d.directorPensionSacrificeAmount}
                    indent
                    tooltip="Salary sacrifice reduces both taxable salary and employer NI base."
                  />
                )}
                <Row
                  label={`Less: ${d.name} Salary${d.directorPensionSacrificeAmount > 0 ? ' (after sacrifice)' : ''}`}
                  value={-(d.directorSalary - d.directorPensionSacrificeAmount)}
                  indent
                />
              </div>
            ))}
            {r.totalPensionFixed > 0 && (
              <Row
                label="Less: Director Pension (fixed, all)"
                value={-r.totalPensionFixed}
                tooltip="Fixed employer pension contribution paid directly by the company into each director's pension."
              />
            )}
          </>
        ) : (
          <>
            {r.directorResults[0].directorPensionSacrificeAmount > 0 && (
              <Row
                label="Less: Director Pension Sacrifice"
                value={-r.directorResults[0].directorPensionSacrificeAmount}
                tooltip="Salary sacrifice reduces both taxable salary and employer NI base. This portion of the director's gross salary is redirected to pension."
              />
            )}
            {r.directorResults[0].directorPensionFixed > 0 && (
              <Row
                label="Less: Director Pension (fixed)"
                value={-r.directorResults[0].directorPensionFixed}
                tooltip="Fixed employer pension contribution paid directly by the company into the director's pension. This is an additional company cost on top of salary."
              />
            )}
            <Row
              label={r.directorResults[0].directorPensionSacrificeAmount > 0 ? "Less: Director Salary (after sacrifice)" : "Less: Director Salary"}
              value={-(r.directorResults[0].directorSalary - r.directorResults[0].directorPensionSacrificeAmount)}
            />
          </>
        )}

        {r.employerPension5k > 0 && (
          <Row label="Less: Employer Pension on Employee" value={-r.employerPension5k} />
        )}
        {r.employerNI5kGross > 0 && (
          <Row label="Employer NI on Employee (gross)" value={-r.employerNI5kGross} />
        )}
        {r.employmentAllowanceUsed > 0 ? (
          <>
            <Row
              label={isMultiDirector ? "Employer NI on Directors (gross)" : "Employer NI on Director (gross)"}
              value={-r.totalEmployerNIDirectorGross}
            />
            <Row
              label="Add: Employment Allowance"
              value={r.employmentAllowanceUsed}
              tooltip={
                r.eaEligibleViaDirectors
                  ? 'Employment Allowance of up to £10,500 unlocked because 2+ directors have salary above £5,000.'
                  : 'Employment Allowance of up to £10,500 offsets total employer NI (director + employee). Available when at least one employee is on payroll.'
              }
            />
            {r.employerNI5kNet > 0 && (
              <Row label="Less: Employer NI on Employee (net)" value={-r.employerNI5kNet} />
            )}
            <Row
              label={isMultiDirector ? "Less: Employer NI on Directors (net)" : "Less: Employer NI on Director (net)"}
              value={-r.totalEmployerNIDirectorNet}
            />
          </>
        ) : (
          r.totalEmployerNIDirectorNet > 0 && (
            <Row
              label={isMultiDirector ? "Less: Employer NI on Directors" : "Less: Employer NI on Director"}
              value={-r.totalEmployerNIDirectorNet}
            />
          )
        )}
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
