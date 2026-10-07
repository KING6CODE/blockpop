/* Générateur de SFX Block THUD! — synthèse originale façon "casual puzzle juice"
   (style type Block Blast : pops brillants, glissandos montants, thuds doux).
   Sortie : WAV PCM16 mono 44.1 kHz dans assets/sfx/.
   Usage : node tools/gen-sfx.js        (tous les sons)
           node tools/gen-sfx.js place  (un seul, pour itérer vite)          */
'use strict';
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'assets', 'sfx');
const SR = 44100;

/* ---------- mini boîte à outils DSP ---------- */
function buf(sec) { return new Float32Array(Math.ceil(SR * sec)); }
/* oscillateur à phase accumulée : glissando exponentiel f0→f1 + vibrato + harmoniques */
function osc(b, { f0, f1 = null, t0 = 0, dur, amp = .5, type = 'sine',
  attack = .004, curve = 4, vibHz = 0, vibAmt = 0, harm = [] }) {
  f1 = f1 == null ? f0 : f1;
  const n = Math.min(Math.ceil(dur * SR), b.length - Math.floor(t0 * SR));
  const off = Math.floor(t0 * SR);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, k = t / dur;
    const f = f0 * Math.pow(f1 / f0, k) * (1 + vibAmt * Math.sin(2 * Math.PI * vibHz * t));
    ph += 2 * Math.PI * f / SR;
    let s = Math.sin(ph);
    if (type === 'tri') s = Math.asin(s) * 2 / Math.PI;
    else if (type === 'soft') s = Math.tanh(2.2 * s);
    for (const h of harm) s += h.a * Math.sin(h.n * ph);
    const env = t < attack ? t / attack : Math.pow(Math.max(0, 1 - (t - attack) / (dur - attack)), curve);
    b[off + i] += s * env * amp;
  }
}
/* bruit filtré (lp = fréquence du passe-bas one-pole, hp = taille du passe-haut) */
function noise(b, { t0 = 0, dur, amp = .3, lp = null, hp = 0, attack = .001, curve = 5 }) {
  const n = Math.min(Math.ceil(dur * SR), b.length - Math.floor(t0 * SR));
  const off = Math.floor(t0 * SR);
  let y = 0, yl = 0;
  const a = lp ? Math.exp(-2 * Math.PI * lp / SR) : 0;
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 2 - 1;
    if (lp) y += a * (x - y);
    let s = lp ? y : x;
    if (hp) { yl += hp / SR * (s - yl); s -= yl; }
    const t = i / SR;
    const env = t < attack ? t / attack : Math.pow(Math.max(0, 1 - (t - attack) / (dur - attack)), curve);
    b[off + i] += s * env * amp;
  }
}
function normalize(b, peak) {
  let m = 0; for (let i = 0; i < b.length; i++) m = Math.max(m, Math.abs(b[i]));
  const g = m > 0 ? peak / m : 0;
  for (let i = 0; i < b.length; i++) b[i] *= g;
}
function writeWav(name, b) {
  const n = b.length, data = Buffer.alloc(44 + n * 2);
  data.write('RIFF', 0); data.writeUInt32LE(36 + n * 2, 4); data.write('WAVE', 8);
  data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22); data.writeUInt32LE(SR, 24); data.writeUInt32LE(SR * 2, 28);
  data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, b[i]));
    data.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path.join(OUT, name + '.wav'), data);
  console.log('  ✓', name + '.wav', (n / SR).toFixed(2) + 's');
}

