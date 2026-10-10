import type { CreatureArtwork } from './types';

/**
 * Mensch — freundlich gezeichnet: warme Haut, sanfte Lippen, runde Kulleraugen,
 * runde Zaehne. Zwoelf drueckbare Zaehne, 1–3 gleichzeitig scharf.
 */
const SILHOUETTE =
  'M 320 40 C 452 40 566 108 578 224 C 588 320 540 412 320 444 C 100 412 52 320 62 224 C 74 108 188 40 320 40 Z';

export const humanArtwork: CreatureArtwork = {
  silhouette: SILHOUETTE,
  body:
    '<path d="M 320 40 C 452 40 566 108 578 224 C 588 320 540 412 320 444 ' +
    'C 100 412 52 320 62 224 C 74 108 188 40 320 40 Z" fill="#f7cdaa" stroke="#d9a186" stroke-width="3"/>' +
    '<path d="M 150 306 C 190 352 450 352 490 306" fill="none" stroke="#edc6a4" stroke-width="5" stroke-linecap="round"/>' +
    '<ellipse cx="150" cy="300" rx="34" ry="20" fill="#f2a8b6" opacity="0.45"/>' +
    '<ellipse cx="490" cy="300" rx="34" ry="20" fill="#f2a8b6" opacity="0.45"/>',
  holeFill: '#e58c99',
  inner:
    '<ellipse cx="320" cy="258" rx="116" ry="72" fill="#ef9fab"/>' +
    '<ellipse cx="320" cy="250" rx="74" ry="42" fill="#d97f8f"/>' +
    '<ellipse cx="320" cy="352" rx="74" ry="28" fill="#f4a3b0"/>',
  upper: { thickness: 58, fromDeg: 190, toDeg: 350, fill: '#f0959f', stroke: '#d98a99' },
  upperShell: { thickness: 44, fromDeg: 192, toDeg: 348, fill: '#f7cdaa', stroke: '#d9a186' },
  lower: { thickness: 26, fromDeg: 10, toDeg: 170, fill: '#f0959f', stroke: '#d98a99' },
  upperExtra:
    '<ellipse cx="320" cy="90" rx="38" ry="22" fill="#f7cdaa" stroke="#d9a186" stroke-width="3"/>' +
    '<ellipse cx="302" cy="98" rx="11" ry="7" fill="#c08a6a"/>' +
    '<ellipse cx="338" cy="98" rx="11" ry="7" fill="#c08a6a"/>',
  face:
    '<path d="M 130 126 C 154 112 190 112 214 126" fill="none" stroke="#c79b73" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M 426 126 C 450 112 486 112 510 126" fill="none" stroke="#c79b73" stroke-width="6" stroke-linecap="round"/>' +
    '<ellipse cx="172" cy="158" rx="33" ry="28" fill="#ffffff" stroke="#d9a186" stroke-width="3"/>' +
    '<ellipse cx="468" cy="158" rx="33" ry="28" fill="#ffffff" stroke="#d9a186" stroke-width="3"/>' +
    '<circle cx="174" cy="161" r="15" fill="#5b86a8" class="pupil"/><circle cx="470" cy="161" r="15" fill="#5b86a8" class="pupil"/>' +
    '<circle cx="168" cy="154" r="6" fill="#ffffff"/><circle cx="464" cy="154" r="6" fill="#ffffff"/>',
  teethProfile: (count) =>
    Array.from({ length: count }, (_, index) => {
      // Mensch: hinten runde Backenzaehne, dann Eckzaehne, dazwischen Schneidezaehne.
      if (index <= 2 || index >= count - 3) {
        return { kind: 'square' as const, length: 44, width: 42 };
      }
      if (index === 3 || index === count - 4) {
        return { kind: 'cone' as const, length: 54, width: 32 };
      }
      return { kind: 'flat' as const, length: 46, width: 36 };
    }),
  shellFactor: 0.55,
  ring: { cx: 320, cy: 270, rx: 190, ry: 155, fromDeg: 90, toDeg: 450, fullCircle: true },
  label: 'Mensch mit offenem Mund und zwoelf Zaehnen, Blick von vorne oben',
};
