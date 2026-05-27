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
    key:   'hospitalization_need' as const,
    label: '🏥 Hospitalisation',
    options: [
      { value: 'minimum', label: 'Basique',  detail: 'Chambre partagée, remboursement Sécu uniquement' },
      { value: 'comfort', label: 'Confort',  detail: 'Chambre individuelle, dépassements partiels couverts' },
      { value: 'premium', label: 'Premium',  detail: 'Clinique privée au choix, dépassements couverts' },
    ],
  },
  {
    key:   'optics_need' as const,
    label: '👓 Optique',
    options: [
      { value: 'minimum',  label: 'Basique',   detail: 'Verres simples, montures ~30 €' },
      { value: 'standard', label: 'Standard',  detail: 'Progressifs couverts, montures ~150 €' },
      { value: 'enhanced', label: 'Renforcé',  detail: 'Premium + lentilles, montures ~300 €' },
    ],
  },
  {
    key:   'dental_need' as const,
    label: '🦷 Dentaire',
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
    <div className="mt-3 rounded-[20px] border border-border overflow-hidden max-w-md animate-fade-up">
      <div className="bg-elevated px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-gray-900">Tes besoins en santé</p>
        <p className="text-xs text-muted mt-0.5">Sélectionne un niveau par domaine</p>
      </div>

      <div className="bg-white divide-y divide-border">
        {ROWS.map(row => {
          const selectedOpt = row.options.find(o => o.value === sel[row.key]);
          return (
            <div key={row.key} className="px-4 py-3">
              <p className="text-sm font-semibold text-gray-900 mb-2">{row.label}</p>
              <div className="flex gap-2">
                {row.options.map(opt => {
                  const active = sel[row.key] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSel(s => ({ ...s, [row.key]: opt.value }))}
                      className={`flex-1 py-2 px-2 rounded-full text-xs font-semibold transition-all ${
                        active
                          ? 'bg-da-blue text-white shadow-sm'
                          : 'border border-border text-gray-600 bg-white hover:border-da-blue/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {selectedOpt && (
                <p className="text-xs text-muted mt-1.5 pl-1 leading-relaxed">{selectedOpt.detail}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 bg-elevated border-t border-border">
        <button
          onClick={() => isComplete && onSubmit(sel as Selection)}
          disabled={!isComplete}
          className="w-full py-3 rounded-full bg-da-blue hover:bg-da-blue-hover disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold transition-colors"
        >
          {isComplete ? 'Calculer mon devis →' : 'Sélectionne tes 3 domaines'}
        </button>
      </div>
    </div>
  );
}
