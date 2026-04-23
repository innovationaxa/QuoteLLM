import { QuickReplyOption } from '../types';

interface Props {
  options: QuickReplyOption[];
  onSelect: (value: string, label: string) => void;
}

export function QuickReply({ options, onSelect }: Props) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 animate-fade-up">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value, opt.emoji ? `${opt.emoji} ${opt.label}` : opt.label)}
          className="
            flex items-center gap-2 px-4 py-2.5 rounded-xl
            border border-border bg-elevated
            text-sm text-white hover:border-muted hover:bg-[#3a3a3a]
            transition-all duration-150 active:scale-95
          "
        >
          {opt.emoji && <span>{opt.emoji}</span>}
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
