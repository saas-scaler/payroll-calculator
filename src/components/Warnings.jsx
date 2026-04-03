export default function Warnings({ warnings }) {
  if (!warnings || warnings.length === 0) return null;

  const icons = {
    warning: (
      <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
      </svg>
    ),
    tip: (
      <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a6 6 0 00-6 6c0 1.887.87 3.568 2.23 4.668.355.287.574.717.608 1.182l.056.772a1.5 1.5 0 001.496 1.378h3.22a1.5 1.5 0 001.496-1.378l.056-.772c.034-.465.253-.895.608-1.182A6 6 0 0010 2zm-1.5 14a.5.5 0 01.5-.5h2a.5.5 0 010 1H9a.5.5 0 01-.5-.5zm.5 2a.5.5 0 000 1h2a.5.5 0 000-1H9z" />
      </svg>
    ),
  };

  const bgColors = {
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
    tip: 'bg-green-50 border-green-200',
  };

  return (
    <div className="space-y-2 mb-4">
      {warnings.map((w, i) => (
        <div
          key={i}
          className={`flex gap-2 p-3 rounded-md border text-sm ${bgColors[w.type] || bgColors.warning}`}
        >
          {icons[w.type] || icons.warning}
          <span className="text-slate-700">{w.message}</span>
        </div>
      ))}
    </div>
  );
}
