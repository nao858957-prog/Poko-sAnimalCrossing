// つり: おさかな・つりざお
// r = めずらしさ(1〜4) / loc = つれる ばしょ(pond ため池 / lake みずうみ / sea うみ) / time = day(ひる)・night(よる)だけ
export const RODS = [
  { id: 1, emoji: '🎣', name: 'きの つりざお', price: 30, color: '#b98a5a', wait: [4, 10], window: 1.5, bonus: 0, desc: 'はじめての つりざお。のんびり まとう' },
  { id: 2, emoji: '🎣', name: 'ぎんの つりざお', price: 100, color: '#c9d2dc', wait: [3, 8], window: 1.8, bonus: 1, desc: 'よく かかる。めずらしい さかなも' },
  { id: 3, emoji: '🎣', name: 'きんの つりざお', price: 240, color: '#ffcf3a', wait: [2.5, 6.5], window: 2.2, bonus: 2, desc: 'すぐ かかる！ おおものも ねらえる' },
];
export const SPOTS = { pond: 'ため池', lake: 'みずうみ', sea: 'うみ' };

export const FISH = [
  // ため池
  { id: 'funa', name: 'フナ', emoji: '🐟', loc: ['pond', 'lake'], r: 1, price: 2, size: [10, 28], line: 'ぴちぴち はねている！ ていばんの おさかな。' },
  { id: 'dojo', name: 'ドジョウ', emoji: '🐟', loc: ['pond'], r: 1, price: 2, size: [8, 18], line: 'にょろにょろ…！ ぬるぬる してるよ。' },
  { id: 'zarigani', name: 'ザリガニ', emoji: '🦞', loc: ['pond'], r: 1, price: 3, size: [6, 14], line: 'はさみを ふりまわしている！' },
  { id: 'koi', name: 'コイ', emoji: '🐟', loc: ['pond', 'lake'], r: 2, price: 6, size: [30, 70], line: 'どっしり おおきい！ ひげが ちゃーみんぐ。' },
  { id: 'kingyo', name: 'きんぎょ', emoji: '🐠', loc: ['pond'], r: 3, price: 12, size: [5, 12], line: 'どこから にげてきたのかな？ ひらひら きれい。' },
  { id: 'goldkoi', name: 'こがねの コイ', emoji: '🐠', loc: ['pond', 'lake'], r: 4, price: 40, size: [50, 80], time: 'day', line: 'ぴかぴか こがね色…！ ふくを よぶと いわれているよ。' },
  // みずうみ
  { id: 'bluegill', name: 'ブルーギル', emoji: '🐟', loc: ['lake'], r: 1, price: 2, size: [8, 20], line: 'あおい ほっぺが かわいい。' },
  { id: 'yamame', name: 'ヤマメ', emoji: '🐟', loc: ['lake'], r: 1, price: 3, size: [15, 30], line: 'すきとおった みずが すきな おさかな。' },
  { id: 'nijimasu', name: 'にじます', emoji: '🐟', loc: ['lake'], r: 2, price: 7, size: [25, 55], line: 'なないろに ひかっている！ やきたてが おいしそう。' },
  { id: 'namazu', name: 'ナマズ', emoji: '🐟', loc: ['lake'], r: 2, price: 8, size: [30, 70], time: 'night', line: 'よるの ぬしの ような ふんいき…。' },
  { id: 'iwana', name: 'イワナ', emoji: '🐟', loc: ['lake'], r: 3, price: 14, size: [25, 50], line: 'きれいな みずに すむ ちょっと めずらしい さかな。' },
  { id: 'unagi', name: 'うなぎ', emoji: '🐟', loc: ['lake'], r: 3, price: 16, size: [40, 90], time: 'night', line: 'にょろーん！ ごちそうの よかん。' },
  // うみ
  { id: 'wakame', name: 'わかめ', emoji: '🌿', loc: ['sea'], r: 1, price: 1, size: [30, 90], line: 'さかなじゃ なかった！ おみそしるに どうぞ。' },
  { id: 'iwashi', name: 'いわし', emoji: '🐟', loc: ['sea'], r: 1, price: 2, size: [10, 22], line: 'むれで やってきた！ ぎんいろに ひかる。' },
  { id: 'aji', name: 'あじ', emoji: '🐟', loc: ['sea'], r: 1, price: 3, size: [14, 30], line: 'あじふらいに したいなぁ。' },
  { id: 'saba', name: 'さば', emoji: '🐟', loc: ['sea'], r: 1, price: 3, size: [22, 45], line: 'しお焼きに ぴったり！' },
  { id: 'sazae', name: 'サザエ', emoji: '🐚', loc: ['sea'], r: 2, price: 5, size: [6, 12], line: 'つぼ焼きの においが してきそう。' },
  { id: 'kani', name: 'カニ', emoji: '🦀', loc: ['sea'], r: 2, price: 6, size: [8, 20], line: 'よこ歩きで にげようとしている！' },
  { id: 'kasago', name: 'カサゴ', emoji: '🐡', loc: ['sea'], r: 2, price: 7, size: [15, 35], line: 'ごつごつ してるけど、おいしい！' },
  { id: 'suzuki', name: 'スズキ', emoji: '🐟', loc: ['sea'], r: 2, price: 8, size: [40, 80], line: 'ぐいぐい ひっぱる！ すごい ちから！' },
  { id: 'fugu', name: 'ふぐ', emoji: '🐡', loc: ['sea'], r: 2, price: 9, size: [12, 30], line: 'ぷくーっ！ ふくらんで おこっている。' },
  { id: 'ika', name: 'イカ', emoji: '🦑', loc: ['sea'], r: 2, price: 8, size: [15, 40], line: 'すみを ぴゅっ！ ふくが よごれそう。' },
  { id: 'tako', name: 'タコ', emoji: '🐙', loc: ['sea'], r: 3, price: 14, size: [30, 80], line: 'うねうね くっついてくる！' },
  { id: 'hirame', name: 'ヒラメ', emoji: '🐟', loc: ['sea'], r: 3, price: 15, size: [35, 70], line: 'ひらひら…こうきゅう さかな！' },
  { id: 'tai', name: 'たい', emoji: '🐟', loc: ['sea'], r: 3, price: 16, size: [30, 70], line: 'めでたい！ おいわいの さかな。' },
  { id: 'hikarika', name: 'ひかる イカ', emoji: '🦑', loc: ['sea'], r: 4, price: 38, size: [20, 45], time: 'night', line: 'よるのうみで ぴかぴか ひかっている…！ ゆめみたい。' },
  { id: 'maguro', name: 'マグロ', emoji: '🐟', loc: ['sea'], r: 4, price: 45, size: [80, 150], line: 'とんでもない おおもの…！ うでが ぷるぷる！' },
  { id: 'kujira', name: 'ちいさな クジラ', emoji: '🐋', loc: ['sea'], r: 4, price: 60, size: [200, 400], line: 'ふしぎ…！ やさしい めで こっちを みている。そっと かえしてあげよう？' },
];
export const FISH_BY_ID = Object.fromEntries(FISH.map(f => [f.id, f]));
const JUNK = [
  { id: 'boots', name: 'ながぐつ', emoji: '👢', line: 'ながぐつが かかった…！ だれかの わすれものかな？' },
  { id: 'can', name: 'からっぽの かんづめ', emoji: '🥫', line: 'かんづめだ…。 ごみを ひろえて えらいね！' },
  { id: 'bottle', name: 'ボトル', emoji: '🍾', line: 'ボトルが かかった…。 なかは からっぽだった。' },
];

