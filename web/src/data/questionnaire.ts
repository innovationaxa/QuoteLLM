import { Answers, QuickReplyOption } from '../types';

export interface Question {
  id: string;
  prompt: string;
  type: 'text' | 'choice';
  placeholder?: string;
  options?: QuickReplyOption[];
  validate?: (v: string) => string | null;
  section: 'situation' | 'besoins';
}

export const CONSENT_TEXT =
  `Bonjour ! Je suis l'assistant **Direct Assurances**.

Je vais vous aider à obtenir un **devis Santé indicatif** en quelques questions.

**Avant de commencer :**
- Ce devis est indicatif et non contractuel
- Aucune donnée nominative (nom, e-mail) n'est collectée ici
- Vous pouvez arrêter à tout moment

*Vos données sont traitées conformément au RGPD, en minimisation stricte.*`;

// ─── validators ───────────────────────────────────────────────────────────────

function validateDob(v: string): string | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(v.trim()))
    return "Merci d'entrer la date au format JJ/MM/AAAA (ex : 15/03/1985).";
  const [d, m, y] = v.trim().split('/').map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime()) || date.getMonth() !== m - 1) return 'Date invalide.';
  const age = new Date().getFullYear() - y;
  if (age < 18 || age > 85) return 'Vous devez avoir entre 18 et 85 ans pour être éligible.';
  return null;
}

function validateChildDob(v: string): string | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(v.trim()))
    return "Merci d'entrer la date au format JJ/MM/AAAA.";
  const [d, m, y] = v.trim().split('/').map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime()) || date.getMonth() !== m - 1) return 'Date invalide.';
  const age = new Date().getFullYear() - y;
  if (age < 0 || age > 25) return "L'enfant doit avoir moins de 25 ans.";
  return null;
}

const validatePartnerDob = validateDob;

// ─── static questions ─────────────────────────────────────────────────────────

const REGIME_OPTIONS: QuickReplyOption[] = [
  { value: 'general',        label: 'Régime général (salarié)',      emoji: '🏢' },
  { value: 'independent',    label: 'Travailleur indépendant (TNS)', emoji: '💼' },
  { value: 'agriculture',    label: 'MSA – Agriculture',             emoji: '🌾' },
  { value: 'student',        label: 'Étudiant',                      emoji: '🎓' },
  { value: 'alsace_moselle', label: 'Alsace-Moselle',                emoji: '🗺️' },
];

const STATIC: Record<string, Question> = {
  family_composition: {
    id: 'family_composition', section: 'situation',
    prompt: 'Pour commencer, **qui souhaitez-vous couvrir** ?',
    type: 'choice',
    options: [
      { value: 'single', label: 'Moi seul(e)',                    emoji: '👤' },
      { value: 'couple', label: 'Moi et mon/ma conjoint(e)',      emoji: '👫' },
      { value: 'family', label: 'Ma famille (conjoint + enfants)', emoji: '👨‍👩‍👧' },
      { value: 'parent', label: 'Moi et mes enfant(s)',           emoji: '👨‍👧' },
    ],
  },
  date_of_birth: {
    id: 'date_of_birth', section: 'situation',
    prompt: 'Quelle est votre **date de naissance** ?\n\n*Format : JJ/MM/AAAA*',
    type: 'text', placeholder: 'Ex : 15/03/1985', validate: validateDob,
  },
  regime: {
    id: 'regime', section: 'situation',
    prompt: 'Quel est votre **régime de sécurité sociale** ?',
    type: 'choice', options: REGIME_OPTIONS,
  },
  postal_code: {
    id: 'postal_code', section: 'situation',
    prompt: 'Quel est votre **code postal** ?',
    type: 'text', placeholder: 'Ex : 75001',
    validate: (v) => /^\d{5}$/.test(v.trim()) ? null : 'Le code postal doit contenir exactement 5 chiffres.',
  },
  partner_birth: {
    id: 'partner_birth', section: 'situation',
    prompt: 'Quelle est la date de naissance de votre **conjoint(e)** ?\n\n*Format : JJ/MM/AAAA*',
    type: 'text', placeholder: 'Ex : 29/06/1980', validate: validatePartnerDob,
  },
  partner_regime: {
    id: 'partner_regime', section: 'situation',
    prompt: 'Quel est le **régime de sécurité sociale** de votre conjoint(e) ?',
    type: 'choice', options: REGIME_OPTIONS,
  },
  children_count: {
    id: 'children_count', section: 'situation',
    prompt: "Combien d'**enfants** souhaitez-vous couvrir ?",
    type: 'choice',
    options: [
      { value: '1', label: '1 enfant',          emoji: '1️⃣' },
      { value: '2', label: '2 enfants',         emoji: '2️⃣' },
      { value: '3', label: '3 enfants',         emoji: '3️⃣' },
      { value: '4', label: '4 enfants ou plus', emoji: '4️⃣' },
    ],
  },
  currently_insured: {
    id: 'currently_insured', section: 'situation',
    prompt: 'Êtes-vous **actuellement assuré(e)** en complémentaire santé ?',
    type: 'choice',
    options: [
      { value: 'yes_long',  label: "Oui, depuis plus d'1 an",    emoji: '✅' },
      { value: 'yes_short', label: "Oui, depuis moins d'1 an",   emoji: '⏳' },
      { value: 'no',        label: 'Non',                        emoji: '❌' },
    ],
  },
  wants_cancellation: {
    id: 'wants_cancellation', section: 'situation',
    prompt: 'Souhaitez-vous que **Direct Assurances résilie** votre contrat actuel pour vous ?',
    type: 'choice',
    options: [
      { value: 'yes', label: 'Oui, je le souhaite',    emoji: '✅' },
      { value: 'no',  label: "Non, je m'en occuperai", emoji: '🙋' },
    ],
  },
  start_date: {
    id: 'start_date', section: 'situation',
    prompt: 'À quelle **date souhaitez-vous démarrer** votre assurance santé ?',
    type: 'choice',
    options: [
      { value: 'next_month',   label: 'Le plus tôt possible (1er du mois prochain)', emoji: '📅' },
      { value: 'in_3_months',  label: 'Dans 3 mois',                                emoji: '🗓️' },
      { value: 'in_6_months',  label: 'Dans 6 mois',                                emoji: '📆' },
    ],
  },
  doctors_need: {
    id: 'doctors_need', section: 'besoins',
    prompt: 'Pour les **consultations médicales** (médecin traitant, spécialistes), quel est votre besoin ?',
    type: 'choice',
    options: [
      { value: 'routine',   label: 'Consultations de routine uniquement',       emoji: '🩺' },
      { value: 'regular',   label: 'Suivi régulier de spécialistes',            emoji: '👨‍⚕️' },
      { value: 'intensive', label: 'Suivi intensif ou médecines douces',        emoji: '🏥' },
    ],
  },
  hospitalization_need: {
    id: 'hospitalization_need', section: 'besoins',
    prompt: "En cas d'**hospitalisation**, quel niveau de couverture souhaitez-vous ?",
    type: 'choice',
    options: [
      { value: 'minimum', label: 'Couverture minimum (hôpital public)',       emoji: '🔵' },
      { value: 'comfort', label: 'Chambre individuelle & dépassements',       emoji: '🟡' },
      { value: 'premium', label: 'Couverture totale, cliniques privées',      emoji: '🟣' },
    ],
  },
  optics_need: {
    id: 'optics_need', section: 'besoins',
    prompt: "Pour l'**optique** (lunettes, lentilles), quel est votre besoin ?",
    type: 'choice',
    options: [
      { value: 'minimum',  label: 'Pas de besoin particulier',              emoji: '👁️' },
      { value: 'standard', label: 'Lunettes tous les 2 ans',                emoji: '👓' },
      { value: 'enhanced', label: 'Renouvellement fréquent ou lentilles',   emoji: '🔍' },
    ],
  },
  dental_need: {
    id: 'dental_need', section: 'besoins',
    prompt: 'Pour le **dentaire**, quel est votre besoin ?',
    type: 'choice',
    options: [
      { value: 'routine',      label: 'Visites de contrôle uniquement',        emoji: '🦷' },
      { value: 'prosthetics',  label: 'Couronnes & prothèses possibles',       emoji: '🔧' },
      { value: 'orthodontics', label: 'Orthodontie (adulte ou enfant)',         emoji: '😁' },
    ],
  },
};

