import { Answers, QuickReplyOption } from '../types';

export interface Question {
  id: keyof Answers;
  prompt: string;
  type: 'text' | 'choice';
  placeholder?: string;
  options?: QuickReplyOption[];
  validate?: (v: string) => string | null;
}

export const CONSENT_TEXT =
  `Bonjour ! Je suis l'assistant **Direct Assurances**.

Je vais vous aider à obtenir un **devis Santé indicatif** en 5 questions rapides.

**Avant de commencer :**
- Ce devis est indicatif et non contractuel
- Aucune donnée nominative (nom, e-mail) n'est collectée ici
- Vous pouvez arrêter à tout moment

*Vos données sont traitées conformément au RGPD, en minimisation stricte.*`;

export const QUESTIONS: Question[] = [
  {
    id: 'date_of_birth',
    prompt: 'Quelle est votre **date de naissance** ?\n\n*Format attendu : JJ/MM/AAAA*',
    type: 'text',
    placeholder: 'Ex : 15/03/1985',
    validate: (v) => {
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(v.trim()))
        return "Merci d'entrer la date au format JJ/MM/AAAA (ex : 15/03/1985).";
      const [d, m, y] = v.trim().split('/').map(Number);
      const date = new Date(y, m - 1, d);
      if (isNaN(date.getTime()) || date.getMonth() !== m - 1) return 'Date invalide.';
      const age = new Date().getFullYear() - y;
      if (age < 18 || age > 85) return 'Vous devez avoir entre 18 et 85 ans pour être éligible.';
      return null;
    },
  },
  {
    id: 'postal_code',
    prompt: 'Quel est votre **code postal** ?',
    type: 'text',
    placeholder: 'Ex : 75001',
    validate: (v) =>
      /^\d{5}$/.test(v.trim()) ? null : 'Le code postal doit contenir exactement 5 chiffres.',
  },
  {
    id: 'regime',
    prompt: 'Quel est votre **régime de sécurité sociale** ?',
    type: 'choice',
    options: [
      { value: 'general',        label: 'Régime général (salarié)',      emoji: '🏢' },
      { value: 'independent',    label: 'Travailleur indépendant (TNS)', emoji: '💼' },
      { value: 'agriculture',    label: 'MSA – Agriculture',             emoji: '🌾' },
      { value: 'student',        label: 'Étudiant',                      emoji: '🎓' },
      { value: 'alsace_moselle', label: 'Alsace-Moselle',                emoji: '🗺️' },
    ],
  },
  {
    id: 'beneficiaries',
    prompt: 'Qui souhaitez-vous **couvrir** ?',
    type: 'choice',
    options: [
      { value: 'single', label: 'Moi seul(e)',                    emoji: '👤' },
      { value: 'couple', label: 'Moi et mon/ma conjoint(e)',      emoji: '👫' },
      { value: 'family', label: 'Ma famille (avec enfant(s))',    emoji: '👨‍👩‍👧' },
      { value: 'parent', label: 'Moi et mes enfant(s)',           emoji: '👨‍👧' },
    ],
  },
  {
    id: 'coverage_level',
    prompt: 'Quel **niveau de garanties** vous correspond ?',
    type: 'choice',
    options: [
      { value: 'base',    label: 'Essentielle – Couverture de base',   emoji: '🔵' },
      { value: 'medium',  label: 'Confort – Bon équilibre',            emoji: '🟡' },
      { value: 'premium', label: 'Premium – Couverture maximale',      emoji: '🟣' },
    ],
  },
];
