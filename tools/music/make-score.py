#!/usr/bin/env python3
"""曲(mp3) → ゲーム用の楽譜データ(js/bgm-score.js) に 自動採譜する
  使い方:  python3 make-score.py <曲.mp3> [../../js/bgm-score.js]
  必要:   pip install basic-pitch onnxruntime librosa numpy   (ffmpeg も)
  やること: Basic Pitch で 音を ひろい → 16分音符に そろえ → メロディ(いちばん 上の せんりつ)と
           コード(はんしょうせつ ごと) を とりだす。楽器の わりふりは js/bgm.js 側。
  ※ じどう採譜なので ききながら、おかしな ところは bgm-score.js を てなおししてください。
"""
import sys, json, subprocess, tempfile, os
import numpy as np

SRC = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '../../js/bgm-score.js')
BPM, OFF = 91.7, 0.46               # きょくの テンポと さいしょの はくの ずれ (びょう) … ビートの そろい ぐあいで もとめた
beat = 60 / BPM; SL = beat / 4      # SL = 16ぶ音符
NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

wav = tempfile.mktemp(suffix='.wav')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', SRC, '-ac', '1', '-ar', '22050', wav], check=True)
from basic_pitch.inference import predict
from basic_pitch import ICASSP_2022_MODEL_PATH
_, _, ne = predict(wav, ICASSP_2022_MODEL_PATH, onset_threshold=0.5, frame_threshold=0.3, minimum_note_length=100, minimum_frequency=60, maximum_frequency=2200)
notes = [(s, e, p, a) for s, e, p, a, _ in ne]
total = max(e for _, e, _, _ in notes)
NBARS = int((total - OFF) / (beat * 4)) + 1
NBARS = min(NBARS, 37)

# ---- コード (はんしょうせつ ごと。3和音に まとめる) ----
TPL = {'': [0, 4, 7], 'm': [0, 3, 7], 'dim': [0, 3, 6], '7': [0, 4, 7, 10], 'M7': [0, 4, 7, 11], 'm7': [0, 3, 7, 10], 'sus4': [0, 5, 7]}
DIA = {0: '', 2: 'm', 4: 'm', 5: '', 7: '', 9: 'm', 11: 'dim'}
def chord(a, b):
    ch = np.zeros(12); bass = np.zeros(12)
    for s, e, p, am in notes:
        o = min(e, b) - max(s, a)
        if o <= 0 or p > 79: continue
        w = o * am; ch[p % 12] += w
        if p < 52: bass[p % 12] += 2 * w
    best = None
    for r in range(12):
        for q, iv in TPL.items():
            v = np.zeros(12)
            for i in iv: v[(r + i) % 12] = 1
            sc = (ch * v).sum() - 0.35 * (ch * (1 - v)).sum() + 0.8 * bass[r] - 0.15 * len(iv)
            if r in DIA and DIA[r] == q: sc += 0.25 * ch.sum()
            if best is None or sc > best[0]: best = (sc, r, q)
    q = {'7': '', 'M7': '', 'm7': 'm', 'sus4': ''}.get(best[2], best[2])
    return NAMES[best[1]] + q
chords = []
for i in range(NBARS):
    for j in range(2):
        a = OFF + i * 4 * beat + j * 2 * beat
        chords.append(chord(a, a + 2 * beat))
def tones(name):
    r = NAMES.index(name[:2] if len(name) > 1 and name[1] == '#' else name[0]); q = name[len(NAMES[r]):]
    return r, TPL[q]
def cpcs(name):
    r, iv = tones(name); return {(r + i) % 12 for i in iv}

# ---- メロディ (16ぶ音符の さきに いちばん つよい たかい おと) ----
cand = []
for s, e, p, a in notes:
    if 62 <= p <= 88 and e - s >= 0.1:
        cand.append((round((s - OFF) / SL), max(1, round((e - s) / SL)), p, a))
mel = {}
for st, du, p, a in cand:
    sc = a + 0.012 * (p - 60)
    if st not in mel or sc > mel[st][3]: mel[st] = (st, du, p, sc)
seq = sorted(mel.values())
DIAPC = {0, 2, 4, 5, 7, 9, 11}
out = []
for i, (st, du, p, sc) in enumerate(seq):
    if st < 0 or st >= NBARS * 16: continue
    nxt = seq[i + 1][0] if i + 1 < len(seq) else st + du
    du = min(du, max(1, nxt - st), 8)
    ci = min(len(chords) - 1, st // 8)
    if p % 12 not in DIAPC and not (p % 12 in cpcs(chords[ci]) and du >= 2):
        p = p - 1 if (p - 1) % 12 in DIAPC else p + 1     # ふとくいな 半音は ちかくの おとへ
    out.append([int(st), int(du), int(p)])
# おなじ高さの つづけて ふれる みじかい おとを まとめる
merged = []
for n in out:
    if merged and merged[-1][2] == n[2] and merged[-1][0] + merged[-1][1] == n[0] and n[1] <= 1: merged[-1][1] += n[1]
    else: merged.append(n)

score = {
    'bpm': BPM, 'bars': NBARS,
    'sections': [[1, 4, 'intro'], [5, 8, 'verse1'], [9, 16, 'verse2'], [17, 20, 'bridge1'], [21, 28, 'verse3'], [29, 32, 'bridge2'], [33, NBARS, 'outro']],
    'chords': chords, 'mel': merged,
}
js = '// 自動採譜データ (tools/music/make-score.py)。bpm は 1ぷんの はく、mel は [16分の位置, ながさ, MIDIノート]、chords は 半小節ごと。\n'
js += 'export const BGM_SCORE = ' + json.dumps(score, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(OUT, 'w').write(js)
print('bars', NBARS, 'chords', len(chords), 'melody notes', len(merged), '->', OUT)
