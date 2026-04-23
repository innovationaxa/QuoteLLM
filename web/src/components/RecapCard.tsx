import { RecapData } from '../types';

interface Props {
  data: RecapData;
  onConfirm: () => void;
}

function Section({ title, items }: { title: string; items: RecapData['situation'] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{title}</p>
      <div className="flex flex-col gap-1.5">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 text-muted shrink-0">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </span>
            <span className="text-white text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecapCard({ data, onConfirm }: Props) {
  return (
    <div className="mt-3 rounded-2xl border border-border bg-elevated overflow-hidden animate-fade-up max-w-md w-full">
      <div className="px-5 py-4 flex flex-col gap-5">
        <Section title="Votre situation" items={data.situation} />
        <div className="border-t border-border" />
        <Section title="Vos besoins" items={data.besoins} />
      </div>
      <div className="px-5 pb-4">
        <button
          onClick={onConfirm}
          className="w-full py-3 rounded-xl bg-da-blue hover:bg-da-blue-hover text-white text-sm font-semibold transition-colors"
        >
          Oui, calculer mon devis →
        </button>
      </div>
    </div>
  );
}
