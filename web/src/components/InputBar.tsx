import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface Props {
  disabled:    boolean;
  placeholder: string;
  error:       string | null;
  onSubmit:    (value: string) => void;
}

export function InputBar({ disabled, placeholder, error, onSubmit }: Props) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when enabled
  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  // Auto-grow textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  function submit() {
    const v = text.trim();
    if (!v || disabled) return;
    onSubmit(v);
    setText('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-border bg-surface pt-3 pb-4 px-4">
      <div className="max-w-2xl mx-auto">
        {error && (
          <div className="mb-2 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className={`
          flex items-end gap-3 rounded-2xl border px-4 py-3 transition-colors
          ${disabled
            ? 'border-border bg-elevated cursor-not-allowed opacity-50'
            : 'border-border bg-elevated focus-within:border-muted'
          }
        `}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKey}
            disabled={disabled}
            placeholder={disabled ? 'En attente de votre sélection…' : placeholder}
            rows={1}
            className="
              flex-1 bg-transparent text-white text-sm resize-none outline-none
              placeholder:text-muted leading-relaxed
              disabled:cursor-not-allowed
            "
          />
          <button
            onClick={submit}
            disabled={disabled || !text.trim()}
            className="
              shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
              bg-white disabled:bg-muted/30 disabled:cursor-not-allowed
              hover:bg-gray-200 transition-colors
            "
            title="Envoyer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <p className="text-center text-xs text-muted mt-2">
          Direct Assurances peut faire des erreurs. Ce devis est indicatif.
        </p>
      </div>
    </div>
  );
}
