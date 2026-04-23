import { Answers, FormulaResult, QuoteResult, RecapData } from '../types';

// ─── formula definitions ──────────────────────────────────────────────────────

const FORMULA_CONFIG: Array<Omit<FormulaResult, 'monthlyPremium' | 'annualPremium' | 'recommended'>> = [
  {
    id: 'essentielle', name: 'Essentielle', color: 'blue',
    tagline: 'Les garanties juste au cas où',
    coverage: {
      soins:          'Soins courants jusqu\'à 100%',
      hospitalisation:'Hospitalisation jusqu\'à 100%',
      optique:        'Optique jusqu\'à 100%',
      dentaire:       'Dentaire jusqu\'à 100%',
    },
  },
  {
    id: 'essentielle_plus', name: 'Essentielle +', color: 'yellow',
    tagline: "L'essentiel, lunettes et lentilles en plus",
    coverage: {
      soins:          'Soins courants jusqu\'à 100%',
      hospitalisation:'Hospitalisation jusqu\'à 100%',
      optique:        'Optique jusqu\'à 200 €',
      dentaire:       'Dentaire jusqu\'à 125%',
    },
  },
  {
    id: 'equilibre', name: 'Équilibre', color: 'purple',
    tagline: 'La formule douce et cocooning',
    coverage: {
      soins:          'Soins courants jusqu\'à 120%',
      hospitalisation:'Hospitalisation jusqu\'à 120%',
      optique:        'Optique jusqu\'à 200 €',
      dentaire:       'Dentaire jusqu\'à 110%',
    },
  },
];

// Base monthly rates (adult, single, régime général, age 30, in €/month)
const BASE: Record<string, number> = { essentielle: 30, essentielle_plus: 45, equilibre: 62 };

