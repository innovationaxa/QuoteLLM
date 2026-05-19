import { useState, useRef, useCallback, useEffect } from 'react';

// ─── helpers ─────────────────────────────────────────────────────────────────

function stripMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/[👉💡🎉📞✅👋📎🔍💰🛡️🤔]/gu, '')
    .replace(/\n+/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useSpeech() {
  const [voiceMode,  setVoiceMode]  = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError,   setTtsError]   = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Web Speech API fallback voices
  const wsVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const load = () => { wsVoicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    const clean = stripMd(text);
    if (!clean) return;

    stop();

    // ── Server-side ElevenLabs proxy ─────────────────────────────────────────
    try {
      setIsSpeaking(true);
      setTtsError(null);
      const res = await fetch('/api/tts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: clean }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).error ?? `TTS ${res.status}`);
      }

      const blob  = await res.blob();
      const url   = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => { URL.revokeObjectURL(url); setIsSpeaking(false); audioRef.current = null; };
      audio.onerror = () => { URL.revokeObjectURL(url); setIsSpeaking(false); audioRef.current = null; };
      await audio.play();
      return;
    } catch (err: any) {
      console.warn('[TTS] proxy failed:', err?.message);
      setIsSpeaking(false);
      setTtsError(`Mode vocal indisponible : ${err?.message ?? 'erreur inconnue'}`);
    }

    // ── Web Speech API fallback ───────────────────────────────────────────────
    if (!window.speechSynthesis) return;
    const utt   = new SpeechSynthesisUtterance(clean);
    utt.lang    = 'fr-FR';
    utt.rate    = 1.05;
    const frVoice = wsVoicesRef.current.find(v => v.lang.startsWith('fr'));
    if (frVoice) utt.voice = frVoice;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend   = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, [stop]);

  function toggleVoiceMode() {
    setVoiceMode(v => {
      if (v) stop();
      return !v;
    });
  }

  return { voiceMode, toggleVoiceMode, isSpeaking, speak, stop, ttsError };
}
