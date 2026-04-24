import { Answers, QuickReplyOption } from '../types';

export interface Question {
  id:           string;
  prompt:       string;
  type:         'text' | 'choice';
  placeholder?: string;
  options?:     QuickReplyOption[];
  validate?:    (v: string) => string | null;
  section:      'context' | 'refinement' | 'besoins';
}

export const CONSENT_TEXT =
`Bonjour 👋

Je suis là pour t'aider à vérifier si ta **mutuelle santé** est toujours adaptée — et si tu peux **payer moins cher**, ou être **mieux remboursé** à prix équivalent.

C'est indicatif, sans engagement. On regarde ensemble, puis tu décides.

*(Aucune donnée nominative collectée · Conforme RGPD)*`;

// ─── validators ───────────────────────────────────────────────────────────────

function validateDob(v: string): string | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(v.trim()))
    return "Merci d'entrer la date au format JJ/MM/AAAA (ex : 15/03/1985).";
  const [d, m, y] = v.trim().split('/').map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime()) || date.getMonth() !== m - 1) return 'Date invalide.';
  const age = new Date().getFullYear() - y;
  if (age < 18 || age > 85) return 'Tu dois avoir entre 18 et 85 ans pour être éligible.';
  return null;
}

// ─── questions ────────────────────────────────────────────────────────────────

const STATIC: Record<string, Question> = {
  intention: {
    id: 'intention', section: 'context',
    prompt: 'Pour commencer, tu es là pour…',
    type: 'choice',
    options: [
      { value: 'compare',  label: 'Comparer avec ma mutuelle actuelle', emoji: '🔍' },
      { value: 'price',    label: 'Vérifier si je paie trop cher',      emoji: '💰' },
      { value: 'coverage', label: 'Vérifier si je suis bien couvert',   emoji: '🛡️' },
      { value: 'explore',  label: 'Juste explorer mes options',         emoji: '🤔' },
    ],
  },
  currently_insured: {
    id: 'currently_insured', section: 'context',
    prompt: 'Tu as actuellement une mutuelle santé ?',
    type: 'choice',
    options: [
      { value: 'yes',     label: "Oui, j'en ai une",       emoji: '✅' },
      { value: 'no',      label: 'Non, pas de mutuelle',   emoji: '❌' },
      { value: 'unknown', label: 'Je ne suis pas sûr(e)',  emoji: '🤷' },
    ],
  },
  current_price: {
    id: 'current_price', section: 'context',
    prompt: 'Tu paies environ combien par mois pour ta mutuelle ?',
    type: 'text',
    placeholder: 'Ex : 45  (€/mois, approximatif)',
    validate: (v) => {
      const n = parseFloat(v.replace(',', '.').replace(/[€\s]/g, ''));
      if (isNaN(n) || n <= 0) return 'Saisis un montant en euros (ex : 45)';
      if (n > 800) return 'Ce montant semble élevé, tu peux vérifier ?';
      return null;
    },
  },
  date_of_birth: {
    id: 'date_of_birth', section: 'refinement',
    prompt: 'Quelle est ta **date de naissance** ?\n\n*Format : JJ/MM/AAAA*',
    type: 'text',
    placeholder: 'Ex : 15/03/1985',
    validate: validateDob,
  },
  family_composition: {
    id: 'family_composition', section: 'refinement',
    prompt: 'Tu cherches une couverture pour…',
    type: 'choice',
    options: [
      { value: 'single', label: 'Moi seul(e)',                   emoji: '🧑' },
      { value: 'couple', label: 'Moi + mon/ma conjoint(e)',      emoji: '👫' },
      { value: 'family', label: 'Ma famille (avec enfants)',     emoji: '👨‍👩‍👧' },
      { value: 'parent', label: 'Moi et mes enfant(s)',          emoji: '👨‍👧' },
    ],
  },
  regime: {
    id: 'regime', section: 'refinement',
    prompt: 'Ton **régime de sécurité sociale** ?',
    type: 'choice',
    options: [
      { value: 'general',     label: 'Régime général (salarié)',  emoji: '🏢' },
      { value: 'independent', label: 'Indépendant / TNS',         emoji: '💼' },
      { value: 'agriculture', label: 'MSA – Agriculture',         emoji: '🌾' },
      { value: 'student',     label: 'Étudiant',                  emoji: '🎓' },
      { value: 'other',       label: 'Autre / Je ne sais pas',    emoji: '❓' },
    ],
  },
  hospitalization_need: {
    id: 'hospitalization_need', section: 'besoins',
    prompt: "En cas d'**hospitalisation**, tu veux…",
    type: 'choice',
    options: [
      { value: 'minimum', label: 'Le minimum (hôpital public)',           emoji: '🔵' },
      { value: 'comfort', label: 'Chambre individuelle + dépassements',   emoji: '🟡' },
      { value: 'premium', label: 'Couverture complète, clinique privée', emoji: '🟣' },
    ],
  },
  optics_need: {
    id: 'optics_need', section: 'besoins',
    prompt: "Pour l'**optique** (lunettes, lentilles) ?",
    type: 'choice',
    options: [
      { value: 'minimum',  label: 'Pas de besoin particulier',            emoji: '👁️' },
      { value: 'standard', label: 'Lunettes tous les 2 ans',              emoji: '👓' },
      { value: 'enhanced', label: 'Renouvellement fréquent ou lentilles', emoji: '🔍' },
    ],
  },
  dental_need: {
    id: 'dental_need', section: 'besoins',
    prompt: 'Et pour le **dentaire** ?',
    type: 'choice',
    options: [
      { value: 'routine',      label: 'Visites de contrôle uniquement',   emoji: '😁' },
      { value: 'prosthetics',  label: 'Couronnes & prothèses possibles',  emoji: '🦷' },
      { value: 'orthodontics', label: 'Orthodontie (adulte ou enfant)',    emoji: '🔧' },
    ],
  },
};

// ─── skip logic ───────────────────────────────────────────────────────────────

export function getNextQuestionId(answers: Answers): string | null {
  const a = answers;

  // Phase 1 – contexte
  if (!a.intention)         return 'intention';
  if (!a.currently_insured) return 'currently_insured';
  if (a.currently_insured === 'yes' && !a.current_price && !a.doc_upload_skipped) return 'current_price';

  // Phase 2 – profil
  if (!a.date_of_birth)      return 'date_of_birth';
  if (!a.family_composition) return 'family_composition';
  if (!a.regime)             return 'regime';

  // Phase 3 – besoins
  if (!a.hospitalization_need) return 'hospitalization_need';
  if (!a.optics_need)          return 'optics_need';
  if (!a.dental_need)          return 'dental_need';

  return null;
}

export function getQuestion(id: string): Question {
  const q = STATIC[id];
  if (!q) throw new Error(`Unknown question id: ${id}`);
  return q;
}

export function getSectionOf(id: string): 'context' | 'refinement' | 'besoins' {
  return STATIC[id]?.section ?? 'context';
}

export function getIntentionContextMessage(intention: string): string {
  const MESSAGES: Record<string, string> = {
    compare:  'Parfait. On va regarder ce que propose Direct Assurance **par rapport à ta mutuelle actuelle**.',
    price:    'Bien sûr. On va vérifier si tu peux trouver **la même couverture moins cher**.',
    coverage: "On va regarder ça ensemble. L'idée : vérifier que tu es **bien protégé(e) là où ça compte**.",
    explore:  'Pas de problème. Je vais te montrer ce qui existe, **sans jargon et sans engagement**.',
  };
  return MESSAGES[intention] ?? 'Parfait, on y va.';
}
