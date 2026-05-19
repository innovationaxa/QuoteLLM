import { useEffect, useRef } from 'react';
import { Sidebar }        from '../components/Sidebar';
import { MessageBubble }  from '../components/MessageBubble';
import { TypingIndicator } from '../components/TypingIndicator';
import { InputBar }       from '../components/InputBar';
import { useSpeech }      from '../hooks/useSpeech';
import { useV2Conversation } from './hooks/useV2Conversation';

export default function AppV2() {
  const {
    messages, isTyping, inputDisabled,
    sendMessage, handleNeedsTuner, continueToBuy, requestCallback,
  } = useV2Conversation();

  const { voiceMode, toggleVoiceMode, isSpeaking, speak, stop, ttsError } = useSpeech();

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

  // No-op stubs for V1-only props (consent / doc-upload / quick-reply not used in V2)
  const noop = () => {};

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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 bg-surface">
          <div className="max-w-2xl mx-auto py-6 flex flex-col">
            {messages.length === 0 && !isTyping && (
              <div className="flex flex-col items-center justify-center gap-3 mt-16 text-center select-none">
                <p className="text-lg font-medium text-gray-700">
                  Bonjour, je suis votre assistant Direct Assurance
                </p>
                <p className="text-sm text-muted max-w-sm">
                  Posez-moi n'importe quelle question sur votre mutuelle santé, ou dites simplement "Bonjour" pour commencer votre devis.
                </p>
              </div>
            )}

            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onAcceptConsent={noop}
                onDeclineConsent={noop}
                onSelectOption={noop}
                onDocUpload={noop}
                onDocEnterManually={noop}
                onDocSkip={noop}
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
