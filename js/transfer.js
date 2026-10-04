// ひきつぎコード: セーブデータを ちいさく まとめて、みじかい もじれつに する
//  POKO3-… : チャットの きろくを けし、にっきは ちかい 60こに して、deflate で あつしゅく
//            → 14ビットずつ 漢字 1もじに かえる (アルファベットの 2.3ばい コンパクト)
//  POKO1/2 : むかしの かたち (よみこみは できる)
const B = 0x4E00, MASK = 16383; // 漢字 (U+4E00〜U+8DFF)

async function pipe(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }

// かいわの きろくと ふるい にっきは つけない (ゲームの すすみぐあいは ぜんぶ のこる)
export function slim(raw) {
  const o = JSON.parse(raw);
  o.logs = {};
  if (Array.isArray(o.diary)) o.diary = o.diary.slice(-60);
  return JSON.stringify(o);
}

export function toKanji(bytes) {
  const n = bytes.length;
  let out = String.fromCharCode(B + (n >> 14), B + (n & MASK));
  let acc = 0, bits = 0, sum = 0;
  for (const b of bytes) {
    sum = (sum + b) & MASK;
    acc = (acc << 8) | b; bits += 8;
    while (bits >= 14) { out += String.fromCharCode(B + ((acc >> (bits - 14)) & MASK)); bits -= 14; acc &= (1 << bits) - 1; }
  }
  if (bits) out += String.fromCharCode(B + ((acc << (14 - bits)) & MASK));
  return out + String.fromCharCode(B + sum);
}
export function fromKanji(str) {
  const v = [];
  for (const ch of str) { const c = ch.codePointAt(0) - B; if (c < 0 || c > MASK) throw new Error('char'); v.push(c); }
  if (v.length < 3) throw new Error('short');
  const n = (v[0] << 14) | v[1], data = v.slice(2, -1), want = v[v.length - 1];
  if (Math.ceil(n * 8 / 14) !== data.length) throw new Error('length'); // さいごまで コピーできていない
  const out = new Uint8Array(n);
  let acc = 0, bits = 0, k = 0, sum = 0;
  for (const g of data) {
    acc = (acc << 14) | g; bits += 14;
    while (bits >= 8 && k < n) { const b = (acc >> (bits - 8)) & 255; out[k++] = b; sum = (sum + b) & MASK; bits -= 8; acc &= (1 << bits) - 1; }
  }
  if (sum !== want) throw new Error('checksum');
  return out;
}

export async function makeCode(raw) {
  const bytes = new TextEncoder().encode(slim(raw));
  if (typeof CompressionStream === 'function') return 'POKO3-' + toKanji(await pipe(bytes, new CompressionStream('deflate-raw')));
  return 'POKO4-' + toKanji(bytes);
}

const unb64 = t => { t = t.replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '='; const s = atob(t), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
export async function readCode(code) {
  const t = code.replace(/\s+/g, '');
  let bytes;
  const m = /^POKO([1-4])-(.+)$/s.exec(t);
  if (!m) throw new Error('format');
  if (m[1] === '3' || m[1] === '4') {
    bytes = fromKanji(m[2]);
    if (m[1] === '3') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  } else {
    if (!/^[A-Za-z0-9_-]+$/.test(m[2])) throw new Error('format');
    bytes = unb64(m[2]);
    if (m[1] === '2') bytes = await pipe(bytes, new DecompressionStream('gzip'));
  }
  const s = JSON.parse(new TextDecoder().decode(bytes));
  if (!s || s.v !== 1 || !s.created || !s.avatar) throw new Error('data');
  return s;
}
