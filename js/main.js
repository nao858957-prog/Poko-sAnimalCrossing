import * as THREE from 'three';
import { makeAnimal, makeAvatar, animate, faceDir, makeLabel, spawnFx, updateFx, AVATAR_OPTS } from './models.js';
import { buildWorld, buildInterior, ISLAND_R, HOMES } from './world.js';
import { CHARS, ORDER, openLine, reply, level, chipsFor, story, giftLine, lvupLine, CHIPS, timePart, TIERS, MAX_PTS, toNext, fillFor, giftReaction } from './dialogue.js';
import { Theater, SCENES } from './theater.js';
import { initAudio, setBgm, setVoice, sfx, speak, stopSpeak, duck, setSound, isAudioRunning } from './audio.js';
import { FOODS, CLOTHES } from './shop.js';
import { QUESTS, DAILY, ITEMS, PLACES } from './missions.js';
import { initAnalytics, track, trackDays, setAnalyticsEnabled, analyticsAvailable } from './analytics.js';
import { RODS, FISH, FISH_BY_ID, SPOTS, rollCatch } from './fish.js';

const $ = id => document.getElementById(id);
const SAVE_KEY = 'poko-island-save-v1';
const DEFAULT_AVATAR = { name: '', skin: AVATAR_OPTS.skin[1], hair: 'short', hairColor: AVATAR_OPTS.hairColor[1], outfit: AVATAR_OPTS.outfit[0] };

// ---------- セーブ ----------
let S = null;
function freshState() {
  return { v: 1, avatar: { ...DEFAULT_AVATAR }, pos: { x: 0, z: 6, ry: Math.PI }, friend: {}, flowers: 0, seen: [], logs: {}, storyIdx: {}, firstDone: {}, settings: { size: 1, bgm: true, voice: false, time: 'auto', event: 'auto', sound: true, stats: true }, playSec: 0, created: false, owned: [], inv: {}, quests: {}, food: {}, dyn: {}, daily: { date: '', made: {} }, diary: [], chatPts: { date: '' }, giftsToday: { date: '' }, lastDay: '', days: 0, rod: 0, fish: {}, dex: {}, fishTotal: 0 };
}
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.v === 1 && s.created ? Object.assign(freshState(), s, { settings: { ...freshState().settings, ...s.settings } }) : null;
  } catch (e) { return null; }
}
function save() {
  if (!S || !S.created) return;
  try {
    S.pos = place === 'in' ? { x: 0, z: -11.4, ry: 0 } : { x: player.root.position.x, z: player.root.position.z, ry: player.root.rotation.y };
    localStorage.setItem(SAVE_KEY, JSON.stringify(S));
  } catch (e) { /* 保存できない環境でも遊べる */ }
}

// ---------- three.js 基本 ----------
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#9bdcff', 75, 190);
const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 400);
const hemi = new THREE.HemisphereLight(0xffffff, 0x8fbf70, 1.4);
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(20, 30, 15);
scene.add(hemi, sun);

const world = buildWorld();
scene.add(world.group);
const theater = new Theater(scene, camera);
const OFF = 600; // 室内は島のはるか東に置く
const interior = buildInterior();
interior.group.position.set(OFF, 0, 0);
interior.group.visible = false;
world.group.add(interior.group);
let place = 'out'; // 'out' | 'in'
const inObstacles = interior.obstacles.map(o => ({ x: o.x + OFF, z: o.z, r: o.r }));
const doorLabel = makeLabel('🏠 おうちに はいる', '#4f86c6');
doorLabel.position.set(0, 4.4, -12.4);
world.group.add(doorLabel);
const exitLabel = makeLabel('でぐち ▼', '#e8455a');
exitLabel.position.set(OFF, 1.4, 4.0); interior.group.add(exitLabel); exitLabel.position.set(0, 1.0, 3.9); exitLabel.scale.multiplyScalar(0.7);

// プレビュー用 (アバター作成)
const prevScene = new THREE.Scene();
prevScene.background = new THREE.Color('#cdeeff');
prevScene.add(new THREE.HemisphereLight(0xffffff, 0xcfe8b0, 1.7));
const pl = new THREE.DirectionalLight(0xffffff, 1.2); pl.position.set(3, 5, 6); prevScene.add(pl);
const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.3, 32), new THREE.MeshLambertMaterial({ color: '#8fd36e' }));
ped.position.y = -0.15; prevScene.add(ped);
let prevAvatar = null;

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---------- キャラクター ----------
let player = null;
const npcs = {};
function spawnNpcs() {
  for (const id of ORDER) {
    const P = makeAnimal(id);
    const h = HOMES[id];
    P.root.position.set(h[0], 0, h[1]);
    P.root.rotation.y = Math.random() * 6;
    P.home = new THREE.Vector2(h[0], h[1]);
    P.target = null; P.wait = Math.random() * 3; P.id = id;
    P.radius = id === 'sei' ? 1.2 : 0.8;
    const lab = makeLabel(CHARS[id].name, CHARS[id].color);
    lab.position.set(0, (P.headY + P.hr) * P.scale + 0.8, 0);
    P.root.add(lab);
    P.root.traverse(o => { o.userData.npc = id; });
    world.group.add(P.root);
    npcs[id] = P;
  }
  npcs.haru.state = 'present';
}
spawnNpcs();

function buildPlayer() {
  if (player) world.group.remove(player.root);
  player = makeAvatar(S.avatar);
  const p = S.pos || { x: 0, z: 6, ry: Math.PI };
  player.root.position.set(p.x, 0, p.z);
  player.root.rotation.y = p.ry;
  world.group.add(player.root);
}

// ポートレート (チャット/ノート用)
const portraits = {};
function makePortraits() {
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
  r.setSize(160, 160);
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xffffff, 0xdddddd, 2.0));
  const dl = new THREE.DirectionalLight(0xffffff, 1.2); dl.position.set(1, 2, 3); sc.add(dl);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  for (const id of ORDER) {
    const P = makeAnimal(id);
    P.root.position.set(0, 0, 0);
    sc.add(P.root);
    P.root.updateMatrixWorld(true);
    const hp = new THREE.Vector3(); P.head.getWorldPosition(hp);
    const d = P.hr * P.scale * 4.4;
    cam.position.set(hp.x, hp.y + P.hr * P.scale * 0.1, hp.z + d);
    cam.lookAt(hp.x, hp.y - P.hr * P.scale * 0.05, hp.z);
    r.setClearColor(0xdff4ff, 1);
    r.render(sc, cam);
    portraits[id] = r.domElement.toDataURL('image/png');
    sc.remove(P.root);
  }
  r.dispose();
  r.forceContextLoss();
}
makePortraits();

// ---------- 時間 ----------
function gameHour() {
  const t = S && S.settings.time;
  if (t && t !== 'auto') return parseFloat(t);
  const q = new URLSearchParams(location.search).get('hour');
  if (q) return parseFloat(q);
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}
let appliedHour = -1;
function applySky(h) {
  if (place === 'in') {
    scene.background = new THREE.Color('#1a1008'); scene.fog.color.set('#1a1008');
    hemi.intensity = 1.35; sun.intensity = 0.3; hemi.color.set('#ffe6bf'); sun.color.set('#ffd6a0');
    appliedHour = -2; return;
  }
  if (appliedHour === -2) { hemi.color.set(0xffffff); }
  if (Math.abs(h - appliedHour) < 0.01) return;
  appliedHour = h;
  world.applyTime(h, scene, hemi, sun);
}
function clockText(h) {
  const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
  const icon = h < 5 || h >= 19.5 ? '🌙' : h < 7 ? '🌅' : h >= 17 ? '🌇' : '☀';
  return `${icon} ${hh}:${String(mm).padStart(2, '0')}`;
}

