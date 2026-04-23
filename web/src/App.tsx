import { useEffect, useRef } from 'react';
import { Sidebar }          from './components/Sidebar';
import { MessageBubble }    from './components/MessageBubble';
import { TypingIndicator }  from './components/TypingIndicator';
import { InputBar }         from './components/InputBar';
import { useConversation }  from './hooks/useConversation';
import { QuickReplyOption } from './types';

const PHASES = ['Ma situation', 'Mes besoins', 'Notre offre'];

function getPhaseIndex(step: string): number {
  if (['result', 'contact', 'done'].includes(step))                    return 2;
  if (['doctors_need','hospitalization_need','optics_need','dental_need','recap'].includes(step)) return 1;
  return 0;
}

export default function App() {
  const {
    messages, currentStep, isTyping,
    inputDisabled, inputPlaceholder, validationError,
    acceptConsent, declineConsent, submitText, selectOption,
    confirmRecap, requestContact, dismissContact,
  } = useConversation();

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const phaseIndex = getPhaseIndex(currentStep);

  return (
    <div className="flex h-full bg-surface text-white font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header with DA-style stepper */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-1 text-xs">
            {PHASES.map((phase, i) => (
              <div key={phase} className="flex items-center gap-1">
                {i > 0 && <span className="text-border mx-1">›</span>}
                <span className={i === phaseIndex ? 'text-white font-medium' : i < phaseIndex ? 'text-da-blue' : 'text-muted'}>
                  {phase}
                  {i < phaseIndex && <span className="ml-1 text-da-blue">✓</span>}
                </span>
              </div>
            ))}
          </div>
          <span className="text-xs text-muted">DA Assistant · Santé</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="max-w-2xl mx-auto py-6 flex flex-col">
            {messages.map(msg => {
              const qId = msg.widget === 'quick-reply' && Array.isArray(msg.widgetData)
                ? findQuestionIdByOptions(msg.widgetData as QuickReplyOption[])
                : undefined;

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  questionId={qId}
                  onAcceptConsent={acceptConsent}
                  onDeclineConsent={declineConsent}
                  onSelectOption={selectOption}
                  onConfirmRecap={confirmRecap}
                  onRequestContact={requestContact}
                  onDismissContact={dismissContact}
                />
              );
            })}
            {isTyping && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        </div>

        <InputBar
          disabled={inputDisabled}
          placeholder={inputPlaceholder}
          error={validationError}
          onSubmit={submitText}
        />
      </div>
    </div>
  );
}

// Match quick-reply widgetData back to its question ID by checking option values
const QUESTION_OPTION_MAP: Record<string, string[]> = {
  family_composition:    ['single', 'couple', 'family', 'parent'],
  regime:                ['general', 'independent', 'agriculture', 'student', 'alsace_moselle'],
  partner_regime:        ['general', 'independent', 'agriculture', 'student', 'alsace_moselle'],
  children_count:        ['1', '2', '3', '4'],
  currently_insured:     ['yes_long', 'yes_short', 'no'],
  wants_cancellation:    ['yes', 'no'],
  start_date:            ['next_month', 'in_3_months', 'in_6_months'],
  doctors_need:          ['routine', 'regular', 'intensive'],
  hospitalization_need:  ['minimum', 'comfort', 'premium'],
  optics_need:           ['minimum', 'standard', 'enhanced'],
  dental_need:           ['routine', 'prosthetics', 'orthodontics'],
};

function findQuestionIdByOptions(options: QuickReplyOption[]): string | undefined {
  const values = options.map(o => o.value);
  return Object.entries(QUESTION_OPTION_MAP).find(([, opts]) =>
    values.length > 0 && opts.includes(values[0])
  )?.[0];
}
