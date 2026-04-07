import { useState, useCallback } from 'react';
import { parseNumber, formatNumberInput } from '../utils/format';
import { DEFAULT_DIRECTOR } from '../App';

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

function DirectorCard({ director, index, updateDirector, removeDirector, canRemove }) {
  return (
    <div className="border border-slate-200 rounded-md p-3 mb-3 bg-slate-50/50">
      <div className="flex items-center justify-between mb-2">
        <input
          type="text"
          value={director.name}
          onChange={(e) => updateDirector(index, 'name', e.target.value)}
          className="text-sm font-medium text-slate-700 bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none px-1 py-0.5 w-40"
          placeholder={`Director ${index + 1}`}
        />
        {canRemove && (
          <button
            onClick={() => removeDirector(index)}
            className="text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            Remove
          </button>
        )}
      </div>
      <CurrencyInput
        id={`directorSalary-${index}`}
        label="Salary (£)"
        value={director.salary}
        onChange={(val) => updateDirector(index, 'salary', val)}
      />
      <CurrencyInput
        id={`dividends-${index}`}
        label="Dividends (£)"
        value={director.dividends}
        onChange={(val) => updateDirector(index, 'dividends', val)}
      />
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

  const updateDirector = useCallback(
    (index, field, value) => {
      setInputs((prev) => {
        const newDirectors = [...prev.directors];
        newDirectors[index] = { ...newDirectors[index], [field]: value };
        return { ...prev, directors: newDirectors };
      });
    },
    [setInputs]
  );

  const addDirector = useCallback(() => {
    setInputs((prev) => {
      if (prev.directors.length >= 4) return prev;
      return {
        ...prev,
        directors: [
          ...prev.directors,
          { ...DEFAULT_DIRECTOR, name: `Director ${prev.directors.length + 1}` },
        ],
      };
    });
  }, [setInputs]);

  const removeDirector = useCallback(
    (index) => {
      setInputs((prev) => {
        if (prev.directors.length <= 1) return prev;
        return {
          ...prev,
          directors: prev.directors.filter((_, i) => i !== index),
        };
      });
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

      <hr className="my-4 border-slate-200" />

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">
          {inputs.directors.length === 1 ? 'Director' : `Directors (${inputs.directors.length})`}
        </h3>
        {inputs.directors.length < 4 && (
          <button
            onClick={addDirector}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            + Add Director
          </button>
        )}
      </div>

      {inputs.directors.map((director, index) => (
        <DirectorCard
          key={index}
          director={director}
          index={index}
          updateDirector={updateDirector}
          removeDirector={removeDirector}
          canRemove={inputs.directors.length > 1}
        />
      ))}

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

      <hr className="my-4 border-slate-200" />

      <CurrencyInput
        id="directorPensionFixed"
        label="Director Pension — Fixed Amount (£)"
        value={inputs.directorPensionFixed}
        onChange={update('directorPensionFixed')}
      />
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
            : 'No additional percentage-based pension contribution'}
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
