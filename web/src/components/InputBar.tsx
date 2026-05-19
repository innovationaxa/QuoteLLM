import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import daLogoSrc from '../assets/da-logo.png';

// ─── STT hook (MediaRecorder → OpenAI Whisper) ───────────────────────────────

function useSTT(
  onInterim: (text: string) => void,
  onFinal:   (text: string) => void,
) {
  const [isListening, setIsListening] = useState(false);
  const [supported,   setSupported]   = useState(false);
  const [sttError,    setSttError]    = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);

  useEffect(() => {
    setSupported(!!(navigator.mediaDevices?.getUserMedia) && !!(window.MediaRecorder));
  }, []);

  async function toggle() {
    setSttError(null);

    // Stop recording
    if (isListening) {
      recorderRef.current?.stop();
      return;
    }

    // Start recording
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setSttError('Microphone non autorisé — autorisez l\'accès dans les réglages du navigateur.');
      return;
    }

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
    const recorder  = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      setIsListening(false);

      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];
      if (blob.size < 200) return;

      // Show loading state in field
      onInterim('…');

      try {
        const ext  = mimeType.includes('webm') ? 'webm' : 'mp4';
        const form = new FormData();
        form.append('audio', new File([blob], `rec.${ext}`, { type: mimeType }));

        const res = await fetch('/api/stt', { method: 'POST', body: form });
        if (!res.ok) throw new Error(`STT ${res.status}`);

        const data = await res.json();
        const text = (data.text as string)?.trim();

        if (text) {
          onInterim(text);
          onFinal(text);
        } else {
          onInterim('');
          setSttError('Aucune parole détectée, réessayez.');
        }
      } catch {
        onInterim('');
        setSttError('Erreur lors de la transcription, réessayez.');
      }
    };

    recorder.start();
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
    <div className="bg-surface pt-2 pb-4 px-4">
      <div className="max-w-2xl mx-auto">
        {displayError && (
          <div className="mb-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {displayError}
          </div>
        )}

        {/* Pill container */}
        <div className={`
          rounded-3xl border bg-white transition-shadow
          ${isListening
            ? 'border-red-300 shadow-md shadow-red-100'
            : 'border-[#e5e5e5] shadow-sm focus-within:shadow-md'
          }
          ${disabled && !isListening ? 'opacity-60' : ''}
        `}>
          {/* Textarea */}
          <div className="px-4 pt-3.5 pb-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={onKey}
              disabled={disabled && !isListening}
              placeholder={
                isListening ? 'Je vous écoute…'
                : isSpeaking  ? 'Lecture en cours…'
                : (placeholder || 'Poser une question')
              }
              rows={1}
              className="w-full bg-transparent text-gray-900 text-[15px] resize-none outline-none placeholder:text-[#8e8ea0] leading-relaxed disabled:cursor-not-allowed"
            />
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center gap-1.5 px-3 pb-3 pt-0.5">

            {/* + button */}
            <button
              disabled={disabled}
              title="Joindre"
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>

            {/* Brand chip — non-interactive, just identity */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#e5e5e5] text-[13px] font-medium text-gray-700 select-none">
              <img src={daLogoSrc} alt="DA" width={15} height={15} style={{ borderRadius: 3, objectFit: 'contain' }} />
              <span>Direct Assurance</span>
            </div>

            <div className="flex-1" />

            {/* Mic / STT */}
            {sttSupported && (
              <button
                onClick={toggleSTT}
                title={isListening ? 'Arrêter la dictée' : 'Dicter (fr)'}
                className={`
                  relative w-9 h-9 rounded-full flex items-center justify-center transition-all
                  ${isListening
                    ? 'bg-red-500 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                  }
                `}
              >
                {isListening && (
                  <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40" />
                )}
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                </svg>
              </button>
            )}

            {/* No text → voice mode toggle | Has text → send arrow */}
            {!canSend ? (
              <button
                onClick={onToggleVoice}
                title={voiceMode ? 'Désactiver le mode vocal' : 'Activer le mode vocal'}
                className={`
                  relative w-9 h-9 rounded-full flex items-center justify-center transition-all
                  ${voiceMode
                    ? 'bg-gray-900 hover:bg-gray-700'
                    : 'bg-gray-900 hover:bg-gray-700'
                  }
                `}
              >
                {isSpeaking && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
                )}
                {voiceMode ? (
                  /* active: filled waveform bars */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <rect x="2"  y="9"  width="3" height="6"  rx="1.5" />
                    <rect x="7"  y="5"  width="3" height="14" rx="1.5" />
                    <rect x="12" y="7"  width="3" height="10" rx="1.5" />
                    <rect x="17" y="10" width="3" height="4"  rx="1.5" />
                  </svg>
                ) : (
                  /* inactive: speaker with cross */
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4a1 1 0 00-1 1v4a1 1 0 001 1h2l4 4V5L6 9z" />
                    <line x1="18" y1="9" x2="23" y2="14" />
                    <line x1="23" y1="9" x2="18" y2="14" />
                  </svg>
                )}
              </button>
            ) : (
              <button
                onClick={submit}
                title="Envoyer"
                className="w-9 h-9 rounded-full bg-gray-900 hover:bg-gray-700 flex items-center justify-center transition-all cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#8e8ea0] mt-2">
          L'assistant IA peut faire des erreurs. Envisagez de vérifier les informations importantes.
        </p>
      </div>
    </div>
  );
}
