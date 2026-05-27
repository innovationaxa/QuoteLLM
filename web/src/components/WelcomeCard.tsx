import daLogoSrc from '../assets/da-logo.png';

interface Props { onStart: () => void; }

export function WelcomeCard({ onStart }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-up text-center px-4">
      <div className="max-w-sm w-full">
        <div className="flex justify-center mb-6">
          <div className="bg-da-blue rounded-2xl p-3.5 shadow-lg">
            <img src={daLogoSrc} alt="Direct Assurance" width={44} height={44} style={{ objectFit: 'contain' }} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Votre mutuelle santé<br />en 90 secondes
        </h1>
        <p className="text-sm text-muted mb-8 leading-relaxed">
          Devis personnalisé · 3 formules comparées · Conseiller disponible
        </p>
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { n: '1', label: 'Profil' },
            { n: '2', label: 'Besoins' },
            { n: '3', label: 'Devis' },
          ].map((s, i, arr) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-da-blue/10 border-2 border-da-blue/30 text-da-blue text-xs font-bold flex items-center justify-center">
                  {s.n}
                </div>
                <span className="text-xs text-muted">{s.label}</span>
              </div>
              {i < arr.length - 1 && <div className="w-8 h-px bg-border mb-3" />}
            </div>
          ))}
        </div>
        <button
          onClick={onStart}
          className="w-full py-4 rounded-full bg-da-blue hover:bg-da-blue-hover text-white text-base font-semibold transition-colors shadow-sm"
        >
          Commencer mon devis →
        </button>
        <p className="text-xs text-muted mt-4">
          🔒 Données confidentielles · Conformité RGPD · Groupe AXA
        </p>
      </div>
    </div>
  );
}
