/* Générateur d'identité visuelle Block THUD! — icônes launcher + splash + store.
   Tout est dessiné par code (dégradé de marque + blocs glossy 2×2 + logo.png),
   aucune dépendance. Usage : node tools/gen-branding.js */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const ROOT = path.join(__dirname, '..');
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const STORE = path.join(ROOT, 'site', 'store');

/* ---------- PNG encode ---------- */
const CRC_T = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_T[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type), data])), 8 + data.length);
  return out;
}
function encodePng(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}
/* ---------- PNG decode (RGBA 8 bits, non entrelacé) ---------- */
function decodePng(file) {
  const b = fs.readFileSync(file);
  let off = 8; const idat = []; let w = 0, h = 0, ct = 0, plte = null, trns = null;
  while (off < b.length) {
    const len = b.readUInt32BE(off), type = b.toString('ascii', off + 4, off + 8);
    const d = b.slice(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; }
    else if (type === 'IDAT') idat.push(d);
    else if (type === 'PLTE') plte = d;
    else if (type === 'tRNS') trns = d;
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = ct === 6 ? 4 : ct === 2 ? 3 : 1;
  const stride = w * ch;
  const out = Buffer.alloc(w * h * 4);
  const prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const row = raw.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0, bb = prev[i], c = i >= ch ? prev[i - ch] : 0;
      let v = row[i];
      if (f === 1) v = (v + a) & 255;
      else if (f === 2) v = (v + bb) & 255;
      else if (f === 3) v = (v + ((a + bb) >> 1)) & 255;
      else if (f === 4) {
        const p = a + bb - c, pa = Math.abs(p - a), pb = Math.abs(p - bb), pc = Math.abs(p - c);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? bb : c)) & 255;
      }
      cur[i] = v;
    }
    for (let x = 0; x < w; x++) {
      let r, g, bl, al = 255;
      if (ct === 6) { r = cur[x * 4]; g = cur[x * 4 + 1]; bl = cur[x * 4 + 2]; al = cur[x * 4 + 3]; }
      else if (ct === 2) { r = cur[x * 3]; g = cur[x * 3 + 1]; bl = cur[x * 3 + 2]; }
      else if (ct === 3) {
        const pi = cur[x] * 3; r = plte[pi]; g = plte[pi + 1]; bl = plte[pi + 2];
        if (trns && trns[cur[x]] !== undefined) al = trns[cur[x]];
      } else { r = g = bl = cur[x]; }
      const o = (y * w + x) * 4;
      out[o] = r; out[o + 1] = g; out[o + 2] = bl; out[o + 3] = al;
    }
    cur.copy(prev);
  }
  return { w, h, data: out };
}
/* ---------- utilitaires ---------- */
function hx(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function boxResize(src, tw, th) {
  const out = Buffer.alloc(tw * th * 4);
  for (let y = 0; y < th; y++) {
    const y0 = Math.floor(y * src.h / th), y1 = Math.max(y0 + 1, Math.floor((y + 1) * src.h / th));
    for (let x = 0; x < tw; x++) {
      const x0 = Math.floor(x * src.w / tw), x1 = Math.max(x0 + 1, Math.floor((x + 1) * src.w / tw));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1 && yy < src.h; yy++) for (let xx = x0; xx < x1 && xx < src.w; xx++) {
        const o = (yy * src.w + xx) * 4;
        r += src.data[o]; g += src.data[o + 1]; b += src.data[o + 2]; a += src.data[o + 3]; n++;
      }
      const o = (y * tw + x) * 4;
      out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = a / n;
    }
  }
  return { w: tw, h: th, data: out };
}
function composite(dst, src, ox, oy) {
  for (let y = 0; y < src.h; y++) {
    const dy = oy + y; if (dy < 0 || dy >= dst.h) continue;
    for (let x = 0; x < src.w; x++) {
      const dx = ox + x; if (dx < 0 || dx >= dst.w) continue;
      const so = (y * src.w + x) * 4, al = src.data[so + 3] / 255;
      if (al <= 0) continue;
      const o = (dy * dst.w + dx) * 4;
      for (let k = 0; k < 3; k++) dst.data[o + k] = src.data[so + k] * al + dst.data[o + k] * (1 - al);
      dst.data[o + 3] = Math.max(dst.data[o + 3], src.data[so + 3]);
    }
  }
}
/* dégradé de marque diagonale + halo (canvas SS déjà alloué) */
function brandBg(img) {
  const A = hx('#173fb3'), B = hx('#1486d8');
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const t = (x / img.w + y / img.h) / 2;
    let c = mix(A, B, t);
    const dx = x / img.w - .18, dy = y / img.h - .12, d = Math.sqrt(dx * dx + dy * dy);
    const glow = Math.max(0, 1 - d * 2.6) * .18;
    c = mix(c, [255, 255, 255], glow);
    const o = (y * img.w + x) * 4;
    img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
  }
}
/* bloc glossy façon gel (dessin plein, lissage par sur-échantillonnage) */
function block(img, x, y, s, colHex) {
  const L = mix(hx(colHex), [255, 255, 255], .45), B = hx(colHex), D = mix(hx(colHex), [0, 0, 0], .45);
  const r = s * .22, e = 2.2;
  for (let py = 0; py < s; py++) for (let px = 0; px < s; px++) {
    const qx = px - r, qy = py - r, cx = s / 2 - r, cy = s / 2 - r;
    const dx = Math.max(Math.abs(px - s / 2) - cx, 0), dy = Math.max(Math.abs(py - s / 2) - cy, 0);
    if (dx * dx + dy * dy > r * r) continue;
    const t = py / s;
    let c = t < .22 ? mix(L, B, t / .22) : mix(B, D, (t - .22) / .78);
    const ty = py / s;
    if (ty < .42) c = mix(c, [255, 255, 255], (1 - ty / .42) * .30);
    if (ty > .84) c = mix(c, [0, 0, 0], (ty - .84) / .16 * .18);
    const eo = Math.min(px, py, s - 1 - px, s - 1 - py);
    if (eo < e) c = mix(c, [0, 0, 0], .30);
    const o = ((y + py) * img.w + (x + px)) * 4;
    img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
  }
}
/* icône : dégradé + 2×2 blocs ; SS = sur-échantillonnage anti-crénelage */
function drawIcon(S) {
  const img = { w: 256 * S, h: 256 * S, data: Buffer.alloc(256 * S * 256 * S * 4) };
  brandBg(img);
  const s = 106 * S, g = 10 * S, off = (256 * S - (2 * s + g)) / 2;
  block(img, off, off, s, '#E85B4A');
  block(img, off + s + g, off, s, '#F5C11E');
  block(img, off, off + s + g, s, '#4CC22E');
  block(img, off + s + g, off + s + g, s, '#4A7DE8');
  return img;
}
function roundMask(img) {
  const r = img.w / 2;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const dx = x - r + .5, dy = y - r + .5, d = Math.sqrt(dx * dx + dy * dy);
    if (d > r) img.data[(y * img.w + x) * 4 + 3] = 0;
  }
  return img;
}
function roundedCorners(img, frac) {
  const r = img.w * frac;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const dx = Math.max(Math.abs(x - img.w / 2) - (img.w / 2 - r), 0);
    const dy = Math.max(Math.abs(y - img.h / 2) - (img.h / 2 - r), 0);
    if (dx * dx + dy * dy > r * r) img.data[(y * img.w + x) * 4 + 3] = 0;
  }
  return img;
}
const save = (p, img) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, encodePng(img.w, img.h, img.data)); console.log('  ✓', path.relative(ROOT, p), img.w + '×' + img.h); };
/* v60 : icône OFFICIELLE fournie (assets/branding/app-icon.png) si présente,
   sinon repli sur l'icône générée 2×2 */
