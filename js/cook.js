// りょうり (ざいりょう → レシピ → おうちで つくる)。仕様は docs/cooking-spec.md
// ・ざいりょうは「ポンの しょくざい」(S.cook.pantry) と、はたけ・しまで あつめたもの (S.inv)
// ・どうぐは おうちの かぐ (バーナー / ミニキッチン / オーブン)。おうちの おおきさで おけるものが かわる
// ・レシピは セイママ・メイから おしえてもらう (なかよし度 + りょうりレベル)
import { ITEMS } from './missions.js';

// ポンの おみせで かえる ざいりょう
export const INGR = {
  egg: { emoji: '🥚', name: 'たまご', price: 3 },
  milk: { emoji: '🥛', name: 'ミルク', price: 4 },
  flour: { emoji: '🌾', name: 'こむぎこ', price: 3 },
  rice: { emoji: '🍚', name: 'おこめ', price: 4 },
  salt: { emoji: '🧂', name: 'しお', price: 1 },
  sugar: { emoji: '🍬', name: 'さとう', price: 2 },
  honey: { emoji: '🍯', name: 'はちみつ', price: 6 },
  butter: { emoji: '🧈', name: 'バター', price: 5 },
  cupnoodle: { emoji: '🍜', name: 'カップラーメン「ポコキン笹味」', price: 8, note: 'おゆを そそぐだけ！ バーナーが あれば テントでも つくれるよ' },
};
// ざいりょうの なまえ (ざいりょうぶくろ + もちもの)
export const ingName = id => (INGR[id] || ITEMS[id] || { emoji: '❔', name: id });
const FARM_IDS = ['carrot', 'tomato', 'strawberry', 'pumpkin'];
export const ingCount = (S, id) => (INGR[id] ? (S.cook.pantry[id] || 0) : (S.inv[id] || 0));
export function ingTake(S, id, n) { if (INGR[id]) S.cook.pantry[id] = Math.max(0, (S.cook.pantry[id] || 0) - n); else S.inv[id] = Math.max(0, (S.inv[id] || 0) - n); }
void FARM_IDS;

// どうぐ (かぐの id)。どれが あれば その レシピが つくれるか
export const TOOLS = {
  burner: { name: 'キャンプ用シングルバーナー', emoji: '🔥', stage: 1, how: 'ゆでる・おゆを そそぐ' },
  kitchen: { name: 'ミニキッチン', emoji: '🍳', stage: 2, how: 'ゆでる・いためる・やく' },
  oven: { name: 'オーブン', emoji: '♨️', stage: 3, how: 'オーブンで やく' },
};
// need → それを まかなえる どうぐ
export const NEED_TOOLS = { burner: ['burner', 'kitchen'], kitchen: ['kitchen'], oven: ['oven'] };
export const NEED_LABEL = { burner: 'バーナー（テントから）', kitchen: 'ミニキッチン（こじんまりの おうちから）', oven: 'オーブン（おおきな おうち）' };

// りょうりレベル (つくった りょうりの かず で あがる)
export const COOK_LV = [
  { lv: 1, need: 0, name: 'はじめての おりょうり' },
  { lv: 2, need: 5, name: 'おりょうり すき' },
  { lv: 3, need: 15, name: 'じょうず' },
  { lv: 4, need: 35, name: 'めいじん' },
  { lv: 5, need: 70, name: 'ごちそうやさん' },
];
export const cookLevel = xp => { let l = 1; for (const c of COOK_LV) if (xp >= c.need) l = c.lv; return l; };
export const cookNext = xp => COOK_LV.find(c => c.need > xp) || null;

