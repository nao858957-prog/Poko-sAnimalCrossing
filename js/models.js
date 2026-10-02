// three.js だけで作るどうぶつ・アバターのモデルとアニメーション
import * as THREE from 'three';

const mats = new Map();
export function mat(color, extra) {
  const key = color + (extra ? JSON.stringify(extra) : '');
  let m = mats.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, ...(extra || {}) });
    mats.set(key, m);
  }
  return m;
}
const sphGeo = new THREE.SphereGeometry(1, 20, 14);
export function sph(r, color, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(sphGeo, mat(color));
  m.scale.set(r * sx, r * sy, r * sz);
  return m;
}
export function add(parent, o, x = 0, y = 0, z = 0) {
  o.position.set(x, y, z);
  parent.add(o);
  return o;
}
const BLACK = '#26262e';
const PINK = '#ffb0b8';

// 頭の球面上の z を求める
const surfZ = (hr, x, y) => 0.95 * hr * Math.sqrt(Math.max(0, 1 - (x / hr) ** 2 - (y / (0.9 * hr)) ** 2));

function shadowBlob(P, r) {
  const g = new THREE.CircleGeometry(r, 20);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
  m.position.y = 0.03;
  P.root.add(m);
  P.shadow = m;
}

function chibi(o) {
  const s = o.scale || 1;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const P = { root, body, eyes: [], scale: s, phase: Math.random() * 6 };
  const legH = o.legH ?? 0.28, br = o.br ?? 0.5, bsy = o.bsy ?? 0.95;
  const cy = legH + br * bsy * 0.9;
  P.cy = cy; P.br = br; P.legH = legH;
  for (const sd of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(sd * br * 0.45, legH + 0.02, 0.03);
    body.add(leg);
    add(leg, sph(o.legR ?? 0.2, o.leg ?? o.body, 1, 1.1, 1.2), 0, -legH * 0.6, 0.06);
    P[sd < 0 ? 'legL' : 'legR'] = leg;
  }
  add(body, sph(br, o.body, 1, bsy, 0.95), 0, cy, 0);
  if (o.belly) add(body, sph(br * 0.78, o.belly, 1, 0.88, 0.5), 0, cy - 0.02, br * 0.55);
  for (const sd of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(sd * br * 0.95, cy + br * 0.28, 0.1);
    body.add(arm);
    add(arm, sph(o.armR ?? 0.17, o.arm ?? o.body, 0.9, 1.5, 0.9), 0, -0.2, 0);
    arm.rotation.z = sd * 0.3;
    P[sd < 0 ? 'armL' : 'armR'] = arm;
  }
  P.armBase = 0.3;
  const hy = cy + br * bsy + o.hr * 0.55;
  const head = new THREE.Group();
  head.position.set(0, hy, 0.03);
  body.add(head);
  add(head, sph(o.hr, o.headC ?? o.body, 1, 0.9, 0.95));
  P.head = head; P.hr = o.hr; P.headY = hy;
  root.scale.setScalar(s);
  shadowBlob(P, br * 1.25);
  return P;
}

function eyes(P, { y, sp, r = 0.06, color = BLACK, hi = true, sy = 1.15 }) {
  const head = P.head, hr = P.hr;
  for (const sd of [-1, 1]) {
    const x = sd * sp;
    const z = surfZ(hr, x, y) - r * 0.2;
    const e = new THREE.Group();
    e.position.set(x, y, z);
    head.add(e);
    add(e, sph(r, color, 1, sy, 0.6));
    if (hi) add(e, sph(r * 0.38, '#ffffff'), r * 0.3, r * 0.4, r * 0.45);
    P.eyes.push(e);
  }
}
function cheeks(P, y = -0.2, sp = 0.55, color = PINK, r = 0.1) {
  for (const sd of [-1, 1]) {
    const x = sd * sp * P.hr;
    const c = sph(r, color, 1.2, 0.7, 0.4);
    add(P.head, c, x, y * P.hr, surfZ(P.hr, x, y * P.hr) - 0.02);
  }
}
function nose(P, color, y = -0.1, r = 0.06) {
  add(P.head, sph(r, color, 1.2, 0.8, 0.8), 0, y * P.hr, surfZ(P.hr, 0, y * P.hr) + 0.01);
}
function whiskers(P, color = '#e6e6f0', y = -0.16, len = 0.34) {
  const g = new THREE.CylinderGeometry(0.008, 0.008, len, 4);
  for (const sd of [-1, 1]) for (const k of [-1, 0, 1]) {
    const w = new THREE.Mesh(g, mat(color));
    w.rotation.z = Math.PI / 2 + k * 0.18 * sd;
    w.position.set(sd * (P.hr * 0.62 + len * 0.45), (y + k * 0.05) * P.hr, surfZ(P.hr, sd * P.hr * 0.6, y * P.hr) - 0.02);
    w.rotation.y = sd * 0.35;
    P.head.add(w);
  }
}
function brows(P, y, sp, tilt, color = '#3b3b44', len = 0.16) {
  for (const sd of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(len, 0.03, 0.03), mat(color));
    const x = sd * sp;
    b.position.set(x, y, surfZ(P.hr, x, y) + 0.005);
    b.rotation.z = -sd * tilt;
    P.head.add(b);
    (P.brows = P.brows || []).push(b);
  }
}
function tailChain(P, n, r0, r1, colors, curve) {
  const tail = new THREE.Group();
  tail.position.set(0, P.cy * 0.8, -P.br * 0.85);
  P.body.add(tail);
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1 || 1);
    const r = r0 + (r1 - r0) * k;
    const c = Array.isArray(colors) ? colors[i % colors.length] : colors;
    add(tail, sph(r, c), 0, curve.y(k), -curve.z(k));
  }
  P.tail = tail;
  return tail;
}
function ringNeck(P, color, r = 0.4, tube = 0.07, y = -0.55) {
  const t = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 20), mat(color));
  t.rotation.x = Math.PI / 2;
  t.position.set(0, P.cy + P.br * 0.8, 0.03);
  P.body.add(t);
  return t;
}

