import { useEffect, useRef } from 'react';
import { Sidebar }          from './components/Sidebar';
import { MessageBubble }    from './components/MessageBubble';
import { TypingIndicator }  from './components/TypingIndicator';
import { InputBar }         from './components/InputBar';
import { useConversation }  from './hooks/useConversation';
import { QUESTIONS }        from './data/questionnaire';
import { QuickReplyOption } from './types';

export default function App() {
  const {
    messages,
    step,
    isTyping,
    inputDisabled,
    inputPlaceholder,
    validationError,
    acceptConsent,
    declineConsent,
    submitText,
    selectOption,
    requestContact,
    dismissContact,
  } = useConversation();

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex h-full bg-surface text-white font-sans overflow-hidden">
      <Sidebar />

      {/* Main chat column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="text-white font-medium">DA Assistant</span>
            <span>·</span>
            <span>Devis Santé</span>
          </div>
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {QUESTIONS.map((q, i) => {
              const idx = QUESTIONS.findIndex(qq => qq.id === step);
              const done = i < idx || step === 'calculating' || step === 'result' || step === 'contact' || step === 'done';
              const active = q.id === step;
              return (
                <div
                  key={q.id}
                  className={`
                    rounded-full transition-all duration-300
                    ${done   ? 'w-2 h-2 bg-da-blue'  : ''}
                    ${active ? 'w-2.5 h-2.5 bg-white' : ''}
                    ${!done && !active ? 'w-2 h-2 bg-border' : ''}
                  `}
                  title={q.id}
                />
              );
            })}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="max-w-2xl mx-auto py-6 flex flex-col">
            {messages.map(msg => {
              // Derive questionId by matching the first option value against the questionnaire
              const widgetQuestionId = msg.widget === 'quick-reply' && Array.isArray(msg.widgetData)
                ? QUESTIONS.find(q =>
                    q.options?.some(o => o.value === (msg.widgetData as QuickReplyOption[])[0]?.value)
                  )?.id
                : undefined;

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  questionId={widgetQuestionId}
                  onAcceptConsent={acceptConsent}
                  onDeclineConsent={declineConsent}
                  onSelectOption={selectOption}
                  onRequestContact={requestContact}
                  onDismissContact={dismissContact}
                />
              );
            })}

            {isTyping && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
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
