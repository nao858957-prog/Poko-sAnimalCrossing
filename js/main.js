import * as THREE from 'three';
import { makeAnimal, makeAvatar, animate, faceDir, makeLabel, spawnFx, updateFx, AVATAR_OPTS } from './models.js';
import { buildWorld, buildInterior, ISLAND_R, HOMES } from './world.js';
import { CHARS, ORDER, openLine, reply, level, chipsFor, story, giftLine, lvupLine, CHIPS, timePart } from './dialogue.js';
import { Theater, SCENES } from './theater.js';
import { initAudio, setBgm, setVoice, sfx, speak, duck } from './audio.js';
import { FOODS, CLOTHES } from './shop.js';

const $ = id => document.getElementById(id);
const SAVE_KEY = 'poko-island-save-v1';
const DEFAULT_AVATAR = { name: '', skin: AVATAR_OPTS.skin[1], hair: 'short', hairColor: AVATAR_OPTS.hairColor[1], outfit: AVATAR_OPTS.outfit[0] };

// ---------- セーブ ----------
let S = null;
function freshState() {
  return { v: 1, avatar: { ...DEFAULT_AVATAR }, pos: { x: 0, z: 6, ry: Math.PI }, friend: {}, flowers: 0, seen: [], logs: {}, storyIdx: {}, firstDone: {}, settings: { size: 1, bgm: true, voice: false, time: 'auto', event: 'auto' }, playSec: 0, created: false, owned: [] };
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
scene.fog = new THREE.Fog('#9bdcff', 55, 130);
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
    for (const id of joined) S.friend[id] = Math.min(60, (S.friend[id] || 0) + 2);
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

// ---------- おみせ ----------
let shopTab = 'food', shopBusy = false;
function refreshPlayerModel() {
  const p = player.root.position.clone(), ry = player.root.rotation.y;
  world.group.remove(player.root);
  player = makeAvatar(S.avatar);
  player.root.position.copy(p); player.root.rotation.y = ry;
  world.group.add(player.root);
}
function openShop() {
  if (mode !== 'play') return;
  if (sleeping) wakeUp();
  mode = 'shop'; shopTab = 'food';
  moveTarget = null; marker.visible = false; talkOnArrive = null;
  $('hud').classList.add('hidden'); $('btnTalk').classList.add('hidden');
  $('shop').classList.remove('hidden');
  $('shopMsg').textContent = 'いらっしゃい！ おはなで おかいもの できるよ 🌼';
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
      const b = document.createElement('button'); b.textContent = 'たべる'; if (!can) b.classList.add('dis');
      b.onclick = () => eatFood(f);
      d.appendChild(b); box.appendChild(d);
    }
  } else {
    for (const c of CLOTHES) {
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
function eatFood(f) {
  if (S.flowers < f.price) { $('shopMsg').textContent = 'おはなが たりないよ… 🌼を あつめてきてね'; sfx('tap'); return; }
  S.flowers -= f.price; sfx('pick');
  // いっしょに たべる ともだち
  const pals = ORDER.filter(i => i !== 'haru');
  const pal = pals[Math.floor(Math.random() * pals.length)];
  S.friend[pal] = Math.min(60, (S.friend[pal] || 0) + 2);
  $('shopMsg').textContent = `${f.emoji} ${f.line}　${CHARS[pal].name}も ひとくち！ ♥`;
  if (prevAvatar) { prevAvatar.cheer = 1.6; for (let i = 0; i < 3; i++) { tmp.set((Math.random() - 0.5) * 1.6, 3.4 + Math.random(), 0.5); spawnFx(prevScene, 'heart', tmp, 0.7); } }
  speak(f.line, 1.3);
  save(); renderShop();
}
function clothesAction(c) {
  const key = SLOT_KEY[c.slot];
  if (!S.owned.includes(c.id)) {
    if (S.flowers < c.price) { $('shopMsg').textContent = 'おはなが たりないよ… 🌼を あつめてきてね'; sfx('tap'); return; }
    S.flowers -= c.price; S.owned.push(c.id); S.avatar[key] = c.id; sfx('heart');
    $('shopMsg').textContent = `${c.emoji} ${c.name}を かったよ！ とっても にあってる！`;
  } else if (S.avatar[key] === c.id) { S.avatar[key] = null; sfx('tap'); $('shopMsg').textContent = `${c.name}を ぬいだよ`; }
  else { S.avatar[key] = c.id; sfx('pick'); $('shopMsg').textContent = `${c.emoji} ${c.name}を きたよ！`; }
  if (prevAvatar) prevAvatar.cheer = 1.2;
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
  let moving = false, speed = 5.2;
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
  // おはな
  if (place === 'out') for (const f of world.flowers) {
    if (f.mesh.visible && Math.hypot(pos.x - f.x, pos.z - f.z) < 1.1) {
      f.mesh.visible = false; f.back = 50;
      S.flowers++; $('flowerCount').textContent = '🌼 ' + S.flowers;
      sfx('pick');
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
        const a = Math.random() * 6.28, r = Math.random() * (place === 'in' && HOUSE_NPC.includes(id) ? 1.2 : id === 'sei' ? 1.5 : 3.5);
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
    if (mode === 'shop') { camera.position.set(0, 2.4, camera.aspect < 0.8 ? 13 : 9.5); camera.lookAt(0, 1.2, 0); applyViewShift(dt); return; }
    if (mode === 'creator') {
      const land = $('creator').getBoundingClientRect().width < innerWidth * 0.9;
      camera.position.set(0, 2.4, camera.aspect < 0.8 ? 11.5 : 9); camera.lookAt(0, camera.aspect < 0.8 && !land ? -0.9 : 1.2, 0); applyViewShift(dt); return;
    }
    titleAngle += dt * 0.12;
    const cx = Math.sin(titleAngle) * 26, cz = -2 + Math.cos(titleAngle) * 26;
    camera.position.set(cx, 17, cz); camera.lookAt(0, 0.5, -6); return;
  }
  const pp = player.root.position;
  let desired, look;
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
  for (const off of [Math.PI / 2, -Math.PI / 2, Math.PI / 2 + 0.7, -Math.PI / 2 - 0.7, Math.PI / 2 - 0.7, -Math.PI / 2 + 0.7]) {
    const ang = base + off;
    let score = Math.abs(off) > 1.7 || Math.abs(off) < 1.4 ? 0.5 : 0;
    for (let t = 0.15; t <= 1; t += 0.12) {
      const x = mx + Math.sin(ang) * 9 * t, z = mz + Math.cos(ang) * 9 * t;
      for (const o of obs) if (o.r > 0.25 && Math.hypot(o.x - x, o.z - z) < o.r + 1.3) score += 1;
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
  for (const [key, label] of chipsFor(id)) {
    const b = document.createElement('button');
    b.textContent = label;
    b.onclick = () => send(label);
    box.appendChild(b);
  }
}
function openChat(id) {
  if (mode !== 'play') return;
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
  renderChips(id);
  $('chatGift').disabled = S.flowers <= 0;
  $('chat').classList.remove('hidden');
  save();
}
function updateHearts(id) { $('chatHearts').textContent = hearts(level(S.friend[id] || 0)); }
function closeChat() {
  if (mode !== 'chat') return;
  mode = 'play'; chatNpc = null;
  $('chat').classList.add('hidden');
  $('hud').classList.remove('hidden');
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  document.activeElement && document.activeElement.blur && document.activeElement.blur();
  save();
}
function gain(id, n) {
  const before = level(S.friend[id] || 0);
  S.friend[id] = Math.min(60, (S.friend[id] || 0) + n);
  const after = level(S.friend[id]);
  updateHearts(id);
  if (after > before) {
    sfx('heart');
    const ctx = ctxFor(id);
    setTimeout(() => {
      if (chatNpc !== id) return;
      addMsg(id, 'sys', `💕 ${CHARS[id].name}との なかよしレベルが ${after} に あがったよ！`);
      const t = lvupLine(id, ctx);
      addMsg(id, 'npc', t); logPush(id, 'npc', t); speak(t, CHARS[id].voice);
    }, 1500);
    for (let i = 0; i < 5; i++) setTimeout(() => { tmp.copy(npcs[id].root.position); tmp.y += 3; tmp.x += (Math.random() - 0.5) * 1.5; spawnFx(world.group, 'heart', tmp, 0.9); }, i * 150);
  }
}
let waiting = false;
function send(text) {
  text = (text || '').trim();
  const id = chatNpc;
  if (!text || !id || waiting) return;
  waiting = true;
  $('chatInput').value = '';
  addMsg(id, 'me', text); logPush(id, 'me', text);
  sfx('send');
  const typing = addMsg(id, 'npc', '…', 'typing');
  const ctx = ctxFor(id);
  let r = reply(id, text, ctx);
  if (r.key === 'story' || r.key === 'story-locked') {
    const rr = story(id, ctx);
    r = rr;
    if (rr.storyDone) S.storyIdx[id] = (S.storyIdx[id] || 0) + 1;
  }
  setTimeout(() => {
    typing.remove();
    if (chatNpc !== id) { waiting = false; return; }
    addMsg(id, 'npc', r.text); logPush(id, 'npc', r.text);
    speak(r.text, CHARS[id].voice); sfx('recv');
    npcs[id].hop = 0.7;
    gain(id, r.key === 'fb' ? 1 : 2);
    if (Math.random() < 0.4) renderChips(id);
    waiting = false;
    save();
  }, 650 + Math.min(900, r.text.length * 12));
}
$('chatSend').onclick = () => send($('chatInput').value);
$('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) send($('chatInput').value); });
$('chatClose').onclick = closeChat;
$('chatGift').onclick = () => {
  const id = chatNpc;
  if (!id || S.flowers <= 0) return;
  S.flowers--; $('flowerCount').textContent = '🌼 ' + S.flowers;
  $('chatGift').disabled = S.flowers <= 0;
  addMsg(id, 'sys', `🌼 ${CHARS[id].name}に おはなを あげたよ！`);
  sfx('pick');
  const t = giftLine(id, ctxFor(id));
  setTimeout(() => { addMsg(id, 'npc', t); logPush(id, 'npc', t); speak(t, CHARS[id].voice); sfx('recv'); npcs[id].hop = 1.2; gain(id, 5); save(); }, 700);
};
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
  yaw = 0; idle = 0; sleeping = false; $('btnWake').classList.add('hidden');
  save();
}
function showTitle() {
  if (place === 'in' && player) exitHouse();
  mode = 'title';
  ['hud', 'menu', 'creator', 'chat', 'notebook', 'settings', 'theaterList', 'theaterUI'].forEach(i => $(i).classList.add('hidden'));
  $('title').classList.remove('hidden');
  const has = !!loadSave();
  $('btnContinue').classList.toggle('hidden', !has);
  if (!S) S = freshState();
}
$('btnContinue').onclick = () => {
  const s = loadSave();
  if (!s) return;
  S = s; applySettings(); buildPlayer(); initAudio(); enterPlay();
  toast(`おかえりなさい、${S.avatar.name}さん！`, 2400);
};
$('btnNew').onclick = () => {
  if (loadSave() && !confirm('いまの ぼうけんを けして、はじめからに しますか？')) return;
  S = freshState(); applySettings(); initAudio();
  startCreator(false);
};

// メニュー
function openMenu() {
  if (mode !== 'play') return;
  mode = 'menu'; save();
  $('menu').classList.remove('hidden');
}
$('btnMenu').onclick = () => { initAudio(); sfx('tap'); openMenu(); };
function showPanel(id) { ['menu', 'notebook', 'settings', 'theaterList'].forEach(p => $(p).classList.toggle('hidden', p !== id)); }
document.body.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  sfx('tap');
  const act = b.dataset.act;
  if (act === 'resume') { $('menu').classList.add('hidden'); mode = 'play'; }
  else if (act === 'back') showPanel('menu');
  else if (act === 'notebook') { renderNotebook(); showPanel('notebook'); }
  else if (act === 'settings') { renderSettings(); showPanel('settings'); }
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
    d.innerHTML = `<img src="${portraits[id]}" alt=""><div><b>${c.name}</b><small>${c.kind}</small><small>${c.tag}</small></div><span class="h">${hearts(lv)}</span>`;
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
function renderSettings() {
  seg('setSize', S.settings.size, v => { S.settings.size = parseFloat(v); applySettings(); save(); });
  seg('setBgm', S.settings.bgm ? 1 : 0, v => { S.settings.bgm = v === '1'; applySettings(); save(); });
  seg('setVoice', S.settings.voice ? 1 : 0, v => { S.settings.voice = v === '1'; applySettings(); save(); if (S.settings.voice) speak('こんにちは、なの！', 1.7); });
  seg('setTime', S.settings.time, v => { S.settings.time = v; save(); });
  seg('setEvent', S.settings.event || 'auto', v => { S.settings.event = v; applyEvent(); save(); });
}
function applySettings() {
  document.documentElement.style.setProperty('--fs', S.settings.size);
  setBgm(S.settings.bgm); setVoice(S.settings.voice); applyEvent();
}

// ---------- シアター ----------
let curScene = null;
function playScene(def) {
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
    if (player && (mode === 'play' || mode === 'chat')) {
      if (mode === 'play') updatePlayer(dt); else animate(player, dt, { t: clock, walk: false, wave: false });
      S.playSec += dt;
      saveTimer += dt;
      if (saveTimer > 6) { saveTimer = 0; save(); }
    } else if (player && mode === 'menu') animate(player, dt, { t: clock });
    updateNpcs(dt);
    if (rot.l) yaw -= dt * 1.8;
    if (rot.r) yaw += dt * 1.8;
    if (mode === 'play' && !sleeping) { idle += dt; if (idle > ((gameHour() >= 20 || gameHour() < 5) ? 15 : 30)) startSleep(); }
    if (mode === 'play') $('btnTalk').classList.toggle('hidden', !nearNpc || sleeping);
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
if (S.created) { applySettings(); buildPlayer(); } else { applySettings(); }
showTitle();
$('btnContinue').classList.toggle('hidden', !loadSave());
if (!player) { S.avatar = { ...DEFAULT_AVATAR }; player = makeAvatar(S.avatar); player.root.position.set(0, 0, 6); world.group.add(player.root); player.root.visible = false; }
requestAnimationFrame(frame);

// テスト用フック
window.__poko = { portraits, openShop, closeShop, startSleep, wakeUp, get sleeping() { return sleeping; }, get mode() { return mode; }, get S() { return S; }, npcs, player: () => player, openChat, playScene, SCENES, theater, camera, renderer, world };
