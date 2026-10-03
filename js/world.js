// ポコたちの島 (three.js)
import * as THREE from 'three';
import { sph, add, mat, makeLabel } from './models.js';

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

export const ISLAND_R = 48;
// 島のかたち: 本島 + にしの「くらしのはま」(おうちを たてる ばしょ)。g = しばふの はんけい
export const LAND = [{ x: 0, z: 0, r: ISLAND_R, g: 39 }, { x: -66, z: 4, r: 30, g: 23 }];
export const HOME_PLOT = { x: -68, z: -10 };
export const FARM = { x: -58, z: 14 };          // はたけ
export const GREAT_TREE = { x: -82, z: 6 };     // おもいでの おおきな き (まわりは おはなばたけ)
export const landDepth = (x, z) => { let d = -1e9; for (const c of LAND) d = Math.max(d, c.r - Math.hypot(x - c.x, z - c.z)); return d; };
// 海に出ないよう 島の中へ もどす (m = へりから あける きょり)
export function clampLand(pos, m = 0) {
  let best = null, bd = -1e9;
  for (const c of LAND) { const d = c.r - Math.hypot(pos.x - c.x, pos.z - c.z); if (d > bd) { bd = d; best = c; } }
  if (bd >= m) return false;
  const dx = pos.x - best.x, dz = pos.z - best.z, L = Math.hypot(dx, dz) || 1, k = (best.r - m) / L;
  pos.x = best.x + dx * k; pos.z = best.z + dz * k; return true;
}
// 海にいちばん ちかい へりの むき (つり用)
export function shoreNormal(x, z) {
  let best = LAND[0], bd = -1e9;
  for (const c of LAND) { const d = c.r - Math.hypot(x - c.x, z - c.z); if (d > bd) { bd = d; best = c; } }
  const dx = x - best.x, dz = z - best.z, L = Math.hypot(dx, dz) || 1;
  return { dx: dx / L, dz: dz / L, depth: bd };
}
export const HOMES = {
  sei: [3.5, -11], poko: [-2, -8.5], mei: [1.5, -8],
  rin: [-76, 9], pa: [32, 9], ku: [27, -19],
  nami: [-3, 41], kuro: [3, 42.5], haru: [-12, -26], pon: [-6.2, 12.7],
  chao: [-48, 12],
};

function cyl3(parent, rt, rb, h, color, x, y, z) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 10), mat(color)); m.position.set(x, y, z); parent.add(m); return m; }
function box3(parent, w, h, d, color, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)); m.position.set(x, y, z); parent.add(m); return m; }

