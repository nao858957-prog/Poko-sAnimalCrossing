// わたしの おうち: へや・かぐ・かべがみ (three.js の プリミティブだけで つくる)
import * as THREE from 'three';
import { sph, add, mat } from './models.js';

const box = (p, w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.set(x, y, z); p.add(m); return m; };
const cyl = (p, rt, rb, h, c, x, y, z, seg = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c)); m.position.set(x, y, z); p.add(m); return m; };
const G = () => new THREE.Group();

// ---- いえの だんかい ----
// hw/d0/d1 = へやの ひろさ (x: -hw..hw, z: d0..d1)  guests = しょうたいできる ともだちの かず
export const STAGES = [
  null,
  { id: 1, name: 'テント', emoji: '🏕', price: 100, hw: 3.2, d0: -2.6, d1: 2.7, guests: 1, cam: [8, 6.4], desc: 'まずは ちいさな テントから。ひとり しょうたい できるよ', give: { futon: 1, lantern: 1 } },
  { id: 2, name: 'こじんまりの おうち', emoji: '🏠', price: 450, hw: 5.0, d0: -3.6, d1: 3.7, guests: 2, cam: [10.5, 8], desc: 'かべと やねの ある おうち。ふたり しょうたい できるよ', give: { dtable: 1, chair: 2 } },
  { id: 3, name: 'おおきな おうち', emoji: '🏡', price: 1200, hw: 7.0, d0: -4.8, d1: 4.8, guests: 3, cam: [14, 10.5], desc: 'ひろい リビングの おうち。さんにん しょうたい できるよ', give: { bookshelf: 1, sofa: 1 } },
];

// ---- かべがみ・ゆか (セット) ----
export const STYLES = [
  { id: 'log', name: 'ログハウス', wall: '#d9b98a', floor: '#8a5a33', trim: '#5a3a20', price: 0 },
  { id: 'white', name: 'しろい かべ', wall: '#f6efe2', floor: '#c9a56a', trim: '#a88458', price: 30 },
  { id: 'pink', name: 'さくらいろ', wall: '#ffd9e2', floor: '#d9b38c', trim: '#b98a6a', price: 30 },
  { id: 'sky', name: 'そらいろ', wall: '#cfe9fb', floor: '#e0cfa6', trim: '#9ab4c8', price: 30 },
  { id: 'mint', name: 'ミント', wall: '#d4efd6', floor: '#b98a5a', trim: '#7aa87a', price: 30 },
  { id: 'lemon', name: 'レモン', wall: '#fff1b0', floor: '#c8a070', trim: '#c9a84a', price: 30 },
  { id: 'night', name: 'よぞらの へや', wall: '#4a5484', floor: '#6a5a4a', trim: '#2a2f50', price: 45 },
];
export const STYLE_BY_ID = Object.fromEntries(STYLES.map(s => [s.id, s]));

