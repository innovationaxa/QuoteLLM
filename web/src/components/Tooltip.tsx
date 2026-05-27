import { useState, useRef, useEffect } from 'react';

interface Props { term: string; explanation: string }

export function Tooltip({ term, explanation }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block">
      <span
        className="border-b border-dashed border-gray-400 text-gray-700 cursor-help"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
      >
        {term}
      </span>
      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 z-20 leading-relaxed shadow-xl">
          {explanation}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}