const isNightH = h => h >= 19 || h < 5;
// どんな さかなが かかるか
export function rollCatch(spot, hour, rodTier) {
  const night = isNightH(hour);
  if (Math.random() < 0.1) {
    const j = JUNK[Math.floor(Math.random() * JUNK.length)];
    return { junk: true, ...j };
  }
  const rod = RODS[Math.max(0, rodTier - 1)] || RODS[0];
  const base = { 1: 60, 2: 26, 3: 7, 4: 1.6 };
  const cand = FISH.filter(f => f.loc.includes(spot) && (!f.time || (f.time === 'night') === night));
  const ws = cand.map(f => base[f.r] * (1 + rod.bonus * 0.5 * (f.r - 1)) * (night && f.time === 'night' ? 1.8 : 1));
  const tot = ws.reduce((a, b) => a + b, 0);
  let x = Math.random() * tot, pick = cand[0];
  for (let i = 0; i < cand.length; i++) { x -= ws[i]; if (x <= 0) { pick = cand[i]; break; } }
  const [a, b] = pick.size;
  const t = Math.pow(Math.random(), 1.4); // 小さめが ふつう、おおきいのは すくなめ
  return { ...pick, cm: Math.round(a + (b - a) * t) };
}

// つりあげる とちゅうで ばれる(にげられる)かくりつ: めずらしい さかなほど ひっぱりが つよい
export function slipChance(fish, rodTier) {
  if (!fish || fish.junk) return 0;
  const rod = RODS[Math.max(0, rodTier - 1)] || RODS[0];
  return Math.max(0, ({ 1: 0, 2: 0.08, 3: 0.22, 4: 0.38 }[fish.r] || 0) - rod.bonus * 0.07);
}

