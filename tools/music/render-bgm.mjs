// ゲームの BGM (js/bgm.js) を オフラインで wav に かきだす (動画づくり用・かくにん用)
//   使い方: python3 -m http.server 8765 (リポジトリの ルート) → node render-bgm.mjs [びょう=100] [out.wav]
//   ※ 秒数が 曲より ながい ときは ループします。Playwright の よみこみパスは かんきょうに あわせて。
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const DUR = Number(process.argv[2] || 100), OUT = process.argv[3] || 'bgm_game.wav';
const b = await chromium.launch({ args: ['--no-sandbox'] });
const page = await b.newPage();
await page.goto('http://localhost:8765/index.html');
const data = await page.evaluate(async DUR => {
  const sr = 44100, ctx = new OfflineAudioContext(1, sr * DUR, sr);
  const { createBgm } = await import('/js/bgm.js');
  const master = ctx.createGain(); master.gain.value = 0.5;
  const bus = ctx.createGain(); bus.gain.value = 0.55;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200; lp.Q.value = 0.4;
  bus.connect(lp); lp.connect(master); master.connect(ctx.destination);
  const g = createBgm(ctx, bus);
  for (let s = 0, t = 0.1; t < DUR; s++, t += g.stepLen) g.schedule(s % g.steps, t);
  const buf = await ctx.startRendering();
  return Array.from(buf.getChannelData(0));
}, DUR);
const f = new Float32Array(data); let mx = 0; for (const v of f) mx = Math.max(mx, Math.abs(v));
const gain = 0.85 / (mx || 1), pcm = Buffer.alloc(f.length * 2);
for (let i = 0; i < f.length; i++) pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(f[i] * gain * 32767))), i * 2);
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(44100, 24); h.writeUInt32LE(88200, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
fs.writeFileSync(OUT, Buffer.concat([h, pcm]));
console.log('ok', OUT, (f.length / 44100).toFixed(1) + 's, peak', mx.toFixed(3));
await b.close();
