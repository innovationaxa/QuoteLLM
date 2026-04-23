export function TypingIndicator() {
  return (
    <div className="flex items-start gap-4 py-3 animate-fade-up">
      {/* DA Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-da-blue flex items-center justify-center text-xs text-white font-bold mt-0.5">
        DA
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
