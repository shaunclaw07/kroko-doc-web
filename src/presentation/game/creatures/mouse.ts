import type { CreatureArtwork } from './types';

/**
 * Maus — freundlich gezeichnet: helles Grau, zwei grosse runde Ohren mit rosa Innenflaeche,
 * Schnurrhaare, rosa Nase, runde Kulleraugen. Blick von vorne oben ins offene Maul.
 * Die Ohren stehen als eigene Kreise im Umriss, damit sie nicht im Kopf verschwinden.
 * Nur sechs Zaehne (breite Nagezaehne) — die kuerzeste Runde, also schnell viel Spannung.
 */
const SILHOUETTE =
  // Kopf
  'M 320 70 C 452 70 570 130 584 236 C 594 326 548 424 320 448 ' +
  'C 92 424 46 326 56 236 C 70 130 188 70 320 70 Z ' +
  // Linkes Ohr, rechtes Ohr
  'M 64 82 A 58 58 0 1 0 64 198 A 58 58 0 1 0 64 82 Z ' +
  'M 576 82 A 58 58 0 1 0 576 198 A 58 58 0 1 0 576 82 Z';

export const mouseArtwork: CreatureArtwork = {
  silhouette: SILHOUETTE,
  body:
    '<path d="M 320 70 C 452 70 570 130 584 236 C 594 326 548 424 320 448 ' +
    'C 92 424 46 326 56 236 C 70 130 188 70 320 70 Z" fill="#d3ccd9" stroke="#a9a1b6" stroke-width="3"/>' +
    '<path d="M 168 322 C 210 362 430 362 472 322" fill="none" stroke="#c6bed1" stroke-width="5" stroke-linecap="round"/>',
  holeFill: '#e58c99',
  inner:
    '<ellipse cx="320" cy="266" rx="106" ry="66" fill="#ef9fab"/>' +
    '<ellipse cx="320" cy="258" rx="68" ry="40" fill="#d97f8f"/>' +
    '<ellipse cx="320" cy="348" rx="70" ry="28" fill="#f4a3b0"/>',
  upper: { thickness: 50, fromDeg: 190, toDeg: 350, fill: '#f8c6d0', stroke: '#e5a3b0' },
  upperShell: { thickness: 46, fromDeg: 194, toDeg: 346, fill: '#ded8e4', stroke: '#a9a1b6' },
  lower: { thickness: 24, fromDeg: 10, toDeg: 170, fill: '#f8c6d0', stroke: '#e5a3b0' },
  upperExtra:
    // Rosa Nase mit zwei Loechern — klein und weich, damit die Maus freundlich wirkt.
    '<ellipse cx="320" cy="96" rx="25" ry="16" fill="#f2a8b6" stroke="#d98a99" stroke-width="2"/>' +
    '<ellipse cx="311" cy="92" rx="7" ry="5" fill="#c8757f"/>' +
    '<ellipse cx="329" cy="92" rx="7" ry="5" fill="#c8757f"/>',
  face:
    // Grosse runde Ohren: aussen Fellfarbe, innen rosa.
    '<circle cx="64" cy="140" r="58" fill="#d3ccd9" stroke="#a9a1b6" stroke-width="3"/>' +
    '<circle cx="64" cy="140" r="34" fill="#f6c1c9"/>' +
    '<circle cx="576" cy="140" r="58" fill="#d3ccd9" stroke="#a9a1b6" stroke-width="3"/>' +
    '<circle cx="576" cy="140" r="34" fill="#f6c1c9"/>' +
    // Schnurrhaare je Seite — kurz, im Fellstreifen neben dem Maul (nicht ueber die Augen).
    '<path d="M 142 210 C 112 202 82 198 56 196" fill="none" stroke="#a9a1b6" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M 144 236 C 110 238 78 242 50 248" fill="none" stroke="#a9a1b6" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M 142 262 C 112 272 84 282 60 292" fill="none" stroke="#a9a1b6" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M 498 210 C 528 202 558 198 584 196" fill="none" stroke="#a9a1b6" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M 496 236 C 530 238 562 242 590 248" fill="none" stroke="#a9a1b6" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M 498 262 C 528 272 556 282 580 292" fill="none" stroke="#a9a1b6" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="156" cy="160" rx="28" ry="25" fill="#ffffff" stroke="#a9a1b6" stroke-width="3"/>' +
    '<ellipse cx="484" cy="160" rx="28" ry="25" fill="#ffffff" stroke="#a9a1b6" stroke-width="3"/>' +
    '<circle cx="158" cy="163" r="13" fill="#3d3450" class="pupil"/>' +
    '<circle cx="486" cy="163" r="13" fill="#3d3450" class="pupil"/>' +
    '<circle cx="153" cy="157" r="5" fill="#ffffff"/>' +
    '<circle cx="481" cy="157" r="5" fill="#ffffff"/>' +
    '<ellipse cx="128" cy="230" rx="20" ry="13" fill="#f2a8b6" opacity="0.5"/>' +
    '<ellipse cx="512" cy="230" rx="20" ry="13" fill="#f2a8b6" opacity="0.5"/>',
  teethProfile: (count) =>
    Array.from({ length: count }, (_, index) => {
      // Maus: breite Nagezaehne; die zwei vorn (an der Maulmitte) sind die kraeftigsten.
      const front = Math.floor(count / 2);
      const atFront = Math.abs(index - front) <= 1;
      return {
        kind: 'flat' as const,
        length: atFront ? 46 : 38,
        width: atFront ? 44 : 36,
      };
    }),
  shellFactor: 0.55,
  ring: { cx: 320, cy: 276, rx: 175, ry: 142, fromDeg: 90, toDeg: 450, fullCircle: true },
  label: 'Maus mit offenem Mund und sechs Zaehnen, Blick von vorne oben',
};
