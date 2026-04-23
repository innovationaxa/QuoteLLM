import { useReducer, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, Step, Answers, QuoteData } from '../types';
import { QUESTIONS, CONSENT_TEXT } from '../data/questionnaire';
import { calculateQuote } from '../data/pricing';

// ─── state ────────────────────────────────────────────────────────────────────

interface State {
  messages: ChatMessage[];
  step: Step;
  isTyping: boolean;
  inputDisabled: boolean;
  inputPlaceholder: string;
  validationError: string | null;
}

type Action =
  | { type: 'ADD_MSG';        payload: ChatMessage }
  | { type: 'TYPING';         payload: boolean }
  | { type: 'SET_STEP';       payload: Step }
  | { type: 'SET_INPUT';      payload: { disabled: boolean; placeholder?: string } }
  | { type: 'SET_ERROR';      payload: string | null }
  | { type: 'CONSUME_WIDGET'; payload: string };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'ADD_MSG':
      return { ...s, messages: [...s.messages, a.payload] };
    case 'TYPING':
      return { ...s, isTyping: a.payload };
    case 'SET_STEP':
      return { ...s, step: a.payload };
    case 'SET_INPUT':
      return {
        ...s,
        inputDisabled:    a.payload.disabled,
        inputPlaceholder: a.payload.placeholder ?? s.inputPlaceholder,
      };
    case 'SET_ERROR':
      return { ...s, validationError: a.payload };
    case 'CONSUME_WIDGET':
      return {
        ...s,
        messages: s.messages.map(m =>
          m.id === a.payload ? { ...m, consumed: true } : m,
        ),
      };
    default:
      return s;
  }
}

const init: State = {
  messages:         [],
  step:             'start',
  isTyping:         false,
  inputDisabled:    true,
  inputPlaceholder: '',
  validationError:  null,
};

// ─── helpers ──────────────────────────────────────────────────────────────────

let _idCounter = 0;
function uid() { return `msg-${++_idCounter}-${Date.now()}`; }

