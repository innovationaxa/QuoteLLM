interface Props {
  onAccept: () => void;
  onDecline: () => void;
}

export function ContactCTA({ onAccept, onDecline }: Props) {
  return (
    <div className="mt-3 rounded-2xl border border-border bg-elevated p-4 flex flex-col gap-3 animate-fade-up max-w-md">
      <div className="flex items-center gap-2 text-sm text-muted">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
        Un conseiller peut vous accompagner pour finaliser votre souscription.
      </div>
      <div className="flex gap-3">
        <button
          onClick={onAccept}
          className="flex-1 py-2.5 px-4 rounded-xl bg-da-blue hover:bg-da-blue-hover text-white text-sm font-semibold transition-colors"
        >
          Oui, être recontacté(e)
        </button>
        <button
          onClick={onDecline}
          className="py-2.5 px-4 rounded-xl border border-border text-muted hover:text-white hover:border-muted text-sm transition-colors"
        >
          Non merci
        </button>
      </div>
    </div>
  );
}