export function buildWorld() {
  const g = new THREE.Group();
  const obstacles = [];
  const flowers = [];
  const snowCaps = [];
  const r = rng(7);

  // 地面
  const sandMat = new THREE.MeshLambertMaterial({ color: '#f4e2b0' });
  const grassMat = new THREE.MeshLambertMaterial({ color: '#8fd36e' });
  const patchMats = [new THREE.MeshLambertMaterial({ color: '#82c862' }), new THREE.MeshLambertMaterial({ color: '#9adc78' })];
  for (const c of LAND) {
    const sand = new THREE.Mesh(new THREE.CircleGeometry(c.r + 2, 64), sandMat);
    sand.rotation.x = -Math.PI / 2; sand.position.set(c.x, -0.02, c.z); g.add(sand);
    const grass = new THREE.Mesh(new THREE.CircleGeometry(c.g, 72), grassMat);
    grass.rotation.x = -Math.PI / 2; grass.position.set(c.x, 0, c.z); g.add(grass);
  }
  // 芝のまだら
  for (let i = 0; i < 44; i++) {
    const a = r() * Math.PI * 2, d = r() * 36;
    const p = new THREE.Mesh(new THREE.CircleGeometry(2 + r() * 3, 18), patchMats[i % 2]);
    p.rotation.x = -Math.PI / 2; p.position.set(Math.cos(a) * d, 0.01, Math.sin(a) * d); g.add(p);
  }
  // 道
  const path = new THREE.Mesh(new THREE.PlaneGeometry(3, 54), mat('#ead7a4'));
  path.rotation.x = -Math.PI / 2; path.position.set(0, 0.015, 15); g.add(path);
  const path2 = new THREE.Mesh(new THREE.PlaneGeometry(64, 2.4), mat('#ead7a4'));
  path2.rotation.x = -Math.PI / 2; path2.position.set(0, 0.016, -2); g.add(path2);
  // うみ
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), mat('#5ec0ec'));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -0.25; g.add(sea);
  const foamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
  const foams = LAND.map(c => {
    const foam = new THREE.Mesh(new THREE.RingGeometry(c.r + 1.6, c.r + 3.4, 64), foamMat);
    foam.rotation.x = -Math.PI / 2; foam.position.set(c.x, -0.15, c.z); g.add(foam); return foam;
  });

  // 木
  const trunkM = mat('#8a5a36');
  function tree(x, z, s = 1, fruit = false, rr = r) {
    const t = new THREE.Group(); t.position.set(x, 0, z); t.scale.setScalar(s);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 1.8, 8), trunkM);
    tr.position.y = 0.9; t.add(tr);
    const col = ['#58b84a', '#6cc455', '#4aa84a'][Math.floor(rr() * 3)];
    add(t, sph(1.5, col, 1, 0.95, 1), 0, 2.7, 0);
    add(t, sph(1.05, col, 1, 0.9, 1), 0.7, 3.4, 0.2);
    const cap = sph(1.2, '#f4f8fc', 1.0, 0.5, 1.0); add(t, cap, 0, 3.7, 0); cap.visible = false; snowCaps.push(cap);
    if (fruit) for (let i = 0; i < 4; i++) add(t, sph(0.16, '#ff7a5c'), Math.cos(i * 1.7) * 1.2, 2.5 + (i % 2) * 0.5, Math.sin(i * 1.7) * 1.2);
    g.add(t);
    obstacles.push({ x, z, r: 0.6 * s });
  }
  const keep = (x, z) => {
    for (const k of Object.values(HOMES)) if (Math.hypot(x - k[0], z - k[1]) < 4.5) return false;
    if (Math.hypot(x, z - 4) < 5) return false;
    if (Math.abs(x) < 2.2 && z > -5) return false;
    if (Math.abs(z + 2) < 1.8 && Math.abs(x) < 16) return false;
    if (Math.hypot(x, z + 15) < 6) return false;
    if (Math.hypot(x - 9, z - 9) < 5) return false;
    if (Math.hypot(x + 9, z - 11) < 7) return false;
    if (Math.hypot(x - 25, z - 17) < 9) return false;
    if (Math.hypot(x + 31, z - 8) < 6) return false;
    if (Math.abs(x) < 2.2 && z > 0) return false;
    return true;
  };
  let placed = 0, tries = 0;
  while (placed < 90 && tries++ < 1800) {
    const a = r() * Math.PI * 2, d = 6 + r() * 30;
    const x = Math.cos(a) * d, z = Math.sin(a) * d * 0.95;
    if (z > 31 || !keep(x, z) || Math.hypot(x, z) > 36) continue;
    if (obstacles.some(o => Math.hypot(o.x - x, o.z - z) < 3.2)) continue;
    tree(x, z, 0.85 + r() * 0.5, r() < 0.25); placed++;
  }
  // 竹林
  const bam = new THREE.CylinderGeometry(0.1, 0.12, 5, 6);
  for (let i = 0; i < 16; i++) {
    const x = -21 + r() * 5, z = -16 + r() * 6;
    const b = new THREE.Mesh(bam, mat(i % 3 ? '#8fc860' : '#79b050'));
    b.position.set(x, 2.5, z); b.rotation.z = (r() - 0.5) * 0.12; g.add(b);
    add(g, sph(0.5, '#6cc455', 0.8, 1.6, 0.8), x, 5, z);
    obstacles.push({ x, z, r: 0.25 });
  }
  // セイママのおうち (森のログハウス)
  const house = new THREE.Group(); house.position.set(0, 0, -16);
  const logGeo = new THREE.CylinderGeometry(0.32, 0.32, 7.2, 10);
  const logGeoS = new THREE.CylinderGeometry(0.32, 0.32, 5.4, 10);
  const woods = ['#9a6a3f', '#8a5b34', '#a8744a'];
  for (let i = 0; i < 6; i++) {
    const front = new THREE.Mesh(logGeo, mat(woods[i % 3])); front.rotation.z = Math.PI / 2; front.position.set(0, 0.4 + i * 0.6, 2.5); house.add(front);
    const back = front.clone(); back.position.z = -2.5; house.add(back);
    for (const sx of [-3.5, 3.5]) {
      const side = new THREE.Mesh(logGeoS, mat(woods[(i + 1) % 3])); side.rotation.x = Math.PI / 2; side.position.set(sx, 0.4 + i * 0.6, 0); house.add(side);
    }
  }
  const core = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.6, 4.8), mat('#7a5230')); core.position.y = 1.85; house.add(core);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.9, 2.6, 4), mat('#6a4a38')); roof.rotation.y = Math.PI / 4; roof.position.y = 4.9; roof.scale.set(1.0, 1, 0.8); house.add(roof);
  const snowRoof = new THREE.Mesh(new THREE.ConeGeometry(5.5, 1.6, 4), mat('#ffffff')); snowRoof.rotation.y = Math.PI / 4; snowRoof.position.y = 5.5; snowRoof.scale.set(1.0, 1, 0.8); snowRoof.visible = false; house.add(snowRoof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.2, 0.2), mat('#5a3a20')); door.position.set(0, 1.1, 2.6); house.add(door);
  add(house, sph(0.09, '#ffd84d'), 0.45, 1.0, 2.75);
  const mat0 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.9), mat('#c26a4a')); mat0.position.set(0, 0.03, 3.2); house.add(mat0);
  const winMat = new THREE.MeshLambertMaterial({ color: '#ffe9a8', emissive: '#000000' });
  for (const sx of [-2.3, 2.3]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 0.12), winMat); w.position.set(sx, 2.0, 2.62); house.add(w);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.25), mat('#f4ead8')); fr.position.set(sx, 1.4, 2.7); house.add(fr);
    const cr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.16), mat('#f4ead8')); cr.position.set(sx, 2.0, 2.68); house.add(cr);
    add(house, sph(0.3, '#6cc455', 1.2, 0.8, 1), sx, 1.55, 2.85);
  }
  const chim = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.4, 0.9), mat('#a8a39a')); chim.position.set(2.2, 5.4, -0.8); house.add(chim);
  const lampOut = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshLambertMaterial({ color: '#fff3c4', emissive: '#000' })); lampOut.position.set(-1.1, 2.7, 2.8); house.add(lampOut);
  g.add(house);
  const doorLabel = new THREE.Object3D(); doorLabel.position.set(0, 3.3, -13.2); g.add(doorLabel);
  obstacles.push({ x: -2.6, z: -16, r: 2.2 }, { x: 2.6, z: -16, r: 2.2 }, { x: -1.0, z: -16.4, r: 2.4 }, { x: 1.0, z: -16.4, r: 2.4 }, { x: -3.2, z: -14.2, r: 0.9 }, { x: 3.2, z: -14.2, r: 0.9 });
  // さく・ポスト・街灯
  for (let i = -4; i <= 4; i++) {
    if (Math.abs(i) < 2) continue;
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.2), mat('#c8935a')); f.position.set(i * 1.5, 0.45, -12.6); g.add(f);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.12, 0.12), mat('#c8935a')); rail.position.set(-4.5, 0.7, -12.6); g.add(rail);
  const rail2 = rail.clone(); rail2.position.x = 4.5; g.add(rail2);
  const lamps = [lampOut];
  for (const [x, z] of [[-2.4, -3.2], [2.4, -3.2], [2.2, 10], [-2.2, 16]]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.4, 6), mat('#6b5a4a')); p.position.set(x, 1.2, z); g.add(p);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), new THREE.MeshLambertMaterial({ color: '#fff3c4', emissive: '#000' })); l.position.set(x, 2.5, z); g.add(l);
    lamps.push(l);
  }
  // ため池
  const pond = new THREE.Mesh(new THREE.CircleGeometry(3.4, 28), mat('#7ccdf2')); pond.rotation.x = -Math.PI / 2; pond.position.set(9, 0.03, 9); g.add(pond);
  const pondRim = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.9, 28), mat('#c9c3b0')); pondRim.rotation.x = -Math.PI / 2; pondRim.position.set(9, 0.025, 9); g.add(pondRim);
  for (let i = 0; i < 3; i++) add(g, sph(0.45, '#4fa850', 1, 0.15, 1), 8 + i * 0.9, 0.06, 8.5 + (i % 2));
  obstacles.push({ x: 9, z: 9, r: 3.5 });
  // いわ
  for (const [x, z, s] of [[11, -9, 1.6], [17, -1, 1.2], [18, -9, 1.0], [-8, 6, 0.9]]) {
    add(g, sph(s, '#b9b5ad', 1.2, 0.8, 1), x, s * 0.4, z); obstacles.push({ x, z, r: s });
  }
  // 花ばたけ (リンの草原)
  const petal = ['#ff7a9a', '#ffd84d', '#ffffff', '#b58cff', '#ff9d5c'];
  function flower(x, z, collectable = true) {
    const f = new THREE.Group(); f.position.set(x, 0, z);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 5), mat('#5aa84a')); st.position.y = 0.2; f.add(st);
    const c = petal[Math.floor(r() * petal.length)];
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; add(f, sph(0.1, c, 1, 0.6, 1), Math.cos(a) * 0.12, 0.42, Math.sin(a) * 0.12); }
    add(f, sph(0.07, '#ffb020'), 0, 0.44, 0);
    g.add(f);
    if (collectable) flowers.push({ mesh: f, x, z, back: 0 });
  }
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, d = r() * 7;
    flower(-14 + Math.cos(a) * d, -1 + Math.sin(a) * d * 0.8, i % 3 === 0);
  }
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2, d = 4 + r() * 32;
    const x = Math.cos(a) * d, z = Math.sin(a) * d * 0.9;
    if (z < 32 && keep(x, z) && !obstacles.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 0.6)) flower(x, z, i % 4 === 0);
  }
  // 草むら
  for (let i = 0; i < 100; i++) {
    const a = r() * Math.PI * 2, d = r() * 36;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z > 32) continue;
    add(g, sph(0.35, '#6cc455', 1.2, 0.7, 1.2), x, 0.18, z);
  }
  // ビーチ
  const um = new THREE.Group(); um.position.set(-7, 0, 41);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), mat('#ffffff')); pole.position.y = 1.3; um.add(pole);
  const top = new THREE.Mesh(new THREE.ConeGeometry(2, 0.8, 12), mat('#ff7a8a')); top.position.y = 2.7; um.add(top);
  const top2 = new THREE.Mesh(new THREE.ConeGeometry(2.02, 0.8, 12, 1, true, 0, 1.05), mat('#ffffff')); top2.position.y = 2.7; um.add(top2);
  g.add(um);
  const towel = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), mat('#ffd84d')); towel.rotation.x = -Math.PI / 2; towel.position.set(-7, 0.03, 41.8); g.add(towel);
  add(g, sph(0.9, '#f8d98a', 1.3, 0.7, 1.2), 8, 0.3, 41); // すなのおしろ
  add(g, sph(0.5, '#f4cf78', 1, 1.4, 1), 8, 0.9, 41);
  for (let i = 0; i < 12; i++) {
    const a = r() * 6.28; add(g, sph(0.12, i % 2 ? '#ffd0d8' : '#ffffff', 1, 0.5, 1), Math.cos(a) * 16, 0.05, 39 + r() * 7);
  }
  add(g, sph(0.6, '#cfcabf', 1.2, 0.8, 1), 0, 0.2, 46);
  obstacles.push({ x: -7, z: 41, r: 0.3 }, { x: 8, z: 41, r: 0.9 });

  // ---- おみせ (たべもの・きせかえ) ----
  const shop = new THREE.Group(); shop.position.set(-9, 0, 9.4); g.add(shop);
  const sw = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3, 4), mat('#ffe3ea')); sw.position.y = 1.5; shop.add(sw);
  const sr = new THREE.Mesh(new THREE.ConeGeometry(4.6, 1.8, 4), mat('#e8795a')); sr.rotation.y = Math.PI / 4; sr.position.y = 3.9; sr.scale.set(1.0, 1, 0.76); shop.add(sr);
  for (let i = 0; i < 7; i++) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 1.5), mat(i % 2 ? '#ffffff' : '#e8455a'));
    st.position.set(-2.4 + i * 0.8, 2.55, 2.55); st.rotation.x = 0.42; shop.add(st);
  }
  const sdoor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.0, 0.12), mat('#8a5a36')); sdoor.position.set(-1.4, 1.0, 2.04); shop.add(sdoor);
  const swin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 0.1), new THREE.MeshLambertMaterial({ color: '#cfeeff' })); swin.position.set(1.3, 1.5, 2.04); shop.add(swin);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 0.7), mat('#c8935a')); counter.position.set(1.3, 0.9, 2.5); shop.add(counter);
  add(shop, sph(0.28, '#ffd0d8', 1, 0.8, 1), 0.8, 1.15, 2.5); add(shop, sph(0.28, '#f4e2b0', 1, 0.8, 1), 1.5, 1.15, 2.5); add(shop, sph(0.2, '#ff7a5c'), 2.0, 1.1, 2.5);
  for (const [x, c] of [[-2.4, '#ff7a5c'], [-3.0, '#ffd84d']]) { const cr = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), mat('#c8935a')); cr.position.set(x - 0.3, 0.25, 2.6); shop.add(cr); for (let k = 0; k < 4; k++) add(shop, sph(0.15, c), x - 0.3 + (k % 2) * 0.3 - 0.15, 0.6, 2.6 + (k > 1 ? 0.2 : -0.2)); }
  const rack = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.4, 0.05), mat('#6b5a4a')); rack.position.set(3.2, 0.7, 2.4); shop.add(rack);
  add(shop, sph(0.2, '#e8455a', 1, 0.7, 1), 3.2, 1.45, 2.4); add(shop, sph(0.2, '#ffd21f', 1, 0.7, 1), 3.2, 1.1, 2.4);
  const shopLabel = makeLabel('🛍 おみせ', '#e8795a'); shopLabel.position.set(-9, 5.6, 9.4); g.add(shopLabel);
  shopLabel.visible = false;
  const sp0 = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.2), mat('#ead7a4')); sp0.rotation.x = -Math.PI / 2; sp0.position.set(-4.5, 0.017, 12.6); g.add(sp0);
  obstacles.push({ x: -10.8, z: 9.4, r: 1.7 }, { x: -9.0, z: 9.4, r: 1.7 }, { x: -7.2, z: 9.4, r: 1.7 });
  // ---- ランドマーク (とうだい・じんじゃ・うみのいえ・みずうみ) ----
  const LM = { lighthouse: { x: 24, z: -33 }, shrine: { x: -31, z: 8 }, hut: { x: 12, z: 40 }, lake: { x: 25, z: 17 } };
  // みずうみ
  const lake = new THREE.Mesh(new THREE.CircleGeometry(6.2, 36), mat('#7ccdf2')); lake.rotation.x = -Math.PI / 2; lake.position.set(LM.lake.x, 0.03, LM.lake.z); g.add(lake);
  const lakeRim = new THREE.Mesh(new THREE.RingGeometry(6.2, 6.9, 36), mat('#c9c3b0')); lakeRim.rotation.x = -Math.PI / 2; lakeRim.position.set(LM.lake.x, 0.025, LM.lake.z); g.add(lakeRim);
  for (let i = 0; i < 5; i++) add(g, sph(0.5, '#4fa850', 1, 0.15, 1), LM.lake.x - 2 + i * 1.1, 0.06, LM.lake.z - 1 + (i % 3));
  obstacles.push({ x: LM.lake.x, z: LM.lake.z, r: 6.2 });
  // とうだい
  const lh = new THREE.Group(); lh.position.set(LM.lighthouse.x, 0, LM.lighthouse.z); g.add(lh);
  for (let i = 0; i < 5; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(1.6 - i * 0.12, 1.72 - i * 0.12, 1.8, 14), mat(i % 2 ? '#e8455a' : '#ffffff')); seg.position.y = 0.9 + i * 1.8; lh.add(seg); }
  const lhTop = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.2, 0.3, 14), mat('#4a4a52')); lhTop.position.y = 9.1; lh.add(lhTop);
  const lhLamp = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 10), new THREE.MeshLambertMaterial({ color: '#fff3c4', emissive: '#000' })); lhLamp.position.y = 10; lh.add(lhLamp); lamps.push(lhLamp);
  const lhRoof = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.1, 14), mat('#e8455a')); lhRoof.position.y = 11.2; lh.add(lhRoof);
  const lhRock = sph(3, '#b9b5ad', 1.3, 0.35, 1.3); add(lh, lhRock, 0, 0.2, 0);
  obstacles.push({ x: LM.lighthouse.x, z: LM.lighthouse.z, r: 2.4 });
  const lhLabel = makeLabel('とうだい', '#e8455a'); lhLabel.position.set(LM.lighthouse.x, 13.4, LM.lighthouse.z); g.add(lhLabel);
  // ふうりんの じんじゃ
  const sh = new THREE.Group(); sh.position.set(LM.shrine.x, 0, LM.shrine.z); g.add(sh);
  for (const sx of [-1.6, 1.6]) { const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 4, 10), mat('#d9452f')); pil.position.set(sx, 2, 0); sh.add(pil); }
  const kasagi = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.35, 0.5), mat('#2a2a2f')); kasagi.position.set(0, 4.15, 0); sh.add(kasagi);
  const nuki = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.25, 0.3), mat('#d9452f')); nuki.position.set(0, 3.4, 0); sh.add(nuki);
  const hokora = new THREE.Mesh(new THREE.BoxGeometry(2, 1.6, 1.8), mat('#c8935a')); hokora.position.set(0, 0.8, -5); sh.add(hokora);
  const hroof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1, 4), mat('#6a4a38')); hroof.rotation.y = Math.PI / 4; hroof.position.set(0, 2.1, -5); sh.add(hroof);
  const chimes = [];
  for (let i = 0; i < 5; i++) {
    const c = new THREE.Group(); c.position.set(-2 + i * 1.0, 3.0, -3.4);
    add(c, sph(0.18, '#bfe8ff', 1, 1, 1), 0, 0, 0);
    const tan = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.01), mat('#ffd84d')); tan.position.y = -0.4; c.add(tan);
    sh.add(c); chimes.push(c);
  }
  const rope = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.05, 0.05), mat('#6b5a4a')); rope.position.set(0, 3.2, -3.4); sh.add(rope);
  for (const sx of [-2.6, 2.6]) { add(sh, sph(0.5, '#b9b5ad', 0.8, 1.2, 0.8), sx, 0.5, -2.2); }
  obstacles.push({ x: LM.shrine.x - 1.6, z: LM.shrine.z, r: 0.4 }, { x: LM.shrine.x + 1.6, z: LM.shrine.z, r: 0.4 }, { x: LM.shrine.x, z: LM.shrine.z - 5, r: 1.3 });
  const shLabel = makeLabel('ふうりんの じんじゃ', '#d9452f'); shLabel.position.set(LM.shrine.x, 5.6, LM.shrine.z); g.add(shLabel);
  // うみのいえ
  const hu = new THREE.Group(); hu.position.set(LM.hut.x, 0, LM.hut.z); g.add(hu);
  box3(hu, 4.6, 0.2, 3.4, '#c8935a', 0, 0.1, 0);
  for (const [x, z] of [[-2, -1.4], [2, -1.4], [-2, 1.4], [2, 1.4]]) box3(hu, 0.2, 2.4, 0.2, '#8a5a36', x, 1.2, z);
  box3(hu, 4.8, 0.2, 3.6, '#4fb8c9', 0, 2.5, 0);
  const hr = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.3, 4), mat('#ffd84d')); hr.rotation.y = Math.PI / 4; hr.position.y = 3.2; hr.scale.set(1, 1, 0.78); hu.add(hr);
  box3(hu, 2.4, 0.9, 0.4, '#ffffff', 0, 1.0, 1.4);
  add(hu, sph(0.35, '#ff7a8a', 1, 0.5, 1), -0.5, 1.5, 1.4); add(hu, sph(0.3, '#ffd84d', 1, 0.5, 1), 0.4, 1.5, 1.4);
  obstacles.push({ x: LM.hut.x, z: LM.hut.z, r: 2.2 });
  const huLabel = makeLabel('うみの いえ', '#4fb8c9'); huLabel.position.set(LM.hut.x, 5.2, LM.hut.z); g.add(huLabel);

  // ---- あつめもの (おねがいミッション用) ----
  const items = [];
  const ITEM_DEF = {
    shell: () => { const m = new THREE.Group(); add(m, sph(0.26, '#ffd0d8', 1.2, 0.7, 1), 0, 0.15, 0); add(m, sph(0.14, '#ffffff', 1, 0.5, 1), 0, 0.28, 0.05); return m; },
    sasa: () => { const m = new THREE.Group(); for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.0, 6), mat('#8fc860')); c.position.set((i - 1) * 0.13, 0.5, 0); c.rotation.z = (i - 1) * 0.12; m.add(c); } add(m, sph(0.3, '#6cc455', 0.9, 0.3, 0.5), 0, 1.0, 0); return m; },
    stone: () => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), new THREE.MeshLambertMaterial({ color: '#7ad7ff', emissive: '#2a6a9a' })); m.position.y = 0.4; const g2 = new THREE.Group(); g2.add(m); return g2; },
    feather: () => { const m = new THREE.Group(); const f = sph(0.4, '#5ab8ff', 0.25, 1, 0.08); f.rotation.z = 0.5; add(m, f, 0, 0.5, 0); return m; },
    mushroom: () => { const m = new THREE.Group(); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.35, 8), mat('#fff4e0')); st.position.y = 0.18; m.add(st); add(m, sph(0.28, '#b58cff', 1, 0.7, 1), 0, 0.42, 0); const gl = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshBasicMaterial({ color: '#d9c4ff', transparent: true, opacity: 0.35 })); gl.position.y = 0.42; gl.scale.set(1.4, 1.1, 1.4); m.add(gl); return m; },
    herb: () => { const m = new THREE.Group(); for (let i = 0; i < 4; i++) { const b = sph(0.1, '#7fe05a', 0.35, 1.8, 0.35); b.rotation.z = (i - 1.5) * 0.35; add(m, b, (i - 1.5) * 0.1, 0.25, 0); } return m; },
  };
  function itemSpot(kind, x, z) {
    const m = ITEM_DEF[kind](); m.position.set(x, 0, z); g.add(m);
    items.push({ kind, mesh: m, x, z, back: 0, ph: r() * 6 });
  }
  const free = (x, z, pad = 0.8) => !obstacles.some(o => Math.hypot(o.x - x, o.z - z) < o.r + pad);
  function scatter(kind, n, cx, cz, rx, rz, tries = 80) {
    let k = 0, t = 0;
    while (k < n && t++ < tries) {
      const x = cx + (r() - 0.5) * 2 * rx, z = cz + (r() - 0.5) * 2 * rz;
      if (landDepth(x, z) > 3 && free(x, z)) { itemSpot(kind, x, z); k++; }
    }
  }
  scatter('shell', 16, 0, 42, 22, 4);
  scatter('sasa', 12, -20, -13, 6, 7); scatter('sasa', 2, -26, 2, 4, 4);
  scatter('stone', 3, 14, -6, 6, 5); scatter('stone', 3, 27, 10, 5, 8); scatter('stone', 3, 24, -28, 6, 3); scatter('stone', 2, -8, 6, 3, 3);
  scatter('feather', 10, 0, 0, 30, 24, 200);
  scatter('mushroom', 8, 0, -28, 20, 4); scatter('mushroom', 3, -26, -24, 5, 4);
  scatter('herb', 12, 8, 4, 22, 14, 200);

  // ---- くらしのはま (にしの はま・おうちを たてる ばしょ) ----
  const r2 = rng(99), HP = HOME_PLOT;
  const onGrass = (x, z, pad = 2) => LAND.some(c => Math.hypot(x - c.x, z - c.z) < c.g - pad);
  const bridge = new THREE.Mesh(new THREE.CircleGeometry(10, 40), grassMat); bridge.rotation.x = -Math.PI / 2; bridge.position.set(-44, 0, -1); g.add(bridge);
  const lp = new THREE.Mesh(new THREE.PlaneGeometry(36, 2.4), mat('#ead7a4')); lp.rotation.x = -Math.PI / 2; lp.position.set(-52, 0.016, -2); g.add(lp);
  const lp2 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 5), mat('#ead7a4')); lp2.rotation.x = -Math.PI / 2; lp2.position.set(HP.x, 0.017, HP.z + 5.8); g.add(lp2);
  for (let n = 0, t = 0; n < 34 && t++ < 1500;) {
    const x = -66 + (r2() - 0.5) * 46, z = 4 + (r2() - 0.5) * 46;
    if (x > -40 || !onGrass(x, z, 3.5) || Math.hypot(x - HP.x, z - HP.z) < 10.5 || (Math.abs(z + 2) < 2.8 && x < -33) || Math.hypot(x + 31, z - 8) < 6 || Math.hypot(x - FARM.x, (z - FARM.z) * 1.1) < 10.5 || Math.hypot(x - GREAT_TREE.x, z - GREAT_TREE.z) < 13) continue;
    if (obstacles.some(o => Math.hypot(o.x - x, o.z - z) < 3.4)) continue;
    tree(x, z, 0.85 + r2() * 0.5, r2() < 0.25, r2); n++;
  }
  for (let i = 0; i < 60; i++) {
    const x = -64 + (r2() - 0.5) * 38, z = 2 + (r2() - 0.5) * 38;
    if (x > -42 || !onGrass(x, z, 2) || (Math.abs(z + 2) < 1.8) || Math.hypot(x - HP.x, z - HP.z) < 5.4 || obstacles.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 0.5)) continue;
    if (i % 5 === 0) flower(x, z, true); else add(g, sph(0.35, '#6cc455', 1.2, 0.7, 1.2), x, 0.18, z);
  }
  for (const [x, z] of [[-40, -4], [-60, -4.2], [-72, 3]]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.4, 6), mat('#6b5a4a')); p.position.set(x, 1.2, z); g.add(p);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), new THREE.MeshLambertMaterial({ color: '#fff3c4', emissive: '#000' })); l.position.set(x, 2.5, z); g.add(l); lamps.push(l);
  }
  scatter('herb', 6, -64, 2, 14, 14, 120); scatter('feather', 4, -64, 2, 14, 14, 120); scatter('mushroom', 3, -70, 10, 8, 5, 80);
  // ---- にしの おおきな き と おもいでの おはなばたけ ----
  const T = GREAT_TREE;
  const lampW = (x, z) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.2, 6), mat('#6b5a4a')); p.position.set(x, 1.1, z); g.add(p); const l = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), new THREE.MeshLambertMaterial({ color: '#fff3c4', emissive: '#000' })); l.position.set(x, 2.3, z); g.add(l); lamps.push(l); };
  const tg = new THREE.Group(); tg.position.set(T.x, 0, T.z); g.add(tg);
  const moss = new THREE.Mesh(new THREE.CircleGeometry(6, 36), mat('#69b358')); moss.rotation.x = -Math.PI / 2; moss.position.y = 0.011; tg.add(moss);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.5, 7, 20), mat('#7a5230')); trunk.position.y = 3.5; tg.add(trunk);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.3; const rt = add(tg, sph(0.7, '#6a4528', 2.4, 0.5, 0.9), Math.cos(a) * 2.7, 0.2, Math.sin(a) * 2.7); rt.rotation.y = -a; }
  for (const [x, y, z, rr, c] of [[0, 8.4, 0, 3.7, '#4aa84a'], [-2.6, 7.7, 1.1, 2.7, '#58b84a'], [2.7, 7.8, -0.7, 2.8, '#6cc455'], [1, 9.9, 1.4, 2.5, '#58b84a'], [-1.4, 9.5, -1.8, 2.4, '#4aa84a'], [-3.6, 8.7, -1.5, 2.1, '#6cc455']]) add(tg, sph(rr, c, 1, 0.85, 1), x, y, z);
  for (let i = 0; i < 16; i++) { const a = r2() * 6.28, h = 7 + r2() * 3.6; add(tg, sph(0.16, i % 3 ? '#ffe0ea' : '#ffffff'), Math.cos(a) * (2.4 + r2() * 2), h, Math.sin(a) * (2.4 + r2() * 2) + 0.8); }
  { // みなみの ほらあな (かざり。なかには はいれない)
    const sh = new THREE.Shape(); sh.moveTo(-0.85, 0); sh.lineTo(-0.85, 1.2); sh.absarc(0, 1.2, 0.85, Math.PI, 0, true); sh.lineTo(0.85, 0); sh.closePath();
    const hole = new THREE.Mesh(new THREE.ShapeGeometry(sh, 16), new THREE.MeshBasicMaterial({ color: '#1a0f08' })); hole.position.set(0, 0.02, 2.46); tg.add(hole);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.17, 8, 22, Math.PI), mat('#a9774a')); arch.position.set(0, 1.2, 2.48); tg.add(arch);
    for (const sx of [-0.9, 0.9]) { const po = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 1.2, 8), mat('#a9774a')); po.position.set(sx, 0.6, 2.48); tg.add(po); }
  }
  obstacles.push({ x: T.x, z: T.z, r: 2.7 });
  { // おもいでの おはなばたけ: きの まわりに ぐるっと (かざり。たくさんの おはなを まとめて えがく)
    const FL = [];
    for (let t = 0; FL.length < 520 && t < 8000; t++) {
      const a = r2() * Math.PI * 2, d = 2.9 + Math.sqrt(r2()) * 8.5, x = T.x + Math.cos(a) * d, z = T.z + Math.sin(a) * d * 0.92;
      if (landDepth(x, z) < 3.5 || Math.hypot(x - HP.x, z - HP.z) < 7.5) continue;
      FL.push([x, z]);
    }
    const n = FL.length;
    const stemI = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 5), new THREE.MeshLambertMaterial({ color: '#5aa84a' }), n);
    const petI = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 6, 5), new THREE.MeshLambertMaterial({ color: 0xffffff }), n * 5);
    const cenI = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 6, 5), new THREE.MeshLambertMaterial({ color: '#ffb020' }), n);
    const m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), p0 = new THREE.Vector3(), s0 = new THREE.Vector3(), cc = new THREE.Color();
    const PET = ['#ffffff', '#fff2a8', '#ffd0e0', '#d9c8ff', '#ffffff', '#ffb3c6', '#b8dcff'];
    FL.forEach(([x, z], i) => {
      const s = 0.8 + r2() * 0.8;
      m4.compose(p0.set(x, 0.2 * s, z), q0, s0.set(1, s, 1)); stemI.setMatrixAt(i, m4);
      m4.compose(p0.set(x, 0.44 * s, z), q0, s0.set(1, 0.8 * s, 1)); cenI.setMatrixAt(i, m4);
      cc.set(PET[Math.floor(r2() * PET.length)]);
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; m4.compose(p0.set(x + Math.cos(a) * 0.12 * s, 0.42 * s, z + Math.sin(a) * 0.12 * s), q0, s0.set(s, 0.6 * s, s)); petI.setMatrixAt(i * 5 + k, m4); petI.setColorAt(i * 5 + k, cc); }
    });
    for (const m of [stemI, petI, cenI]) { m.frustumCulled = false; m.instanceMatrix.needsUpdate = true; g.add(m); }
    petI.instanceColor.needsUpdate = true;
  }

  // ---- はたけ ----
  const FM = FARM, farmG = new THREE.Group(); farmG.position.set(FM.x, 0, FM.z); g.add(farmG);
  box3(farmG, 11.8, 0.06, 8.6, '#a98b60', 0, 0.03, 0);
  for (const [w, d, x, z] of [[2.4, FM.z - 4.7 + 2, FM.x, (FM.z - 4.7 - 2) / 2], [13, 2.4, -76.5, -2]]) { const pp = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat('#ead7a4')); pp.rotation.x = -Math.PI / 2; pp.position.set(x, 0.016, z); g.add(pp); }
  const soilDry = mat('#8a6a44'), soilWet = mat('#4e3624');
  const farmPlots = [];
  for (const pz of [-2.1, 2.1]) for (const px of [-3.6, 0, 3.6]) {
    const soil = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.14, 2.7), soilDry); soil.position.set(px, 0.1, pz); farmG.add(soil);
    box3(farmG, 2.9, 0.18, 0.1, '#7a5a30', px, 0.09, pz - 1.4); box3(farmG, 2.9, 0.18, 0.1, '#7a5a30', px, 0.09, pz + 1.4); box3(farmG, 0.1, 0.18, 2.9, '#7a5a30', px - 1.4, 0.09, pz); box3(farmG, 0.1, 0.18, 2.9, '#7a5a30', px + 1.4, 0.09, pz);
    const cg = new THREE.Group(); cg.position.set(px, 0.17, pz); farmG.add(cg);
    farmPlots.push({ x: FM.x + px, z: FM.z + pz, soil, cg, sig: '' });
  }
  for (let i = -4; i <= 4; i++) { // さく (きたの まんなかは でいりぐち)
    for (const [fx, fz] of [[i * 1.4, 4.7], [i * 1.4, -4.7]]) {
      if (fz < 0 && Math.abs(fx) < 1.5) continue;
      box3(farmG, 0.18, 0.9, 0.18, '#c8935a', fx, 0.45, fz); obstacles.push({ x: FM.x + fx, z: FM.z + fz, r: 0.32 });
    }
    box3(farmG, 1.4, 0.1, 0.1, '#c8935a', i * 1.4 + 0.7, 0.65, 4.7); if (Math.abs(i * 1.4 + 0.7) > 1.5) box3(farmG, 1.4, 0.1, 0.1, '#c8935a', i * 1.4 + 0.7, 0.65, -4.7);
  }
  for (const sx of [-6.3, 6.3]) for (let k = -3; k <= 3; k++) { box3(farmG, 0.18, 0.9, 0.18, '#c8935a', sx, 0.45, k * 1.4); obstacles.push({ x: FM.x + sx, z: FM.z + k * 1.4, r: 0.32 }); }
  for (const sx of [-6.3, 6.3]) { box3(farmG, 0.1, 0.1, 9.4, '#c8935a', sx, 0.65, 0); }
  { // かかし
    const sc = new THREE.Group(); sc.position.set(-4.8, 0, 0.4 + 0); farmG.add(sc);
    box3(sc, 0.12, 2.0, 0.12, '#8a5a36', 0, 1.0, 0); box3(sc, 1.5, 0.1, 0.1, '#8a5a36', 0, 1.5, 0);
    add(sc, sph(0.28, '#f2d8a8'), 0, 2.15, 0); const hat = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.4, 12), mat('#d9b050')); hat.position.y = 2.5; sc.add(hat); box3(sc, 0.9, 0.05, 0.9, '#d9b050', 0, 2.33, 0).scale.set(1, 1, 1);
    add(sc, sph(0.34, '#c26a4a', 1, 1.3, 0.7), 0, 1.3, 0.04);
  }
  box3(farmG, 0.7, 0.45, 0.5, '#c8935a', 5.3, 0.22, 3.6); add(farmG, sph(0.28, '#ff7a3a'), 5.1, 0.55, 3.6); add(farmG, sph(0.24, '#e8453a'), 5.55, 0.52, 3.55);
  { const wc = new THREE.Group(); wc.position.set(5.2, 0, -3.4); farmG.add(wc); cyl3(wc, 0.3, 0.3, 0.5, '#5aa0d8', 0, 0.25, 0); box3(wc, 0.5, 0.06, 0.06, '#5aa0d8', 0.4, 0.5, 0).rotation.z = -0.5; }
  const farmLabel = makeLabel('🌱 はたけ', '#7aa84f'); farmLabel.position.set(FM.x, 3.4, FM.z + 5.8); farmLabel.visible = false; g.add(farmLabel);
  lampW(FM.x - 2.6, FM.z - 6.0);
  const CROPV = {
    carrot: { leaf: '#6cc455', fruit: '#ff8a2a', shape: 'cone' },
    tomato: { leaf: '#4fa850', fruit: '#e8352f', shape: 'ball' },
    strawberry: { leaf: '#58b84a', fruit: '#ff4a6a', shape: 'berry' },
    pumpkin: { leaf: '#4aa04a', fruit: '#ff9a2a', shape: 'pump' },
  };
  function buildCrop(cg, crop, stage, bug) {
    while (cg.children.length) cg.remove(cg.children[0]);
    const v = CROPV[crop]; if (!v) return;
    if (stage === 0) { add(cg, sph(0.28, '#5a3e28', 1.6, 0.5, 1.6), 0, 0.05, 0); return; }
    const sc = [0, 0.45, 0.8, 1][stage];
    const nL = v.shape === 'pump' ? 3 : 5;
    for (let i = 0; i < nL; i++) { const a = i / nL * Math.PI * 2; add(cg, sph(0.34 * sc, v.leaf, 1.4, 0.35, 0.9), Math.cos(a) * 0.4 * sc, 0.25 * sc, Math.sin(a) * 0.4 * sc).rotation.y = -a; }
    if (v.shape === 'ball') { box3(cg, 0.05, 1.2 * sc, 0.05, '#8a5a36', 0.5, 0.6 * sc, 0.5); }
    if (stage >= 3) {
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * Math.PI * 2 + 0.5, x = Math.cos(a) * 0.55, z = Math.sin(a) * 0.55;
        if (v.shape === 'cone') { const c = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.42, 8), mat(v.fruit)); c.position.set(x * 0.7, 0.14, z * 0.7); c.rotation.x = Math.PI; cg.add(c); add(cg, sph(0.15, v.leaf, 1, 0.5, 1), x * 0.7, 0.33, z * 0.7); }
        else if (v.shape === 'ball') add(cg, sph(0.17, v.fruit), x, 0.45 + (i % 2) * 0.25, z);
        else if (v.shape === 'berry') { add(cg, sph(0.13, v.fruit, 1, 1.15, 1), x, 0.16, z); add(cg, sph(0.05, '#ffffff'), x, 0.2, z + 0.09); }
        else if (i < 2) { add(cg, sph(0.5, v.fruit, 1.15, 0.8, 1.15), x * 0.9, 0.3, z * 0.9); }
      }
    }
    if (bug && stage >= 1) for (let i = 0; i < 3; i++) add(cg, sph(0.07, i % 2 ? '#2a2a2a' : '#7a2a2a', 1, 0.8, 1.3), 0.25 - i * 0.22, 0.34 * sc + 0.08, 0.18 + i * 0.1);
  }
  function setFarmPlot(i, crop, stage, wet, bug) {
    const p = farmPlots[i]; if (!p) return;
    const sig = `${crop}|${stage}|${wet ? 1 : 0}|${bug ? 1 : 0}`; if (sig === p.sig) return;
    p.sig = sig; p.soil.material = wet ? soilWet : soilDry;
    if (!crop) { while (p.cg.children.length) p.cg.remove(p.cg.children[0]); return; }
    buildCrop(p.cg, crop, stage, bug);
  }


  // ---- わたしの おうち (たてる たびに おおきく なる) ----
  const hx = new THREE.Group(); hx.position.set(HP.x, 0, HP.z); g.add(hx);
  const hs = [0, 1, 2, 3].map(() => { const q = new THREE.Group(); q.visible = false; hx.add(q); return q; });
  const lampOn = (parent, x, z) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.2, 6), mat('#6b5a4a')); p.position.set(x, 1.1, z); parent.add(p); const l = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), new THREE.MeshLambertMaterial({ color: '#fff3c4', emissive: '#000' })); l.position.set(x, 2.3, z); parent.add(l); lamps.push(l); };
  { // 0: たてる ばしょ
    const b = hs[0];
    const patch = new THREE.Mesh(new THREE.CircleGeometry(4.6, 28), mat('#b6dd84')); patch.rotation.x = -Math.PI / 2; patch.position.y = 0.012; b.add(patch);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2, a2 = (i + 0.5) / 8 * Math.PI * 2;
      box3(b, 0.16, 0.9, 0.16, '#c8935a', Math.cos(a) * 4.4, 0.45, Math.sin(a) * 4.4);
      const rp = box3(b, 0.06, 0.06, 3.3, '#efe0b0', Math.cos(a2) * 4.4 * 0.98, 0.75, Math.sin(a2) * 4.4 * 0.98); rp.rotation.y = -a2;
    }
    box3(b, 1.6, 0.25, 0.7, '#c8935a', -1.6, 0.13, 0.6); box3(b, 1.6, 0.25, 0.7, '#d4a470', -1.6, 0.38, 0.6).rotation.y = 0.3;
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 6), mat('#6b5a4a')); sh.position.set(1.2, 0.65, 0.4); sh.rotation.z = 0.25; b.add(sh);
    box3(b, 0.3, 0.4, 0.06, '#9aa0a8', 1.5, 0.15, 0.4);
    box3(b, 0.1, 1.5, 0.1, '#6b5a4a', 0, 0.75, 2.4); box3(b, 1.5, 0.7, 0.1, '#ffe9a8', 0, 1.5, 2.4); box3(b, 1.3, 0.1, 0.12, '#e8795a', 0, 1.62, 2.4); box3(b, 1.0, 0.1, 0.12, '#e8795a', 0, 1.38, 2.4);
  }
  { // 1: テント
    const b = hs[1];
    const sheet = new THREE.Mesh(new THREE.CircleGeometry(3.4, 28), mat('#e9d7a8')); sheet.rotation.x = -Math.PI / 2; sheet.position.y = 0.014; b.add(sheet);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.5, 3.0, 8), mat('#ffd9a0')); cone.position.y = 1.5; b.add(cone);
    for (let i = 0; i < 4; i++) { const st = new THREE.Mesh(new THREE.ConeGeometry(2.52, 3.02, 8, 1, true, i * Math.PI / 2, Math.PI / 4), mat('#ff8a7a')); st.position.y = 1.5; b.add(st); }
    const flap = box3(b, 1.0, 1.55, 0.1, '#6a4a30', 0, 0.8, 1.9); flap.rotation.x = -0.5;
    box3(b, 0.05, 1.2, 0.05, '#6b5a4a', 0, 3.4, 0); box3(b, 0.7, 0.4, 0.04, '#e8455a', 0.38, 3.8, 0);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(b, sph(0.2, '#b9b5ad', 1.2, 0.7, 1), 3.2 + Math.cos(a) * 0.5, 0.1, 1.8 + Math.sin(a) * 0.5); }
    for (const [x, c] of [[0, '#ff9a2a'], [0.1, '#ffd84d']]) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 8), new THREE.MeshBasicMaterial({ color: c })); f.position.set(3.2 + x, 0.35, 1.8); b.add(f); }
    for (const [x, z] of [[2.3, 3.3], [4.2, 3.1]]) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 8), mat('#8a5a36')); lg.rotation.z = Math.PI / 2; lg.position.set(x, 0.2, z); b.add(lg); }
    lampOn(b, -2.6, 2.4);
  }
  { // 2: こじんまりした おうち
    const b = hs[2];
    box3(b, 6.5, 0.4, 5.1, '#c8b896', 0, 0.2, 0); box3(b, 6.4, 2.8, 5.0, '#fbf1da', 0, 1.8, 0);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.3, 2.5, 4), mat('#e8795a')); roof.rotation.y = Math.PI / 4; roof.position.y = 4.4; roof.scale.set(1, 1, 0.84); b.add(roof);
    box3(b, 1.1, 2.0, 0.14, '#8a5a36', 0, 1.2, 2.55); add(b, sph(0.08, '#ffd84d'), 0.38, 1.15, 2.66);
    box3(b, 2.0, 0.12, 0.9, '#e8455a', 0, 2.45, 2.9).rotation.x = 0.22;
    for (const sx of [-2.1, 2.1]) {
      box3(b, 1.0, 1.0, 0.1, '#cfeeff', sx, 2.0, 2.52); box3(b, 1.2, 0.1, 0.16, '#f4ead8', sx, 1.45, 2.58); box3(b, 0.06, 1.0, 0.12, '#f4ead8', sx, 2.0, 2.58);
      box3(b, 1.2, 0.3, 0.3, '#c8935a', sx, 1.2, 2.75); for (let k = 0; k < 3; k++) add(b, sph(0.13, ['#ff7a9a', '#ffd84d', '#ffffff'][k], 1, 1, 1), sx - 0.4 + k * 0.4, 1.45, 2.78);
    }
    box3(b, 0.8, 2.0, 0.8, '#a8a39a', 1.9, 5.0, -1.0); box3(b, 1.6, 0.04, 0.8, '#c26a4a', 0, 0.03, 3.2);
    box3(b, 0.1, 1.0, 0.1, '#6b5a4a', 3.7, 0.5, 3.4); box3(b, 0.5, 0.35, 0.35, '#e8455a', 3.7, 1.1, 3.4);
    for (let i = 0; i < 6; i++) box3(b, 0.16, 0.8, 0.12, '#f4ead8', -4.4 - i * 0.5 + 0.0, 0.4, 3.0);
    lampOn(b, -3.8, 3.4);
  }
  { // 3: おおきな おうち
    const b = hs[3];
    box3(b, 9.2, 0.6, 6.6, '#b9ad98', 0, 0.3, -0.4); box3(b, 9.0, 3.4, 6.4, '#f6e6c8', 0, 2.2, -0.4);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(7.6, 2.9, 4), mat('#5b7fb8')); roof.rotation.y = Math.PI / 4; roof.position.y = 5.35; roof.scale.set(1, 1, 0.8); b.add(roof);
    box3(b, 4.2, 0.25, 1.6, '#c8935a', 0, 0.12, 3.9); for (const sx of [-1.9, 1.9]) { const po = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.8, 8), mat('#f4ead8')); po.position.set(sx, 1.5, 4.5); b.add(po); }
    box3(b, 4.6, 0.18, 1.9, '#5b7fb8', 0, 2.95, 3.9);
    box3(b, 1.3, 2.3, 0.14, '#6a4328', 0, 1.25, 2.9); add(b, sph(0.08, '#ffd84d'), 0.42, 1.2, 3.0);
    for (const sx of [-3.3, 3.3, -3.3 - 0.0]) { box3(b, 1.1, 1.3, 0.1, '#cfeeff', sx, 2.2, 2.82); box3(b, 1.3, 0.1, 0.16, '#f4ead8', sx, 1.5, 2.88); box3(b, 0.06, 1.3, 0.12, '#f4ead8', sx, 2.2, 2.88); }
    box3(b, 0.9, 2.6, 0.9, '#a8a39a', -2.8, 6.0, -1.8); box3(b, 0.9, 2.0, 0.9, '#a8a39a', 3.0, 5.6, -1.8);
    for (let i = 0; i < 16; i++) { const x = -5.6 + i * 0.75; if (Math.abs(x) < 1.6) continue; box3(b, 0.16, 0.8, 0.12, '#f4ead8', x, 0.4, 5.9); }
    box3(b, 4.0, 0.1, 0.1, '#f4ead8', -3.7, 0.55, 5.9); box3(b, 4.0, 0.1, 0.1, '#f4ead8', 3.7, 0.55, 5.9);
    for (const [x, z, c] of [[-4.9, 3.6, '#ff7a9a'], [-4.1, 4.2, '#ffd84d'], [4.1, 4.2, '#b58cff'], [4.9, 3.6, '#ff9d5c'], [-3.0, 4.6, '#ffffff'], [3.0, 4.6, '#ff7a9a']]) { add(b, sph(0.45, '#4fa850', 1, 0.8, 1), x, 0.3, z); add(b, sph(0.2, c), x, 0.7, z); }
    box3(b, 0.1, 1.1, 0.1, '#6b5a4a', 5.2, 0.55, 5.0); box3(b, 0.55, 0.4, 0.4, '#5b7fb8', 5.2, 1.2, 5.0);
    lampOn(b, -2.8, 5.0); lampOn(b, 2.8, 5.0);
  }
  const HOME_DOOR = [null, 2.9, 3.5, 4.0];
  const HOME_OBS = [[], [[0, 0, 2.2]], [[-2.2, 0, 2.5], [0, 0, 2.5], [2.2, 0, 2.5]], [[-3.4, -0.4, 3.1], [-1.1, -0.4, 3.1], [1.1, -0.4, 3.1], [3.4, -0.4, 3.1]]];
  const homeObs = [0, 1, 2, 3].map(() => ({ x: 1e5, z: 1e5, r: 0.01 }));
  obstacles.push(...homeObs);
  const homeLabelBuild = makeLabel('🏕 おうちを たてよう（ポンの おみせで）', '#4f9f5a'), homeLabelMine = makeLabel('🏠 わたしの おうち', '#4f86c6');
  homeLabelBuild.position.set(HP.x, 3.4, HP.z); homeLabelMine.position.set(HP.x, 6, HP.z); homeLabelBuild.visible = homeLabelMine.visible = false; g.add(homeLabelBuild, homeLabelMine);
  let homeStage = -1;
  function setHome(stage) {
    stage = Math.max(0, Math.min(3, stage | 0)); homeStage = stage;
    hs.forEach((q, i) => { q.visible = i === stage; });
    homeObs.forEach((o, i) => { const d = HOME_OBS[stage][i]; if (d) { o.x = HP.x + d[0]; o.z = HP.z + d[1]; o.r = d[2]; } else { o.x = 1e5; o.z = 1e5; o.r = 0.01; } });
    homeLabelMine.position.y = [0, 4.6, 6.6, 8.4][stage];
  }
  setHome(0);
  const homeDoorPos = stage => ({ x: HP.x, z: HP.z + HOME_DOOR[Math.max(1, stage)] });

  // ---- 季節の飾り ----
  const decor = { tanabata: new THREE.Group(), obon: new THREE.Group(), newyear: new THREE.Group() };
  for (const d of Object.values(decor)) { d.visible = false; g.add(d); }
  const tzCols = ['#ff8fa3', '#ffd84d', '#7ec8ff', '#b58cff', '#8fe08a'];
  function tanzakuBamboo(parent, x, z, h = 6) {
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, h, 6), mat('#79b050')); stalk.position.set(x, h / 2, z); stalk.rotation.z = 0.08; parent.add(stalk);
    for (let i = 0; i < 6; i++) {
      add(parent, sph(0.55, '#6cc455', 1.5, 0.35, 0.6), x + (i % 2 ? 0.6 : -0.6), h - 0.4 - i * 0.7, z);
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.8, 0.02), mat(tzCols[i % tzCols.length])); t.position.set(x + (i % 2 ? 0.95 : -0.95), h - 1.1 - i * 0.7, z + 0.1); t.rotation.z = (i % 2 ? 1 : -1) * 0.1; parent.add(t);
    }
  }
  tanzakuBamboo(decor.tanabata, -6.5, -10.5); tanzakuBamboo(decor.tanabata, -8.2, -10.0, 5);
  const chochin = [];
  for (const [x, z] of [[-2.4, -9], [2.4, -9], [-2.4, -4.5], [2.4, -4.5], [-2.4, 1], [2.4, 1], [-2.4, 6], [2.4, 6]]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 6), mat('#6b5a4a')); p.position.set(x, 1.2, z); decor.obon.add(p);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), new THREE.MeshLambertMaterial({ color: '#ff6a4d', emissive: '#000' })); l.scale.set(1, 1.25, 1); l.position.set(x, 2.5, z); decor.obon.add(l);
    chochin.push(l);
  }
  for (const sx of [-1, 1]) {
    const k = new THREE.Group(); k.position.set(sx * 1.7, 0, -12.7);
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.9 + i * 0.35, 6), mat('#8fc860')); b.position.set((i - 1) * 0.2, 0.55 + i * 0.12, 0); b.rotation.z = (i - 1) * 0.04; k.add(b); }
    add(k, sph(0.4, '#3f8f4a', 1.2, 0.8, 1), 0, 1.4, 0.05);
    add(k, sph(0.1, '#ff5c7a'), 0.2, 1.4, 0.38);
    decor.newyear.add(k);
  }
  const kagami = new THREE.Group(); kagami.position.set(-6, 0, -9);
  add(kagami, sph(0.5, '#fffaf0', 1, 0.55, 1), 0, 0.25, 0); add(kagami, sph(0.35, '#fffaf0', 1, 0.55, 1), 0, 0.62, 0); add(kagami, sph(0.12, '#ff9d5c'), 0, 0.85, 0);
  decor.newyear.add(kagami);
  // 雪
  const NS = 1000, snowArr = new Float32Array(NS * 3);
  for (let i = 0; i < NS; i++) { snowArr[i * 3] = -22 + (r() - 0.5) * 130; snowArr[i * 3 + 1] = r() * 22; snowArr[i * 3 + 2] = (r() - 0.5) * 70; }
  const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute('position', new THREE.BufferAttribute(snowArr, 3));
  const snowPts = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 5, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false }));
  snowPts.visible = false; snowPts.frustumCulled = false; g.add(snowPts);
  let curEvent = 'none', curNight = 0;
  function setSeason(ev) {
    curEvent = ev;
    decor.tanabata.visible = ev === 'tanabata';
    decor.obon.visible = ev === 'obon';
    decor.newyear.visible = ev === 'newyear';
    const snowy = ev === 'snow' || ev === 'newyear';
    snowPts.visible = snowy; snowRoof.visible = snowy;
    for (const c of snowCaps) c.visible = snowy;
    grassMat.color.set(snowy ? '#eef5fb' : '#8fd36e');
    patchMats[0].color.set(snowy ? '#dfe9f3' : '#82c862'); patchMats[1].color.set(snowy ? '#f6fafe' : '#9adc78');
    sandMat.color.set(snowy ? '#f3efe6' : '#f4e2b0');
  }

  // くも
  const clouds = [];
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 4; k++) add(c, sph(1.4 + r(), '#ffffff', 1.3, 0.7, 1), k * 1.5 - 2, r() * 0.4, r() - 0.5);
    c.position.set((r() - 0.5) * 260, 18 + r() * 8, (r() - 0.5) * 220);
    g.add(c); clouds.push(c);
  }
  // ほし
  const sp = new Float32Array(300 * 3);
  for (let i = 0; i < 300; i++) {
    const a = r() * Math.PI * 2, e = 0.15 + r() * 1.2, d = 150;
    sp[i * 3] = Math.cos(a) * Math.cos(e) * d; sp[i * 3 + 1] = Math.sin(e) * d; sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * d;
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, transparent: true, opacity: 0, sizeAttenuation: false, fog: false }));
  g.add(stars);

  // ちょうちょ
  const butter = [];
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Group();
    const col = ['#ffd84d', '#ff9ad0', '#9ad0ff'][i % 3];
    for (const sd of [-1, 1]) { const w = sph(0.16, col, 1, 0.05, 1.2); const wg = new THREE.Group(); wg.add(w); w.position.x = sd * 0.16; wg.userData.sd = sd; b.add(wg); }
    b.userData = { cx: (r() - 0.5) * 30, cz: (r() - 0.5) * 24, ph: r() * 6 };
    g.add(b); butter.push(b);
  }

  // 時間帯
  const keys = [ // hour, sky, hemi, sun, sunColor
    [0, '#0f1a3a', 0.3, 0.12, '#8aa0ff'], [5, '#1d2850', 0.32, 0.14, '#8aa0ff'], [6.5, '#ffc7a0', 0.7, 0.6, '#ffd2a0'],
    [9, '#9bdcff', 1.0, 0.95, '#ffffff'], [16, '#9bdcff', 1.0, 0.95, '#ffffff'], [18, '#ff9f7a', 0.75, 0.7, '#ffb080'],
    [19.5, '#3a3868', 0.42, 0.2, '#a0a0ff'], [21, '#141c3c', 0.3, 0.12, '#8aa0ff'], [24, '#0f1a3a', 0.3, 0.12, '#8aa0ff'],
  ];
  const A = new THREE.Color(), B = new THREE.Color();
  function sample(h) {
    let i = 0; while (i < keys.length - 2 && h >= keys[i + 1][0]) i++;
    const k0 = keys[i], k1 = keys[i + 1];
    const t = Math.min(1, Math.max(0, (h - k0[0]) / (k1[0] - k0[0])));
    return { sky: A.set(k0[1]).lerp(B.set(k1[1]), t).clone(), hemi: k0[2] + (k1[2] - k0[2]) * t, sun: k0[3] + (k1[3] - k0[3]) * t, sunC: new THREE.Color(k0[4]).lerp(new THREE.Color(k1[4]), t) };
  }
  function applyTime(h, scene, hemi, sun) {
    const s = sample(h);
    scene.background = s.sky;
    scene.fog.color.copy(s.sky);
    hemi.intensity = s.hemi * 1.5; sun.intensity = s.sun * 1.6; sun.color.copy(s.sunC);
    const night = h < 6.2 || h > 19.2 ? 1 : (h > 17.5 ? (h - 17.5) / 1.7 : 0);
    stars.material.opacity = Math.max(0, Math.min(1, night));
    hemi.color.set('#ffffff').lerp(new THREE.Color('#7a8ad8'), Math.min(1, night) * 0.7);
    winMat.emissive.setRGB(0.9 * night, 0.7 * night, 0.3 * night);
    for (const l of lamps) l.material.emissive.setRGB(0.9 * night, 0.8 * night, 0.4 * night);
    curNight = night;
    for (const c of chochin) c.material.emissive.setRGB(0.3 + 0.7 * night, 0.1 + 0.2 * night, 0.05);
    return night;
  }

  function update(dt, t) {
    foamMat.opacity = 0.45 + Math.sin(t * 1.4) * 0.15;
    chimes.forEach((c, i) => { c.rotation.z = Math.sin(t * 2 + i * 1.3) * 0.12; });
    for (const it of items) {
      if (it.back > 0) { it.back -= dt; if (it.back <= 0) it.mesh.visible = true; }
      if (it.mesh.visible) { it.mesh.position.y = Math.sin(t * 2 + it.ph) * 0.06 + 0.05; it.mesh.rotation.y = t * 0.8 + it.ph; }
    }
    if (snowPts.visible) {
      const a = snowGeo.attributes.position;
      for (let i = 0; i < NS; i++) {
        let y = a.getY(i) - dt * (1.2 + (i % 5) * 0.2);
        if (y < 0) y += 22;
        a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t + i) * dt * 0.3);
      }
      a.needsUpdate = true;
    }
    for (const f of foams) f.scale.setScalar(1 + Math.sin(t * 1.4) * 0.006);
    for (const c of clouds) { c.position.x += dt * 0.6; if (c.position.x > 140) c.position.x = -140; }
    for (const b of butter) {
      const u = b.userData; u.ph += dt;
      b.position.set(u.cx + Math.sin(u.ph * 0.5) * 5, 1.2 + Math.sin(u.ph * 1.7) * 0.4, u.cz + Math.cos(u.ph * 0.4) * 4);
      b.rotation.y = u.ph * 0.5;
      b.children.forEach(w => { w.rotation.z = w.userData.sd * Math.abs(Math.sin(u.ph * 12)) * 0.9; });
    }
    for (const f of flowers) {
      if (f.back > 0) { f.back -= dt; if (f.back <= 0) f.mesh.visible = true; }
    }
  }

  // 地面に重ねた平らな板（芝のまだら・道・池のふち等）は、深度の精度が足りないと
  // 地面とチラついて見える（ポリゴンが扇風機のように回って見える）。高さ順に奥行きを少しずらして防ぐ。
  g.traverse(o => {
    if (!o.isMesh || Math.abs(o.rotation.x + Math.PI / 2) > 1e-3 || o.position.y < -0.03 || o.position.y > 0.1) return;
    o.material = o.material.clone();
    o.material.polygonOffset = true;
    o.material.polygonOffsetFactor = -2 - o.position.y * 200;
    o.material.polygonOffsetUnits = -2 - o.position.y * 200;
  });
  return { group: g, obstacles, flowers, update, applyTime, setSeason, items, landmarks: LM, setHome, homeDoorPos, farm: { plots: farmPlots, setPlot: setFarmPlot, label: farmLabel }, get homeStage() { return homeStage; }, homeLabelBuild, homeLabelMine, door: { x: 0, z: -12.9 }, shopDoor: { x: -10.4, z: 12.4 }, shopLabel };
}

