// やさしい BGM / こうかおん / よみあげ (Web Audio・Web Speech)
import { createBgm } from './bgm.js';
let ctx = null, master = null, bgmOn = true, timer = null, step = 0, bgm = null, bgmBus = null;
let bgmMode = 'orig', origEl = null, origPlaying = false;   // 'orig' = げんきょく(mp3) / 'chip' = でんしおんばん (js/bgm.js)

// iOS/Android では「ユーザーのタップの中」で音を解禁する必要がある。
// iPhone は マナーモード(消音スイッチ)だと WebAudio が無音になるため、
// 無音の <audio> を再生して「再生用」の音声セッションに切り替える。
const SILENT = 'data:audio/wav;base64,UklGRl4RAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YToRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
let htmlAudio = null, soundOn = true, unlocked = false;
function unlockHtmlAudio() {
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* 非対応 */ }
  try {
    if (!htmlAudio) { htmlAudio = new Audio(SILENT); htmlAudio.loop = true; htmlAudio.setAttribute('playsinline', ''); htmlAudio.volume = 1; }
    if (htmlAudio.paused) { const p = htmlAudio.play(); if (p && p.catch) p.catch(() => {}); }
  } catch (e) { /* 無視 */ }
}
export function isAudioRunning() { return !!ctx && ctx.state === 'running'; }
export function initAudio() {
  unlockHtmlAudio();
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = soundOn ? 0.5 : 0;
    master.connect(ctx.destination);
    ctx.onstatechange = () => { if (ctx.state === 'running') { if (bgmOn && soundOn) startBgm(); } else if (ctx.state === 'interrupted' || ctx.state === 'suspended') { stopBgm(); } };
  }
  if (ctx.state !== 'running') { const p = ctx.resume(); if (p && p.then) p.then(() => { if (bgmOn && soundOn) startBgm(); }).catch(() => {}); }
  if (!unlocked) {
    try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); unlocked = true; } catch (e) { /* 無視 */ }
  }
  if (ctx.state === 'running' && bgmOn && soundOn) startBgm();
}
// どのタップでも音を解禁 (最初の1回だけでなく、止まったら何度でも)
for (const ev of ['touchend', 'pointerup', 'click', 'keydown']) {
  document.addEventListener(ev, () => { if (!isAudioRunning() || (htmlAudio && htmlAudio.paused)) initAudio(); }, { passive: true, capture: true });
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (origPlaying) { origEl.pause(); origPlaying = false; } }   // アプリを はなれたら とめる
  else { if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); else if (ctx && bgmOn && soundOn) startBgm(); }
});
export function setSound(on) { soundOn = on; if (!on && 'speechSynthesis' in window) speechSynthesis.cancel(); if (master) master.gain.value = on ? 0.5 : 0; if (!on) stopBgm(); else if (ctx && ctx.state === 'running' && bgmOn) startBgm(); }
export function isSoundOn() { return soundOn; }
function tone(freq, t, dur, type = 'sine', vol = 0.12, dest) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || master);
  o.start(t); o.stop(t + dur + 0.05);
}
// げんきょく (assets/tonari.mp3)。HTMLAudio で ストリーミングするので、でんしおんばんより かるい
function startOrig() {
  if (origPlaying || !ctx || !soundOn) return;
  try {
    if (!origEl) {
      origEl = new Audio('./assets/tonari.mp3'); origEl.loop = true; origEl.preload = 'auto'; origEl.setAttribute('playsinline', '');
      const src = ctx.createMediaElementSource(origEl), g = ctx.createGain(); g.gain.value = 0.8; src.connect(g); g.connect(master);
      origEl.addEventListener('error', () => { bgmMode = 'chip'; origPlaying = false; if (bgmOn && soundOn) startBgm(); });   // よみこめなければ でんしおんばんに
    }
    origPlaying = true;
    const p = origEl.play(); if (p && p.catch) p.catch(() => { origPlaying = false; });
  } catch (e) { origPlaying = false; bgmMode = 'chip'; startBgm(); }
}
function stopOrig() { if (origEl && origPlaying) origEl.pause(); origPlaying = false; }
export function setBgmMode(m) { const nm = m === 'chip' ? 'chip' : 'orig'; if (nm === bgmMode) return; stopBgm(); bgmMode = nm; if (ctx && ctx.state === 'running' && bgmOn && soundOn) startBgm(); }
function startBgm() {
  if (bgmMode === 'orig') { startOrig(); return; }
  if (timer || !ctx || !soundOn) return;
  if (!bgm) {   // BGM「となりにいていいですか」の 電子音版 (js/bgm.js)。すこし まるく きこえるよう ローパスを かける
    bgmBus = ctx.createGain(); bgmBus.gain.value = 0.55;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200; lp.Q.value = 0.4;
    bgmBus.connect(lp); lp.connect(master);
    bgm = createBgm(ctx, bgmBus);
  }
  let next = ctx.currentTime + 0.25;
  const sched = () => {
    while (next < ctx.currentTime + 0.8) {
      bgm.schedule(step % bgm.steps, next);
      next += bgm.stepLen; step++;
    }
  };
  sched();
  timer = setInterval(sched, 250);
}
function stopBgm() { if (timer) { clearInterval(timer); timer = null; } stopOrig(); }
export function setBgm(on) { bgmOn = on; if (!ctx) return; on && ctx.state === 'running' ? startBgm() : stopBgm(); }