const CUSTOM_ICON = path.join(ROOT, 'assets', 'branding', 'app-icon.png');
const customSrc = fs.existsSync(CUSTOM_ICON) ? decodePng(CUSTOM_ICON) : null;
const iconHi = customSrc ? boxResize(customSrc, 1024, 1024) : drawIcon(4);
let ADAPTIVE_BG = '#173FB3';
if (customSrc) {
  const px = (x, y) => { const o = (y * customSrc.w + x) * 4; return [customSrc.data[o], customSrc.data[o + 1], customSrc.data[o + 2]]; };
  const cs = [px(8, 8), px(customSrc.w - 9, 8), px(8, customSrc.h - 9), px(customSrc.w - 9, customSrc.h - 9)];
  const avg = cs[0].map((_, i) => Math.round(cs.reduce((s, c) => s + c[i], 0) / 4));
  ADAPTIVE_BG = '#' + avg.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  console.log('COULEUR_FOND_ADAPTIVE=' + ADAPTIVE_BG);
}

console.log('— Icônes launcher —');
[[48, 'mipmap-mdpi'], [72, 'mipmap-hdpi'], [96, 'mipmap-xhdpi'], [144, 'mipmap-xxhdpi'], [192, 'mipmap-xxxhdpi']].forEach(([s, d]) => {
  const p = path.join(RES, d);
  save(path.join(p, 'ic_launcher.png'), roundedCorners(boxResize(iconHi, s, s), .12));
  save(path.join(p, 'ic_launcher_round.png'), roundMask(boxResize(iconHi, s, s)));
});
console.log('— Icônes adaptives (avant-plan, zone sûre 72 %) —');
const fgHi = (() => {
  if (customSrc) {
    /* icône fournie : fond plat = couleur des coins + icône à 72 % centrée
       (le masque circulaire du launcher ne rogne rien d'important) */
    const img = { w: 1024, h: 1024, data: Buffer.alloc(1024 * 1024 * 4) };
    const bg = [parseInt(ADAPTIVE_BG.slice(1, 3), 16), parseInt(ADAPTIVE_BG.slice(3, 5), 16), parseInt(ADAPTIVE_BG.slice(5, 7), 16)];
    for (let i = 0; i < img.data.length; i += 4) { img.data[i] = bg[0]; img.data[i + 1] = bg[1]; img.data[i + 2] = bg[2]; img.data[i + 3] = 255; }
    const inner = boxResize(customSrc, 736, 736);
    composite(img, inner, (1024 - 736) / 2, (1024 - 736) / 2);
    return img;
  }
  /* repli : blocs réduits au centre (zone sûre) */
  const img = { w: 1024, h: 1024, data: Buffer.alloc(1024 * 1024 * 4) };
  const s = 190, g = 16, off = (1024 - (2 * s + g)) / 2;
  block(img, off, off, s, '#E85B4A');
  block(img, off + s + g, off, s, '#F5C11E');
  block(img, off, off + s + g, s, '#4CC22E');
  block(img, off + s + g, off + s + g, s, '#4A7DE8');
  return img;
})();
[[108, 'mipmap-mdpi'], [162, 'mipmap-hdpi'], [216, 'mipmap-xhdpi'], [324, 'mipmap-xxhdpi'], [432, 'mipmap-xxxhdpi']].forEach(([s, d]) => {
  save(path.join(RES, d, 'ic_launcher_foreground.png'), boxResize(fgHi, s, s));
});

