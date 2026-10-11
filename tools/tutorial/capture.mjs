// あそびかた どうが (1920x1080) の がめん を 1コマずつ さつえい
//  使い方 (リポジトリの ルートで http サーバを たてておく):  python3 -m http.server 8765
//    ONLY=s1,s4 node capture.mjs        … えらんだ シーンだけ
//    DRY=1 ONLY=s5 node capture.mjs     … がぞうを かかない れんしゅう (エラー かくにん)
//  でき: $OUT/<scene>/f00000.jpg ...  (FPS は script.mjs)
//  ※ ナレーションの ながさに あわせて シーンの ながさが きまる (script.mjs)。セリフを かえたら もういちど さつえい。
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
import { SCENES, FPS } from './script.mjs';

const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const OUT = process.env.OUT || '/tmp/claude-0/tut';
const BASE = process.env.BASE || 'http://localhost:8765/index.html';
const DRY = !!process.env.DRY;
const PX = 78, PY = 45, PW = 540, PH = 990;       // スマホがめんの いち (そとわく こみ)
const STEP = 1000 / FPS;
const lerp = (a, b, u) => a + (b - a) * u, ease = u => u * u * (3 - 2 * u);

const PAGE_HTML = src => `<!doctype html><meta charset="utf-8"><body style="margin:0;width:1920px;height:1080px;overflow:hidden;position:relative;background:linear-gradient(135deg,#fff6dc,#ffe3ec);font-family:'Hiragino Maru Gothic ProN','Noto Sans JP','Noto Sans CJK JP',sans-serif;color:#5a4636">
<div style="position:absolute;left:${PX - 14}px;top:${PY - 14}px;width:${PW}px;height:${PH}px;border:14px solid #5a4636;border-radius:54px;overflow:hidden;box-shadow:0 10px 30px #0004;background:#000"><iframe id="g" src="${src}" style="width:${PW}px;height:${PH}px;border:0;display:block"></iframe></div>
<div id="badge" style="position:absolute;left:720px;top:70px;font-size:44px;font-weight:800;background:#ff8fa3;color:#fff;padding:.12em .9em;border-radius:99px;box-shadow:0 5px 0 #d86a82"></div>
<div id="head" style="position:absolute;left:720px;top:170px;width:1120px;font-size:84px;font-weight:900;line-height:1.2;color:#5a4636"></div>
<ul id="pts" style="position:absolute;left:720px;top:380px;width:1120px;margin:0;padding:0;list-style:none;font-size:50px;font-weight:700;line-height:1.35"></ul>
<div id="cap" style="position:absolute;left:720px;bottom:48px;width:1120px;min-height:130px;box-sizing:border-box;background:#fffffff0;border:5px solid #ffd21f;border-radius:30px;padding:18px 28px;font-size:36px;font-weight:700;line-height:1.45;display:none"></div>
<div id="ring" style="position:absolute;display:none;border:8px solid #ff4d6d;border-radius:22px;box-shadow:0 0 0 4px #fff,0 0 22px #ff4d6d;pointer-events:none;z-index:50"></div>
<div id="fade" style="position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:99"></div>
<script>
window.setPanel = s => {
  const $ = id => document.getElementById(id);
  $('badge').style.display = s.badge ? '' : 'none'; $('badge').textContent = s.badge;
  $('head').innerHTML = s.head.replace(/\\n/g, '<br>');
  if (s.center) { $('head').style.top = '330px'; $('head').style.fontSize = '104px'; }
  const ul = $('pts'); ul.style.fontSize = s.pts.length >= 5 ? '44px' : '50px'; ul.style.top = s.pts.length >= 5 ? '330px' : '380px'; if (ul.dataset.n !== String(s.pts.length)) { ul.dataset.n = s.pts.length; ul.innerHTML = s.pts.map(t => '<li style="margin:0 0 .45em;padding-left:1.1em;text-indent:-1.1em"><span style="color:#ff6f91">●</span> ' + t + '</li>').join(''); }
  s.pts.forEach((_, i) => { const li = ul.children[i]; if (li) li.style.opacity = '1'; });
  $('cap').style.display = s.cap ? '' : 'none'; $('cap').textContent = s.cap || '';
  const r = $('ring');
  if (s.ring) { const [x, y, w, h] = s.ring, p = 8 + 3 * Math.sin(s.n * 0.5); r.style.display = ''; r.style.left = (x - p) + 'px'; r.style.top = (y - p) + 'px'; r.style.width = (w + 2 * p) + 'px'; r.style.height = (h + 2 * p) + 'px'; } else r.style.display = 'none';
  $('fade').style.opacity = s.fade;
};
</script></body>`;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });

