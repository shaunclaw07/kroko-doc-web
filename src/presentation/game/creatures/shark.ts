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
    // Fuenf Kiemenschlitze je Seite — das Erkennungszeichen eines Hais.
    '<path d="M 206 214 C 199 244 198 276 205 306" fill="none" stroke="#5d8bab" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M 186 218 C 179 246 178 276 185 304" fill="none" stroke="#5d8bab" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M 166 224 C 160 250 159 276 165 300" fill="none" stroke="#5d8bab" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M 434 214 C 441 244 442 276 435 306" fill="none" stroke="#5d8bab" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M 454 218 C 461 246 462 276 455 304" fill="none" stroke="#5d8bab" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M 474 224 C 480 250 481 276 475 300" fill="none" stroke="#5d8bab" stroke-width="6" stroke-linecap="round"/>' +
    '<ellipse cx="196" cy="152" rx="35" ry="30" fill="#ffffff" stroke="#5d8bab" stroke-width="3"/>' +
    '<ellipse cx="444" cy="152" rx="35" ry="30" fill="#ffffff" stroke="#5d8bab" stroke-width="3"/>' +
    '<circle cx="198" cy="156" r="15" fill="#2f4557" class="pupil"/>' +
    '<circle cx="446" cy="156" r="15" fill="#2f4557" class="pupil"/>' +
    '<circle cx="192" cy="149" r="6" fill="#ffffff"/>' +
    '<circle cx="440" cy="149" r="6" fill="#ffffff"/>' +
    '<path d="M 162 116 C 180 102 212 102 230 116" fill="none" stroke="#5d8bab" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 410 116 C 428 102 460 102 478 116" fill="none" stroke="#5d8bab" stroke-width="5" stroke-linecap="round"/>',
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