const REGIME_MULT: Record<string, number> = {
  general: 1.0, independent: 1.15, agriculture: 0.95, student: 0.8, alsace_moselle: 0.9,
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function getAge(dob: string): number {
  const [d, m, y] = dob.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  if (now < new Date(now.getFullYear(), date.getMonth(), date.getDate())) age--;
  return Math.max(0, age);
}

function personCost(base: number, dob: string, regime: string): number {
  const age = getAge(dob);
  const ageLoad = 1 + Math.max(0, age - 30) * 0.005;
  return base * ageLoad * (REGIME_MULT[regime] ?? 1.0);
}

function getRecommendedId(a: Answers): string {
  let score = 0;
  if (a.doctors_need === 'intensive') score += 3;
  else if (a.doctors_need === 'regular') score += 2;
  if (a.hospitalization_need === 'premium') score += 3;
  else if (a.hospitalization_need === 'comfort') score += 2;
  if (a.optics_need === 'enhanced') score += 2;
  else if (a.optics_need === 'standard') score += 1;
  if (a.dental_need === 'orthodontics') score += 2;
  else if (a.dental_need === 'prosthetics') score += 1;
  if (score >= 8) return 'equilibre';
  if (score >= 4) return 'essentielle_plus';
  return 'essentielle';
}

function buildRecommendationReason(recommendedId: string, a: Answers): string {
  const name = FORMULA_CONFIG.find(f => f.id === recommendedId)?.name ?? recommendedId;
  const reasons: string[] = [];
  if (a.hospitalization_need === 'premium' || a.hospitalization_need === 'comfort')
    reasons.push('votre besoin en hospitalisation');
  if (a.optics_need === 'enhanced' || a.optics_need === 'standard')
    reasons.push('votre couverture optique');
  if (a.dental_need !== 'routine')
    reasons.push('vos besoins dentaires');
  if (a.family_composition === 'family' || a.family_composition === 'parent')
    reasons.push('la présence d\'enfants dans votre foyer');
  const reasonStr = reasons.length
    ? `notamment pour ${reasons.slice(0, 2).join(' et ')}`
    : 'en adéquation avec votre profil';
  return `La formule **${name}** est recommandée pour vous, ${reasonStr}.`;
}

// ─── main export ─────────────────────────────────────────────────────────────

export function calculateQuote(a: Answers): QuoteResult {
  const recommendedId = getRecommendedId(a);

  const formulas: FormulaResult[] = FORMULA_CONFIG.map(config => {
    const base = BASE[config.id];

    let monthly = personCost(base, a.date_of_birth!, a.regime!);

    if (a.family_composition === 'couple' || a.family_composition === 'family') {
      monthly += personCost(base, a.partner_birth!, a.partner_regime!) * 0.9;
    }

    if (a.family_composition === 'family' || a.family_composition === 'parent') {
      const count = Math.min(a.children_count ?? 0, 4);
      for (let i = 0; i < count; i++) {
        const dob = a.children_births?.[i];
        monthly += dob ? personCost(base * 0.3, dob, 'general') : base * 0.3;
      }
    }

    monthly = Math.round(monthly * 100) / 100;
    return { ...config, monthlyPremium: monthly, annualPremium: Math.round(monthly * 12 * 100) / 100, recommended: config.id === recommendedId };
  });

  return { formulas, recommendedId, recommendationReason: buildRecommendationReason(recommendedId, a) };
}

// ─── recap builder ────────────────────────────────────────────────────────────

const FAMILY_LABELS: Record<string, string> = {
  single: 'Individuel', couple: 'Couple', family: 'Famille', parent: 'Parent isolé',
};
const REGIME_LABELS: Record<string, string> = {
  general: 'Régime général', independent: 'Travailleur indépendant',
  agriculture: 'MSA – Agriculture', student: 'Étudiant', alsace_moselle: 'Alsace-Moselle',
};
const START_LABELS: Record<string, string> = {
  next_month: '1er du mois prochain', in_3_months: 'Dans 3 mois', in_6_months: 'Dans 6 mois',
};
const INSURED_LABELS: Record<string, string> = {
  yes_long: "Oui, depuis plus d'1 an", yes_short: "Oui, depuis moins d'1 an", no: 'Non',
};
const DOCTORS_LABELS: Record<string, string> = {
  routine: 'Consultations de routine', regular: 'Suivi régulier spécialistes', intensive: 'Suivi intensif',
};
const HOSPI_LABELS: Record<string, string> = {
  minimum: 'Couverture minimum', comfort: 'Chambre individuelle', premium: 'Couverture totale',
};
const OPTICS_LABELS: Record<string, string> = {
  minimum: 'Pas de besoin particulier', standard: 'Lunettes tous les 2 ans', enhanced: 'Renouvellement fréquent',
};
const DENTAL_LABELS: Record<string, string> = {
  routine: 'Visites de contrôle', prosthetics: 'Couronnes & prothèses', orthodontics: 'Orthodontie',
};

export function buildRecapData(a: Answers): RecapData {
  const situation = [
    { icon: '👥', label: 'Couverture',      value: FAMILY_LABELS[a.family_composition ?? ''] ?? '' },
    { icon: '🗓️', label: 'Votre naissance', value: a.date_of_birth ?? '' },
    { icon: '📍', label: 'Code postal',     value: a.postal_code ?? '' },
    { icon: '⚕️', label: 'Régime SS',       value: REGIME_LABELS[a.regime ?? ''] ?? '' },
  ];

  if (a.family_composition === 'couple' || a.family_composition === 'family') {
    situation.push({ icon: '👫', label: 'Naissance conjoint(e)', value: a.partner_birth ?? '' });
  }

  if ((a.family_composition === 'family' || a.family_composition === 'parent') && a.children_count) {
    situation.push({ icon: '👧', label: 'Enfants couverts', value: `${a.children_count}` });
  }

  situation.push(
    { icon: '🔒', label: 'Assuré actuellement', value: INSURED_LABELS[a.currently_insured ?? ''] ?? '' },
    { icon: '📅', label: 'Démarrage souhaité',  value: START_LABELS[a.start_date ?? ''] ?? '' },
  );

  const besoins = [
    { icon: '👨‍⚕️', label: 'Médecins',         value: DOCTORS_LABELS[a.doctors_need ?? ''] ?? '' },
    { icon: '🏥',  label: 'Hospitalisation',   value: HOSPI_LABELS[a.hospitalization_need ?? ''] ?? '' },
    { icon: '👓',  label: 'Optique',            value: OPTICS_LABELS[a.optics_need ?? ''] ?? '' },
    { icon: '🦷',  label: 'Dentaire',           value: DENTAL_LABELS[a.dental_need ?? ''] ?? '' },
  ];

  return { situation, besoins };
}
