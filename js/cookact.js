// りょうりを つくる ときの 「おりょうり ちゅう」の どうさ (フライパン・おなべ・やかん・オーブン…)。
//   playCookAct(r, { ings, sound, onDone })  … 3.7びょうほどの アニメ。タップで すすめる
//   CSS の アニメだけで うごかす (3D は つかわない ので かるい)
const KIND = { 'ゆでる': 'pot', 'あたためる': 'pot', 'おゆを そそぐ': 'pour', 'いためる': 'pan', 'やく': 'pan', 'にぎる': 'rice', 'オーブンで やく': 'oven' };
const DONE_AT = 2750, END_AT = 3750;

// [はじまり(ms), セリフ] と [はじまり(ms), おと, ながさ(びょう)]
const PLAN = {
  pan: { say: [[0, 'ひを つけるよ…🔥'], [650, 'じゅ〜っ！ いい おと'], [1500, 'ひっくり かえして… ほいっ！'], [2300, 'いい におい〜♪']],
    snd: [[100, 'tick'], [600, 'sizzle', 2.0], [1400, 'toss'], [1900, 'toss'], [2300, 'toss']] },
  pot: { say: [[0, 'おなべに ざいりょうを いれるよ'], [900, 'ぐつぐつ… にえてきた'], [1900, 'くるくる まぜまぜ'], [2450, 'あじみ… ぱくっ']],
    snd: [[100, 'tick'], [500, 'plop'], [900, 'bubble'], [1150, 'bubble'], [1400, 'bubble'], [1650, 'bubble'], [1950, 'bubble'], [2200, 'bubble']] },
  pour: { say: [[0, 'おゆを わかして…'], [800, 'とくとく… そそぐよ'], [1800, 'ふたを して… じ〜っと まつ'], [2400, 'いい かおり〜']],
    snd: [[100, 'tick'], [800, 'pour', 1.0], [2000, 'tick']] },
  rice: { say: [[0, 'てを ぬらして…'], [700, 'おしおを ぱらぱら'], [1500, 'ぎゅっ ぎゅっ'], [2300, 'ふんわり できた！']],
    snd: [[300, 'pour', 0.3], [800, 'shake'], [1500, 'press'], [1850, 'press'], [2200, 'press']] },
  oven: { say: [[0, 'オーブンを あっためるよ'], [800, 'ざいりょうを いれて…'], [1600, 'ふくらんできた〜'], [2350, 'チン！']],
    snd: [[100, 'tick'], [900, 'tick'], [2350, 'ding']] },
};

