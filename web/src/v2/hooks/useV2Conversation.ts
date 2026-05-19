import { useCallback, useRef, useState } from 'react';
import { calculateQuote } from '../../data/pricing';
import type { ChatMessage, Answers, QuoteResult, NeedsTunerData } from '../../types';
import type { Slots, ApiResponse } from '../types';
import { EMPTY_SLOTS } from '../types';
import { answersToTuner, calculateQuoteFromTuner } from '../../data/pricing';

// ─── helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function slotsToAnswers(s: Slots): Answers {
  return {
    date_of_birth:        s.date_of_birth        ?? undefined,
    regime:               s.regime               ?? undefined,
    family_composition:   s.family_composition   ?? undefined,
    hospitalization_need: s.hospitalization_need ?? undefined,
    optics_need:          s.optics_need          ?? undefined,
    dental_need:          s.dental_need          ?? undefined,
    current_price:        s.current_price        ?? undefined,
    current_insurer:      s.current_insurer      ?? undefined,
    currently_insured:    s.currently_insured != null ? (s.currently_insured ? 'yes' : 'no') : undefined,
  };
}

function botMsg(content: string, extra?: Partial<ChatMessage>): ChatMessage {
  return { id: uid(), role: 'assistant', content, timestamp: new Date(), ...extra };
}

function userMsg(content: string): ChatMessage {
  return { id: uid(), role: 'user', content, timestamp: new Date() };
}

// ─── hook ─────────────────────────────────────────────────────────────────────

const API_URL = '/api/chat';

export function useV2Conversation() {
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [slots,         setSlots]         = useState<Slots>(EMPTY_SLOTS);
  const [quote,         setQuote]         = useState<QuoteResult | null>(null);
  const [isTyping,      setIsTyping]      = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);

  // Keep a ref for the rolling API history (trimmed, no widget metadata)
  const apiHistoryRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const slotsRef      = useRef<Slots>(EMPTY_SLOTS);

  const mergeSlots = useCallback((incoming: Partial<Slots>) => {
    const next = { ...slotsRef.current, ...incoming };
    slotsRef.current = next;
    setSlots(next);
    return next;
  }, []);

  const addMessages = useCallback((...msgs: ChatMessage[]) => {
    setMessages(prev => [...prev, ...msgs]);
  }, []);

  const showPricing = useCallback((currentSlots: Slots) => {
    const answers = slotsToAnswers(currentSlots);
    const result  = calculateQuote(answers);
    setQuote(result);

    const formulaId = uid();
    const ctaId     = uid();

    addMessages(
      botMsg('Voici les formules qui correspondent à ton profil :', {
        id: formulaId, widget: 'formula-comparison', widgetData: result, consumed: false,
      }),
    );

    // CTA after a short delay
    setTimeout(() => {
      addMessages(botMsg('', { id: ctaId, widget: 'cta-card', widgetData: { label: 'Continuer sur Direct Assurance' }, consumed: false }));

      // NeedsTuner as optional add-on
      setTimeout(() => {
        const tunerData = answersToTuner(answers);
        addMessages(botMsg('Tu peux aussi affiner tes besoins si tu le souhaites :', {
          widget: 'needs-tuner', widgetData: tunerData, consumed: false,
        }));
      }, 500);
    }, 400);

    return result;
  }, [addMessages]);

  const handleNeedsTuner = useCallback((msgId: string, needs: NeedsTunerData) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, consumed: true } : m));
    const answers     = slotsToAnswers(slotsRef.current);
    const newQuote    = calculateQuoteFromTuner(answers, needs);
    setQuote(newQuote);

    setTimeout(() => {
      addMessages(
        botMsg("Super, j'ai mis à jour les formules selon tes besoins !", {
          widget: 'formula-comparison', widgetData: newQuote, consumed: false,
        }),
      );
      setTimeout(() => {
        addMessages(botMsg('', { widget: 'cta-card', widgetData: { label: 'Continuer sur Direct Assurance' }, consumed: false }));
      }, 400);
    }, 300);
  }, [addMessages]);

  const continueToBuy = useCallback(() => {
    const recommended = quote?.formulas.find(f => f.recommended) ?? quote?.formulas[1];
    const url = 'https://www.direct-assurance.fr/mutuelle-sante/devis';
    window.open(url, '_blank', 'noopener,noreferrer');
    addMessages(botMsg(`Parfait ! Je t'ouvre le site Direct Assurance pour finaliser ton devis **${recommended?.name ?? ''}** 🎉`));
  }, [quote, addMessages]);

  const requestCallback = useCallback(() => {
    addMessages(botMsg("Bien sûr ! Un conseiller Direct Assurance va te rappeler sous 24h. Tu peux aussi appeler le **0 800 07 07 07** (service gratuit + prix d'un appel local)."));
  }, [addMessages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || inputDisabled) return;

    const uMsg = userMsg(text.trim());
    addMessages(uMsg);
    apiHistoryRef.current = [...apiHistoryRef.current, { role: 'user', content: text.trim() }];

    setIsTyping(true);
    setInputDisabled(true);

    try {
      const res = await fetch(API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          messages: apiHistoryRef.current,
          slots:    slotsRef.current,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as any).error ?? `HTTP ${res.status}`);
      }

      const data: ApiResponse = await res.json();

      if (!data.reply && !data.action) {
        throw new Error('Empty response from API');
      }

      // Merge slots
      const currentSlots = mergeSlots(data.slots ?? {});

      // Add assistant reply to history
      if (data.reply) {
        apiHistoryRef.current = [...apiHistoryRef.current, { role: 'assistant', content: data.reply }];
      }

      setIsTyping(false);

      // Show reply message
      if (data.reply?.trim()) {
        addMessages(botMsg(data.reply));
      }

      // Handle action — show-pricing only when all 6 required slots are present
      const hasAllNeeds = !!(
        currentSlots.hospitalization_need &&
        currentSlots.optics_need &&
        currentSlots.dental_need
      );
      if (data.action === 'show-pricing' && !quote && hasAllNeeds) {
        setTimeout(() => showPricing(currentSlots), 300);
      } else if (data.action === 'show-cta') {
        setTimeout(() => {
          addMessages(botMsg('', { widget: 'cta-card', widgetData: { label: 'Continuer sur Direct Assurance' }, consumed: false }));
        }, 200);
      }
    } catch (err) {
      console.error('[useV2Conversation]', err);
      setIsTyping(false);
      addMessages(botMsg("Désolé, une erreur technique est survenue. Peux-tu réessayer ?"));
    } finally {
      setInputDisabled(false);
    }
  }, [inputDisabled, addMessages, mergeSlots, showPricing, quote]);

  return {
    messages,
    slots,
    quote,
    isTyping,
    inputDisabled,
    sendMessage,
    handleNeedsTuner,
    continueToBuy,
    requestCallback,
  };
}
