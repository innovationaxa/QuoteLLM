import { DALogo } from './DALogo';

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-4 py-3 animate-fade-up">
      <div className="shrink-0 mt-0.5">
        <DALogo size={32} />
      </div>
      <div className="flex items-center gap-1 h-8 pt-2">
        {[0, 150, 300].map(delay => (
          <span
            key={delay}
            className="block w-2 h-2 rounded-full bg-muted animate-blink"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
