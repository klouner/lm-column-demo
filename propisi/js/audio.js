// Звуки (синтезируются на лету) и озвучка букв голосом
import { store } from './store.js';

let ctx = null;
function ac() {
  if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (C) ctx = new C(); }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function tone(freq, t0, dur, type = 'sine', vol = 0.16) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  const t = c.currentTime + t0;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
}
export const sfx = {
  unlock() { if (store.state.sound) ac(); },
  tap() { if (store.state.sound) tone(520, 0, 0.07, 'triangle', 0.08); },
  pop(n = 1) { if (store.state.sound) { tone(660 + n * 110, 0, 0.12, 'triangle'); tone(990 + n * 110, 0.07, 0.16, 'sine', 0.1); } },
  page() { if (store.state.sound) [523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.22, 'triangle')); },
  win() { if (store.state.sound) [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.35, 'triangle', 0.18)); },
};

let voice = null;
function pickVoice() {
  const vs = window.speechSynthesis?.getVoices() || [];
  voice = vs.find(v => /ru[-_]RU/i.test(v.lang) && /milena|enhanced|premium|google/i.test(v.name)) || vs.find(v => /^ru/i.test(v.lang)) || null;
}
if (window.speechSynthesis) { pickVoice(); window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice); }

export function speak(text) {
  if (!store.state.voice || !window.speechSynthesis || !text) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ru-RU'; if (voice) u.voice = voice; u.rate = 0.85; u.pitch = 1.1;
    window.speechSynthesis.speak(u);
  } catch { /* озвучка недоступна */ }
}
