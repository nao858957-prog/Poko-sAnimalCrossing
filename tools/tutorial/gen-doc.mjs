// だいほん (docs/tutorial-script.md) と、こえ づくり用の ファイル (voice_script/*.txt, lines.csv) を script.mjs から つくる
//   使い方: node gen-doc.mjs
import fs from 'fs';
import { SCENES, TOTAL, CPS } from './script.mjs';
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
let md = `# あそびかた どうが ナレーション台本（実況風・ポコ）\n\n全 ${mmss(TOTAL)}（約${Math.round(TOTAL)}秒）／ 1920×1080 ／ ナレーションは **${SCENES.reduce((n, s) => n + s.lines.length, 0)} 行**。\n` +
  `1行 = 1ファイル（\`voice/<ID>.wav\`）で Irodori-TTS に読ませてください。ファイル名は表の ID と同じにします。\n` +
  `読む速さの目安は 1秒 ${CPS}文字（ゆっくりめ）。年配の方向けに、はっきり・ゆっくり・やさしく。語尾は「〜なの」を ふんわり。\n\n` +
  `> 長さが少し ちがっても、\`node mux.mjs\` が自動で 位置を合わせます（はみ出すときは 1.3倍まで 早めます）。\n\n`;
const csv = ['id,scene_start_sec,start_sec,max_sec,text'];
fs.mkdirSync('voice_script', { recursive: true });
for (const s of SCENES) {
  md += `## ${s.id.replace('s', '')}. ${s.badge || s.head.replace(/\n/g, ' ')}（${mmss(s.start)}〜${mmss(s.start + s.dur)}）\n\n| ID | 開始 | 目安秒数 | セリフ |\n|---|---|---|---|\n`;
  s.lines.forEach((l, k) => {
    const next = s.lines[k + 1] ? s.lines[k + 1].at : s.dur - 0.3, mx = next - l.at - 0.1;
    md += `| ${l.id} | ${mmss(s.start + l.at)} | ${l.len.toFixed(1)}秒 | ${l.text} |\n`;
    csv.push(`${l.id},${s.start.toFixed(1)},${(s.start + l.at).toFixed(2)},${mx.toFixed(2)},"${l.text.replace(/"/g, '""')}"`);
    fs.writeFileSync(`voice_script/${l.id}.txt`, l.text + '\n');
  });
  md += `\n画面の見出し：**${s.head.replace(/\n/g, ' ')}**` + (s.pts.length ? '\n\n' + s.pts.map(p => `- ${p.t}`).join('\n') : '') + '\n\n';
}
fs.writeFileSync('../../docs/tutorial-script.md', md);
fs.writeFileSync('voice_script/lines.csv', '﻿' + csv.join('\n') + '\n');
console.log('ok', SCENES.length, 'scenes');