// シアター用の舞台
export function buildStage(kind) {
  if (kind === 'cabin') { const I = buildInterior(); I.group.userData.waves = []; I.group.userData.tick = I.update; return I.group; }
  const g = new THREE.Group();
  const snowy = kind === 'snow', night = kind === 'night' || kind === 'tanabata';
  const r = rng(kind.length * 31 + 5);
  const groundColor = kind === 'beach' ? '#f4e2b0' : snowy ? '#eef5fb' : '#8fd36e';
  const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 48), mat(groundColor));
  ground.rotation.x = -Math.PI / 2; g.add(ground);
  const waves = [];
  if (kind === 'beach') {
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), mat('#5ec0ec'));
    sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.02, -40); g.add(sea);
    for (let i = 0; i < 3; i++) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(40, 1.2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
      w.rotation.x = -Math.PI / 2; w.position.set(0, 0.04, -10); g.add(w); waves.push(w);
    }
    for (let i = 0; i < 10; i++) add(g, sph(0.12, '#ffd0d8', 1, 0.5, 1), (r() - 0.5) * 16, 0.05, 2 + r() * 8);
  } else {
    for (let i = 0; i < 18; i++) {
      const a = r() * 6.28, d = 12 + r() * 14;
      const t = new THREE.Group(); t.position.set(Math.cos(a) * d, 0, -Math.abs(Math.sin(a)) * d - 4);
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 2, 8), mat('#8a5a36')); tr.position.y = 1; t.add(tr);
      add(t, sph(1.7, snowy ? '#e6eef5' : '#5cbc4c', 1, 0.95, 1), 0, 3, 0); g.add(t);
    }
    for (let i = 0; i < (snowy ? 0 : 40); i++) {
      const x = (r() - 0.5) * 24, z = (r() - 0.5) * 14;
      if (Math.abs(x) < 6 && Math.abs(z) < 3) continue;
      const col = ['#ff7a9a', '#ffd84d', '#ffffff', '#b58cff'][i % 4];
      add(g, sph(0.12, col, 1, 0.7, 1), x, 0.25, z);
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 4), mat('#5aa84a')); s.position.set(x, 0.12, z); g.add(s);
    }
  }
  if (night) {
    if (kind === 'night') {
    const table = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.2, 20), mat('#c8935a')); table.position.set(0, 0.75, 0); g.add(table);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.75, 8), mat('#a8733a')); leg.position.set(0, 0.37, 0); g.add(leg);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * 6.28;
      add(g, sph(0.28, i % 2 ? '#ffffff' : '#ffe6c0', 1, 0.3, 1), Math.cos(a) * 1.15, 0.9, Math.sin(a) * 1.15);
    }
    add(g, sph(0.35, '#ff7a5c', 1, 0.8, 1), 0, 1.0, 0);
    const lamp = new THREE.PointLight(0xffc477, 18, 14, 1.6); lamp.position.set(0, 2.6, 0); g.add(lamp);
    add(g, sph(0.22, '#fff3c4'), 0, 2.6, 0);
    }
    const sp = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) { const a = r() * 6.28, e = 0.2 + r() * 1.1; sp[i * 3] = Math.cos(a) * Math.cos(e) * 120; sp[i * 3 + 1] = Math.sin(e) * 120; sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * 120; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    g.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false })));
  }
  if (kind === 'tanabata') {
    const tz = ['#ff8fa3', '#ffd84d', '#7ec8ff', '#b58cff', '#8fe08a'];
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 8, 6), mat('#79b050')); stalk.position.set(0, 4, -3); stalk.rotation.z = 0.05; g.add(stalk);
    for (let i = 0; i < 10; i++) {
      add(g, sph(0.7, '#6cc455', 1.6, 0.35, 0.7), (i % 2 ? 0.8 : -0.8), 7.4 - i * 0.65, -3);
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.0, 0.02), new THREE.MeshBasicMaterial({ color: tz[i % 5] })); t.position.set((i % 2 ? 1.3 : -1.3), 6.6 - i * 0.65, -2.9); t.rotation.z = (i % 2 ? 1 : -1) * 0.1; g.add(t);
    }
    const lamp = new THREE.PointLight(0xffe0a0, 8, 16, 1.6); lamp.position.set(0, 4, 0); g.add(lamp);
    const sp = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) { const a = r() * 6.28, e = 0.2 + r() * 1.1; sp[i * 3] = Math.cos(a) * Math.cos(e) * 120; sp[i * 3 + 1] = Math.sin(e) * 120; sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * 120; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    g.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xfff6d0, size: 2.4, sizeAttenuation: false, fog: false })));
  }
  if (snowy) {
    const NS = 500, arr = new Float32Array(NS * 3);
    for (let i = 0; i < NS; i++) { arr[i * 3] = (r() - 0.5) * 40; arr[i * 3 + 1] = r() * 14; arr[i * 3 + 2] = (r() - 0.5) * 30 - 4; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 6, sizeAttenuation: false, depthWrite: false }));
    pts.frustumCulled = false; g.add(pts);
    g.userData.tick = (t, dt) => {
      const a = geo.attributes.position;
      for (let i = 0; i < NS; i++) { let y = a.getY(i) - dt * (1.0 + (i % 5) * 0.25); if (y < 0) y += 14; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t + i) * dt * 0.25); }
      a.needsUpdate = true;
    };
  }
  g.userData.waves = waves;
  return g;
}

