import type { CreatureArtwork } from './types';

/**
 * Vampir — freundlich gezeichnet: blasses Lavendel-Gesicht, dunkle Haare mit Spitzenansatz,
 * dunkelroter Umhangkragen unten, runde Kulleraugen, rosa Zahnfleisch. Blick von vorne oben
 * ins offene Maul. Erkennungszeichen sind die zwei langen Eckzaehne; sie sitzen links und
 * rechts der Maulmitte (nicht an den Seiten), weil dort der „Vorderzahn“ eines Gebisses
 * liegt. Meist sind genau sie die scharfen (ein bis zwei gleichzeitig).
 */
const SILHOUETTE =
  'M 320 40 C 452 40 566 108 578 224 C 588 300 566 356 552 384 L 588 452 L 52 452 ' +
  'L 88 384 C 74 356 52 300 62 224 C 74 108 188 40 320 40 Z';

export const vampireArtwork: CreatureArtwork = {
  silhouette: SILHOUETTE,
  body:
    '<path d="M 320 40 C 452 40 566 108 578 224 C 588 300 566 356 552 384 L 588 452 L 52 452 ' +
    'L 88 384 C 74 356 52 300 62 224 C 74 108 188 40 320 40 Z" ' +
    'fill="#efe4f2" stroke="#c1aed1" stroke-width="3"/>' +
    // Umhangkragen: dunkelrot, mit heller Kante, damit er sich vom Gesicht abhebt.
    '<path d="M 92 388 C 150 372 254 366 320 366 C 386 366 490 372 548 388 ' +
    'L 588 452 L 52 452 Z" fill="#7d2231" stroke="#5c1723" stroke-width="3"/>' +
    '<path d="M 112 404 C 180 384 268 378 320 378 C 372 378 460 384 528 404" ' +
    'fill="none" stroke="#a03a48" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 320 380 L 344 452 L 296 452 Z" fill="#5c1723" opacity="0.55"/>',
  holeFill: '#e58c99',
  inner:
    '<ellipse cx="320" cy="266" rx="112" ry="66" fill="#ef9fab"/>' +
    '<ellipse cx="320" cy="258" rx="72" ry="40" fill="#d97f8f"/>' +
    '<ellipse cx="320" cy="348" rx="74" ry="28" fill="#f4a3b0"/>',
  upper: { thickness: 52, fromDeg: 190, toDeg: 350, fill: '#f0959f', stroke: '#d98a99' },
  upperShell: { thickness: 40, fromDeg: 192, toDeg: 348, fill: '#efe4f2', stroke: '#c1aed1' },
  lower: { thickness: 26, fromDeg: 10, toDeg: 170, fill: '#f0959f', stroke: '#d98a99' },
  upperExtra:
    '<ellipse cx="320" cy="108" rx="28" ry="19" fill="#efe4f2" stroke="#c1aed1" stroke-width="3"/>' +
    '<ellipse cx="311" cy="113" rx="8" ry="6" fill="#c1aed1"/>' +
    '<ellipse cx="329" cy="113" rx="8" ry="6" fill="#c1aed1"/>',
  face:
    // Spitze Ohren, klein gehalten — die Haube darueber bleibt schmal.
    '<path d="M 104 216 L 52 116 L 176 168 Z" fill="#efe4f2" stroke="#c1aed1" stroke-width="3"/>' +
    '<path d="M 536 216 L 588 116 L 464 168 Z" fill="#efe4f2" stroke="#c1aed1" stroke-width="3"/>' +
    '<path d="M 108 196 L 78 138 L 148 170 Z" fill="#f6c1c9"/>' +
    '<path d="M 532 196 L 562 138 L 492 170 Z" fill="#f6c1c9"/>' +
    '<ellipse cx="110" cy="252" rx="19" ry="12" fill="#f2a8b6" opacity="0.45"/>' +
    '<ellipse cx="530" cy="252" rx="19" ry="12" fill="#f2a8b6" opacity="0.45"/>' +
    '<path d="M 122 158 C 140 146 172 146 190 158" fill="none" stroke="#4a3b5c" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 450 158 C 468 146 500 146 518 158" fill="none" stroke="#4a3b5c" stroke-width="5" stroke-linecap="round"/>' +
    '<ellipse cx="152" cy="178" rx="30" ry="26" fill="#ffffff" stroke="#c1aed1" stroke-width="3"/>' +
    '<ellipse cx="488" cy="178" rx="30" ry="26" fill="#ffffff" stroke="#c1aed1" stroke-width="3"/>' +
    '<circle cx="154" cy="181" r="14" fill="#a8562f"/>' +
    '<circle cx="490" cy="181" r="14" fill="#a8562f"/>' +
    '<circle cx="154" cy="181" r="7" fill="#3a2d49"/>' +
    '<circle cx="490" cy="181" r="7" fill="#3a2d49"/>' +
    '<circle cx="149" cy="175" r="5" fill="#ffffff"/>' +
    '<circle cx="485" cy="175" r="5" fill="#ffffff"/>' +
    // Haare zuletzt: schmale Haube am Kopfrand mit Spitzenansatz (Zipfel zeigt zum Mund).
    '<path d="M 106 156 C 114 106 194 54 320 54 C 446 54 526 106 534 156 ' +
    'C 494 120 442 100 388 98 L 320 122 L 252 98 C 198 100 146 120 106 156 Z" ' +
    'fill="#4a3b5c" stroke="#3a2d49" stroke-width="3"/>' +
    '<path d="M 152 132 C 200 102 440 102 488 132" fill="none" stroke="#5d4b70" stroke-width="5" stroke-linecap="round"/>',
  teethProfile: (count) =>
    Array.from({ length: count }, (_, index) => {
      // Maulmitte ist die Mitte der Zahnreihe; die Eckzaehne liegen links und rechts davon.
      const front = Math.floor(count / 2);
      if (Math.abs(index - front) === 1) {
        return { kind: 'cone' as const, length: 86, width: 26 };
      }
      if (index <= 1 || index >= count - 2) {
        return { kind: 'square' as const, length: 44, width: 42 };
      }
      return { kind: 'flat' as const, length: 46, width: 34 };
    }),
  shellFactor: 0.55,
  ring: { cx: 320, cy: 278, rx: 186, ry: 138, fromDeg: 90, toDeg: 450, fullCircle: true },
  label: 'Vampir mit offenem Mund und zwoelf Zaehnen, Blick von vorne oben',
};
