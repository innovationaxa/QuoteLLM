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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-speak new bot messages in voice mode
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

  useEffect(() => { if (!voiceMode) stop(); }, [voiceMode, stop]);

  const phaseIndex = getPhaseIndex(currentStep);

  return (
    <div className="flex h-full bg-surface text-gray-900 font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Stepper */}
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
          <span className="text-xs text-muted">DA Assistant · Santé</span>
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
                onNeedsMatrix={() => {}}
                onProfileRecap={() => {}}
                onContinueToBuy={continueToBuy}
                onRequestCallback={requestCallback}
                onCardUpload={() => {}}
                onCardUploadSkip={() => {}}
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
          voiceMode={voiceMode}
          isSpeaking={isSpeaking}
          onToggleVoice={toggleVoiceMode}
        />
      </div>
    </div>
  );
}
