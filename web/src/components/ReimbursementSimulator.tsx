import { useState } from 'react';
import { FormulaResult } from '../types';

// ─── data ─────────────────────────────────────────────────────────────────────

const SCENARIOS = [
  { id: 'dental_crown',   icon: '🦷', label: 'Couronne dentaire',      cost: 900  },
  { id: 'optician_prog',  icon: '👓', label: 'Lunettes progressives',  cost: 400  },
  { id: 'specialist',     icon: '👨‍⚕️', label: 'Spécialiste sect. 2',   cost: 50   },
  { id: 'gp_visit',       icon: '🩺', label: 'Médecin généraliste',    cost: 25   },
  { id: 'hospital_3d',    icon: '🏥', label: 'Hospit. 3 nuits',        cost: 1200 },
  { id: 'dental_implant', icon: '🦷', label: 'Implant dentaire',       cost: 1500 },
] as const;

interface SimRow { secu: number; mutuelle: number; remaining: number }

// Realistic illustrative values per scenario × formula (not contractual)
const REIMBURSEMENT: Record<string, Record<string, SimRow>> = {
  gp_visit: {
    essentielle:      { secu: 17, mutuelle: 7,   remaining: 1 },
    essentielle_plus: { secu: 17, mutuelle: 7,   remaining: 1 },
    equilibre:        { secu: 17, mutuelle: 7,   remaining: 1 },
  },
  specialist: {
    essentielle:      { secu: 16, mutuelle: 7,   remaining: 27 },
    essentielle_plus: { secu: 16, mutuelle: 15,  remaining: 19 },
    equilibre:        { secu: 16, mutuelle: 28,  remaining: 6  },
  },
  dental_crown: {
    essentielle:      { secu: 84, mutuelle: 36,  remaining: 780 },
    essentielle_plus: { secu: 84, mutuelle: 66,  remaining: 750 },
    equilibre:        { secu: 84, mutuelle: 96,  remaining: 720 },
  },
  optician_prog: {
    essentielle:      { secu: 5,  mutuelle: 15,  remaining: 380 },
    essentielle_plus: { secu: 5,  mutuelle: 195, remaining: 200 },
    equilibre:        { secu: 5,  mutuelle: 295, remaining: 100 },
  },
  hospital_3d: {
    essentielle:      { secu: 900, mutuelle: 120, remaining: 180 },
    essentielle_plus: { secu: 900, mutuelle: 240, remaining: 60  },
    equilibre:        { secu: 900, mutuelle: 290, remaining: 10  },
  },
  dental_implant: {
    essentielle:      { secu: 0, mutuelle: 0,   remaining: 1500 },
    essentielle_plus: { secu: 0, mutuelle: 100, remaining: 1400 },
    equilibre:        { secu: 0, mutuelle: 350, remaining: 1150 },
  },
};

// ─── sub-components ───────────────────────────────────────────────────────────

function FormulaCol({ f, scenario, row }: {
  f: FormulaResult;
  scenario: (typeof SCENARIOS)[number];
  row: SimRow;
}) {
  const coveragePct = Math.round(((scenario.cost - row.remaining) / scenario.cost) * 100);
  const remainColor = row.remaining === 0
    ? 'text-green-600'
    : row.remaining < 100
      ? 'text-orange-500'
      : 'text-da-blue';

  return (
    <div className={`rounded-2xl border p-3 flex flex-col gap-2 ${
      f.recommended ? 'border-da-blue/40 bg-red-50/40' : 'border-border bg-elevated'
    }`}>
      <p className={`text-xs font-semibold ${f.recommended ? 'text-da-blue' : 'text-gray-700'}`}>
        {f.name}{f.recommended && <span className="ml-1 opacity-70">★</span>}
      </p>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted">Sécu</span>
          <span className="font-medium text-gray-800">{row.secu} €</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted">Mutuelle</span>
          <span className="font-medium text-green-700">{row.mutuelle} €</span>
        </div>
      </div>

      {/* Coverage bar */}
      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${coveragePct}%` }}
        />
      </div>

      <div className="text-center pt-0.5">
        <p className="text-[10px] text-muted mb-0.5">Reste à charge</p>
        <p className={`text-base font-bold ${remainColor}`}>{row.remaining} €</p>
      </div>
    </div>
  );
}

// ─── component ────────────────────────────────────────────────────────────────

export interface ReimbursementSimulatorData {
  formulas:           FormulaResult[];
  currentInsurer?:    string;
  currentMonthlyPrice?: number;
}

export function ReimbursementSimulator({ formulas, currentInsurer, currentMonthlyPrice }: ReimbursementSimulatorData) {
  const [activeId, setActiveId] = useState<string>('dental_crown');
  const scenario = SCENARIOS.find(s => s.id === activeId)!;

  return (
    <div className="mt-3 rounded-[20px] border border-border overflow-hidden animate-fade-up max-w-2xl">
      {/* Header */}
      <div className="bg-elevated px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-gray-900">Que me rembourse chaque formule ?</p>
        <p className="text-xs text-muted mt-0.5">Simulation sur des soins courants · Valeurs indicatives non contractuelles</p>
      </div>

      <div className="bg-white px-4 pt-3">
        {/* Scenario pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                activeId === s.id
                  ? 'bg-da-blue text-white shadow-sm'
                  : 'border border-border text-gray-600 hover:border-da-blue/40'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Cost context */}
        <p className="text-xs text-muted mb-3">
          Coût total estimé : <strong className="text-gray-900">{scenario.cost.toLocaleString('fr-FR')} €</strong>
        </p>

        {/* Formula columns */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {formulas.map(f => {
            const row = REIMBURSEMENT[activeId]?.[f.id];
            if (!row) return null;
            return <FormulaCol key={f.id} f={f} scenario={scenario} row={row} />;
          })}
        </div>

        {/* Current insurer context banner */}
        {currentInsurer && currentMonthlyPrice && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-border text-xs text-muted mb-3">
            <span className="shrink-0 mt-0.5">📋</span>
            <span className="leading-relaxed">
              Votre contrat actuel&nbsp;
              <strong className="text-gray-800">{currentInsurer}</strong>
              &nbsp;({currentMonthlyPrice} €/mois) couvre généralement entre les niveaux <strong className="text-gray-800">Essentielle</strong> et <strong className="text-gray-800">Essentielle+</strong>.
            </span>
          </div>
        )}

        <p className="text-[10px] text-muted text-center pb-3">
          Simulations basées sur les tarifs conventionnels 2024 · Résultats personnels peuvent varier
        </p>
      </div>
    </div>
  );
}
