interface Props {
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentCard({ onAccept, onDecline }: Props) {
  return (
    <div className="mt-3 rounded-2xl border border-border bg-elevated p-4 flex flex-col gap-3 animate-fade-up max-w-md">
      <p className="text-xs text-muted uppercase tracking-wider font-medium">Consentement requis</p>
      <div className="flex gap-3">
        <button
          onClick={onAccept}
          className="flex-1 py-2.5 px-4 rounded-xl bg-da-blue hover:bg-da-blue-hover text-white text-sm font-semibold transition-colors"
        >
          J'accepte et je commence
        </button>
        <button
          onClick={onDecline}
          className="py-2.5 px-4 rounded-xl border border-border text-muted hover:text-gray-900 hover:border-muted text-sm transition-colors"
        >
          Non merci
        </button>
      </div>
    </div>
  );
}
