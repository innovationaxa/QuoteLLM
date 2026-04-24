import { QuickEstimateData } from '../types';

interface Props { data: QuickEstimateData }

export function QuickEstimateCard({ data }: Props) {
  const { currentMonthly, rangeMin, rangeMax, notInsured } = data;
  const savingsMax = currentMonthly !== null ? Math.round(currentMonthly - rangeMin) : null;

  return (
    <div className="mt-3 rounded-2xl border border-border overflow-hidden animate-fade-up max-w-sm">
      <div className="bg-da-blue px-4 py-3">
        <p className="text-white font-semibold text-sm">📊 Premier aperçu</p>
        <p className="text-white/80 text-xs mt-0.5">Estimation indicative · Sera affinée</p>
      </div>

      <div className="bg-elevated px-4 py-4 flex flex-col gap-2.5">
        {currentMonthly !== null && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Ta mutuelle actuelle</span>
            <span className="font-semibold text-gray-900">~{currentMonthly} €/mois</span>
          </div>
        )}

        <div className="flex justify-between items-center text-sm">
          <span className="text-muted">Direct Assurance</span>
          <span className="font-semibold text-da-blue">{rangeMin} – {rangeMax} €/mois</span>
        </div>

        {notInsured ? (
          <div className="mt-1 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 leading-relaxed">
            💡 Sans mutuelle, tu prends en charge 100&nbsp;% des frais non remboursés par la Sécu.
            Une couverture de base commence à <strong>{rangeMin}&nbsp;€/mois</strong>.
          </div>
        ) : savingsMax !== null && savingsMax > 5 ? (
          <div className="mt-1 px-3 py-2.5 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800 leading-relaxed">
            💡 Tu pourrais potentiellement économiser jusqu'à{' '}
            <strong>{savingsMax}&nbsp;€/mois</strong> à couverture équivalente.
          </div>
        ) : (
          <div className="mt-1 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 leading-relaxed">
            💡 Ton prix est dans les standards du marché. On va vérifier si tu peux être{' '}
            <strong>mieux couvert au même prix</strong>.
          </div>
        )}

        <p className="text-xs text-muted pt-0.5">
          Ces fourchettes seront affinées avec ton profil et tes besoins.
        </p>
      </div>
    </div>
  );
}
