// こえ (voice/<ID>.wav) と BGM を シーンの じかんに あわせて ならべ、audio.m4a を つくる
//   使い方: node mux.mjs [voiceDir=voice] [bgm.wav]   → audio.m4a   (こえが なければ BGM だけ)
import { execFileSync } from 'child_process';
import fs from 'fs';
import { SCENES, TOTAL } from './script.mjs';
const VD = process.argv[2] || 'voice', BGM = process.argv[3] || 'bgm.wav';
const inputs = [], filt = [], labels = [];
const addIn = f => { inputs.push('-i', f); return inputs.length / 2 - 1; };
if (fs.existsSync(BGM)) { const n = addIn(BGM); filt.push(`[${n}:a]atrim=0:${TOTAL.toFixed(1)},volume=0.10,afade=t=in:d=1.5,afade=t=out:st=${(TOTAL - 3).toFixed(1)}:d=3[bgm]`); labels.push('[bgm]'); }
let found = 0, warn = 0;
for (const s of SCENES) s.lines.forEach((l, k) => {
  const f = ['wav', 'mp3', 'flac', 'm4a'].map(e => `${VD}/${l.id}.${e}`).find(p => fs.existsSync(p));
  if (!f) return;
  found++;
  const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
  const slot = (s.lines[k + 1] ? s.lines[k + 1].at : s.dur - 0.2) - l.at - 0.1;
  let tempo = 1; if (dur > slot) { tempo = Math.min(1.3, dur / slot); if (dur / tempo > slot + 0.05) { warn++; console.log('!! 長い:', l.id, dur.toFixed(1) + 's /', slot.toFixed(1) + 's'); } }
  const n = addIn(f), ms = Math.round((s.start + l.at) * 1000);
  filt.push(`[${n}:a]aresample=44100,${tempo > 1 ? `atempo=${tempo.toFixed(3)},` : ''}volume=1.6,adelay=${ms}|${ms}[v${n}]`); labels.push(`[v${n}]`);
});
console.log('voice files:', found, '/', SCENES.reduce((n, s) => n + s.lines.length, 0), warn ? `(${warn} 件 はみ出し)` : '');
filt.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0:duration=longest,atrim=0:${TOTAL.toFixed(1)}[out]`);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filt.join(';'), '-map', '[out]', '-c:a', 'aac', '-b:a', '192k', 'audio.m4a'], { stdio: 'inherit' });
