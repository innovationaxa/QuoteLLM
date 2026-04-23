import { Answers, QuoteData } from '../types';

const BASE: Record<string, number> = { base: 25, medium: 45, premium: 80 };

const REGIME_MULT: Record<string, number> = {
  general: 1.0, independent: 1.15, agriculture: 0.95, student: 0.8, alsace_moselle: 0.9,
};

const BENE_MULT: Record<string, number> = {
  single: 1.0, couple: 1.75, family: 2.4, parent: 1.6,
};

const COVERAGE_LABELS: Record<string, string> = {
  base: 'Essentielle', medium: 'Confort', premium: 'Premium',
};

const REGIME_LABELS: Record<string, string> = {
  general: 'Régime général', independent: 'Travailleur indépendant',
  agriculture: 'MSA – Agriculture', student: 'Étudiant', alsace_moselle: 'Alsace-Moselle',
};

const BENE_LABELS: Record<string, string> = {
  single: 'Individuel', couple: 'Couple', family: 'Famille', parent: 'Parent isolé',
};

export function calculateQuote(answers: Required<Answers>): QuoteData {
  const [d, m, y] = answers.date_of_birth.split('/').map(Number);
  const dob = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  if (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate())) age--;

  const ageLoad = 1 + Math.max(0, age - 30) * 0.005;
  const monthly =
    Math.round(
      BASE[answers.coverage_level] *
      REGIME_MULT[answers.regime] *
      BENE_MULT[answers.beneficiaries] *
      ageLoad * 100,
    ) / 100;

  const ageBandLow = Math.floor(age / 10) * 10;

  return {
    monthlyPremium: monthly,
    annualPremium: Math.round(monthly * 12 * 100) / 100,
    coverageLabel: COVERAGE_LABELS[answers.coverage_level],
    regimeLabel: REGIME_LABELS[answers.regime],
    beneficiariesLabel: BENE_LABELS[answers.beneficiaries],
    ageBand: `${ageBandLow}–${ageBandLow + 9} ans`,
    postalCode: answers.postal_code,
  };
}
