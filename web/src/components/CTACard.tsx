interface Props {
  onContinue: () => void;
  onCallback: () => void;
}

export function CTACard({ onContinue, onCallback }: Props) {
  return (
    <div className="mt-3 rounded-2xl border border-border bg-elevated p-5 flex flex-col gap-4 animate-fade-up max-w-md">
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-1">Prochaine étape</p>
        <p className="text-xs text-muted leading-relaxed">
          Souscription sur le site sécurisé Direct Assurance · Équipe humaine disponible · Groupe AXA
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onContinue}
          className="w-full py-3 px-4 rounded-full bg-da-blue hover:bg-da-blue-hover text-white text-sm font-semibold transition-colors"
        >
          Continuer sur Direct Assurance →
        </button>
        <button
          onClick={onCallback}
          className="w-full py-2.5 px-4 rounded-full border border-border text-muted hover:text-gray-900 hover:border-muted text-sm transition-colors"
        >
          Être rappelé(e) par un conseiller
        </button>
      </div>
    </div>
  );
}