// ---- ぱんだ ----
function panda(o) {
  const P = chibi({ body: '#fbfbf8', belly: '#ffffff', leg: '#2a2a2f', arm: '#2a2a2f', br: 0.5, hr: o.hr, legH: 0.26, scale: o.scale });
  const hr = P.hr;
  for (const sd of [-1, 1]) {
    add(P.head, sph(0.19, '#2a2a2f', 1, 1, 0.6), sd * hr * 0.68, hr * 0.78, -0.03);
    const x = sd * hr * 0.36, y = -0.02 * hr;
    const patch = sph(0.15, '#2a2a2f', 1, 1.3, 0.5);
    add(P.head, patch, x, y, surfZ(hr, x, y) - 0.03);
    patch.rotation.z = sd * 0.5;
  }
  eyes(P, { y: -0.02 * hr, sp: hr * 0.36, r: 0.05, color: '#4a3b3b' });
  nose(P, '#2a2a2f', -0.2, 0.06);
  cheeks(P, -0.3, 0.62, '#ffb0b8', 0.09);
  if (o.mei) {
    brows(P, 0.14 * hr, hr * 0.36, -0.25, '#2a2a2f', 0.15);
    // 白いデイジー (参考画像: 耳のところに白い花)
    const fl = new THREE.Group();
    fl.position.set(hr * 0.68, hr * 0.84, 0.1);
    P.head.add(fl);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      add(fl, sph(0.06, '#ffffff', 1, 1.5, 0.5), Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0).rotation.z = a - Math.PI / 2;
    }
    add(fl, sph(0.05, '#ffcf3a', 1, 1, 0.8), 0, 0, 0.02);
  }
  P.tail = null;
  return P;
}

