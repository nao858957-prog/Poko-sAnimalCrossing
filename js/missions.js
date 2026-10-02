// ともだちからの「おねがい」(ミッション)
// type: collect(あつめて とどける) / visit(いく) / talk(はなしかける) / buy(おみせでかう) / nap(いっしょにおひるね) / wear(きせかえ)
// lv: そのキャラとの なかよしレベルが これいじょうで はじまる / after: まえの おねがいを おえてから
export const ITEMS = {
  shell: { emoji: '🐚', name: 'かいがら' },
  sasa: { emoji: '🎋', name: 'ささ' },
  stone: { emoji: '💎', name: 'キラキラの いし' },
  feather: { emoji: '🪶', name: 'あおい はね' },
  mushroom: { emoji: '🍄', name: 'ひかる キノコ' },
  herb: { emoji: '🌿', name: 'やわらかい くさ' },
  flower: { emoji: '🌼', name: 'おはな' },
};

export const QUESTS = [
  // ---- ポコ ----
  { id: 'poko1', giver: 'poko', lv: 0, title: 'ささを あつめよう', type: 'collect', item: 'sasa', n: 3,
    ask: 'ポコね、ささの スープを つくりたいの。ささを 3ほん あつめてきてほしいの！ にしの たけやぶに いっぱい はえてるの〜',
    hint: 'ささは にしの たけやぶに あるよ', thanks: 'わぁ！ いっぱいなの！ ありがとうなの！ これで おいしい スープが つくれるの〜！えへへ',
    reward: { flowers: 5, friend: 3 } },
  { id: 'poko2', giver: 'poko', lv: 2, after: 'poko1', title: 'ひかる キノコを さがせ', type: 'collect', item: 'mushroom', n: 3,
    ask: 'あのね、よるに ひかる キノコを みつけたいの。きたの もりに あるんだって！ 3こ おねがいなの！',
    hint: 'ひかる キノコは きたの もりに あるよ', thanks: 'わぁ〜 きれいなの！ ぴかぴか なの！ メイちゃんにも みせるの〜！',
    reward: { flowers: 8, friend: 4 } },
  // ---- メイ ----
  { id: 'mei1', giver: 'mei', lv: 0, title: 'キラキラの いし', type: 'collect', item: 'stone', n: 2,
    ask: 'ねぇ、手伝ってほしいの。…べ、別にあなたにしか頼めないわけじゃないんだからね。きれいな石を2つ、さがしてきて。',
    hint: 'いしは いわの まわりや みずうみの ちかくに あるよ', thanks: '…ふ、ふぅん。ちゃんと見つけてくるじゃない。ありがとう。宝物にするわ。',
    reward: { flowers: 6, friend: 3 } },
  { id: 'mei2', giver: 'mei', lv: 2, after: 'mei1', title: 'ホットケーキの あじみ', type: 'buy', what: 'pancake',
    ask: 'ポコに「お料理の味見して」って頼まれたんだけど、わたし今おなかいっぱいで…。あなた、お店でホットケーキを食べてきてくれる？',
    hint: 'おみせで ふわふわホットケーキを たべよう', thanks: 'どうだった？ …ふふ、ふわふわだった？ それなら、わたしも今度いっしょに食べようかしら。',
    reward: { flowers: 5, friend: 4 } },
  // ---- セイママ ----
  { id: 'sei1', giver: 'sei', lv: 0, title: 'おだんごを かってきて', type: 'buy', what: 'dango',
    ask: 'お願いがあるの、{n}さん。ポコが「おだんごが食べたい」って言うのよ。お店で一本、買ってきてくれる？',
    hint: 'おみせで おだんごを かおう', thanks: 'ありがとう、{n}さん。これでポコも大喜びよ。ほんとうに助かるわ。',
    reward: { flowers: 4, friend: 3 } },
  { id: 'sei2', giver: 'sei', lv: 2, after: 'sei1', title: 'ポコと おひるね', type: 'nap',
    ask: 'ポコが最近、寝不足なの。{n}さん、ポコといっしょにお昼寝してあげてくれる？ メニューの「ねる」で眠れるわよ。',
    hint: 'メニューから「ねる」→ ポコが となりに きたら おきよう', thanks: 'ふふ、ポコ、ぐっすり眠れたみたい。ありがとう、{n}さん。',
    reward: { flowers: 8, friend: 4 } },
  // ---- リン ----
  { id: 'rin1', giver: 'rin', lv: 0, title: 'おはなの かんむり', type: 'collect', item: 'flower', n: 8,
    ask: 'お花の冠を作りたいんだけど、お花が足りなくて。おはなを 8こ、わけてもらえるかしら？',
    hint: 'おはなは しまの あちこちに さいているよ', thanks: 'まあ、すてき！ ありがとう。さっそく花冠を作るわね。できたら、いちばんに見せてあげる。',
    reward: { flowers: 12, friend: 3 } },
  { id: 'rin2', giver: 'rin', lv: 2, after: 'rin1', title: 'あおい はねを あつめて', type: 'collect', item: 'feather', n: 4,
    ask: '花冠に青い羽根を飾りたいの。草原のあちこちに落ちているのよ。4まい、拾ってきてくれる？',
    hint: 'あおい はねは くさはらに おちているよ', thanks: 'わあ、きれいな青ね！ ありがとう、{n}ちゃん。おそろいの花冠、作ってあげるわ。',
    reward: { flowers: 10, friend: 4 } },
  // ---- パー ----
  { id: 'pa1', giver: 'pa', lv: 0, title: 'おいしい くさを さがせ', type: 'collect', item: 'herb', n: 5,
    ask: 'キュッ！ 冬に備えて、やわらかい草を集めてるんだ。5ほん、手伝ってくれない？ 草原にはえてるよ！',
    hint: 'やわらかい くさは くさはらに はえているよ', thanks: 'キュキュッ！ ふかふかの草だ！ ありがとう！ これで冬もあったかいよ！',
    reward: { flowers: 5, friend: 3 } },
  // ---- クー ----
  { id: 'ku1', giver: 'ku', lv: 1, title: 'いっしょに うみまで', type: 'visit', where: 'beach', r: 7,
    ask: 'あ、あの…ぼく、ひとりだと うみが こわくて…。いっしょに うみべまで、ついてきてくれる…？ みなみの ほうだよ…。',
    hint: 'みなみの うみべまで いってみよう', thanks: 'うみ、きれいだったね…！ {n}がいっしょだったから、こわくなかったよ…ありがとう…。',
    reward: { flowers: 6, friend: 4 } },
  // ---- ハル ----
  { id: 'haru1', giver: 'haru', lv: 0, title: 'とうだいを みにいこう', type: 'visit', where: 'lighthouse', r: 6,
    ask: 'チュリリ！ そらから おおきな とうだいを みつけたんだ！ ほくとうの うみのそばだよ。いって みてきて！',
    hint: 'ほくとうの とうだいまで いってみよう', thanks: 'どうだった？ おおきかったでしょ！ ぼく、あそこから みる ゆうやけが だいすきなんだ！ チュリ！',
    reward: { flowers: 7, friend: 4 } },
  { id: 'haru2', giver: 'haru', lv: 2, after: 'haru1', title: 'かぜりんの じんじゃ', type: 'visit', where: 'shrine', r: 5,
    ask: 'にしの はずれに、かぜりんが なる じんじゃが あるんだって！ ふしぎな おとが するらしいよ。いってみて！',
    hint: 'にしの はずれの じんじゃまで いってみよう', thanks: 'きいた？ ちりーん…って！ すごく ふしぎだよね！ ぼくも こんど いっしょに いきたいな！',
    reward: { flowers: 8, friend: 4 } },
  // ---- ナミ ----
  { id: 'nami1', giver: 'nami', lv: 0, title: 'かいがら あつめ', type: 'collect', item: 'shell', n: 5,
    ask: 'ナミね、かいがら あつめてるの！ すなはまで 5こ ひろってきてほしいニャ！ ここの まわりに いっぱい おちてるよ！',
    hint: 'かいがらは すなはまに おちているよ', thanks: 'わぁぁ、きれいニャ！ ありがとニャ！ ナミの たからばこに いれるニャ！',
    reward: { flowers: 5, friend: 3 } },
  { id: 'nami2', giver: 'nami', lv: 2, after: 'nami1', title: 'うみの いえ', type: 'visit', where: 'hut', r: 4,
    ask: 'ナミね、うみの いえで あそびたいの！ みんなで つくった いえなんだよ。さきに いって みてきてニャ！',
    hint: 'すなはまの ひがしがわの うみの いえまで いこう', thanks: 'どうだった？ ひろかった？ こんど いっしょに あそぼニャ！',
    reward: { flowers: 7, friend: 4 } },
  // ---- クロ ----
  { id: 'kuro1', giver: 'kuro', lv: 1, title: 'セイさんへ おすそわけ', type: 'talk', who: ['sei'],
    ask: '{n}さん、お願いがあるの。とれたてのお魚をセイさんにおすそわけしたいのだけれど、届けてくださる？ セイさんは北のログハウスにいるはずよ。',
    deliver: { sei: 'あら、クロさんから？ まあ、おいしそうなお魚ね。ありがとう、{n}さん。クロさんにも、よろしく伝えてね。' },
    hint: 'きたの ログハウスの セイママに はなしかけよう', thanks: 'まあ、届けてくださったのね。セイさん、喜んでいた？ ふふ、ありがとう。',
    reward: { flowers: 6, friend: 4 } },
  // ---- ポン ----
  { id: 'pon1', giver: 'pon', lv: 0, title: 'おきゃくさんを よんできて', type: 'talk', who: ['poko', 'mei'],
    ask: '今日はちょっと暇だぽん…。{n}さん、ポコとメイに「お店に来てね」って伝えてきてほしいぽん！ 北のログハウスの近くにいるぽん。',
    deliver: { poko: 'おみせ！ いくの〜！ おだんご たべたいの！', mei: 'お店？ …し、仕方ないわね。ポコが行くなら、ついていくわ。' },
    hint: 'ポコと メイに はなしかけて おみせの ことを つたえよう', thanks: 'おお、さっそく来てくれたぽん！ ありがとうだぽん。{n}さんのおかげで、お店がにぎやかになったぽん！',
    reward: { flowers: 6, friend: 3 } },
  { id: 'pon2', giver: 'pon', lv: 2, after: 'pon1', title: 'ぼうしを かぶって みせて', type: 'wear',
    ask: 'うちの ぼうしを かぶって、お店の前を歩いてほしいぽん！ 宣伝になるぽん。お店で好きな帽子を買って、着てきてほしいぽん。',
    hint: 'おみせで ぼうしを かって きて ポンに みせよう', thanks: 'おお〜、似合っているぽん！ これはいい宣伝になるぽん。ありがとうだぽん！',
    reward: { flowers: 10, friend: 4 } },
];
export const QUEST_BY_ID = Object.fromEntries(QUESTS.map(q => [q.id, q]));

// 場所の ラベル
export const PLACES = {
  beach: { name: 'うみべ', x: 0, z: 41 },
  lighthouse: { name: 'とうだい', x: 24, z: -33 },
  shrine: { name: 'かぜりんの じんじゃ', x: -31, z: 8 },
  hut: { name: 'うみの いえ', x: 12, z: 40 },
};
