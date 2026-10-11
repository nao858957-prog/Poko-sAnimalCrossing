// ゲームの BGM「となりにいていいですか」の 電子音(チップチューン)版。
//   楽譜は bgm-score.js (自動採譜)。ここでは 楽器(パルス波・三角波・ノイズ)に わりふって ならす。
//   createBgm(ctx, dest) → { steps, stepLen, schedule(step, time) }   ※ OfflineAudioContext でも つかえる
import { BGM_SCORE as S } from './bgm-score.js';

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const IV = { '': [0, 4, 7], m: [0, 3, 7], dim: [0, 3, 6] };
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
function parse(name) {
  const r = NAMES.indexOf(name.length > 1 && name[1] === '#' ? name.slice(0, 2) : name[0]);
  const q = name.slice(NAMES[r].length);
  return { r, iv: IV[q] || IV[''] };
}
// 小節ごとの そうぞう: [はじまり小節, おわり小節, ラベル] → 小節(0はじまり) から そのラベル
const SEC = new Array(S.bars).fill('verse1');
for (const [a, b, name] of S.sections) for (let i = a - 1; i < b && i < S.bars; i++) SEC[i] = name;
// セクションごとの 楽器 (ききながら ここで ととのえる)
const LAYERS = {
  intro:   { lead: 1, arp: 0, bell: 0, bass: 0, strum: 0, hat: 0, kick: 0, flute: 0 },
  verse1:  { lead: 1, arp: 1, bell: 1, bass: 0, strum: 0, hat: 0, kick: 0, flute: 0 },
  verse2:  { lead: 1, arp: 1, bell: 1, bass: 1, strum: 0, hat: 0, kick: 0, flute: 0 },
  bridge1: { lead: 0, arp: 1, bell: 0, bass: 1, strum: 0, hat: 0, kick: 0, flute: 1 },
  verse3:  { lead: 1, arp: 1, bell: 1, bass: 1, strum: 0, hat: 0, kick: 0, flute: 1 },
  bridge2: { lead: 1, arp: 1, bell: 0, bass: 1, strum: 0, hat: 0, kick: 0, flute: 0 },
  outro:   { lead: 1, arp: 0, bell: 0, bass: 0, strum: 0, hat: 0, kick: 0, flute: 0 },
};

