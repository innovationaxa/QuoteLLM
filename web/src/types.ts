export type MessageRole = 'assistant' | 'user';

export type WidgetType =
  | 'consent-card'
  | 'quick-reply'
  | 'calculating'
  | 'quote-card'
  | 'contact-cta';

export interface QuickReplyOption {
  value: string;
  label: string;
  emoji?: string;
}

export interface QuoteData {
  monthlyPremium: number;
  annualPremium: number;
  coverageLabel: string;
  regimeLabel: string;
  beneficiariesLabel: string;
  ageBand: string;
  postalCode: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  widget?: WidgetType;
  widgetData?: QuickReplyOption[] | QuoteData;
  consumed?: boolean;
}

export type Step =
  | 'start'
  | 'consent'
  | 'date_of_birth'
  | 'postal_code'
  | 'regime'
  | 'beneficiaries'
  | 'coverage_level'
  | 'calculating'
  | 'result'
  | 'contact'
  | 'done';

export interface Answers {
  date_of_birth?: string;
  postal_code?: string;
  regime?: string;
  beneficiaries?: string;
  coverage_level?: string;
}
