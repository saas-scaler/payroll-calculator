import { useState, useMemo } from 'react';
import InputPanel from './components/InputPanel';
import CompanySection from './components/CompanySection';
import PersonalSection from './components/PersonalSection';
import SummaryPanel from './components/SummaryPanel';
import RatesSection from './components/RatesSection';
import Warnings from './components/Warnings';
import { calculate } from './utils/calculate';

const DEFAULT_DIRECTOR = {
  name: 'Director 1',
  salary: 0,
  dividends: 0,
};

const DEFAULT_INPUTS = {
  revenue: 0,
  otherCosts: 0,
  directors: [{ ...DEFAULT_DIRECTOR }],
  eaToggle: false,
  employeeSalary: 0,
  pensionMethod: 'none',
  directorPensionRate: 0,
  directorPensionFixed: 0,
};

export { DEFAULT_DIRECTOR };

function App() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);

  const results = useMemo(() => calculate(inputs), [inputs]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            UK Director Payroll &amp; Tax Calculator
          </h1>
          <p className="text-slate-300 text-sm mt-0.5">
            FY 2026/27 — England, Wales &amp; Northern Ireland
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Warnings */}
        <Warnings warnings={results.warnings} />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: Inputs + Detailed Breakdown */}
          <div className="lg:col-span-7 space-y-6">
            <InputPanel inputs={inputs} setInputs={setInputs} />

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Detailed Breakdown</h2>
              <CompanySection inputs={inputs} results={results} />
              <PersonalSection inputs={inputs} results={results} />
            </div>
          </div>

          {/* Right column: Summary + Scenario */}
          <div className="lg:col-span-5">
            <SummaryPanel inputs={inputs} results={results} />
          </div>
        </div>

        {/* Rates section */}
        <RatesSection />

        {/* Disclaimer */}
        <footer className="mt-10 pb-8">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-6 py-5 text-xs text-slate-500 leading-relaxed space-y-2">
            <p className="font-semibold text-slate-600 text-sm">Disclaimer</p>
            <p>
              This calculator is for <strong>illustrative purposes only</strong> and does not constitute financial, tax or legal advice.
              You should not rely on it as a substitute for professional advice tailored to your individual circumstances.
              Always consult a qualified accountant or tax adviser before making decisions about salary, dividends or company tax planning.
            </p>
            <p>
              Calculations are based on published HMRC rates and thresholds for the 2026/27 tax year (England, Wales &amp; Northern Ireland).
              They assume a single company with no associated companies and no investment income.
              Scottish taxpayers are subject to different income tax bands and rates on non-savings, non-dividend income.
              Results may not reflect your situation if you have multiple directorships, benefits in kind, student loan repayments,
              carried-forward losses, or other taxable income.
            </p>
            <p>
              The employer pension match and director salary sacrifice rates shown are assumptions — actual figures depend on your pension scheme.
              Corporation tax loss carry-back refunds assume sufficient historic profits are available.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