// ---- ゆきひょう (セイママ) ----
function snowLeopard() {
  const P = chibi({ body: '#d8cfbf', belly: '#f6f1e6', leg: '#d2c9b8', arm: '#d2c9b8', br: 0.58, hr: 0.6, legH: 0.3, scale: 1.55 });
  const hr = P.hr;
  const spot = '#4a4a52';
  for (const sd of [-1, 1]) {
    add(P.head, sph(0.15, '#cfc6b6', 1, 1, 0.6), sd * hr * 0.62, hr * 0.74, -0.03);
    add(P.head, sph(0.08, '#4a4a52', 1, 1, 0.5), sd * hr * 0.62, hr * 0.74, -0.0);
  }
  eyes(P, { y: 0.0, sp: hr * 0.38, r: 0.062, color: '#c9b36a' });
  for (const e of P.eyes) add(e, sph(0.032, '#26262e', 0.8, 1.2, 0.6), 0, 0, 0.03);
  add(P.head, sph(0.2, '#f6f1e6', 1.2, 0.8, 0.8), 0, -0.2 * hr, surfZ(hr, 0, -0.2 * hr) - 0.05);
  nose(P, '#e8a0a8', -0.12, 0.05);
  whiskers(P, '#ffffff', -0.2, 0.3);
  for (const [x, y] of [[-0.12, 0.45], [0.05, 0.55], [0.16, 0.42], [-0.28, 0.32], [0.3, 0.3], [-0.38, 0.1], [0.4, 0.05]]) {
    add(P.head, sph(0.045, spot, 1.3, 0.8, 0.4), x * hr * 1.4, y * hr, surfZ(hr, x * hr * 1.4, y * hr) - 0.01);
  }
  // おおきなロゼット (輪っかの斑点)
  const rosette = (par, x, y, z, r) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.34, 6, 14), mat(spot));
    ring.position.set(x, y, z);
    par.add(ring);
  };
  for (const sd of [-1, 1]) {
    for (const [y, z] of [[0.3, 0.1], [-0.1, -0.15], [-0.35, 0.15]]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.034, 6, 14), mat(spot));
      ring.position.set(sd * (P.br * 0.93), P.cy + y, z); ring.rotation.y = Math.PI / 2;
      P.body.add(ring);
    }
    for (const [x, y] of [[0.22, 0.2], [0.18, -0.2]]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.034, 6, 14), mat(spot));
      ring.position.set(sd * x, P.cy + y, -P.br * 0.9); ring.rotation.y = Math.PI;
      P.body.add(ring);
    }
  }
  // シンプルな青いビブエプロン
  const apron = '#4f7fc4';
  const bib = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.05), mat(apron));
  bib.position.set(0, P.cy + 0.12, P.br * 0.9);
  bib.rotation.x = -0.12;
  P.body.add(bib);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.64, 0.4, 16, 1, true, -Math.PI * 0.42, Math.PI * 0.84), new THREE.MeshLambertMaterial({ color: apron, side: THREE.DoubleSide }));
  skirt.position.set(0, P.cy - 0.28, 0.02);
  P.body.add(skirt);
  for (const sd of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.04), mat(apron));
    strap.position.set(sd * 0.23, P.cy + 0.55, P.br * 0.62);
    strap.rotation.x = -0.5;
    P.body.add(strap);
  }
  // 太くて長いしっぽ (黒い輪)
  tailChain(P, 8, 0.15, 0.2, ['#d8cfbf', '#d8cfbf', '#4a4a52'], { y: k => -0.1 + Math.sin(k * 2.2) * 0.25 + k * 0.25, z: k => k * 0.95 });
  return P;
}

// ---- レッサーパンダ (リン) ----
function redPanda() {
  const P = chibi({ body: '#a8461f', belly: '#7a3018', headC: '#d27a3e', leg: '#4a2218', arm: '#4a2218', br: 0.5, hr: 0.58, legH: 0.28, scale: 1.35 });
  const hr = P.hr;
  for (const sd of [-1, 1]) {
    add(P.head, sph(0.2, '#4a2218', 1, 1.15, 0.5), sd * hr * 0.7, hr * 0.78, -0.02).rotation.z = -sd * 0.35;
    add(P.head, sph(0.12, '#f4ead8', 1, 1.1, 0.4), sd * hr * 0.7 + sd * 0.0, hr * 0.78, 0.04).rotation.z = -sd * 0.35;
    const x = sd * hr * 0.58, y = -0.22 * hr;
    add(P.head, sph(0.16, '#fff5e8', 1.1, 0.9, 0.5), x, y, surfZ(hr, x, y) - 0.04);
    add(P.head, sph(0.05, '#a3401f', 0.6, 1.6, 0.3), sd * hr * 0.4, -0.1 * hr, surfZ(hr, sd * hr * 0.4, -0.1 * hr) - 0.01);
  }
  add(P.head, sph(0.18, '#fff5e8', 1.2, 0.8, 0.7), 0, -0.2 * hr, surfZ(hr, 0, -0.2 * hr) - 0.04);
  eyes(P, { y: 0.0, sp: hr * 0.34, r: 0.055 });
  nose(P, '#26262e', -0.14, 0.05);
  tailChain(P, 8, 0.2, 0.22, ['#b8552b', '#e3bd8e'], { y: k => -0.1 + k * 0.3, z: k => k * 1.0 });
  ringNeck(P, '#ffd34d', 0.4, 0.07);
  return P;
}

// ---- ナキウサギ (パー) ----
function pika() {
  const P = chibi({ body: '#b99c72', belly: '#d9c4a0', leg: '#a88c64', arm: '#a88c64', br: 0.48, hr: 0.58, legH: 0.22, scale: 0.85 });
  const hr = P.hr;
  for (const sd of [-1, 1]) {
    add(P.head, sph(0.22, '#a88c64', 1, 1, 0.45), sd * hr * 0.66, hr * 0.74, -0.02);
    add(P.head, sph(0.13, '#5a4638', 1, 1, 0.4), sd * hr * 0.66, hr * 0.74, 0.03);
  }
  eyes(P, { y: 0.0, sp: hr * 0.4, r: 0.065 });
  nose(P, '#6b4a3a', -0.16, 0.04);
  cheeks(P, -0.3, 0.62, '#f2b5a8', 0.08);
  ringNeck(P, '#7cc576', 0.36, 0.06);
  return P;
}

