import { Answers, FormulaResult, QuoteResult, QuickEstimateData, NeedsTunerData } from '../types';

// ─── formula definitions ──────────────────────────────────────────────────────

const FORMULA_CONFIG: Array<Omit<FormulaResult, 'monthlyPremium' | 'annualPremium' | 'recommended' | 'monthlySaving'>> = [
  {
    id: 'essentielle', name: 'Essentielle', color: 'blue',
    tagline: 'Les garanties juste au cas où',
    coverage: {
      soins:           'Soins courants 100% BR',
      hospitalisation: 'Hospitalisation 100% BR',
      optique:         'Optique 100% (plafond SS)',
      dentaire:        'Dentaire 100% BR',
    },
  },
  {
    id: 'essentielle_plus', name: 'Essentielle +', color: 'yellow',
    tagline: "L'essentiel + bonne couverture optique",
    coverage: {
      soins:           'Soins courants 100% BR',
      hospitalisation: 'Hospitalisation 100% + chambre individuelle',
      optique:         "Optique jusqu'à 200 €/an",
      dentaire:        "Dentaire jusqu'à 125% BR",
    },
  },
  {
    id: 'equilibre', name: 'Équilibre', color: 'purple',
    tagline: 'La formule complète et confortable',
    coverage: {
      soins:           'Soins courants 120% BR',
      hospitalisation: 'Hospitalisation 120% + clinique privée',
      optique:         "Optique jusqu'à 300 €/an",
      dentaire:        "Dentaire jusqu'à 150% BR",
    },
  },
];

const BASE: Record<string, number> = {
  essentielle: 30, essentielle_plus: 45, equilibre: 62,
};

const REGIME_MULT: Record<string, number> = {
  general: 1.0, independent: 1.15, agriculture: 0.95,
  student: 0.8, alsace_moselle: 0.9, other: 1.0,
};

const FAMILY_MULT: Record<string, number> = {
  single: 1.0,
  couple: 1.85,
  family: 2.15,
  parent: 1.3,
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
  if (a.hospitalization_need === 'premium')       score += 3;
  else if (a.hospitalization_need === 'comfort')  score += 2;
  if (a.optics_need === 'enhanced')               score += 2;
  else if (a.optics_need === 'standard')          score += 1;
  if (a.dental_need === 'orthodontics')           score += 2;
  else if (a.dental_need === 'prosthetics')       score += 1;
  if (score >= 5) return 'equilibre';
  if (score >= 2) return 'essentielle_plus';
  return 'essentielle';
}

function buildRecommendationReason(recommendedId: string, a: Answers): string {
  const name = FORMULA_CONFIG.find(f => f.id === recommendedId)?.name ?? recommendedId;
  const reasons: string[] = [];
  if (a.hospitalization_need === 'premium' || a.hospitalization_need === 'comfort')
    reasons.push('ton besoin en hospitalisation');
  if (a.optics_need === 'enhanced' || a.optics_need === 'standard')
    reasons.push('ta couverture optique');
  if (a.dental_need === 'orthodontics' || a.dental_need === 'prosthetics')
    reasons.push('tes besoins dentaires');
  if (a.family_composition === 'family' || a.family_composition === 'parent')
    reasons.push("la présence d'enfants dans ton foyer");
  const reasonStr = reasons.length
    ? `notamment pour ${reasons.slice(0, 2).join(' et ')}`
    : 'en adéquation avec ton profil';
  return `La formule **${name}** est recommandée pour toi, ${reasonStr}.`;
}

function parsePrice(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = parseFloat(raw.replace(',', '.').replace(/[€\s]/g, ''));
  return isNaN(n) || n <= 0 ? undefined : Math.round(n);
}

// ─── exports ──────────────────────────────────────────────────────────────────

// ─── needs tuner helpers ──────────────────────────────────────────────────────

const HOSP_MAP = ['minimum', 'comfort', 'premium'];
const OPT_MAP  = ['minimum', 'standard', 'enhanced'];
const DENT_MAP = ['routine', 'prosthetics', 'orthodontics'];
// Extra €/month per soins level (applied before family mult)
const SOINS_EXTRA = [0, 0, 3, 7];

export function answersToTuner(a: Answers): NeedsTunerData {
  return {
    soins:           2,
    hospitalisation: a.hospitalization_need === 'premium' ? 3 : a.hospitalization_need === 'comfort' ? 2 : 1,
    optique:         a.optics_need === 'enhanced' ? 3 : a.optics_need === 'standard' ? 2 : 1,
    dentaire:        a.dental_need === 'orthodontics' ? 3 : a.dental_need === 'prosthetics' ? 2 : 1,
  };
}

export function calculateQuoteFromTuner(base: Answers, t: NeedsTunerData): QuoteResult {
  const merged: Answers = {
    ...base,
    hospitalization_need: HOSP_MAP[t.hospitalisation - 1],
    optics_need:          OPT_MAP[t.optique - 1],
    dental_need:          DENT_MAP[t.dentaire - 1],
  };
  const quote = calculateQuote(merged);
  const famMult   = FAMILY_MULT[base.family_composition ?? 'single'] ?? 1.0;
  const soinsAdd  = Math.round((SOINS_EXTRA[t.soins] ?? 0) * famMult * 100) / 100;
  const currentMonthlyPrice = parsePrice(base.current_price);
  return {
    ...quote,
    formulas: quote.formulas.map(f => {
      const monthly = Math.round((f.monthlyPremium + soinsAdd) * 100) / 100;
      return {
        ...f,
        monthlyPremium: monthly,
        annualPremium:  Math.round(monthly * 12 * 100) / 100,
        monthlySaving:  currentMonthlyPrice !== undefined
          ? Math.round((currentMonthlyPrice - monthly) * 10) / 10
          : undefined,
      };
    }),
  };
}

export function buildQuickEstimate(answers: Answers): QuickEstimateData {
  return {
    currentMonthly: parsePrice(answers.current_price) ?? null,
    rangeMin: 30,
    rangeMax: 85,
    notInsured: answers.currently_insured !== 'yes',
  };
}

export function calculateQuote(a: Answers): QuoteResult {
  const recommendedId = getRecommendedId(a);
  const dob    = a.date_of_birth ?? '01/01/1984';
  const regime = a.regime        ?? 'general';
  const famMult = FAMILY_MULT[a.family_composition ?? 'single'] ?? 1.0;
  const currentMonthlyPrice = parsePrice(a.current_price);

  const formulas: FormulaResult[] = FORMULA_CONFIG.map(config => {
    const base = BASE[config.id];
    const monthly = Math.round(personCost(base, dob, regime) * famMult * 100) / 100;
    const monthlySaving = currentMonthlyPrice !== undefined
      ? Math.round((currentMonthlyPrice - monthly) * 10) / 10
      : undefined;
    return {
      ...config,
      monthlyPremium: monthly,
      annualPremium: Math.round(monthly * 12 * 100) / 100,
      recommended: config.id === recommendedId,
      monthlySaving,
    };
  });

  return {
    formulas,
    recommendedId,
    recommendationReason: buildRecommendationReason(recommendedId, a),
    currentMonthlyPrice,
    currentInsurer: a.current_insurer,
  };
}