/* ---------- recettes (les paramètres = le "juice") ---------- */
const RECIPES = {
  /* pose : thud doux + tick d'impact — discret, très court */
  place(peak = .34) {
    const b = buf(.10);
    osc(b, { f0: 175, f1: 82, dur: .085, amp: .55, curve: 5, attack: .002 });
    noise(b, { dur: .05, amp: .20, lp: 950, curve: 6 });
    noise(b, { dur: .018, amp: .26, hp: 2000, curve: 7 });
    normalize(b, peak); return b;
  },
  /* pioche remplacée par le pick.mp3 de l'utilisateur — pas générée */
  land(peak = .30) {
    const b = buf(.13);
    osc(b, { f0: 135, f1: 68, dur: .12, amp: .5, curve: 5, attack: .003 });
    noise(b, { dur: .06, amp: .13, lp: 620, curve: 6 });
    normalize(b, peak); return b;
  },
  tap(peak = .30) {
    const b = buf(.045);
    osc(b, { f0: 1050, f1: 720, dur: .03, amp: .34, curve: 6, attack: .001 });
    noise(b, { dur: .014, amp: .30, hp: 2500, curve: 7 });
    normalize(b, peak); return b;
  },
  bad(peak = .30) {
    const b = buf(.17);
    osc(b, { f0: 150, f1: 104, dur: .15, amp: .42, type: 'soft', curve: 3, attack: .004 });
    noise(b, { dur: .09, amp: .10, lp: 420, curve: 5 });
    normalize(b, peak); return b;
  },
  /* gemme : ting cristallin double + scintillement */
  gem(peak = .50) {
    const b = buf(.32);
    osc(b, { f0: 1318.5, dur: .28, amp: .40, curve: 3.2, vibHz: 9, vibAmt: .008 });
    osc(b, { f0: 1975.5, t0: .045, dur: .25, amp: .26, curve: 3.5 });
    noise(b, { dur: .05, amp: .12, hp: 6000, curve: 6 });
    normalize(b, peak); return b;
  },
  /* montée (style/revive) : glissando ascendant doux */
  up(peak = .46) {
    const b = buf(.40);
    osc(b, { f0: 320, f1: 980, dur: .34, amp: .42, type: 'tri', curve: 2.2, vibHz: 6, vibAmt: .012 });
    osc(b, { f0: 1568, t0: .22, dur: .17, amp: .22, curve: 4 });
    normalize(b, peak); return b;
  },
  /* combo ×9 : arpège rapide ascendant + octave scintillante */
  combo9(peak = .62) {
    const b = buf(.66);
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      osc(b, { f0: f, t0: i * .05, dur: .34, amp: .34, curve: 3, harm: [{ n: 2, a: .22 }] }));
    osc(b, { f0: 2093, t0: .21, dur: .25, amp: .16, curve: 4 });
    noise(b, { t0: .02, dur: .09, amp: .12, hp: 5000, curve: 6 });
    normalize(b, peak); return b;
  },
  /* victoire : phrase pentatonique majeure ascendante + accord final */
  win(peak = .64) {
    const b = buf(1.25);
    const notes = [[523.25, 0], [587.33, .09], [659.25, .18], [783.99, .30], [880, .42], [1046.5, .58]];
    notes.forEach(([f, t]) =>
      osc(b, { f0: f, t0: t, dur: .38, amp: .30, curve: 3, harm: [{ n: 2, a: .18 }] }));
    osc(b, { f0: 261.63, dur: .95, amp: .15, curve: 1.8 });
    [523.25, 659.25, 783.99, 1046.5].forEach(f =>
      osc(b, { f0: f, t0: .60, dur: .60, amp: .15, curve: 2.6 }));
    noise(b, { t0: .56, dur: .28, amp: .09, hp: 5200, curve: 5 });
    normalize(b, peak); return b;
  },
  /* PERFECT CLEAR : balayage ascendant + accord massif + cloches hautes */
  perfect(peak = .68) {
    const b = buf(1.4);
    osc(b, { f0: 400, f1: 1600, dur: .48, amp: .26, curve: 2 });
    osc(b, { f0: 95, f1: 52, t0: .34, dur: .5, amp: .26, curve: 3 });
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(f =>
      osc(b, { f0: f, t0: .36, dur: .95, amp: .21, curve: 2.4, harm: [{ n: 2, a: .15 }] }));
    osc(b, { f0: 2093, t0: .62, dur: .40, amp: .15, curve: 3 });
    osc(b, { f0: 2637, t0: .78, dur: .40, amp: .12, curve: 3 });
    noise(b, { t0: .30, dur: .42, amp: .10, hp: 4800, curve: 3 });
    normalize(b, peak); return b;
  },
  /* revive ouvert : double note gentille montante (sifflet) */
  revive_open(peak = .44) {
    const b = buf(.34);
    osc(b, { f0: 660, f1: 990, dur: .30, amp: .40, curve: 2.4, vibHz: 7, vibAmt: .01 });
    osc(b, { f0: 1485, t0: .13, dur: .18, amp: .16, curve: 3.5 });
    normalize(b, peak); return b;
  },
  revive_tick(peak = .32) {
    const b = buf(.06);
    osc(b, { f0: 880, dur: .045, amp: .40, curve: 6, attack: .001 });
    noise(b, { dur: .01, amp: .14, hp: 3000, curve: 7 });
    normalize(b, peak); return b;
  },
  /* game over : deux notes descendantes, doux (pas punitif) */
  over(peak = .40) {
    const b = buf(.9);
    osc(b, { f0: 261.63, f1: 228, t0: 0, dur: .36, amp: .42, curve: 2 });
    osc(b, { f0: 196, f1: 158, t0: .40, dur: .48, amp: .46, curve: 2 });
    noise(b, { t0: .40, dur: .22, amp: .07, lp: 320, curve: 4 });
    normalize(b, peak); return b;
  }
};

const only = process.argv[2];
/* v57.2 : tap, place et revive_tick restent aux SONS D'ORIGINE du moteur
   (décision utilisateur) — on ne régénère jamais leurs fichiers */
const DISABLED = new Set(['tap', 'place', 'revive_tick']);
for (const name of only ? [only] : Object.keys(RECIPES)) {
  if (name === 'pick' || DISABLED.has(name)) continue;
  const fn = RECIPES[name];
  if (!fn) { console.error('recette inconnue :', name); process.exit(1); }
  writeWav(name, fn());
}
console.log('WAV écrits dans', OUT);
