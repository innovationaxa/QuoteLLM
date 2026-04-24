import { useReducer, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, Answers, QuoteResult, QuickEstimateData, QuickReplyOption } from '../types';
import {
  CONSENT_TEXT, getNextQuestionId, getQuestion, getSectionOf,
  getIntentionContextMessage,
} from '../data/questionnaire';
import { calculateQuote, buildQuickEstimate } from '../data/pricing';

// ─── state ────────────────────────────────────────────────────────────────────

interface State {
  messages:         ChatMessage[];
  isTyping:         boolean;
  inputDisabled:    boolean;
  inputPlaceholder: string;
  validationError:  string | null;
  currentStep:      string;
}

type Action =
  | { type: 'ADD_MSG';   payload: ChatMessage }
  | { type: 'TYPING';    payload: boolean }
  | { type: 'SET_INPUT'; payload: { disabled: boolean; placeholder?: string } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STEP';  payload: string }
  | { type: 'CONSUME';   payload: string };

const INIT: State = {
  messages: [], isTyping: false, inputDisabled: true,
  inputPlaceholder: '', validationError: null, currentStep: 'start',
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'ADD_MSG':   return { ...s, messages: [...s.messages, a.payload] };
    case 'TYPING':    return { ...s, isTyping: a.payload };
    case 'SET_INPUT': return { ...s, inputDisabled: a.payload.disabled, inputPlaceholder: a.payload.placeholder ?? s.inputPlaceholder };
    case 'SET_ERROR': return { ...s, validationError: a.payload };
    case 'SET_STEP':  return { ...s, currentStep: a.payload };
    case 'CONSUME':   return { ...s, messages: s.messages.map(m => m.id === a.payload ? { ...m, consumed: true } : m) };
    default:          return s;
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

let _ctr = 0;
const uid = () => `m${++_ctr}-${Date.now()}`;

function makeMsg(
  role: ChatMessage['role'],
  content: string,
  widget?: ChatMessage['widget'],
  widgetData?: ChatMessage['widgetData'],
  questionId?: string,
): ChatMessage {
  return { id: uid(), role, content, timestamp: new Date(), widget, widgetData, questionId };
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useConversation() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const answersRef             = useRef<Answers>({});
  const intentionMsgShownRef   = useRef(false);
  const quickEstimateShownRef  = useRef(false);
  const prevSectionRef         = useRef<'context' | 'refinement' | 'besoins' | null>(null);
  const timers                 = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function withTyping(ms: number, fn: () => void) {
    dispatch({ type: 'TYPING', payload: true });
    later(() => { dispatch({ type: 'TYPING', payload: false }); fn(); }, ms);
  }

  function bot(
    content: string,
    widget?: ChatMessage['widget'],
    widgetData?: ChatMessage['widgetData'],
    questionId?: string,
  ) {
    dispatch({ type: 'ADD_MSG', payload: makeMsg('assistant', content, widget, widgetData, questionId) });
  }

  function me(content: string) {
    dispatch({ type: 'ADD_MSG', payload: makeMsg('user', content) });
  }

  // ── flow engine ───────────────────────────────────────────────────────────

  const advance = useCallback((answers: Answers) => {
    const nextId = getNextQuestionId(answers);

    // ── INTERCEPT 1: message contextuel après intention ───────────────────
    if (answers.intention && !answers.currently_insured && !intentionMsgShownRef.current) {
      intentionMsgShownRef.current = true;
      withTyping(600, () => {
        bot(getIntentionContextMessage(answers.intention!));
        later(() => {
          withTyping(700, () => {
            const q = getQuestion('currently_insured');
            bot(q.prompt, 'quick-reply', q.options as QuickReplyOption[], 'currently_insured');
            dispatch({ type: 'SET_INPUT', payload: { disabled: true } });
            dispatch({ type: 'SET_STEP', payload: 'currently_insured' });
          });
        }, 600);
      });
      return;
    }

    // ── INTERCEPT 2: premier aperçu + transition vers profil ──────────────
    const contextComplete = !!(
      answers.intention &&
      answers.currently_insured &&
      (answers.currently_insured !== 'yes' || answers.current_price)
    );

    if (contextComplete && !quickEstimateShownRef.current) {
      quickEstimateShownRef.current = true;
      dispatch({ type: 'SET_STEP', payload: 'estimate' });

      withTyping(800, () => {
        const estimate = buildQuickEstimate(answers);
        const ctxMsg = answers.currently_insured !== 'yes'
          ? 'Voici un premier aperçu pour ton profil :'
          : 'Super. Voici un **premier aperçu** basé sur ce que tu m\'as dit :';
        bot(ctxMsg, 'quick-estimate', estimate as unknown as QuickEstimateData);

        later(() => {
          withTyping(700, () => {
            bot('Pour affiner et te faire une **comparaison précise**, j\'ai besoin de quelques infos rapides sur ton profil.');
            later(() => {
              bot('', 'section-divider', { label: 'Ton profil' });
              later(() => {
                withTyping(700, () => {
                  const q = getQuestion(nextId!); // date_of_birth
                  bot(q.prompt);
                  dispatch({ type: 'SET_INPUT', payload: { disabled: false, placeholder: q.placeholder ?? '' } });
                  dispatch({ type: 'SET_STEP', payload: nextId! });
                });
              }, 300);
            }, 200);
          });
        }, 1800);
      });
      return;
    }

    // ── Toutes les questions répondues → comparaison ──────────────────────
    if (!nextId) {
      dispatch({ type: 'SET_STEP', payload: 'calculating' });
      dispatch({ type: 'SET_INPUT', payload: { disabled: true } });
      withTyping(800, () => {
        bot('Parfait ! Je prépare ta **comparaison personnalisée**…', 'calculating');
        later(() => {
          const quote = calculateQuote(answersRef.current);
          dispatch({ type: 'SET_STEP', payload: 'result' });
          withTyping(1500, () => {
            const compMsg = answers.current_price
              ? 'Voici ta **comparaison** avec ta mutuelle actuelle :'
              : 'Voici les **3 formules** que nous te proposons :';
            bot(compMsg, 'formula-comparison', quote as unknown as QuoteResult);
            later(() => {
              withTyping(800, () => {
                bot(
                  '👉 **Direct Assurance** (groupe AXA) s\'occupe de tout — souscription sur un site sécurisé, avec une équipe humaine si tu as des questions. C\'est nous qui gérons ton contrat, pas ChatGPT.',
                  'cta-card',
                );
                dispatch({ type: 'SET_STEP', payload: 'contact' });
              });
            }, 600);
          });
        }, 2200);
      });
      return;
    }

    const section = getSectionOf(nextId);
    dispatch({ type: 'SET_STEP', payload: nextId });

    // ── Transition refinement → besoins ───────────────────────────────────
    if (section === 'besoins' && prevSectionRef.current === 'refinement') {
      prevSectionRef.current = 'besoins';
      withTyping(600, () => {
        bot('Bien noté 👍\n\nDernière étape : tes **priorités de remboursement**.');
        later(() => {
          bot('', 'section-divider', { label: 'Tes besoins' });
          later(() => {
            withTyping(700, () => {
              const q = getQuestion(nextId);
              bot(q.prompt, 'quick-reply', q.options as QuickReplyOption[], nextId);
              dispatch({ type: 'SET_INPUT', payload: { disabled: true } });
            });
          }, 300);
        }, 200);
      });
      return;
    }

    if (section === 'refinement' && prevSectionRef.current !== 'refinement' && prevSectionRef.current !== 'besoins') {
      prevSectionRef.current = 'refinement';
    }
    if (section === 'context' && prevSectionRef.current === null) {
      prevSectionRef.current = 'context';
    }

    // ── Question suivante standard ────────────────────────────────────────
    withTyping(700, () => {
      const q = getQuestion(nextId);
      if (q.type === 'choice') {
        bot(q.prompt, 'quick-reply', q.options as QuickReplyOption[], nextId);
        dispatch({ type: 'SET_INPUT', payload: { disabled: true } });
      } else {
        bot(q.prompt);
        dispatch({ type: 'SET_INPUT', payload: { disabled: false, placeholder: q.placeholder ?? 'Votre réponse…' } });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch({ type: 'SET_STEP', payload: 'consent' });
    withTyping(1000, () => bot(CONSENT_TEXT, 'consent-card'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── enregistrement des réponses ───────────────────────────────────────────

  function recordAnswer(id: string, value: string) {
    answersRef.current = { ...answersRef.current, [id]: value };
  }

  // ── API publique ──────────────────────────────────────────────────────────

  const acceptConsent = useCallback((msgId: string) => {
    dispatch({ type: 'CONSUME', payload: msgId });
    me("C'est parti, on y va !");
    advance(answersRef.current);
  }, [advance]);

  const declineConsent = useCallback((msgId: string) => {
    dispatch({ type: 'CONSUME', payload: msgId });
    me('Non merci.');
    withTyping(800, () => bot("Pas de problème. Reviens quand tu veux. Bonne journée ! 👋"));
    dispatch({ type: 'SET_STEP', payload: 'done' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitText = useCallback((value: string) => {
    const step = state.currentStep;
    let err: string | null = null;
    try {
      const q = getQuestion(step);
      err = q.validate?.(value.trim()) ?? null;
    } catch {
      return;
    }
    if (err) { dispatch({ type: 'SET_ERROR', payload: err }); return; }
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_INPUT', payload: { disabled: true } });
    me(value.trim());
    recordAnswer(step, value.trim());
    advance({ ...answersRef.current });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentStep, advance]);

  const selectOption = useCallback((msgId: string, questionId: string, value: string, label: string) => {
    dispatch({ type: 'CONSUME', payload: msgId });
    me(label);
    recordAnswer(questionId, value);
    advance({ ...answersRef.current });
  }, [advance]);

  const continueToBuy = useCallback((msgId: string) => {
    dispatch({ type: 'CONSUME', payload: msgId });
    me('Je souhaite continuer sur Direct Assurance.');
    withTyping(800, () => {
      bot('Parfait ! 🎉 Dans un vrai parcours, tu serais redirigé(e) vers le site sécurisé **directassurances.fr** avec tes informations pré-remplies.\n\n*Ce devis est indicatif et non contractuel.*');
      dispatch({ type: 'SET_STEP', payload: 'done' });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestCallback = useCallback((msgId: string) => {
    dispatch({ type: 'CONSUME', payload: msgId });
    me('Je préfère être rappelé(e) par un conseiller.');
    withTyping(800, () => {
      bot('Un conseiller Direct Assurance te contactera très prochainement. 📞\n\n*Ce devis est indicatif et non contractuel. La souscription finale se fait avec l\'équipe Direct Assurance.*');
      dispatch({ type: 'SET_STEP', payload: 'done' });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    messages:         state.messages,
    currentStep:      state.currentStep,
    isTyping:         state.isTyping,
    inputDisabled:    state.inputDisabled,
    inputPlaceholder: state.inputPlaceholder,
    validationError:  state.validationError,
    acceptConsent, declineConsent, submitText, selectOption,
    continueToBuy, requestCallback,
  };
}
