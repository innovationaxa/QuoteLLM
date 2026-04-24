import { useState, useRef, useCallback, useEffect } from 'react';

// ─── ElevenLabs config (set in .env.local / Vercel env vars) ─────────────────
const EL_KEY   = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined;
const EL_VOICE = import.meta.env.VITE_ELEVENLABS_VOICE_ID as string | undefined;
const USE_EL   = !!(EL_KEY && EL_VOICE);

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
  const [voiceMode, setVoiceMode]   = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Web Speech API fallback voices
  const wsVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  // Current ElevenLabs audio element
  const audioRef    = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (USE_EL || !window.speechSynthesis) return;
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

    // Cancel any ongoing speech
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();

    // ── ElevenLabs ──────────────────────────────────────────────────────────
    if (USE_EL) {
      setIsSpeaking(true);
      try {
        const res = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${EL_VOICE}`,
          {
            method: 'POST',
            headers: {
              'xi-api-key':   EL_KEY!,
              'Content-Type': 'application/json',
              'Accept':       'audio/mpeg',
            },
            body: JSON.stringify({
              text:          clean,
              model_id:      'eleven_multilingual_v2',
              voice_settings: { stability: 0.45, similarity_boost: 0.80, style: 0.2 },
            }),
          },
        );
        if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);

        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          setIsSpeaking(false);
          audioRef.current = null;
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          setIsSpeaking(false);
          audioRef.current = null;
        };
        await audio.play();
      } catch (err) {
        console.error('[ElevenLabs TTS]', err);
        setIsSpeaking(false);
      }
      return;
    }

    // ── Web Speech API fallback ──────────────────────────────────────────────
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
  }, []);

  function toggleVoiceMode() {
    setVoiceMode(v => {
      if (v) stop();
      return !v;
    });
  }

  return { voiceMode, toggleVoiceMode, isSpeaking, speak, stop };
}