function makeMsg(
  role: ChatMessage['role'],
  content: string,
  widget?: ChatMessage['widget'],
  widgetData?: ChatMessage['widgetData'],
): ChatMessage {
  return { id: uid(), role, content, timestamp: new Date(), widget, widgetData };
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useConversation() {
  const [state, dispatch] = useReducer(reducer, init);

  // Stable ref to accumulate answers without stale-closure issues
  const answersRef = useRef<Answers>({});
  const timers     = useRef<ReturnType<typeof setTimeout>[]>([]);

  function later(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }

  // Cleanup timers on unmount
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // ── typing animation wrapper ──────────────────────────────────────────────
  function withTyping(ms: number, fn: () => void) {
    dispatch({ type: 'TYPING', payload: true });
    later(() => {
      dispatch({ type: 'TYPING', payload: false });
      fn();
    }, ms);
  }

  // ── add messages ─────────────────────────────────────────────────────────
  function assistant(
    content: string,
    widget?: ChatMessage['widget'],
    widgetData?: ChatMessage['widgetData'],
  ) {
    dispatch({ type: 'ADD_MSG', payload: makeMsg('assistant', content, widget, widgetData) });
  }

  function user(content: string) {
    dispatch({ type: 'ADD_MSG', payload: makeMsg('user', content) });
  }

  // ── question flow ─────────────────────────────────────────────────────────
  const goToQuestion = useCallback((index: number) => {
    if (index >= QUESTIONS.length) {
      // All questions done → calculate
      dispatch({ type: 'SET_STEP',  payload: 'calculating' });
      dispatch({ type: 'SET_INPUT', payload: { disabled: true } });

      withTyping(700, () => {
        assistant('Parfait ! Je calcule votre tarif indicatif…', 'calculating');

        later(() => {
          const quote = calculateQuote(answersRef.current as Required<Answers>);
          dispatch({ type: 'SET_STEP', payload: 'result' });

          withTyping(1200, () => {
            assistant(
              'Voici votre **devis Santé indicatif** :',
              'quote-card',
              quote as unknown as QuoteData,
            );

            later(() => {
              withTyping(800, () => {
                assistant(
                  'Souhaitez-vous être **recontacté(e) par un conseiller** pour finaliser votre souscription ?',
                  'contact-cta',
                );
                dispatch({ type: 'SET_STEP', payload: 'contact' });
              });
            }, 600);
          });
        }, 2000);
      });
      return;
    }

    const q = QUESTIONS[index];
    dispatch({ type: 'SET_STEP', payload: q.id as Step });

    withTyping(700, () => {
      if (q.type === 'choice') {
        assistant(q.prompt, 'quick-reply', q.options);
        dispatch({ type: 'SET_INPUT', payload: { disabled: true } });
      } else {
        assistant(q.prompt);
        dispatch({
          type: 'SET_INPUT',
          payload: { disabled: false, placeholder: q.placeholder ?? 'Votre réponse…' },
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── boot: show consent on mount ───────────────────────────────────────────
  useEffect(() => {
    dispatch({ type: 'SET_STEP', payload: 'consent' });
    withTyping(1000, () => {
      assistant(CONSENT_TEXT, 'consent-card');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── public API ────────────────────────────────────────────────────────────

  const acceptConsent = useCallback((msgId: string) => {
    dispatch({ type: 'CONSUME_WIDGET', payload: msgId });
    user("J'accepte et je souhaite obtenir un devis.");
    goToQuestion(0);
  }, [goToQuestion]);

  const declineConsent = useCallback((msgId: string) => {
    dispatch({ type: 'CONSUME_WIDGET', payload: msgId });
    user('Je refuse.');
    withTyping(800, () => {
      assistant("Je comprends. Revenez quand vous le souhaitez. Bonne journée !");
      dispatch({ type: 'SET_STEP', payload: 'done' });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitText = useCallback((value: string) => {
    const qIndex = QUESTIONS.findIndex(q => q.id === state.step);
    if (qIndex === -1) return;

    const q = QUESTIONS[qIndex];
    const err = q.validate?.(value) ?? null;
    if (err) { dispatch({ type: 'SET_ERROR', payload: err }); return; }

    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_INPUT', payload: { disabled: true } });
    user(value.trim());

    answersRef.current = { ...answersRef.current, [q.id]: value.trim() };
    goToQuestion(qIndex + 1);
  }, [state.step, goToQuestion]);

  const selectOption = useCallback((msgId: string, questionId: string, value: string, label: string) => {
    dispatch({ type: 'CONSUME_WIDGET', payload: msgId });
    user(`${label}`);

    answersRef.current = { ...answersRef.current, [questionId]: value };
    const qIndex = QUESTIONS.findIndex(q => q.id === questionId);
    goToQuestion(qIndex + 1);
  }, [goToQuestion]);

  const requestContact = useCallback((msgId: string) => {
    dispatch({ type: 'CONSUME_WIDGET', payload: msgId });
    user('Oui, je souhaite être recontacté(e).');
    withTyping(800, () => {
      assistant(
        `Parfait ! Un conseiller Direct Assurances vous contactera très prochainement.

*Ce devis est indicatif et non contractuel. La souscription et la validation finale restent nécessaires.*`,
      );
      dispatch({ type: 'SET_STEP', payload: 'done' });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissContact = useCallback((msgId: string) => {
    dispatch({ type: 'CONSUME_WIDGET', payload: msgId });
    user('Non merci, pas pour l\'instant.');
    withTyping(800, () => {
      assistant(
        `Bien sûr. Votre devis indicatif reste disponible dans cette conversation.

N'hésitez pas à revenir si vous avez des questions !`,
      );
      dispatch({ type: 'SET_STEP', payload: 'done' });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    messages:         state.messages,
    step:             state.step,
    isTyping:         state.isTyping,
    inputDisabled:    state.inputDisabled,
    inputPlaceholder: state.inputPlaceholder,
    validationError:  state.validationError,
    acceptConsent,
    declineConsent,
    submitText,
    selectOption,
    requestContact,
    dismissContact,
  };
}
