interface Props { step: 1 | 2 | 3; }

export function ProgressBar({ step }: Props) {
  const steps = ['Profil', 'Besoins', 'Devis'];
  return (
    <div className="px-6 py-2 border-b border-border bg-surface shrink-0">
      <div className="max-w-2xl mx-auto flex items-center">
        {steps.map((label, i) => {
          const n = i + 1;
          const done   = step > n;
          const active = step === n;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-1.5 shrink-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${done ? 'bg-green-500 text-white' : active ? 'bg-da-blue text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {done ? '✓' : n}
                </div>
                <span className={`text-xs font-medium ${active ? 'text-gray-900' : done ? 'text-green-600' : 'text-muted'}`}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 mx-2 h-px ${step > n ? 'bg-green-300' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