// ---- フェネック (クー) ----
function fennec() {
  const P = chibi({ body: '#f0d8b4', belly: '#fff4e0', leg: '#e4c9a0', arm: '#e4c9a0', br: 0.42, hr: 0.55, legH: 0.24, scale: 0.9 });
  const hr = P.hr;
  for (const sd of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(sd * hr * 0.55, hr * 0.7, -0.02);
    P.head.add(ear);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.85, 14), mat('#f0d8b4'));
    cone.position.y = 0.38;
    ear.add(cone);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.65, 12), mat('#f4b6b0'));
    inner.position.set(0, 0.34, 0.07);
    ear.add(inner);
    ear.rotation.z = -sd * 0.38;
    (P.ears = P.ears || []).push(ear);
  }
  eyes(P, { y: 0.0, sp: hr * 0.38, r: 0.085 });
  brows(P, 0.2 * hr, hr * 0.4, 0.45, '#6b4a3a', 0.12);
  nose(P, '#26262e', -0.18, 0.04);
  cheeks(P, -0.3, 0.62, '#ffb0b0', 0.08);
  tailChain(P, 6, 0.14, 0.2, ['#f0d8b4', '#f0d8b4', '#f0d8b4', '#f2dcb2', '#26262e', '#26262e'], { y: k => -0.15 + k * 0.1, z: k => k * 0.75 });
  return P;
}

// ---- エナガ (ハル) ----
function longTailedTit() {
  const P = chibi({ body: '#fdfaf6', belly: '#ffffff', leg: '#26262e', arm: '#3b3b45', br: 0.36, hr: 0.38, legH: 0.14, legR: 0.045, armR: 0.13, scale: 0.9 });
  const hr = P.hr;
  add(P.body, sph(0.3, '#e8a99f', 1.1, 0.6, 0.9), 0, P.cy + 0.18, -0.15);
  for (const sd of [-1, 1]) {
    const x = sd * hr * 0.5, y = hr * 0.42;
    const st = sph(0.17, '#26262e', 1.1, 0.34, 0.5);
    add(P.head, st, x, y, surfZ(hr, x, y) - 0.02);
    st.rotation.z = -sd * 0.35;
  }
  eyes(P, { y: 0.02, sp: hr * 0.62, r: 0.045, hi: true });
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 8), mat('#26262e'));
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, -0.05 * hr, surfZ(hr, 0, -0.05 * hr) + 0.04);
  P.head.add(beak);
  cheeks(P, -0.25, 0.7, '#ffb8b0', 0.06);
  const tail = new THREE.Group();
  tail.position.set(0, P.cy * 0.85, -P.br * 0.7);
  P.body.add(tail);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 1.0, 8), mat('#2e2e38'));
  t.rotation.x = Math.PI / 2 + 0.25;
  t.position.set(0, 0.12, -0.5);
  tail.add(t);
  P.tail = tail;
  P.bird = true;
  return P;
}

// ---- くろねこ (ナミ / クロ) ----
function cat(o) {
  const P = chibi({ body: '#35353f', belly: o.baby ? '#3f3f4b' : null, leg: '#2c2c35', arm: '#2c2c35', br: o.br, hr: o.hr, legH: 0.26, scale: o.scale });
  const hr = P.hr;
  for (const sd of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.34, 4), mat('#35353f'));
    c.position.set(sd * hr * 0.58, hr * 0.78, -0.02);
    c.rotation.z = -sd * 0.35;
    c.rotation.y = Math.PI / 4;
    P.head.add(c);
    const i = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 4), mat('#f0a0b0'));
    i.position.set(sd * hr * 0.58, hr * 0.74, 0.05);
    i.rotation.z = -sd * 0.35;
    i.rotation.y = Math.PI / 4;
    P.head.add(i);
  }
  const er = o.baby ? 0.1 : 0.09;
  eyes(P, { y: -0.02 * hr, sp: hr * 0.38, r: er, color: '#d6e86a', sy: o.baby ? 1.1 : 0.9 });
  for (const e of P.eyes) add(e, sph(er * 0.45, '#1a1a22', 0.55, 1.1, 0.5), 0, 0, er * 0.35);
  nose(P, '#f0a0b0', -0.2, 0.04);
  whiskers(P);
  cheeks(P, -0.3, 0.64, '#ff9aa8', 0.08);
  tailChain(P, 7, 0.1, 0.1, '#35353f', { y: k => 0.0 + Math.sin(k * 2.0) * 0.35 + k * 0.5, z: k => 0.15 + Math.sin(k * 1.8) * 0.45 });
  if (o.baby) {
    const f = new THREE.Group();
    f.position.set(hr * 0.42, hr * 0.92, hr * 0.28);
    P.head.add(f);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      add(f, sph(0.085, '#ffffff', 1, 1, 0.6), Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0);
    }
    add(f, sph(0.05, '#ffd84d', 1, 1, 0.8), 0, 0, 0.03);
  } else {
    ringNeck(P, '#e8455a', 0.42, 0.05);
    add(P.body, sph(0.07, '#ffd84d'), 0, P.cy + P.br * 0.8 - 0.05, P.br * 0.75 + 0.1);
  }
  return P;
}