// ---------- 入力 ----------
const keys = {};
window.addEventListener('keydown', e => {
  touchIdle();
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  keys[e.key.toLowerCase()] = true;
  if (e.key === 'Enter' || e.key === ' ') { if (mode === 'play' && nearNpc) openChat(nearNpc); }
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

const joy = { active: false, x: 0, y: 0, id: null };
const joyEl = $('joy'), knob = $('joyKnob');
function joyMove(e) {
  const r = joyEl.getBoundingClientRect();
  let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const max = r.width / 2 - 10;
  const len = Math.hypot(dx, dy);
  if (len > max) { dx = dx / len * max; dy = dy / len * max; }
  joy.x = dx / max; joy.y = dy / max;
  knob.style.transform = `translate(${dx}px,${dy}px)`;
}
joyEl.addEventListener('pointerdown', e => { touchIdle(); joy.active = true; joy.id = e.pointerId; joyEl.setPointerCapture(e.pointerId); joyMove(e); moveTarget = null; initAudio(); e.preventDefault(); });
joyEl.addEventListener('pointermove', e => { if (joy.active && e.pointerId === joy.id) joyMove(e); });
const joyEnd = e => { if (e.pointerId !== joy.id) return; joy.active = false; joy.x = joy.y = 0; knob.style.transform = ''; };
joyEl.addEventListener('pointerup', joyEnd);
joyEl.addEventListener('pointercancel', joyEnd);

let idle = 0, sleeping = false, sleepT = 0, sleepFx = 0;
function touchIdle() { idle = 0; if (sleeping) wakeUp(); }
let yaw = 0;
const rot = { l: false, r: false };
for (const [id, k] of [['rotL', 'l'], ['rotR', 'r']]) {
  const b = $(id);
  b.addEventListener('pointerdown', e => { touchIdle(); rot[k] = true; b.setPointerCapture(e.pointerId); e.preventDefault(); });
  b.addEventListener('pointerup', () => { rot[k] = false; });
  b.addEventListener('pointercancel', () => { rot[k] = false; });
}

// タップで移動 / ドラッグでカメラ回転
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let moveTarget = null, talkOnArrive = null;
const marker = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.55, 24), new THREE.MeshBasicMaterial({ color: 0xff8fa3, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
marker.rotation.x = -Math.PI / 2; marker.position.y = 0.06; marker.visible = false; world.group.add(marker);
let ptr = null;
canvas.addEventListener('pointerdown', e => { touchIdle(); initAudio(); ptr = { x: e.clientX, y: e.clientY, lx: e.clientX, moved: 0, id: e.pointerId }; });
canvas.addEventListener('pointermove', e => {
  if (!ptr || e.pointerId !== ptr.id) return;
  ptr.moved += Math.abs(e.clientX - ptr.lx);
  if (ptr.moved > 14 && mode === 'play') yaw -= (e.clientX - ptr.lx) * 0.006;
  ptr.lx = e.clientX;
});
canvas.addEventListener('pointerup', e => {
  if (!ptr) return;
  const moved = ptr.moved + Math.abs(e.clientY - ptr.y);
  const p = ptr; ptr = null;
  if (moved > 14 || mode !== 'play') return;
  ndc.set((p.x / innerWidth) * 2 - 1, -(p.y / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  // きゃら
  const hits = ray.intersectObjects(Object.values(npcs).map(n => n.root), true);
  for (const h of hits) {
    const id = h.object.userData.npc;
    if (id && npcs[id].root.visible) {
      const P = npcs[id];
      if (dist2(player, P) < 4.2) { openChat(id); return; }
      talkOnArrive = id; moveTarget = new THREE.Vector2(P.root.position.x, P.root.position.z); showMarker(moveTarget); sfx('tap'); return;
    }
  }
  const pt = new THREE.Vector3();
  if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), pt)) {
    const r = Math.hypot(pt.x, pt.z);
    if (r > ISLAND_R) { pt.x *= ISLAND_R / r; pt.z *= ISLAND_R / r; }
    moveTarget = new THREE.Vector2(pt.x, pt.z); talkOnArrive = null; showMarker(moveTarget); sfx('tap');
  }
});
function showMarker(v) { marker.position.set(v.x, 0.06, v.y); marker.visible = true; }
function dist2(a, b) { return Math.hypot(a.root.position.x - b.root.position.x, a.root.position.z - b.root.position.z); }

// ---------- 移動と衝突 ----------
function collide(pos, rad) {
  if (pos.x > OFF / 2) {
    for (const o of inObstacles) {
      const dx = pos.x - o.x, dz = pos.z - o.z, d = Math.hypot(dx, dz), m = o.r + rad;
      if (d < m && d > 0.0001) { pos.x = o.x + dx / d * m; pos.z = o.z + dz / d * m; }
    }
    const b = interior.bounds;
    pos.x = Math.min(OFF + b.x1, Math.max(OFF + b.x0, pos.x));
    pos.z = Math.min(b.z1, Math.max(b.z0, pos.z));
    return;
  }
  for (const o of world.obstacles) {
    const dx = pos.x - o.x, dz = pos.z - o.z;
    const d = Math.hypot(dx, dz), m = o.r + rad;
    if (d < m && d > 0.0001) { pos.x = o.x + dx / d * m; pos.z = o.z + dz / d * m; }
  }
  const r = Math.hypot(pos.x, pos.z);
  if (r > ISLAND_R) { pos.x *= ISLAND_R / r; pos.z *= ISLAND_R / r; }
}
function separate(P, others, rad) {
  for (const O of others) {
    if (O === P || !O.root.visible) continue;
    const dx = P.root.position.x - O.root.position.x, dz = P.root.position.z - O.root.position.z;
    const d = Math.hypot(dx, dz), m = rad + (O.radius || 0.6);
    if (d < m && d > 0.0001) {
      const push = (m - d) * 0.5;
      P.root.position.x += dx / d * push; P.root.position.z += dz / d * push;
    }
  }
}

// ---------- おうちに はいる / でる ----------
let doorCool = 0;
const HOUSE_NPC = ['sei', 'poko', 'mei'];
function enterHouse() {
  if (place === 'in') return;
  place = 'in'; doorCool = 1.2;
  interior.group.visible = true;
  doorLabel.visible = false;
  player.root.position.set(OFF + interior.spawn.x, 0, interior.spawn.z);
  player.root.rotation.y = Math.PI;
  moveTarget = null; talkOnArrive = null; marker.visible = false;
  for (const id of HOUSE_NPC) {
    const P = npcs[id], h = interior.homes[id];
    P.home.set(OFF + h[0], h[1]); P.root.position.set(OFF + h[0], 0, h[1]); P.target = null; P.wait = 1 + Math.random() * 2;
  }
  yaw = 0; appliedHour = -1; applySky(gameHour());
  camPos.set(OFF, 9, 12); camLook.set(OFF, 1, 2);
  sfx('open');
  if (!S.seenHouse) { S.seenHouse = true; toast('セイママの おうちだよ 🏠<br>だんろが ぽかぽか あったかいね', 4200); }
}
function exitHouse() {
  if (place === 'out') return;
  place = 'out'; doorCool = 1.2;
  interior.group.visible = false;
  doorLabel.visible = true;
  player.root.position.set(world.door.x, 0, world.door.z + 1.6);
  player.root.rotation.y = 0;
  moveTarget = null; marker.visible = false;
  for (const id of HOUSE_NPC) {
    const P = npcs[id], h = HOMES[id];
    P.home.set(h[0], h[1]); P.root.position.set(h[0], 0, h[1]); P.target = null;
  }
  appliedHour = -1; applySky(gameHour());
  camPos.set(player.root.position.x, 8, player.root.position.z + 12); camLook.copy(player.root.position);
  sfx('open');
}

// ---------- きせつ ----------
function autoEvent() {
  const d = new Date(), m = d.getMonth() + 1, day = d.getDate();
  if (m === 1 && day <= 7) return 'newyear';
  if (m === 7 && day <= 10) return 'tanabata';
  if (m === 8 && day >= 12 && day <= 16) return 'obon';
  if (m === 12 || m === 1 || m === 2) return 'snow';
  return 'none';
}
function currentEvent() {
  const e = S.settings.event || 'auto';
  return e === 'auto' ? autoEvent() : e;
}
const EVENT_NAMES = { none: '', tanabata: '七夕', obon: 'お盆', snow: '初雪', newyear: 'お正月' };
function applyEvent() {
  world.setSeason(currentEvent());
}

// ---------- ねる（ポコが となりに きて いっしょに ごろん）----------
function startSleep() {
  if (mode !== 'play' || sleeping) return;
  sleeping = true; sleepT = 0; sleepFx = 0; moveTarget = null; marker.visible = false; talkOnArrive = null;
  for (const id of ['poko', 'mei']) { npcs[id].joined = false; npcs[id].target = null; }
  toast('ぐっすり… 💤<br>ポコが きてくれるかな？', 3000);
  $('btnWake').classList.remove('hidden');
}
function wakeUp() {
  if (!sleeping) return;
  const joined = ['poko', 'mei'].filter(id => npcs[id].joined);
  sleeping = false; idle = 0;
  $('btnWake').classList.add('hidden');
  player.lie = 0;
  for (const id of ['poko', 'mei']) { npcs[id].pose = 'stand'; npcs[id].joined = false; }
  if (sleepT > 4) {
    for (const id of joined) S.friend[id] = Math.min(MAX_PTS, (S.friend[id] || 0) + 2);
    if (joined.includes('poko')) questEvent('nap');
    if (joined.length) {
      sfx('heart');
      const line = joined.includes('poko') ? 'ポコ「ふわぁ…おはようなの…」' : 'メイ「…ね、ねてないわよ！」';
      toast(line + '<br>' + joined.map(id => CHARS[id].name).join('と') + 'と なかよし ♥ +2', 3600);
      for (const id of joined) { tmp.copy(npcs[id].root.position); tmp.y += 1.6; spawnFx(world.group, 'heart', tmp, 0.9); }
    } else toast('おはよう！ ☀', 1600);
  }
  save();
}
$('btnWake').onclick = () => { touchIdle(); };
function refreshSoundBtn() { $('btnSound').textContent = S.settings.sound === false ? '🔇' : '🔊'; }
$('btnSound').onclick = () => {
  initAudio();
  S.settings.sound = S.settings.sound === false;
  setSound(S.settings.sound); refreshSoundBtn(); save();
  if (S.settings.sound) setTimeout(() => sfx('heart'), 150);
  toast(S.settings.sound ? '🔊 おとを だすよ<br><small>きこえない ときは スマホの マナーモードや おんりょうを かくにんしてね</small>' : '🔇 おとを けしたよ', 3600);
};

// ---------- おみせ ----------
let shopTab = 'food', shopBusy = false, enterKind = null;
$('btnEnter').onclick = () => { if (enterKind === 'shop') openShop(); else if (enterKind === 'house') enterHouse(); else if (enterKind === 'out') exitHouse(); sfx('tap'); };
function refreshPlayerModel() {
  const p = player.root.position.clone(), ry = player.root.rotation.y;
  world.group.remove(player.root);
  player = makeAvatar(S.avatar);
  player.root.position.copy(p); player.root.rotation.y = ry;
  world.group.add(player.root);
}
function openShop() {
  if (mode !== 'play') return;
  track('shop');
  if (sleeping) wakeUp();
  mode = 'shop'; shopTab = 'food';
  moveTarget = null; marker.visible = false; talkOnArrive = null;
  $('hud').classList.add('hidden'); $('btnTalk').classList.add('hidden');
  $('shop').classList.remove('hidden');
  $('shopFace').src = portraits.pon;
  $('shopMsg').textContent = 'いらっしゃいませぽん！ おはなで おかいもの できるぽん 🌼';
  sfx('open'); rebuildPreview(); renderShop();
}
function closeShop() {
  if (mode !== 'shop') return;
  mode = 'play'; doorCool = 1.5;
  $('shop').classList.add('hidden'); $('hud').classList.remove('hidden');
  refreshPlayerModel();
  player.root.position.set(world.shopDoor.x + 0.6, 0, world.shopDoor.z + 1.8);
  player.root.rotation.y = Math.PI;
  $('flowerCount').textContent = '🌼 ' + S.flowers;
  camera.clearViewOffset(); shift.x = shift.y = 0;
  save();
}
const SLOT_KEY = { hat: 'hat', neck: 'neck', body: 'body' };
function renderShop() {
  $('shopFlowers').textContent = '🌼 ' + S.flowers;
  for (const b of document.querySelectorAll('#shop .tabs button')) b.classList.toggle('on', b.dataset.tab === shopTab);
  const box = $('shopList'); box.innerHTML = '';
  if (shopTab === 'food') {
    for (const f of FOODS) {
      const d = document.createElement('div'); d.className = 'item';
      const can = S.flowers >= f.price;
      d.innerHTML = `<span class="e">${f.emoji}</span><div class="n">${f.name}<small>🌼 ${f.price}</small></div>`;
      const wrap = document.createElement('div'); wrap.className = 'btns';
      const b = document.createElement('button'); b.textContent = 'たべる'; if (!can) b.classList.add('dis');
      b.onclick = () => eatFood(f, false);
      const b2 = document.createElement('button'); b2.textContent = 'もちかえる'; b2.className = 'alt'; if (!can) b2.classList.add('dis');
      b2.onclick = () => eatFood(f, true);
      wrap.append(b, b2); d.appendChild(wrap); box.appendChild(d);
    }
  } else if (shopTab === 'tool') {
    for (const r of RODS) {
      const d = document.createElement('div'); d.className = 'item';
      const have = S.rod >= r.id;
      d.innerHTML = `<span class="e">${r.emoji}</span><div class="n">${r.name}<small>${have ? (S.rod === r.id ? 'いま つかっている' : 'もっている') : '🌼 ' + r.price}　${r.desc}</small></div>`;
      const b = document.createElement('button');
      if (have) { b.textContent = S.rod === r.id ? 'つかってる' : 'もっている'; b.classList.add('on'); }
      else { b.textContent = 'かう'; if (S.flowers < r.price) b.classList.add('dis'); b.onclick = () => buyRod(r); }
      d.appendChild(b); box.appendChild(d);
    }
    const tip = document.createElement('p'); tip.className = 'fine2'; tip.textContent = 'つりざおを かうと、ため池・みずうみ・うみの そばで「つり」が できるよ。さかなは ここで うれるよ。'; box.appendChild(tip);
  } else if (shopTab === 'sell') {
    const list = Object.entries(S.fish).filter(([, n]) => n > 0);
    if (!list.length) { const e = document.createElement('p'); e.className = 'fine2'; e.textContent = 'うれる さかなが ないよ。つりざおで つってこよう！'; box.appendChild(e); }
    else {
      const total = list.reduce((a, [id, n]) => a + FISH_BY_ID[id].price * n, 0);
      const all = document.createElement('div'); all.className = 'item';
      all.innerHTML = `<span class="e">💰</span><div class="n">ぜんぶ うる<small>🌼 ${total}</small></div>`;
      const ab = document.createElement('button'); ab.textContent = 'ぜんぶ うる'; ab.onclick = () => sellFish(null);
      all.appendChild(ab); box.appendChild(all);
      for (const [id, n] of list) {
        const f = FISH_BY_ID[id], d = document.createElement('div'); d.className = 'item';
        d.innerHTML = `<span class="e">${f.emoji}</span><div class="n">${f.name} ×${n}<small>1ひき 🌼 ${f.price}</small></div>`;
        const b = document.createElement('button'); b.textContent = 'うる'; b.onclick = () => sellFish(id);
        d.appendChild(b); box.appendChild(d);
      }
    }
  } else {
    for (const c of CLOTHES) {
      if (c.quest && !S.owned.includes(c.id)) continue;
      const d = document.createElement('div'); d.className = 'item';
      const own = S.owned.includes(c.id), worn = S.avatar[SLOT_KEY[c.slot]] === c.id;
      d.innerHTML = `<span class="e">${c.emoji}</span><div class="n">${c.name}<small>${own ? 'もっている' : '🌼 ' + c.price}</small></div>`;
      const b = document.createElement('button');
      if (!own) { b.textContent = 'かう'; if (S.flowers < c.price) b.classList.add('dis'); }
      else if (worn) { b.textContent = 'ぬぐ'; b.classList.add('on'); }
      else b.textContent = 'きる';
      b.onclick = () => clothesAction(c);
      d.appendChild(b); box.appendChild(d);
    }
    const none = document.createElement('div'); none.className = 'item';
    none.innerHTML = '<span class="e">✨</span><div class="n">ぜんぶ ぬぐ</div>';
    const nb = document.createElement('button'); nb.textContent = 'ぬぐ';
    nb.onclick = () => { S.avatar.hat = S.avatar.neck = S.avatar.body = null; sfx('tap'); rebuildPreview(); renderShop(); };
    none.appendChild(nb); box.appendChild(none);
  }
}
function buyRod(r) {
  if (S.flowers < r.price) { $('shopMsg').textContent = 'おはなが たりないぽん… 🌼を あつめてきてほしいぽん'; sfx('tap'); return; }
  S.flowers -= r.price; S.rod = Math.max(S.rod, r.id); sfx('heart'); questEvent('buyrod');
  $('shopMsg').textContent = `${r.emoji} ${r.name}、まいどありぽん！ みずべに 立って「つりを する」を おすぽん！`;
  addDiary(`${r.name}を かった。`);
  save(); renderShop();
}
function sellFish(id) {
  let sum = 0;
  for (const [fid, n] of Object.entries(S.fish)) { if ((id && fid !== id) || n <= 0) continue; sum += FISH_BY_ID[fid].price * (id ? 1 : n); S.fish[fid] -= id ? 1 : n; }
  if (!sum) return;
  S.flowers += sum; sfx('pick');
  $('shopMsg').textContent = `💰 🌼 ${sum} で かいとったぽん！ まいどありぽん！`;
  save(); renderShop();
}
function eatFood(f, takeout) {
  if (S.flowers < f.price) { $('shopMsg').textContent = 'おはなが たりないぽん… 🌼を あつめてきてほしいぽん'; sfx('tap'); return; }
  S.flowers -= f.price; sfx('pick'); questEvent('buy', f.id);
  if (takeout) {
    S.food[f.id] = (S.food[f.id] || 0) + 1;
    $('shopMsg').textContent = `${f.emoji} ${f.name}を もちかえりに したよ。ともだちへの プレゼントに できるよ！　まいどありぽん！`;
    save(); renderShop(); return;
  }
  // いっしょに たべる ともだち
  const pals = ORDER.filter(i => i !== 'haru');
  const pal = pals[Math.floor(Math.random() * pals.length)];
  S.friend[pal] = Math.min(MAX_PTS, (S.friend[pal] || 0) + 2);
  $('shopMsg').textContent = `${f.emoji} ${f.line}　${CHARS[pal].name}も ひとくち！ ♥　まいどありぽん！`;
  if (prevAvatar) { prevAvatar.cheer = 1.6; for (let i = 0; i < 3; i++) { tmp.set((Math.random() - 0.5) * 1.6, 3.4 + Math.random(), 0.5); spawnFx(prevScene, 'heart', tmp, 0.7); } }
  speak(f.line, 1.3);
  save(); renderShop();
}
function clothesAction(c) {
  const key = SLOT_KEY[c.slot];
  if (!S.owned.includes(c.id)) {
    if (S.flowers < c.price) { $('shopMsg').textContent = 'おはなが たりないよ… 🌼を あつめてきてね'; sfx('tap'); return; }
    S.flowers -= c.price; S.owned.push(c.id); S.avatar[key] = c.id; sfx('heart');
    $('shopMsg').textContent = `${c.emoji} ${c.name}、まいどありぽん！ とっても にあってるぽん！`;
  } else if (S.avatar[key] === c.id) { S.avatar[key] = null; sfx('tap'); $('shopMsg').textContent = `${c.name}を ぬいだよ`; }
  else { S.avatar[key] = c.id; sfx('pick'); $('shopMsg').textContent = `${c.emoji} ${c.name}を きたよ！`; }
  if (prevAvatar) prevAvatar.cheer = 1.2;
  if (S.avatar.hat) questEvent('wear');
  rebuildPreview(); save(); renderShop();
}
for (const b of document.querySelectorAll('#shop .tabs button')) b.onclick = () => { shopTab = b.dataset.tab; sfx('tap'); renderShop(); };
$('shopBack').onclick = () => { sfx('tap'); closeShop(); };

// ---------- ゲーム状態 ----------
let mode = 'title'; // title creator play chat menu theater
let nearNpc = null;
let chatNpc = null;
let clock = 0;
let haruTimer = 0;
const tmp = new THREE.Vector3();

function updatePlayer(dt) {
  if (sleeping) {
    sleepT += dt; sleepFx -= dt;
    animate(player, dt, { t: clock, walk: false, pose: 'sleep' });
    if (sleepFx <= 0) { sleepFx = 2.2; tmp.copy(player.root.position); tmp.y += 1.8; spawnFx(world.group, 'zzz', tmp, 0.8); }
    return;
  }
  let ix = 0, iz = 0;
  if (keys['a'] || keys['arrowleft']) ix -= 1;
  if (keys['d'] || keys['arrowright']) ix += 1;
  if (keys['w'] || keys['arrowup']) iz -= 1;
  if (keys['s'] || keys['arrowdown']) iz += 1;
  if (joy.active) { ix = joy.x; iz = joy.y; }
  const mag = Math.min(1, Math.hypot(ix, iz));
  let moving = false, speed = 6.6;
  const pos = player.root.position;
  if (mag > 0.12 && mode === 'play') {
    idle = 0;
    moveTarget = null; talkOnArrive = null; marker.visible = false;
    // カメラ向き基準
    const sy = Math.sin(yaw), cy = Math.cos(yaw);
    const dx = ix * cy + iz * sy, dz = -ix * sy + iz * cy; // camera right / back
    const len = Math.hypot(dx, dz) || 1;
    pos.x += dx / len * speed * mag * dt; pos.z += dz / len * speed * mag * dt;
    faceDir(player, dx, dz, dt, 14);
    moving = true;
  } else if (moveTarget && mode === 'play') {
    const dx = moveTarget.x - pos.x, dz = moveTarget.y - pos.z;
    const d = Math.hypot(dx, dz);
    const stop = talkOnArrive ? 2.3 : 0.2;
    if (d > stop) {
      const stepLen = Math.min(speed * dt, d - stop + 0.01);
      pos.x += dx / d * stepLen; pos.z += dz / d * stepLen;
      faceDir(player, dx, dz, dt, 14);
      moving = true;
    } else {
      moveTarget = null; marker.visible = false;
      if (talkOnArrive) { const id = talkOnArrive; talkOnArrive = null; openChat(id); }
    }
  }
  collide(pos, 0.45);
  separate(player, Object.values(npcs), 0.5);
  updateFishBtn(pos);
  doorCool = Math.max(0, doorCool - dt);
  if (mode === 'play' && doorCool <= 0) {
    if (place === 'out' && Math.hypot(pos.x - world.door.x, pos.z - world.door.z) < 1.25) enterHouse();
    else if (place === 'in' && pos.z > interior.exit.z && Math.abs(pos.x - OFF) < 1.7) exitHouse();
  }
  if (place === 'out') {
    doorLabel.visible = Math.hypot(pos.x - world.door.x, pos.z - world.door.z) < 14;
    world.shopLabel.visible = Math.hypot(pos.x - world.shopDoor.x, pos.z - world.shopDoor.z) < 14;
    if (mode === 'play' && doorCool <= 0 && Math.hypot(pos.x - world.shopDoor.x, pos.z - world.shopDoor.z) < 1.3) openShop();
  }
  if (moving) idle = 0;
  animate(player, dt, { t: clock, walk: moving, speed: 1 });
  marker.scale.setScalar(1 + Math.sin(clock * 6) * 0.1);
  // あつめもの / おねがいの ばしょ
  if (place === 'out') {
    for (const it of world.items) {
      if (it.mesh.visible && Math.hypot(pos.x - it.x, pos.z - it.z) < 1.2) {
        it.mesh.visible = false; it.back = 150;
        S.inv[it.kind] = (S.inv[it.kind] || 0) + 1;
        sfx('pick'); tmp.set(it.x, 1.2, it.z); spawnFx(world.group, 'star', tmp, 0.7);
        const def = ITEMS[it.kind];
        toast(`${def.emoji} ${def.name}を ひろったよ！（${S.inv[it.kind]}こ）`, 1600);
        updateQuestHud();
        if (QS().some(q => qStatus(q) === 'ready' && q.type === 'collect' && q.item === it.kind)) { refreshMarkers(); }
        save();
      }
    }
    checkVisits(pos);
  }
  // おはな
  if (place === 'out') for (const f of world.flowers) {
    if (f.mesh.visible && Math.hypot(pos.x - f.x, pos.z - f.z) < 1.1) {
      f.mesh.visible = false; f.back = 50;
      S.flowers++; $('flowerCount').textContent = '🌼 ' + S.flowers;
      sfx('pick'); if (QS().some(q => q.item === 'flower')) refreshMarkers();
      tmp.set(f.x, 1.2, f.z); spawnFx(world.group, 'star', tmp, 0.7);
      if (S.flowers === 1) toast('おはなを ひろったよ！<br>ともだちに あげると よろこぶよ 🌼');
    }
  }
}

function updateNpcs(dt) {
  const ppos = player.root.position;
  const prevNear = nearNpc;
  nearNpc = null;
  let nd = 4.2;
  for (const id of ORDER) {
    const P = npcs[id];
    if (!P.root.visible) continue;
    const pos = P.root.position;
    const talking = chatNpc === id;
    let moving = false;
    const dp = Math.hypot(ppos.x - pos.x, ppos.z - pos.z);
    const buddy = sleeping && (id === 'poko' || id === 'mei') && mode === 'play' && P.root.visible;
    if (!buddy && P.pose === 'sleep' && id !== 'haru') P.pose = 'stand';
    if (buddy) {
      const side = id === 'poko' ? 1 : -1, delay = id === 'poko' ? 2.5 : 8;
      if (sleepT > delay) {
        const ry = player.root.rotation.y, off = side * (id === 'poko' ? 1.15 : 1.35);
        const tx = ppos.x + Math.sin(ry) * off, tz = ppos.z + Math.cos(ry) * off;
        const dx = tx - pos.x, dz = tz - pos.z, d = Math.hypot(dx, dz);
        if (d > 0.25) {
          const sp = Math.min(d, 3.4 * dt); pos.x += dx / d * sp; pos.z += dz / d * sp; faceDir(P, dx, dz, dt, 10); moving = true; P.pose = 'stand';
        } else {
          P.pose = 'sleep'; P.lieDir = 1; P.root.rotation.y += (ry - P.root.rotation.y) * Math.min(1, dt * 6);
          P.sleepFx = (P.sleepFx || 0) - dt;
          if (P.sleepFx <= 0) { P.sleepFx = 2.8 + Math.random(); tmp.copy(pos); tmp.y += 1.4; spawnFx(world.group, Math.random() < 0.5 ? 'zzz' : 'heart', tmp, 0.7); }
          if (!P.joined) { P.joined = true; P.sleepFx = 0.5; toast(id === 'poko' ? 'ポコが となりに きたよ 🐼💤' : 'メイも きたよ…「べ、べつに ねむいだけよ」', 2600); sfx('recv'); }
        }
      }
      animate(P, dt, { t: clock, walk: moving, speed: 0.9, pose: P.pose || 'stand' });
      if (!P.joinedEver) P.joinedEver = false;
      continue;
    }
    if (id === 'haru') { updateHaru(dt, P); }
    else if (talking || (mode === 'play' && dp < 2.6)) {
      faceDir(P, ppos.x - pos.x, ppos.z - pos.z, dt, 8);
    } else if (mode === 'play' || mode === 'title' || mode === 'creator') {
      P.wait -= dt;
      if (!P.target && P.wait <= 0) {
        const a = Math.random() * 6.28, r = Math.random() * (place === 'in' && HOUSE_NPC.includes(id) ? 1.2 : id === 'pon' ? 1.0 : id === 'sei' ? 1.5 : 3.5);
        P.target = new THREE.Vector2(P.home.x + Math.cos(a) * r, P.home.y + Math.sin(a) * r);
      }
      if (P.target) {
        const dx = P.target.x - pos.x, dz = P.target.y - pos.z, d = Math.hypot(dx, dz);
        if (d < 0.2) { P.target = null; P.wait = 2 + Math.random() * 5; }
        else { const sp = 1.4 * dt; pos.x += dx / d * sp; pos.z += dz / d * sp; faceDir(P, dx, dz, dt, 8); moving = true; }
      }
    }
    if (id !== 'haru') {
      collide(pos, P.radius * 0.6);
      separate(P, [player, ...Object.values(npcs)], P.radius * 0.7);
    }
    animate(P, dt, { t: clock, walk: moving, speed: 0.6, pose: id === 'haru' ? P.pose : 'stand', hop: talking && P.hop > 0 });
    if (P.hop > 0) P.hop -= dt;
    if (P.marks) for (const s of Object.values(P.marks)) if (s.visible) s.position.y = (P.headY + P.hr) * P.scale + 1.9 + Math.sin(clock * 3) * 0.12;
    const lim = id === prevNear ? 4.9 : 4.2;
    if (dp < Math.min(nd, lim) + (id === prevNear ? 0.6 : 0) && P.root.visible && mode === 'play') { nd = dp; nearNpc = id; }
  }
}

function updateHaru(dt, P) {
  // ハルは たまに あそびに くる (パターン: 現れる→空を飛ぶ→枝にとまる)
  const pos = P.root.position;
  const hv = P.hv || (P.hv = { ph: 0, mode: 'perch' });
  hv.ph += dt;
  const ppos = player.root.position;
  if (chatNpc === 'haru') {
    P.pose = 'stand';
    faceDir(P, ppos.x - pos.x, ppos.z - pos.z, dt, 8);
    return;
  }
  if (hv.mode === 'perch') {
    P.pose = 'stand';
    const hx = HOMES.haru[0], hz = HOMES.haru[1];
    pos.x += (hx - pos.x) * Math.min(1, dt * 3); pos.z += (hz - pos.z) * Math.min(1, dt * 3);
    pos.y += (0.9 - pos.y) * Math.min(1, dt * 3);
    faceDir(P, ppos.x - pos.x, ppos.z - pos.z, dt, 4);
    if (hv.ph > 14 + (P.id.length)) { hv.mode = 'fly'; hv.ph = 0; hv.a = Math.random() * 6.28; }
  } else {
    P.pose = 'fly';
    hv.a += dt * 0.9;
    const cx = HOMES.haru[0] - 3, cz = HOMES.haru[1] + 4;
    const tx = cx + Math.cos(hv.a) * 8, tz = cz + Math.sin(hv.a) * 6, ty = 3 + Math.sin(hv.ph * 2) * 0.7;
    const dx = tx - pos.x, dz = tz - pos.z;
    pos.x += dx * Math.min(1, dt * 2.5); pos.z += dz * Math.min(1, dt * 2.5); pos.y += (ty - pos.y) * Math.min(1, dt * 2);
    faceDir(P, dx, dz, dt, 6);
    if (hv.ph > 7) { hv.mode = 'perch'; hv.ph = 0; }
  }
}

// ---------- カメラ ----------
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
let titleAngle = 0;
function updateCamera(dt) {
  const aspect = camera.aspect;
  if (mode === 'title' || mode === 'creator' || mode === 'shop') {
    if (mode === 'shop') { camera.position.set(0, 2.4, camera.aspect < 0.8 ? 17 : 9.5); camera.lookAt(0, 1.2, 0); applyViewShift(dt); return; }
    if (mode === 'creator') {
      const land = $('creator').getBoundingClientRect().width < innerWidth * 0.9;
      camera.position.set(0, 2.4, camera.aspect < 0.8 ? 11.5 : 9); camera.lookAt(0, camera.aspect < 0.8 && !land ? -0.9 : 1.2, 0); applyViewShift(dt); return;
    }
    titleAngle += dt * 0.12;
    const cx = Math.sin(titleAngle) * 40, cz = Math.cos(titleAngle) * 40;
    camera.position.set(cx, 26, cz); camera.lookAt(0, 0.5, 0); return;
  }
  const pp = player.root.position;
  let desired, look;
  if (mode === 'fish' && fishing) {
    const ry = player.root.rotation.y, fx = Math.sin(ry), fz = Math.cos(ry);
    const dd = fishing.sp.dist;
    const sd = fishing.side || 1;
    desired = new THREE.Vector3(pp.x - fx * 6.2 + fz * 3.0 * sd, 7.0, pp.z - fz * 6.2 - fx * 3.0 * sd);
    look = new THREE.Vector3(pp.x + fx * dd * 0.6, 0.2, pp.z + fz * dd * 0.6);
    camPos.lerp(desired, Math.min(1, dt * 3)); camLook.lerp(look, Math.min(1, dt * 3));
    camera.position.copy(camPos); camera.lookAt(camLook);
    if (window.__poko && window.__poko.debugCam) { camera.position.set(...window.__poko.debugCam.pos); camera.lookAt(...window.__poko.debugCam.look); }
    applyViewShift(dt); return;
  }
  if (mode === 'chat' && chatNpc) {
    const n = npcs[chatNpc].root.position;
    const mx = (pp.x + n.x) / 2, mz = (pp.z + n.z) / 2;
    const ang = Math.atan2(n.x - pp.x, n.z - pp.z);
    const side = chatSide;
    const sep = Math.hypot(n.x - pp.x, n.z - pp.z);
    const pw = $('chat').getBoundingClientRect().width;
    const frac = pw < innerWidth * 0.9 ? 1 - pw / innerWidth : 1;
    const hw = Math.tan(25 * Math.PI / 180) * aspect * frac;
    const dd = Math.min(18, Math.max(6.5, (sep / 2 + 1.6) / hw));
    desired = new THREE.Vector3(mx + Math.sin(side) * dd, 4.2, mz + Math.cos(side) * dd);
    look = new THREE.Vector3(mx, 1.0, mz);
    // 画面の下をチャットが覆うので 見せたいものを上に
    camPos.lerp(desired, Math.min(1, dt * 3)); camLook.lerp(look, Math.min(1, dt * 3));
    faceDir(player, n.x - pp.x, n.z - pp.z, dt, 6);
  } else {
    const inn = place === 'in';
    if (inn) yaw = Math.max(-0.6, Math.min(0.6, yaw));
    const dist = inn ? (aspect < 0.8 ? 18 : 12.5) : aspect < 0.8 ? 15.5 : 12.5, h = inn ? (aspect < 0.8 ? 13 : 9.5) : aspect < 0.8 ? 11 : 8.4;
    desired = new THREE.Vector3(pp.x + Math.sin(yaw) * dist, h, pp.z + Math.cos(yaw) * dist);
    look = new THREE.Vector3(pp.x, 1.2, pp.z);
    camPos.lerp(desired, Math.min(1, dt * 5)); camLook.lerp(look, Math.min(1, dt * 6));
  }
  camera.position.copy(camPos);
  camera.lookAt(camLook);
  if (window.__poko && window.__poko.debugCam) { camera.position.set(...window.__poko.debugCam.pos); camera.lookAt(...window.__poko.debugCam.look); }
  applyViewShift(dt);
}
// チャットのパネルに かくれないよう、画面の中心を ずらす
const shift = { x: 0, y: 0 };
function applyViewShift(dt) {
  const W = innerWidth, H = innerHeight;
  let tx = 0, ty = 0;
  if (mode === 'chat' || mode === 'shop') {
    const r = $(mode).getBoundingClientRect();
    if (r.width < W * 0.9) tx = r.width / 2; else ty = r.height / 2;
  } else if (mode === 'creator') {
    const r = $('creator').getBoundingClientRect();
    if (r.width < W * 0.9) tx = r.width / 2;
  }
  shift.x += (tx - shift.x) * Math.min(1, dt * 6); shift.y += (ty - shift.y) * Math.min(1, dt * 6);
  if (Math.abs(shift.x) + Math.abs(shift.y) > 0.5) camera.setViewOffset(W, H, shift.x, shift.y, W, H);
  else if (camera.view && camera.view.enabled) camera.clearViewOffset();
}

// ---------- ひょうじ ----------
let toastTimer = 0;
function toast(html, ms = 3200) {
  const t = $('toast');
  t.innerHTML = html; t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
}
const hearts = n => '♥'.repeat(n) + '♡'.repeat(5 - n);

// ---------- チャット ----------
let chatSide = 0;
function chooseChatSide(id) {
  const n = npcs[id].root.position, p = player.root.position;
  const mx = (n.x + p.x) / 2, mz = (n.z + p.z) / 2;
  const base = Math.atan2(n.x - p.x, n.z - p.z);
  const obs = place === 'in' ? inObstacles : world.obstacles;
  const others = Object.values(npcs).filter(o => o.id !== id && o.root.visible).map(o => o.root.position);
  let best = base + Math.PI / 2, bestScore = 1e9;
  const H = Math.PI / 2;
  for (const off of [H, -H, H + 0.6, -H - 0.6, H - 0.6, -H + 0.6, H + 1.2, -H - 1.2, H - 1.2, -H + 1.2, Math.PI, 0]) {
    const ang = base + off;
    let score = Math.abs(Math.abs(off) - H) > 0.1 ? 0.4 + Math.abs(Math.abs(off) - H) * 0.3 : 0;
    for (let t = 0.15; t <= 1; t += 0.12) {
      const x = mx + Math.sin(ang) * 11 * t, z = mz + Math.cos(ang) * 11 * t;
      for (const o of obs) if (o.r > 0.25 && Math.hypot(o.x - x, o.z - z) < o.r + (o.r < 1.3 ? 2.4 : 1.3)) score += 1;
      for (const q of others) if (Math.hypot(q.x - x, q.z - z) < 2.4) score += 2;
      if (place === 'out' && Math.hypot(x, z) > ISLAND_R + 6) score += 3;
      if (place === 'in') { const b = interior.bounds; if (x < OFF + b.x0 - 1 || x > OFF + b.x1 + 1 || z < b.z0 - 1 || z > b.z1 + 2) score += 1.5; }
    }
    if (score < bestScore) { bestScore = score; best = ang; }
  }
  chatSide = best;
}
function ctxFor(id) {
  const pts = S.friend[id] || 0;
  const ev = currentEvent();
  return { name: S.avatar.name || 'あなた', hour: gameHour(), lv: level(pts), first: !S.firstDone[id], storyIdx: S.storyIdx[id] || 0, inside: place === 'in', event: ev === 'none' ? null : ev };
}
function addMsg(id, from, text, cls = '') {
  const d = document.createElement('div');
  d.className = 'msg ' + from + ' ' + cls;
  d.textContent = text;
  if (from === 'npc') d.style.setProperty('--c', CHARS[id].color);
  $('chatLog').appendChild(d);
  $('chatLog').scrollTop = 1e6;
  return d;
}
function logPush(id, from, text) {
  const l = S.logs[id] || (S.logs[id] = []);
  l.push([from, text]);
  if (l.length > 40) l.splice(0, l.length - 40);
}
function renderChips(id) {
  const box = $('chips');
  box.innerHTML = '';
  const chipList = chipsFor(id);
  if (hasQuestTalk(id)) chipList.unshift(['q', 'おねがい ある？']);
  for (const [key, label] of chipList) {
    const b = document.createElement('button');
    b.textContent = label;
    b.onclick = () => send(label);
    box.appendChild(b);
  }
}
// ---------- つり ----------
const RODS_BY = Object.fromEntries(RODS.map(r => [r.id, r]));
let fishing = null;
const fishGroup = new THREE.Group(); world.group.add(fishGroup);
const bobber = new THREE.Group();
{ const a = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#ff4d4d' })); const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#ffffff' })); bobber.add(a, b); }
bobber.visible = false; fishGroup.add(bobber);
const ripple = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
ripple.rotation.x = -Math.PI / 2; ripple.visible = false; fishGroup.add(ripple);
const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
const fishLine = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xffffff })); fishLine.visible = false; fishLine.frustumCulled = false; fishGroup.add(fishLine);
let rodMesh = null;
function rodObject(tier) {
  const g = new THREE.Group();
  const col = (RODS_BY[tier] || RODS[0]).color;
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 2.8, 8), new THREE.MeshLambertMaterial({ color: col })); stick.position.y = 1.4; g.add(stick);
  const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 10), new THREE.MeshLambertMaterial({ color: '#444' })); reel.rotation.z = Math.PI / 2; reel.position.set(0, 0.5, 0); g.add(reel);
  return g;
}
function fishSpotAt(p) {
  const rr = Math.hypot(p.x, p.z);
  if (rr > ISLAND_R - 2.6) return { spot: 'sea', dx: p.x / rr, dz: p.z / rr, dist: 5.6 };
  const L = world.landmarks.lake, dl = Math.hypot(p.x - L.x, p.z - L.z);
  if (dl < 6.2 + 3.4) return { spot: 'lake', dx: (L.x - p.x) / dl, dz: (L.z - p.z) / dl, dist: Math.max(2.4, dl - 1.8) };
  const dp = Math.hypot(p.x - 9, p.z - 9);
  if (dp < 3.5 + 3.4) return { spot: 'pond', dx: (9 - p.x) / dp, dz: (9 - p.z) / dp, dist: Math.max(1.8, dp - 1.0) };
  return null;
}
function updateFishBtn(pos) {
  const b = $('btnFish');
  const sp = (mode === 'play' && !sleeping && place === 'out') ? fishSpotAt(pos) : null;
  b.classList.toggle('hidden', !sp);
  if (sp) b.textContent = S.rod ? `🎣 ${SPOTS[sp.spot]}で つりを する` : '🎣 ここで つりが できそう…';
}
$('btnFish').onclick = () => {
  const sp = fishSpotAt(player.root.position); if (!sp) return;
  if (!S.rod) { toast('つりざおが あれば つれそう！<br>おみせの「どうぐ」で かえるよ 🎣', 3600); sfx('tap'); return; }
  startFishing(sp);
};
function startFishing(sp) {
  if (mode !== 'play') return;
  track('fishing');
  mode = 'fish'; initAudio();
  moveTarget = null; marker.visible = false; talkOnArrive = null;
  const tier = S.rod, rod = RODS_BY[tier];
  fishing = { sp, rod, phase: 'cast', t: 0, wait: 0, win: 0, catch: null, tip: new THREE.Vector3(), from: new THREE.Vector3(), to: new THREE.Vector3(), fx: 0 };
  const pos = player.root.position;
  fishing.to.set(pos.x + sp.dx * sp.dist, sp.spot === 'sea' ? -0.15 : 0.05, pos.z + sp.dz * sp.dist);
  player.root.rotation.y = Math.atan2(sp.dx, sp.dz);
  { // カメラは 木や いえが じゃまに ならない がわに おく
    const ry = player.root.rotation.y, fx = Math.sin(ry), fz = Math.cos(ry);
    const score = s => { const cx = pos.x - fx * 6.2 + fz * 3.0 * s, cz = pos.z - fz * 6.2 - fx * 3.0 * s; let n = 0; for (const o of world.obstacles) if (Math.hypot(o.x - cx, o.z - cz) < o.r + 2.8) n++; return n; };
    fishing.side = score(1) <= score(-1) ? 1 : -1;
  }
  if (rodMesh) player.root.remove(rodMesh);
  rodMesh = rodObject(tier); rodMesh.position.set(0.5, 1.0, 0.35); rodMesh.rotation.x = 0.95; player.root.add(rodMesh);
  $('hud').classList.add('hidden'); $('btnFish').classList.add('hidden');
  $('fishUI').classList.remove('hidden'); $('btnReel').classList.add('hidden');
  fishMsg(`${SPOTS[sp.spot]}に ${rod.name}を なげるよ…`);
  fishing.from.copy(rodTip());
  bobber.visible = true; fishLine.visible = true; ripple.visible = false;
  sfx('reel'); idle = 0;
}
function rodTip() { const v = new THREE.Vector3(0, 2.8, 0); rodMesh.localToWorld(v); return v; }
function fishMsg(t) { $('fishMsg').textContent = t; }
function endFishing() {
  if (!fishing) return;
  fishing = null; mode = 'play';
  bobber.visible = false; fishLine.visible = false; ripple.visible = false;
  if (rodMesh) { player.root.remove(rodMesh); rodMesh = null; }
  $('fishUI').classList.add('hidden'); $('catchCard').classList.add('hidden');
  $('hud').classList.remove('hidden');
  doorCool = 0.8; idle = 0; save();
}
$('btnFishQuit').onclick = () => { sfx('tap'); endFishing(); };
function nextWait() { const w = fishing.rod.wait; return w[0] + Math.random() * (w[1] - w[0]); }
function updateFishing(dt) {
  const f = fishing; if (!f) return;
  idle = 0; f.t += dt;
  animate(player, dt, { t: clock, walk: false });
  const tip = rodTip(), pos = player.root.position;
  if (f.phase === 'cast') {
    const u = Math.min(1, f.t / 0.9);
    bobber.position.lerpVectors(f.from, f.to, u); bobber.position.y += Math.sin(u * Math.PI) * 2.2;
    if (u >= 1) { f.phase = 'wait'; f.t = 0; f.wait = nextWait(); bobber.position.copy(f.to); sfx('splash'); ripple.position.set(f.to.x, f.to.y + 0.02, f.to.z); ripple.visible = true; f.rip = 0; fishMsg('うきを みていよう… 🫧'); }
  } else if (f.phase === 'wait') {
    bobber.position.y = f.to.y + Math.sin(clock * 2.2) * 0.05;
    f.rip = (f.rip || 0) + dt; ripple.scale.setScalar(1 + (f.rip % 1.8) * 0.9); ripple.material.opacity = 0.6 * (1 - (f.rip % 1.8) / 1.8);
    if (f.t >= f.wait) {
      f.phase = 'bite'; f.t = 0; f.catch = rollCatch(f.sp.spot, gameHour(), S.rod);
      sfx('bite'); try { navigator.vibrate && navigator.vibrate(120); } catch (e) { /* 無視 */ }
      tmp.copy(pos); tmp.y += 3.2; spawnFx(world.group, 'bang', tmp, 1.1);
      $('btnReel').classList.remove('hidden'); fishMsg('ひいてる！ いま！ ✨');
    }
  } else if (f.phase === 'bite') {
    bobber.position.y = f.to.y - 0.18 + Math.sin(clock * 30) * 0.06;
    ripple.scale.setScalar(1 + (f.t % 0.5) * 3); ripple.material.opacity = 0.9;
    if (f.t >= f.rod.window) {
      f.phase = 'escape'; f.t = 0; $('btnReel').classList.add('hidden'); fishMsg('あっ…にげられちゃった。ざんねん！ つぎは がんばろう');
    }
  } else if (f.phase === 'escape') {
    bobber.position.y = f.to.y + Math.sin(clock * 2.2) * 0.05;
    if (f.t > 1.8) { f.phase = 'wait'; f.t = 0; f.wait = nextWait(); fishMsg('うきを みていよう… 🫧'); }
  } else if (f.phase === 'reel') {
    const u = Math.min(1, f.t / 0.7);
    bobber.position.lerpVectors(f.to, tip, u); bobber.position.y += Math.sin(u * Math.PI) * 1.5;
    if (u >= 1) showCatch();
  }
  if (f.phase !== 'result') {
    const p = lineGeo.attributes.position;
    p.setXYZ(0, tip.x, tip.y, tip.z); p.setXYZ(1, bobber.position.x, bobber.position.y, bobber.position.z); p.needsUpdate = true;
  }
}
$('btnReel').onclick = () => {
  const f = fishing; if (!f) return;
  if (f.phase === 'bite') { f.phase = 'reel'; f.t = 0; $('btnReel').classList.add('hidden'); ripple.visible = false; sfx('reel'); fishMsg('よいしょ…！'); }
};
// うきを みてる ときに うっかり タップしても、やさしく おしえてあげる
$('fishUI').addEventListener('pointerdown', e => { if (fishing && fishing.phase === 'wait' && e.target.id === 'fishUI') { fishMsg('まだ かな？ うきが しずむまで まとうね'); } });
function showCatch() {
  const f = fishing; f.phase = 'result';
  const c = f.catch;
  bobber.visible = false; fishLine.visible = false;
  let html;
  if (c.junk) {
    S.flowers += 1; $('flowerCount').textContent = '🌼 ' + S.flowers;
    html = `<div class="cc-e">${c.emoji}</div><h3>${c.name}</h3><p>${c.line}</p><p class="cc-s">ちゃんと もちかえって、ごみばこに すてたよ。<br>うみが きれいに なったね！ ごほうびに 🌼 +1</p>`;
    sfx('pick');
  } else {
    const isNew = !S.dex[c.id];
    S.fish[c.id] = (S.fish[c.id] || 0) + 1; S.fishTotal++;
    const d = S.dex[c.id] || (S.dex[c.id] = { n: 0, best: 0 }); d.n++; const bigger = c.cm > d.best; if (bigger) d.best = c.cm;
    const stars = '★'.repeat(c.r) + '☆'.repeat(4 - c.r);
    html = `<div class="cc-e">${c.emoji}</div><h3>${isNew ? '<span class="new">NEW!</span> ' : ''}${c.name}を つった！</h3><p class="cc-s">${stars}　${c.cm}cm${bigger && !isNew ? '　<b>じこ ベスト！</b>' : ''}</p><p>${c.line}</p><p class="cc-s">うりね 🌼${c.price}　（おみせで うれるよ）</p>`;
    sfx(c.r >= 3 ? 'heart' : 'catch');
    if (isNew) addDiary(`${SPOTS[f.sp.spot]}で はじめて「${c.name}」を つった（${c.cm}cm）。`);
    else if (c.r >= 4) addDiary(`${SPOTS[f.sp.spot]}で ${c.name}（${c.cm}cm）を つりあげた！`);
    for (let i = 0; i < (c.r >= 3 ? 6 : 2); i++) setTimeout(() => { tmp.copy(player.root.position); tmp.y += 2.6 + Math.random(); tmp.x += (Math.random() - 0.5) * 2; spawnFx(world.group, c.r >= 3 ? 'star' : 'heart', tmp, 0.8); }, i * 120);
    questEvent('catch', c);
  }
  $('ccBody').innerHTML = html;
  $('catchCard').classList.remove('hidden'); $('fishUI').classList.add('hidden');
  save();
}
$('ccAgain').onclick = () => { sfx('tap'); const sp = fishing && fishing.sp; $('catchCard').classList.add('hidden'); fishing = null; mode = 'play'; if (sp) startFishing(sp); };
$('ccQuit').onclick = () => { sfx('tap'); endFishing(); };
// さかなずかん
function renderDex() {
  const box = $('dexList'); box.innerHTML = '';
  const got = Object.keys(S.dex).length;
  $('dexHead').textContent = `つった しゅるい ${got}/${FISH.length}　　つった かず ${S.fishTotal || 0}　　つりざお：${S.rod ? RODS_BY[S.rod].name : 'まだ ない'}`;
  for (const f of FISH) {
    const d = S.dex[f.id];
    const el = document.createElement('div'); el.className = 'dx' + (d ? '' : ' un');
    el.innerHTML = d ? `<span class="e">${f.emoji}</span><div><b>${f.name}</b><small>${'★'.repeat(f.r)}　さいだい ${d.best}cm　×${d.n}</small><small>${SPOTS[f.loc[0]]}${f.loc.length > 1 ? 'など' : ''}${f.time === 'night' ? '・よる' : f.time === 'day' ? '・ひる' : ''}</small></div>` : `<span class="e">❓</span><div><b>？？？</b><small>${SPOTS[f.loc[0]]}${f.loc.length > 1 ? 'など' : ''}${f.time === 'night' ? '・よる' : f.time === 'day' ? '・ひる' : ''}で つれるよ</small></div>`;
    box.appendChild(el);
  }
}

