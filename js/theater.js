// ポコたちのミニ劇場 (3D アニメ風シーン)  ※オリジナルの創作ストーリーです
import * as THREE from 'three';
import { makeAnimal, animate, spawnFx, addHat } from './models.js';
import { buildStage } from './world.js';

const V = (x, y, z) => [x, y, z];

export const SCENES = [
  {
    id: 'nap', title: 'ポコとメイのおひるね', emoji: '😴', env: 'meadow', hour: 13, dur: 36,
    desc: 'ぽかぽかのひるさがり。ねむくなったポコと、ツンデレなメイ。',
    actors: { poko: [-4, 0, 1], mei: [3.5, 0, 0] },
    tracks: [
      ['poko', 0, -4, 1, 1.3], ['poko', 7, -4, 1, 1.3], ['poko', 12, 0.9, 0.2, 1.57, 'stand'], ['poko', 17, 0.9, 0.2, 1.57], ['poko', 18, 1.6, 0.3, 0, 'sleep'],
      ['mei', 0, 3.5, 0, -1.3], ['mei', 9, 3.5, 0, -1.3], ['mei', 11, 3.5, 0, -2.4, 'stand'], ['mei', 27, 3.5, 0, -2.4], ['mei', 29, 3.2, 0.3, 0, 'sleep'],
    ],
    cam: [[0, V(0, 5, 14), V(0, 1.2, 0)], [14, V(2, 3.2, 9), V(1.5, 1, 0)], [26, V(1.5, 2.2, 6), V(2.4, 0.6, 0.3)], [36, V(1.5, 6, 9), V(2.4, 0.4, 0.3)]],
    subs: [
      [1, 4, '', 'ぽかぽかの ひるさがり。きょうは とっても いいてんき。'],
      [5, 5, 'poko', 'ふわぁ…メイちゃん、ねむくなってきたの…'],
      [10, 4, 'mei', 'もう、しょうがないわね。すこしだけ よ？'],
      [15, 4, 'poko', 'メイちゃんの となり、あったかいの…'],
      [19.5, 5, 'mei', 'ち、ちかいわよ！ …べ、べつに いやじゃないけど。'],
      [25, 4, 'poko', 'すぅ…メイちゃん、だいすきなの…むにゃ'],
      [29.5, 5, 'mei', '…おやすみ、ポコ。'],
    ],
    fx: [[20, 'mei', 'sweat'], [22, 'poko', 'heart'], [26, 'poko', 'zzz'], [28, 'poko', 'zzz'], [30, 'mei', 'heart'], [32, 'mei', 'zzz'], [33, 'poko', 'heart']],
    anim: [['mei', 20, 24, { scared: true }], ['poko', 5, 9, { tilt: 0.3 }]],
  },
  {
    id: 'treasure', title: 'パーとクーとたからさがし', emoji: '🔍', env: 'meadow', hour: 10, dur: 34,
    desc: 'ポコとパーのあいぼうコンビが、こわがりクーといっしょに おたからさがし。',
    actors: { poko: [-6, 0, 2], pa: [-8, 0, 2.5], ku: [6, 0, -2] },
    tracks: [
      ['poko', 0, -6, 2, 1.2], ['poko', 6, 0, 2, 1.2], ['poko', 12, 0, 2, 0.6], ['poko', 20, 0, 1, 0.6, 'hop'], ['poko', 24, 0, 1, 0.3, 'stand'], ['poko', 34, 2, 1, 1.5],
      ['pa', 0, -8, 2.5, 1.2], ['pa', 6, -1.6, 2.4, 1.2], ['pa', 11, -1.6, 2.4, 0.3], ['pa', 14, 1.2, 0.3, 1.3], ['pa', 34, 1.2, 0.3, 1.3, 'hop'],
      ['ku', 0, 6, -2, -1.0], ['ku', 15, 6, -2, -1.0], ['ku', 19, 3.3, 0.5, -1.7], ['ku', 34, 3.3, 0.5, -1.7],
    ],
    cam: [[0, V(-2, 4, 12), V(-3, 1, 2)], [10, V(2, 3.5, 9), V(0, 1, 1.5)], [20, V(0, 2.5, 7), V(0.5, 1, 0.8)], [34, V(4, 3, 8), V(1, 1, 0.5)]],
    subs: [
      [1, 4, '', 'きょうは ポコと パーの おたからさがし！'],
      [5, 4, 'pa', 'キュッ！ ポコ、あっちに なにか あるよ！'],
      [10, 4, 'poko', 'なにか ひかってるの…！ほってみるの！'],
      [15, 4, 'ku', 'ひゃっ…！ む、むしじゃ ないよね…？'],
      [20, 4, 'poko', 'ちがうの、これは きれいな いしなの！'],
      [24, 4, 'pa', 'キュッ！ すごい、ぴかぴか！ ぼくたちの たからものだね！'],
      [28, 5, 'ku', 'よ、よかった…。ぼくも いっしょに みていいかな…？'],
      [32, 2, 'poko', 'みんなで いっしょが いちばんなの！'],
    ],
    fx: [[8, 'pa', 'note'], [12, 'poko', 'bang'], [17, 'ku', 'sweat'], [21, 'poko', 'star'], [22, 'pa', 'star'], [26, 'pa', 'heart'], [30, 'ku', 'heart'], [33, 'poko', 'heart']],
    anim: [['ku', 14, 20, { scared: true }], ['poko', 12, 20, { bow: 0.5 }]],
  },
  {
    id: 'haru', title: 'ハルがかえってきた', emoji: '🐦', env: 'meadow', hour: 16, dur: 34,
    desc: 'すだったハルが、そらからポコにあいにきたよ。',
    actors: { poko: [-1, 0, 2], sei: [3.5, 0, -3], haru: [-25, 12, -22] },
    tracks: [
      ['poko', 0, -1, 2, 0.4, 'sit'], ['poko', 36, -1, 2, 0.4],
      ['sei', 0, 3.5, 0, -2.2], ['sei', 36, 3.5, 0, -2.2],
      ['haru', 0, -25, 12, -22, 0.6, 'fly'], ['haru', 8, -8, 6, -6, 0.6], ['haru', 12, 6, 5, -3, 3.5], ['haru', 16, -3, 4, 6, -0.5], ['haru', 20, -1, 2.35, 2.1, 0.4], ['haru', 36, -1, 2.35, 2.1, 0.4, 'stand'],
    ],
    cam: [[0, V(2, 5, 16), V(-1, 1.5, 0)], [9, V(0, 7, 14), V(-5, 5, -4)], [16, V(0, 3, 8), V(-1, 2, 2)], [22, V(0.5, 2.8, 6.2), V(-1, 2, 2)], [34, V(0.5, 2.6, 6), V(-1, 1.8, 2)]],
    subs: [
      [1, 5, '', 'ポコは ひとり、あおいそらを ながめていたよ。'],
      [6, 4, 'haru', 'チュリリ…！ ポコ、いるかなあ！'],
      [12, 4, 'poko', 'あれ…？ そらから こえが するの！'],
      [20.5, 4, 'haru', 'ポコ！ ただいま！ ちょっとだけ かえってきたよ！'],
      [25, 4, 'poko', 'ハル…！ おかえりなの！ げんきだった なの？'],
      [29.5, 4, 'sei', 'おかえり、ハル。ゆっくりしていくといい。'],
      [33, 2.5, 'haru', 'チュリ！ ただいま！'],
    ],
    fx: [[10, 'haru', 'note'], [13, 'poko', 'bang'], [20.5, 'haru', 'star'], [24, 'poko', 'heart'], [27, 'haru', 'heart'], [31, 'sei', 'heart'], [33, 'poko', 'note']],
    anim: [['poko', 13, 20, { wave: true }], ['poko', 24, 30, { nod: true }]],
  },
  {
    id: 'beach', title: 'うみべのおさんぽ', emoji: '🏖', env: 'beach', hour: 14, dur: 36,
    desc: 'ナミとクロがくらす うみべへ。ちょっぴり こわがりクーも いっしょ。',
    actors: { poko: [-5, 0, 6], ku: [-7, 0, 6], nami: [5, 0, 1], kuro: [8, 0, -1] },
    tracks: [
      ['poko', 0, -5, 6, 0.8], ['poko', 8, -1, 3.5, 0.8], ['poko', 18, 0, 3, 0.4], ['poko', 36, 0, 3, 0.4, 'hop'],
      ['ku', 0, -7, 6, 0.8], ['ku', 9, -3.5, 4, 0.8], ['ku', 20, -3.5, 4, 0.8], ['ku', 22, -4.5, 7, -0.2], ['ku', 36, -4.5, 7, 0.2],
      ['nami', 0, 5, 1, -1.5], ['nami', 8, 5, 1, -1.5], ['nami', 12, 2, 2.8, -1.6], ['nami', 20, 2, 2.8, -1.6, 'hop'], ['nami', 36, 2, 2.8, -1.2, 'hop'],
      ['kuro', 0, 8, -1, -1.0], ['kuro', 36, 8, -1, -1.0],
    ],
    cam: [[0, V(0, 4, 16), V(0, 1, 3)], [12, V(-1, 3, 10), V(0, 1, 3)], [24, V(-3, 3, 11), V(-1, 1, 4)], [36, V(0, 4, 13), V(-1, 1, 3.5)]],
    subs: [
      [1, 4, '', 'ポコと クーは、うみべに あそびに きたよ。'],
      [6, 4, 'poko', 'うみ、ひろいの！ キラキラなの！'],
      [11, 4, 'nami', 'ニャーッ！ ポコ！ きてくれたの！ いっしょに あそぼ！'],
      [16, 4, 'poko', 'ナミちゃん！ ポコ、ナミちゃんに あいたかったの！'],
      [21, 4, 'ku', 'ひゃあっ、なみが きた…！ ぼ、ぼく ここで みてるね…'],
      [25.5, 4, 'kuro', 'ふふ、いらっしゃい、ポコくん、クーくん。セイさんにも よろしくね。'],
      [30, 5, 'nami', 'ニャ！ こんどは おしろ つくろ！ みんなで！'],
    ],
    fx: [[9, 'poko', 'note'], [12, 'nami', 'star'], [17, 'poko', 'heart'], [21, 'ku', 'bang'], [22, 'ku', 'sweat'], [27, 'kuro', 'heart'], [31, 'nami', 'note'], [33, 'poko', 'heart']],
    anim: [['ku', 20, 25, { scared: true }], ['nami', 12, 36, { tailBig: true }]],
  },
  {
    id: 'dinner', title: 'みんなでごはん', emoji: '🍲', env: 'night', hour: 21, dur: 36,
    desc: 'よるのセイのおうち。ランタンのひかりで、みんなで ゆうごはん。',
    actors: { sei: [0, 0, -3], rin: [3.2, 0, -0.5], poko: [-3.2, 0, 0.4], mei: [-2.2, 0, 2.4], pa: [2.3, 0, 2.6] },
    tracks: [
      ['sei', 0, 0, -3, 0.0], ['sei', 36, 0, -3, 0.0],
      ['rin', 0, 3.2, -0.5, -1.7], ['rin', 36, 3.2, -0.5, -1.7],
      ['poko', 0, -3.2, 0.4, 1.7, 'sit'], ['poko', 36, -3.2, 0.4, 1.7],
      ['mei', 0, -2.2, 2.4, 2.4, 'sit'], ['mei', 36, -2.2, 2.4, 2.4],
      ['pa', 0, 2.3, 2.6, -2.4, 'sit'], ['pa', 36, 2.3, 2.6, -2.4],
    ],
    cam: [[0, V(0, 6, 11), V(0, 1, 0)], [10, V(-1, 3, 8), V(-2, 1.5, 1)], [20, V(2, 3, 7), V(2, 1.5, 0.5)], [28, V(0, 2.8, 7.4), V(0, 1.4, 0)], [36, V(0, 8, 14), V(0, 3, 0)]],
    subs: [
      [1, 4, '', 'よるの セイの おうち。ランタンが ぽかぽか ひかっているよ。'],
      [5, 4, 'sei', 'さあ、できたよ。きょうは あたたかい スープだ。'],
      [10, 4, 'poko', 'わぁ！ いいにおいなの！ いただきますなの！'],
      [14, 4, 'mei', 'ポコ、こぼしてるわよ。…もう、ふいてあげる。'],
      [18, 4, 'rin', 'ふふ、あわてなくても おかわりは あるわよ。'],
      [22, 4, 'pa', 'キュッ！ ぼくは くさの サラダが おいしい！'],
      [26, 4, 'mei', '…おかわり、ちょうだい。べ、べつに おいしいからじゃ ないんだからね！'],
      [30, 5, 'poko', 'みんなで たべると、もっと おいしいの！'],
    ],
    fx: [[11, 'poko', 'note'], [15, 'mei', 'heart'], [19, 'rin', 'note'], [23, 'pa', 'star'], [27, 'mei', 'sweat'], [31, 'poko', 'heart'], [33, 'sei', 'heart'], [34, 'rin', 'heart']],
    anim: [['poko', 10, 36, { nod: true }], ['mei', 26, 30, { nod: true }]],
  },
  {
    id: 'cook', title: 'ポコのはじめてのおりょうり', emoji: '🍲', env: 'cabin', hour: 21, dur: 38,
    desc: 'ログハウスのキッチンで、ポコが おりょうりに ちょうせん。…おしおが いっぱい？',
    actors: { poko: [5, 0, -3.1], mei: [3.3, 0, -2.0], sei: [6.3, 0, -1.8] },
    tracks: [
      ['poko', 0, 5, -3.1, 3.14], ['poko', 38, 5, -3.1, 3.14],
      ['mei', 0, 3.3, -2.0, 2.14], ['mei', 26, 3.3, -2.0, 2.14], ['mei', 31, 4.1, -2.4, 2.4], ['mei', 38, 4.1, -2.4, 2.4],
      ['sei', 0, 6.3, -1.8, -2.36], ['sei', 22, 6.3, -1.8, -2.36], ['sei', 27, 5.7, -2.2, -2.8], ['sei', 38, 5.7, -2.2, -2.8],
    ],
    cam: [[0, V(3, 6, 9), V(4.5, 1.2, -2)], [10, V(5.2, 2.6, 3.4), V(5, 1.3, -3)], [24, V(4.6, 3.2, 5.4), V(4.7, 1.3, -2.4)], [38, V(3.5, 5.5, 8.5), V(4.7, 1.2, -2.4)]],
    subs: [
      [1, 4, '', 'きょうは ポコが ごはんを つくるよ。ログハウスの キッチンで…'],
      [5, 4.5, 'poko', 'ぼくに まかせて なの！ えへへ！'],
      [10.5, 4, 'poko', 'えいっ！ おしお、たっぷりなの！'],
      [15, 4, 'mei', 'ちょ、ちょっと！ 入れすぎよ！'],
      [19.5, 4, 'poko', 'ふえぇ…しょっぱいの…？'],
      [24, 5, 'sei', 'だいじょうぶよ。おみずを たして、みんなで おいしくしましょう。'],
      [29.5, 4, 'mei', '…しかたないわね。てつだって あげる。'],
      [34, 4, 'poko', 'みんなと つくると、おいしいの！'],
    ],
    fx: [[11, 'poko', 'note'], [13, 'poko', 'bang'], [16, 'mei', 'sweat'], [20, 'poko', 'sweat'], [25, 'sei', 'heart'], [31, 'mei', 'heart'], [35, 'poko', 'heart'], [36, 'sei', 'heart']],
    anim: [['poko', 10, 15, { hop: true }], ['poko', 19, 24, { scared: true, tilt: 0.3 }], ['poko', 34, 38, { cheer: true }], ['mei', 15, 19, { scared: true }]],
  },
  {
    id: 'tanabata', title: 'ななつの よる、ささの ねがい', emoji: '🎋', env: 'tanabata', hour: 21, dur: 40,
    desc: 'たなばた。ささに ねがいごとを むすぶと、あまのがわが きらり。',
    actors: { poko: [-2.2, 0, 3], mei: [2.2, 0, 3], sei: [-5, 0, 2.5] },
    tracks: [
      ['poko', 0, -2.2, 3, 0.2], ['poko', 18, -2.2, 3, 0.2], ['poko', 22, -1.2, -0.6, 0.3], ['poko', 40, -1.2, -0.6, 0.3],
      ['mei', 0, 2.2, 3, -0.2], ['mei', 40, 2.2, 3, -0.2],
      ['sei', 0, -5, 2.5, 0.9], ['sei', 40, -5, 2.5, 0.9],
    ],
    cam: [[0, V(0, 4, 13), V(0, 3, -1)], [12, V(0, 2.8, 9), V(0, 1.6, 2)], [26, V(1, 5, 9), V(0, 5, -3)], [40, V(0, 7, 12), V(0, 6.5, -3)]],
    subs: [
      [1, 4, '', 'ななつの よる。ささの はっぱが さらさら ゆれているよ。'],
      [5, 4.5, 'poko', 'たんざくに ねがいごと、かいたの！ ささに むすぶの〜'],
      [10, 4.5, 'mei', 'わたしは…ひ、ひみつよ！ 見ちゃだめだからね！'],
      [15, 4.5, 'sei', 'みんなの ねがいが、そらに とどきますように。'],
      [21, 4.5, 'poko', 'ポコの ねがいは「ずっと みんなと いっしょ」なの！'],
      [27, 4, '', 'そのとき、あまのがわが きらりと ひかって…'],
      [33, 5, 'mei', '…わたしの ねがいも、おなじよ。'],
    ],
    fx: [[6, 'poko', 'note'], [11, 'mei', 'sweat'], [16, 'sei', 'heart'], [22, 'poko', 'heart'], [27, 'poko', 'star'], [27.6, 'mei', 'star'], [28.2, 'sei', 'star'], [29, 'poko', 'spark'], [30, 'mei', 'spark'], [34, 'mei', 'heart'], [36, 'poko', 'heart'], [37, 'sei', 'heart']],
    anim: [['poko', 21, 26, { hop: true }], ['mei', 33, 37, { tilt: 0.25 }]],
  },
  {
    id: 'snow', title: 'はじめての ゆき', emoji: '❄️', env: 'snow', hour: 11, dur: 38, hat: { poko: '#e8455a' },
    desc: 'まっしろな ゆきのひ。あかいぼうしの ポコが ゆきに はしゃぐよ。',
    actors: { poko: [0, 0, 3], mei: [3.4, 0, 1], sei: [-3.8, 0, -1.5] },
    tracks: [
      ['poko', 0, 0, 3, 0.3], ['poko', 5, 0, 3, 0.3], ['poko', 8, 1.5, 4.5, 1.0], ['poko', 11, -1.5, 4.5, -1.0], ['poko', 15, 0, 4, 0.1], ['poko', 16, 0, 4, 0.1, 'sleep'], ['poko', 19, 0, 4, 0.1, 'stand'], ['poko', 38, 0, 4, 0.1],
      ['mei', 0, 3.4, 1, -2.4], ['mei', 24, 3.4, 1, -2.4], ['mei', 29, 2.0, 2.0, -2.8], ['mei', 38, 2.0, 2.0, -2.8],
      ['sei', 0, -3.8, -1.5, 1.0], ['sei', 38, -3.8, -1.5, 1.0],
    ],
    cam: [[0, V(0, 5, 14), V(0, 1.2, 2)], [8, V(2, 3, 10), V(0, 1, 4)], [16, V(0.5, 2, 8), V(0, 0.8, 4)], [26, V(0, 3.5, 11), V(0, 1.2, 2.5)], [38, V(0, 6, 15), V(0, 1.2, 2.5)]],
    subs: [
      [1, 4, '', 'はじめての ゆきの ひ。まっしろな せかいが ひろがっていたよ。'],
      [5, 4.5, 'poko', 'ゆき！ ゆきなの〜！ ふわふわなの！'],
      [10.5, 4.5, 'mei', 'もう、はしゃぎすぎよ。ころぶわよ？'],
      [15.5, 3, 'poko', 'ぽふっ！'],
      [19, 4, 'sei', 'ほら、ぼうしが ずれてるわよ。'],
      [24, 5, 'mei', 'ゆきだるま、つくりましょ。…わたしが おおきいほう つくるからね！'],
      [31, 5, 'poko', 'ゆきだるま、セイママに そっくりなの！'],
    ],
    fx: [[6, 'poko', 'note'], [9, 'poko', 'star'], [16.2, 'poko', 'bang'], [20, 'sei', 'heart'], [26, 'mei', 'note'], [32, 'poko', 'heart'], [34, 'sei', 'heart'], [35, 'mei', 'heart']],
    anim: [['poko', 5, 15, { hop: true }], ['mei', 10, 14, { tilt: 0.2 }], ['poko', 31, 36, { cheer: true }]],
  },
];

