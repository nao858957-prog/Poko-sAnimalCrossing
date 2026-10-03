// ゲームの BGM (js/audio.js と同じ音づくり) を オフラインで 62秒ぶん 書き出す
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const b = await chromium.launch({ args: ['--no-sandbox'] });
const page = await b.newPage();
await page.goto('about:blank');
const data = await page.evaluate(async () => {
  const sr = 44100, DUR = 62;
  const ctx = new OfflineAudioContext(1, sr * DUR, sr);
  const master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
  const CHORDS = [[0, 4, 7], [-3, 0, 4], [-5, -1, 2], [-7, -3, 0]];
  const midi = n => 261.63 * Math.pow(2, n / 12);
  let s = 12345; const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  function tone(freq, t, dur, type = 'sine', vol = 0.12) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  const beat = 0.62; let next = 0.2, step = 0;
  while (next < DUR) {
    const ch = CHORDS[Math.floor(step / 8) % CHORDS.length];
    if (step % 8 === 0) ch.forEach(n => tone(midi(n - 12), next, beat * 7, 'triangle', 0.035));
    if (rnd() < 0.7) {
      const n = ch[step % 3] + 12 * (rnd() < 0.3 ? 1 : 0);
      const p = rnd() < 0.5 ? n : PENTA[Math.floor(rnd() * PENTA.length)];
      tone(midi(p), next, beat * 1.6, 'sine', 0.06);
    }
    next += beat; step++;
  }
  const buf = await ctx.startRendering();
  return Array.from(buf.getChannelData(0));
});
const f = new Float32Array(data);
// 正規化 (音量を そろえる) + 16bit wav
let mx = 0; for (const v of f) mx = Math.max(mx, Math.abs(v));
const g = 0.85 / (mx || 1);
const pcm = Buffer.alloc(f.length * 2);
for (let i = 0; i < f.length; i++) pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(f[i] * g * 32767))), i * 2);
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(44100, 24); h.writeUInt32LE(88200, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
fs.writeFileSync('/tmp/claude-0/vid/game_bgm.wav', Buffer.concat([h, pcm]));
console.log('bgm ok', f.length / 44100, 'sec, peak', mx.toFixed(3));
await b.close();