// ---- さかなの アイコン (かたち・いろを しゅるいごとに かきわけた SVG) ----
// shape: fish ふつう / long ほそながい / flat ひらたい / big マグロ・ブリ型 / gold きんぎょ
// pat: stripe たて しま / spots はんてん / parr ようもん / patch コイの まだら / rainbow にじ いろの すじ / yoko よこ しま
const ICON = {
  funa: { shape: 'fish', body: '#a9b48a', belly: '#e8e4c8', fin: '#8d9a6e' },
  dojo: { shape: 'long', body: '#b09468', belly: '#e6d6b0', fin: '#8f774f', whisker: true },
  koi: { shape: 'fish', body: '#f4f0e6', belly: '#fffaf0', fin: '#e8795a', pat: 'patch', pc: '#ee6a3a', big: true },
  kingyo: { shape: 'gold', body: '#ff8a3d', belly: '#ffb06a', fin: '#ff6a2d' },
  goldkoi: { shape: 'fish', body: '#ffcf3a', belly: '#fff0a8', fin: '#e8a800', pat: 'spots', pc: '#fff7c8', big: true, shine: true },
  bluegill: { shape: 'fish', body: '#6aa9a0', belly: '#d9e8a0', fin: '#4f8a82', pat: 'yoko', pc: '#4f8a82', spot: '#ff8a3d', tall: true },
  yamame: { shape: 'fish', body: '#a8b070', belly: '#f0e8c0', fin: '#889050', pat: 'parr', pc: '#6a7248' },
  nijimasu: { shape: 'fish', body: '#b8c8d8', belly: '#f4f4f8', fin: '#8fa8c0', pat: 'rainbow', pc: '#ff7aa8', pc2: '#7ad0ff', spots: '#5a6a80' },
  namazu: { shape: 'fish', body: '#5a5a66', belly: '#a8a8b0', fin: '#454550', whisker: true, wide: true },
  iwana: { shape: 'fish', body: '#8a8a60', belly: '#e8dcb0', fin: '#7a7a50', pat: 'spots', pc: '#f4ead0' },
  unagi: { shape: 'long', body: '#3e3a44', belly: '#b8a888', fin: '#2e2a34' },
  iwashi: { shape: 'fish', body: '#8fb0d0', belly: '#f0f4f8', fin: '#6a90b0', pat: 'spots', pc: '#40506a', slim: true },
  aji: { shape: 'fish', body: '#a0b8c0', belly: '#f4f0e0', fin: '#7a9aa8', pat: 'yoko', pc: '#e8c850', slim: true },
  saba: { shape: 'fish', body: '#4f8aa0', belly: '#e8eef0', fin: '#3a6a80', pat: 'stripe', pc: '#2a4a5a', slim: true },
  suzuki: { shape: 'fish', body: '#b0bcc4', belly: '#f4f6f8', fin: '#8a98a2', big: true },
  hirame: { shape: 'flat', body: '#b8a078', belly: '#e8dcc0', fin: '#98825a', pat: 'spots', pc: '#7a6848' },
  tai: { shape: 'fish', body: '#f06a70', belly: '#ffc4c0', fin: '#d8484e', pat: 'spots', pc: '#7ad0ff', tall: true },
  maguro: { shape: 'big', body: '#2f4a7a', belly: '#c8d4e4', fin: '#e8c84a' },
};
let _iid = 0;
function fishSvg(o) {
  const id = 'fc' + (++_iid);
  const ry = o.slim ? 9 : o.tall ? 15 : o.wide ? 14 : 12, rx = o.big ? 27 : 25;
  const eye = (x, y) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff"/><circle cx="${x + 0.7}" cy="${y}" r="1.7" fill="#222"/>`;
  let g = '';
  if (o.shape === 'long') {
    const col = o.body;
    g += `<path d="M4 28 Q14 8 28 22 T58 14" fill="none" stroke="${o.fin}" stroke-width="12" stroke-linecap="round"/>`;
    g += `<path d="M4 28 Q14 8 28 22 T58 14" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round"/>`;
    g += `<path d="M6 30 Q16 13 29 25 T57 18" fill="none" stroke="${o.belly}" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>`;
    g += eye(57, 12);
    if (o.whisker) g += `<path d="M62 16 Q66 18 63 22 M62 14 Q67 13 66 9" stroke="${o.fin}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  } else if (o.shape === 'flat') {
    g += `<path d="M8 20 L0 10 L0 30 Z" fill="${o.fin}"/>`;
    g += `<ellipse cx="34" cy="20" rx="27" ry="16" fill="${o.body}"/><path d="M10 20 Q34 -2 58 20" fill="none" stroke="${o.fin}" stroke-width="3" opacity=".7"/><path d="M10 20 Q34 42 58 20" fill="none" stroke="${o.fin}" stroke-width="3" opacity=".7"/>`;
    g += `<clipPath id="${id}"><ellipse cx="34" cy="20" rx="27" ry="16"/></clipPath><g clip-path="url(#${id})" fill="${o.pc}">${[[22, 14, 2.4], [30, 24, 2], [40, 13, 2.6], [46, 24, 2.2], [34, 18, 1.8], [52, 18, 1.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;
    g += eye(50, 12) + eye(56, 18);
  } else if (o.shape === 'gold') {
    g += `<path d="M18 20 C8 4 -2 8 2 20 C-2 32 8 36 18 20 Z" fill="${o.fin}" opacity=".9"/><path d="M12 20 C6 12 4 14 6 20 C4 26 6 28 12 20 Z" fill="#ffd0a0" opacity=".7"/>`;
    g += `<ellipse cx="38" cy="21" rx="20" ry="14" fill="${o.body}"/><ellipse cx="38" cy="26" rx="15" ry="7" fill="${o.belly}"/>`;
    g += `<path d="M30 8 Q40 -3 50 8 Z" fill="${o.fin}"/>` + eye(50, 17) + `<path d="M43 20 Q46 24 43 28" stroke="#d85a20" stroke-width="1.5" fill="none"/>`;
  } else {
    const cx = 34, cy = 20;
    g += `<path d="M${cx - rx + 4} ${cy} L1 ${cy - (o.slim ? 10 : 13)} Q6 ${cy} 1 ${cy + (o.slim ? 10 : 13)} Z" fill="${o.fin}"/>`;
    g += `<path d="M${cx - 10} ${cy - ry + 2} Q${cx + 2} ${cy - ry - 10} ${cx + 14} ${cy - ry + 3} Z" fill="${o.fin}"/>`;
    g += `<path d="M${cx - 4} ${cy + ry - 2} L${cx - 10} ${cy + ry + 6} L${cx + 6} ${cy + ry - 1} Z" fill="${o.fin}"/>`;
    g += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${o.body}"/>`;
    g += `<clipPath id="${id}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath><g clip-path="url(#${id})">`;
    g += `<ellipse cx="${cx}" cy="${cy + ry * 0.75}" rx="${rx}" ry="${ry * 0.55}" fill="${o.belly}"/>`;
    if (o.pat === 'stripe') for (let i = 0; i < 6; i++) g += `<path d="M${16 + i * 6} ${cy - ry} q3 ${ry} 0 ${ry * 1.2}" stroke="${o.pc}" stroke-width="2" fill="none"/>`;
    if (o.pat === 'yoko') for (let i = 0; i < 3; i++) g += `<rect x="12" y="${cy - ry * 0.5 + i * ry * 0.45}" width="40" height="1.8" fill="${o.pc}" opacity=".7"/>`;
    if (o.pat === 'spots') for (const [x, y, r] of [[20, 14, 2.2], [27, 22, 2], [34, 13, 2.4], [40, 21, 2.1], [30, 17, 1.6], [46, 15, 1.8], [24, 27, 1.6]]) g += `<circle cx="${x}" cy="${y}" r="${r}" fill="${o.pc}"/>`;
    if (o.pat === 'parr') for (let i = 0; i < 6; i++) g += `<ellipse cx="${19 + i * 5.4}" cy="${cy}" rx="2" ry="4.5" fill="${o.pc}" opacity=".7"/>`;
    if (o.pat === 'patch') g += `<ellipse cx="24" cy="15" rx="8" ry="5" fill="${o.pc}"/><ellipse cx="40" cy="25" rx="7" ry="4.5" fill="${o.pc}"/><ellipse cx="46" cy="14" rx="4" ry="3.2" fill="${o.pc}"/>`;
    if (o.pat === 'rainbow') g += `<rect x="8" y="${cy - 3}" width="52" height="2.6" fill="${o.pc}"/><rect x="8" y="${cy - 0.4}" width="52" height="2.6" fill="${o.pc2}" opacity=".9"/>` + [[22, 14], [30, 12], [38, 14], [44, 24], [26, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="${o.spots}"/>`).join('');
    g += `</g>`;
    if (o.spot) g += `<circle cx="${cx + 12}" cy="${cy + 6}" r="3" fill="${o.spot}"/>`;
    g += `<path d="M${cx + 14} ${cy - ry + 3} Q${cx + 11} ${cy} ${cx + 14} ${cy + ry - 3}" stroke="${o.fin}" stroke-width="1.6" fill="none" opacity=".8"/>`;
    if (o.whisker) g += `<path d="M${cx + rx - 2} ${cy + 4} Q${cx + rx + 4} ${cy + 8} ${cx + rx + 1} ${cy + 12} M${cx + rx - 3} ${cy + 1} Q${cx + rx + 5} ${cy + 1} ${cx + rx + 4} ${cy - 4}" stroke="${o.fin}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    g += eye(cx + rx - 9, cy - 3);
    if (o.shape === 'big') g += [0, 1, 2, 3].map(i => `<path d="M${cx - 6 + i * 5} ${cy - ry + 1} l2 -5 l2 5 Z" fill="${o.fin}"/>`).join('');
    if (o.shine) g += `<path d="M58 4 l1.4 3 3 1.4 -3 1.4 -1.4 3 -1.4 -3 -3 -1.4 3 -1.4 Z" fill="#fff6a8"/>`;
  }
  return `<svg class="fi" viewBox="-2 -4 70 48" aria-hidden="true">${g}</svg>`;
}
// おさかなの アイコン (html)。しゅるいごとの SVG が あれば それ、なければ えもじ
export function fishIcon(f) { const o = f && ICON[f.id]; return o ? fishSvg(o) : (f && f.emoji) || '🐟'; }