// レシピ: ing=ざいりょう, need=どうぐ, lv=りょうりレベル, teach={who, f=なかよしレベル} (null=さいしょから)
export const RECIPES = [
  { id: 'boilcarrot', emoji: '🥕', name: 'ゆでニンジン', ing: { carrot: 2 }, need: 'burner', lv: 1, teach: null, line: 'あまくて ほくほく。ニンジンの あじが する〜', how: 'ゆでる' },
  { id: 'ramen', emoji: '🍜', name: 'ポコキン笹味 ラーメン', ing: { cupnoodle: 1 }, need: 'burner', lv: 1, teach: null, line: 'おゆを そそいで 3ぷん。ささの かおりが ふわっ…！', how: 'おゆを そそぐ' },
  { id: 'tomatosoup', emoji: '🍅', name: 'トマトスープ', ing: { tomato: 2, salt: 1 }, need: 'burner', lv: 1, teach: { who: 'sei', f: 1 }, line: 'ほかほか あったまる。ほっとする あじ', how: 'ゆでる',
    tl: 'トマトは ことこと にると あまくなるのよ。おしおは ひとつまみ。ね、かんたんでしょう？' },
  { id: 'sasasoup', emoji: '🎋', name: 'ささの スープ（てづくり）', ing: { sasa: 3, salt: 1 }, need: 'burner', lv: 1, teach: { who: 'sei', f: 1 }, line: 'ささの かおりが ふわ〜っ。ポコの だいこうぶつ！', how: 'ゆでる',
    tl: 'ポコの すきな ささの スープ。ささは さっと ゆでるだけで いいの。にしの たけやぶで とれるわ。' },
  { id: 'hotmilk', emoji: '🥛', name: 'ホットミルク', ing: { milk: 1 }, need: 'burner', lv: 1, teach: { who: 'mei', f: 1 }, line: 'あったかい…。ほっと するわね', how: 'あたためる',
    tl: 'ミルクを あたためるだけ。…ぐらぐら ふっとうさせちゃ だめよ。ふちが ぷつぷつ してきたら ひを とめるの。' },
  { id: 'herbtea', emoji: '🍵', name: 'ハーブティー', ing: { herb: 2, honey: 1 }, need: 'burner', lv: 2, teach: { who: 'sei', f: 2 }, line: 'いい かおり…。こころが ほどけるわ', how: 'おゆを そそぐ',
    tl: 'やわらかい くさに おゆを そそいで、はちみつを ひとさじ。ゆっくり のむと、ぐっすり ねむれるのよ。' },
  { id: 'eggporridge', emoji: '🥣', name: 'たまごがゆ', ing: { rice: 1, egg: 1, salt: 1 }, need: 'burner', lv: 2, teach: { who: 'sei', f: 2 }, line: 'やさしい あじ。おなかに しみる〜', how: 'ゆでる',
    tl: 'おこめを やわらかく にて、さいごに たまごを とじるの。つかれた ときは これが いちばんよ。' },
  { id: 'potage', emoji: '🎃', name: 'かぼちゃの ポタージュ', ing: { pumpkin: 1, milk: 1 }, need: 'burner', lv: 2, teach: { who: 'mei', f: 2 }, line: 'とろとろで あまい…！ おかわり したいかも', how: 'ゆでる',
    tl: 'かぼちゃを やわらかく して つぶして、ミルクで のばすの。…ポコが よろこぶから、おしえてあげる。' },
  { id: 'onigiri', emoji: '🍙', name: 'おにぎり', ing: { rice: 2, salt: 1 }, need: 'kitchen', lv: 2, teach: { who: 'sei', f: 2 }, line: 'ふっくら にぎれた！ ぱくっ。おいしい〜', how: 'にぎる',
    tl: 'てを ぬらして おしおを つけて、ふんわり にぎるのが こつ。ぎゅっと しすぎないのよ。' },
  { id: 'tamagoyaki', emoji: '🍳', name: 'たまごやき', ing: { egg: 2, sugar: 1 }, need: 'kitchen', lv: 2, teach: { who: 'sei', f: 3 }, line: 'ふんわり あまい！ きれいに まけたね', how: 'やく',
    tl: 'たまごに おさとうを ちょっぴり。なんども くるくる まいて いくの。わたしの いえの あじよ。' },
  { id: 'tomatoegg', emoji: '🍅', name: 'トマトの たまごいため', ing: { tomato: 1, egg: 2 }, need: 'kitchen', lv: 3, teach: { who: 'mei', f: 3 }, line: 'ふわとろ！ トマトの すっぱさが ちょうどいい', how: 'いためる',
    tl: 'たまごは はんじゅくで ひを とめるの。…わたし、これ だけは じしん あるのよ。' },
  { id: 'pancake', emoji: '🥞', name: 'ふわふわホットケーキ（てづくり）', ing: { flour: 1, egg: 1, milk: 1 }, need: 'oven', lv: 3, teach: { who: 'mei', f: 3 }, line: 'ふわっふわ！ ほっぺが おちそう', how: 'オーブンで やく',
    tl: 'まぜすぎない ことが ひみつ。…ほ、ほんとは ポコに たべさせたくて おぼえたのよ。' },
  { id: 'cookie', emoji: '🍪', name: 'クッキー', ing: { flour: 1, butter: 1, sugar: 1 }, need: 'oven', lv: 3, teach: { who: 'mei', f: 4 }, line: 'さくさく あまい。おちゃが ほしくなるね', how: 'オーブンで やく',
    tl: 'バターと おさとうを よく まぜて、やくの。…おちゃの じかんに みんなで たべたいわ。' },
];
export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map(r => [r.id, r]));

