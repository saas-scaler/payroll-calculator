import { formatCurrency, formatPercent } from '../utils/format';

function SummaryRow({ label, value, prominent, negative }) {
  const isNeg = value < -0.5;
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

  const employerCosts = r.employerNIDirectorNet + r.employerNI5kNet + r.employerPension5k;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
      {/* Tax Summary */}
      <h3 className="text-base font-semibold text-slate-800 mb-2 pb-1 border-b-2 border-blue-600">
        Tax Summary
      </h3>
      <div className="divide-y divide-slate-100 mb-6">
        <SummaryRow label="Corporation Tax" value={r.corporationTax} />
        <SummaryRow label="Income Tax" value={r.incomeTax} />
        <SummaryRow label="Employee NI" value={r.employeeNI} />
        <SummaryRow label="Employer NI + Pension Costs" value={employerCosts} />
        <SummaryRow label="Dividend Tax" value={r.dividendTax} />
        <SummaryRow label="TOTAL TAX" value={r.totalTax} prominent />
        <SummaryRow label="Effective Tax Rate" value={formatPercent(r.effectiveTaxRate)} />
        <SummaryRow label="Take-Home as % of Revenue" value={formatPercent(r.takeHomeAsPercentOfRevenue)} />
      </div>

    </div>
  );
}