// ---------- にっき / きょうの おしらせ ----------
function fmtDate(ds) { const [y, mo, d] = ds.split('-').map(Number); const w = '日月火水木金土'[new Date(y, mo - 1, d).getDay()]; return `${mo}月${d}日（${w}）`; }
function renderDiary() {
  const box = $('diaryList'); box.innerHTML = '';
  if (!S.diary.length) { box.innerHTML = '<p class="fine2">まだ なにも かいてないよ。ともだちと すごすと、できごとが ここに のこるよ。</p>'; return; }
  let lastD = '';
  for (const e of [...S.diary].reverse()) {
    if (e.d !== lastD) { const h = document.createElement('h3'); h.textContent = '📅 ' + fmtDate(e.d); box.appendChild(h); lastD = e.d; }
    const p = document.createElement('p'); p.className = 'dline'; p.textContent = '・' + e.t; box.appendChild(p);
  }
}
function showDailyNotice() {
  const t = todayStr();
  if (S.lastDay === t) return;
  S.days = (S.days || 0) + 1; S.lastDay = t; trackDays(S.days);
  const ev = EVENT_NAMES[currentEvent()];
  const calling = ORDER.filter(id => questsOf(id, 'available').length || dailyPossible(id)).map(id => CHARS[id].name);
  const ready = QS().filter(q => qStatus(q) === 'ready').length;
  const tips = ['ともだちに プレゼントを すると、このみに あうと とっても よろこぶよ。', 'おしゃべりは 1にち すこしずつ。まいにち あいにくると、ゆっくり なかよくなれるよ。', 'よるの とうだいは、とくべつな ふんいき。ほしを みに いってみよう。', 'おみせで 「もちかえる」と、ともだちへの プレゼントに できるよ。', 'つかれたら 「ねる」で ひとやすみ。ポコが となりに きてくれるかも。'];
  $('toast').classList.add('hidden');
  $('dailyBody').innerHTML = `<p class="dt">📅 ${fmtDate(t)}${ev ? '　<b>' + ev + '</b>' : ''}</p><p>あそび はじめて <b>${S.days}日め</b>。</p>` +
    (calling.length ? `<p>❗ ${calling.slice(0, 5).join('・')}${calling.length > 5 ? ' ほか' : ''} が あなたを まっているよ。</p>` : '') +
    (ready ? `<p>？ ほうこくできる おねがいが ${ready}けん あるよ。</p>` : '') +
    `<p class="tip">💡 ${tips[(S.days + new Date().getDate()) % tips.length]}</p>`;
  $('daily').classList.remove('hidden');
  mode = 'menu';
}
$('dailyOk').onclick = () => { $('daily').classList.add('hidden'); mode = 'play'; sfx('tap'); save(); };