const ease = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export class Theater {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.root = new THREE.Group();
    this.root.position.set(300, 0, 0);
    this.root.visible = false;
    scene.add(this.root);
    this.stages = {};
    this.active = null;
    this.t = 0;
    this.paused = false;
  }

  start(def, subEl) {
    this.stop();
    this.def = def;
    this.t = 0;
    this.paused = false;
    this.root.visible = true;
    const kind = def.env;
    if (!this.stages[kind]) { this.stages[kind] = buildStage(kind); this.root.add(this.stages[kind]); }
    for (const [k, s] of Object.entries(this.stages)) s.visible = k === kind;
    this.stage = this.stages[kind];
    this.actors = {};
    this.trackBy = {};
    for (const [id, p] of Object.entries(def.actors)) {
      const P = makeAnimal(id);
      P.root.position.set(p[0], p[1], p[2]);
      this.root.add(P.root);
      this.actors[id] = P;
      this.trackBy[id] = [];
    }
    let pose = {};
    for (const tr of def.tracks) {
      // [id, t, x, z|y, ...]: 通常は [id,t,x,z,ry,pose?]、とり(fly)は [id,t,x,y,z,ry,pose?]
      const id = tr[0];
      const fly = id === 'haru';
      const k = fly ? { t: tr[1], x: tr[2], y: tr[3], z: tr[4], ry: tr[5], pose: tr[6] } : { t: tr[1], x: tr[2], y: 0, z: tr[3], ry: tr[4], pose: tr[5] };
      if (k.pose) pose[id] = k.pose; else k.pose = pose[id] || 'stand';
      pose[id] = k.pose;
      this.trackBy[id].push(k);
    }
    if (def.hat) for (const [id, col] of Object.entries(def.hat)) if (this.actors[id]) addHat(this.actors[id], col);
    this.subEl = subEl;
    this.subIdx = -1;
    this.fxIdx = 0;
    this.nextFx = [...def.fx].sort((a, b) => a[0] - b[0]);
    this.done = false;
    this.skyHour = def.hour;
    for (const P of Object.values(this.actors)) P.prevPos = P.root.position.clone();
  }

  stop() {
    if (this.actors) for (const P of Object.values(this.actors)) this.root.remove(P.root);
    this.actors = null;
    this.root.visible = false;
    this.def = null;
  }

  update(dt) {
    if (!this.def) return;
    const def = this.def;
    if (!this.paused && !this.done) this.t += dt;
    const t = Math.min(this.t, def.dur);
    if (this.t >= def.dur) this.done = true;
    for (const [id, P] of Object.entries(this.actors)) {
      const ks = this.trackBy[id];
      let i = 0;
      while (i < ks.length - 1 && t >= ks[i + 1].t) i++;
      const a = ks[i], b = ks[Math.min(i + 1, ks.length - 1)];
      const u = b.t > a.t ? ease(Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)))) : 1;
      const fly = id === 'haru' && a.pose === 'fly' || (id === 'haru' && b.pose === 'fly' && b !== a);
      P.root.position.set(lerp(a.x, b.x, u), id === 'haru' ? lerp(a.y, b.y, u) : 0, lerp(a.z, b.z, u));
      const moving = P.root.position.distanceTo(P.prevPos) / Math.max(dt, 0.001) > 0.25;
      if (moving && this.t < def.dur) {
        const dx = P.root.position.x - P.prevPos.x, dz = P.root.position.z - P.prevPos.z;
        if (Math.hypot(dx, dz) > 0.0005 && !a.pose.startsWith('sit')) P.root.rotation.y = lerpAngle(P.root.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 8));
      } else {
        P.root.rotation.y = lerpAngle(P.root.rotation.y, lerpAngle(a.ry, b.ry, u), Math.min(1, dt * 6));
      }
      P.prevPos.copy(P.root.position);
      const extra = {};
      for (const an of def.anim) if (an[0] === id && t >= an[1] && t < an[2]) Object.assign(extra, an[3]);
      let pose = a.pose;
      if (id === 'haru' && pose === 'fly') { pose = 'fly'; }
      if (pose === 'sleep') P.lieDir = id === 'mei' ? -1 : 1;
      animate(P, dt, { t: this.t + P.phase, walk: moving && pose !== 'fly' && pose !== 'sit', pose, ...extra });
      if (id === 'haru' && pose === 'fly') P.root.position.y += Math.sin(this.t * 6) * 0.1;
    }
    // カメラ
    const cs = def.cam;
    let ci = 0;
    while (ci < cs.length - 1 && t >= cs[ci + 1][0]) ci++;
    const c0 = cs[ci], c1 = cs[Math.min(ci + 1, cs.length - 1)];
    const cu = c1[0] > c0[0] ? ease(Math.min(1, Math.max(0, (t - c0[0]) / (c1[0] - c0[0])))) : 1;
    const cx = this.root.position.x;
    // たて画面では、すこし ひいて うつす
    const f = this.camera.aspect < 1 ? Math.min(2.2, 0.85 / this.camera.aspect) : 1;
    const lx = lerp(c0[2][0], c1[2][0], cu), ly = lerp(c0[2][1], c1[2][1], cu), lz = lerp(c0[2][2], c1[2][2], cu);
    this.camera.position.set(
      cx + lx + (lerp(c0[1][0], c1[1][0], cu) - lx) * f,
      ly + (lerp(c0[1][1], c1[1][1], cu) - ly) * f,
      lz + (lerp(c0[1][2], c1[1][2], cu) - lz) * f);
    this.camera.lookAt(cx + lx, ly, lz);
    if (this.stage.userData.tick) this.stage.userData.tick(this.t, dt);
    // うみのなみ
    for (let i = 0; i < (this.stage.userData.waves || []).length; i++) {
      const w = this.stage.userData.waves[i];
      const ph = (this.t * 0.35 + i / 3) % 1;
      w.position.z = -10 + ph * 11 + (i === 0 ? 0 : 0);
      w.material.opacity = 0.7 * (1 - ph);
    }
    // セリフ
    let cur = -1;
    def.subs.forEach((s, i) => { if (t >= s[0] && t < s[0] + s[1]) cur = i; });
    if (cur !== this.subIdx) {
      this.subIdx = cur;
      if (this.onSub) this.onSub(cur >= 0 ? def.subs[cur] : null);
    }
    // エフェクト
    while (this.fxIdx < this.nextFx.length && this.nextFx[this.fxIdx][0] <= t) {
      const f = this.nextFx[this.fxIdx++];
      const P = this.actors[f[1]];
      if (P && !this.paused) {
        const p = P.root.position.clone();
        p.y += (P.headY + P.hr) * P.scale + 0.4;
        spawnFx(this.root, f[2], p, 0.9);
      }
    }
  }
}