console.log('— Splash —');
const logo = decodePng(path.join(ROOT, 'assets', 'ui', 'logo.png'));
function splash(w, h, logoFrac) {
  const img = { w, h, data: Buffer.alloc(w * h * 4) };
  brandBg(img);
  const tw = Math.round(w * logoFrac), th = Math.round(tw * logo.h / logo.w);
  composite(img, boxResize(logo, tw, th), Math.round((w - tw) / 2), Math.round(h * .40 - th / 2));
  return img;
}
save(path.join(RES, 'drawable', 'splash.png'), splash(480, 320, .42));
[['drawable-port-mdpi', 480, 800], ['drawable-port-hdpi', 720, 1280], ['drawable-port-xhdpi', 960, 1600], ['drawable-port-xxhdpi', 1440, 2560], ['drawable-port-xxxhdpi', 1920, 3200]].forEach(([d, w, h]) =>
  save(path.join(RES, d, 'splash.png'), splash(w, h, .60)));
[['drawable-land-mdpi', 800, 480], ['drawable-land-hdpi', 1280, 720], ['drawable-land-xhdpi', 1600, 960], ['drawable-land-xxhdpi', 2560, 1440], ['drawable-land-xxxhdpi', 3200, 1920]].forEach(([d, w, h]) =>
  save(path.join(RES, d, 'splash.png'), splash(w, h, .38)));

console.log('— Store —');
save(path.join(STORE, 'icon-512.png'), boxResize(iconHi, 512, 512));
const feat = { w: 1024, h: 500, data: Buffer.alloc(1024 * 500 * 4) };
brandBg(feat);
const ftw = 470, fth = Math.round(ftw * logo.h / logo.w);
composite(feat, boxResize(logo, ftw, fth), Math.round((1024 - ftw) / 2), Math.round((500 - fth) / 2));
const mini = (() => { const m = { w: 220, h: 220, data: Buffer.alloc(220 * 220 * 4) };
  const s = 92, g = 8, off = (220 - (2 * s + g)) / 2;
  block(m, off, off, s, '#E85B4A'); block(m, off + s + g, off, s, '#F5C11E');
  block(m, off, off + s + g, s, '#4CC22E'); block(m, off + s + g, off + s + g, s, '#4A7DE8'); return m })();
composite(feat, mini, 1024 - 260, (500 - 220) / 2);
save(path.join(STORE, 'feature-graphic.png'), feat);
console.log('Terminé.');