// ---- かぐ ----
// kind: 'floor' (ゆかに おく) / 'rug' (しきもの・あるける) / 'wall' (うしろの かべに かける)
const F = (id, emoji, name, price, r, kind, build, extra = {}) => ({ id, emoji, name, price, r, kind, build, ...extra });
export const FURN = [
  F('futon', '🛏', 'ふとん', 20, 0.95, 'floor', () => { const g = G(); box(g, 1.5, 0.22, 2.0, '#f4ead8', 0, 0.11, 0); box(g, 1.4, 0.16, 1.2, '#9ad3ec', 0, 0.3, 0.3); add(g, sph(0.34, '#fff', 1.4, 0.55, 0.9), 0, 0.36, -0.7); return g; }),
  F('bed', '🛏', 'ベッド', 90, 1.15, 'floor', () => { const g = G(); box(g, 1.7, 0.4, 2.3, '#a8733a', 0, 0.25, 0); box(g, 1.6, 0.3, 2.1, '#ffffff', 0, 0.58, 0.05); box(g, 1.62, 0.28, 1.2, '#ffb3c6', 0, 0.74, 0.5); box(g, 1.7, 1.1, 0.14, '#8a5a34', 0, 0.8, -1.15); add(g, sph(0.3, '#fff', 1.5, 0.5, 0.9), -0.45, 0.78, -0.7); add(g, sph(0.3, '#fff', 1.5, 0.5, 0.9), 0.45, 0.78, -0.7); return g; }),
  F('cushion', '🟡', 'ざぶとん', 8, 0.38, 'floor', () => { const g = G(); box(g, 0.7, 0.16, 0.7, '#f2b34a', 0, 0.1, 0); return g; }),
  F('sofa', '🛋', 'ソファ', 80, 1.3, 'floor', () => { const g = G(); box(g, 2.6, 0.5, 1.1, '#c9a56a', 0, 0.35, 0); box(g, 2.6, 0.9, 0.35, '#c9a56a', 0, 0.8, -0.45); for (const sx of [-1.4, 1.4]) box(g, 0.35, 0.7, 1.15, '#bf9a5e', sx, 0.45, 0); box(g, 1.1, 0.2, 0.9, '#d9b97c', -0.55, 0.7, 0.05); box(g, 1.1, 0.2, 0.9, '#d9b97c', 0.55, 0.7, 0.05); return g; }),
  F('chair', '🪑', 'いす', 15, 0.45, 'floor', () => { const g = G(); box(g, 0.7, 0.1, 0.7, '#a8733a', 0, 0.5, 0); box(g, 0.7, 0.8, 0.08, '#a8733a', 0, 0.95, -0.32); for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) box(g, 0.08, 0.5, 0.08, '#6a4328', x, 0.25, z); return g; }),
  F('rocker', '🪑', 'ロッキングチェア', 45, 0.7, 'floor', () => { const g = G(); box(g, 0.95, 0.1, 0.85, '#6a4328', 0, 0.62, 0); box(g, 0.95, 1.1, 0.08, '#6a4328', 0, 1.15, -0.4).rotation.x = -0.15; box(g, 0.85, 0.12, 0.75, '#c97a7a', 0, 0.72, 0.02); for (const sx of [-0.42, 0.42]) box(g, 0.06, 0.12, 1.2, '#5a3a20', sx, 0.1, 0); return g; }),
  F('table', '🍵', 'ちゃぶだい', 25, 0.8, 'floor', () => { const g = G(); cyl(g, 0.8, 0.8, 0.1, '#a8733a', 0, 0.5, 0, 20); for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) box(g, 0.1, 0.5, 0.1, '#6a4328', x, 0.25, z); cyl(g, 0.12, 0.1, 0.18, '#f4ead8', 0.2, 0.64, 0.1, 10); return g; }),
  F('dtable', '🍽', 'テーブル', 40, 1.05, 'floor', () => { const g = G(); box(g, 2.0, 0.12, 1.2, '#8a5a34', 0, 0.8, 0); for (const [x, z] of [[-0.9, -0.5], [0.9, -0.5], [-0.9, 0.5], [0.9, 0.5]]) box(g, 0.12, 0.8, 0.12, '#6a4328', x, 0.4, z); cyl(g, 0.2, 0.18, 0.1, '#fbfbf8', -0.4, 0.91, 0, 12); add(g, sph(0.12, '#ff7a5c'), -0.4, 0.99, 0); cyl(g, 0.2, 0.18, 0.1, '#fbfbf8', 0.4, 0.91, 0, 12); add(g, sph(0.12, '#ffd84d'), 0.4, 0.99, 0); return g; }),
  F('desk', '✏️', 'つくえ', 35, 0.85, 'floor', () => { const g = G(); box(g, 1.6, 0.1, 0.8, '#a8733a', 0, 0.8, 0); for (const sx of [-0.7, 0.7]) box(g, 0.1, 0.8, 0.7, '#6a4328', sx, 0.4, 0); box(g, 0.5, 0.05, 0.4, '#fffaf0', -0.3, 0.88, 0); cyl(g, 0.12, 0.12, 0.28, '#e8795a', 0.5, 0.98, 0.1, 8); return g; }),
  F('bookshelf', '📚', 'ほんだな', 55, 0.85, 'floor', () => { const g = G(); box(g, 1.6, 2.2, 0.5, '#8a5a34', 0, 1.1, 0); for (let i = 0; i < 4; i++) { box(g, 1.5, 0.06, 0.52, '#6a4328', 0, 0.35 + i * 0.52, 0.02); for (let k = 0; k < 6; k++) box(g, 0.18, 0.36, 0.3, ['#e8795a', '#4f9fe0', '#6cc455', '#ffd84d', '#b58cff', '#ff9ad0'][(k + i) % 6], -0.6 + k * 0.24, 0.55 + i * 0.52, 0.1); } return g; }),
  F('chest', '🗄', 'たんす', 40, 0.75, 'floor', () => { const g = G(); box(g, 1.3, 1.1, 0.7, '#a8733a', 0, 0.55, 0); for (let i = 0; i < 3; i++) { box(g, 1.2, 0.3, 0.04, '#8a5a34', 0, 0.2 + i * 0.35, 0.36); add(g, sph(0.05, '#ffd84d'), 0, 0.2 + i * 0.35, 0.4); } return g; }),
  F('kitchen', '🍳', 'ミニキッチン', 70, 1.0, 'floor', () => { const g = G(); box(g, 1.9, 1.0, 0.8, '#6b4328', 0, 0.5, 0); box(g, 2.0, 0.1, 0.9, '#8d8a82', 0, 1.05, 0); box(g, 0.7, 0.2, 0.5, '#fbfbf8', -0.3, 1.08, 0); cyl(g, 0.03, 0.03, 0.4, '#b0b0b0', -0.3, 1.3, -0.3, 6); cyl(g, 0.18, 0.18, 0.1, '#444', 0.6, 1.15, 0, 12); return g; }),
  F('lamp', '💡', 'フロアランプ', 25, 0.3, 'floor', () => { const g = G(); cyl(g, 0.04, 0.04, 1.6, '#3a2a20', 0, 0.8, 0, 6); cyl(g, 0.2, 0.2, 0.06, '#3a2a20', 0, 0.03, 0, 10); const sh = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.45, 14, 1, true), new THREE.MeshLambertMaterial({ color: '#f4d890', side: THREE.DoubleSide, emissive: '#7a5a10' })); sh.position.y = 1.7; g.add(sh); add(g, new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff0b0' })), 0, 1.6, 0); return g; }),
  F('lantern', '🏮', 'ランタン', 12, 0.25, 'floor', () => { const g = G(); cyl(g, 0.16, 0.16, 0.34, '#d9452f', 0, 0.25, 0, 10); add(g, new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd890' })), 0, 0.27, 0); cyl(g, 0.1, 0.1, 0.05, '#3a2a20', 0, 0.45, 0, 8); return g; }),
  F('plant', '🪴', 'かんようしょくぶつ', 12, 0.32, 'floor', () => { const g = G(); cyl(g, 0.22, 0.17, 0.34, '#c97a4a', 0, 0.17, 0); add(g, sph(0.38, '#4fa850', 1, 1.1, 1), 0, 0.7, 0); return g; }),
  F('bigplant', '🌳', 'おおきな うえき', 30, 0.55, 'floor', () => { const g = G(); cyl(g, 0.34, 0.26, 0.5, '#c97a4a', 0, 0.25, 0); cyl(g, 0.07, 0.09, 1.0, '#8a5a36', 0, 0.9, 0, 6); add(g, sph(0.7, '#4aa84a', 1, 1.1, 1), 0, 1.7, 0); add(g, sph(0.5, '#58b84a', 1, 1, 1), 0.3, 2.1, 0.1); return g; }),
  F('vase', '💐', 'はなびん', 10, 0.22, 'floor', () => { const g = G(); cyl(g, 0.12, 0.16, 0.36, '#9ad3ec', 0, 0.18, 0, 10); for (let i = 0; i < 4; i++) add(g, sph(0.12, ['#ff7a9a', '#ffd84d', '#ffffff', '#b58cff'][i]), (i - 1.5) * 0.1, 0.5 + (i % 2) * 0.1, 0); return g; }),
  F('rugr', '⭕', 'まるい ラグ', 18, 0, 'rug', () => { const g = G(); const a = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), mat('#e8b0b8')); a.rotation.x = -Math.PI / 2; a.position.y = 0.02; g.add(a); const b = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.1, 32), mat('#fff3e0')); b.rotation.x = -Math.PI / 2; b.position.y = 0.025; g.add(b); return g; }, { rr: 1.5 }),
  F('rugs', '🟫', 'しかくい ラグ', 22, 0, 'rug', () => { const g = G(); box(g, 2.6, 0.03, 1.8, '#8fb8d8', 0, 0.02, 0); box(g, 2.2, 0.035, 1.4, '#f4ead8', 0, 0.025, 0); box(g, 1.9, 0.04, 1.1, '#8fb8d8', 0, 0.03, 0); return g; }, { rr: 1.3 }),
  F('stove', '🔥', 'まきストーブ', 60, 0.7, 'floor', () => { const g = G(); box(g, 0.9, 1.0, 0.9, '#3a3a40', 0, 0.5, 0); cyl(g, 0.1, 0.1, 1.6, '#2a2a30', 0, 1.9, 0, 8); box(g, 0.5, 0.4, 0.05, '#ff9a2a', 0, 0.5, 0.46); return g; }),
  F('aquarium', '🐠', 'すいそう', 70, 0.65, 'floor', () => { const g = G(); box(g, 1.2, 0.7, 0.4, '#6a4328', 0, 0.35, 0); const w = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.5), new THREE.MeshLambertMaterial({ color: '#8fd8f0', transparent: true, opacity: 0.55 })); w.position.y = 1.05; g.add(w); add(g, sph(0.1, '#ff9a4a', 1.6, 1, 0.6), -0.2, 1.1, 0); add(g, sph(0.08, '#ffd84d', 1.6, 1, 0.6), 0.25, 0.95, 0.05); return g; }),
  F('piano', '🎹', 'ピアノ', 150, 1.1, 'floor', () => { const g = G(); box(g, 1.9, 1.1, 0.8, '#2a2a30', 0, 0.8, 0); box(g, 1.9, 0.08, 0.5, '#f4f4f0', 0, 0.82, 0.45); box(g, 1.9, 0.5, 0.1, '#2a2a30', 0, 1.6, -0.35); for (const sx of [-0.8, 0.8]) box(g, 0.1, 0.8, 0.1, '#2a2a30', sx, 0.4, 0.3); box(g, 0.9, 0.1, 0.4, '#6a4328', 0, 0.35, 0.8); return g; }),
  F('record', '🎵', 'レコードプレーヤー', 45, 0.45, 'floor', () => { const g = G(); box(g, 0.9, 0.5, 0.6, '#6a4328', 0, 0.55, 0); box(g, 0.6, 0.6, 0.8, '#8a5a34', 0, 0.3, 0); cyl(g, 0.22, 0.22, 0.03, '#1a1a20', 0, 0.82, 0, 16); cyl(g, 0.05, 0.05, 0.04, '#e8455a', 0, 0.84, 0, 8); return g; }),
  F('plush', '🐼', 'ポコの ぬいぐるみ', 30, 0.38, 'floor', () => { const g = G(); add(g, sph(0.3, '#ffffff', 1, 1, 1), 0, 0.3, 0); add(g, sph(0.24, '#ffffff', 1, 1, 1), 0, 0.72, 0); add(g, sph(0.1, '#2a2a30', 1, 1, 0.6), -0.2, 0.9, 0); add(g, sph(0.1, '#2a2a30', 1, 1, 0.6), 0.2, 0.9, 0); add(g, sph(0.05, '#2a2a30'), -0.09, 0.74, 0.21); add(g, sph(0.05, '#2a2a30'), 0.09, 0.74, 0.21); return g; }),
  F('globe', '🌍', 'ちきゅうぎ', 28, 0.32, 'floor', () => { const g = G(); cyl(g, 0.18, 0.2, 0.06, '#6a4328', 0, 0.03, 0, 10); cyl(g, 0.03, 0.03, 0.4, '#6a4328', 0, 0.25, 0, 6); add(g, sph(0.3, '#4f9fe0'), 0, 0.7, 0); add(g, sph(0.16, '#6cc455', 1, 0.7, 0.5), 0.12, 0.75, 0.2); return g; }),
  F('frame', '🖼', 'がくぶち', 20, 0, 'wall', () => { const g = G(); box(g, 1.0, 0.8, 0.08, '#5a3a20', 0, 0, 0); box(g, 0.84, 0.64, 0.05, '#bfe8ff', 0, 0, 0.03); add(g, sph(0.22, '#6cc455', 1.6, 0.8, 0.3), 0, -0.08, 0.06); add(g, sph(0.1, '#ffd84d', 1, 1, 0.3), 0.25, 0.14, 0.06); return g; }, { y: 2.6 }),
  F('clock', '🕰', 'かけどけい', 25, 0, 'wall', () => { const g = G(); const c = cyl(g, 0.4, 0.4, 0.08, '#8a5a34', 0, 0, 0, 20); c.rotation.x = Math.PI / 2; const f = cyl(g, 0.32, 0.32, 0.03, '#fffaf0', 0, 0, 0.05, 20); f.rotation.x = Math.PI / 2; box(g, 0.04, 0.24, 0.02, '#3a2a20', 0, 0.1, 0.08); box(g, 0.18, 0.04, 0.02, '#3a2a20', 0.07, 0, 0.08); return g; }, { y: 2.9 }),
  F('wreath', '💐', 'はなの リース', 18, 0, 'wall', () => { const g = G(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; add(g, sph(0.13, ['#ff7a9a', '#ffd84d', '#ffffff', '#6cc455', '#b58cff'][i % 5]), Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0.04); } return g; }, { y: 2.7 }),
  F('trophy', '🐟', 'おおものの かざり', 40, 0, 'wall', () => { const g = G(); box(g, 1.2, 0.5, 0.06, '#8a5a34', 0, 0, 0); add(g, sph(0.34, '#8fb8d8', 1.8, 0.7, 0.3), 0, 0, 0.06); add(g, sph(0.14, '#8fb8d8', 1, 1, 0.3), -0.52, 0, 0.06); return g; }, { y: 2.5 }),
];
export const FURN_BY_ID = Object.fromEntries(FURN.map(f => [f.id, f]));

