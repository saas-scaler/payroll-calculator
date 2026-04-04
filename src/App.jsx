import { useState, useMemo } from 'react';
import InputPanel from './components/InputPanel';
import CompanySection from './components/CompanySection';
import PersonalSection from './components/PersonalSection';
import SummaryPanel from './components/SummaryPanel';
import RatesSection from './components/RatesSection';
import Warnings from './components/Warnings';
import { calculate } from './utils/calculate';

const DEFAULT_INPUTS = {
  revenue: 100000,
  otherCosts: 3000,
  directorSalary: 12570,
  dividends: 87430,
  eaToggle: false,
  employeeSalary: 5001,
  pensionMethod: 'none',
  directorPensionRate: 5,
  directorPensionFixed: 0,
};

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

        {/* Footer */}
        <footer className="mt-8 pb-6 text-center text-xs text-slate-400">
          <p>For illustrative purposes only — not financial advice. Consult your accountant for your specific situation.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
