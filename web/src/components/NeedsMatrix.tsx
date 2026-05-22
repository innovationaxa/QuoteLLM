import { useState } from 'react';
import { NeedsMatrixData } from '../types';

interface Selection {
  hospitalization_need: string;
  optics_need:          string;
  dental_need:          string;
}

interface Props {
  data:     NeedsMatrixData;
  onSubmit: (sel: Selection) => void;
}

const ROWS = [
  {
    key:      'hospitalization_need' as const,
    label:    '🏥 Hospitalisation',
    subtitle: 'En cas d\'opération ou d\'hospitalisation',
    options: [
      { value: 'minimum', label: 'Basique',  detail: 'Chambre partagée, remboursement Sécu uniquement' },
      { value: 'comfort', label: 'Confort',  detail: 'Chambre individuelle, dépassements partiels' },
      { value: 'premium', label: 'Premium',  detail: 'Clinique privée au choix, dépassements couverts' },
    ],
  },
  {
    key:      'optics_need' as const,
    label:    '👓 Optique',
    subtitle: 'Lunettes et lentilles (renouvellement / 2 ans)',
    options: [
      { value: 'minimum',  label: 'Basique',   detail: 'Verres simples, montures ~30 €' },
      { value: 'standard', label: 'Standard',  detail: 'Progressifs couverts, montures ~150 €' },
      { value: 'enhanced', label: 'Renforcé',  detail: 'Premium + lentilles, montures ~300 €' },
    ],
  },
  {
    key:      'dental_need' as const,
    label:    '🦷 Dentaire',
    subtitle: 'Soins, prothèses et orthodontie',
    options: [
      { value: 'routine',      label: 'Courant',     detail: 'Caries, détartrage, obturations' },
      { value: 'prosthetics',  label: 'Prothèses',   detail: 'Couronnes, bridges, implants partiels' },
      { value: 'orthodontics', label: 'Orthodontie', detail: 'Appareils adulte et enfant inclus' },
    ],
  },
];

export function NeedsMatrix({ data, onSubmit }: Props) {
  const [sel, setSel] = useState<Partial<Selection>>({
    hospitalization_need: data.hospitalization_need ?? undefined,
    optics_need:          data.optics_need          ?? undefined,
    dental_need:          data.dental_need          ?? undefined,
  });

  const isComplete = !!(sel.hospitalization_need && sel.optics_need && sel.dental_need);

  return (
    <div className="mt-3 rounded-2xl border border-border overflow-hidden max-w-md animate-fade-up">
      <div className="bg-elevated px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-gray-900">Tes besoins en santé</p>
        <p className="text-xs text-muted mt-0.5">Sélectionne un niveau par ligne pour calculer tes tarifs</p>
      </div>

      <div className="bg-white divide-y divide-border">
        {ROWS.map(row => (
          <div key={row.key} className="px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">{row.label}</p>
            <p className="text-xs text-muted mb-2">{row.subtitle}</p>
            <div className="grid grid-cols-3 gap-2">
              {row.options.map(opt => {
                const active = sel[row.key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSel(s => ({ ...s, [row.key]: opt.value }))}
                    className={`flex flex-col items-center text-center p-2.5 rounded-xl border text-xs transition-all ${
                      active
                        ? 'border-da-blue bg-da-blue/5 text-da-blue'
                        : 'border-border hover:border-muted text-gray-700 hover:bg-elevated'
                    }`}
                  >
                    <span className={`font-semibold mb-0.5 ${active ? 'text-da-blue' : 'text-gray-900'}`}>{opt.label}</span>
                    <span className={`leading-tight ${active ? 'text-da-blue/70' : 'text-muted'}`}>{opt.detail}</span>
                    {active && (
                      <span className="mt-1 w-4 h-4 rounded-full bg-da-blue flex items-center justify-center shrink-0">
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3l2 2 4-4" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 bg-elevated border-t border-border">
        <button
          onClick={() => isComplete && onSubmit(sel as Selection)}
          disabled={!isComplete}
          className="w-full py-3 rounded-xl bg-da-blue hover:bg-da-blue-hover disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold transition-colors"
        >
          {isComplete ? 'Calculer mon devis →' : 'Sélectionne tes 3 niveaux de couverture'}
        </button>
      </div>
    </div>
  );
}
