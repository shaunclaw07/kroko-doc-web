import type { CreatureArtwork } from './types';

/**
 * Wolf — freundlich gezeichnet: warmes helles Fell, rosige Ohren, runde Kulleraugen,
 * rosa Zahnfleisch, sanfte Fangzaehne. Zwei Zaehne gleichzeitig scharf: der Biss kommt
 * seltener, dann sitzt er.
 */
const SILHOUETTE =
  'M 320 34 C 452 34 566 92 596 194 L 612 240 L 588 254 L 606 304 L 578 320 L 596 376 L 556 388 L 500 424 C 460 444 180 444 140 424 L 84 388 L 44 376 L 62 320 L 34 304 L 52 254 L 28 240 L 44 194 C 74 92 188 34 320 34 Z';

export const wolfArtwork: CreatureArtwork = {
  silhouette: SILHOUETTE,
  body:
    '<path d="M 320 34 C 452 34 566 92 596 194 L 612 240 L 588 254 L 606 304 L 578 320 ' +
    'L 596 376 L 556 388 L 500 424 C 460 444 180 444 140 424 L 84 388 L 44 376 L 62 320 ' +
    'L 34 304 L 52 254 L 28 240 L 44 194 C 74 92 188 34 320 34 Z" ' +
    'fill="#e2d3bd" stroke="#bda98f" stroke-width="3"/>' +
    '<path d="M 170 104 C 220 70 420 70 470 104" fill="none" stroke="#efe3d2" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M 120 190 C 96 250 100 320 128 372" fill="none" stroke="#f5ecdd" stroke-width="8" stroke-linecap="round"/>' +
    '<path d="M 520 190 C 544 250 540 320 512 372" fill="none" stroke="#f5ecdd" stroke-width="8" stroke-linecap="round"/>',
  holeFill: '#e58c99',
  inner:
    '<ellipse cx="320" cy="256" rx="126" ry="70" fill="#ef9fab"/>' +
    '<ellipse cx="320" cy="250" rx="80" ry="42" fill="#d97f8f"/>' +
    '<ellipse cx="320" cy="350" rx="82" ry="30" fill="#f4a3b0"/>',
  upper: { thickness: 56, fromDeg: 192, toDeg: 348, fill: '#f8c6d0', stroke: '#e5a3b0' },
  upperShell: { thickness: 52, fromDeg: 194, toDeg: 346, fill: '#f0e2cd', stroke: '#bda98f' },
  lower: { thickness: 26, fromDeg: 10, toDeg: 170, fill: '#f8c6d0', stroke: '#e5a3b0' },
  upperExtra:
    '<ellipse cx="320" cy="88" rx="34" ry="24" fill="#a48a72"/>' +
    '<ellipse cx="310" cy="82" rx="10" ry="6" fill="#d6c3aa"/>',
  face:
    '<path d="M 132 112 L 78 12 L 206 78 Z" fill="#e2d3bd" stroke="#bda98f" stroke-width="3"/>' +
    '<path d="M 508 112 L 562 12 L 434 78 Z" fill="#e2d3bd" stroke="#bda98f" stroke-width="3"/>' +
    '<path d="M 122 88 L 98 38 L 164 78 Z" fill="#f6c1c9"/>' +
    '<path d="M 518 88 L 542 38 L 476 78 Z" fill="#f6c1c9"/>' +
    '<ellipse cx="150" cy="150" rx="33" ry="28" fill="#ffffff" stroke="#bda98f" stroke-width="3"/>' +
    '<ellipse cx="490" cy="150" rx="33" ry="28" fill="#ffffff" stroke="#bda98f" stroke-width="3"/>' +
    '<circle cx="152" cy="153" r="16" fill="#b07a3a" class="pupil"/><circle cx="492" cy="153" r="16" fill="#b07a3a" class="pupil"/>' +
    '<circle cx="146" cy="146" r="6" fill="#ffffff"/><circle cx="486" cy="146" r="6" fill="#ffffff"/>' +
    '<path d="M 118 114 C 136 102 164 102 182 114" fill="none" stroke="#bda98f" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M 458 114 C 476 102 504 102 522 114" fill="none" stroke="#bda98f" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="112" cy="212" rx="20" ry="13" fill="#f2a8b6" opacity="0.45"/>' +
    '<ellipse cx="528" cy="212" rx="20" ry="13" fill="#f2a8b6" opacity="0.45"/>',
  teethProfile: (count) =>
    Array.from({ length: count }, (_, index) => {
      // Wolf: aussen runde Backenzaehne, vier mittelgrosse Fangzaehne, dazwischen Schneidezaehne.
      if (index <= 1 || index >= count - 2) {
        return { kind: 'square' as const, length: 46, width: 44 };
      }
      if (index === 2 || index === count - 3) {
        return { kind: 'cone' as const, length: 72, width: 38 };
      }
      return { kind: 'flat' as const, length: 44, width: 33 };
    }),
  shellFactor: 0.55,
  ring: { cx: 320, cy: 268, rx: 205, ry: 152, fromDeg: 90, toDeg: 450, fullCircle: true },
  label: 'Wolf mit offenem Maul und zwoelf Zaehnen, Blick von vorne oben',
};