// ---------- おねがい (ミッション) ----------
function qState(q) { return S.quests[q.id] || null; }
function qProgress(q) {
  const st = qState(q) || {};
  if (q.type === 'catch') return { have: Math.min(q.n, st.c || 0), need: q.n };
  if (q.type === 'collect') return { have: Math.min(q.n, q.item === 'flower' ? S.flowers : (S.inv[q.item] || 0)), need: q.n };
  if (q.type === 'talk') return { have: (st.talked || []).length, need: q.who.length };
  return { have: st.p ? 1 : 0, need: 1 };
}
function qStatus(q) {
  const st = qState(q);
  if (st && st.s === 'done') return 'done';
  if (st) { const p = qProgress(q); return p.have >= p.need ? 'ready' : 'active'; }
  if (level(S.friend[q.giver] || 0) < q.lv) return 'locked';
  if (q.needs === 'rod' && !S.rod) return 'locked';
  if (q.after && !(S.quests[q.after] && S.quests[q.after].s === 'done')) return 'locked';
  return 'available';
}
const QS = () => [...QUESTS, ...Object.values(S.dyn || {})];
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const isNight = () => { const h = gameHour(); return h >= 19 || h < 5; };
function addDiary(t) { S.diary.push({ d: todayStr(), t }); if (S.diary.length > 250) S.diary.shift(); }
const questsOf = (id, status) => QS().filter(q => q.giver === id && qStatus(q) === status);
function fillN(t, id) { return fillFor(id, t, ctxFor(id)); }

