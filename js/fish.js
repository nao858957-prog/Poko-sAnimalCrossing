// つり: おさかな・つりざお
// r = めずらしさ(1〜4) / loc = つれる ばしょ(pond ため池 / lake みずうみ / sea うみ) / time = day(ひる)・night(よる)だけ
export const RODS = [
  { id: 1, emoji: '🎣', name: 'きの つりざお', price: 8, color: '#b98a5a', wait: [3, 8], window: 1.9, bonus: 0, desc: 'はじめての つりざお。のんびり まとう' },
  { id: 2, emoji: '🎣', name: 'ぎんの つりざお', price: 25, color: '#c9d2dc', wait: [2, 6], window: 2.3, bonus: 1, desc: 'よく かかる。めずらしい さかなも' },
  { id: 3, emoji: '🎣', name: 'きんの つりざお', price: 60, color: '#ffcf3a', wait: [1.5, 4.5], window: 2.8, bonus: 2, desc: 'すぐ かかる！ おおものも ねらえる' },
];
export const SPOTS = { pond: 'ため池', lake: 'みずうみ', sea: 'うみ' };

export const FISH = [
  // ため池
  { id: 'funa', name: 'フナ', emoji: '🐟', loc: ['pond', 'lake'], r: 1, price: 2, size: [10, 28], line: 'ぴちぴち はねている！ ていばんの おさかな。' },
  { id: 'dojo', name: 'ドジョウ', emoji: '🐍', loc: ['pond'], r: 1, price: 2, size: [8, 18], line: 'にょろにょろ…！ ぬるぬる してるよ。' },
  { id: 'zarigani', name: 'ザリガニ', emoji: '🦞', loc: ['pond'], r: 1, price: 3, size: [6, 14], line: 'はさみを ふりまわしている！' },
  { id: 'koi', name: 'コイ', emoji: '🎏', loc: ['pond', 'lake'], r: 2, price: 6, size: [30, 70], line: 'どっしり おおきい！ ひげが ちゃーみんぐ。' },
  { id: 'kingyo', name: 'きんぎょ', emoji: '🐠', loc: ['pond'], r: 3, price: 12, size: [5, 12], line: 'どこから にげてきたのかな？ ひらひら きれい。' },
  { id: 'goldkoi', name: 'こがねの コイ', emoji: '🏵️', loc: ['pond', 'lake'], r: 4, price: 40, size: [50, 80], time: 'day', line: 'ぴかぴか こがね色…！ ふくを よぶと いわれているよ。' },
  // みずうみ
  { id: 'bluegill', name: 'ブルーギル', emoji: '🐟', loc: ['lake'], r: 1, price: 2, size: [8, 20], line: 'あおい ほっぺが かわいい。' },
  { id: 'yamame', name: 'ヤマメ', emoji: '🐟', loc: ['lake'], r: 1, price: 3, size: [15, 30], line: 'すきとおった みずが すきな おさかな。' },
  { id: 'nijimasu', name: 'にじます', emoji: '🌈', loc: ['lake'], r: 2, price: 7, size: [25, 55], line: 'なないろに ひかっている！ やきたてが おいしそう。' },
  { id: 'namazu', name: 'ナマズ', emoji: '🐟', loc: ['lake'], r: 2, price: 8, size: [30, 70], time: 'night', line: 'よるの ぬしの ような ふんいき…。' },
  { id: 'iwana', name: 'イワナ', emoji: '🐟', loc: ['lake'], r: 3, price: 14, size: [25, 50], line: 'きれいな みずに すむ ちょっと めずらしい さかな。' },
  { id: 'unagi', name: 'うなぎ', emoji: '🐍', loc: ['lake'], r: 3, price: 16, size: [40, 90], time: 'night', line: 'にょろーん！ ごちそうの よかん。' },
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
  const base = { 1: 60, 2: 28, 3: 9, 4: 2.2 };
  const cand = FISH.filter(f => f.loc.includes(spot) && (!f.time || (f.time === 'night') === night));
  const ws = cand.map(f => base[f.r] * (1 + rod.bonus * 0.5 * (f.r - 1)) * (night && f.time === 'night' ? 1.8 : 1));
  const tot = ws.reduce((a, b) => a + b, 0);
  let x = Math.random() * tot, pick = cand[0];
  for (let i = 0; i < cand.length; i++) { x -= ws[i]; if (x <= 0) { pick = cand[i]; break; } }
  const [a, b] = pick.size;
  const t = Math.pow(Math.random(), 1.4); // 小さめが ふつう、おおきいのは すくなめ
  return { ...pick, cm: Math.round(a + (b - a) * t) };
}
