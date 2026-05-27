import { useState, useRef } from 'react';
import { OcrResult } from '../types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── extracted field display ─────────────────────────────────────────────────

function ExtractedField({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-1.5 text-sm border-b border-border/50 last:border-0">
      <span className="text-muted text-xs">{label}</span>
      <span className="text-gray-900 font-medium text-xs">{value}</span>
    </div>
  );
}

// ─── component ────────────────────────────────────────────────────────────────

type Step = 'idle' | 'preview' | 'processing' | 'done' | 'error';

interface Props {
  onConfirm: (data: OcrResult) => void;
  onSkip:    () => void;
}

export function CardUpload({ onConfirm, onSkip }: Props) {
  const [step,      setStep]      = useState<Step>('idle');
  const [preview,   setPreview]   = useState<string | null>(null);
  const [extracted, setExtracted] = useState<OcrResult | null>(null);
  const [file,      setFile]      = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    const url = await fileToDataUrl(f);
    setFile(f);
    setPreview(url);
    setStep('preview');
  }

  async function analyse() {
    if (!file) return;
    setStep('processing');
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });
      if (!res.ok) throw new Error('OCR failed');
      const { extracted: raw } = await res.json();
      const result: OcrResult = {
        current_insurer: raw.current_insurer ?? null,
        date_of_birth:   raw.date_of_birth   ?? null,
        first_name:      raw.first_name       ?? null,
        last_name:       raw.last_name        ?? null,
        contract_number: raw.contract_number  ?? null,
      };
      const hasData = Object.values(result).some(v => v !== null);
      if (!hasData) throw new Error('Nothing extracted');
      setExtracted(result);
      setStep('done');
    } catch {
      setStep('error');
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-up px-4">
      <div className="max-w-sm w-full">

        {/* ── idle ── */}
        {step === 'idle' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-da-blue/10 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#E30613" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Scannez votre carte mutuelle</h2>
              <p className="text-sm text-muted leading-relaxed">
                On pré-remplit votre profil automatiquement pour gagner du temps
              </p>
            </div>

            {/* Upload zone */}
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-[20px] p-8 flex flex-col items-center gap-3 hover:border-da-blue/50 hover:bg-red-50/30 transition-all cursor-pointer mb-3"
            >
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3} className="text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Cliquez ou déposez une photo</span>
              <span className="text-xs text-muted">JPG · PNG · HEIC · PDF</span>
            </button>

            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf"
              capture="environment"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              onClick={onSkip}
              className="w-full py-3 rounded-full border border-border text-sm text-muted hover:text-gray-900 hover:border-muted transition-colors"
            >
              Saisir manuellement
            </button>

            <p className="text-xs text-muted text-center mt-4">
              🔒 Image analysée localement · Non stockée · RGPD
            </p>
          </>
        )}

        {/* ── preview ── */}
        {step === 'preview' && preview && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Votre carte</h2>
            <div className="rounded-2xl overflow-hidden border border-border mb-4 shadow-sm">
              <img src={preview} alt="Carte mutuelle" className="w-full object-contain max-h-52" />
            </div>
            <button
              onClick={analyse}
              className="w-full py-3.5 rounded-full bg-da-blue hover:bg-da-blue-hover text-white text-sm font-semibold transition-colors mb-2"
            >
              Analyser la carte →
            </button>
            <button
              onClick={() => { setStep('idle'); setPreview(null); setFile(null); inputRef.current && (inputRef.current.value = ''); }}
              className="w-full py-2.5 rounded-full border border-border text-sm text-muted hover:border-muted transition-colors"
            >
              Changer l'image
            </button>
          </>
        )}

        {/* ── processing ── */}
        {step === 'processing' && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="w-14 h-14 rounded-full border-4 border-da-blue/20 border-t-da-blue animate-spin" />
            <p className="text-sm font-medium text-gray-800">Lecture en cours…</p>
            <p className="text-xs text-muted">Extraction des informations de votre carte</p>
          </div>
        )}

        {/* ── done ── */}
        {step === 'done' && extracted && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">Voici ce qu'on a reconnu</p>
            </div>

            <div className="rounded-2xl border border-border bg-white px-4 py-1 mb-4">
              <ExtractedField label="Mutuelle"          value={extracted.current_insurer} />
              <ExtractedField label="Date de naissance" value={extracted.date_of_birth}   />
              <ExtractedField label="Prénom"            value={extracted.first_name}       />
              <ExtractedField label="Nom"               value={extracted.last_name}        />
            </div>

            <button
              onClick={() => onConfirm(extracted)}
              className="w-full py-3.5 rounded-full bg-da-blue hover:bg-da-blue-hover text-white text-sm font-semibold transition-colors mb-2"
            >
              Confirmer et continuer →
            </button>
            <button
              onClick={onSkip}
              className="w-full py-2.5 rounded-full border border-border text-sm text-muted hover:border-muted transition-colors"
            >
              Corriger manuellement
            </button>
          </>
        )}

        {/* ── error ── */}
        {step === 'error' && (
          <>
            <div className="flex flex-col items-center gap-3 py-8 text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#ea580c" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">Lecture impossible</p>
              <p className="text-xs text-muted leading-relaxed">
                La carte n'est pas lisible ou le format n'est pas reconnu.
              </p>
            </div>
            <button
              onClick={() => setStep('idle')}
              className="w-full py-3 rounded-full bg-da-blue hover:bg-da-blue-hover text-white text-sm font-semibold transition-colors mb-2"
            >
              Réessayer
            </button>
            <button
              onClick={onSkip}
              className="w-full py-2.5 rounded-full border border-border text-sm text-muted hover:border-muted transition-colors"
            >
              Saisir manuellement
            </button>
          </>
        )}

      </div>
    </div>
  );
}
