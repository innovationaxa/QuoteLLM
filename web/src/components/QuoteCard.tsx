import { QuoteData } from '../types';

interface Props {
  data: QuoteData;
}

const COVERAGE_COLOR: Record<string, string> = {
  Essentielle: 'bg-blue-500',
  Confort:     'bg-yellow-500',
  Premium:     'bg-purple-500',
};

const COVERAGE_BADGE: Record<string, string> = {
  Essentielle: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Confort:     'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  Premium:     'bg-purple-500/15 text-purple-300 border-purple-500/30',
};

export function QuoteCard({ data }: Props) {
  const color   = COVERAGE_COLOR[data.coverageLabel]  ?? 'bg-da-blue';
  const badge   = COVERAGE_BADGE[data.coverageLabel]  ?? 'bg-da-blue/15 text-blue-300 border-da-blue/30';

  return (
    <div className="mt-3 rounded-2xl border border-border bg-elevated overflow-hidden animate-fade-up max-w-sm w-full">
      {/* Header band */}
      <div className={`${color} px-5 py-3 flex items-center justify-between`}>
        <p className="text-white font-semibold text-sm">Devis indicatif Santé</p>
        <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
          Non contractuel
        </span>
      </div>

      {/* Premium */}
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <p className="text-muted text-xs uppercase tracking-wider mb-1">Cotisation mensuelle</p>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-white">
            {data.monthlyPremium.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-lg text-muted mb-1">€ / mois</span>
        </div>
        <p className="text-muted text-sm mt-1">
          soit <strong className="text-white">{data.annualPremium.toFixed(2).replace('.', ',')} €</strong> / an
        </p>
      </div>

      {/* Details */}
      <div className="px-5 py-4 flex flex-col gap-2.5">
        <Row label="Formule">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge}`}>
            {data.coverageLabel}
          </span>
        </Row>
        <Row label="Régime">{data.regimeLabel}</Row>
        <Row label="Bénéficiaires">{data.beneficiariesLabel}</Row>
        <Row label="Tranche d'âge">{data.ageBand}</Row>
        <Row label="Code postal">{data.postalCode}</Row>
      </div>

      {/* Disclaimer */}
      <div className="px-5 pb-4">
        <p className="text-xs text-muted leading-relaxed">
          Tarif indicatif calculé à titre informatif. Il peut varier après vérification de vos informations
          et selon les conditions générales du contrat.
        </p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted shrink-0">{label}</span>
      <span className="text-sm text-white text-right">{children}</span>
    </div>
  );
}
