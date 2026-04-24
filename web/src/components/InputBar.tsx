import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import daLogoSrc from '../assets/da-logo.png';

interface Props {
  disabled:    boolean;
  placeholder: string;
  error:       string | null;
  onSubmit:    (value: string) => void;
}

export function InputBar({ disabled, placeholder, error, onSubmit }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled) textareaRef.current?.focus();
  }, [disabled]);

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const canSend = !disabled && !!text.trim();

  return (
    <div className="bg-surface pt-3 pb-4 px-4">
      <div className="max-w-2xl mx-auto">
        {error && (
          <div className="mb-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ChatGPT-style prompt container */}
        <div className={`
          rounded-3xl border bg-white transition-colors
          ${disabled
            ? 'border-border opacity-60'
            : 'border-border shadow-sm focus-within:border-gray-300 focus-within:shadow-md'
          }
        `}>
          {/* Textarea row */}
          <div className="px-4 pt-3.5 pb-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={onKey}
              disabled={disabled}
              placeholder={disabled ? 'En attente de votre sélection…' : (placeholder || 'Poser une question')}
              rows={1}
              className="
                w-full bg-transparent text-gray-900 text-[15px] resize-none outline-none
                placeholder:text-muted leading-relaxed
                disabled:cursor-not-allowed
              "
            />
          </div>

          {/* Bottom action bar */}
          <div className="flex items-center gap-2 px-3 pb-3 pt-1">
            {/* Attachment button */}
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
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-elevated text-sm text-gray-700 select-none">
              <img src={daLogoSrc} alt="DA" width={16} height={16} style={{ borderRadius: 3, objectFit: 'contain' }} />
              <span className="font-medium text-[13px]">Direct Assurance</span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Mic button */}
            <button
              disabled={disabled}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Microphone"
            >
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
              </svg>
            </button>

            {/* Send button */}
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
                /* waveform bars when active */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <rect x="3"  y="9"  width="3" height="6"  rx="1.5" />
                  <rect x="8"  y="5"  width="3" height="14" rx="1.5" />
                  <rect x="13" y="7"  width="3" height="10" rx="1.5" />
                  <rect x="18" y="10" width="3" height="4"  rx="1.5" />
                </svg>
              ) : (
                /* arrow when inactive */
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