async function runScene(sc, build) {
  const dir = `${OUT}/${sc.id}`; fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, hasTouch: false });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log(sc.id, 'PAGEERR', e.message));
  await page.addInitScript(() => {
    let cb = null, t = 0;
    window.requestAnimationFrame = f => { cb = f; return 1; };
    performance.now = () => t;
    window.__step = ms => { t += ms; const f = cb; cb = null; if (f) f(t); };
  });
  const N = Math.min(Math.ceil(sc.dur * FPS), Number(process.env.MAXF || 1e9)), done = new Set();
  const ctl = { hl: null, hlEl: null };
  let fr = null, i = 0, t = 0;
  const api = {
    page, sc, N,
    get fr() { return fr; }, get i() { return i; }, get t() { return t; },
    A: k => sc.lines[k].at, Z: k => sc.lines[k].at + sc.lines[k].len,
    E: (f, a) => fr.evaluate(f, a),
    step: async n => { for (let k = 0; k < n; k++) await fr.evaluate(ms => window.__step(ms), STEP); },
    click: sel => fr.evaluate(sel => { const e = document.querySelector(sel); if (e) e.click(); }, sel),
    clickNth: (sel, n) => fr.evaluate(([sel, n]) => { const e = document.querySelectorAll(sel)[n]; if (e) e.click(); }, [sel, n]),
    key: (type, k) => fr.evaluate(([type, k]) => window.dispatchEvent(new KeyboardEvent(type, { key: k })), [type, k]),
    hl: sel => { ctl.hl = sel; },
    rect: sel => fr.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); if (!r.width) return null; return [r.left, r.top, r.width, r.height]; }, sel),
    mouse: async (sel, dx = 0, dy = 0) => { const r = await api.rect(sel); return r ? [PX + r[0] + r[2] / 2 + dx, PY + r[1] + r[3] / 2 + dy] : null; },
    once: async (k, cond, f) => { if (cond && !done.has(k)) { done.add(k); await f(); } },
    boot: async (o = {}) => {
      await page.setContent(PAGE_HTML(`${BASE}?hour=${o.hour ?? 14}`));
      fr = await (await page.waitForSelector('#g')).contentFrame();
      await fr.waitForFunction(() => window.__poko, null, { timeout: 30000 });
      if (o.save !== false) {
        await fr.evaluate(m => {
          const S = __poko.S; S.created = true; S.avatar.name = 'みどり'; S.seenHouse = true; S.seenHome = true; S.flowers = m.flowers ?? 60;
          const d = new Date(); S.lastDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          for (const id of ['poko', 'mei', 'sei', 'rin', 'pa', 'kuro', 'nami']) S.friend[id] = m.friend ?? 30;
          if (m.extra) new Function('S', m.extra)(S);
          localStorage.setItem('poko-island-save-v1', JSON.stringify(S));
        }, { flowers: o.flowers, friend: o.friend, extra: o.extra || '' });
        await api.reload();
        await api.step(3);
        await api.click('#btnContinue'); await api.step(6);
        if (o.daily !== true) { await api.click('#dailyOk'); await api.step(3); }
      }
    },
    reload: async () => { await Promise.all([fr.waitForNavigation({ waitUntil: 'load', timeout: 30000 }), fr.evaluate(() => { setTimeout(() => location.reload(), 0); })]); await fr.waitForFunction(() => window.__poko, null, { timeout: 30000 }); },
  };
  await build(api);
  const t0 = Date.now();
  for (i = 0; i < N; i++) {
    t = i / FPS;
    if (i % 40 === 20 && sc.id !== 's9') { await api.key('keydown', 'Shift'); await api.key('keyup', 'Shift'); } // ねむらないように
    await api.per(i, t);
    // パネル
    let li = -1; sc.lines.forEach((l, k) => { if (t >= l.at) li = k; });
    const cap = (li >= 0 && t < sc.lines[li].at + sc.lines[li].len + 0.4) ? sc.lines[li].text : '';
    const pts = sc.pts.filter(p => p.line <= li).map(p => p.t);
    const ring = ctl.hl ? await api.rect(ctl.hl).then(r => { if (!r) return null; const x0 = Math.max(PX + 10, PX + r[0]), y0 = Math.max(PY + 10, PY + r[1]), x1 = Math.min(PX + PW - 10, PX + r[0] + r[2]), y1 = Math.min(PY + PH - 10, PY + r[1] + r[3]); return [x0, y0, x1 - x0, y1 - y0]; }) : null;
    const fade = Math.max(0, 1 - i / 5, (i - (N - 6)) / 5);
    await page.evaluate(s => window.setPanel(s), { badge: sc.badge, head: sc.head, pts, cap, ring, n: i, fade: Math.min(1, fade), center: sc.id === 's0' });
    await api.step(1);
    if (!DRY) await page.screenshot({ path: `${dir}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 90 });
    if (i % 100 === 99) console.log(sc.id, i + 1, '/', N, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  console.log(sc.id, 'done', N, 'frames');
  await ctx.close();
}

// ---------------------------------------------------------------------------------------------
const SC = Object.fromEntries(SCENES.map(s => [s.id, s]));
const LAY = [['rugr', 0.5, -1.5, 0], ['sofa', 0.5, -4.18, 0], ['table', 0.5, -1.5, 0], ['cushion', -1.0, -1.4, 0], ['bookshelf', -6.18, -4.53, 0], ['plant', -4.5, -4.53, 0], ['lamp', -6.75, 3.6, 0], ['bed', -5.83, 1.0, 1]];
const nearNpc = (id, dx = 1.2, dz = 2.6) => `{ const p = __poko.npcs['${id}'].root.position; __poko.player().root.position.set(p.x + ${dx}, 0, p.z + ${dz}); }`;

const BUILD = {
  // 0: タイトル
  s0: async a => { await a.boot({ save: false }); a.per = async () => {}; },
  // 1: はじめかた
  s1: async a => {
    await a.boot({ save: false });
    a.per = async (i, t) => {
      await a.once('h0', t >= a.A(0) + 1.0, () => a.hl('#btnNew'));
      await a.once('c0', t >= a.A(0) + 4.5, async () => { await a.click('#btnNew'); a.hl(null); });
      // 2こめの せつめい: おなまえ・すがた
      const nm = 'みどり', k0 = a.A(1) + 1.2;
      if (t >= k0 && t < k0 + nm.length * 0.45) { const n = Math.floor((t - k0) / 0.45) + 1; await a.E(([v]) => { const e = document.getElementById('nameInput'); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, [nm.slice(0, n)]); }
      await a.once('o1', t >= a.A(1) + 5.5, () => { a.hl('#optHair'); return a.clickNth('#optHair button', 1); });
      await a.once('o2', t >= a.A(1) + 7.0, () => { a.hl('#optHairColor'); return a.clickNth('#optHairColor button', 3); });
      await a.once('o3', t >= a.A(1) + 8.6, () => { a.hl('#optOutfit'); return a.clickNth('#optOutfit button', 4); });
      await a.once('ok', t >= a.A(1) + 10.4, () => a.hl('#btnCreateOk'));
      await a.once('okc', t >= a.Z(1) - 0.2, async () => { await a.click('#btnCreateOk'); a.hl(null); await a.E(() => { document.getElementById('dailyOk').click(); __poko.S.flowers = 5; }); });
      await a.once('re', t >= a.A(2) - 0.1, async () => { await a.E(() => localStorage.setItem('poko-island-save-v1', JSON.stringify(__poko.S))); await a.reload(); await a.step(3); a.hl('#btnContinue'); });
    };
  },
  // 2: あるく
  s2: async a => {
    await a.boot({ daily: true });
    let down = false;
    a.per = async (i, t) => {
      await a.once('d0', t >= a.A(0) + 1.5, () => a.hl('#dailyOk'));
      await a.once('d1', t >= a.Z(0) + 0.2, async () => { await a.click('#dailyOk'); a.hl(null); });
      await a.once('j0', t >= a.A(1) + 0.4, async () => { a.hl('#joy'); });
      const js = a.A(1) + 3.2, je = a.A(1) + 8.0;
      if (t >= js && !down && t < je) { const [x, y] = await a.mouse('#joy'); await a.page.mouse.move(x, y); await a.page.mouse.down(); down = true; a._j = [x, y]; }
      if (down) {
        const u = Math.min(1, (t - js) / 1.2), ang = t < js + 3 ? -0.7 : 0.6 + (t - js - 3) * 0.4;
        await a.page.mouse.move(a._j[0] + Math.cos(ang) * 38 * u, a._j[1] + Math.sin(ang) * 38 * u);
      }
      if (down && t >= je) { await a.page.mouse.up(); down = false; a.hl(null); }
      await a.once('t0', t >= a.A(2) + 0.5, () => a.hl(null));
      await a.once('t1', t >= a.A(2) + 1.2, async () => { await a.page.mouse.click(PX + 270 + 80, PY + 600); });
      await a.once('t2', t >= a.A(2) + 4.5, async () => { await a.page.mouse.click(PX + 140, PY + 520); });
      await a.once('r0', t >= a.A(3) + 0.3, () => a.hl('#rotBtns'));
      if (t >= a.A(3) + 1.2 && t < a.A(3) + 3.0) { if (!done_(a, 'rd1')) { const [x, y] = await a.mouse('#rotR'); await a.page.mouse.move(x, y); await a.page.mouse.down(); mark(a, 'rd1'); } }
      if (t >= a.A(3) + 3.0 && !done_(a, 'ru1')) { await a.page.mouse.up(); mark(a, 'ru1'); }
      if (t >= a.A(3) + 3.4 && t < a.A(3) + 5.0) { if (!done_(a, 'rd2')) { const [x, y] = await a.mouse('#rotL'); await a.page.mouse.move(x, y); await a.page.mouse.down(); mark(a, 'rd2'); } }
      if (t >= a.A(3) + 5.0 && !done_(a, 'ru2')) { await a.page.mouse.up(); mark(a, 'ru2'); a.hl(null); }
    };
  },
  // 3: おはな
  s3: async a => {
    await a.boot({ flowers: 7 });
    const held = {};
    const steer = async (tx, tz) => {
      const p = await a.E(() => { const q = __poko.player().root.position; return [q.x, q.z]; });
      const dx = tx - p[0], dz = tz - p[1];
      const want = { a: dx < -0.4, d: dx > 0.4, w: dz < -0.4, s: dz > 0.4 };
      for (const k of ['a', 'd', 'w', 's']) if (want[k] !== !!held[k]) { held[k] = want[k]; await a.key(want[k] ? 'keydown' : 'keyup', k); }
    };
    let targets = null;
    a.per = async (i, t) => {
      if (!targets) { targets = await a.E(() => { const fl = __poko.world.flowers.filter(f => f.mesh.visible).slice(0, 7), out = []; fl.forEach((f, k) => { f.x = (k % 2 ? 1 : -1) * 0.9; f.z = 20 - k * 3.2; f.mesh.position.set(f.x, 0, f.z); out.push([f.x, f.z]); }); __poko.player().root.position.set(0, 0, 24); return out; }); }
      await a.once('h', t >= a.A(1) + 1.0, () => a.hl('#flowerCount'));
      const tt = Math.floor(t / 2.2) % targets.length;
      if (t > 0.6 && t < a.A(1) + 9) await steer(targets[tt][0], targets[tt][1]);
      else await steer(1e9 * 0 + (await a.E(() => __poko.player().root.position.x)), (await a.E(() => __poko.player().root.position.z)));
    };
  },
  // 4: はなす
  s4: async a => {
    await a.boot({ hour: 14, extra: "S.inv.herb = 3; S.inv.sasa = 2; S.friend.poko = 38;" });
    await a.E(nearNpc('poko', 0.8, 2.7)); await a.step(10);
    const typed = 'げんき？';
    a.per = async (i, t) => {
      await a.once('h0', t >= a.A(0) + 0.6, () => a.hl('#btnTalk'));
      await a.once('c0', t >= a.A(0) + 4.2, async () => { a.hl(null); await a.click('#btnTalk'); });
      await a.once('h1', t >= a.A(1) + 0.4, () => a.hl('#chips'));
      await a.once('c1', t >= a.A(1) + 3.0, () => a.clickNth('#chips button', 2));
      await a.once('h1b', t >= a.A(1) + 8.0, () => a.hl('#chatInput'));
      const k0 = a.A(1) + 9.0;
      if (t >= k0 && t < k0 + typed.length * 0.4) { const n = Math.floor((t - k0) / 0.4) + 1; await a.E(v => { document.getElementById('chatInput').value = v; }, typed.slice(0, n)); }
      await a.once('h1c', t >= a.A(1) + 11.0, () => a.hl('#chatSend'));
      await a.once('c1c', t >= a.A(1) + 12.2, () => a.click('#chatSend'));
      await a.once('h2', t >= a.A(2) + 0.4, () => a.hl('#chatGift'));
      await a.once('c2', t >= a.A(2) + 4.0, async () => { await a.click('#chatGift'); a.hl('#giftPick'); });
      await a.once('c2b', t >= a.A(2) + 10.5, async () => { await a.click('#chatGift'); });
      await a.once('h3', t >= a.A(3) + 0.3, () => a.hl('#chatHearts'));
    };
  },
  // 5: おねがい
  s5: async a => {
    await a.boot({ hour: 14, friend: 34 });
    await a.E(nearNpc('poko', 0.2, 4.8)); await a.step(10);
    await a.E(() => { __poko.camera.zoom = 1; });
    a.per = async (i, t) => {
      await a.once('m0', t >= a.A(1) + 0.8, () => a.hl('#btnMenu'));
      await a.once('m1', t >= a.A(1) + 3.5, async () => { await a.click('#btnMenu'); await a.step(2); a.hl(null); });
      await a.once('m2', t >= a.A(1) + 5.2, async () => { await a.click('#menu [data-act="quests"]'); a.hl('#qList'); });
      await a.once('m3', t >= a.A(2) - 0.2, async () => { await a.click('#quests [data-act="back"]'); await a.step(2); a.hl(null); await a.click('#menu [data-act="resume"]'); });
      await a.once('m4', t >= a.A(2) + 2.0, async () => { await a.E(() => __poko.openChat('poko')); });
    };
  },
  // 6: ポコたちの 1にち
  s6: async a => {
    await a.boot({ hour: 14 });
    await a.E(() => { __poko.player().root.position.set(-1, 0, -5.5); });
    await a.step(20);
    a.per = async (i, t) => {
      await a.once('h0', t >= a.A(0) + 1.0, () => a.hl('#clock'));
      await a.once('t1', t >= a.A(1) + 0.3, async () => { await a.E(() => { __poko.S.settings.time = '15.5'; __poko.player().root.position.set(0, 0, -10.3); }); a.hl('#clock'); });
      await a.once('h2', t >= a.A(2) + 0.2, () => a.hl('#btnEnter'));
      await a.once('e2', t >= a.A(2) + 3.0, async () => { a.hl(null); await a.click('#btnEnter'); });
      await a.once('h2c', t >= a.A(2) + 6.0, () => a.hl('#clock'));
      await a.once('n3', t >= a.A(3) + 0.3, async () => { a.hl(null); await a.E(() => { __poko.S.settings.time = '22'; __poko.syncNpcs(); __poko.debugCam = { pos: [602, 30, 25], look: [602, 0, 2] }; }); });
    };
  },
  // 7: おみせ・つり・はたけ
  s7: async a => {
    await a.boot({ hour: 15, flowers: 400, extra: "S.rod = 3; S.farm.seeds = { carrot: 3, tomato: 3 };" });
    await a.E(() => { __poko.player().root.position.set(-8, 0, 15); });
    let reeled = false, hold = 0;
    a.per = async (i, t) => {
      await a.once('s0', t >= a.A(0) + 1.0, () => a.E(() => __poko.openShop()));
      await a.once('s0b', t >= a.A(0) + 3.6, () => a.clickNth('#shop .tabs button', 1));
      await a.once('s0c', t >= a.A(0) + 5.2, () => a.clickNth('#shop .tabs button', 2));
      await a.once('f0', t >= a.A(1) - 0.2, async () => { await a.click('#shopBack'); await a.step(2); await a.E(() => { window.__rnd = Math.random; Math.random = () => (document.getElementById('fishMsg').textContent.includes('なげる') ? 0.02 : 0.88); __poko.player().root.position.set(9, 0, 13.4); }); });
      await a.once('f1', t >= a.A(1) + 1.2, () => a.hl('#btnFish'));
      await a.once('f2', t >= a.A(1) + 3.5, async () => { await a.click('#btnFish'); a.hl(null); });
      if (t > a.A(1) + 5 && !reeled && t < a.A(2) - 0.5) { const v = await a.E(() => !document.getElementById('btnReel').classList.contains('hidden')); if (v) { hold++; if (hold > 6) { reeled = true; a.hl('#btnReel'); await a.step(8); await a.click('#btnReel'); a.hl(null); } } }
      await a.once('g0', t >= a.A(2) - 0.1, async () => { await a.E(() => { document.getElementById('ccQuit') && document.getElementById('ccQuit').click(); if (window.__rnd) Math.random = window.__rnd; const f = __poko.world.farm.plots[0]; __poko.player().root.position.set(f.x + 0.5, 0, f.z + 1.7); __poko.debugCam = { pos: [-58, 15, 31], look: [-58, 0.3, 14.5] }; }); await a.step(8); });
      await a.once('g1', t >= a.A(2) + 2.0, () => a.click('#btnFarm'));
      await a.once('g2', t >= a.A(2) + 4.0, () => a.clickNth('#seedList button', 0));
      await a.once('g3', t >= a.A(2) + 6.5, () => a.click('#btnFarm'));
      await a.once('g4', t >= a.A(2) + 9.0, () => a.E(() => { const S = __poko.S; if (S.farm.plots[0]) { S.farm.plots[0].w = Date.now() - 9 * 60e3; __poko.refreshFarm(); } }));
    };
  },
  // 8: じぶんの おうち
  s8: async a => {
    await a.boot({ hour: 15, extra: "S.home.stage = 0;" });
    await a.E(() => { __poko.chaoAI.mode = 'idle'; __poko.chaoAI.cd = 999; __poko.player().root.position.set(-72, 0, -2); __poko.debugCam = { pos: [-64, 11, 13], look: [-68, 2, -9] }; });
    a.per = async (i, t) => {
      await a.once('b1', t >= a.A(0) + 1.5, () => a.E(() => (__poko.S.home.stage = 1, __poko.world.setHome(1))));
      await a.once('b2', t >= a.A(0) + 3.2, () => a.E(() => (__poko.S.home.stage = 2, __poko.world.setHome(2))));
      await a.once('b3', t >= a.A(0) + 4.9, () => a.E(() => (__poko.S.home.stage = 3, __poko.world.setHome(3))));
      await a.once('in', t >= a.A(1) + 0.3, () => a.E(() => {
        __poko.debugCam = null; const S = __poko.S;
        for (const id of ['sofa', 'table', 'rugr', 'bookshelf', 'plant', 'lamp', 'bed', 'frame', 'cushion']) S.home.have[id] = (S.home.have[id] || 0) + 1;
        S.home.stage = 3; S.home.guests = ['poko', 'mei']; __poko.applyHome(); const d = __poko.world.homeDoorPos(3); __poko.player().root.position.set(d.x, 0, d.z + 1.2); __poko.enterHome();
      }));
      await a.once('dk', t >= a.A(1) + 3.0, () => a.E(() => __poko.openDeco()));
      const k = Math.floor((t - (a.A(1) + 5.0)) / 0.8);
      if (k >= 0 && k < LAY.length && !a._lay?.[k]) { (a._lay ||= {})[k] = 1; const [id, x, z, r] = LAY[k]; await a.E(([id, x, z, r]) => __poko.placeAt(id, x, z, r), [id, x, z, r]); }
      await a.once('dd', t >= a.Z(1) - 0.3, () => a.click('#decoDone'));
    };
  },
  // 9: ねる
  s9: async a => {
    await a.boot({ hour: 14 });
    await a.E(nearNpc('poko', 1.4, 3.4)); await a.step(10);
    a.per = async (i, t) => {
      await a.once('m0', t >= a.A(0) + 1.0, () => a.hl('#btnMenu'));
      await a.once('m1', t >= a.A(0) + 3.2, async () => { a.hl(null); await a.click('#btnMenu'); });
      await a.once('m2', t >= a.A(0) + 5.0, () => a.hl('#menu [data-act="sleep"]'));
      await a.once('m3', t >= a.A(0) + 7.0, async () => { a.hl(null); await a.click('#menu [data-act="sleep"]'); });
      await a.once('w0', t >= a.A(1) - 0.5, () => a.hl('#btnWake'));
      await a.once('w1', t >= a.A(1) + 1.8, async () => { await a.click('#btnWake'); a.hl(null); });
    };
  },
  // 10: せってい
  s10: async a => {
    await a.boot({ hour: 14 });
    a.per = async (i, t) => {
      await a.once('m1', t >= a.A(0) + 0.3, async () => { await a.click('#btnMenu'); });
      await a.once('m2', t >= a.A(0) + 1.8, () => a.click('#menu [data-act="settings"]'));
      await a.once('s0', t >= a.A(0) + 3.5, () => a.hl('.set:has(#setSize)'));
      await a.once('s1', t >= a.A(0) + 7.0, async () => { await a.clickNth('#setSize button', 1); });
      await a.once('s2', t >= a.A(0) + 10.0, async () => { await a.clickNth('#setSize button', 0); });
      await a.once('b0', t >= a.A(1) + 0.3, () => a.hl('.set:has(#setBgm)'));
      await a.once('b1', t >= a.A(1) + 4.0, () => a.hl('.set:has(#setSound)'));
      await a.once('b2', t >= a.A(1) + 8.0, () => a.hl('.set:has(#setVoice)'));
      await a.once('t0', t >= a.A(2) + 0.3, () => a.hl('.set:has(#setTime)'));
      await a.once('t1', t >= a.A(2) + 5.0, () => a.hl('.set:has(#setEvent)'));
    };
  },
  // 11: ひきつぎ
  s11: async a => {
    await a.boot({ hour: 14, extra: "S.inv.herb = 3;" });
    a.per = async (i, t) => {
      await a.once('m0', t >= a.A(0) + 14.0, () => a.hl('#btnMenu'));
      await a.once('m1', t >= a.A(1) + 0.4, async () => { a.hl(null); await a.click('#btnMenu'); });
      await a.once('m2', t >= a.A(1) + 2.6, () => a.hl('#menu [data-act="transfer"]'));
      await a.once('m3', t >= a.A(1) + 5.0, async () => { a.hl(null); await a.click('#menu [data-act="transfer"]'); });
      await a.once('t0', t >= a.A(1) + 8.5, () => a.hl('#tfMake'));
      await a.once('t1', t >= a.A(1) + 11.0, async () => { await a.click('#tfMake'); a.hl(null); });
      await a.once('t2', t >= a.A(1) + 13.5, () => a.hl('#tfCopy'));
      await a.once('t3', t >= a.A(1) + 15.5, async () => { await a.click('#tfCopy'); });
      await a.once('t4', t >= a.A(2) + 0.3, () => a.hl('#tfBox'));
      await a.once('r0', t >= a.A(3) + 0.2, async () => {
        a.hl(null); a._code = await a.E(() => document.getElementById('tfBox').value);
        await a.E(() => { document.getElementById('tfBack').click(); localStorage.setItem('poko-island-save-v1', JSON.stringify(__poko.S)); });
        await a.reload(); await a.step(3); a.hl('#btnTransferT');
      });
      await a.once('r1', t >= a.A(3) + 3.0, async () => { a.hl(null); await a.click('#btnTransferT'); await a.step(2); a.hl('#tfBox'); });
      await a.once('r2', t >= a.A(3) + 5.0, async () => { await a.E(c => { const e = document.getElementById('tfBox'); e.value = c; e.dispatchEvent(new Event('input', { bubbles: true })); }, a._code); a.hl('#tfLoad'); });
      await a.once('r3', t >= a.A(3) + 9.5, async () => { await a.click('#tfLoad'); a.hl('#tfMsg'); });
    };
  },
  // 12: おしまい
  s12: async a => {
    await a.boot({ hour: 17 });
    await a.E(() => { document.getElementById('hud').classList.add('hidden'); });
    a.per = async (i, t) => {
      const ang = 0.4 + t * 0.07;
      await a.E(([x, y, z]) => { __poko.debugCam = { pos: [x, y, z], look: [-6, 1, -2] }; }, [-6 + 30 * Math.sin(ang), 14, -2 + 30 * Math.cos(ang)]);
    };
  },
};
const done_ = (a, k) => (a._d ||= new Set()).has(k), mark = (a, k) => (a._d ||= new Set()).add(k);

const list = ONLY.length ? ONLY : Object.keys(BUILD);
for (const id of list) {
  console.log('==', id);
  try { await runScene(SC[id], BUILD[id]); } catch (e) { console.log(id, 'FAILED', e.message.split('\n')[0]); }
}
await browser.close();
