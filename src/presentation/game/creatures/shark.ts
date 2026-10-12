import type { CreatureArtwork } from './types';

/**
 * Hai — freundlich gezeichnet: helles Blau, weiche Umrisse, runde Kulleraugen, rosa
 * Zahnfleisch, runder Rachen. Blick von vorne oben ins offene Maul. Erkennungszeichen sind
 * die beiden Brustflossen (im Umriss als spitze Fluegel) und die Kiemenschlitze, die im
 * Gesicht gezeichnet werden — dort liegen sie ueber dem Kieferband und bleiben sichtbar.
 * Der Kopf laeuft nach oben schmal zu (Schnauze), unten ist er breit.
 * Zwei Zaehne gleichzeitig scharf: der Biss kommt selten, dann sitzt er.
 */
const SILHOUETTE =
  'M 320 34 C 402 36 458 68 488 120 C 512 164 536 196 560 214 L 640 258 L 540 320 ' +
  'C 520 380 450 440 320 448 C 190 440 120 380 100 320 L 0 258 L 80 214 ' +
  'C 104 196 128 164 152 120 C 182 68 238 36 320 34 Z';

export const sharkArtwork: CreatureArtwork = {
  silhouette: SILHOUETTE,
  body:
    '<path d="M 320 34 C 402 36 458 68 488 120 C 512 164 536 196 560 214 L 640 258 L 540 320 ' +
    'C 520 380 450 440 320 448 C 190 440 120 380 100 320 L 0 258 L 80 214 ' +
    'C 104 196 128 164 152 120 C 182 68 238 36 320 34 Z" ' +
    'fill="#8fb8d6" stroke="#5d8bab" stroke-width="3"/>' +
    // Helle Flanken auf dem Kopf, damit die Flaeche nicht flach wirkt.
    '<path d="M 138 196 C 118 246 118 300 140 344" fill="none" stroke="#aacbe4" stroke-width="8" stroke-linecap="round"/>' +
    '<path d="M 502 196 C 522 246 522 300 500 344" fill="none" stroke="#aacbe4" stroke-width="8" stroke-linecap="round"/>',
  holeFill: '#e58c99',
  inner:
    '<ellipse cx="320" cy="252" rx="132" ry="70" fill="#ef9fab"/>' +
    '<ellipse cx="320" cy="246" rx="86" ry="42" fill="#d97f8f"/>' +
    '<ellipse cx="320" cy="344" rx="86" ry="30" fill="#f4a3b0"/>',
  upper: { thickness: 54, fromDeg: 190, toDeg: 350, fill: '#f8c6d0', stroke: '#e5a3b0' },
  upperShell: { thickness: 46, fromDeg: 194, toDeg: 346, fill: '#9dc0da', stroke: '#5d8bab' },
  lower: { thickness: 26, fromDeg: 10, toDeg: 170, fill: '#f8c6d0', stroke: '#e5a3b0' },
  upperExtra:
    // Schnauzenspitze mit zwei Nasenloechern — ein Hai riecht, er sieht nicht zuerst.
    '<ellipse cx="276" cy="74" rx="18" ry="11" fill="#5d8bab"/>' +
    '<ellipse cx="364" cy="74" rx="18" ry="11" fill="#5d8bab"/>' +
    '<ellipse cx="272" cy="71" rx="6" ry="4" fill="#aacbe4"/>' +
    '<ellipse cx="360" cy="71" rx="6" ry="4" fill="#aacbe4"/>',
  face:
    // Brustflossen: aussen im Umriss, hier mit Flossenfarbe und heller Kante gezeichnet.
    '<path d="M 100 250 L 12 258 L 96 300 Z" fill="#7aa6c6" stroke="#4f7c9c" stroke-width="3"/>' +
    '<path d="M 540 250 L 628 258 L 544 300 Z" fill="#7aa6c6" stroke="#4f7c9c" stroke-width="3"/>' +
    '<path d="M 94 256 C 66 260 40 266 20 274" fill="none" stroke="#aacbe4" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M 546 256 C 574 260 600 266 620 274" fill="none" stroke="#aacbe4" stroke-width="4" stroke-linecap="round"/>' +
    // Drei Kiemenschlitze je Seite (sechs zusammen) — das Erkennungszeichen eines Hais. Sie
    // liegen **aussen auf dem Kopf** am Flossenansatz, nicht im Maul: der Maulring (Ellipse
    // 200x150 um 320/262) hat bei y=208 seinen Rand links bei x=133, bei y=244 bei x=121. Der
    // innerste Schlitz endet bei x=112 — vorher reichte er bis x=127 und lag damit auf dem
    // Wurzelrand eines Seitenzahns (gemessen bei 7 und 11 Zaehnen).
    '<path d="M 113 208 C 107 220 106 232 112 244" fill="none" stroke="#5d8bab" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 102 204 C 96 217 95 231 101 243" fill="none" stroke="#5d8bab" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 91 212 C 85 224 84 234 90 244" fill="none" stroke="#5d8bab" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 527 208 C 533 220 534 232 528 244" fill="none" stroke="#5d8bab" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 538 204 C 544 217 545 231 539 243" fill="none" stroke="#5d8bab" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 549 212 C 555 224 556 234 550 244" fill="none" stroke="#5d8bab" stroke-width="5" stroke-linecap="round"/>' +
    // Augen im Fellstreifen ueber dem Zahnring; die Braue liegt als Lid auf der Augenkante.
    '<ellipse cx="212" cy="98" rx="28" ry="25" fill="#ffffff" stroke="#5d8bab" stroke-width="3"/>' +
    '<ellipse cx="428" cy="98" rx="28" ry="25" fill="#ffffff" stroke="#5d8bab" stroke-width="3"/>' +
    '<circle cx="213.5" cy="101" r="12" fill="#2f4557" class="pupil"/>' +
    '<circle cx="429.5" cy="101" r="12" fill="#2f4557" class="pupil"/>' +
    '<circle cx="209" cy="95.5" r="5" fill="#ffffff"/>' +
    '<circle cx="425" cy="95.5" r="5" fill="#ffffff"/>' +
    '<path d="M 186 87 A 29 26 0 0 1 238 87" fill="none" stroke="#5d8bab" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M 402 87 A 29 26 0 0 1 454 87" fill="none" stroke="#5d8bab" stroke-width="4" stroke-linecap="round"/>',
  teethProfile: (count) =>
    Array.from({ length: count }, (_, index) => ({
      // Hai: gleichmaessige, runde Raubtierzahn-Reihe, abwechselnd etwas laenger und kuerzer.
      kind: 'cone' as const,
      length: index % 2 === 0 ? 56 : 46,
      width: index % 2 === 0 ? 32 : 28,
    })),
  shellFactor: 0.6,
  ring: { cx: 320, cy: 262, rx: 200, ry: 150, fromDeg: 90, toDeg: 450, fullCircle: true },
  label: 'Hai mit offenem Maul und zwoelf Zaehnen, Blick von vorne oben',
};
