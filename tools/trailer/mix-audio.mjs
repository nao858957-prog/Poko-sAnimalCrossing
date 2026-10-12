// どうがの 音声(BGM + こうかおん)を つくって、えいぞうに かさねる
//   使い方: node mix-audio.mjs <long|short> <video.mp4> <cues.json> <bgm.wav> <out.mp4> [sfxDir=../music/sfx]
//     cues.json … capture.mjs / capture-short.mjs が かきだす (k=コマ, こうかおん)。
//     bgm.wav   … node ../music/render-bgm.mjs <びょう> bgm.wav [はじめの小節]   ( - にすると BGMなし = こうかおん だけ。
//                 じっしゃの カットを あとで いれる ときは BGMを べつファイルに しておくと ひろいやすい)
//     sfxDir    … node ../music/render-sfx.mjs で つくった sfx/*.wav
import { execFileSync } from 'child_process';
import fs from 'fs';
const [, , MODE, VIDEO, CUES, BGM, OUT, SFXDIR = new URL('../music/sfx', import.meta.url).pathname] = process.argv;
const FPS = 30;
const PROFILE = {
  long: { total: 3030, starts: [0, 150, 300, 540, 810, 1020, 1320, 1500, 1680, 1920, 2100, 2460, 2640, 2850], sparkleAt: 2850 + 8 },
  short: { total: 1065, starts: [0, 90, 225, 360, 540, 705, 930, 1005], sparkleAt: 1005 + 6 },
}[MODE];
const GAIN = { tap: 0.9, pick: 1.0, send: 0.9, recv: 0.9, heart: 1.0, open: 1.0, splash: 1.1, bite: 1.1, catch: 1.2, reel: 0.7, whoosh: 0.5, sparkle: 1.1, chao: 1.0 };
const NOBGM = BGM === '-', SFX_BOOST = NOBGM ? 3.2 : 2.4, BGM_VOL = Number(process.env.BGM_VOL || 0.34);
const events = [];
for (const [k, kind] of JSON.parse(fs.readFileSync(CUES, 'utf8'))) {
  if (kind === 'chao:act' || kind === 'chao:walk') events.push([k / FPS, 'chao']);
  else if (GAIN[kind] && fs.existsSync(`${SFXDIR}/${kind}.wav`)) events.push([k / FPS, kind]);
}
// 場面の つなぎ(しろい フェード)に ふわっと
for (const s of PROFILE.starts.slice(1)) events.push([s / FPS - 0.2, 'whoosh']);
events.push([PROFILE.sparkleAt / FPS, 'sparkle']);
// おなじ おとが ちかすぎる ものは ひとつに
events.sort((a, b) => a[0] - b[0]);
const keep = [], last = {};
for (const e of events) { if (last[e[1]] !== undefined && e[0] - last[e[1]] < 0.18) continue; last[e[1]] = e[0]; keep.push(e); }
const dur = PROFILE.total / FPS;
const inputs = ['-i', VIDEO], filt = [], labels = [], base = NOBGM ? 1 : 2;
if (!NOBGM) { inputs.push('-i', BGM); filt.push(`[1:a]atrim=0:${dur},volume=${BGM_VOL},afade=t=in:d=1.2,afade=t=out:st=${(dur - 3.5).toFixed(2)}:d=3.5[bgm]`); labels.push('[bgm]'); }
keep.forEach(([t, kind], i) => {
  inputs.push('-i', `${SFXDIR}/${kind}.wav`);
  const ms = Math.max(0, Math.round(t * 1000));
  filt.push(`[${i + base}:a]volume=${(GAIN[kind] * SFX_BOOST).toFixed(2)},adelay=${ms}|${ms}[s${i}]`); labels.push(`[s${i}]`);
});
filt.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0:duration=longest,atrim=0:${dur}${NOBGM ? '' : ',loudnorm=I=-16:TP=-1.5:LRA=11,aresample=44100'}[out]`);
console.log('こうかおん', keep.length, 'こ:', Object.entries(keep.reduce((m, e) => (m[e[1]] = (m[e[1]] || 0) + 1, m), {})).map(([k, v]) => k + '×' + v).join(' '));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filt.join(';'), '-map', '0:v', '-map', '[out]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', OUT], { stdio: 'inherit' });
if (NOBGM) { // こうかおんだけの おんせい(wav)も べつに かきだす (編集ソフトで つかう用)
  const stem = OUT.replace(/\.mp4$/, '.wav');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs.slice(2), '-filter_complex', filt.map(f => f.replace(/\[(\d+):a\]/, (m, n) => `[${n - 1}:a]`)).join(';'), '-map', '[out]', stem], { stdio: 'inherit' });
  console.log('ok', stem);
}
console.log('ok', OUT);
