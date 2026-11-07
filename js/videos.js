// ポコの どうが (YouTube)。ゲームの なかから みにいける ように します。
//   あたらしい どうがが でたら VIDEOS の いちばん うえに 1ぎょう たすだけ！ (id は URLの v= のあと)
export const CHANNEL_URL = 'https://www.youtube.com/@pokoslittledays';
export const VIDEOS = [
  { id: 'f1DL6ApH2H0', date: '2026-11-03', title: 'ちょっと見るだけのはずが…もみじの坂をころころ', note: 'ころころ ころがる ポコ' },
  { id: 'GxIwey2a_48', date: '2026-10-31', title: '柿に届かなかったポコ、最後は柿を抱いて寝落ち', note: 'おじさんすわりで もぐもぐ' },
  { id: '5W7opYoD2kU', date: '2026-10-27', title: 'もみじの切り株で、お顔をかくして眠るポコ｜パンダの日', note: 'まんまる ねむり' },
  { id: 'KcaxA80SYjI', date: '2026-10-20', title: '【お姉ちゃんだから】血の繋がらない家族の十三夜と小さな手', note: 'メイの やさしい おはなし' },
  { id: '6iExpX0Wetk', date: '2026-10-10', title: '本を読むポコとメイのイチョウしおり', note: 'はじめて こえが ついたよ' },
  { id: 'L9J0dkkA24A', date: '2026-10-03', title: '【消えるリンゴ!?】ポコのぽっこりお腹と庭の焼きリンゴ', note: 'やきりんご と ダイエット' },
  { id: 'xQz7hfKzzac', date: '2026-09-26', title: '【お祭りの夜】ポコの似顔絵にママがいなかった理由', note: 'おまつりの よる' },
  { id: 'h21DLuDQusU', date: '2026-09-20', title: '【やらかした】ポコの新米おにぎりと真っ白な米手袋', note: 'おにぎりと けだま' },
];
export const VIDEO_BY_ID = Object.fromEntries(VIDEOS.map(v => [v.id, v]));
export const videoUrl = id => `https://www.youtube.com/watch?v=${id}`;
export const thumbUrl = id => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
export const VIDEO_RX = /(どうが|動画|youtube|ユーチューブ|ようつべ|ゆーちゅーぶ|えいが|映画)/i;
export const VIDEO_CHIP = '📺 どうがを みたいな';
// さいきんの どうがから ひとつ (あたらしい ものを よく えらぶ)
export const pickVideo = () => VIDEOS[Math.floor(Math.random() * Math.min(3, VIDEOS.length))];
// どうがの おはなし (キャラ ごと)。{n}=なまえ
export const VIDEO_TALK = {
  poko: '{n}ちゃん、ポコたちの どうが、あるの！ スマホで みられるの。いちばん あたらしいのは これなの〜！',
  mei: '{n}、わたしたちの動画があるの。…べ、別に宣伝してるわけじゃないけど。よかったら見ていって。',
  sei: '{n}さん、わたしたちのお話は動画にもなっているのよ。お茶でも飲みながら、ゆっくりご覧になってね。',
  rin: '{n}ちゃん、ポコちゃんたちの動画、見たことある？ わたしも出てるのよ。ふふ、よかったらどうぞ。',
  pa: 'キュッ！ {n}、ぼくたちの どうが、みた？ ぼくも ちょっと でてるよ！',
  ku: 'あ、あの…{n}さん。ぼくたちの どうが、あるんだ…。よかったら…みてほしいな…。',
  haru: 'チュリ！ {n}、どうがで ぼくたちの ぼうけん、みられるよ！ こっちだよ！',
  nami: 'ニャ！ {n}、どうが みてニャ！ ナミも ちょっと でてるニャ！',
  kuro: '{n}さん、わたしたちの日々は動画でも見られるのよ。のんびりした時間にどうぞ。',
  pon: '{n}さん、うちの宣伝動画…じゃなくて、みんなの動画があるぽん！ ぜひ見ていってほしいぽん！',
  chao: 'ケーン！ {n}、どうがって しってるか？ オレたちの こと うつってるぜ。みてみろよ！',
};
