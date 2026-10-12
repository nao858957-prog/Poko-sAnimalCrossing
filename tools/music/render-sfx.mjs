// こうかおん (js/audio.js の SFX_SEQ) と どうが用の ちいさな おとを wav に かきだす → sfx/<なまえ>.wav
//   使い方: python3 -m http.server 8765 (リポジトリの ルート) → node render-sfx.mjs
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
fs.mkdirSync('sfx', { recursive: true });
const b = await chromium.launch({ args: ['--no-sandbox'] });
const page = await b.newPage();
await page.goto('http://localhost:8765/index.html');
const all = await page.evaluate(async () => {
  const { SFX_SEQ } = await import('/js/audio.js');
  const sr = 44100, out = {};
  const render = async (len, fn) => {
    const ctx = new OfflineAudioContext(1, Math.ceil(sr * len), sr), m = ctx.createGain(); m.gain.value = 0.5; m.connect(ctx.destination);
    fn(ctx, m); const buf = await ctx.startRendering(); return Array.from(buf.getChannelData(0));
  };
  const tone = (ctx, d, f, t, dur, vol, type = 'sine') => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(d); o.start(t); o.stop(t + dur + 0.05); };
  for (const [k, seq] of Object.entries(SFX_SEQ)) out[k] = await render(1.2, (ctx, m) => { for (const [f, d, l] of seq) tone(ctx, m, f, 0.02 + d, l, 0.15); });
  // 場面の つなぎ: ふわっとした かぜの おと
  out.whoosh = await render(0.9, (ctx, m) => {
    const n = ctx.createBuffer(1, sr, sr), d = n.getChannelData(0); let s = 3; for (let i = 0; i < d.length; i++) { s = (s * 1664525 + 1013904223) % 4294967296; d[i] = s / 4294967296 * 2 - 1; }
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = n; f.type = 'bandpass'; f.Q.value = 0.8;
    f.frequency.setValueAtTime(500, 0.02); f.frequency.exponentialRampToValueAtTime(3200, 0.6);
    g.gain.setValueAtTime(0.0001, 0.02); g.gain.exponentialRampToValueAtTime(0.35, 0.3); g.gain.exponentialRampToValueAtTime(0.0001, 0.7);
    src.connect(f); f.connect(g); g.connect(m); src.start(0.02);
  });
  // きらーん
  out.sparkle = await render(1.6, (ctx, m) => { [1047, 1319, 1568, 2093, 2637].forEach((f, i) => { tone(ctx, m, f, 0.02 + i * 0.07, 0.9 - i * 0.05, 0.1); tone(ctx, m, f * 2, 0.02 + i * 0.07, 0.4, 0.025); }); });
  // チャオの「ケーン」
  out.chao = await render(0.8, (ctx, m) => {
    for (const [t0, a, b2] of [[0.02, 1500, 2300], [0.22, 1700, 2600]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(a, t0); o.frequency.exponentialRampToValueAtTime(b2, t0 + 0.12);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18); o.connect(g); g.connect(m); o.start(t0); o.stop(t0 + 0.25);
    }
  });
  return out;
});
for (const [k, data] of Object.entries(all)) {
  const f = new Float32Array(data), pcm = Buffer.alloc(f.length * 2);
  for (let i = 0; i < f.length; i++) pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(f[i] * 32767))), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(44100, 24); h.writeUInt32LE(88200, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(`sfx/${k}.wav`, Buffer.concat([h, pcm]));
}
console.log('ok', Object.keys(all).join(' '));
await b.close();
