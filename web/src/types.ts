export type MessageRole = 'assistant' | 'user';

export type WidgetType =
  | 'consent-card'
  | 'quick-reply'
  | 'section-divider'
  | 'calculating'
  | 'recap-confirm'
  | 'formula-comparison'
  | 'contact-cta';

export interface QuickReplyOption {
  value: string;
  label: string;
  emoji?: string;
}

export interface RecapItem  { icon: string; label: string; value: string }
export interface RecapData  { situation: RecapItem[]; besoins: RecapItem[] }

export interface FormulaResult {
  id: string;
  name: string;
  tagline: string;
  monthlyPremium: number;
  annualPremium: number;
  coverage: { soins: string; hospitalisation: string; optique: string; dentaire: string };
  recommended: boolean;
  color: 'blue' | 'yellow' | 'purple';
}

export interface QuoteResult {
  formulas: FormulaResult[];
  recommendedId: string;
  recommendationReason: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  widget?: WidgetType;
  widgetData?: QuickReplyOption[] | RecapData | QuoteResult | { label: string };
  questionId?: string; // set for quick-reply widgets to avoid ambiguous option matching
  consumed?: boolean;
}

export interface Answers {
  family_composition?: string;
  date_of_birth?: string;
  regime?: string;
  postal_code?: string;
  partner_birth?: string;
  partner_regime?: string;
  children_count?: number;
  children_births?: string[];
  currently_insured?: string;
  wants_cancellation?: string;
  start_date?: string;
  doctors_need?: string;
  hospitalization_need?: string;
  optics_need?: string;
  dental_need?: string;
}
