import type { CreatureArtwork } from './types';

/**
 * Wolf: Fellkontur mit Ohren, schmale Schnauze mit Nasenspiegel, vier große Fangzähne.
 * Zwei Zähne gleichzeitig scharf — der Biss kommt seltener, dann sitzt er.
 */
export const wolfArtwork: CreatureArtwork = {
  body:
    '<path d="M 320 34 C 452 34 566 92 596 194 L 612 240 L 588 254 L 606 304 L 578 320 ' +
    'L 596 376 L 556 388 L 500 424 C 460 444 180 444 140 424 L 84 388 L 44 376 L 62 320 ' +
    'L 34 304 L 52 254 L 28 240 L 44 194 C 74 92 188 34 320 34 Z" ' +
    'fill="#6b665e" stroke="#3d3a34" stroke-width="4"/>' +
    '<path d="M 170 104 C 220 70 420 70 470 104" fill="none" stroke="#3d3a34" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M 120 190 C 96 250 100 320 128 372" fill="none" stroke="#4f4b45" stroke-width="8" stroke-linecap="round"/>' +
    '<path d="M 520 190 C 544 250 540 320 512 372" fill="none" stroke="#4f4b45" stroke-width="8" stroke-linecap="round"/>',
  holeFill: '#241d16',
  inner:
    '<ellipse cx="320" cy="256" rx="126" ry="70" fill="#3a2c1e"/>' +
    '<ellipse cx="320" cy="248" rx="88" ry="44" fill="#241d16"/>' +
    '<ellipse cx="320" cy="350" rx="84" ry="30" fill="#b5655f"/>',
  upper: { thickness: 56, fromDeg: 192, toDeg: 348, fill: '#7d6a5b', stroke: '#4a3f34' },
  upperShell: { thickness: 52, fromDeg: 194, toDeg: 346, fill: '#a89c8c', stroke: '#726757' },
  lower: { thickness: 26, fromDeg: 10, toDeg: 170, fill: '#6b5a4c', stroke: '#4a3f34' },
  upperExtra:
    '<ellipse cx="320" cy="88" rx="34" ry="24" fill="#2b2724"/>' +
    '<ellipse cx="308" cy="80" rx="10" ry="6" fill="#5c554e"/>',
  upperTeeth: {
    ratio: 0.85,
    fromDeg: 208,
    toDeg: 332,
    inset: 3,
    fill: '#f4f1e6',
    stroke: '#c2bba4',
  },
  face:
    '<path d="M 132 112 L 78 12 L 206 78 Z" fill="#6b665e" stroke="#3d3a34" stroke-width="4"/>' +
    '<path d="M 508 112 L 562 12 L 434 78 Z" fill="#6b665e" stroke="#3d3a34" stroke-width="4"/>' +
    '<path d="M 118 86 L 92 34 L 168 74 Z" fill="#8a6f66"/>' +
    '<path d="M 522 86 L 548 34 L 472 74 Z" fill="#8a6f66"/>' +
    '<ellipse cx="150" cy="150" rx="30" ry="24" fill="#f0e6c8" stroke="#3d3a34" stroke-width="3"/>' +
    '<ellipse cx="490" cy="150" rx="30" ry="24" fill="#f0e6c8" stroke="#3d3a34" stroke-width="3"/>' +
    '<circle cx="150" cy="150" r="14" fill="#c08a2e"/><circle cx="490" cy="150" r="14" fill="#c08a2e"/>' +
    '<circle cx="150" cy="150" r="6" fill="#241d16"/><circle cx="490" cy="150" r="6" fill="#241d16"/>',
  teethProfile: (count) =>
    Array.from({ length: count }, (_, index) => {
      // Wolf: außen Backenzähne, dann die vier großen Fangzähne, dazwischen Schneidezähne.
      if (index <= 1 || index >= count - 2) {
        return { kind: 'square' as const, length: 46, width: 38 };
      }
      if (index === 2 || index === count - 3) {
        return { kind: 'cone' as const, length: 88, width: 34 };
      }
      return { kind: 'flat' as const, length: 45, width: 27 };
    }),
  shellFactor: 0.55,
  ring: { cx: 320, cy: 268, rx: 205, ry: 152, fromDeg: 16, toDeg: 164 },
  label: 'Wolf mit zwölf Zähnen, Blick von vorne oben in das offene Maul',
};
