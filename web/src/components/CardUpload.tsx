import { useState, useRef } from 'react';
import { OcrResult } from '../types';

type Step = 'idle' | 'preview' | 'processing' | 'done' | 'error';

interface Props {
  onConfirm: (data: OcrResult) => void;
  onSkip:    () => void;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-xs py-1 border-b border-border/50 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

export function CardUpload({ onConfirm, onSkip }: Props) {
  const [step,      setStep]      = useState<Step>('idle');
  const [preview,   setPreview]   = useState<string | null>(null);
  const [extracted, setExtracted] = useState<OcrResult | null>(null);
  const [file,      setFile]      = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    setFile(f);
    setPreview(await fileToDataUrl(f));
    setStep('preview');
  }

  async function analyse() {
    if (!file) return;
    setStep('processing');
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch('/api/ocr', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ imageBase64: dataUrl }),
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
      if (!Object.values(result).some(v => v !== null)) throw new Error('Nothing extracted');
      setExtracted(result);
      setStep('done');
    } catch {
      setStep('error');
    }
  }

  function reset() {
    setStep('idle');
    setPreview(null);
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="mt-3 rounded-[20px] border border-border overflow-hidden max-w-md animate-fade-up">

      {/* ── idle ── */}
      {step === 'idle' && (
        <>
          <div className="bg-elevated px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Scanner ma carte mutuelle</p>
              <p className="text-xs text-muted mt-0.5">Pré-remplissage automatique · Plus rapide</p>
            </div>
            <span className="text-[10px] font-medium text-muted bg-white border border-border rounded-full px-2 py-0.5">
              Optionnel
            </span>
          </div>
          <div className="bg-white px-4 py-4 flex flex-col gap-3">
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full border-2 border-dashed border-gray-300 text-sm text-gray-600 hover:border-da-blue/50 hover:text-da-blue hover:bg-red-50/20 transition-all"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importer une photo de ma carte
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf"
              capture="environment"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <button onClick={onSkip} className="text-xs text-muted hover:text-gray-700 text-center transition-colors">
              Passer cette étape →
            </button>
          </div>
        </>
      )}

      {/* ── preview ── */}
      {step === 'preview' && preview && (
        <div className="bg-white px-4 py-4 flex items-center gap-3">
          <img src={preview} alt="carte" className="w-16 h-10 object-cover rounded-lg border border-border shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-700 truncate">{file?.name}</p>
            <p className="text-[10px] text-muted mt-0.5">Prête à analyser</p>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <button onClick={analyse} className="px-3 py-1.5 rounded-full bg-da-blue text-white text-xs font-semibold hover:bg-da-blue-hover transition-colors">
              Analyser →
            </button>
            <button onClick={reset} className="px-3 py-1.5 rounded-full border border-border text-xs text-muted hover:border-muted transition-colors">
              Changer
            </button>
          </div>
        </div>
      )}

      {/* ── processing ── */}
      {step === 'processing' && (
        <div className="bg-white px-4 py-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-da-blue/20 border-t-da-blue animate-spin shrink-0" style={{ borderWidth: 3 }} />
          <div>
            <p className="text-sm font-medium text-gray-800">Lecture en cours…</p>
            <p className="text-xs text-muted mt-0.5">Extraction des informations</p>
          </div>
        </div>
      )}

      {/* ── done ── */}
      {step === 'done' && extracted && (
        <>
          <div className="bg-elevated px-4 py-3 border-b border-border flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <svg width="10" height="8" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="#16a34a" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p className="text-sm font-semibold text-gray-900">Informations reconnues</p>
          </div>
          <div className="bg-white px-4 py-3">
            <Field label="Mutuelle"          value={extracted.current_insurer} />
            <Field label="Date de naissance" value={extracted.date_of_birth}   />
            <Field label="Prénom"            value={extracted.first_name}       />
            <Field label="Nom"               value={extracted.last_name}        />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onConfirm(extracted)}
                className="flex-1 py-2.5 rounded-full bg-da-blue hover:bg-da-blue-hover text-white text-xs font-semibold transition-colors"
              >
                Confirmer →
              </button>
              <button
                onClick={onSkip}
                className="px-4 py-2.5 rounded-full border border-border text-xs text-muted hover:border-muted transition-colors"
              >
                Corriger
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── error ── */}
      {step === 'error' && (
        <div className="bg-white px-4 py-4 flex items-center gap-3">
          <span className="text-lg shrink-0">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">Carte non reconnue</p>
            <p className="text-xs text-muted mt-0.5">Image illisible ou format non supporté</p>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <button onClick={reset} className="px-3 py-1.5 rounded-full bg-da-blue text-white text-xs font-semibold transition-colors">
              Réessayer
            </button>
            <button onClick={onSkip} className="px-3 py-1.5 rounded-full border border-border text-xs text-muted transition-colors">
              Passer
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
