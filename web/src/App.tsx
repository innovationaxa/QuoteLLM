import { useEffect, useRef } from 'react';
import { Sidebar }          from './components/Sidebar';
import { MessageBubble }    from './components/MessageBubble';
import { TypingIndicator }  from './components/TypingIndicator';
import { InputBar }         from './components/InputBar';
import { useConversation }  from './hooks/useConversation';
import { useSpeech }        from './hooks/useSpeech';

const PHASES = ['Mon contexte', 'Mon profil', 'Ma comparaison'];

function getPhaseIndex(step: string): number {
  if (['result', 'refine', 'contact', 'done'].includes(step)) return 2;
  if ([
    'estimate', 'date_of_birth', 'family_composition', 'regime',
    'hospitalization_need', 'optics_need', 'dental_need', 'calculating',
  ].includes(step)) return 1;
  return 0;
}

export default function App() {
  const {
    messages, currentStep, isTyping,
    inputDisabled, inputPlaceholder, validationError,
    acceptConsent, declineConsent, submitText, selectOption,
    handleDocUpload, handleDocEnterManually, handleDocSkip,
    handleNeedsTuner,
    continueToBuy, requestCallback,
  } = useConversation();

  const { voiceMode, toggleVoiceMode, isSpeaking, speak, stop } = useSpeech();

  const bottomRef    = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // TTS — speak new bot messages when voice mode is active
  useEffect(() => {
    const count = messages.length;
    if (count > prevCountRef.current && voiceMode) {
      const latest = messages[count - 1];
      if (latest.role === 'assistant' && latest.content && latest.content.length > 8) {
        speak(latest.content);
      }
    }
    prevCountRef.current = count;
  }, [messages, voiceMode, speak]);

  // Stop TTS when voice mode is turned off
  useEffect(() => {
    if (!voiceMode) stop();
  }, [voiceMode, stop]);

  const phaseIndex = getPhaseIndex(currentStep);

  return (
    <div className="flex h-full bg-surface text-gray-900 font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Stepper + voice toggle */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0 bg-surface">
          <div className="flex items-center gap-1 text-xs">
            {PHASES.map((phase, i) => (
              <div key={phase} className="flex items-center gap-1">
                {i > 0 && <span className="text-border mx-1">›</span>}
                <span className={
                  i === phaseIndex ? 'text-gray-900 font-medium' :
                  i < phaseIndex  ? 'text-da-blue' :
                  'text-muted'
                }>
                  {phase}
                  {i < phaseIndex && <span className="ml-1 text-da-blue">✓</span>}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Voice mode toggle */}
            <button
              onClick={toggleVoiceMode}
              title={voiceMode ? 'Désactiver le mode vocal' : 'Activer le mode vocal'}
              className={`
                relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                transition-all border
                ${voiceMode
                  ? 'bg-da-blue text-white border-da-blue shadow-sm'
                  : 'bg-white text-muted border-border hover:border-gray-400 hover:text-gray-700'
                }
              `}
            >
              {isSpeaking && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border border-white" />
              )}
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {voiceMode ? (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.95 6.05a8 8 0 010 11.9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9H4a1 1 0 00-1 1v4a1 1 0 001 1h2l4 4V5L6 9z" />
                  </>
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9H4a1 1 0 00-1 1v4a1 1 0 001 1h2l4 4V5L6 9z" />
                    <line x1="23" y1="9" x2="17" y2="15" strokeLinecap="round" />
                    <line x1="17" y1="9" x2="23" y2="15" strokeLinecap="round" />
                  </>
                )}
              </svg>
              {voiceMode ? (isSpeaking ? 'En cours…' : 'Vocal ON') : 'Mode vocal'}
            </button>

            <span className="text-xs text-muted">DA Assistant · Santé</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 bg-surface">
          <div className="max-w-2xl mx-auto py-6 flex flex-col">
            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onAcceptConsent={acceptConsent}
                onDeclineConsent={declineConsent}
                onSelectOption={selectOption}
                onDocUpload={handleDocUpload}
                onDocEnterManually={handleDocEnterManually}
                onDocSkip={handleDocSkip}
                onNeedsTuner={handleNeedsTuner}
                onContinueToBuy={continueToBuy}
                onRequestCallback={requestCallback}
              />
            ))}
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