function makeMark(ch, bg) {
  const c = document.createElement('canvas'); c.width = c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.strokeStyle = '#fff'; g.lineWidth = 8;
  g.beginPath(); g.arc(48, 48, 36, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#fff'; g.font = 'bold 56px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 48, 52);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(1.3, 1.3, 1); s.renderOrder = 12; s.visible = false;
  return s;
}
const MARKS = { avail: makeMark('!', '#ff8a3d'), ready: makeMark('？', '#3dbb6a'), target: makeMark('▼', '#4f9fe0') };
function initMarks() {
  for (const id of ORDER) {
    const P = npcs[id];
    P.marks = {};
    for (const [k, base] of Object.entries(MARKS)) {
      const s = base.clone(); s.material = base.material;
      s.position.set(0, (P.headY + P.hr) * P.scale + 1.9, 0); P.root.add(s); P.marks[k] = s;
    }
  }
  refreshMarkers();
}
function refreshMarkers() {
  if (!S) return;
  const targets = new Set();
  for (const q of QS()) { const st = qState(q); if (st && st.s !== 'done' && q.type === 'talk') for (const w of q.who) if (!(st.talked || []).includes(w)) targets.add(w); }
  for (const id of ORDER) {
    const P = npcs[id]; if (!P.marks) continue;
    const kind = questsOf(id, 'ready').length ? 'ready' : (questsOf(id, 'available').length || dailyPossible(id)) ? 'avail' : targets.has(id) ? 'target' : null;
    for (const [k, s] of Object.entries(P.marks)) s.visible = k === kind;
  }
  updateQuestHud();
}
function updateQuestHud() {
  const bar = $('questBar');
  const ready = QS().filter(q => qStatus(q) === 'ready'), active = QS().filter(q => qStatus(q) === 'active');
  const q = ready[0] || active[0];
  if (!q) { bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  const p = qProgress(q);
  const more = ready.length + active.length - 1;
  bar.innerHTML = qStatus(q) === 'ready' ? `✅ ${CHARS[q.giver].name}に おはなしして おねがいを おわらせよう` : `📜 ${q.title}　${p.have}/${p.need}`;
  if (more > 0) bar.innerHTML += `　<small>ほか ${more}</small>`;
}
function questEvent(type, what) {
  let hit = false;
  if (type === 'catch') {
    for (const q of QS()) {
      const st = qState(q);
      if (!st || st.s === 'done' || q.type !== 'catch') continue;
      if ((q.minRarity || 0) > what.r || (q.loc && !what.loc.includes(q.loc)) || (q.night && !isNight())) continue;
      st.c = (st.c || 0) + 1;
      const p = qProgress(q);
      toast(p.have >= p.need ? `📜 ${q.title}<br>${CHARS[q.giver].name}に おはなししよう！` : `📜 ${q.title}　${p.have}/${p.need}`, 2600);
      hit = true;
    }
    if (hit) { refreshMarkers(); save(); }
    return;
  }
  if (type === 'none') { refreshMarkers(); return; }
  for (const q of QS()) {
    const st = qState(q);
    if (!st || st.s === 'done' || q.type !== type) continue;
    if (type === 'buy' && q.what !== what) continue;
    if (!st.p) { st.p = 1; hit = true; toast(`📜 ${q.title}<br>${CHARS[q.giver].name}に おはなししよう！`, 3200); sfx('heart'); }
  }
  if (hit) { refreshMarkers(); save(); }
}
function checkVisits(pos) {
  let hit = false;
  for (const q of QS()) {
    const st = qState(q);
    if (!st || st.s === 'done' || q.type !== 'visit' || st.p) continue;
    const pl = PLACES[q.where];
    if (q.night && !isNight()) continue;
    if (Math.hypot(pos.x - pl.x, pos.z - pl.z) < q.r) { st.p = 1; hit = true; toast(`📍 ${pl.name}に ついたよ！<br>${CHARS[q.giver].name}に おしえてあげよう`, 3600); sfx('heart'); }
  }
  if (hit) { refreshMarkers(); save(); }
}
function addChoices(id, opts) {
  const d = document.createElement('div'); d.className = 'msg choice';
  for (const [label, fn, cls] of opts) {
    const b = document.createElement('button'); b.textContent = label; if (cls) b.className = cls;
    b.onclick = () => { for (const x of d.querySelectorAll('button')) x.disabled = true; sfx('tap'); fn(); };
    d.appendChild(b);
  }
  $('chatLog').appendChild(d); $('chatLog').scrollTop = 1e6;
}
function npcSay(id, text) { addMsg(id, 'npc', text); logPush(id, 'npc', text); speak(text, CHARS[id].voice); npcs[id].hop = 0.7; sfx('recv'); }
function completeQuest(q) {
  track('quest-done');
  const st = qState(q);
  if (q.type === 'collect') { if (q.item === 'flower') { S.flowers -= q.n; } else S.inv[q.item] = Math.max(0, (S.inv[q.item] || 0) - q.n); }
  st.s = 'done';
  npcSay(q.giver, fillN(q.thanks, q.giver));
  S.flowers += q.reward.flowers; $('flowerCount').textContent = '🌼 ' + S.flowers;
  addMsg(q.giver, 'sys', `🎁 おねがい たっせい！ 🌼 +${q.reward.flowers}　なかよし ♥ +${q.reward.friend}`);
  if (q.diary) addDiary(q.diary); else addDiary(`${CHARS[q.giver].name}の「${q.title}」を おてつだいした。`);
  if (q.unlock && !S.owned.includes(q.unlock)) {
    S.owned.push(q.unlock);
    const c = CLOTHES.find(x => x.id === q.unlock);
    if (c) { setTimeout(() => { if (chatNpc === q.giver) addMsg(q.giver, 'sys', `✨ とくべつな プレゼント：${c.emoji} ${c.name}（おみせの「きせかえ」で きられるよ）`); }, 1200); addDiary(`${CHARS[q.giver].name}から とくべつな ${c.name}を もらった。`); }
  }
  if (q.daily) { S.daily.done = S.daily.done || {}; S.daily.done[q.giver] = todayStr(); }
  sfx('heart');
  gain(q.giver, q.reward.friend, q.thanks.length);
  refreshGiftBtn();
  refreshMarkers(); save();
}
function askQuest(q) {
  npcSay(q.giver, fillN(q.ask, q.giver));
  setTimeout(() => {
    if (chatNpc !== q.giver) return;
    addChoices(q.giver, [
      ['✅ ひきうける', () => {
        S.quests[q.id] = { s: 'active', p: 0, talked: [] };
        addMsg(q.giver, 'sys', `📜 おねがいを ひきうけたよ：${q.title}`);
        npcSay(q.giver, 'ありがとう！ ' + q.hint + ' ね。おねがいね！');
        refreshMarkers(); save();
      }, 'ok'],
      ['あとで', () => { npcSay(q.giver, 'うん、気が向いたら またおねがいね。'); }, 'later'],
    ]);
  }, 900);
}
// ともだちの「おねがい」の はなし (ひらくとき/「おねがい」ボタン)
// まいにちの「ごようきき」: しんゆう(なかよし)になると、小さな おねがいを まいにち してくれる
const DAILY_THANKS = { poko: 'ありがとうなの！ たすかったの〜', mei: '…ありがとう。助かったわ。', sei: 'ありがとう、{n}さん。助かったわ。', rin: 'ありがとう！ 助かっちゃった。', pa: 'キュッ！ ありがとう！', ku: 'ありがとう…！ うれしい…。', haru: 'チュリ！ ありがとう！', nami: 'ありがとニャ！', kuro: 'ありがとう、{n}さん。助かるわ。', pon: 'まいどありがとうだぽん！' };
function dailyPossible(id) {
  if (level(S.friend[id] || 0) < 2) return false;
  const t = todayStr();
  if (S.daily.date !== t) S.daily = { date: t, made: {}, done: S.daily.done || {} };
  if (S.daily.made[id]) return false;
  if (questsOf(id, 'ready').length || questsOf(id, 'available').length || questsOf(id, 'active').length) return false;
  return !!DAILY[id];
}
function makeDaily(id) {
  const t = todayStr(), tpl = DAILY[id];
  S.daily.made[id] = true;
  const lv = level(S.friend[id] || 0);
  const cnt = 1 + Math.floor(Math.random() * Math.min(3, lv));
  let def;
  if (tpl.type === 'buy') {
    const fid = tpl.foods[Math.floor(Math.random() * tpl.foods.length)], f = FOODS.find(x => x.id === fid);
    def = { id: `d_${id}_${t}`, daily: true, giver: id, lv: 0, title: `きょうの ごようきき：${f.name}`, type: 'buy', what: fid, ask: tpl.ask.replace('{item}', f.name), hint: `おみせで ${f.name}を かおう`, thanks: DAILY_THANKS[id], reward: { flowers: 4, friend: 1 } };
  } else {
    const k = tpl.items[Math.floor(Math.random() * tpl.items.length)], it = ITEMS[k];
    def = { id: `d_${id}_${t}`, daily: true, giver: id, lv: 0, title: `きょうの ごようきき：${it.name}`, type: 'collect', item: k, n: cnt, ask: tpl.ask.replace('{item}', it.name).replace('{count}', cnt), hint: `${it.name}を ${cnt}こ あつめよう`, thanks: DAILY_THANKS[id], reward: { flowers: 3 + cnt * 2, friend: 1 } };
  }
  for (const k of Object.keys(S.dyn)) if (!k.endsWith(t) && S.quests[k] && S.quests[k].s === 'done') { delete S.dyn[k]; delete S.quests[k]; }
  S.dyn[def.id] = def;
  return def;
}
function questTalk(id, manual) {
  const rd = questsOf(id, 'ready')[0];
  if (rd) { completeQuest(rd); return true; }
  const av = questsOf(id, 'available')[0];
  if (av) { askQuest(av); return true; }
  if (dailyPossible(id)) { askQuest(makeDaily(id)); return true; }
  const ac = questsOf(id, 'active')[0];
  if (ac && manual) { const p = qProgress(ac); npcSay(id, `「${ac.title}」は ${p.have}/${p.need} だよ。${ac.hint}。むりしないでね。`); return true; }
  if (manual) { npcSay(id, 'いまは だいじょうぶ！ ありがとう。また こんど おねがいするかも。'); return true; }
  return false;
}
function hasQuestTalk(id) { return questsOf(id, 'ready').length || questsOf(id, 'available').length || questsOf(id, 'active').length || dailyPossible(id); }

// おねがいノート / マップ
const DIRS = ['きた', 'ほくとう', 'ひがし', 'なんとう', 'みなみ', 'なんせい', 'にし', 'ほくせい'];
function dirText(x, z) {
  const p = player.root.position;
  const px = place === 'in' ? 0 : p.x, pz = place === 'in' ? -12 : p.z;
  const dx = x - px, dz = z - pz;
  if (Math.hypot(dx, dz) < 6) return 'すぐ ちかく';
  const a = Math.atan2(dx, -dz); // 北=0, 東=90°
  const i = Math.round(((a + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8;
  return `${DIRS[i]}の ほう（${Math.round(Math.hypot(dx, dz))}m）`;
}
function giverPos(id) { const p = npcs[id].root.position; return place === 'in' && p.x > 300 ? [0, -14] : [p.x, p.z]; }
function renderQuests() {
  const box = $('qList'); box.innerHTML = '';
  const inv = Object.entries(ITEMS).filter(([k]) => k !== 'flower').map(([k, v]) => `${v.emoji}${S.inv[k] || 0}`).join('　');
  $('qInv').textContent = 'もちもの：' + inv + `　🌼${S.flowers}`;
  const sec = (title, list, fn) => {
    if (!list.length) return;
    const h = document.createElement('h3'); h.textContent = title; box.appendChild(h);
    for (const q of list) box.appendChild(fn(q));
  };
  const card = (q, body, cls = '') => {
    const d = document.createElement('div'); d.className = 'qcard ' + cls;
    d.innerHTML = `<img src="${portraits[q.giver]}" alt=""><div><b>${q.title}</b><small>${CHARS[q.giver].name}からの おねがい</small>${body}</div>`;
    return d;
  };
  sec('✅ おわらせよう', QS().filter(q => qStatus(q) === 'ready'), q => { const [gx, gz] = giverPos(q.giver); return card(q, `<p>${CHARS[q.giver].name}に おはなししよう（${dirText(gx, gz)}）</p>`, 'ready'); });
  sec('📜 すすんでいる', QS().filter(q => qStatus(q) === 'active'), q => {
    const p = qProgress(q); let where = '';
    if (q.type === 'visit') where = `<p>めざす：${PLACES[q.where].name}（${dirText(PLACES[q.where].x, PLACES[q.where].z)}）</p>`;
    return card(q, `<p>${q.hint}</p>${where}<p class="pg">${p.have}/${p.need}</p>`);
  });
  sec('❗ ともだちが よんでいるよ', QS().filter(q => qStatus(q) === 'available'), q => { const [gx, gz] = giverPos(q.giver); return card(q, `<p>${CHARS[q.giver].name}に はなしかけよう（${dirText(gx, gz)}）</p>`, 'avail'); });
  const locked = ORDER.map(id => { const q = QUESTS.find(x => x.giver === id && qStatus(x) === 'locked'); return q ? [id, q] : null; }).filter(Boolean);
  if (locked.length) {
    const h = document.createElement('h3'); h.textContent = '🔒 もっと なかよくなると…'; box.appendChild(h);
    for (const [id, q] of locked) {
      const need = Math.max(q.lv, 0);
      const d = document.createElement('div'); d.className = 'qcard lock';
      d.innerHTML = `<img src="${portraits[id]}" alt=""><div><b>${CHARS[id].name}</b><small>${q.needs === 'rod' && level(S.friend[id] || 0) >= q.lv ? 'つりざおを かうと、あたらしい おねがいが…' : '「' + TIERS[need] + '」になると、あたらしい おはなしが…'}</small></div>`;
      box.appendChild(d);
    }
  }
  const done = QS().filter(q => qStatus(q) === 'done');
  sec(`🏅 おわった（${done.length}）`, done, q => card(q, '', 'done'));
  if (!box.children.length) box.innerHTML = '<p class="fine2">まだ おねがいは ないよ。ともだちに はなしかけてみよう（！マークの こ）</p>';
}
let mapTimer = 0;
function drawMap() {
  const cv = $('mapCv'), g = cv.getContext('2d');
  const W = cv.width, R = ISLAND_R + 6, k = W / 2 / R, cx = W / 2;
  const X = x => cx + x * k, Z = z => cx + z * k;
  g.clearRect(0, 0, W, W);
  g.fillStyle = '#7fc8f0'; g.fillRect(0, 0, W, W);
  g.fillStyle = '#f4e2b0'; g.beginPath(); g.arc(cx, cx, (ISLAND_R + 2) * k, 0, 7); g.fill();
  g.fillStyle = '#8fd36e'; g.beginPath(); g.arc(cx, cx, 39 * k, 0, 7); g.fill();
  g.fillStyle = '#ead7a4'; g.fillRect(X(-1.5), Z(-12), 3 * k, 52 * k); g.fillRect(X(-32), Z(-3.2), 64 * k, 2.4 * k);
  g.fillStyle = '#7ccdf2'; for (const [x, z, r] of [[9, 9, 3.5], [25, 17, 6.2]]) { g.beginPath(); g.arc(X(x), Z(z), r * k, 0, 7); g.fill(); }
  g.font = `bold ${Math.round(W * 0.034)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const lab = (x, z, e, t) => { g.fillText(e, X(x), Z(z)); g.fillStyle = '#5a4636'; g.fillText(t, X(x), Z(z) + 15); };
  g.fillStyle = '#5a4636';
  lab(0, -16, '🏠', 'セイママの いえ'); lab(-9, 9.4, '🛍', 'おみせ'); lab(24, -33, '🗼', 'とうだい'); lab(-31, 8, '⛩', 'じんじゃ');
  lab(12, 40, '🏖', 'うみの いえ'); lab(-19, -13, '🎋', 'たけやぶ'); lab(-14, -1, '🌼', 'おはなばたけ'); lab(25, 17, '', 'みずうみ'); lab(0, -30, '🍄', 'もり');
  // おねがいの もくてき地
  const t = performance.now() / 300;
  for (const q of QS()) { const st = qState(q); if (st && st.s !== 'done' && q.type === 'visit' && !st.p) { const pl = PLACES[q.where]; g.fillStyle = '#ff8a3d'; g.beginPath(); g.arc(X(pl.x), Z(pl.z), (7 + Math.sin(t) * 2), 0, 7); g.fill(); } }
  // なかま
  for (const id of ORDER) {
    const [x, z] = place === 'in' && ['sei', 'poko', 'mei'].includes(id) ? [0, -14] : [npcs[id].root.position.x, npcs[id].root.position.z];
    if (Math.abs(x) > 300) continue;
    g.fillStyle = CHARS[id].color; g.strokeStyle = '#fff'; g.lineWidth = 2;
    g.beginPath(); g.arc(X(x), Z(z), 6, 0, 7); g.fill(); g.stroke();
    const st = questsOf(id, 'ready').length ? '？' : questsOf(id, 'available').length ? '！' : '';
    if (st) { g.fillStyle = st === '！' ? '#ff8a3d' : '#3dbb6a'; g.fillText(st, X(x), Z(z) - 14); }
  }
  // じぶん
  const p = player.root.position, px = place === 'in' ? 0 : p.x, pz = place === 'in' ? -14 : p.z;
  g.save(); g.translate(X(px), Z(pz)); g.rotate(-player.root.rotation.y + Math.PI);
  g.fillStyle = '#e8455a'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -11); g.lineTo(8, 8); g.lineTo(-8, 8); g.closePath(); g.fill(); g.stroke(); g.restore();
}
function openMap() { $('map').classList.remove('hidden'); drawMap(); clearInterval(mapTimer); mapTimer = setInterval(() => { if ($('map').classList.contains('hidden')) clearInterval(mapTimer); else drawMap(); }, 300); }
$('questBar').onclick = () => { if (mode === 'play') { mode = 'menu'; renderQuests(); showPanel('quests'); $('menu').classList.remove('hidden'); } };
const NPC_POS_DUMMY = 0; void NPC_POS_DUMMY;

function openChat(id) {
  if (mode !== 'play') return;
  track('chat');
  if (sleeping) wakeUp();
  chooseChatSide(id);
  mode = 'chat'; chatNpc = id;
  initAudio(); sfx('open');
  moveTarget = null; marker.visible = false; $('btnTalk').classList.add('hidden');
  $('hud').classList.add('hidden');
  const c = CHARS[id];
  $('chat').style.setProperty('--c', c.color);
  $('chatFace').src = portraits[id];
  $('chatName').textContent = c.name;
  $('chatKind').textContent = c.kind + '・' + c.tag;
  updateHearts(id);
  $('chatLog').innerHTML = '';
  // これまでの会話 (直近)
  const hist = (S.logs[id] || []).slice(-8);
  for (const [f, t] of hist) addMsg(id, f, t);
  if (hist.length) addMsg(id, 'sys', '── ここから つづき ──');
  const ctx = ctxFor(id);
  const line = openLine(id, ctx);
  S.firstDone[id] = true;
  setTimeout(() => { if (chatNpc !== id) return; addMsg(id, 'npc', line); logPush(id, 'npc', line); speak(line, c.voice); npcs[id].hop = 0.8; sfx('recv'); }, 250);
  // おねがい: とどけものの へんじ → たっせい/あたらしい おねがい
  let d = 1500 + Math.min(2400, line.length * 70);
  for (const q of QS()) {
    const st = qState(q);
    if (st && st.s === 'active' && q.type === 'talk' && q.who.includes(id) && !(st.talked || []).includes(id)) {
      st.talked = [...(st.talked || []), id];
      const dl = q.deliver && q.deliver[id];
      setTimeout(() => { if (chatNpc !== id) return; if (dl) npcSay(id, fillN(dl, id)); addMsg(id, 'sys', `📜 ${q.title}：${st.talked.length}/${q.who.length}`); refreshMarkers(); save(); }, d);
      d += 2400;
    }
  }
  setTimeout(() => { if (chatNpc === id && !waiting) questTalk(id, false); }, d);
  renderChips(id);
  refreshGiftBtn(); $('giftPick').classList.add('hidden');
  $('chat').classList.remove('hidden');
  save();
}
function updateHearts(id) {
  const p = S.friend[id] || 0, lv = level(p);
  $('chatHearts').textContent = hearts(lv) + '　' + TIERS[lv] + (lv < 5 ? `（あと ${toNext(p)}）` : '');
}
function closeChat() {
  if (mode !== 'chat') return;
  $('giftPick').classList.add('hidden');
  clearTimeout(lvTimer); lvPending = null;
  mode = 'play'; chatNpc = null;
  $('chat').classList.add('hidden');
  $('hud').classList.remove('hidden');
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  document.activeElement && document.activeElement.blur && document.activeElement.blur();
  save();
}
// なかよしレベルが上がったとき：
//  ・「レベルアップ」の表示はすぐ出す
//  ・お礼のことばは、いまの返事を読み終えるころに、別の吹き出しで届ける
//    (しゃべっている途中で会話が切れないように、新しい発言があれば次の返事のあとに回す)
let lvTimer = 0, lvPending = null;
function scheduleLvup(ms) { clearTimeout(lvTimer); if (lvPending) lvTimer = setTimeout(flushLvup, ms); }
function flushLvup() {
  if (!lvPending) return;
  if (mode !== 'chat' || chatNpc !== lvPending.id || waiting) { return; }
  const { id, ctx } = lvPending; lvPending = null;
  const t = lvupLine(id, ctx);
  addMsg(id, 'npc', t); logPush(id, 'npc', t); speak(t, CHARS[id].voice); sfx('recv');
}
function gain(id, n, readLen = 20) {
  const before = level(S.friend[id] || 0);
  S.friend[id] = Math.min(MAX_PTS, (S.friend[id] || 0) + n);
  const after = level(S.friend[id]);
  updateHearts(id);
  if (after > before) {
    sfx('heart'); track('levelup');
    addMsg(id, 'sys', `💕 ${CHARS[id].name}との なかよしが「${TIERS[after]}」に あがったよ！`);
    addDiary(`${CHARS[id].name}と「${TIERS[after]}」に なった。`);
    lvPending = { id, ctx: ctxFor(id) };
    scheduleLvup(2500 + readLen * 150);
    for (let i = 0; i < 5; i++) setTimeout(() => { tmp.copy(npcs[id].root.position); tmp.y += 3; tmp.x += (Math.random() - 0.5) * 1.5; spawnFx(world.group, 'heart', tmp, 0.9); }, i * 150);
  }
}
// 会話だけで ふえる なかよしポイントは 1日 8ポイントまで (まいにち すこしずつ なかよくなる)
const CHAT_CAP = 8;
function gainChat(id, n, readLen) {
  const t = todayStr();
  if (S.chatPts.date !== t) S.chatPts = { date: t };
  const used = S.chatPts[id] || 0, allow = Math.max(0, Math.min(n, CHAT_CAP - used));
  S.chatPts[id] = used + allow;
  if (allow > 0) gain(id, allow, readLen);
  if (used < CHAT_CAP && S.chatPts[id] >= CHAT_CAP) addMsg(id, 'sys', '💤 きょうは たくさん おしゃべり したね。つづきは また あした。（プレゼントや おねがいなら、もっと なかよくなれるよ）');
}
let waiting = false;
function send(text) {
  text = (text || '').trim();
  const id = chatNpc;
  if (!text || !id || waiting) return;
  waiting = true; clearTimeout(lvTimer); stopSpeak();
  $('chatInput').value = '';
  addMsg(id, 'me', text); logPush(id, 'me', text);
  sfx('send');
  const typing = addMsg(id, 'npc', '…', 'typing');
  const ctx = ctxFor(id);
  let r = reply(id, text, ctx);
  if (/(おねがい|ミッション|たのみ|お願い|依頼|てつだ|手伝)/.test(text)) r = { text: '__quest__', key: 'quest' };
  if (r.key === 'story' || r.key === 'story-locked') {
    const rr = story(id, ctx);
    r = rr;
    if (rr.storyDone) S.storyIdx[id] = (S.storyIdx[id] || 0) + 1;
  }
  setTimeout(() => {
    typing.remove();
    if (chatNpc !== id) { waiting = false; return; }
    if (r.key === 'quest') { waiting = false; questTalk(id, true); renderChips(id); return; }
    addMsg(id, 'npc', r.text); logPush(id, 'npc', r.text);
    speak(r.text, CHARS[id].voice); sfx('recv');
    npcs[id].hop = 0.7;
    gainChat(id, r.key === 'fb' ? 1 : r.key === 'gate' ? 0 : 2, r.text.length);
    if (r.key === 'shop') setTimeout(() => { if (mode === 'chat') { closeChat(); openShop(); } }, 1400);
    if (Math.random() < 0.4) renderChips(id);
    waiting = false;
    if (lvPending) scheduleLvup(2500 + r.text.length * 150);
    save();
  }, 650 + Math.min(900, r.text.length * 12));
}
$('chatSend').onclick = () => send($('chatInput').value);
$('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) send($('chatInput').value); });
$('chatClose').onclick = closeChat;
function giftList() {
  const out = [];
  if (S.flowers > 0) out.push({ id: 'flower', emoji: '🌼', name: 'おはな', n: S.flowers, src: 'flowers' });
  for (const [k, def] of Object.entries(ITEMS)) if (k !== 'flower' && (S.inv[k] || 0) > 0) out.push({ id: k, emoji: def.emoji, name: def.name, n: S.inv[k], src: 'inv' });
  for (const f of FOODS) if ((S.food[f.id] || 0) > 0) out.push({ id: f.id, emoji: f.emoji, name: f.name, n: S.food[f.id], src: 'food' });
  for (const [fid, n] of Object.entries(S.fish)) if (n > 0) { const f = FISH_BY_ID[fid]; out.push({ id: 'fish', fid, emoji: f.emoji, name: f.name, n, src: 'fish' }); }
  return out;
}
function refreshGiftBtn() { $('chatGift').disabled = giftList().length === 0; }
$('chatGift').onclick = () => {
  const id = chatNpc; if (!id) return;
  const box = $('giftPick');
  if (!box.classList.contains('hidden')) { box.classList.add('hidden'); return; }
  const list = giftList();
  if (!list.length) return;
  box.innerHTML = '<div class="gp-t">なにを あげる？（このみが あるよ）</div>';
  for (const it of list) {
    const b = document.createElement('button');
    b.innerHTML = `${it.emoji} ${it.name} <small>×${it.n}</small>`;
    b.onclick = () => { box.classList.add('hidden'); giveGift(id, it); };
    box.appendChild(b);
  }
  box.classList.remove('hidden');
};
function giveGift(id, it) {
  if (it.src === 'flowers') { S.flowers--; $('flowerCount').textContent = '🌼 ' + S.flowers; }
  else if (it.src === 'inv') S.inv[it.id]--;
  else if (it.src === 'fish') S.fish[it.fid]--;
  else S.food[it.id]--;
  stopSpeak();
  addMsg(id, 'sys', `${it.emoji} ${CHARS[id].name}に ${it.name}を あげたよ！`);
  sfx('pick');
  const t = todayStr();
  if (S.giftsToday.date !== t) S.giftsToday = { date: t };
  const again = S.giftsToday[id] || 0; S.giftsToday[id] = again + 1;
  const rx = giftReaction(id, it.id, it.name, ctxFor(id));
  const pts = again >= 1 ? Math.max(1, Math.floor(rx.pts / 2)) : rx.pts;
  setTimeout(() => {
    if (chatNpc !== id) return;
    npcSay(id, rx.text); npcs[id].hop = rx.pref === 'love' ? 1.6 : 1.0;
    addMsg(id, 'sys', rx.pref === 'love' ? `💖 だいすきな ものだったみたい！ なかよし ♥ +${pts}` : rx.pref === 'like' ? `😊 よろこんでくれた！ なかよし ♥ +${pts}` : rx.pref === 'dislike' ? `😅 にがてな ものだったみたい… なかよし ♥ +${pts}` : `なかよし ♥ +${pts}`);
    if (rx.pref === 'love') addDiary(`${CHARS[id].name}に ${it.name}を おくったら、とても よろこんでくれた。`);
    gain(id, pts, rx.text.length); refreshGiftBtn(); questEvent('none'); save();
  }, 700);
}
$('btnTalk').onclick = () => { if (nearNpc) openChat(nearNpc); };

// ---------- アバター作成 ----------
function buildOptions() {
  const mk = (id, list, key, kind) => {
    const box = $(id); box.innerHTML = '';
    for (const it of list) {
      const val = Array.isArray(it) ? it[0] : it;
      const b = document.createElement('button');
      if (kind === 'sw') b.style.background = val; else b.textContent = it[1];
      b.setAttribute('aria-label', String(val));
      b.onclick = () => { S.avatar[key] = val; refreshOptions(); rebuildPreview(); sfx('tap'); };
      b.dataset.v = val;
      box.appendChild(b);
    }
  };
  mk('optHair', AVATAR_OPTS.hair, 'hair');
  mk('optHairColor', AVATAR_OPTS.hairColor, 'hairColor', 'sw');
  mk('optSkin', AVATAR_OPTS.skin, 'skin', 'sw');
  mk('optOutfit', AVATAR_OPTS.outfit, 'outfit', 'sw');
}
function refreshOptions() {
  for (const [id, key] of [['optHair', 'hair'], ['optHairColor', 'hairColor'], ['optSkin', 'skin'], ['optOutfit', 'outfit']]) {
    for (const b of $(id).children) b.classList.toggle('on', b.dataset.v === S.avatar[key]);
  }
}
function rebuildPreview() {
  if (prevAvatar) prevScene.remove(prevAvatar.root);
  prevAvatar = makeAvatar(S.avatar);
  prevAvatar.root.scale.setScalar(1.35);
  prevAvatar.root.rotation.y = 0.35;
  prevScene.add(prevAvatar.root);
}
let editingExisting = false;
function startCreator(existing) {
  editingExisting = !!existing;
  mode = 'creator';
  $('title').classList.add('hidden'); $('hud').classList.add('hidden'); $('menu').classList.add('hidden');
  $('creator').classList.remove('hidden');
  $('nameInput').value = S.avatar.name || '';
  buildOptions(); refreshOptions(); rebuildPreview();
}
$('btnCreateOk').onclick = () => {
  const name = $('nameInput').value.trim();
  if (!name) { toast('おなまえを いれてね', 1800); $('nameInput').focus(); return; }
  S.avatar.name = name.slice(0, 8);
  S.created = true;
  initAudio(); sfx('heart');
  $('creator').classList.add('hidden');
  buildPlayer();
  enterPlay();
  if (!editingExisting) toast(`ようこそ、${S.avatar.name}さん！<br>ポコたちに あいに いこう 🐼`, 4200);
};

// ---------- 画面遷移 ----------
function enterPlay() {
  mode = 'play';
  $('hud').classList.remove('hidden'); $('title').classList.add('hidden'); $('menu').classList.add('hidden');
  $('flowerCount').textContent = '🌼 ' + S.flowers;
  $('hint').classList.remove('fade');
  setTimeout(() => $('hint').classList.add('fade'), 9000);
  camPos.copy(camera.position); camLook.set(player.root.position.x, 1, player.root.position.z);
  refreshMarkers(); yaw = 0; idle = 0; sleeping = false; $('btnWake').classList.add('hidden');
  save();
  setTimeout(() => { if (mode === 'play') showDailyNotice(); }, 900);
}
function showTitle() {
  if (place === 'in' && player) exitHouse();
  mode = 'title';
  ['hud', 'menu', 'creator', 'chat', 'notebook', 'settings', 'theaterList', 'theaterUI', 'transfer'].forEach(i => $(i).classList.add('hidden'));
  $('title').classList.remove('hidden');
  const has = !!loadSave();
  $('btnContinue').classList.toggle('hidden', !has);
  if (!S) S = freshState();
}
$('btnContinue').onclick = () => {
  const s = loadSave();
  if (!s) return;
  track('continue');
  S = s; applySettings(); buildPlayer(); initAudio(); enterPlay();
  toast(`おかえりなさい、${S.avatar.name}さん！`, 2400);
};
$('btnNew').onclick = () => {
  if (loadSave() && !confirm('いまの ぼうけんを けして、はじめからに しますか？')) return;
  track('new-game');
  S = freshState(); applySettings(); initAudio();
  startCreator(false);
};

// ひきつぎコード（きろくを文字にして コピー／はりつけで うつす）
const b64 = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64 = t => { t = t.replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '='; const s = atob(t), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
async function pipeBytes(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }
async function makeCode() {
  save();
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) throw new Error('nosave');
  const bytes = new TextEncoder().encode(raw);
  if (typeof CompressionStream === 'function') return 'POKO2-' + b64(await pipeBytes(bytes, new CompressionStream('gzip')));
  return 'POKO1-' + b64(bytes);
}
async function readCode(code) {
  const t = code.replace(/\s+/g, '');
  const m = /^POKO([12])-([A-Za-z0-9_-]+)$/.exec(t);
  if (!m) throw new Error('format');
  let bytes = unb64(m[2]);
  if (m[1] === '2') bytes = await pipeBytes(bytes, new DecompressionStream('gzip'));
  const s = JSON.parse(new TextDecoder().decode(bytes));
  if (!s || s.v !== 1 || !s.created || !s.avatar) throw new Error('data');
  return s;
}
let tfFrom = 'menu';
function openTransfer() { $('tfBox').value = ''; $('tfMsg').textContent = ''; tfFrom = mode === 'title' ? 'title' : 'menu'; }
$('btnTransferT').onclick = () => { initAudio(); sfx('tap'); openTransfer(); tfFrom = 'title'; $('transfer').classList.remove('hidden'); };
$('tfBack').onclick = () => { sfx('tap'); if (tfFrom === 'title') $('transfer').classList.add('hidden'); else showPanel('menu'); };
$('tfMake').onclick = async () => {
  sfx('tap');
  if (!S || !S.created) { $('tfMsg').textContent = 'まだ ほぞんされた きろくが ありません'; return; }
  try {
    const code = await makeCode();
    $('tfBox').value = code;
    let ok = false;
    try { await navigator.clipboard.writeText(code); ok = true; } catch (e) { /* 手動コピー */ }
    if (!ok) { $('tfBox').focus(); $('tfBox').select(); }
    $('tfMsg').textContent = ok ? '✅ コピーしました。メモなどに はりつけて とっておいてね' : 'コードを ながおしして コピーしてね';
  } catch (e) { $('tfMsg').textContent = 'コードを つくれませんでした'; }
};
$('tfLoad').onclick = async () => {
  sfx('tap');
  const code = $('tfBox').value.trim();
  if (!code) { $('tfMsg').textContent = 'コードを はりつけてね'; return; }
  try {
    const s = await readCode(code);
    if (loadSave() && !confirm('いまの きろくは きえて、コードの きろくに かわります。いいですか？')) return;
    S = Object.assign(freshState(), s, { settings: { ...freshState().settings, ...s.settings } });
    localStorage.setItem(SAVE_KEY, JSON.stringify(S));
    track('transfer-in');
    $('transfer').classList.add('hidden'); $('menu').classList.add('hidden');
    applySettings(); showTitle();
    toast(`ふっこう しました！「つづきから」で ${S.avatar.name}さんに あえるよ`, 3600);
  } catch (e) { $('tfMsg').textContent = 'コードが うまく よめません。ぜんぶ コピーできているか みてね'; }
};

// メニュー
function openMenu() {
  if (mode !== 'play') return;
  mode = 'menu'; save();
  $('menu').classList.remove('hidden');
}
$('btnMenu').onclick = () => { initAudio(); sfx('tap'); openMenu(); };
function showPanel(id) { ['menu', 'notebook', 'settings', 'theaterList', 'quests', 'map', 'diary', 'dex', 'transfer'].forEach(p => $(p).classList.toggle('hidden', p !== id)); }
document.body.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  sfx('tap');
  const act = b.dataset.act;
  if (act === 'resume') { $('menu').classList.add('hidden'); mode = 'play'; }
  else if (act === 'back') showPanel('menu');
  else if (act === 'quests') { renderQuests(); showPanel('quests'); }
  else if (act === 'map') { showPanel('map'); openMap(); }
  else if (act === 'dex') { renderDex(); showPanel('dex'); }
  else if (act === 'diary') { renderDiary(); showPanel('diary'); }
  else if (act === 'notebook') { renderNotebook(); showPanel('notebook'); }
  else if (act === 'settings') { renderSettings(); showPanel('settings'); }
  else if (act === 'transfer') { openTransfer(); showPanel('transfer'); }
  else if (act === 'theater') { renderTheaterList(); showPanel('theaterList'); }
  else if (act === 'sleep') { $('menu').classList.add('hidden'); mode = 'play'; startSleep(); }
  else if (act === 'avatar') { $('menu').classList.add('hidden'); startCreator(true); }
  else if (act === 'save') { save(); $('menu').classList.add('hidden'); showTitle(); toast('ほぞん したよ！ また あそんでね 🐼', 2800); }
  else if (act === 'reset') { if (confirm('ほんとうに はじめから やりなおしますか？\n（いままでの きろくは きえます）')) { localStorage.removeItem(SAVE_KEY); S = freshState(); applySettings(); $('menu').classList.add('hidden'); startCreator(false); } }
});

function renderNotebook() {
  const box = $('nbList'); box.innerHTML = '';
  for (const id of ORDER) {
    const c = CHARS[id];
    const d = document.createElement('div'); d.className = 'nb';
    const lv = level(S.friend[id] || 0);
    d.innerHTML = `<img src="${portraits[id]}" alt=""><div><b>${c.name}</b><small>${c.kind}</small><small>${c.tag}</small></div><span class="h">${hearts(lv)}<br><small>${TIERS[lv]}</small></span>`;
    box.appendChild(d);
  }
}
function renderTheaterList() {
  const box = $('thList'); box.innerHTML = '';
  for (const sc of SCENES) {
    const b = document.createElement('button'); b.className = 'th';
    const isNew = !S.seen.includes(sc.id);
    b.innerHTML = `<span class="e">${sc.emoji}</span><div><b>${sc.title}</b>${isNew ? '<span class="new">NEW</span>' : ''}<small>${sc.desc}</small></div>`;
    b.onclick = () => playScene(sc);
    box.appendChild(b);
  }
}
function seg(id, cur, onPick) {
  const box = $(id);
  for (const b of box.children) {
    b.classList.toggle('on', b.dataset.v === String(cur));
    b.onclick = () => { onPick(b.dataset.v); for (const x of box.children) x.classList.toggle('on', x === b); sfx('tap'); };
  }
}
$('btnSoundTest').onclick = () => { initAudio(); setTimeout(() => { sfx('heart'); toast(isAudioRunning() ? '🔊 きこえたかな？ きこえない ときは マナーモードを オフにしてね' : '🔇 おとの じゅんびが まだ… もういちど タップしてね', 3600); }, 200); };
function renderSettings() {
  seg('setSize', S.settings.size, v => { S.settings.size = parseFloat(v); applySettings(); save(); });
  seg('setBgm', S.settings.bgm ? 1 : 0, v => { S.settings.bgm = v === '1'; applySettings(); save(); });
  seg('setVoice', S.settings.voice ? 1 : 0, v => { S.settings.voice = v === '1'; applySettings(); save(); if (S.settings.voice) speak('こんにちは、なの！', 1.7); });
  seg('setTime', S.settings.time, v => { S.settings.time = v; save(); });
  seg('setStats', S.settings.stats === false ? 0 : 1, v => { S.settings.stats = v === '1'; setAnalyticsEnabled(S.settings.stats); save(); });
  seg('setEvent', S.settings.event || 'auto', v => { S.settings.event = v; applyEvent(); save(); });
}
function applySettings() {
  document.documentElement.style.setProperty('--fs', S.settings.size);
  setAnalyticsEnabled(S.settings.stats !== false); setSound(S.settings.sound !== false); setBgm(S.settings.bgm); setVoice(S.settings.voice); applyEvent(); if ($('btnSound')) refreshSoundBtn();
}

// ---------- シアター ----------
let curScene = null;
function playScene(def) {
  track('theater');
  if (place === 'in') exitHouse();
  curScene = def;
  mode = 'theater';
  $('toast').classList.add('hidden');
  ['menu', 'theaterList', 'hud', 'chat'].forEach(i => $(i).classList.add('hidden'));
  world.group.visible = false;
  $('theaterUI').classList.remove('hidden'); $('thEnd').classList.add('hidden');
  $('subText').textContent = ''; $('subWho').textContent = '';
  $('subtitle').classList.add('off');
  theater.onSub = s => {
    const st = $('subtitle');
    if (!s) { st.classList.add('off'); return; }
    st.classList.remove('off');
    $('subWho').textContent = s[2] ? CHARS[s[2]].name : '';
    $('subText').textContent = s[3];
    if (s[2]) speak(s[3], CHARS[s[2]].voice);
  };
  theater.start(def);
  applySkyHour(def.hour);
  $('thPause').textContent = '⏸ とめる';
  if (!S.seen.includes(def.id)) S.seen.push(def.id);
  duck(true); save();
}
function applySkyHour(h) { appliedHour = -1; world.applyTime(h, scene, hemi, sun); }
function endTheater() {
  theater.stop(); curScene = null;
  world.group.visible = true;
  $('theaterUI').classList.add('hidden');
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  appliedHour = -1; duck(false);
  mode = 'menu'; renderTheaterList(); showPanel('theaterList'); $('menu').classList.remove('hidden');
}
$('thSkip').onclick = endTheater;
$('thBack').onclick = endTheater;
$('thAgain').onclick = () => playScene(curScene);
$('thPause').onclick = () => { theater.paused = !theater.paused; $('thPause').textContent = theater.paused ? '▶ つづける' : '⏸ とめる'; if (theater.paused && 'speechSynthesis' in window) speechSynthesis.cancel(); };

// ---------- メインループ ----------
let last = performance.now();
let saveTimer = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  clock += dt;
  if (mode === 'creator' || mode === 'shop') {
    prevAvatar.root.rotation.y = Math.sin(clock * 0.9) * 0.6;
    if (prevAvatar.cheer > 0) prevAvatar.cheer -= dt;
    animate(prevAvatar, dt, { t: clock, walk: false, wave: mode === 'creator', cheer: prevAvatar.cheer > 0, hop: prevAvatar.cheer > 0 });
    updateFx(dt);
    updateCamera(dt);
    renderer.render(prevScene, camera);
  } else if (mode === 'theater') {
    theater.update(dt);
    if (theater.done && $('thEnd').classList.contains('hidden')) $('thEnd').classList.remove('hidden');
    updateFx(dt);
    renderer.render(scene, camera);
  } else {
    if (S) {
      const h = gameHour();
      applySky(h);
      if (Math.floor(clock * 2) !== Math.floor((clock - dt) * 2)) $('clock').textContent = clockText(h) + (EVENT_NAMES[currentEvent()] ? '　' + EVENT_NAMES[currentEvent()] : '');
    }
    world.update(dt, clock);
    if (place === 'in') interior.update(clock);
    if (player && (mode === 'play' || mode === 'chat' || mode === 'fish')) {
      if (mode === 'play') updatePlayer(dt); else if (mode === 'fish') updateFishing(dt); else animate(player, dt, { t: clock, walk: false, wave: false });
      S.playSec += dt;
      saveTimer += dt;
      if (saveTimer > 6) { saveTimer = 0; save(); }
    } else if (player && mode === 'menu') animate(player, dt, { t: clock });
    updateNpcs(dt);
    if (rot.l) yaw -= dt * 1.8;
    if (rot.r) yaw += dt * 1.8;
    if (mode === 'play' && !sleeping) { idle += dt; if (idle > ((gameHour() >= 20 || gameHour() < 5) ? 15 : 30)) startSleep(); }
    if (mode !== 'play') $('btnFish').classList.add('hidden');
    if (mode === 'play') $('btnTalk').classList.toggle('hidden', !nearNpc || sleeping);
    {
      let ent = null;
      if (mode === 'play' && !sleeping && player) {
        const pp = player.root.position;
        if (place === 'out') {
          if (Math.hypot(pp.x - world.door.x, pp.z - world.door.z) < 4) ent = 'house';
          else if (Math.hypot(pp.x + 9, pp.z - 12.2) < 5.5) ent = 'shop';
        } else if (pp.z > interior.exit.z - 2.5 && Math.abs(pp.x - OFF) < 2.6) ent = 'out';
      }
      enterKind = ent;
      $('btnEnter').classList.toggle('hidden', !ent);
      if (ent) $('btnEnter').textContent = ent === 'shop' ? '🛍 おみせに はいる' : ent === 'house' ? '🏠 おうちに はいる' : '🚪 そとに でる';
    }
    if (mode === 'play' && nearNpc) $('btnTalk').textContent = `💬 ${CHARS[nearNpc].name}と はなす`;
    updateFx(dt);
    updateCamera(dt);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}

// 中断しても再開できるよう、離れる時にも保存
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
window.addEventListener('pagehide', save);
window.addEventListener('beforeunload', save);

// 起動
S = loadSave() || freshState();
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* 非対応 */ }
if (S.created) { applySettings(); buildPlayer(); } else { applySettings(); }
initMarks();
if (!analyticsAvailable) { for (const el of document.querySelectorAll('.stats-only')) el.classList.add('hidden'); }
setAnalyticsEnabled(S.settings.stats !== false);
initAnalytics();
showTitle();
$('btnContinue').classList.toggle('hidden', !loadSave());
if (!player) { S.avatar = { ...DEFAULT_AVATAR }; player = makeAvatar(S.avatar); player.root.position.set(0, 0, 6); world.group.add(player.root); player.root.visible = false; }
requestAnimationFrame(frame);

// テスト用フック
window.__poko = { isAudioRunning, portraits, openShop, closeShop, startSleep, wakeUp, get sleeping() { return sleeping; }, get mode() { return mode; }, get S() { return S; }, npcs, player: () => player, openChat, playScene, SCENES, theater, camera, renderer, world };
