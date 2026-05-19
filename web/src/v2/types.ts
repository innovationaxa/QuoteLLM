import type { ChatMessage, QuoteResult } from '../types';

export interface Slots {
  date_of_birth:        string | null;
  regime:               string | null;
  family_composition:   string | null;
  hospitalization_need: string | null;
  optics_need:          string | null;
  dental_need:          string | null;
  current_price:        string | null;
  current_insurer:      string | null;
  currently_insured:    boolean | null;
}

export interface ApiResponse {
  reply:  string;
  slots:  Partial<Slots>;
  action: 'show-pricing' | 'show-cta' | null;
}

export interface V2State {
  messages:      ChatMessage[];
  slots:         Slots;
  quote:         QuoteResult | null;
  isTyping:      boolean;
  inputDisabled: boolean;
  error:         string | null;
}

export const EMPTY_SLOTS: Slots = {
  date_of_birth:        null,
  regime:               null,
  family_composition:   null,
  hospitalization_need: null,
  optics_need:          null,
  dental_need:          null,
  current_price:        null,
  current_insurer:      null,
  currently_insured:    null,
};