// ---- へや ----
export class HomeRoom {
  constructor() {
    this.group = new THREE.Group();
    this.shell = null; this.furn = new THREE.Group(); this.group.add(this.furn);
    this.stage = 0; this.styleId = 'log'; this.bounds = null; this.items = []; this.nodes = [];
    this.lights = [];
  }
  get exit() { return { x: 0, z: this.bounds.z1 - 0.3 }; }
  get spawn() { return { x: 0, z: this.bounds.z1 - 1.5 }; }
  buildShell(stage, styleId) {
    const st = STAGES[stage]; if (!st) return;
    const sty = STYLE_BY_ID[styleId] || STYLES[0];
    if (this.shell) { this.group.remove(this.shell); this.shell.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    this.stage = stage; this.styleId = sty.id;
    const hw = st.hw, d0 = st.d0, d1 = st.d1, depth = d1 - d0, H = stage === 1 ? 3.6 : 4.4;
    this.bounds = { x0: -hw + 0.3, x1: hw - 0.3, z0: d0 + 0.2, z1: d1 - 0.2 };
    const g = new THREE.Group(); this.shell = g; this.group.add(g);
    // ゆか
    const n = Math.round(hw * 2 / 0.9);
    for (let i = 0; i < n; i++) box(g, hw * 2 / n - 0.02, 0.1, depth, i % 2 ? sty.floor : shade(sty.floor, -10), -hw + (i + 0.5) * hw * 2 / n, -0.05, (d0 + d1) / 2);
    // かべ (うしろ・ひだり・みぎ)
    box(g, hw * 2, H, 0.3, sty.wall, 0, H / 2, d0 - 0.15);
    box(g, 0.3, H, depth, sty.wall, -hw - 0.15, H / 2, (d0 + d1) / 2);
    box(g, 0.3, H, depth, sty.wall, hw + 0.15, H / 2, (d0 + d1) / 2);
    box(g, hw * 2 + 0.6, 0.4, 0.5, sty.trim, 0, H + 0.1, d0 - 0.15); box(g, 0.5, 0.4, depth, sty.trim, -hw - 0.15, H + 0.1, (d0 + d1) / 2); box(g, 0.5, 0.4, depth, sty.trim, hw + 0.15, H + 0.1, (d0 + d1) / 2);
    box(g, hw * 2, 0.22, 0.12, sty.trim, 0, 0.11, d0 + 0.05); box(g, 0.12, 0.22, depth, sty.trim, -hw + 0.05, 0.11, (d0 + d1) / 2); box(g, 0.12, 0.22, depth, sty.trim, hw - 0.05, 0.11, (d0 + d1) / 2);
    if (stage === 1) { // テント: はたと ひも
      for (let i = 0; i < 5; i++) box(g, 0.5, 0.3, 0.04, ['#ff8a7a', '#ffd84d', '#7ec8ff', '#8fe08a', '#ff9ad0'][i], -2.2 + i * 1.1, 3.2, d0 + 0.02).rotation.z = (i % 2 ? 1 : -1) * 0.15;
      box(g, hw * 2, 0.04, 0.04, '#6b5a4a', 0, 3.4, d0 + 0.02);
    } else { // まど
      const wx = stage === 2 ? 1.8 : 3.2;
      box(g, 1.8, 1.8, 0.1, '#f4ead8', wx, 2.4, d0 + 0.05);
      box(g, 1.5, 1.5, 0.06, stage > 0 ? (styleId === 'night' ? '#0e1430' : '#9fd8ff') : '#9fd8ff', wx, 2.4, d0 + 0.09);
      box(g, 0.06, 1.5, 0.05, '#f4ead8', wx, 2.4, d0 + 0.13); box(g, 1.5, 0.06, 0.05, '#f4ead8', wx, 2.4, d0 + 0.13);
      for (const sx of [-1.1, 1.1]) box(g, 0.55, 2.6, 0.15, '#d4b98a', wx + sx, 2.5, d0 + 0.2);
    }
    // でぐち
    for (const sx of [-1.1, 1.1]) box(g, 0.25, 3.0, 0.25, sty.trim, sx, 1.5, d1 - 0.1);
    box(g, 2.6, 0.3, 0.3, sty.trim, 0, 3.0, d1 - 0.1);
    const dm = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.9), mat('#c26a4a')); dm.rotation.x = -Math.PI / 2; dm.position.set(0, 0.03, d1 - 0.65); g.add(dm);
    // あかり
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff0b0' })); bulb.position.set(0, 3.2, (d0 + d1) / 2); g.add(bulb);
    box(g, 0.03, 0.9, 0.03, '#3a2a20', 0, 3.7, (d0 + d1) / 2);
    const pl = new THREE.PointLight(0xffd890, stage === 3 ? 12 : 9, stage === 3 ? 20 : 15, 1.8); pl.position.set(0, 3.0, (d0 + d1) / 2); g.add(pl);
    if (stage === 3) { const pl2 = new THREE.PointLight(0xffd890, 6, 14, 1.8); pl2.position.set(hw * 0.55, 3.0, d0 + 1.5); g.add(pl2); }
  }
  // かぐを ならべなおす  items = [{id,x,z,r}]
  setItems(items) {
    this.items = items;
    for (const n of this.nodes) { this.furn.remove(n); n.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    this.nodes = [];
    items.forEach((it, i) => {
      const def = FURN_BY_ID[it.id]; if (!def) return;
      const m = def.build();
      m.position.set(it.x, def.kind === "wall" ? def.y : 0, def.kind === "wall" ? this.bounds.z0 - 0.14 : it.z);
      if (def.kind !== 'wall') m.rotation.y = (it.r || 0) * Math.PI / 2;
      m.traverse(o => { o.userData.furn = i; });
      this.furn.add(m); this.nodes.push(m);
    });
  }
  obstacles() {
    const out = [];
    for (const it of this.items) { const d = FURN_BY_ID[it.id]; if (d && d.kind === 'floor' && d.r > 0.2) out.push({ x: it.x, z: it.z, r: Math.min(d.r, 0.9) * 0.85 }); }
    return out;
  }
  // おける? (ゆかの かぐは かさならない・でぐちを ふさがない)
  canPlace(it, ignore = -1) {
    const d = FURN_BY_ID[it.id], b = this.bounds; if (!d) return false;
    if (d.kind === 'wall') {
      if (it.x < b.x0 + 0.7 || it.x > b.x1 - 0.7) return false;
      return !this.items.some((o, i) => i !== ignore && FURN_BY_ID[o.id].kind === 'wall' && Math.abs(o.x - it.x) < 1.0);
    }
    const m = d.kind === 'rug' ? 0.2 : d.r;
    if (it.x < b.x0 + m || it.x > b.x1 - m || it.z < b.z0 + m || it.z > b.z1 - m) return false;
    if (d.kind === 'rug') return true;
    if (it.z > b.z1 - 1.9 - d.r * 0.4 && Math.abs(it.x) < 1.6 + d.r * 0.5) return false;
    return !this.items.some((o, i) => { if (i === ignore) return false; const od = FURN_BY_ID[o.id]; return od.kind === 'floor' && Math.hypot(o.x - it.x, o.z - it.z) < (od.r + d.r) * 0.85; });
  }
  // あいている ばしょを さがす
  findSpot(id) {
    const d = FURN_BY_ID[id], b = this.bounds, cz = (b.z0 + b.z1) / 2 - 0.3;
    if (d.kind === 'wall') {
      for (let k = 0; k < 40; k++) { const x = Math.round(((k % 2 ? 1 : -1) * Math.ceil(k / 2) * 1.0) * 2) / 2; if (this.canPlace({ id, x, z: b.z0 }, -1)) return { id, x, z: b.z0, r: 0 }; }
      return null;
    }
    const c = [];
    for (let x = Math.ceil(b.x0 * 2) / 2; x <= b.x1; x += 0.5) for (let z = Math.ceil(b.z0 * 2) / 2; z <= b.z1; z += 0.5) c.push({ x, z, k: Math.hypot(x, (z - cz) * 1.2) });
    c.sort((a, b2) => a.k - b2.k);
    for (const p of c) if (this.canPlace({ id, x: p.x, z: p.z }, -1)) return { id, x: p.x, z: p.z, r: 0 };
    return null;
  }
}
function shade(hex, amt) {
  const c = new THREE.Color(hex); c.offsetHSL(0, 0, amt / 255); return '#' + c.getHexString();
}