export const SPECIES = {
  poko: () => panda({ hr: 0.6, scale: 0.95 }),
  mei: () => panda({ hr: 0.58, scale: 1.12, mei: true }),
  sei: snowLeopard,
  rin: redPanda,
  pa: pika,
  ku: fennec,
  haru: longTailedTit,
  nami: () => cat({ baby: true, br: 0.4, hr: 0.58, scale: 0.9 }),
  kuro: () => cat({ baby: false, br: 0.55, hr: 0.56, scale: 1.45 }),
};
export function makeAnimal(id) {
  const P = SPECIES[id]();
  P.id = id;
  return P;
}

// ---- アバター ----
export const AVATAR_OPTS = {
  skin: ['#ffe0c8', '#f7c9a5', '#e8ac80', '#c98a5e', '#a06a44', '#7a4e31'],
  hairColor: ['#2b1d16', '#5a3a22', '#a4682f', '#e1b24a', '#c4c4c4', '#e8607a', '#4a72d9', '#ffffff'],
  outfit: ['#ff7a8a', '#ffa94d', '#ffd84d', '#7cc576', '#4fb8c9', '#5a82e0', '#a97ae0', '#f4f1ea'],
  hair: [['short', 'ショート'], ['long', 'ロング'], ['bun', 'おだんご'], ['twin', 'ツインテ'], ['hat', 'ぼうし']],
};
export function makeAvatar(a) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const P = { root, body, eyes: [], scale: 1.0, phase: 0, isAvatar: true };
  const legH = 0.5, cy = 1.05;
  P.cy = cy; P.br = 0.42; P.legH = legH;
  const pants = '#4a5578';
  for (const sd of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(sd * 0.2, legH, 0);
    body.add(leg);
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, legH * 0.9, 10), mat(pants));
    cyl.position.y = -legH * 0.45;
    leg.add(cyl);
    add(leg, sph(0.17, '#7a5233', 1, 0.7, 1.4), 0, -legH + 0.05, 0.05);
    P[sd < 0 ? 'legL' : 'legR'] = leg;
  }
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 0.8, 14), mat(a.outfit));
  torso.position.y = cy;
  body.add(torso);
  add(body, sph(0.4, a.outfit, 1.05, 0.5, 0.95), 0, cy + 0.38, 0);
  for (const sd of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(sd * 0.5, cy + 0.3, 0);
    body.add(arm);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.5, 8), mat(a.outfit));
    c.position.y = -0.22;
    arm.add(c);
    add(arm, sph(0.1, a.skin), 0, -0.5, 0);
    arm.rotation.z = sd * 0.22;
    P[sd < 0 ? 'armL' : 'armR'] = arm;
  }
  P.armBase = 0.22;
  const head = new THREE.Group();
  head.position.set(0, cy + 0.82, 0);
  body.add(head);
  P.head = head; P.hr = 0.62; P.headY = cy + 0.82;
  add(head, sph(0.62, a.skin, 1, 0.95, 0.97), 0, 0.3, 0);
  // かお
  for (const sd of [-1, 1]) {
    const e = new THREE.Group();
    e.position.set(sd * 0.22, 0.28, 0.55);
    head.add(e);
    add(e, sph(0.06, '#26262e', 0.9, 1.4, 0.6));
    add(e, sph(0.022, '#ffffff'), 0.02, 0.03, 0.03);
    P.eyes.push(e);
    add(head, sph(0.09, '#ff9aa8', 1.2, 0.7, 0.4), sd * 0.38, 0.14, 0.5);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 6, 14, Math.PI), mat('#8a3b3b'));
  smile.rotation.z = Math.PI;
  smile.position.set(0, 0.18, 0.6);
  head.add(smile);
  // かみ・ぼうし
  const hc = a.hairColor;
  const cap = (r, tilt = -0.42) => {
    const g = new THREE.SphereGeometry(1, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.56);
    const m = new THREE.Mesh(g, mat(hc));
    m.scale.set(r, r, r);
    m.rotation.x = tilt;
    m.position.set(0, 0.3, -0.02);
    head.add(m);
    return m;
  };
  const hs = a.hair;
  if (hs === 'short') {
    cap(0.67);
    add(head, sph(0.22, hc, 1.3, 0.55, 0.5), 0.12, 0.66, 0.4);
  } else if (hs === 'long') {
    cap(0.68);
    add(head, sph(0.5, hc, 1.12, 1.15, 0.55), 0, -0.05, -0.34);
    for (const sd of [-1, 1]) add(head, sph(0.16, hc, 0.8, 2.2, 0.8), sd * 0.56, 0.0, -0.05);
  } else if (hs === 'bun') {
    cap(0.67);
    add(head, sph(0.24, hc), 0, 0.98, -0.12);
  } else if (hs === 'twin') {
    cap(0.67);
    for (const sd of [-1, 1]) {
      add(head, sph(0.22, hc, 0.9, 1.7, 0.9), sd * 0.66, -0.02, -0.05);
      add(head, sph(0.07, '#e8455a'), sd * 0.62, 0.34, -0.05);
    }
  } else if (hs === 'hat' && a.hat) {
    cap(0.66);
  } else if (hs === 'hat') {
    cap(0.66);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.04, 24), mat('#e9cf8a'));
    brim.position.set(0, 0.66, 0);
    head.add(brim);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.52, 0.34, 20), mat('#e9cf8a'));
    top.position.set(0, 0.83, 0);
    head.add(top);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.09, 20), mat('#e8455a'));
    band.position.set(0, 0.72, 0);
    head.add(band);
  }
  // ---- おみせで買った きせかえ ----
  const H = a.hat;
  if (H === 'knit') {
    const k = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), mat('#e8455a'));
    k.scale.set(0.7, 0.58, 0.7); k.position.set(0, 0.66, -0.02); k.rotation.x = -0.1; head.add(k);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.69, 0.08, 8, 22), mat('#fff4e0')); band.rotation.x = Math.PI / 2 - 0.1; band.position.set(0, 0.66, -0.02); head.add(band);
    add(head, sph(0.15, '#fff4e0'), 0, 1.28, -0.08);
  } else if (H === 'ribbon') {
    for (const sd of [-1, 1]) { const w = sph(0.22, '#ff7aa8', 1.4, 0.9, 0.5); add(head, w, sd * 0.26, 0.98, 0.1); w.rotation.z = sd * 0.5; }
    add(head, sph(0.1, '#e8457a'), 0, 0.98, 0.14);
  } else if (H === 'sunflower') {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.04, 24), mat('#f2d070')); brim.position.set(0, 0.7, 0); head.add(brim);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.54, 0.34, 20), mat('#f2d070')); top.position.set(0, 0.87, 0); head.add(top);
    for (let i = 0; i < 9; i++) { const an = (i / 9) * Math.PI * 2; add(head, sph(0.1, '#ffd21f', 1, 1.5, 0.4), 0.45 + Math.cos(an) * 0.15, 0.9 + Math.sin(an) * 0.15, 0.4).rotation.z = an - Math.PI / 2; }
    add(head, sph(0.1, '#7a4a20', 1, 1, 0.6), 0.45, 0.9, 0.42);
  } else if (H === 'pandaear') {
    for (const sd of [-1, 1]) add(head, sph(0.24, '#2a2a2f', 1, 1, 0.7), sd * 0.5, 0.93, -0.05);
    const hb = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.04, 6, 24, Math.PI), mat('#2a2a2f')); hb.position.set(0, 0.5, 0); hb.rotation.z = 0.0; head.add(hb);
  } else if (H === 'crown') {
    const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.34, 0.26, 16, 1, true), new THREE.MeshLambertMaterial({ color: '#ffcf3a', side: THREE.DoubleSide, emissive: '#6a4a00' })); cr.position.set(0, 0.98, 0); head.add(cr);
    for (let i = 0; i < 5; i++) { const an = (i / 5) * Math.PI * 2; const c = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 6), mat('#ffcf3a')); c.position.set(Math.cos(an) * 0.4, 1.2, Math.sin(an) * 0.4); head.add(c); add(head, sph(0.04, '#ff5c7a'), Math.cos(an) * 0.4, 1.32, Math.sin(an) * 0.4); }
  }
  if (a.neck === 'redscarf' || a.neck === 'bluescarf') {
    const col = a.neck === 'redscarf' ? '#e8455a' : '#6fb8e8';
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.11, 8, 20), mat(col)); t.rotation.x = Math.PI / 2; t.position.set(0, cy + 0.46, 0.02); body.add(t);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.55, 0.06), mat(col)); tail.position.set(0.2, cy + 0.15, 0.44); tail.rotation.z = 0.12; body.add(tail);
  }
  if (a.body === 'apron') {
    const ap = '#4f7fc4';
    const bib = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.05), mat(ap)); bib.position.set(0, cy + 0.12, 0.44); body.add(bib);
    const sk = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.32, 0.05), mat(ap)); sk.position.set(0, cy - 0.28, 0.5); body.add(sk);
    for (const sd of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.04), mat(ap)); st.position.set(sd * 0.2, cy + 0.42, 0.35); st.rotation.x = -0.5; body.add(st); }
  } else if (a.body === 'cape') {
    const cp = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.0, 0.05), mat('#5a4a9a')); cp.position.set(0, cy - 0.05, -0.5); cp.rotation.x = 0.1; body.add(cp);
    add(body, sph(0.12, '#ffd21f', 1, 1, 0.3), 0, cy + 0.1, -0.54);
    add(body, sph(0.06, '#ffd21f'), -0.25, cy - 0.2, -0.54); add(body, sph(0.06, '#ffd21f'), 0.25, cy - 0.3, -0.54);
    for (const sd of [-1, 1]) add(body, sph(0.07, '#ffd21f'), sd * 0.3, cy + 0.42, 0.3);
  }
  root.scale.setScalar(1.05);
  shadowBlob(P, 0.7);
  return P;
}

