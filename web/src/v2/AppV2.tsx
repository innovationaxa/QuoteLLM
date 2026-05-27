import { useEffect, useRef, useState } from 'react';
import { Sidebar }        from '../components/Sidebar';
import { MessageBubble }  from '../components/MessageBubble';
import { TypingIndicator } from '../components/TypingIndicator';
import { InputBar }       from '../components/InputBar';
import { WelcomeCard }    from '../components/WelcomeCard';
import { CardUpload }     from '../components/CardUpload';
import { ProgressBar }    from '../components/ProgressBar';
import { useSpeech }      from '../hooks/useSpeech';
import { useV2Conversation } from './hooks/useV2Conversation';

export default function AppV2() {
  const {
    messages, slots, quote, isTyping, inputDisabled,
    sendMessage, startFromOcr,
    handleNeedsTuner, handleNeedsMatrix, handleProfileRecap, handleSelectChip,
    continueToBuy, requestCallback,
  } = useV2Conversation();

  const { voiceMode, toggleVoiceMode, isSpeaking, speak, stop, ttsError } = useSpeech();

  const [showCardUpload, setShowCardUpload] = useState(false);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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

  const handleContinueToBuy  = (_id: string) => continueToBuy();
  const handleRequestCallback = (_id: string) => requestCallback();

  const step2Done = !!(slots.hospitalization_need && slots.optics_need && slots.dental_need);
  const progressStep: 1 | 2 | 3 = quote ? 3 : step2Done ? 2 : 1;

  const showWelcome = messages.length === 0 && !isTyping;

  return (
    <div className="flex h-full bg-surface text-gray-900 font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0 bg-surface">
          <span className="text-xs text-muted font-medium">
            Mutuelle Santé · Devis personnalisé IA
          </span>
          <span className="text-xs text-muted">DA Assistant · Santé</span>
        </div>

        {/* Progress bar (only when conversation has started) */}
        {messages.length > 0 && <ProgressBar step={progressStep} />}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 bg-surface">
          <div className="max-w-2xl mx-auto py-6 flex flex-col">

            {showWelcome ? (
              showCardUpload ? (
                <CardUpload
                  onConfirm={ocr => { setShowCardUpload(false); startFromOcr(ocr); }}
                  onSkip={() => { setShowCardUpload(false); sendMessage('Bonjour, je souhaite un devis mutuelle santé'); }}
                />
              ) : (
                <WelcomeCard
                  onStart={() => sendMessage('Bonjour, je souhaite un devis mutuelle santé')}
                  onUploadCard={() => setShowCardUpload(true)}
                />
              )
            ) : (
              <>
                {messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onAcceptConsent={(_id: string) => {}}
                    onDeclineConsent={(_id: string) => {}}
                    onSelectOption={handleSelectChip}
                    onDocUpload={(_msgId: string, _file: File) => {}}
                    onDocEnterManually={(_msgId: string) => {}}
                    onDocSkip={(_msgId: string) => {}}
                    onNeedsTuner={handleNeedsTuner}
                    onNeedsMatrix={handleNeedsMatrix}
                    onProfileRecap={handleProfileRecap}
                    onContinueToBuy={handleContinueToBuy}
                    onRequestCallback={handleRequestCallback}
                  />
                ))}
                {isTyping && <TypingIndicator />}
              </>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <InputBar
          disabled={inputDisabled}
          placeholder="Posez votre question ou répondez ici…"
          error={ttsError}
          onSubmit={sendMessage}
          voiceMode={voiceMode}
          isSpeaking={isSpeaking}
          onToggleVoice={toggleVoiceMode}
        />
      </div>
    </div>
  );
}
