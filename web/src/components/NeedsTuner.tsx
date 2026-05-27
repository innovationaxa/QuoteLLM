import { useState } from 'react';
import { NeedsTunerData } from '../types';

// ─── icons ────────────────────────────────────────────────────────────────────

function IconSoins() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} className="text-gray-500">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v4M10 13h4" />
    </svg>
  );
}
function IconHosp() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} className="text-gray-500">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M9 3h6M5 10V6a1 1 0 011-1h12a1 1 0 011 1v4M9 21v-6h6v6" />
    </svg>
  );
}
function IconOptique() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} className="text-gray-500">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s2-5 10-5 10 5 10 5-2 5-10 5S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconDentaire() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} className="text-gray-500">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3C6.5 3 5 5 5 7c0 2 .5 3.5 1 5.5S7 20 9 21c1 .5 1.5-1 2-3s.5-3 1-3 .5 1 1 3 1 3.5 2 3c2-1 2.5-7.5 3-9.5S19 9 19 7c0-2-1.5-4-4-4-1.5 0-2.5.5-3 .5S10.5 3 9 3z" />
    </svg>
  );
}

// ─── slider metadata ─────────────────────────────────────────────────────────

const SLIDERS = [
  {
    key:    'soins' as const,
    label:  'Soins & consultations',
    Icon:   IconSoins,
    levels: ['Remboursements de base', 'Couverture standard', 'Couverture renforcée'],
  },
  {
    key:    'hospitalisation' as const,
    label:  'Hospitalisation',
    Icon:   IconHosp,
    levels: ['Hôpital public seulement', 'Chambre individuelle', 'Clinique privée complète'],
  },
  {
    key:    'optique' as const,
    label:  'Optique',
    Icon:   IconOptique,
    levels: ['Pas de besoin particulier', 'Lunettes tous les 2 ans', 'Renouvellements fréquents'],
  },
  {
    key:    'dentaire' as const,
    label:  'Dentaire',
    Icon:   IconDentaire,
    levels: ['Contrôles uniquement', 'Couronnes & prothèses', 'Orthodontie incluse'],
  },
] as const;

// ─── component ───────────────────────────────────────────────────────────────

interface Props {
  data:    NeedsTunerData;
  onApply: (needs: NeedsTunerData) => void;
}

export function NeedsTuner({ data, onApply }: Props) {
  const [needs, setNeeds] = useState<NeedsTunerData>(data);
  const isDirty = JSON.stringify(needs) !== JSON.stringify(data);

  function set(key: keyof NeedsTunerData, v: number) {
    setNeeds(n => ({ ...n, [key]: Math.max(1, Math.min(3, v)) }));
  }

  function pct(v: number) {
    return `${((v - 1) / 2) * 100}%`;
  }

  return (
    <div className="mt-3 rounded-2xl border border-border overflow-hidden max-w-md animate-fade-up">
      {/* Header */}
      <div className="bg-elevated px-4 py-3 border-b border-border flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Affiner mes garanties</p>
          <p className="text-xs text-muted mt-0.5">
            Ajuste les curseurs pour voir l'impact sur les tarifs.
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-medium text-muted bg-white border border-border rounded-full px-2 py-0.5 mt-0.5">
          Optionnel
        </span>
      </div>

      <div className="p-4 bg-white flex flex-col gap-5">
        {SLIDERS.map(({ key, label, Icon, levels }) => {
          const val = needs[key];
          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2.5">
                <Icon />
                <span className="text-sm font-semibold text-gray-900">{label}</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Minus */}
                <button
                  onClick={() => set(key, val - 1)}
                  disabled={val <= 1}
                  className="shrink-0 w-9 h-9 rounded-full bg-da-blue disabled:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <svg width="14" height="2" viewBox="0 0 14 2" fill="none">
                    <rect width="14" height="2" rx="1" fill="white" />
                  </svg>
                </button>

                {/* Track */}
                <input
                  type="range"
                  min={1} max={3} step={1}
                  value={val}
                  onChange={e => set(key, Number(e.target.value))}
                  className="needs-slider flex-1"
                  style={{
                    background: `linear-gradient(to right, #E30613 0%, #E30613 ${pct(val)}, #e5e7eb ${pct(val)}, #e5e7eb 100%)`,
                  }}
                />

                {/* Plus */}
                <button
                  onClick={() => set(key, val + 1)}
                  disabled={val >= 3}
                  className="shrink-0 w-9 h-9 rounded-full bg-da-blue disabled:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="6" width="2" height="14" rx="1" fill="white" />
                    <rect y="6" width="14" height="2" rx="1" fill="white" />
                  </svg>
                </button>
              </div>

              <p className="text-xs text-muted mt-1.5 text-center">{levels[val - 1]}</p>
            </div>
          );
        })}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setNeeds(data)}
            disabled={!isDirty}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm text-muted hover:text-gray-700 hover:border-muted transition-colors disabled:opacity-40"
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115 0M20 15a9 9 0 01-15 0" />
            </svg>
            Réinitialiser
          </button>
          <button
            onClick={() => onApply(needs)}
            className="flex-1 py-2.5 rounded-xl bg-da-blue text-white text-sm font-medium hover:bg-da-blue-hover transition-colors"
          >
            Voir les formules →
          </button>
        </div>
      </div>
    </div>
  );
}