const flame = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="ca-flame"><path d="M0 0 C-14 -12 -10 -30 0 -44 C 10 -30 14 -12 0 0Z" fill="#ff8a3d"/><path d="M0 0 C-7 -6 -5 -16 0 -24 C5 -16 7 -6 0 0Z" fill="#ffe27a"/></g></g>`;
const COUNTER = '<rect x="0" y="176" width="300" height="24" fill="#c9a77c"/><rect x="0" y="176" width="300" height="5" fill="#e6c9a0"/>';
const SCENE = {
  pan: ing => `<svg viewBox="0 0 300 200" class="ca-svg">${COUNTER}
    <rect x="95" y="164" width="110" height="12" rx="5" fill="#555"/>
    <g class="ca-pan"><ellipse cx="150" cy="142" rx="68" ry="15" fill="#3d3d3d"/><ellipse cx="150" cy="138" rx="60" ry="11" fill="#5a5a5a"/>
    <rect x="212" y="135" width="84" height="11" rx="5" fill="#7a4e2c"/></g>${flame(124, 174, .5)}${flame(150, 174, .62)}${flame(176, 174, .5)}</svg>
    <div class="ca-food">${ing.map((e, i) => `<span style="--i:${i}">${e}</span>`).join('')}</div>
    <div class="ca-steam"><i></i><i></i><i></i></div>`,
  pot: ing => `<svg viewBox="0 0 300 200" class="ca-svg">${COUNTER}
    <rect x="80" y="164" width="140" height="12" rx="5" fill="#555"/>
    <g transform="translate(0 -14)"><path d="M62 92 H238 V146 Q238 166 218 166 H82 Q62 166 62 146Z" fill="#8fa1b3"/><rect x="50" y="104" width="16" height="9" rx="4" fill="#5b6b7a"/><rect x="234" y="104" width="16" height="9" rx="4" fill="#5b6b7a"/>
    <ellipse cx="150" cy="92" rx="88" ry="15" fill="#5b6b7a"/><ellipse cx="150" cy="94" rx="78" ry="11" fill="#ffd89a"/>
    <g class="ca-bub"><circle cx="110" cy="94" r="5" fill="#fff8"/><circle cx="150" cy="96" r="6" fill="#fff8"/><circle cx="188" cy="93" r="4" fill="#fff8"/><circle cx="130" cy="95" r="3" fill="#fff8"/><circle cx="170" cy="95" r="3.5" fill="#fff8"/></g>
    <g class="ca-spoon"><rect x="146" y="30" width="7" height="68" rx="3" fill="#a06a3c" transform="rotate(14 150 94)"/><ellipse cx="168" cy="94" rx="9" ry="5" fill="#a06a3c"/></g></g>${flame(120, 174, .5)}${flame(150, 174, .62)}${flame(180, 174, .5)}</svg>
    <div class="ca-drop">${ing.map((e, i) => `<span style="--i:${i}">${e}</span>`).join('')}</div>
    <div class="ca-steam"><i></i><i></i><i></i></div>`,
  pour: () => `<svg viewBox="0 0 300 200" class="ca-svg">${COUNTER}
    <g class="ca-cup"><path d="M104 118 H196 L186 172 H114Z" fill="#fff"/><path d="M104 118 H196 L194 128 H106Z" fill="#ffd6d6"/>
    <clipPath id="caClip"><path d="M108 122 H192 L184 170 H116Z"/></clipPath>
    <g clip-path="url(#caClip)"><rect class="ca-water" x="100" y="120" width="100" height="52" fill="#ffd89a"/></g></g>
    <g class="ca-kettle"><ellipse cx="82" cy="52" rx="42" ry="30" fill="#c8d4de"/><rect x="62" y="16" width="40" height="12" rx="6" fill="#8fa1b3"/><path d="M114 44 Q142 50 152 78 L142 82 Q134 62 112 58Z" fill="#c8d4de"/><path d="M48 40 Q22 28 28 64" stroke="#8a5a32" stroke-width="7" fill="none" stroke-linecap="round"/></g>
    <rect class="ca-stream" x="146" y="78" width="6" height="46" rx="3" fill="#8fd0ff"/></svg>
    <div class="ca-steam c"><i></i><i></i><i></i></div>`,
  rice: ing => `<svg viewBox="0 0 300 200" class="ca-svg">${COUNTER}
    <ellipse cx="150" cy="170" rx="70" ry="8" fill="#0002"/><path class="ca-rb" d="M150 62 Q196 138 186 158 Q150 172 114 158 Q104 138 150 62Z" fill="#fff" stroke="#e8e0d0" stroke-width="3"/>
    <rect class="ca-nori" x="132" y="124" width="36" height="32" rx="4" fill="#2f3b2f"/></svg>
    <div class="ca-salt">🧂</div><div class="ca-hands">🤲</div>
    <div class="ca-food small">${ing.map((e, i) => `<span style="--i:${i}">${e}</span>`).join('')}</div>`,
  oven: ing => `<svg viewBox="0 0 300 200" class="ca-svg">${COUNTER}
    <rect x="52" y="48" width="196" height="128" rx="14" fill="#9aa8b4"/><rect x="52" y="48" width="196" height="26" rx="14" fill="#7d8c99"/>
    <circle cx="86" cy="61" r="7" fill="#e8eef2"/><circle cx="114" cy="61" r="7" fill="#e8eef2"/><circle cx="214" cy="61" r="7" fill="#ff8a3d"/>
    <rect x="72" y="86" width="156" height="78" rx="9" fill="#2c2c32"/><rect class="ca-glow" x="76" y="90" width="148" height="70" rx="7" fill="#ff9d3d"/>
    <rect x="80" y="142" width="140" height="6" rx="3" fill="#555"/></svg>
    <div class="ca-bake">${ing.map((e, i) => `<span style="--i:${i}">${e}</span>`).join('')}</div>
    <div class="ca-heat"><i></i><i></i><i></i></div><div class="ca-timer">⏱</div>`,
};

export function playCookAct(r, o) {
  const root = document.getElementById('cookAct'); if (!root) { o.onDone(); return; }
  const kind = KIND[r.how] || 'pan', plan = PLAN[kind], ing = (o.ings || []).slice(0, 4);
  const lead = kind === 'rice' ? ['🍚'] : kind === 'pour' ? [] : ing;
  root.innerHTML = `<div class="ca-card k-${kind}">
    <div class="ca-title">${r.emoji} ${r.name}</div>
    <div class="ca-stage">${SCENE[kind](lead)}<div class="ca-chef">🐼</div><div class="ca-done"><b>${r.emoji}</b><span>できあがり！</span></div></div>
    <div class="ca-say" id="caSay">${plan.say[0][1]}</div>
    <div class="ca-bar"><i></i></div><div class="ca-hint">タップで すすむよ</div></div>`;
  root.classList.remove('hidden');
  const timers = []; let fin = false, ready = false;
  const T = (ms, fn) => timers.push(setTimeout(fn, ms));
  const card = root.firstElementChild, say = root.querySelector('#caSay');
  for (const [t, s] of plan.say) T(t, () => { say.textContent = s; say.classList.remove('pop'); void say.offsetWidth; say.classList.add('pop'); });
  for (const [t, k, d] of plan.snd) T(t, () => o.sound && o.sound(k, d || 0.3));
  T(DONE_AT, () => { card.classList.add('done'); say.textContent = 'できたよ！'; o.sound && o.sound('ding', 1); });
  T(400, () => { ready = true; });
  const finish = () => { if (fin) return; fin = true; timers.forEach(clearTimeout); root.removeEventListener('pointerdown', skip); root.classList.add('hidden'); root.innerHTML = ''; o.onDone(); };
  const skip = () => { if (!ready) return; if (!card.classList.contains('done')) { card.classList.add('done'); say.textContent = 'できたよ！'; o.sound && o.sound('ding', 1); timers.forEach(clearTimeout); setTimeout(finish, 700); } else finish(); };
  root.addEventListener('pointerdown', skip);
  T(END_AT, finish);
}