export function createBgm(ctx, dest) {
  const stepLen = 60 / S.bpm / 4, steps = S.bars * 16;
  // メロディを ステップごとに ひける ように
  const lead = new Map(); for (const [st, du, p] of S.mel) lead.set(st, [du, p]);
  const chordAt = st => parse(S.chords[Math.min(S.chords.length - 1, st >> 3)]);

  // パルス波 (デューティ比 d)
  const pulse = d => {
    const n = 32, re = new Float32Array(n + 1), im = new Float32Array(n + 1);
    for (let k = 1; k <= n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * d);
    return ctx.createPeriodicWave(re, im);
  };
  const W = { p25: pulse(0.25), p125: pulse(0.125), p50: pulse(0.5) };
  // ノイズ
  const nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.3), ctx.sampleRate), nd = nb.getChannelData(0);
  let seed = 7; for (let i = 0; i < nd.length; i++) { seed = (seed * 1664525 + 1013904223) % 4294967296; nd[i] = seed / 4294967296 * 2 - 1; }

  function osc(wave, f, t, dur, vol, o = {}) {
    const os = ctx.createOscillator(), g = ctx.createGain();
    if (typeof wave === 'string') os.type = wave; else os.setPeriodicWave(wave);
    os.frequency.setValueAtTime(f, t);
    if (o.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.2; lg.gain.value = f * 0.006; l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + dur + 0.1); }
    const a = o.a ?? 0.006, end = t + dur;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + a);
    if (o.sus != null) { g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * o.sus), t + Math.min(dur * 0.6, o.dec ?? 0.18)); g.gain.setValueAtTime(Math.max(0.0002, vol * o.sus), end - 0.03); }
    g.gain.exponentialRampToValueAtTime(0.0001, end + (o.rel ?? 0.05));
    os.connect(g); g.connect(dest);
    os.start(t); os.stop(end + (o.rel ?? 0.05) + 0.05);
  }
  function noise(t, dur, vol, hp) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = nb; f.type = 'highpass'; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.02);
  }
  function kick(t, vol) {
    const os = ctx.createOscillator(), g = ctx.createGain();
    os.frequency.setValueAtTime(150, t); os.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    os.connect(g); g.connect(dest); os.start(t); os.stop(t + 0.2);
  }
  // 和音の おと を はんい(lo..lo+11) に おさめる
  const fold = (pc, lo) => lo + ((pc - lo) % 12 + 12) % 12;

  function schedule(step, t) {
    const bar = step >> 4, sec = SEC[bar], L = LAYERS[sec], pos = step & 15, half = (step >> 3), ch = chordAt(step);
    const tri = ch.iv.map(i => (ch.r + i) % 12);
    // 小節ごとの おおきさ: おわりは だんだん しずかに
    const fade = sec === 'outro' ? Math.max(0.25, 1 - (bar - (S.sections[S.sections.length - 1][0] - 1)) * 0.2) : 1;
    // --- リード (ピアノの せんりつ) ---
    const ld = lead.get(step);
    if (ld) {
      const [du, p] = ld, d = du * stepLen;
      if (sec === 'bridge1') {                 // ふえ: ぽんと はずむ
        osc('triangle', hz(p), t, Math.min(d, stepLen * 2.5), 0.15 * fade, { a: 0.015, sus: 0.7, vib: true });
      } else if (sec === 'bridge2' && bar < 29) {   // グロッケン ひとり
        osc('sine', hz(p + 12), t, d * 1.4, 0.1, { a: 0.003, sus: 0.2, dec: 0.5 }); osc('sine', hz(p + 24), t, d * 0.6, 0.02, { a: 0.003 });
      } else if (L.lead) {
        osc('triangle', hz(p), t, Math.max(d, stepLen * 1.3), 0.15 * fade, { a: 0.012, sus: 0.55, dec: 0.3, rel: 0.09 });
        osc('sine', hz(p), t, Math.max(d, stepLen * 1.3), 0.03 * fade, { a: 0.012, sus: 0.5, dec: 0.3 });   // まるみ
      }
      if (L.flute && sec === 'verse3') osc('triangle', hz(p + 12), t, Math.min(d, stepLen * 3), 0.025, { a: 0.02, sus: 0.7, vib: true });
    }
    // --- アルペジオ (ピチカート ふう) ---
    if (L.arp && (pos & 1) === 0) {
      const k = (pos >> 1) & 3, idx = [0, 1, 2, 1][k];
      const m = fold(tri[idx], 60) + (k === 3 ? 12 : 0);
      osc('triangle', hz(m), t, stepLen * 1.5, 0.028 * fade, { a: 0.006, sus: 0.3, dec: 0.12 });
    }
    // --- ベル (おんぷの すきま) ---
    if (L.bell && (pos & 7) === 6) osc('sine', hz(fold(tri[(half + 2) % 3], 72)), t, stepLen * 3, 0.02, { a: 0.003, sus: 0.2, dec: 0.4 });
    // --- ベース (さんかくは) ---
    if (L.bass && (pos & 7) === 0) osc('triangle', hz(fold(ch.r, 36)), t, stepLen * 3.4, 0.05, { a: 0.015 });
    if (L.bass && (pos & 7) === 4) osc('triangle', hz(fold(tri[2], 36)), t, stepLen * 2.6, 0.035, { a: 0.015 });
    // --- ストローク (ギターの かわり) ---
    if (L.strum && (pos & 7) === 4) tri.forEach((pc, i) => osc('triangle', hz(fold(pc, 55)), t + i * 0.012, stepLen * 2.6, 0.014, { a: 0.004, sus: 0.3, dec: 0.15 }));
    // --- リズム (すこしだけ) ---
    if (L.hat && (pos & 3) === 2) noise(t, 0.04, 0.02, 7000);
    if (L.kick && (pos === 0 || pos === 8)) kick(t, 0.09);
  }
  return { steps, stepLen, schedule, bars: S.bars };
}