// ともだちが おうちに あそびに きた ときの ひとこと [すくない, おおい]
export const HOME_LINES = {
  poko: ['おじゃまします、なの！ ここが {n}の おうち…あったかいの。', 'わぁ、かわいい おへやなの！ ポコも ここに すみたいの。'],
  mei: ['へ、へぇ…わるくないじゃない。べつに ほめてるわけじゃ ないんだからね！', '…すてき。…って、いまの ナシ！ きかなかった ことに しなさいよ！'],
  sei: ['あら、いい おうちね。ここで {n}さんの まいにちが はじまるのね。', 'とても すてきな おへや。{n}さんらしい あたたかさが あるわ。'],
  rin: ['おじゃましまーす。いい おうちじゃない！ すこしずつ ふやしていこうね。', 'すごい、おしゃれ！ おちゃでも のみながら ゆっくり したくなるね。'],
  pa: ['キュッ！ ここが {n}さんの おうち。おちつく においが するよ。', 'キュキュッ！ こんなに かざったんだ。ぼくの すあなも まねしたいな。'],
  ku: ['お、おじゃまします…。ここ、すごく おちつく…。', '…ここ、ずっと いたいな。こわいの、ぜんぜん ないよ。'],
  nami: ['ニャ！ ここが おうち？ ナミ、くんくん…いいにおい！', 'ニャ〜ン！ ふかふかが いっぱい！ ここで ねても いい？'],
  kuro: ['おじゃまするわね。いい はじまりじゃない。すこしずつ、{n}さんの いろに していくといいわ。', 'とても いごこちが いいわ。ママ友の おうちに きたみたい。'],
  pon: ['ぽん！ いい しごとぽん。ここは うちの おきゃくさまの おうちぽん。', 'ぽん！ いい かぐが そろっているぽん。さすが {n}さんぽん。'],
};
