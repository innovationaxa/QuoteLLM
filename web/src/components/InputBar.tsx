import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import daLogoSrc from '../assets/da-logo.png';

// ─── STT hook ─────────────────────────────────────────────────────────────────

function useSTT(
  onInterim: (text: string) => void,
  onFinal:   (text: string) => void,
) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported]     = useState(false);
  const [sttError, setSttError]       = useState<string | null>(null);
  const recognitionRef  = useRef<any>(null);
  const transcriptRef   = useRef('');

  useEffect(() => {
    setSupported(
      !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition,
    );
  }, []);

  function toggle() {
    setSttError(null);
    if (isListening) { recognitionRef.current?.stop(); return; }

    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;

    transcriptRef.current = '';
    const rec = new SR();
    rec.lang           = 'fr-FR';
    rec.continuous     = false;   // auto-stops after a pause
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      // Rebuild full transcript from all result segments
      let t = '';
      for (let i = 0; i < e.results.length; i++) {
        t += e.results[i][0].transcript;
      }
      transcriptRef.current = t;
      onInterim(t);
    };

    rec.onerror = (e: any) => {
      setIsListening(false);
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        setSttError('Microphone non autorisé — vérifiez les permissions du navigateur.');
      }
    };

    // onend fires after continuous=false auto-stops → trigger submit
    rec.onend = () => {
      setIsListening(false);
      const final = transcriptRef.current.trim();
      transcriptRef.current = '';
      if (final) onFinal(final);
    };

    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  }

  return { supported, isListening, sttError, toggle };
}

// ─── component ───────────────────────────────────────────────────────────────

interface Props {
  disabled:       boolean;
  placeholder:    string;
  error:          string | null;
  onSubmit:       (value: string) => void;
  voiceMode:      boolean;
  isSpeaking:     boolean;
  onToggleVoice:  () => void;
}

export function InputBar({
  disabled, placeholder, error, onSubmit,
  voiceMode, isSpeaking, onToggleVoice,
}: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // onFinal: auto-submit in voice mode, else just keep text in field
  const { supported: sttSupported, isListening, sttError, toggle: toggleSTT } = useSTT(
    (interim) => setText(interim),
    (final)   => {
      setText(final);
      if (voiceMode && !disabled) {
        onSubmit(final);
        setText('');
      }
    },
  );

  useEffect(() => {
    if (!disabled && !isListening) textareaRef.current?.focus();
  }, [disabled, isListening]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  function submit() {
    const v = text.trim();
    if (!v || disabled) return;
    onSubmit(v);
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  const canSend = !disabled && !!text.trim();
  const displayError = error ?? sttError;

  return (
    <div className="bg-surface pt-3 pb-4 px-4">
      <div className="max-w-2xl mx-auto">
        {displayError && (
          <div className="mb-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {displayError}
          </div>
        )}

        <div className={`
          rounded-3xl border bg-white transition-all
          ${isListening
            ? 'border-red-300 shadow-md shadow-red-100'
            : voiceMode && isSpeaking
              ? 'border-da-blue/40 shadow-md shadow-da-blue/10'
              : disabled
                ? 'border-border opacity-60'
                : 'border-border shadow-sm focus-within:border-gray-300 focus-within:shadow-md'
          }
        `}>
          {/* Textarea — never disabled during STT so transcript can appear */}
          <div className="px-4 pt-3.5 pb-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={onKey}
              disabled={disabled && !isListening}
              placeholder={
                isListening
                  ? '🎙 Je vous écoute…'
                  : isSpeaking
                    ? '🔊 Lecture en cours…'
                    : (placeholder || 'Poser une question')
              }
              rows={1}
              className="
                w-full bg-transparent text-gray-900 text-[15px] resize-none outline-none
                placeholder:text-muted leading-relaxed disabled:cursor-not-allowed
              "
            />
          </div>

          {/* Bottom action bar */}
          <div className="flex items-center gap-2 px-3 pb-3 pt-1">
            {/* Attachment */}
            <button
              disabled={disabled}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Joindre un fichier"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Brand chip */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-elevated select-none">
              <img src={daLogoSrc} alt="DA" width={16} height={16} style={{ borderRadius: 3, objectFit: 'contain' }} />
              <span className="font-medium text-[13px] text-gray-700">Direct Assurance</span>
            </div>

            <div className="flex-1" />

            {/* Voice mode toggle */}
            <button
              onClick={onToggleVoice}
              title={voiceMode ? 'Désactiver le mode vocal' : 'Activer le mode vocal (lecture des réponses)'}
              className={`
                relative flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] font-medium
                border transition-all
                ${voiceMode
                  ? 'bg-da-blue text-white border-da-blue'
                  : 'text-muted border-border hover:border-gray-400 hover:text-gray-700 bg-white'
                }
              `}
            >
              {isSpeaking && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
              )}
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9H4a1 1 0 00-1 1v4a1 1 0 001 1h2l4 4V5L6 9z" />
                {voiceMode ? (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728" />
                  </>
                ) : (
                  <>
                    <line x1="23" y1="9" x2="17" y2="15" strokeLinecap="round" />
                    <line x1="17" y1="9" x2="23" y2="15" strokeLinecap="round" />
                  </>
                )}
              </svg>
              {voiceMode ? (isSpeaking ? 'Écoute…' : 'Vocal') : 'Vocal'}
            </button>

            {/* Mic / STT — NEVER disabled so dictation is always available */}
            {sttSupported && (
              <button
                onClick={toggleSTT}
                title={isListening ? 'Arrêter la dictée' : 'Dicter ma réponse (fr)'}
                className={`
                  relative w-8 h-8 rounded-full flex items-center justify-center transition-all
                  ${isListening
                    ? 'bg-red-500 text-white shadow-md shadow-red-200'
                    : 'text-muted hover:text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {isListening && (
                  <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-50" />
                )}
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isListening ? 2.2 : 1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                </svg>
              </button>
            )}

            {/* Send */}
            <button
              onClick={submit}
              disabled={!canSend}
              title="Envoyer"
              className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all
                ${canSend
                  ? 'bg-gray-900 hover:bg-gray-700 cursor-pointer'
                  : 'bg-gray-200 cursor-not-allowed'
                }
              `}
            >
              {canSend ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <rect x="3"  y="9"  width="3" height="6"  rx="1.5" />
                  <rect x="8"  y="5"  width="3" height="14" rx="1.5" />
                  <rect x="13" y="7"  width="3" height="10" rx="1.5" />
                  <rect x="18" y="10" width="3" height="4"  rx="1.5" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-2">
          Direct Assurance peut faire des erreurs. Ce devis est indicatif.
        </p>
      </div>
    </div>
  );
}
