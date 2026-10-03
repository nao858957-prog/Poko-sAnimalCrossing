// ゲーム紹介トレーラー(約100秒)を 1コマずつ 撮影する
//  - 島の ひろがり / つり / はたけ+チャオ / おうちづくり+かざり / おはなばたけ の大木 / シアター
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const OUT = process.env.OUT || '/tmp/claude-0/vid/f4';
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null; // 例: ONLY=H3 K0=2100 で その場面だけ 撮りなおす
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 924, height: 520 }, deviceScaleFactor: 2.0779, hasTouch: false });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERR', e.message));
await page.addInitScript(() => {
  let cb = null, t = 0;
  window.requestAnimationFrame = f => { cb = f; return 1; };
  performance.now = () => t;
  window.__step = ms => { t += ms; const f = cb; cb = null; if (f) f(t); };
});
await page.goto('http://localhost:8765/index.html?hour=15');
await page.waitForTimeout(1500);
await page.addStyleTag({ content: `.th-bar,#hint{display:none!important}
#vcap{position:fixed;left:50%;bottom:7%;transform:translateX(-50%);z-index:300;pointer-events:none;background:#fffffff2;border:4px solid #ff8fa3;border-radius:99px;padding:.35em 1.3em;font:800 26px "Hiragino Maru Gothic ProN","Noto Sans JP",sans-serif;color:#5a4636;box-shadow:0 5px 14px #0003;opacity:0;white-space:nowrap}
#vcap.top{top:13%;bottom:auto;left:30%;font-size:23px}
#vfade{position:fixed;inset:0;z-index:400;background:#fff;pointer-events:none;opacity:1}` });
await page.evaluate(() => {
  const c = document.createElement('div'); c.id = 'vcap'; document.body.appendChild(c);
  const f = document.createElement('div'); f.id = 'vfade'; document.body.appendChild(f);
});
let k = Number(process.env.K0 || 0); const t0 = Date.now();
const E = (f, a) => page.evaluate(f, a);
const key = (type, kk) => E(([type, kk]) => window.dispatchEvent(new KeyboardEvent(type, { key: kk })), [type, kk]);
const clickNth = (sel, n) => E(([sel, n]) => { const el = document.querySelectorAll(sel)[n]; if (el) el.click(); }, [sel, n]);
const clickId = id => E(id => { const el = document.getElementById(id); if (el) el.click(); }, id);
const put = (x, z) => E(([x, z]) => __poko.player().root.position.set(x, 0, z), [x, z]);
async function stage(name, n, caption, per, pos = 'top') {
  if (ONLY && !ONLY.includes(name.split(' ')[0])) { k += n; return; }
  await E(([t, p]) => { const c = document.getElementById('vcap'); c.textContent = t || ''; c.className = p === 'top' ? 'top' : ''; }, [caption, pos]);
  for (let i = 0; i < n; i++) {
    if (i % 50 === 25) { await key('keydown', 'Shift'); await key('keyup', 'Shift'); } // ねむらないように
    if (per) await per(i);
    const capOp = !caption ? 0 : Math.min(1, i / 12, (n - i) / 12);
    const fadeOp = Math.max(0, 1 - i / 8) + (i > n - 7 ? (i - (n - 7)) / 6 : 0);
    await page.evaluate(([c, f]) => { document.getElementById('vcap').style.opacity = c; document.getElementById('vfade').style.opacity = Math.min(1, f); __step(33.333); }, [Math.max(0, capOp), fadeOp]);
    if (!process.env.DRY) await page.screenshot({ path: `${OUT}/f${String(k).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
    k++;
  }
  console.log(name, 'done', k, ((Date.now() - t0) / 1000).toFixed(0) + 's', JSON.stringify(await E(() => ({ mode: __poko.mode, home: __poko.S.home.stage, items: __poko.S.home.items.length, inv: __poko.S.inv, pk: __poko.S.farm.plots.map(p => p && [p.c, p.w ? 1 : 0, p.pk]), chao: __poko.chaoAI.mode }))));
}
const lerp = (a, b, u) => a + (b - a) * u, ease = u => u * u * (3 - 2 * u);
const lerp3 = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));

if (ONLY) { // その場面だけ撮りなおす ときの じゅんび (あたらしく はじめて おうちを たてた じょうたいに する)
  await E(() => { document.getElementById('btnContinue').classList.add('hidden'); document.getElementById('btnNew').click(); document.getElementById('nameInput').value = 'みどり'; const d = new Date(); __poko.S.lastDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  await E(() => { document.getElementById('btnCreateOk').click(); __poko.S.flowers = 3000; __poko.S.home.stage = 3; __poko.applyHome(); });
  for (let i = 0; i < 20; i++) await E(() => __step(33.3));
}
// A: タイトル 5秒
await E(() => { document.getElementById('btnContinue').classList.add('hidden'); });
await stage('A title', 150, 'ポコたちの森で 一緒に遊ぼう！', null, 'bottom');
// B: アバター作成 5秒
await E(() => { document.getElementById('btnNew').click(); document.getElementById('nameInput').value = 'みどり'; const d = new Date(); __poko.S.lastDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
await stage('B creator', 150, 'あなただけの アバターで 出発！', async i => {
  if (i === 20) await clickNth('#optHair button', 1);
  if (i === 45) await clickNth('#optHairColor button', 3);
  if (i === 70) await clickNth('#optOutfit button', 4);
  if (i === 95) await clickNth('#optSkin button', 2);
  if (i === 115) await clickNth('#optHair button', 3);
  if (i === 125) await clickNth('#optHairColor button', 5);
  if (i === 135) await clickNth('#optOutfit button', 2);
});
// C: ひろくなった島を ひとめぐり 8秒
await stage('C tour', 240, 'ひろがった 島を たんけん', async i => {
  if (i === 0) { await E(() => { document.getElementById('btnCreateOk').click(); document.activeElement && document.activeElement.blur(); __poko.S.flowers = 3000; }); }
  if (i >= 4) {
    const u = ease(Math.min(1, (i - 4) / 220));
    const A = [[58, 62, 74], [8, 52, 52], [-64, 36, 40]], L = [[12, 0, 8], [-8, 0, 2], [-66, 0, 2]];
    const f = u < 0.5 ? [lerp3(A[0], A[1], u * 2), lerp3(L[0], L[1], u * 2)] : [lerp3(A[1], A[2], (u - 0.5) * 2), lerp3(L[1], L[2], (u - 0.5) * 2)];
    await E(([p, l]) => { __poko.debugCam = { pos: p, look: l }; }, f);
  }
});
// D: おしゃべり 9秒
await stage('D chat', 270, 'ポコ・メイ・セイママ…ともだちと おしゃべり', async i => {
  if (i === 0) { await E(() => { __poko.debugCam = null; const p = __poko.npcs.poko.root.position; __poko.player().root.position.set(p.x + 1.2, 0, p.z + 2.6); }); await page.waitForTimeout(400); await E(() => __poko.openChat('poko')); await page.waitForTimeout(600); }
  const typed = 'こんにちは！';
  if (i >= 60 && i < 60 + typed.length * 4 && (i - 60) % 4 === 0) { const kk = (i - 60) / 4 + 1; await E(t => { document.getElementById('chatInput').value = t; }, typed.slice(0, kk)); }
  if (i === 95) { await E(() => document.getElementById('chatSend').click()); await page.waitForTimeout(1700); }
  if (i === 170) { await clickNth('#chips button', 2); await page.waitForTimeout(1700); }
});
// E: おみせ 7秒
await stage('E shop', 210, 'おみせで きせかえ・おいしいものも', async i => {
  if (i === 0) { await E(() => { document.getElementById('chatClose').click(); }); }
  if (i === 6) await E(() => __poko.openShop());
  if (i === 30) await E(() => document.querySelector('#shopList .item .btns button').click());
  if (i === 60) await E(() => document.querySelector('#shop .tabs button[data-tab=cloth]').click());
  if (i === 85) await clickNth('#shopList .item button', 0);
  if (i === 115) await clickNth('#shopList .item button', 3);
  if (i === 145) await clickNth('#shopList .item button', 5);
  if (i === 175) await clickNth('#shopList .item button', 7);
});
// F: つり 9秒 (つれる さかなを そろえて、かならず つりあげる)
let reeled = false, reelHold = 0; const realRandom = await E(() => 0);
await stage('F fishing', 300, 'つりも たのしめる！', async i => {
  if (i === 0) { await E(() => { document.getElementById('shopBack').click(); __poko.S.rod = 3; window.__rnd = Math.random; Math.random = () => 0.88; }); }
  if (i === 4) await put(9, 13.4);
  if (i === 20) await clickId('btnFish');
  if (i > 30 && !reeled) {
    const vis = await E(() => !document.getElementById('btnReel').classList.contains('hidden'));
    if (vis) { reelHold++; if (reelHold > 12) { reeled = true; await clickId('btnReel'); } }
  }
});
void realRandom;
// G1: はたけ 6秒 (たねを まく → みずを やる → そだつ)
await stage('G1 farm', 180, 'はたけで やさいを そだてよう', async i => {
  if (i === 0) {
    await E(() => {
      document.getElementById('ccQuit').click(); Math.random = window.__rnd;
      __poko.S.farm.seeds = { carrot: 3, tomato: 3, strawberry: 3, pumpkin: 2 };
      const f = __poko.world.farm.plots[0]; __poko.player().root.position.set(f.x + 0.5, 0, f.z + 1.7);
      __poko.debugCam = { pos: [-58, 8.8, 24], look: [-58, 0.4, 14.5] };
    });
  }
  if (i === 25) await clickId('btnFarm');
  if (i === 52) await clickNth('#seedList button', 0);
  if (i === 78) await clickId('btnFarm');
  if (i === 100) await E(() => { const f = __poko.world.farm.plots[1]; __poko.player().root.position.set(f.x + 0.5, 0, f.z + 1.7); });
  if (i === 108) await clickId('btnFarm');
  if (i === 133) await clickNth('#seedList button', 1);
  if (i === 152) await clickId('btnFarm');
  if (i === 162) await E(() => { const S = __poko.S, now = Date.now(); S.farm.plots[0].w = now - 6 * 60e3 * 0.55; S.farm.plots[1].w = now - 14 * 60e3 * 0.5; __poko.refreshFarm(); });
});
// G2: チャオの いたずら と しゅうかく 6秒
await stage('G2 chao', 180, 'いたずらっこの チャオも いるよ！', async i => {
  if (i === 0) {
    await E(() => {
      const S = __poko.S, now = Date.now(); S.farm.plots[0].w = now - 7 * 60e3; S.farm.plots[1].w = now - 14 * 60e3 * 0.6; S.farm.plots[1].bf = 0.1; S.farm.plots[1].bg = false;
      __poko.refreshFarm(); const f = __poko.world.farm.plots[0]; __poko.player().root.position.set(f.x + 0.5, 0, f.z + 1.7);
      __poko.chaoAI.cd = 0; __poko.chaoAI.bugcd = 999;
    });
  }
  if (i === 70) await clickId('btnFarm');
  if (i === 100) await E(() => { const f = __poko.world.farm.plots[1]; __poko.player().root.position.set(f.x + 0.5, 0, f.z + 1.7); });
  if (i === 112) await clickId('btnFarm');
});
// H1: おみせで おうちを たてる 8秒
await stage('H1 build', 240, 'おみせで おうちを たてよう', async i => {
  if (i === 0) { await E(() => { __poko.debugCam = null; __poko.chaoAI.mode = 'idle'; __poko.chaoAI.cd = 999; __poko.S.flowers = 3000; __poko.player().root.position.set(-9, 0, 15); }); }
  if (i === 8) await E(() => __poko.openShop());
  if (i === 25) await E(() => document.querySelector('#shop .tabs button[data-tab=home]').click());
  if (i === 70) await clickNth('#shopList .item button', 0);
  if (i === 120) await clickNth('#shopList .item button', 0);
  if (i === 170) await clickNth('#shopList .item button', 0);
  if (i === 200) await E(() => { document.getElementById('shopList').scrollTop = 140; });
});
// H2: テント → おうち → おおきな おうち 6秒
await stage('H2 houses', 180, 'テントから おおきな おうちへ', async i => {
  if (i === 0) await E(() => { document.getElementById('shopBack').click(); __poko.world.setHome(1); });
  if (i >= 1) await E(() => { __poko.debugCam = { pos: [-61.5, 9.5, 5.5], look: [-68, 1.8, -9] }; });
  if (i === 55) await E(() => __poko.world.setHome(2));
  if (i === 110) await E(() => __poko.world.setHome(3));
});
// H3: おへやを かざる 12秒 (リビング・ねどこ・ピアノなど、ばしょを きめて おしゃれに ならべる)
const LAYOUT = [
  ['rugr', 0.5, -1.5, 0], ['sofa', 0.5, -4.18, 0], ['table', 0.5, -1.5, 0], ['cushion', -1.0, -1.4, 0], ['cushion', 2.0, -1.4, 0],
  ['bookshelf', -6.18, -4.53, 0], ['plant', -4.5, -4.53, 0], ['piano', 6.03, -4.38, 0], ['bed', -5.83, 1.0, 1],
  ['lamp', -6.75, 3.6, 0], ['plush', -5.6, 3.9, 0], ['rocker', 6.53, 1.8, 3], ['frame', -2.5, 0, 0], ['clock', 3.5, 0, 0], ['wreath', -4.5, 0, 0],
];
await stage('H3 decorate', 360, 'おへやを すてきに かざろう', async i => {
  if (i === 0) {
    await E(() => {
      __poko.debugCam = null; const S = __poko.S;
      for (const id of ['sofa', 'table', 'rugr', 'bookshelf', 'plant', 'lamp', 'bed', 'frame', 'piano', 'rocker', 'cushion', 'plush', 'clock', 'wreath']) S.home.have[id] = (S.home.have[id] || 0) + (id === 'cushion' ? 2 : 1);
      S.home.styles.push('pink'); S.home.guests = ['poko', 'mei'];
      __poko.applyHome(); const d = __poko.world.homeDoorPos(3); __poko.player().root.position.set(d.x, 0, d.z + 1.2); __poko.enterHome();
    });
  }
  if (i === 40) await E(() => __poko.openDeco());
  if (i >= 56 && (i - 56) % 15 === 0 && (i - 56) / 15 < LAYOUT.length) { const [id, x, z, r] = LAYOUT[(i - 56) / 15]; const ok = await E(([id, x, z, r]) => __poko.placeAt(id, x, z, r), [id, x, z, r]); if (!ok) console.log('PLACE FAILED', id); }
  if (i === 292) await E(() => document.querySelector('.decoTabs button[data-dt=style]').click());
  if (i === 308) await clickNth('#decoStock button', 1);
  if (i === 335) await clickId('decoDone');
});
// I: おおきな きと おはなばたけ 6秒
await stage('I tree', 180, 'ポコたちの 島を すみずみまで', async i => {
  if (i === 0) await E(() => { __poko.exitHome(); __poko.player().root.position.set(-70, 0, 0); });
  const a = lerp(0.5, 2.3, ease(i / 179));
  await E(([x, y, z, lx, ly, lz]) => { __poko.debugCam = { pos: [x, y, z], look: [lx, ly, lz] }; }, [-82 + 17 * Math.sin(a), 6.2, 6 + 17 * Math.cos(a), -82, 2.6, 6]);
});
// J: ミニアニメ 7秒
await stage('J theater', 210, 'ポコたちの ミニアニメも みられるよ', async i => {
  if (i === 0) { await E(() => { __poko.debugCam = null; __poko.playScene(__poko.SCENES.find(s => s.id === 'snow')); __poko.theater.t = 5; }); }
});
// K: エンドカード 6秒
await E(() => {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:linear-gradient(#bfe8ff,#ffe3ea);text-align:center;font-weight:800;color:#5a4636;font-family:"Hiragino Maru Gothic ProN","Noto Sans JP",sans-serif';
  d.innerHTML = '<div style="font-size:30px;background:#ff8fa3;color:#fff;padding:.15em 1em;border-radius:99px">ポコの ちいさなしま</div><div style="font-size:58px;line-height:1.25;color:#fff;text-shadow:0 4px 0 #e0709a,0 0 18px #ff8fa3">ポコたちの森で<br>一緒に遊ぼう！</div><div style="font-size:26px;background:#fff;padding:.3em 1.2em;border-radius:99px">スマホで いますぐ あそべるよ 🐼</div><div style="font-size:19px">あそびかたは 概要欄を みてね</div>';
  document.body.appendChild(d);
});
await stage('K end', 180, '', null);
console.log('total frames', k);
await b.close();
