// おみせの品ぞろえ (おはな 🌼 でお買いもの)
export const FOODS = [
  { id: 'dango', emoji: '🍡', name: 'おだんご', price: 1, line: 'もちもち！ あまくて おいしい〜' },
  { id: 'lemonade', emoji: '🍋', name: 'はちみつレモネード', price: 2, line: 'すっぱ あまい！ ごくごく…ぷはーっ' },
  { id: 'soup', emoji: '🍲', name: 'ささのスープ', price: 2, line: 'ほかほか あったまるね…' },
  { id: 'takenoko', emoji: '🍚', name: 'タケノコごはん', price: 3, line: 'タケノコが シャキシャキ！ おかわり したいな' },
  { id: 'pancake', emoji: '🥞', name: 'ふわふわホットケーキ', price: 3, line: 'ふわっふわ！ ほっぺが おちそう' },
  { id: 'cake', emoji: '🍰', name: 'いちごのケーキ', price: 4, line: 'あまくて しあわせ…！' },
];
// slot: hat(あたま) / neck(くび) / body(からだ)
export const CLOTHES = [
  { id: 'knit', slot: 'hat', emoji: '🧢', name: 'あかいニットぼうし', price: 3 },
  { id: 'ribbon', slot: 'hat', emoji: '🎀', name: 'おおきな リボン', price: 4 },
  { id: 'sunflower', slot: 'hat', emoji: '🌻', name: 'ひまわりの ぼうし', price: 5 },
  { id: 'pandaear', slot: 'hat', emoji: '🐼', name: 'パンダの みみ', price: 6 },
  { id: 'crown', slot: 'hat', emoji: '👑', name: 'きらきら おうかん', price: 10 },
  { id: 'redscarf', slot: 'neck', emoji: '🧣', name: 'あかい マフラー', price: 4 },
  { id: 'bluescarf', slot: 'neck', emoji: '🧣', name: 'そらいろ マフラー', price: 4 },
  { id: 'apron', slot: 'body', emoji: '👗', name: 'あおい エプロン', price: 5 },
  { id: 'cape', slot: 'body', emoji: '🌟', name: 'ほしの マント', price: 8 },
  // ともだちから もらえる とくべつなもの (おみせでは うっていません)
  { id: 'daisy', slot: 'hat', emoji: '🌼', name: 'メイの しろい おはな', price: 0, quest: true },
  { id: 'leaf', slot: 'hat', emoji: '🍃', name: 'ポンの ばけじゅつの はっぱ', price: 0, quest: true },
  { id: 'bell', slot: 'neck', emoji: '🔔', name: 'クロの すず', price: 0, quest: true },
];
