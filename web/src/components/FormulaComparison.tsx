import { FormulaResult, QuoteResult } from '../types';

const COLOR_HEADER: Record<string, string> = {
  blue:   'bg-blue-600',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-600',
};
const COLOR_PRICE: Record<string, string> = {
  blue:   'text-blue-700',
  yellow: 'text-yellow-600',
  purple: 'text-purple-700',
};

function SavingBadge({ saving }: { saving: number }) {
  if (saving > 5) return (
    <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200">
      💰 −{saving.toFixed(0)} €/mois vs aujourd'hui
    </div>
  );
  if (saving < -5) return (
    <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200">
      📈 +{Math.abs(saving).toFixed(0)} €/mois · mais mieux couvert
    </div>
  );
  return (
    <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200">
      ≈ Prix similaire
    </div>
  );
}

function FormulaCard({ f }: { f: FormulaResult }) {
  return (
    <div className={`
      flex flex-col rounded-2xl border overflow-hidden transition-all
      ${f.recommended
        ? 'border-da-blue/40 shadow-lg shadow-da-blue/15 scale-[1.02]'
        : 'border-border'}
    `}>
      {f.recommended && (
        <div className="bg-da-blue text-white text-xs font-bold text-center py-1 tracking-wider uppercase">
          ★ Recommandée
        </div>
      )}

      <div className={`${COLOR_HEADER[f.color]} px-4 py-3`}>
        <p className="text-white font-semibold text-sm">{f.name}</p>
        <p className="text-white/80 text-xs mt-0.5">{f.tagline}</p>
      </div>

      <div className="bg-elevated px-4 py-4 border-b border-border">
        <div className={`text-3xl font-bold ${COLOR_PRICE[f.color]}`}>
          {f.monthlyPremium.toFixed(2).replace('.', ',')}
          <span className="text-base font-normal text-muted ml-1">€ / mois</span>
        </div>
        <p className="text-xs text-muted mt-1">
          soit <strong className="text-gray-900">{f.annualPremium.toFixed(2).replace('.', ',')} €</strong>/an
        </p>
        {f.monthlySaving !== undefined && <SavingBadge saving={f.monthlySaving} />}
      </div>

      <div className="bg-elevated px-4 py-3 flex flex-col gap-2 flex-1">
        {Object.values(f.coverage).map(line => (
          <div key={line} className="flex items-start gap-2 text-xs text-muted">
            <span className="text-green-600 shrink-0 mt-0.5">✓</span>
            <span>{line}</span>
          </div>
        ))}
      </div>

      <div className="bg-elevated px-4 pb-4">
        <button className={`
          w-full py-2.5 rounded-xl text-sm font-semibold transition-colors
          ${f.recommended
            ? 'bg-da-blue hover:bg-da-blue-hover text-white'
            : 'border border-border text-muted hover:text-gray-900 hover:border-muted'}
        `}>
          Sélectionner
        </button>
      </div>
    </div>
  );
}

interface Props { data: QuoteResult }

export function FormulaComparison({ data }: Props) {
  return (
    <div className="mt-3 animate-fade-up w-full max-w-2xl">
      {/* Mutuelle actuelle (si connue) */}
      {data.currentMonthlyPrice && (
        <div className="mb-3 flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-border text-sm">
          <span className="text-muted">
            Mutuelle actuelle{data.currentInsurer ? ` (${data.currentInsurer})` : ''}
          </span>
          <span className="font-semibold text-gray-900">
            ~{data.currentMonthlyPrice} €/mois
          </span>
        </div>
      )}

      {/* Raison de la recommandation */}
      <div className="mb-3 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800 leading-relaxed">
        {data.recommendationReason.split('**').map((part, i) =>
          i % 2 === 1
            ? <strong key={i} className="text-blue-900">{part}</strong>
            : part
        )}
      </div>

      {/* 3 formules */}
      <div className="grid grid-cols-3 gap-3">
        {data.formulas.map(f => <FormulaCard key={f.id} f={f} />)}
      </div>

      <p className="text-xs text-muted text-center mt-3">
        Tarifs indicatifs · Non contractuels · Délai de carence applicable
      </p>
    </div>
  );
}
