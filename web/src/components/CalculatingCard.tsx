export function CalculatingCard() {
  return (
    <div className="mt-3 rounded-2xl border border-border bg-elevated px-5 py-4 flex items-center gap-4 animate-fade-up max-w-xs">
      <div className="w-6 h-6 rounded-full border-2 border-da-blue border-t-transparent animate-spin" />
      <p className="text-sm text-white">Calcul en cours…</p>
    </div>
  );
}