// ---- アニメーション ----
const damp = (cur, target, dt, k = 10) => cur + (target - cur) * Math.min(1, dt * k);

export function animate(P, dt, st) {
  const t = st.t;
  const walk = st.walk ? 1 : 0;
  P.walkPhase = (P.walkPhase || 0) + (walk ? dt * 10 * (st.speed || 1) : 0);
  const sw = Math.sin(P.walkPhase);
  const pose = st.pose || 'stand';
  P.ws = damp(P.ws ?? 0, walk, dt, 12);
  const w = P.ws;
  const fly = pose === 'fly';
  const sit = pose === 'sit';
  const sleep = pose === 'sleep';
  const baseLeg = sit ? -1.35 : 0;
  if (P.legL) {
    P.legL.rotation.x = damp(P.legL.rotation.x, baseLeg + (fly ? 0.4 : sw * 0.75 * w), dt, 14);
    P.legR.rotation.x = damp(P.legR.rotation.x, baseLeg + (fly ? 0.4 : -sw * 0.75 * w), dt, 14);
  }
  if (P.armL) {
    const flap = P.bird && fly ? Math.sin(t * 28) * 0.9 : 0;
    const wave = st.wave ? Math.sin(t * 9) * 0.4 : 0;
    P.armL.rotation.x = -sw * 0.7 * w;
    P.armR.rotation.x = sw * 0.7 * w;
    P.armL.rotation.z = -P.armBase - flap * (P.bird ? 1.4 : 0) - (P.bird && fly ? 1.0 : 0);
    P.armR.rotation.z = (st.wave || st.cheer ? 2.6 + wave : P.armBase) + flap * (P.bird ? 1.4 : 0) + (P.bird && fly ? 1.0 : 0);
    if (st.cheer) P.armL.rotation.z = -2.6 - Math.sin(t * 9) * 0.4;
  }
  // からだ
  let by = Math.abs(sw) * 0.12 * w;
  if (pose === 'hop' || st.hop) by += Math.abs(Math.sin(t * 7 + P.phase)) * 0.45;
  if (sit) by -= P.legH * 0.55;
  const lieTarget = sleep ? (P.lieDir || 1) * 1.5 : 0;
  P.lie = damp(P.lie || 0, lieTarget, dt, 6);
  P.body.rotation.z = P.lie;
  P.body.position.x = P.cy * Math.sin(P.lie);
  P.body.position.y = damp(P.body.position.y, by + (sleep ? P.br * 0.85 * Math.abs(Math.sin(P.lie)) : 0), dt, 18);
  const breathe = Math.sin(t * 2 + P.phase) * 0.018;
  P.body.scale.y = 1 + breathe * (1 - w);
  P.body.rotation.x = damp(P.body.rotation.x, w * 0.06 + (st.bow || 0), dt, 10);
  P.head.rotation.z = Math.sin(t * 1.3 + P.phase) * 0.04 + (st.tilt || 0);
  P.head.rotation.x = damp(P.head.rotation.x, st.nod ? Math.sin(t * 8) * 0.12 : 0, dt, 12);
  if (P.tail) P.tail.rotation.y = Math.sin(t * 3 + P.phase) * (P.bird ? 0.15 : 0.35) + (st.tailBig ? Math.sin(t * 8) * 0.3 : 0);
  if (P.ears) P.ears.forEach((e, i) => { e.rotation.x = Math.sin(t * 2.2 + i) * 0.08 + (st.scared ? Math.sin(t * 20) * 0.08 : 0); });
  // まばたき
  const bp = (t + P.phase) % 4;
  const closed = sleep || bp < 0.12;
  for (const e of P.eyes) e.scale.y = damp(e.scale.y, closed ? 0.1 : 1, dt, 30);
  // 浮遊 (とり)
  if (P.shadow) {
    const ry = P.root.position.y;
    P.shadow.position.y = 0.03 - ry;
    P.shadow.material.opacity = ry > 0.5 ? 0.12 : 0.22;
  }
}

