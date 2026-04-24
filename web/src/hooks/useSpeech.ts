import { useState, useRef, useCallback, useEffect } from 'react';

function stripMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/[👉💡🎉📞✅👋📎🔍💰🛡️🤔]/gu, '')
    .replace(/\n/g, '. ')
    .trim();
}

export function useSpeech() {
  const [voiceMode, setVoiceMode]   = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!window.speechSynthesis) return;
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = stripMd(text);
    if (!clean) return;
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang  = 'fr-FR';
    utt.rate  = 1.05;
    const frVoice = voicesRef.current.find(v => v.lang.startsWith('fr'));
    if (frVoice) utt.voice = frVoice;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend   = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  function toggleVoiceMode() {
    setVoiceMode(v => {
      if (v) window.speechSynthesis?.cancel();
      return !v;
    });
    setIsSpeaking(false);
  }

  return { voiceMode, toggleVoiceMode, isSpeaking, speak, stop };
}
