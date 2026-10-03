// はたけ: やさいの しゅるい と そだち (じっさいの じかんで そだつ。あそんでいない あいだも すすむ)
export const CROPS = {
  carrot: { id: 'carrot', emoji: '🥕', name: 'ニンジン', seed: 2, price: 4, grow: 6 * 60e3, yield: 2, note: 'はやく そだつ。6ぷんくらい' },
  tomato: { id: 'tomato', emoji: '🍅', name: 'トマト', seed: 5, price: 9, grow: 14 * 60e3, yield: 2, note: 'あまくて にんき。14ふんくらい' },
  strawberry: { id: 'strawberry', emoji: '🍓', name: 'いちご', seed: 8, price: 14, grow: 22 * 60e3, yield: 2, note: 'ケーキに ぴったり。22ふんくらい' },
  pumpkin: { id: 'pumpkin', emoji: '🎃', name: 'かぼちゃ', seed: 15, price: 40, grow: 40 * 60e3, yield: 1, note: 'おおきな ごちそう。40ぷんくらい' },
};
export const CROP_IDS = Object.keys(CROPS);
export const PLOT_N = 6;

// はたけの 1ばんぶん。w = みずを やった じこく(0=まだ) / bf = むしが つく そだちぐあい(-1=つかない) / bg = むしを とった / pk = チャオに つつかれた かず
export function newPlot(crop) { return { c: crop, w: 0, bf: Math.random() < 0.5 ? 0.35 + Math.random() * 0.4 : -1, bg: false, pk: 0 }; }
export function plotInfo(p, now = Date.now()) {
  if (!p) return { empty: true, stage: -1 };
  const cr = CROPS[p.c], frac = p.w ? Math.min(1, (now - p.w) / cr.grow) : 0;
  const ripe = !!p.w && frac >= 1;
  const stage = !p.w ? 0 : ripe ? 3 : frac >= 0.45 ? 2 : 1;
  const bug = p.bf >= 0 && !p.bg && !!p.w && frac >= p.bf;
  return { empty: false, crop: cr, frac, ripe, stage, bug, dry: !p.w, leftMs: p.w ? Math.max(0, cr.grow - (now - p.w)) : cr.grow };
}
export function harvestYield(p, info) { return Math.max(1, info.crop.yield - (info.bug ? 1 : 0) - (p.pk || 0)); }
