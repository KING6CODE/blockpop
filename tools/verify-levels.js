/* Vérification automatique des niveaux d'Aventure (v56).
   Extrait le VRAI code de index.html (hintFor, LEVELS, gemPreset, MAP_ROWS)
   et fait échouer le script au moindre invariant violé.
   Usage : node tools/verify-levels.js  */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function slice(startMark, endMark) {
  const a = html.indexOf(startMark);
  const b = html.indexOf(endMark, a);
  if (a < 0 || b < 0) throw new Error('marqueur introuvable: ' + startMark);
  return html.slice(a, b + endMark.length);
}
const code = [
  slice('/* ============ 120 NIVEAUX PROCÉDURAUX (v56) ============', 'return L})();'),
  slice('function gemPreset(count)', 'return rows}'),
  slice('const MAP_ROWS=', ';')
].join('\n');
const sandbox = {};
(new Function('sandbox', code + '\nsandbox.LEVELS=LEVELS;sandbox.gemPreset=gemPreset;sandbox.MAP_ROWS=MAP_ROWS;'))(sandbox);
const { LEVELS, gemPreset, MAP_ROWS } = sandbox;

let failures = 0;
const fail = msg => { failures++; console.error('  ✗ ' + msg); };
const ok = msg => console.log('  ✓ ' + msg);

console.log('== Structure ==');
if (LEVELS.length !== 120) fail('LEVELS.length=' + LEVELS.length + ' (attendu 120)'); else ok('120 niveaux');
const sum = MAP_ROWS.reduce((a, b) => a + b, 0);
if (sum !== LEVELS.length) fail('MAP_ROWS somme=' + sum + ' ≠ ' + LEVELS.length); else ok('carte trophée : 14 rangées, somme ' + sum + ' = nb niveaux');

console.log('== Objectifs : bornes et cohérence ==');
const TYPES = { lines: [3, 18], gems: [4, 18], score: [6000, 15000], combo: [2, 6], chain: [2, 4] };
const seen = {};
let prevTypeVal = {};
LEVELS.forEach((l, i) => {
  const [t, v] = l.obj;
  if (!TYPES[t]) return fail('niveau ' + (i + 1) + ' : type inconnu ' + t);
  if (v < TYPES[t][0] || v > TYPES[t][1]) fail('niveau ' + (i + 1) + ' : ' + t + '=' + v + ' hors bornes [' + TYPES[t] + ']');
  if (!(l.s2 > 0) || !(l.s3 > l.s2)) fail('niveau ' + (i + 1) + ' : étoiles incohérentes s2=' + l.s2 + ' s3=' + l.s3);
  if (t === 'score' && l.s3 > 21000) fail('niveau ' + (i + 1) + ' : 3 étoiles à ' + l.s3 + ' pts > plafond réaliste (~20k)');
  // monotonie par position dans le cycle (chaque série doit être croissante)
  const k = i % 6;
  if (prevTypeVal[k] != null && v < prevTypeVal[k]) fail('niveau ' + (i + 1) + ' : régression ' + t + ' ' + prevTypeVal[k] + '→' + v);
  prevTypeVal[k] = v;
  seen[t] = (seen[t] || 0) + 1;
});
ok('types : ' + JSON.stringify(seen));

console.log('== maxPieces (anti-grind) ==');
LEVELS.forEach((l, i) => {
  const [t, v] = l.obj;
  if (t === 'lines') {
    if (i >= 12) {
      if (l.maxPieces !== v * 4) fail('niveau ' + (i + 1) + ' : maxPieces=' + l.maxPieces + ' attendu ' + v * 4);
      // faisabilité : pièces × 3.2 cases moyennes ≥ cases à nettoyer + 30 % de marge
      if (l.maxPieces * 3.2 < v * 8 * 1.3) fail('niveau ' + (i + 1) + ' : maxPieces insuffisant (' + l.maxPieces + ' pour ' + v + ' lignes)');
    } else if (l.maxPieces !== undefined) fail('niveau ' + (i + 1) + ' : maxPieces prématuré (i<12)');
  } else if (l.maxPieces !== undefined) fail('niveau ' + (i + 1) + ' : maxPieces sur un niveau ' + t);
});
ok('maxPieces = 4×lignes à partir du niveau 13, suffisant (marge 30 %)');

console.log('== gemPreset : génère toujours le bon nombre (500 tirages/niveau) ==');
let gemBad = 0;
LEVELS.filter(l => l.obj[0] === 'gems').forEach(l => {
  for (let r = 0; r < 500; r++) {
    const rows = gemPreset(l.obj[1]);
    let n = 0;
    rows.forEach(row => { for (const ch of row) if (ch >= 'A' && ch <= 'H') n++; });
    if (n !== l.obj[1]) { gemBad++; fail('gemmes: ' + n + ' ≠ ' + l.obj[1] + ' (tirage ' + r + ')'); break; }
  }
});
if (!gemBad) ok('tous les niveaux gemmes génèrent exactement leur quota');

console.log('== Progression (échantillon) ==');
[0, 12, 24, 48, 72, 96, 104, 110, 116, 119].forEach(i => {
  const l = LEVELS[i];
  console.log('  Niv ' + String(i + 1).padStart(3) + ' : ' + l.obj[0].padEnd(6) + ' ' + String(l.obj[1]).padStart(6) +
    '  ★2=' + String(l.s2).padStart(6) + ' ★3=' + String(l.s3).padStart(6) +
    (l.maxPieces ? ' pièces≤' + l.maxPieces : ''));
});

console.log('== Ancien vs nouveau (preuve du rééquilibrage) ==');
const oldScore = i => 8000 + i * 1000;
console.log('  Ancien niveau 93 (score) : ' + oldScore(92).toLocaleString('en-US') + ' pts → INATTEIGNABLE (~10-15k max/niveau)');
const l93 = LEVELS[92];
console.log('  Nouveau niveau 93 (score) : ' + l93.obj[1].toLocaleString('en-US') + ' pts (plafond 15k)');

if (failures) { console.error('\n' + failures + ' ÉCHEC(S)'); process.exit(1); }
console.log('\nTOUS LES CONTRÔLES PASSENT');
