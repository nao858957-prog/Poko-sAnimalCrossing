// ゲーム紹介トレーラー(60秒)を 1コマずつ 撮影する
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const OUT = '/tmp/claude-0/vid/f3';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'] });
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
let k = 0; const t0 = Date.now();
const E = (f, a) => page.evaluate(f, a);
async function stage(name, n, caption, per, pos = 'top') {
  await E(([t, p]) => { const c = document.getElementById('vcap'); c.textContent = t || ''; c.className = p === 'top' ? 'top' : ''; }, [caption, pos]);
  for (let i = 0; i < n; i++) {
    if (per) await per(i);
    const capOp = !caption ? 0 : Math.min(1, i / 12, (n - i) / 12);
    const fadeOp = Math.max(0, 1 - i / 8, 1 - (n - 1 - i) / 6 > 0 ? 0 : 0) + (i > n - 7 ? (i - (n - 7)) / 6 : 0);
    await page.evaluate(([c, f]) => { document.getElementById('vcap').style.opacity = c; document.getElementById('vfade').style.opacity = Math.min(1, f); __step(33.333); }, [Math.max(0, capOp), fadeOp]);
    await page.screenshot({ path: `${OUT}/f${String(k++).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
  }
  console.log(name, 'done', k, ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
const key = (type, kk) => E(([type, kk]) => window.dispatchEvent(new KeyboardEvent(type, { key: kk })), [type, kk]);

// A: タイトル 5秒
await E(() => { document.getElementById('btnContinue').classList.add('hidden'); });
await stage('A title', 150, 'ポコたちの森で 一緒に遊ぼう！', null, 'bottom');
// B: アバター作成 5秒
await E(() => { document.getElementById('btnNew').click(); document.getElementById('nameInput').value = 'みどり'; const d = new Date(); __poko.S.lastDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
const clickNth = (sel, n) => E(([sel, n]) => document.querySelectorAll(sel)[n].click(), [sel, n]);
await stage('B creator', 150, 'あなただけの アバターで 出発！', async i => {
  if (i === 20) await clickNth('#optHair button', 1);
  if (i === 45) await clickNth('#optHairColor button', 3);
  if (i === 70) await clickNth('#optOutfit button', 4);
  if (i === 95) await clickNth('#optSkin button', 2);
  if (i === 115) await clickNth('#optHair button', 3);
  if (i === 125) await clickNth('#optHairColor button', 5);
  if (i === 135) await clickNth('#optOutfit button', 2);
});
// C: おさんぽ 6秒
let walkKey = null;
const setKey = async kk => { if (walkKey) await key('keyup', walkKey); walkKey = kk; if (kk) await key('keydown', kk); };
await stage('C walk', 180, 'ひろい島を おさんぽ', async i => {
  if (i === 0) { await E(() => { document.getElementById('btnCreateOk').click(); document.activeElement && document.activeElement.blur(); }); }
  if (i < 62) { const u = Math.min(1, i / 60), e = u * u * (3 - 2 * u); await E(([u]) => { __poko.debugCam = { pos: [60 * (1 - u) + 0 * u, 80 * (1 - u) + 11 * u, 64 * (1 - u) + 19 * u], look: [0, 0.5, 6 * u] }; }, [e]); }
  if (i === 62) await E(() => { __poko.debugCam = null; });
  if (i === 70) await setKey('ArrowUp');
  if (i === 115) await setKey('ArrowLeft');
  if (i === 135) await setKey('ArrowUp');
  if (i === 155) await setKey(null);
});
// D: おしゃべり 11秒
await stage('D chat', 330, 'ポコ・メイ・セイママ…ともだちと おしゃべり', async i => {
  if (i === 0) { await E(() => __poko.openChat('poko')); await page.waitForTimeout(600); }
  const typed = 'こんにちは！';
  if (i >= 70 && i < 70 + typed.length * 4 && (i - 70) % 4 === 0) { const kk = (i - 70) / 4 + 1; await E(t => { document.getElementById('chatInput').value = t; }, typed.slice(0, kk)); }
  if (i === 105) { await E(() => document.getElementById('chatSend').click()); await page.waitForTimeout(1700); }
  if (i === 190) { await clickNth('#chips button', 2); await page.waitForTimeout(1700); }
  if (i === 265) { await clickNth('#chips button', 3); await page.waitForTimeout(1700); }
});
// E: おみせ 8秒
await stage('E shop', 240, 'おみせで きせかえ・おいしいものも', async i => {
  if (i === 0) { await E(() => { document.getElementById('chatClose').click(); __poko.S.flowers = 80; }); }
  if (i === 6) await E(() => __poko.openShop());
  if (i === 30) await E(() => document.querySelector('#shopList .item .btns button').click());
  if (i === 60) await E(() => document.querySelector('#shop .tabs button[data-tab=cloth]').click());
  if (i === 85) await clickNth('#shopList .item button', 0);
  if (i === 120) await clickNth('#shopList .item button', 3);
  if (i === 155) await clickNth('#shopList .item button', 5);
  if (i === 190) await clickNth('#shopList .item button', 7);
});
// F: つり 11秒
let reeled = false, reelHold = 0;
await stage('F fishing', 330, 'つりも たのしめる！', async i => {
  if (i === 0) { await E(() => { document.getElementById('shopBack').click(); __poko.S.rod = 3; }); }
  if (i === 4) await E(() => __poko.player().root.position.set(9, 0, 13.4));
  if (i === 20) await E(() => document.getElementById('btnFish').click());
  if (i > 30 && !reeled) {
    const vis = await E(() => !document.getElementById('btnReel').classList.contains('hidden'));
    if (vis) { reelHold++; if (reelHold > 14) { reeled = true; await E(() => document.getElementById('btnReel').click()); } }
  }
});
// G: ミニアニメ 9秒
await stage('G theater', 270, 'ポコたちの ミニアニメも みられるよ', async i => {
  if (i === 0) { await E(() => { document.getElementById('ccQuit').click(); }); await E(() => { __poko.playScene(__poko.SCENES.find(s => s.id === 'snow')); __poko.theater.t = 5; }); }
});
// H: エンドカード 5秒
await E(() => {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:linear-gradient(#bfe8ff,#ffe3ea);text-align:center;font-weight:800;color:#5a4636;font-family:"Hiragino Maru Gothic ProN","Noto Sans JP",sans-serif';
  d.innerHTML = '<div style="font-size:30px;background:#ff8fa3;color:#fff;padding:.15em 1em;border-radius:99px">ポコの ちいさなしま</div><div style="font-size:58px;line-height:1.25;color:#fff;text-shadow:0 4px 0 #e0709a,0 0 18px #ff8fa3">ポコたちの森で<br>一緒に遊ぼう！</div><div style="font-size:26px;background:#fff;padding:.3em 1.2em;border-radius:99px">スマホで いますぐ あそべるよ 🐼</div><div style="font-size:19px">あそびかたは 概要欄を みてね</div>';
  document.body.appendChild(d);
});
await stage('H end', 150, '', null);
console.log('total frames', k);
await b.close();
