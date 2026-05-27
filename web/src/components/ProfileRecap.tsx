import { ProfileRecapData } from '../types';

const REGIME_LABELS: Record<string, string> = {
  general: 'Salarié (régime général)', independent: 'Indépendant / TNS',
  agriculture: 'Agriculteur', student: 'Étudiant·e',
  alsace_moselle: 'Alsace-Moselle', other: 'Autre régime',
};
const FAMILY_LABELS: Record<string, string> = {
  single: 'Seul·e', couple: 'En couple',
  family: 'Couple avec enfants', parent: 'Parent solo',
};
const HOSPIT_LABELS: Record<string, string> = { minimum: '🛏️ Basique', comfort: '🏥 Confort', premium: '⭐ Premium' };
const OPTICS_LABELS: Record<string, string> = { minimum: '👓 Basique', standard: '🔍 Standard', enhanced: '✨ Renforcé' };
const DENTAL_LABELS: Record<string, string> = { routine: '🦷 Courant', prosthetics: '🔧 Prothèses', orthodontics: '😁 Orthodontie' };

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <span className="flex items-center gap-2 text-muted shrink-0">
        <span>{icon}</span><span>{label}</span>
      </span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  );
}

interface Props { data: ProfileRecapData; onConfirm: () => void; }

export function ProfileRecap({ data, onConfirm }: Props) {
  return (
    <div className="mt-3 rounded-2xl border border-border overflow-hidden max-w-md animate-fade-up">
      <div className="bg-elevated px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-gray-900">Récapitulatif de ton profil</p>
        <p className="text-xs text-muted mt-0.5">Tout est correct ?</p>
      </div>
      <div className="bg-white px-4 py-1 divide-y divide-border/50">
        <Row icon="🗓️" label="Date de naissance" value={data.date_of_birth} />
        <Row icon="💼" label="Régime SS"          value={REGIME_LABELS[data.regime] ?? data.regime} />
        <Row icon="👨‍👩‍👧" label="Situation"         value={FAMILY_LABELS[data.family_composition] ?? data.family_composition} />
        <Row icon="🏥" label="Hospitalisation"    value={HOSPIT_LABELS[data.hospitalization_need] ?? data.hospitalization_need} />
        <Row icon="👓" label="Optique"             value={OPTICS_LABELS[data.optics_need] ?? data.optics_need} />
        <Row icon="🦷" label="Dentaire"            value={DENTAL_LABELS[data.dental_need] ?? data.dental_need} />
      </div>
      <div className="px-4 py-3 bg-elevated border-t border-border">
        <button
          onClick={onConfirm}
          className="w-full py-3 rounded-full bg-da-blue hover:bg-da-blue-hover text-white text-sm font-semibold transition-colors"
        >
          Oui, calculer mon devis →
        </button>
      </div>
    </div>
  );
}
