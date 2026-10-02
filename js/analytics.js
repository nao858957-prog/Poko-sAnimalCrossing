// 匿名のアクセス解析 (GoatCounter)。個人情報・名前・会話・セーブ内容は送りません。
// 送るのは「アクセス」と「機能を使った」「◯分遊んだ」といった回数だけです。
// 管理者だけが GoatCounter のダッシュボード（ログインが必要）で集計を見られます。
import { ANALYTICS } from './config.js';

const CODE = (ANALYTICS.goatcounter || '').trim();
export const analyticsAvailable = !!CODE;
let enabled = true;
const seen = new Set();
let activeSec = 0, lastInput = Date.now();
const MILESTONES = [60, 300, 900, 1800, 3600]; // 1分・5分・15分・30分・60分

function dnt() { return navigator.doNotTrack === '1' || window.doNotTrack === '1'; }
function url(path, title, extra = '') {
  const q = `p=${encodeURIComponent(path)}&t=${encodeURIComponent(title || path)}&rnd=${Math.random().toString(36).slice(2, 8)}${extra}`;
  return `https://${CODE}.goatcounter.com/count?${q}`;
}
function send(u) {
  try { fetch(u, { mode: 'no-cors', keepalive: true, credentials: 'omit' }).catch(() => {}); }
  catch (e) { try { new Image().src = u; } catch (e2) { /* 無視 */ } }
}
export function setAnalyticsEnabled(on) { enabled = !!on; }
function active() { return analyticsAvailable && enabled && !dnt(); }

// 1セッションに1回だけ数えるイベント (例: 'shop' を使った人の数)
export function track(name, once = true) {
  if (!active()) return;
  if (once) { if (seen.has(name)) return; seen.add(name); }
  send(url('event/' + name, name, '&e=true'));
}
export function initAnalytics() {
  if (!active()) return;
  const ref = document.referrer ? `&r=${encodeURIComponent(document.referrer)}` : '';
  send(url('/', 'ポコの ちいさなしま', `${ref}&s=${innerWidth},${innerHeight},${devicePixelRatio || 1}`));
  for (const ev of ['pointerdown', 'keydown', 'touchstart']) addEventListener(ev, () => { lastInput = Date.now(); }, { passive: true });
  // 実際に遊んでいる時間(画面が見えていて、1分以内に操作があった時間)だけ数える
  setInterval(() => {
    if (document.hidden || Date.now() - lastInput > 60000) return;
    activeSec += 5;
    for (const m of MILESTONES) if (activeSec >= m) track('play-' + (m >= 3600 ? '60min' : m >= 1800 ? '30min' : m >= 900 ? '15min' : m >= 300 ? '5min' : '1min'));
  }, 5000);
}
// ゲームの「何日め」(せいちょうの目安): 2日め・3日め・7日め・14日め・30日め
export function trackDays(days) { for (const d of [2, 3, 7, 14, 30]) if (days >= d) track('return-day' + d, true); }
export function activeSeconds() { return activeSec; }
