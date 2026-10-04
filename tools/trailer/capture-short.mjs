// ショート動画(たて 9:16 / 1080x1920)用の ゲーム映像を 約35秒ぶん 撮影する
//  さいしょと さいごに じっしゃふうの ポコたちを あとから くっつける ため、ゲーム部分だけ。
//  使い方: python3 -m http.server 8765 (リポジトリの ルート) → node capture-short.mjs  (DRY=1 で がぞうなしの れんしゅう)
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const OUT = process.env.OUT || '/tmp/claude-0/vid/f5';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, hasTouch: true });
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
await page.addStyleTag({ content: `.th-bar,#hint,#questBar{display:none!important}
#vcap{position:fixed;left:50%;top:11%;transform:translateX(-50%);z-index:300;pointer-events:none;background:#fffffff2;border:4px solid #ff8fa3;border-radius:99px;padding:.3em 1.1em;font:800 27px "Hiragino Maru Gothic ProN","Noto Sans JP",sans-serif;color:#5a4636;box-shadow:0 5px 14px #0003;opacity:0;white-space:nowrap}
#vfade{position:fixed;inset:0;z-index:400;background:#fff;pointer-events:none;opacity:1}` });
await page.evaluate(() => {
  const c = document.createElement('div'); c.id = 'vcap'; document.body.appendChild(c);
  const f = document.createElement('div'); f.id = 'vfade'; document.body.appendChild(f);
});
let k = 0; const t0 = Date.now();
const E = (f, a) => page.evaluate(f, a);
const key = (type, kk) => E(([type, kk]) => window.dispatchEvent(new KeyboardEvent(type, { key: kk })), [type, kk]);
const clickNth = (sel, n) => E(([sel, n]) => { const el = document.querySelectorAll(sel)[n]; if (el) el.click(); }, [sel, n]);
const clickId = id => E(id => { const el = document.getElementById(id); if (el) el.click(); }, id);
const lerp = (a, b, u) => a + (b - a) * u, ease = u => u * u * (3 - 2 * u);
const lerp3 = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
async function stage(name, n, caption, per) {
  await E(t => { const c = document.getElementById('vcap'); c.textContent = t || ''; }, caption);
  for (let i = 0; i < n; i++) {
    if (i % 50 === 25) { await key('keydown', 'Shift'); await key('keyup', 'Shift'); }
    if (per) await per(i);
    const capOp = !caption ? 0 : Math.min(1, i / 10, (n - i) / 10);
    const fadeOp = Math.max(0, 1 - i / 6) + (i > n - 5 ? (i - (n - 5)) / 4 : 0);
    await page.evaluate(([c, f]) => { document.getElementById('vcap').style.opacity = c; document.getElementById('vfade').style.opacity = Math.min(1, f); __step(33.333); }, [Math.max(0, capOp), fadeOp]);
    if (!process.env.DRY) await page.screenshot({ path: `${OUT}/f${String(k).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
    k++;
  }
  console.log(name, 'done', k, ((Date.now() - t0) / 1000).toFixed(0) + 's');
}

// 1: アバター 3秒
await E(() => { document.getElementById('btnContinue').classList.add('hidden'); document.getElementById('btnNew').click(); document.getElementById('nameInput').value = 'みどり'; const d = new Date(); __poko.S.lastDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
await stage('1 creator', 90, 'じぶんだけの アバターで！', async i => {
  if (i === 14) await clickNth('#optHair button', 1);
  if (i === 30) await clickNth('#optHairColor button', 3);
  if (i === 46) await clickNth('#optOutfit button', 4);
  if (i === 62) await clickNth('#optHair button', 3);
  if (i === 74) await clickNth('#optHairColor button', 5);
});
// 2: ひろい 島 4.5秒
await stage('2 aerial', 135, 'ひろくて すてきな 島', async i => {
  if (i === 0) await E(() => { document.getElementById('btnCreateOk').click(); document.activeElement && document.activeElement.blur(); __poko.S.flowers = 3000; });
  if (i >= 3) {
    const u = ease(Math.min(1, (i - 3) / 125));
    const A = [[70, 64, 84], [4, 56, 66], [-62, 44, 54]], L = [[10, 0, 10], [-10, 0, 4], [-68, 0, 4]];
    const f = u < 0.5 ? [lerp3(A[0], A[1], u * 2), lerp3(L[0], L[1], u * 2)] : [lerp3(A[1], A[2], (u - 0.5) * 2), lerp3(L[1], L[2], (u - 0.5) * 2)];
    await E(([p, l]) => { __poko.debugCam = { pos: p, look: l }; }, f);
  }
});
// 3: おしゃべり 4.5秒
await stage('3 chat', 135, 'ともだちと おしゃべり', async i => {
  if (i === 0) { await E(() => { __poko.debugCam = null; const p = __poko.npcs.poko.root.position; __poko.player().root.position.set(p.x + 1.2, 0, p.z + 2.6); }); await page.waitForTimeout(400); await E(() => __poko.openChat('poko')); await page.waitForTimeout(600); }
  const typed = 'こんにちは！';
  if (i >= 30 && i < 30 + typed.length * 3 && (i - 30) % 3 === 0) { const kk = (i - 30) / 3 + 1; await E(t => { document.getElementById('chatInput').value = t; }, typed.slice(0, kk)); }
  if (i === 52) { await clickId('chatSend'); await page.waitForTimeout(1500); }
  if (i === 100) { await clickNth('#chips button', 2); await page.waitForTimeout(1500); }
});
// 4: つり 6秒 (つりあげるまで 1かい)
let reeled = false, reelHold = 0;
await stage('4 fishing', 180, 'つりも たのしめる！', async i => {
  if (i === 0) { await E(() => { document.getElementById('chatClose').click(); __poko.S.rod = 3; window.__rnd = Math.random; Math.random = () => (document.getElementById('fishMsg').textContent.includes('なげる') ? 0.02 : 0.88); }); }
  if (i === 4) await E(() => __poko.player().root.position.set(9, 0, 13.4));
  if (i === 16) await clickId('btnFish');
  if (i > 24 && !reeled) {
    const vis = await E(() => !document.getElementById('btnReel').classList.contains('hidden'));
    if (vis) { reelHold++; if (reelHold > 8) { reeled = true; await clickId('btnReel'); } }
  }
});
// 5: はたけ と チャオ 5.5秒
await stage('5 farm', 165, 'はたけと チャオの いたずら', async i => {
  if (i === 0) {
    await E(() => {
      document.getElementById('ccQuit').click(); Math.random = window.__rnd;
      __poko.S.farm.seeds = { carrot: 3, tomato: 3 };
      const f = __poko.world.farm.plots[0]; __poko.player().root.position.set(f.x + 0.5, 0, f.z + 1.7);
      __poko.debugCam = { pos: [-58, 15, 31], look: [-58, 0.3, 14.5] };
    });
  }
  if (i === 12) await clickId('btnFarm');
  if (i === 26) await clickNth('#seedList button', 0);
  if (i === 42) await clickId('btnFarm');
  if (i === 56) await E(() => { const S = __poko.S; S.farm.plots[0].w = Date.now() - 7 * 60e3; S.farm.plots[0].bf = -1; __poko.refreshFarm(); __poko.chaoAI.cd = 0; __poko.chaoAI.bugcd = 999; });
  if (i === 100) await clickId('btnFarm');
});
// 6: おうちを たてて かざる 7.5秒
const LAYOUT = [
  ['rugr', 0.5, -1.5, 0], ['sofa', 0.5, -4.18, 0], ['table', 0.5, -1.5, 0], ['cushion', -1.0, -1.4, 0],
  ['bookshelf', -6.18, -4.53, 0], ['plant', -4.5, -4.53, 0], ['piano', 6.03, -4.38, 0], ['bed', -5.83, 1.0, 1],
  ['lamp', -6.75, 3.6, 0], ['rocker', 6.53, 1.8, 3], ['frame', -2.5, 0, 0], ['wreath', -4.5, 0, 0],
];
await stage('6 home', 225, 'おうちを たてて すてきに かざろう', async i => {
  if (i === 0) await E(() => { __poko.chaoAI.mode = 'idle'; __poko.chaoAI.cd = 999; __poko.player().root.position.set(-72, 0, -2); (__poko.S.home.stage = 1, __poko.world.setHome(1)); __poko.debugCam = { pos: [-64, 11, 13], look: [-68, 2, -9] }; });
  if (i === 22) await E(() => (__poko.S.home.stage = 2, __poko.world.setHome(2)));
  if (i === 44) await E(() => (__poko.S.home.stage = 3, __poko.world.setHome(3)));
  if (i === 66) {
    await E(() => {
      __poko.debugCam = null; const S = __poko.S;
      for (const id of ['sofa', 'table', 'rugr', 'bookshelf', 'plant', 'lamp', 'bed', 'frame', 'piano', 'rocker', 'cushion', 'wreath']) S.home.have[id] = (S.home.have[id] || 0) + 1;
      S.home.stage = 3; S.home.styles.push('pink'); S.home.style = 'pink'; S.home.guests = ['poko', 'mei'];
      __poko.applyHome(); const d = __poko.world.homeDoorPos(3); __poko.player().root.position.set(d.x, 0, d.z + 1.2); __poko.enterHome();
    });
  }
  if (i === 82) await E(() => __poko.openDeco());
  if (i >= 96 && (i - 96) % 10 === 0 && (i - 96) / 10 < LAYOUT.length) { const [id, x, z, r] = LAYOUT[(i - 96) / 10]; const ok = await E(([id, x, z, r]) => __poko.placeAt(id, x, z, r), [id, x, z, r]); if (!ok) console.log('PLACE FAILED', id); }
  if (i === 210) await clickId('decoDone');
});
// 7: お花畑の 大きな木 2.5秒
await stage('7 tree', 75, 'お花畑の 大きな木', async i => {
  if (i === 0) await E(() => { __poko.exitHome(); __poko.player().root.position.set(-70, 0, 0); });
  const a = lerp(0.6, 2.2, ease(i / 74));
  await E(([x, y, z, lx, ly, lz]) => { __poko.debugCam = { pos: [x, y, z], look: [lx, ly, lz] }; }, [-82 + 21 * Math.sin(a), 7.5, 6 + 21 * Math.cos(a), -82, 3, 6]);
});
// 8: おわり (ロゴ) 2秒
await E(() => {
  __poko.debugCam = null;
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:linear-gradient(#bfe8ff,#ffe3ea);text-align:center;font-weight:800;color:#5a4636;font-family:"Hiragino Maru Gothic ProN","Noto Sans JP",sans-serif';
  d.innerHTML = '<div style="font-size:26px;background:#ff8fa3;color:#fff;padding:.15em 1em;border-radius:99px">ポコの ちいさなしま</div><div style="font-size:50px;line-height:1.25;color:#fff;text-shadow:0 4px 0 #e0709a,0 0 18px #ff8fa3">ポコたちの森で<br>一緒に遊ぼう！</div><div style="font-size:24px;background:#fff;padding:.3em 1.1em;border-radius:99px">スマホで いますぐ あそべるよ 🐼</div>';
  document.body.appendChild(d);
});
await stage('8 end', 60, '', null);
console.log('total frames', k);
await b.close();
