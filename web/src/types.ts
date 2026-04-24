export type MessageRole = 'assistant' | 'user';

export type WidgetType =
  | 'consent-card'
  | 'quick-reply'
  | 'section-divider'
  | 'calculating'
  | 'formula-comparison'
  | 'quick-estimate'
  | 'cta-card';

export interface QuickReplyOption {
  value: string;
  label: string;
  emoji?: string;
}

export interface RecapItem  { icon: string; label: string; value: string }
export interface RecapData  { situation: RecapItem[]; besoins: RecapItem[] }

export interface QuickEstimateData {
  currentMonthly: number | null;
  rangeMin:        number;
  rangeMax:        number;
  notInsured:      boolean;
}

export interface FormulaResult {
  id:             string;
  name:           string;
  tagline:        string;
  monthlyPremium: number;
  annualPremium:  number;
  coverage: { soins: string; hospitalisation: string; optique: string; dentaire: string };
  recommended:    boolean;
  color:          'blue' | 'yellow' | 'purple';
  monthlySaving?: number;
}

export interface QuoteResult {
  formulas:             FormulaResult[];
  recommendedId:        string;
  recommendationReason: string;
  currentMonthlyPrice?: number;
  currentInsurer?:      string;
}

export interface ChatMessage {
  id:          string;
  role:        MessageRole;
  content:     string;
  timestamp:   Date;
  widget?:     WidgetType;
  widgetData?: QuickReplyOption[] | RecapData | QuoteResult | QuickEstimateData | { label: string };
  questionId?: string;
  consumed?:   boolean;
}

export interface Answers {
  // Phase 1 – contexte
  intention?:         string;
  currently_insured?: string;
  current_price?:     string;
  current_insurer?:   string;
  // Phase 2 – profil
  date_of_birth?:     string;
  family_composition?: string;
  regime?:            string;
  postal_code?:       string;
  // Phase 3 – besoins
  hospitalization_need?: string;
  optics_need?:          string;
  dental_need?:          string;
  // Conservés pour usage futur
  partner_birth?:    string;
  partner_regime?:   string;
  children_count?:   number;
  children_births?:  string[];
  doctors_need?:     string;
}