// ─── skip logic ───────────────────────────────────────────────────────────────

export function getNextQuestionId(answers: Answers): string | null {
  const a = answers;

  if (!a.family_composition)  return 'family_composition';
  if (!a.date_of_birth)       return 'date_of_birth';
  if (!a.regime)              return 'regime';
  if (!a.postal_code)         return 'postal_code';

  if (a.family_composition === 'couple' || a.family_composition === 'family') {
    if (!a.partner_birth)  return 'partner_birth';
    if (!a.partner_regime) return 'partner_regime';
  }

  if (a.family_composition === 'family' || a.family_composition === 'parent') {
    if (a.children_count === undefined) return 'children_count';
    const count = Math.min(a.children_count, 4);
    for (let i = 0; i < count; i++) {
      if (!a.children_births?.[i]) return `child_${i}_birth`;
    }
  }

  if (!a.currently_insured)                            return 'currently_insured';
  if (a.currently_insured !== 'no' && !a.wants_cancellation) return 'wants_cancellation';
  if (!a.start_date)                                   return 'start_date';

  if (!a.doctors_need)         return 'doctors_need';
  if (!a.hospitalization_need) return 'hospitalization_need';
  if (!a.optics_need)          return 'optics_need';
  if (!a.dental_need)          return 'dental_need';

  return null;
}

// ─── question factory ─────────────────────────────────────────────────────────

export function getQuestion(id: string): Question {
  if (id.startsWith('child_')) {
    const idx = parseInt(id.split('_')[1]);
    const ordinals = ['premier(e)', 'deuxième', 'troisième', 'quatrième'];
    return {
      id, section: 'situation',
      prompt: `Quelle est la date de naissance de votre **${ordinals[idx] ?? `${idx + 1}ème`} enfant** ?\n\n*Format : JJ/MM/AAAA*`,
      type: 'text', placeholder: 'Ex : 16/08/2010', validate: validateChildDob,
    };
  }
  const q = STATIC[id];
  if (!q) throw new Error(`Unknown question id: ${id}`);
  return q;
}

export function getSectionOf(id: string): 'situation' | 'besoins' {
  if (id.startsWith('child_') || id === 'partner_birth') return 'situation';
  return STATIC[id]?.section ?? 'situation';
}

export const SITUATION_QUESTION_IDS = [
  'family_composition', 'date_of_birth', 'regime', 'postal_code',
  'partner_birth', 'partner_regime', 'children_count',
  'child_0_birth', 'child_1_birth', 'child_2_birth', 'child_3_birth',
  'currently_insured', 'wants_cancellation', 'start_date',
];

export const BESOINS_QUESTION_IDS = [
  'doctors_need', 'hospitalization_need', 'optics_need', 'dental_need',
];