// こうかおんの おとの ならび: [しゅうはすう, はじまり(びょう), ながさ(びょう)]
export const SFX_SEQ = {
  tap: [[880, 0, 0.1]],
  pick: [[784, 0, 0.12], [1047, 0.08, 0.2]],
  send: [[660, 0, 0.08], [880, 0.06, 0.12]],
  recv: [[988, 0, 0.1], [1319, 0.07, 0.18]],
  heart: [[523, 0, 0.2], [659, 0.12, 0.2], [784, 0.24, 0.2], [1047, 0.36, 0.5]],
  open: [[523, 0, 0.12], [784, 0.08, 0.2]],
  splash: [[220, 0, 0.08], [330, 0.04, 0.1], [180, 0.1, 0.18]],
  bite: [[1175, 0, 0.1], [1568, 0.1, 0.1], [1175, 0.2, 0.1], [1568, 0.3, 0.2]],
  catch: [[523, 0, 0.14], [659, 0.1, 0.14], [784, 0.2, 0.14], [1047, 0.3, 0.35]],
  reel: [[392, 0, 0.06], [440, 0.05, 0.06], [494, 0.1, 0.06]],
};
export function sfx(kind) {
  if (window.__sfxLog) window.__sfxLog(kind);   // どうが さつえい用 (いつ どの おとが なったか きろく)
  if (!ctx || !soundOn) return;
  if (ctx.state !== 'running') { ctx.resume().catch(() => {}); }
  const t = ctx.currentTime;
  for (const [f, d, l] of SFX_SEQ[kind] || []) tone(f, t + d, l, 'sine', 0.15);
}

// りょうり ちゅうの おと (ノイズ・あわ・やかん・ちーん)。js/cookact.js から よばれる
let nbuf = null;
function noiseBurst(t, dur, vol, ftype, f, q = 1) {
  if (!nbuf) { nbuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = nbuf; fl.type = ftype; fl.frequency.value = f; fl.Q.value = q;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.02, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
export function cookSfx(kind, dur = 0.3) {
  if (window.__sfxLog) window.__sfxLog('cook-' + kind);
  if (!ctx || !soundOn) return;
  if (ctx.state !== 'running') { ctx.resume().catch(() => {}); return; }
  const t = ctx.currentTime;
  switch (kind) {
    case 'sizzle': for (let i = 0; i < dur * 26; i++) noiseBurst(t + (i / (dur * 26)) * dur + Math.random() * 0.03, 0.03 + Math.random() * 0.05, 0.05 * (1 - i / (dur * 40)), 'highpass', 3500 + Math.random() * 3500); break;
    case 'pour': noiseBurst(t, dur, 0.09, 'bandpass', 1500, 0.8); noiseBurst(t + dur * 0.4, dur * 0.7, 0.06, 'bandpass', 2400, 0.8); break;
    case 'toss': noiseBurst(t, 0.18, 0.07, 'bandpass', 900, 0.7); break;
    case 'shake': for (let i = 0; i < 9; i++) noiseBurst(t + i * 0.07, 0.04, 0.04, 'highpass', 6000); break;
    case 'press': noiseBurst(t, 0.1, 0.1, 'lowpass', 500); tone(130, t, 0.12, 'sine', 0.1); break;
    case 'plop': tone(220, t, 0.14, 'sine', 0.12); tone(330, t + 0.05, 0.12, 'sine', 0.08); break;
    case 'bubble': { const o = ctx.createOscillator(), g = ctx.createGain(), f = 260 + Math.random() * 180; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 2, t + 0.08); g.gain.setValueAtTime(0.09, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.12); break; }
    case 'ding': tone(1568, t, 1.0, 'sine', 0.13); tone(2349, t + 0.02, 0.8, 'sine', 0.07); break;
    default: noiseBurst(t, 0.05, 0.1, 'lowpass', 1200);   // tick
  }
}

export function duck(v) { if (master) master.gain.value = v ? 0.3 : 0.5; }

// よみあげ
let voiceOn = false;
export function setVoice(on) { voiceOn = on; if (!on && 'speechSynthesis' in window) speechSynthesis.cancel(); }
export function stopSpeak() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
export function speak(text, pitch = 1.2) {
  if (!voiceOn || !soundOn || !('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text.replace(/[…♪♥]/g, '、'));
  u.lang = 'ja-JP'; u.pitch = pitch; u.rate = 0.95;
  const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('ja'));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
export function bgmState() { return { mode: bgmMode, on: bgmOn, orig: origEl ? { paused: origEl.paused, t: origEl.currentTime } : null, synth: !!timer }; }
