import { useState } from 'react';
import { RATES_DISPLAY } from '../constants/rates';

export default function RatesSection() {
  const [open, setOpen] = useState(false);

  const categories = [...new Set(RATES_DISPLAY.map((r) => r.category))];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 mt-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
      >
        <h3 className="text-base font-semibold text-slate-800">
          Rates &amp; Assumptions (FY 2026/27)
        </h3>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-slate-200">
          {categories.map((cat) => (
            <div key={cat} className="mt-3">
              <h4 className="text-sm font-semibold text-slate-600 mb-1">{cat}</h4>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {RATES_DISPLAY.filter((r) => r.category === cat).map((r, i) => (
                    <tr key={i}>
                      <td className="py-1.5 text-slate-700 w-1/3">{r.label}</td>
                      <td className="py-1.5 font-mono text-slate-900 w-1/6 text-right">{r.value}</td>
                      <td className="py-1.5 text-slate-500 text-xs pl-4">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <div className="mt-4 pt-3 border-t border-slate-200 space-y-1">
            <p className="text-xs text-slate-500">
              <strong>Source:</strong> gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027
            </p>
            <p className="text-xs text-slate-500">
              Dividend tax rates increased by 2 percentage points from 6 April 2026 (Autumn Budget 2025).
            </p>
            <p className="text-xs text-slate-500">
              Employer pension match (3%) and director sacrifice (5%) rates are assumptions — actual figures depend on the pension scheme.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
