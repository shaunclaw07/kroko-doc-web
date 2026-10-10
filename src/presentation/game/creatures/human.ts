import type { CreatureArtwork } from './types';

/**
 * Mensch: Gesicht mit Nase, Lippen und Kinn; Schneide-, Eck- und Backenzähne.
 * Zwölf drückbare Zähne, 1–3 gleichzeitig scharf.
 */
export const humanArtwork: CreatureArtwork = {
  body:
    '<path d="M 320 40 C 452 40 566 108 578 224 C 588 320 540 412 320 444 ' +
    'C 100 412 52 320 62 224 C 74 108 188 40 320 40 Z" fill="#e8b48f" stroke="#b9805c" stroke-width="4"/>' +
    '<path d="M 150 306 C 190 352 450 352 490 306" fill="none" stroke="#cf9873" stroke-width="5" stroke-linecap="round"/>' +
    '<ellipse cx="150" cy="300" rx="34" ry="20" fill="#e09a8a" opacity="0.5"/>' +
    '<ellipse cx="490" cy="300" rx="34" ry="20" fill="#e09a8a" opacity="0.5"/>',
  holeFill: '#241d16',
  inner:
    '<ellipse cx="320" cy="258" rx="116" ry="72" fill="#3a241d"/>' +
    '<ellipse cx="320" cy="250" rx="80" ry="44" fill="#241d16"/>' +
    '<ellipse cx="320" cy="352" rx="76" ry="28" fill="#c9706a"/>',
  upper: { thickness: 58, fromDeg: 190, toDeg: 350, fill: '#c2685f', stroke: '#9a4a42' },
  upperShell: { thickness: 44, fromDeg: 192, toDeg: 348, fill: '#e8b48f', stroke: '#cf9873' },
  lower: { thickness: 26, fromDeg: 10, toDeg: 170, fill: '#b95f57', stroke: '#9a4a42' },
  upperExtra:
    '<ellipse cx="320" cy="90" rx="38" ry="22" fill="#e8b48f" stroke="#cf9873" stroke-width="3"/>' +
    '<ellipse cx="302" cy="98" rx="11" ry="7" fill="#8d5a44"/>' +
    '<ellipse cx="338" cy="98" rx="11" ry="7" fill="#8d5a44"/>',
  face:
    '<path d="M 130 126 C 154 110 190 110 214 126" fill="none" stroke="#7a5238" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M 426 126 C 450 110 486 110 510 126" fill="none" stroke="#7a5238" stroke-width="7" stroke-linecap="round"/>' +
    '<ellipse cx="172" cy="158" rx="30" ry="24" fill="#f7f2e8" stroke="#b9805c" stroke-width="3"/>' +
    '<ellipse cx="468" cy="158" rx="30" ry="24" fill="#f7f2e8" stroke="#b9805c" stroke-width="3"/>' +
    '<circle cx="172" cy="158" r="13" fill="#4a6b8a"/><circle cx="468" cy="158" r="13" fill="#4a6b8a"/>' +
    '<circle cx="172" cy="158" r="6" fill="#241d16"/><circle cx="468" cy="158" r="6" fill="#241d16"/>',
  teethProfile: (count) =>
    Array.from({ length: count }, (_, index) => {
      // Mensch: hinten Backenzähne, dann Eckzähne, dazwischen die Schneidezähne.
      if (index <= 2 || index >= count - 3) {
        return { kind: 'square' as const, length: 42, width: 36 };
      }
      if (index === 3 || index === count - 4) {
        return { kind: 'cone' as const, length: 58, width: 28 };
      }
      return { kind: 'flat' as const, length: 47, width: 32 };
    }),
  shellFactor: 0.55,
  ring: { cx: 320, cy: 270, rx: 190, ry: 155, fromDeg: 90, toDeg: 450, fullCircle: true },
  label: 'Mensch mit zwölf Zähnen, Blick von vorne oben in das offene Maul',
};