export function faceDir(P, dx, dz, dt, rate = 10) {
  const target = Math.atan2(dx, dz);
  let d = target - P.root.rotation.y;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  P.root.rotation.y += d * Math.min(1, dt * rate);
}

// 名前ふだ
export function makeLabel(text, color = '#fff') {
  const font = 'bold 48px "Hiragino Maru Gothic ProN","Yu Gothic","Meiryo","Noto Sans JP",sans-serif';
  const m = document.createElement('canvas').getContext('2d');
  m.font = font;
  const tw = m.measureText(text).width + 44;
  const W = Math.max(256, Math.ceil(tw + 12));
  const c = document.createElement('canvas');
  c.width = W; c.height = 96;
  const g = c.getContext('2d');
  g.font = font;
  g.fillStyle = 'rgba(255,255,255,0.92)';
  g.strokeStyle = color;
  g.lineWidth = 6;
  g.beginPath();
  g.roundRect((W - tw) / 2, 12, tw, 70, 35);
  g.fill(); g.stroke();
  g.fillStyle = '#5a4636';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, W / 2, 49);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.scale.set(2.0 * W / 256, 0.75, 1);
  sp.renderOrder = 10;
  return sp;
}

// エフェクト (ハート・おんぷ…)
const fxList = [];
const fxTex = {};
function glyphTex(ch, color) {
  const k = ch + color;
  if (fxTex[k]) return fxTex[k];
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.font = 'bold 96px sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 10; g.strokeStyle = '#fff';
  g.strokeText(ch, 64, 70);
  g.fillStyle = color;
  g.fillText(ch, 64, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return (fxTex[k] = tex);
}
const FX = { heart: ['♥', '#ff5c7a'], note: ['♪', '#5a82e0'], star: ['★', '#ffc928'], zzz: ['Z', '#7a8cc4'], bang: ['!', '#ff7a3d'], sweat: ['💧', '#4fb8c9'], spark: ['✦', '#ffc928'] };
export function spawnFx(parent, kind, pos, size = 0.8) {
  const [ch, col] = FX[kind] || FX.heart;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glyphTex(ch, col), transparent: true, depthTest: false }));
  sp.scale.set(size, size, 1);
  sp.position.copy(pos);
  sp.renderOrder = 11;
  parent.add(sp);
  fxList.push({ sp, life: 0, max: 1.6, vx: (Math.random() - 0.5) * 0.5 });
}
export function updateFx(dt) {
  for (let i = fxList.length - 1; i >= 0; i--) {
    const f = fxList[i];
    f.life += dt;
    f.sp.position.y += dt * 1.0;
    f.sp.position.x += f.vx * dt;
    f.sp.material.opacity = Math.max(0, 1 - Math.max(0, f.life - 0.9) / (f.max - 0.9));
    if (f.life > f.max) {
      f.sp.parent && f.sp.parent.remove(f.sp);
      f.sp.material.dispose();
      fxList.splice(i, 1);
    }
  }
}

// ニット帽 (初雪のポコの赤い帽子)
export function addHat(P, color) {
  const hr = P.hr;
  const g = new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const h = new THREE.Mesh(g, mat(color));
  h.scale.set(hr * 0.78, hr * 0.62, hr * 0.78);
  h.position.set(0, hr * 0.55, 0.0);
  h.rotation.x = -0.15;
  P.head.add(h);
  const band = new THREE.Mesh(new THREE.TorusGeometry(hr * 0.74, hr * 0.09, 8, 20), mat('#fff4e0'));
  band.rotation.x = Math.PI / 2 - 0.15;
  band.position.set(0, hr * 0.56, 0.0);
  P.head.add(band);
  add(P.head, sph(hr * 0.17, '#fff4e0'), 0, hr * 1.12, -0.05);
}
