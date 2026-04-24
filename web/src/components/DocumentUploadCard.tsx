import { useRef, useState } from 'react';

interface Props {
  onUpload:        (file: File) => void;
  onEnterManually: () => void;
  onSkip:          () => void;
}

export function DocumentUploadCard({ onUpload, onEnterManually, onSkip }: Props) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview]   = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('application/pdf')) return;
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview('pdf');
    }
    setTimeout(() => onUpload(file), 400);
  }

  return (
    <div className="mt-3 rounded-2xl border border-border overflow-hidden animate-fade-up max-w-md">
      {/* Header */}
      <div className="bg-da-blue/8 border-b border-border px-4 py-3 flex items-start gap-2">
        <span className="text-lg leading-none mt-0.5">📷</span>
        <div>
          <p className="text-sm font-semibold text-gray-900">Astuce gain de temps</p>
          <p className="text-xs text-muted mt-0.5 leading-relaxed">
            Envoie ta <strong className="text-gray-900">carte de tiers payant</strong> ou ton attestation —
            on extrait tes infos automatiquement et ça évite des questions.
          </p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 bg-elevated">
        {/* Drop zone */}
        <div
          className={`
            relative flex flex-col items-center justify-center gap-2
            border-2 border-dashed rounded-xl py-6 px-4 cursor-pointer
            transition-all duration-150
            ${dragging
              ? 'border-da-blue bg-da-blue/5 scale-[1.01]'
              : 'border-border hover:border-da-blue/50 hover:bg-white'}
          `}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {preview && preview !== 'pdf' ? (
            <img src={preview} alt="Document" className="max-h-20 rounded-lg object-contain opacity-80" />
          ) : preview === 'pdf' ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">📄</span>
              <p className="text-xs text-muted">PDF reçu, analyse en cours…</p>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-da-blue/10 flex items-center justify-center">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-da-blue">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-xs text-muted text-center leading-relaxed">
                Clique ou fais glisser une photo / PDF<br />
                <span className="text-da-blue font-medium">Optionnel · jamais obligatoire</span>
              </p>
            </>
          )}
        </div>

        {/* Alternatives */}
        <button
          onClick={onEnterManually}
          className="w-full py-2.5 px-4 rounded-xl border border-border text-sm text-gray-900 hover:border-muted hover:bg-white transition-colors"
        >
          ✍️ Saisir le montant directement
        </button>

        <button
          onClick={onSkip}
          className="text-xs text-muted hover:text-gray-600 transition-colors text-center py-0.5"
        >
          Passer cette étape →
        </button>
      </div>
    </div>
  );
}
