import { useReducer, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, Answers, QuoteResult, RecapData, QuickReplyOption } from '../types';
import { CONSENT_TEXT, getNextQuestionId, getQuestion, getSectionOf } from '../data/questionnaire';
import { calculateQuote, buildRecapData } from '../data/pricing';

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
  | { type: 'ADD_MSG';    payload: ChatMessage }
  | { type: 'TYPING';     payload: boolean }
  | { type: 'SET_INPUT';  payload: { disabled: boolean; placeholder?: string } }
  | { type: 'SET_ERROR';  payload: string | null }
  | { type: 'SET_STEP';   payload: string }
  | { type: 'CONSUME';    payload: string };

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
  const answersRef = useRef<Answers>({});
  const prevSectionRef = useRef<'situation' | 'besoins' | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // ── core primitives ───────────────────────────────────────────────────────

  function withTyping(ms: number, fn: () => void) {
    dispatch({ type: 'TYPING', payload: true });
    later(() => { dispatch({ type: 'TYPING', payload: false }); fn(); }, ms);
  }

  function bot(content: string, widget?: ChatMessage['widget'], widgetData?: ChatMessage['widgetData'], questionId?: string) {
    dispatch({ type: 'ADD_MSG', payload: makeMsg('assistant', content, widget, widgetData, questionId) });
  }

  function me(content: string) {
    dispatch({ type: 'ADD_MSG', payload: makeMsg('user', content) });
  }

  // ── flow engine ───────────────────────────────────────────────────────────

  const advance = useCallback((answers: Answers) => {
    const nextId = getNextQuestionId(answers);

    // ── All questions done → show recap ──────────────────────────────────
    if (!nextId) {
      dispatch({ type: 'SET_STEP', payload: 'recap' });
      dispatch({ type: 'SET_INPUT', payload: { disabled: true } });
      withTyping(800, () => {
        const recap = buildRecapData(answers);
        bot(
          'Voici un récapitulatif de votre situation. Tout est correct ?',
          'recap-confirm',
          recap as unknown as RecapData,
        );
      });
      return;
    }

    const section = getSectionOf(nextId);
    dispatch({ type: 'SET_STEP', payload: nextId });

    // ── Section transition: situation → besoins ──────────────────────────
    if (section === 'besoins' && prevSectionRef.current === 'situation') {
      prevSectionRef.current = 'besoins';
      withTyping(600, () => {
        bot(
          'Parfait, votre situation est complète !\n\nPassons maintenant à vos **besoins en santé** pour trouver la formule la plus adaptée.',
          'section-divider',
          { label: 'Vos besoins' } as { label: string },
        );
        later(() => {
          const q = getQuestion(nextId);
          withTyping(700, () => {
            if (q.type === 'choice') {
              bot(q.prompt, 'quick-reply', q.options as QuickReplyOption[], nextId);
              dispatch({ type: 'SET_INPUT', payload: { disabled: true } });
            } else {
              bot(q.prompt);
              dispatch({ type: 'SET_INPUT', payload: { disabled: false, placeholder: q.placeholder ?? 'Votre réponse…' } });
            }
          });
        }, 800);
      });
      return;
    }

    if (section === 'situation' && prevSectionRef.current === null) {
      prevSectionRef.current = 'situation';
    }

    // ── Regular next question ─────────────────────────────────────────────
    withTyping(700, () => {
      const q = getQuestion(nextId);
      if (q.type === 'choice') {
        bot(q.prompt, 'quick-reply', q.options as QuickReplyOption[]);
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

  // ─── answer helpers ───────────────────────────────────────────────────────

  function recordAnswer(id: string, value: string) {
    if (id.startsWith('child_')) {
      const idx = parseInt(id.split('_')[1]);
      const births = [...(answersRef.current.children_births ?? [])];
      births[idx] = value;
      answersRef.current = { ...answersRef.current, children_births: births };
    } else if (id === 'children_count') {
      answersRef.current = { ...answersRef.current, children_count: parseInt(value) };
    } else {
      answersRef.current = { ...answersRef.current, [id]: value };
    }
  }

  // ─── public API ───────────────────────────────────────────────────────────

  const acceptConsent = useCallback((msgId: string) => {
    dispatch({ type: 'CONSUME', payload: msgId });
    me("J'accepte et je souhaite obtenir un devis.");
    advance(answersRef.current);
  }, [advance]);

  const declineConsent = useCallback((msgId: string) => {
    dispatch({ type: 'CONSUME', payload: msgId });
    me('Je refuse.');
    withTyping(800, () => bot("Je comprends. Revenez quand vous le souhaitez. Bonne journée !"));
    dispatch({ type: 'SET_STEP', payload: 'done' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitText = useCallback((value: string) => {
    const step = state.currentStep;
    const q = getQuestion(step);
    const err = q.validate?.(value.trim()) ?? null;
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

  const confirmRecap = useCallback((msgId: string) => {
    dispatch({ type: 'CONSUME', payload: msgId });
    me('Oui, tout est correct, calculez mon devis !');
    dispatch({ type: 'SET_STEP', payload: 'calculating' });
    withTyping(800, () => {
      bot('Parfait ! Je calcule vos tarifs indicatifs…', 'calculating');
      later(() => {
        const quote = calculateQuote(answersRef.current);
        dispatch({ type: 'SET_STEP', payload: 'result' });
        withTyping(1500, () => {
          bot('Voici les **3 formules** que nous vous proposons :', 'formula-comparison', quote as unknown as QuoteResult);
          later(() => {
            withTyping(700, () => {
              bot(
                'Souhaitez-vous être **recontacté(e) par un conseiller** pour finaliser votre souscription ?',
                'contact-cta',
              );
              dispatch({ type: 'SET_STEP', payload: 'contact' });
            });
          }, 600);
        });
      }, 2200);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestContact = useCallback((msgId: string) => {
    dispatch({ type: 'CONSUME', payload: msgId });
    me('Oui, je souhaite être recontacté(e).');
    withTyping(800, () => {
      bot('Parfait ! Un conseiller Direct Assurances vous contactera très prochainement.\n\n*Ce devis est indicatif et non contractuel. La souscription et la validation finale restent nécessaires.*');
      dispatch({ type: 'SET_STEP', payload: 'done' });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissContact = useCallback((msgId: string) => {
    dispatch({ type: 'CONSUME', payload: msgId });
    me("Non merci, pas pour l'instant.");
    withTyping(800, () => {
      bot("Bien sûr. Votre devis reste disponible dans cette conversation. N'hésitez pas à revenir si vous avez des questions !");
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
    confirmRecap, requestContact, dismissContact,
  };
}