// ---------- ログハウスの室内 (参照画像: 丸太の壁・暖炉・ソファ・ロッキングチェア・キッチン) ----------
let picTex = null;
function pictures() {
  if (picTex) return picTex;
  const mk = (draw) => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#e3d3b2'; g.fillRect(0, 0, 128, 128);
    draw(g);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const panda = mk(g => {
    g.fillStyle = '#2a2a2f'; g.beginPath(); g.arc(34, 38, 16, 0, 7); g.arc(94, 38, 16, 0, 7); g.fill();
    g.fillStyle = '#fbfbf8'; g.beginPath(); g.arc(64, 74, 42, 0, 7); g.fill();
    g.fillStyle = '#2a2a2f'; g.beginPath(); g.ellipse(46, 70, 11, 15, 0.5, 0, 7); g.ellipse(82, 70, 11, 15, -0.5, 0, 7); g.fill();
    g.beginPath(); g.ellipse(64, 90, 7, 5, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(46, 68, 3, 0, 7); g.arc(82, 68, 3, 0, 7); g.fill();
  });
  const leo = mk(g => {
    g.fillStyle = '#d8cfbf'; g.beginPath(); g.arc(40, 38, 14, 0, 7); g.arc(88, 38, 14, 0, 7); g.arc(64, 74, 42, 0, 7); g.fill();
    g.fillStyle = '#4a4a52'; for (const [x, y] of [[50, 48], [78, 50], [64, 40], [40, 70], [90, 72], [60, 62]]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
    g.fillStyle = '#26262e'; g.beginPath(); g.arc(50, 74, 4, 0, 7); g.arc(78, 74, 4, 0, 7); g.fill();
    g.fillStyle = '#e8a0a8'; g.beginPath(); g.arc(64, 88, 5, 0, 7); g.fill();
  });
  return (picTex = { panda, leo });
}

export function buildInterior() {
  const g = new THREE.Group();
  const obstacles = [];
  const box = (w, h, d, color, x, y, z, parent = g) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)); m.position.set(x, y, z); parent.add(m); return m; };
  const cyl = (rt, rb, h, color, x, y, z, parent = g, seg = 10) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color)); m.position.set(x, y, z); parent.add(m); return m; };
  const WOOD = ['#8a5a34', '#7a4e2c', '#94643a'];
  // 床
  for (let i = 0; i < 15; i++) box(0.96, 0.1, 10.6, i % 2 ? '#8a5a33' : '#7e5230', -6.7 + i * 0.96, -0.05, 0);
  // かべ (丸太)
  const logB = new THREE.CylinderGeometry(0.38, 0.38, 7.4, 10);
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(logB, mat(WOOD[i % 3])); l.rotation.z = Math.PI / 2; l.position.set(3.7, 0.38 + i * 0.74, -5.0); g.add(l); }
  box(7.4, 4.5, 0.3, '#ead6a8', -3.3, 2.25, -5.1);
  box(14.6, 0.5, 0.5, '#5a3a20', 0, 4.55, -5.0);
  const logS = new THREE.CylinderGeometry(0.38, 0.38, 10.4, 10);
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(logS, mat(WOOD[(i + 1) % 3])); l.rotation.x = Math.PI / 2; l.position.set(7.0, 0.38 + i * 0.74, 0); g.add(l); }
  box(0.3, 4.5, 10.4, '#ead6a8', -7.1, 2.25, 0);
  box(0.5, 0.5, 10.4, '#5a3a20', -7.0, 4.55, 0); box(0.5, 0.5, 10.4, '#5a3a20', 7.0, 4.55, 0);
  // ---- だんろ ----
  const fp = new THREE.Group(); fp.position.set(-6.2, 0, -1.2); g.add(fp);
  box(1.6, 3.8, 3.6, '#b5573a', 0, 1.9, 0, fp);
  for (let i = 0; i < 9; i++) box(1.62, 0.04, 3.62, '#8a3f2a', 0, 0.3 + i * 0.42, 0, fp);
  box(0.3, 1.4, 1.5, '#1c1210', 0.75, 0.85, 0, fp);
  box(0.4, 0.2, 4.2, '#5a3a20', 0.78, 2.9, 0, fp);
  const fireMat = new THREE.MeshBasicMaterial({ color: '#ff9a2a' });
  const flames = [];
  for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 8), i === 1 ? new THREE.MeshBasicMaterial({ color: '#ffd84d' }) : fireMat); f.position.set(0.7, 0.55, (i - 1) * 0.35); fp.add(f); flames.push(f); }
  for (const z of [-0.5, 0.2]) cyl(0.12, 0.12, 0.8, '#6a4a30', 0.55, 0.15, z, fp).rotation.x = Math.PI / 2;
  for (const z of [-1.4, 1.2]) { cyl(0.05, 0.05, 0.4, '#f4ead8', 0.9, 3.1, z, fp); add(fp, new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd84d' })), 0.9, 3.38, z); }
  const fireLight = new THREE.PointLight(0xff8a30, 9, 13, 1.8); fireLight.position.set(-5.2, 1.1, -1.2); g.add(fireLight);
  obstacles.push({ x: -5.9, z: -2.4, r: 0.9 }, { x: -5.9, z: -1.2, r: 0.9 }, { x: -5.9, z: 0.0, r: 0.9 });
  // ラグ・ソファ・テーブル
  const rug = new THREE.Mesh(new THREE.CircleGeometry(2.6, 32), mat('#cdb78a')); rug.rotation.x = -Math.PI / 2; rug.position.set(-3.6, 0.02, -1.2); g.add(rug);
  const rug2 = new THREE.Mesh(new THREE.RingGeometry(1.7, 1.9, 32), mat('#b79e6c')); rug2.rotation.x = -Math.PI / 2; rug2.position.set(-3.6, 0.025, -1.2); g.add(rug2);
  const sofa = new THREE.Group(); sofa.position.set(-2.4, 0, -1.2); sofa.rotation.y = -Math.PI / 2; g.add(sofa);
  box(3.2, 0.5, 1.3, '#c9a56a', 0, 0.4, 0, sofa); box(3.2, 1.0, 0.45, '#c9a56a', 0, 0.95, -0.55, sofa);
  for (const sx of [-1.7, 1.7]) box(0.45, 0.85, 1.4, '#bf9a5e', sx, 0.55, 0, sofa);
  box(1.3, 0.25, 1.0, '#d9b97c', -0.7, 0.78, 0.05, sofa); box(1.3, 0.25, 1.0, '#d9b97c', 0.7, 0.78, 0.05, sofa);
  add(sofa, sph(0.32, '#d8c090', 1, 1, 0.5), -1.1, 1.05, -0.2);
  obstacles.push({ x: -2.4, z: -2.5, r: 0.8 }, { x: -2.4, z: -1.2, r: 0.8 }, { x: -2.4, z: 0.1, r: 0.8 });
  box(1.4, 0.12, 0.9, '#5a3a20', -4.6, 0.55, -1.2); for (const [x, z] of [[-5.2, -1.6], [-4.0, -1.6], [-5.2, -0.8], [-4.0, -0.8]]) box(0.1, 0.5, 0.1, '#5a3a20', x, 0.28, z);
  const mug = cyl(0.1, 0.1, 0.2, '#f4ead8', -4.4, 0.7, -1.3); void mug;
  obstacles.push({ x: -4.6, z: -1.2, r: 0.6 });
  // ペンダントライト
  const pend = new THREE.Group(); pend.position.set(-3.4, 0, -1.2); g.add(pend);
  cyl(0.03, 0.03, 1.2, '#3a2a20', 0, 4.0, 0, pend, 6);
  const dome = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.45, 16, 1, true), new THREE.MeshLambertMaterial({ color: '#e8c070', side: THREE.DoubleSide, emissive: '#6a4a10' })); dome.position.set(0, 3.45, 0); pend.add(dome);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff0b0' })); bulb.position.set(0, 3.35, 0); pend.add(bulb);
  const l1 = new THREE.PointLight(0xffd890, 8, 14, 1.8); l1.position.set(-3.4, 3.2, -1.2); g.add(l1);
  // 額縁
  const P = pictures();
  [[-6.0, 2.6, P.panda], [-4.9, 3.0, P.leo], [-3.8, 2.4, P.panda], [-5.4, 1.6, P.panda], [-2.9, 3.0, P.leo]].forEach(([x, y, tex], i) => {
    box(0.95, 0.95, 0.08, '#5a3a20', x, y, -4.9);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.78), new THREE.MeshBasicMaterial({ map: tex })); pl.position.set(x, y, -4.85); g.add(pl);
  });
  // まど + カーテン + 植木
  box(1.8, 1.8, 0.1, '#f4ead8', 1.9, 2.4, -4.95);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ color: '#1a2650' })); glass.position.set(1.9, 2.4, -4.88); g.add(glass);
  box(0.06, 1.5, 0.05, '#f4ead8', 1.9, 2.4, -4.86); box(1.5, 0.06, 0.05, '#f4ead8', 1.9, 2.4, -4.86);
  for (const sx of [-1.15, 1.15]) box(0.6, 2.8, 0.2, '#d4b98a', 1.9 + sx, 2.5, -4.7);
  box(2.0, 0.1, 0.4, '#f4ead8', 1.9, 1.45, -4.75);
  cyl(0.18, 0.14, 0.3, '#c97a4a', 1.3, 1.65, -4.7); add(g, sph(0.3, '#4fa850', 1, 1.1, 1), 1.3, 2.0, -4.7);
  // ロッキングチェア
  const rc = new THREE.Group(); rc.position.set(0.5, 0, -3.3); rc.rotation.y = 0.35; g.add(rc);
  box(1.0, 0.1, 0.9, '#6a4328', 0, 0.62, 0, rc); box(1.0, 1.2, 0.08, '#6a4328', 0, 1.2, -0.42, rc).rotation.x = -0.15;
  for (const sx of [-0.46, 0.46]) { box(0.08, 0.5, 0.08, '#6a4328', sx, 0.95, 0.2, rc); const rk = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.04, 6, 24, Math.PI * 0.4), mat('#5a3a20')); rk.rotation.z = Math.PI * 1.3; rk.rotation.y = Math.PI / 2; rk.position.set(sx, 1.15, 0); rc.add(rk); }
  box(0.9, 0.12, 0.8, '#8a6a58', 0, 0.72, 0.02, rc);
  obstacles.push({ x: 0.5, z: -3.3, r: 0.7 });
  box(0.7, 0.7, 0.7, '#6a4328', -1.0, 0.35, -4.4);
  // キッチン
  for (let i = 0; i < 4; i++) { box(0.98, 1.0, 0.95, '#6b4328', 3.6 + i * 1.0, 0.5, -4.4); box(0.12, 0.05, 0.04, '#222', 3.6 + i * 1.0, 0.8, -3.9); obstacles.push({ x: 3.6 + i * 1.0, z: -4.0, r: 0.7 }); }
  box(4.2, 0.12, 1.1, '#8d8a82', 5.1, 1.06, -4.4);
  box(1.0, 0.25, 0.7, '#fbfbf8', 4.6, 1.05, -4.4);
  cyl(0.03, 0.03, 0.5, '#b0b0b0', 4.6, 1.35, -4.8, g, 6);
  for (let i = 0; i < 2; i++) box(1.2, 1.2, 0.6, '#6b4328', 6.2 + i * 0.0, 3.4, -4.7).position.x = 5.8 + i * 1.2;
  for (const y of [2.1, 2.8]) { box(1.6, 0.08, 0.5, '#6b4328', 4.0, y, -4.75); for (let k = 0; k < 3; k++) add(g, sph(0.16, k % 2 ? '#e6d2b0' : '#c9a070', 1, 0.7, 1), 3.5 + k * 0.5, y + 0.15, -4.75); }
  for (let k = 0; k < 4; k++) add(g, sph(0.14, '#c97a3a', 1, 1, 0.5), 3.3 + k * 0.3, 3.55, -4.85);
  for (const x of [5.9, 6.5]) { cyl(0.16, 0.12, 0.28, '#c97a4a', x, 1.26, -4.5); add(g, sph(0.28, '#4fa850', 1, 1, 1), x, 1.6, -4.5); }
  for (const x of [4.0, 4.3]) cyl(0.1, 0.1, 0.3, '#e6d2b0', x, 1.3, -4.7);
  const kp = new THREE.Group(); kp.position.set(5.0, 0, -2.4); g.add(kp);
  const dome2 = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.35, 14, 1, true), new THREE.MeshLambertMaterial({ color: '#c9a070', side: THREE.DoubleSide, emissive: '#5a3a10' })); dome2.position.set(0, 3.0, 0); kp.add(dome2);
  const bulb2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff0b0' })); bulb2.position.set(0, 2.9, 0); kp.add(bulb2);
  cyl(0.02, 0.02, 1.4, '#3a2a20', 0, 3.7, 0, kp, 6);
  const l2 = new THREE.PointLight(0xffd890, 6, 10, 1.8); l2.position.set(5.0, 2.8, -2.4); g.add(l2);
  // ダイニング
  box(2.6, 0.12, 1.5, '#8a5a34', 4.8, 0.8, 1.6);
  for (const [x, z] of [[3.7, 1.0], [5.9, 1.0], [3.7, 2.2], [5.9, 2.2]]) box(0.12, 0.8, 0.12, '#6a4328', x, 0.4, z);
  for (const x of [4.2, 5.4]) { cyl(0.2, 0.18, 0.12, '#fbfbf8', x, 0.9, 1.6); add(g, sph(0.12, '#ff7a5c'), x, 0.98, 1.6); }
  for (const [x, z] of [[4.2, 0.4], [5.4, 0.4], [4.2, 2.8], [5.4, 2.8]]) { cyl(0.28, 0.28, 0.1, '#a8733a', x, 0.5, z, g, 12); cyl(0.05, 0.05, 0.5, '#6a4328', x, 0.25, z, g, 6); }
  obstacles.push({ x: 4.2, z: 1.6, r: 1.0 }, { x: 5.6, z: 1.6, r: 1.0 });
  // でぐち
  for (const sx of [-1.1, 1.1]) box(0.25, 3.2, 0.25, '#5a3a20', sx, 1.6, 4.9);
  box(2.6, 0.3, 0.3, '#5a3a20', 0, 3.2, 4.9);
  const dm = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.9), mat('#c26a4a')); dm.rotation.x = -Math.PI / 2; dm.position.set(0, 0.03, 4.3); g.add(dm);
  // 丸い窓の月あかり (うすく)
  const moon = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), new THREE.MeshBasicMaterial({ color: '#fff6c8' })); moon.position.set(2.3, 2.6, -4.87); g.add(moon);

  function update(t) {
    flames.forEach((f, i) => { f.scale.y = 1 + Math.sin(t * 9 + i * 2) * 0.25; f.scale.x = f.scale.z = 1 + Math.sin(t * 7 + i) * 0.1; });
    fireLight.intensity = 9 + Math.sin(t * 11) * 1.2 + Math.sin(t * 5.3) * 0.8;
  }
  return {
    group: g, obstacles, update,
    bounds: { x0: -6.4, x1: 6.5, z0: -4.1, z1: 4.8 },
    exit: { x: 0, z: 4.45 },
    spawn: { x: 0, z: 3.2 },
    homes: { sei: [4.6, -2.7], poko: [-3.8, 0.9], mei: [0.8, 0.6] },
  };
}
