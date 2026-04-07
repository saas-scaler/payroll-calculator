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

function TextInput({ label, value, onChange, id, placeholder }) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        type="text"
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
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

function DirectorCard({ director, index, onChange, onRemove, canRemove }) {
  const update = (field) => (value) => {
    onChange(index, { ...director, [field]: value });
  };

  return (
    <div className="bg-slate-50 rounded-md border border-slate-200 p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-600">
          Director {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Remove
          </button>
        )}
      </div>
      <TextInput
        id={`director-${index}-name`}
        label="Name (optional)"
        value={director.name}
        onChange={update('name')}
        placeholder={`Director ${index + 1}`}
      />
      <CurrencyInput
        id={`director-${index}-salary`}
        label="Salary (£)"
        value={director.salary}
        onChange={update('salary')}
      />
      <CurrencyInput
        id={`director-${index}-dividends`}
        label="Dividends Drawn (£)"
        value={director.dividends}
        onChange={update('dividends')}
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
    (index, director) => {
      setInputs((prev) => {
        const newDirectors = [...prev.directors];
        newDirectors[index] = director;
        return { ...prev, directors: newDirectors };
      });
    },
    [setInputs]
  );

  const addDirector = useCallback(() => {
    setInputs((prev) => ({
      ...prev,
      directors: [
        ...prev.directors,
        { name: '', salary: 12570, dividends: 0 },
      ],
    }));
  }, [setInputs]);

  const removeDirector = useCallback(
    (index) => {
      setInputs((prev) => ({
        ...prev,
        directors: prev.directors.filter((_, i) => i !== index),
      }));
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
        <h3 className="text-sm font-semibold text-slate-700">Directors</h3>
        {inputs.directors.length < 4 && (
          <button
            type="button"
            onClick={addDirector}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Director
          </button>
        )}
      </div>

      {inputs.directors.map((director, i) => (
        <DirectorCard
          key={i}
          director={director}
          index={i}
          onChange={updateDirector}
          onRemove={removeDirector}
          canRemove={inputs.directors.length > 1}
        />
      ))}

      <hr className="my-4 border-slate-200" />

      {inputs.directors.filter(d => d.salary > 5000).length >= 2 && (
        <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
          <p className="text-xs font-medium text-green-800">
            Employment Allowance automatically available — you have {inputs.directors.length} directors on payroll.
          </p>
        </div>
      )}
      <Toggle
        id="eaToggle"
        label={inputs.directors.filter(d => d.salary > 5000).length >= 2 ? 'Also include £5,001 Employee?' : 'Include £5,001 Employee?'}
        checked={inputs.eaToggle}
        onChange={update('eaToggle')}
        description={
          inputs.directors.filter(d => d.salary > 5000).length >= 2
            ? 'EA is already unlocked. This adds a £5,001 employee salary, pension and NI costs.'
            : 'Adds a £5,001 employee to unlock Employment Allowance'
        }
      />
      <Toggle
        id="pensionToggle"
        label="Director Pension Sacrifice?"
        checked={inputs.pensionToggle}
        onChange={update('pensionToggle')}
        description="5% salary sacrifice into each director's pension"
      />

      <p className="text-xs text-slate-400 mt-4 italic">
        This calculator applies England, Wales and Northern Ireland income tax rates. Scottish taxpayers have different non-savings income bands.
      </p>
    </div>
  );
}
