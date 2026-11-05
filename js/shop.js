// おみせの品ぞろえ (おはな 🌼 でお買いもの)
export const FOODS = [
  { id: 'dango', emoji: '🍡', name: 'おだんご', price: 3, line: 'もちもち！ あまくて おいしい〜' },
  { id: 'lemonade', emoji: '🍋', name: 'はちみつレモネード', price: 6, line: 'すっぱ あまい！ ごくごく…ぷはーっ' },
  { id: 'soup', emoji: '🍲', name: 'ささのスープ', price: 6, line: 'ほかほか あったまるね…' },
  { id: 'takenoko', emoji: '🍚', name: 'タケノコごはん', price: 9, line: 'タケノコが シャキシャキ！ おかわり したいな' },
  { id: 'pancake', emoji: '🥞', name: 'ふわふわホットケーキ', price: 9, line: 'ふわっふわ！ ほっぺが おちそう' },
  { id: 'cake', emoji: '🍰', name: 'いちごのケーキ', price: 12, line: 'あまくて しあわせ…！' },
];
// slot: hat(あたま) / neck(くび) / body(からだ)
export const CLOTHES = [
  { id: 'knit', slot: 'hat', emoji: '🧢', name: 'あかいニットぼうし', price: 12 },
  { id: 'ribbon', slot: 'hat', emoji: '🎀', name: 'おおきな リボン', price: 16 },
  { id: 'sunflower', slot: 'hat', emoji: '🌻', name: 'ひまわりの ぼうし', price: 20 },
  { id: 'pandaear', slot: 'hat', emoji: '🐼', name: 'パンダの みみ', price: 24 },
  { id: 'crown', slot: 'hat', emoji: '👑', name: 'きらきら おうかん', price: 40 },
  { id: 'redscarf', slot: 'neck', emoji: '🧣', name: 'あかい マフラー', price: 16 },
  { id: 'bluescarf', slot: 'neck', emoji: '🧣', name: 'そらいろ マフラー', price: 16 },
  { id: 'apron', slot: 'body', emoji: '👗', name: 'あおい エプロン', price: 20 },
  { id: 'cape', slot: 'body', emoji: '🌟', name: 'ほしの マント', price: 32 },
  // あき・ふゆの コーデ (もみじの きせつ〜ふゆの あいだ だけ おみせに ならぶ)
  { id: 'acorn', slot: 'hat', emoji: '🌰', name: 'どんぐりぼうし', price: 14, season: true },
  { id: 'maplecrown', slot: 'hat', emoji: '🍁', name: 'もみじの かんむり', price: 18, season: true },
  { id: 'beret', slot: 'hat', emoji: '🎨', name: 'ワインいろの ベレーぼう', price: 20, season: true },
  { id: 'earmuff', slot: 'hat', emoji: '🎧', name: 'ふわふわ みみあて', price: 18, season: true },
  { id: 'whiteknit', slot: 'hat', emoji: '⛄', name: 'しろい ポンポンニット', price: 16, season: true },
  { id: 'creamscarf', slot: 'neck', emoji: '🧣', name: 'ベージュの ぐるぐる マフラー', price: 18, season: true },
  { id: 'fluffy', slot: 'neck', emoji: '☁️', name: 'もこもこ えりまき', price: 22, season: true },
  { id: 'cardigan', slot: 'body', emoji: '🧥', name: 'くりいろ カーディガン', price: 28, season: true },
  { id: 'poncho', slot: 'body', emoji: '🍂', name: 'からしいろの ポンチョ', price: 30, season: true },
  // ともだちから もらえる とくべつなもの (おみせでは うっていません)
  { id: 'daisy', slot: 'hat', emoji: '🌼', name: 'メイの しろい おはな', price: 0, quest: true },
  { id: 'leaf', slot: 'hat', emoji: '🍃', name: 'ポンの ばけじゅつの はっぱ', price: 0, quest: true },
  { id: 'bell', slot: 'neck', emoji: '🔔', name: 'クロの すず', price: 0, quest: true },
];
