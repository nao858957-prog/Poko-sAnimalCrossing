// ポコ・メイ・セイママの 1日の すごしかた (ゲーム内の じこくに あわせて)
//   out   : そとで あそんで いる
//   in    : おうちの なかに いる
//   meal  : おうちの ダイニングで ごはん・おちゃ
//   sleep : ベッドで ぐっすり
export const MEALS = [
  { id: 'breakfast', name: 'あさごはん', emoji: '🍞', a: 6.5, b: 8.5 },
  { id: 'lunch', name: 'おひるごはん', emoji: '🍙', a: 12, b: 13.5 },
  { id: 'tea', name: 'おちゃの じかん', emoji: '🍵', a: 15, b: 16.5 },
  { id: 'dinner', name: 'ばんごはん', emoji: '🍲', a: 18, b: 19.5 },
];
export const MEAL_BY_ID = Object.fromEntries(MEALS.map(m => [m.id, m]));
export const mealAt = h => MEALS.find(m => h >= m.a && h < m.b) || null;
export const HOUSE_FOLK = ['sei', 'poko', 'mei'];

const SLEEP_FROM = { poko: 21, mei: 21.5, sei: 23 };
const SLEEP_TO = { poko: 6.5, mei: 6.5, sei: 5.5 };
// そとで すごす じかんたい
const OUT = {
  poko: [[8.5, 12], [13.5, 15], [16.5, 18]],
  mei: [[8.5, 12], [13.5, 15], [16.5, 18]],
  sei: [[9.5, 11.5], [16.5, 18]],
};

export function whereIs(id, h) {
  if (!HOUSE_FOLK.includes(id)) return 'out';
  if (h >= SLEEP_FROM[id] || h < SLEEP_TO[id]) return 'sleep';
  if (mealAt(h)) return 'meal';
  return OUT[id].some(([a, b]) => h >= a && h < b) ? 'out' : 'in';
}
export const isAsleep = (id, h) => whereIs(id, h) === 'sleep';
export const hhmm = h => `${Math.floor(h)}じ${h % 1 ? '30ぷん' : ''}`;

// おちゃ・ごはんの ひとこと
export const MEAL_LINES = {
  breakfast: { poko: 'ポコ「あさごはん、いただきますなの〜！ ふわふわなの！」', mei: 'メイ「…おはよう。べ、べつに おなかが すいてた わけじゃ ないけど」', sei: 'セイ「おはよう。たくさん たべて いってらっしゃいね」' },
  lunch: { poko: 'ポコ「おひるごはんの じかんなの！ おにぎり だいすきなの！」', mei: 'メイ「ちゃんと てを あらったの？ …いただきます」', sei: 'セイ「おひるは みんなで いただきましょう。ゆっくり ね」' },
  tea: { poko: 'ポコ「おやつ！ おやつの じかんなの〜！ おちゃも あったかいの！」', mei: 'メイ「…ま、まあ、おちゃの じかんくらい ゆっくりしても いいわよね」', sei: 'セイ「おちゃの じかんよ。ゆっくり どうぞ。…ふふ、いい かおり」' },
  dinner: { poko: 'ポコ「ばんごはんなの！ きょうは なんだろ〜！」', mei: 'メイ「いい においね。…おかわり、しても いい？」', sei: 'セイ「できたわよ。みんなで いただきましょう。あたたかい うちに ね」' },
};
// 友だち度ボーナス (1日1回ずつ)
export const MEAL_BONUS = { breakfast: 1, lunch: 1, tea: 3, dinner: 2 };