// ともだち ごとの このみ (つくった りょうり)。のっていない りょうりは ふつうに「すき」
export const COOK_PREFS = {
  poko: { love: ['sasasoup', 'pancake', 'ramen', 'hotmilk'], dislike: [] },
  mei: { love: ['pancake', 'cookie', 'tomatoegg'], dislike: ['sasasoup'] },
  sei: { love: ['tomatosoup', 'herbtea', 'onigiri', 'eggporridge'], dislike: [] },
  rin: { love: ['herbtea', 'cookie'], dislike: [] },
  pa: { love: ['boilcarrot', 'sasasoup'], dislike: ['pancake'] },
  ku: { love: ['hotmilk', 'potage'], dislike: [] },
  haru: { love: ['cookie', 'boilcarrot'], dislike: [] },
  nami: { love: ['ramen', 'onigiri'], dislike: [] },
  kuro: { love: ['herbtea', 'tamagoyaki'], dislike: [] },
  pon: { love: ['ramen', 'onigiri'], dislike: [] },
  chao: { love: ['tomatosoup', 'tomatoegg'], dislike: [] },
};

// ---- ロジック (S は セーブデータ) ----
export const freshCook = () => ({ xp: 0, recipes: ['boilcarrot', 'ramen'], made: {}, pantry: {}, dishes: {} });
export function ensureCook(S) {
  if (!S.cook || typeof S.cook !== 'object') S.cook = freshCook();
  const c = S.cook; c.xp = c.xp || 0; c.recipes = Array.isArray(c.recipes) ? c.recipes : []; c.made = c.made || {}; c.pantry = c.pantry || {}; c.dishes = c.dishes || {};
  for (const id of ['boilcarrot', 'ramen']) if (!c.recipes.includes(id)) c.recipes.push(id);
  return c;
}
// おうちに おいてある どうぐ (おいた かぐの なかで その おうちで つかえる もの)
export function homeTools(S) {
  const st = S.home.stage, out = new Set();
  if (!st) return out;
  for (const it of S.home.items) { const t = TOOLS[it.id]; if (t && st >= t.stage) out.add(it.id); }
  return out;
}
export const toolOk = (need, tools) => NEED_TOOLS[need].some(t => tools.has(t));
export const missingIng = (S, r) => Object.entries(r.ing).filter(([id, n]) => ingCount(S, id) < n);
// りょうりを つくる: freeIng=true なら ざいりょうを もらえる (セイママと いっしょ)
export function cookDish(S, r, freeIng = false) {
  const c = ensureCook(S);
  if (!freeIng) for (const [id, n] of Object.entries(r.ing)) ingTake(S, id, n);
  c.dishes[r.id] = (c.dishes[r.id] || 0) + 1;
  const first = !c.made[r.id];
  c.made[r.id] = (c.made[r.id] || 0) + 1;
  const before = cookLevel(c.xp);
  c.xp += first ? 3 : 1;
  const after = cookLevel(c.xp);
  return { first, levelUp: after > before ? after : 0 };
}
// その ともだちから まだ おしえて もらえる レシピ (なかよしレベル と りょうりレベルが たりている もの)
export function teachable(S, who, friendLv) {
  const c = ensureCook(S), lv = cookLevel(c.xp);
  return RECIPES.filter(r => r.teach && r.teach.who === who && !c.recipes.includes(r.id));
}
export function teachStatus(S, who, friendLv) {
  const c = ensureCook(S), lv = cookLevel(c.xp), list = teachable(S, who, friendLv);
  const ready = list.find(r => friendLv >= r.teach.f && lv >= r.lv);
  if (ready) return { ready };
  const next = list.sort((a, b) => a.teach.f - b.teach.f || a.lv - b.lv)[0] || null;
  return { next };
}
