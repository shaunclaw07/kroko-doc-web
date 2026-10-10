import type { CreatureArtwork } from './types';

/**
 * Krokodil: breite Schnauze, Schuppenkämme, Augen oben auf dem Kopf.
 * Blick von vorne oben in das offene Maul — der Oberkiefer (Schnauze + Zahnfleisch)
 * fährt beim Biss herunter, der Rachen verschwindet, darunter liegt die Kopffarbe.
 */
export const crocodileArtwork: CreatureArtwork = {
  body:
    '<path d="M 320 26 C 470 26 598 96 606 236 C 612 336 500 424 320 438 ' +
    'C 140 424 28 336 34 236 C 42 96 170 26 320 26 Z" fill="#3d6a48" stroke="#22402c" stroke-width="4"/>' +
    '<path d="M 74 190 C 58 240 60 292 78 336" fill="none" stroke="#2c4a36" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M 566 190 C 582 240 580 292 562 336" fill="none" stroke="#2c4a36" stroke-width="7" stroke-linecap="round"/>' +
    '<circle cx="96" cy="196" r="14" fill="#4b7a55"/><circle cx="82" cy="250" r="12" fill="#4b7a55"/>' +
    '<circle cx="90" cy="306" r="13" fill="#4b7a55"/><circle cx="544" cy="196" r="14" fill="#4b7a55"/>' +
    '<circle cx="558" cy="250" r="12" fill="#4b7a55"/><circle cx="550" cy="306" r="13" fill="#4b7a55"/>',
  holeFill: '#241d16',
  inner:
    '<ellipse cx="320" cy="252" rx="152" ry="78" fill="#33261a"/>' +
    '<ellipse cx="320" cy="244" rx="112" ry="52" fill="#241d16"/>' +
    '<ellipse cx="320" cy="352" rx="100" ry="30" fill="#a4554e"/>',
  upper: { thickness: 62, fromDeg: 190, toDeg: 350, fill: '#4b7a55', stroke: '#22402c' },
  upperShell: { thickness: 62, fromDeg: 197, toDeg: 343, fill: '#4b7a55', stroke: '#22402c' },
  lower: { thickness: 26, fromDeg: 8, toDeg: 172, fill: '#3d6a48', stroke: '#22402c' },
  upperExtra:
    '<ellipse cx="268" cy="70" rx="22" ry="14" fill="#22402c"/>' +
    '<ellipse cx="372" cy="70" rx="22" ry="14" fill="#22402c"/>' +
    '<ellipse cx="262" cy="66" rx="7" ry="4" fill="#6f9c78"/>' +
    '<ellipse cx="366" cy="66" rx="7" ry="4" fill="#6f9c78"/>' +
    '<path d="M 320 46 C 300 62 296 84 306 100" fill="none" stroke="#2c4a36" stroke-width="5" stroke-linecap="round"/>',
  upperTeeth: {
    ratio: 0.9,
    fromDeg: 208,
    toDeg: 332,
    inset: 4,
    fill: '#f2efe2',
    stroke: '#c2bba4',
  },
  face:
    '<ellipse cx="165" cy="132" rx="36" ry="30" fill="#f0e6c8" stroke="#22402c" stroke-width="3"/>' +
    '<ellipse cx="475" cy="132" rx="36" ry="30" fill="#f0e6c8" stroke="#22402c" stroke-width="3"/>' +
    '<ellipse cx="165" cy="132" rx="9" ry="20" fill="#241d16"/>' +
    '<ellipse cx="475" cy="132" rx="9" ry="20" fill="#241d16"/>' +
    '<path d="M 129 106 C 150 94 180 94 201 106" fill="none" stroke="#22402c" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M 439 106 C 460 94 490 94 511 106" fill="none" stroke="#22402c" stroke-width="6" stroke-linecap="round"/>',
  teethProfile: (count) =>
    Array.from({ length: count }, (_, index) => ({
      // Krokodil: gleichmäßig große Kegelzähne, abwechselnd etwas länger und kürzer.
      kind: 'cone' as const,
      length: index % 2 === 0 ? 66 : 56,
      width: index % 2 === 0 ? 30 : 27,
    })),
  shellFactor: 0.62,
  ring: { cx: 320, cy: 265, rx: 240, ry: 160, fromDeg: 18, toDeg: 162 },
  label: 'Krokodil mit zehn Zähnen, Blick von vorne oben in das offene Maul',
};
