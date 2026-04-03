import { useState, useCallback } from 'react';
import { parseNumber, formatNumberInput } from '../utils/format';

function CurrencyInput({ label, value, onChange, id }) {
  const [displayVal, setDisplayVal] = useState(formatNumberInput(value));
  const [focused, setFocused] = useState(false);

  const handleChange = (e) => {
    const raw = e.target.value;
    setDisplayVal(raw);
    const num = parseNumber(raw);
    onChange(num);
  };

  const handleFocus = () => {
    setFocused(true);
    // Show raw number for easier editing
    setDisplayVal(value === 0 ? '' : String(value));
  };

  const handleBlur = () => {
    setFocused(false);
    setDisplayVal(formatNumberInput(value));
  };

  return (
    <div className="mb-3">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={displayVal}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange, id, description }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            checked ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      {description && (
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      )}
    </div>
  );
}

export default function InputPanel({ inputs, setInputs }) {
  const update = useCallback(
    (field) => (value) => {
      setInputs((prev) => ({ ...prev, [field]: value }));
    },
    [setInputs]
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Inputs</h2>

      <CurrencyInput
        id="revenue"
        label="Company Revenue (£)"
        value={inputs.revenue}
        onChange={update('revenue')}
      />
      <CurrencyInput
        id="otherCosts"
        label="Other Business Costs, excl. salary/NI (£)"
        value={inputs.otherCosts}
        onChange={update('otherCosts')}
      />
      <CurrencyInput
        id="directorSalary"
        label="Director Salary (£)"
        value={inputs.directorSalary}
        onChange={update('directorSalary')}
      />
      <CurrencyInput
        id="dividends"
        label="Dividends Drawn (£)"
        value={inputs.dividends}
        onChange={update('dividends')}
      />

      <hr className="my-4 border-slate-200" />

      <Toggle
        id="eaToggle"
        label="Include Employee?"
        checked={inputs.eaToggle}
        onChange={update('eaToggle')}
        description="Adds an employee to unlock Employment Allowance"
      />
      {inputs.eaToggle && (
        <CurrencyInput
          id="employeeSalary"
          label="Employee Salary (£)"
          value={inputs.employeeSalary}
          onChange={update('employeeSalary')}
        />
      )}
      <div className="mb-3">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Director Pension Method
        </label>
        <select
          id="pensionMethod"
          value={inputs.pensionMethod}
          onChange={(e) => update('pensionMethod')(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="none">None</option>
          <option value="salary_sacrifice">Salary Sacrifice</option>
          <option value="relief_at_source">Relief at Source</option>
        </select>
        <p className="text-xs text-slate-500 mt-0.5">
          {inputs.pensionMethod === 'salary_sacrifice'
            ? 'Salary is reduced before tax & NI — saves employer and employee NI'
            : inputs.pensionMethod === 'relief_at_source'
            ? 'Director pays from net pay (80%), pension provider reclaims 20% basic rate relief'
            : 'No director pension contribution'}
        </p>
      </div>
      {inputs.pensionMethod !== 'none' && (
        <div className="mb-3">
          <label htmlFor="directorPensionRate" className="block text-sm font-medium text-slate-700 mb-1">
            Director Pension Rate (%)
          </label>
          <input
            id="directorPensionRate"
            type="number"
            min="0"
            max="100"
            step="1"
            value={inputs.directorPensionRate}
            onChange={(e) => update('directorPensionRate')(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      )}

      <p className="text-xs text-slate-400 mt-4 italic">
        This calculator applies England, Wales and Northern Ireland income tax rates. Scottish taxpayers have different non-savings income bands.
      </p>
    </div>
  );
}
