import type { CreatureArtwork } from './types';

/**
 * Panther -- der schwarze Panther ist die melanistische Form des Leoparden (Panthera pardus).
 * Freundlich gezeichnet: tiefschwarzes Fell mit den schwach durchscheinenden Rosetten, gelbe
 * Augen, rosa Zahnfleisch. Blick von vorne oben in das offene Maul.
 *
 * **Vier Fangzaehne** -- das ist der Unterschied zum Loewen, der zwei hat. Raubkatzen besitzen
 * vier dolchartige Eckzaehne, je einen oben und unten links und rechts; sie sitzen im Ring genau
 * einen Platz neben der Ringmitte (die Mitte oben ist Zahn count/2, die Mitte unten Zahn 0), also
 * neben den Schneidezaehnen. Gespiegelt wird ueber den Index: der Zwilling von i ist count - i,
 * fuer 12 Zaehne sind das die Paare (1, 11) und (5, 7).
 *
 * Die Ohren stehen als eigene Kreise im Umriss (wie bei Maus, Panda und Loewe): alles ausserhalb
 * des Kopfumrisses wird weggeschnitten.
 *
 * Die Augen tragen einen **gelben** Irisring statt des hellblauen des Spielzeugs -- Kulleraugen
 * bleiben es, aber ein schwarzer Panther mit blauen Augen waere ein anderer Kopf. Die Pupille
 * bleibt rund und dunkelbraun, keine Spaltpupille (Regel fuer Kinder).
 */
const KOPF =
  'M 320 58 C 452 58 552 116 566 238 C 576 344 508 434 320 448 C 132 434 64 344 74 238 C 88 116 188 58 320 58 Z';
const OHR_LINKS = 'M 150 30 A 50 50 0 1 0 150 130 A 50 50 0 1 0 150 30 Z';
const OHR_RECHTS = 'M 490 30 A 50 50 0 1 0 490 130 A 50 50 0 1 0 490 30 Z';

export const pantherArtwork: CreatureArtwork = {
  silhouette: `${KOPF} ${OHR_LINKS} ${OHR_RECHTS}`,
  body:
    `<path d="${KOPF}" fill="#3e3e46" stroke="#2b2b33" stroke-width="3"/>` +
    // Kein Rosettenkranz und keine Fellglanzlinien: das Maul deckt fast die ganze Kopffläche,
    // und was daneben frei bleibt, ist ein schmaler Streifen. Ringe darin sahen wie Flecken aus,
    // nicht wie Fell (in drei Fassungen angesehen). Die Kopfform tragen deshalb die Kontur, die
    // helle Kinnkante und die Ohren.
    '<path d="M 150 316 C 196 358 444 358 490 316" fill="none" stroke="#4c4c57" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 128 206 C 112 254 116 318 138 366" fill="none" stroke="#4c4c57" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M 512 206 C 528 254 524 318 502 366" fill="none" stroke="#4c4c57" stroke-width="6" stroke-linecap="round"/>' +
    // Runde Ohren -- die Innenflaeche ist nur eine Stufe heller, sonst leuchteten sie wie Lampen.
    '<circle cx="150" cy="80" r="50" fill="#3e3e46" stroke="#2b2b33" stroke-width="3"/>' +
    '<circle cx="490" cy="80" r="50" fill="#3e3e46" stroke="#2b2b33" stroke-width="3"/>' +
    '<circle cx="150" cy="84" r="22" fill="#5a5a66"/>' +
    '<circle cx="490" cy="84" r="22" fill="#5a5a66"/>' +
    // Wangen im Fellstreifen zwischen Maul und Kopfrand; bei y 300 ist er breit genug
    // (gemessen: der Maulrand liegt dort bei x 124, der Kopfrand bei x 92).
    '<ellipse cx="106" cy="300" rx="15" ry="10" fill="#f2a8b6" opacity="0.5"/>' +
    '<ellipse cx="534" cy="300" rx="15" ry="10" fill="#f2a8b6" opacity="0.5"/>',
  holeFill: '#e58c99',
  inner:
    '<ellipse cx="320" cy="258" rx="122" ry="68" fill="#ef9fab"/>' +
    '<ellipse cx="320" cy="250" rx="78" ry="42" fill="#d97f8f"/>' +
    '<ellipse cx="320" cy="352" rx="80" ry="30" fill="#f4a3b0"/>',
  upper: { thickness: 54, fromDeg: 192, toDeg: 348, fill: '#f8c6d0', stroke: '#e5a3b0' },
  // Die Schnauze ist kein heller Fleck: eine Stufe heller als das Fell. Auf fast schwarzem Fell
  // muss der Unterschied groesser sein als beim Wolf, sonst verschwindet die Schnauze und die
  // Nase schwebt (in der ersten Fassung genau so gesehen).
  upperShell: { thickness: 42, fromDeg: 198, toDeg: 342, fill: '#4e4e5a', stroke: '#33333d' },
  lower: { thickness: 26, fromDeg: 10, toDeg: 170, fill: '#f8c6d0', stroke: '#e5a3b0' },
  upperExtra:
    // Katzennase: gerundetes Dreieck mit zwei Loechern -- sie faehrt beim Biss mit.
    '<path d="M 298 94 C 298 82 342 82 342 94 C 342 106 330 112 320 112 C 310 112 298 106 298 94 Z" fill="#b4878f"/>' +
    '<ellipse cx="309" cy="92" rx="6" ry="4" fill="#7d5a61"/>' +
    '<ellipse cx="331" cy="92" rx="6" ry="4" fill="#7d5a61"/>',
  lowerExtra:
    '<path d="M 214 428 C 250 450 390 450 426 428" fill="none" stroke="#33333c" stroke-width="5" stroke-linecap="round"/>',
  face:
    // Kulleraugen mit gelbem Irisring. Die Pupille ist rund und dunkelbraun -- nie schwarz,
    // nie ein Schlitz (Regel fuer Kinder).
    '<ellipse cx="170" cy="166" rx="33" ry="28" fill="#ffffff"/>' +
    '<ellipse cx="470" cy="166" rx="33" ry="28" fill="#ffffff"/>' +
    '<circle cx="172" cy="168" r="21" fill="#f0c14b"/>' +
    '<circle cx="468" cy="168" r="21" fill="#f0c14b"/>' +
    '<circle cx="173" cy="169" r="13" fill="#4a3320" class="pupil"/>' +
    '<circle cx="467" cy="169" r="13" fill="#4a3320" class="pupil"/>' +
    '<circle cx="165" cy="159" r="6" fill="#ffffff"/>' +
    '<circle cx="459" cy="159" r="6" fill="#ffffff"/>',
  teethProfile: (count) =>
    Array.from({ length: count }, (_, index) => {
      // Ringmitte oben = Zahn count/2, unten = Zahn 0. Die vier Eckzaehne sitzen daneben:
      // links und rechts im Oberkiefer (oben - 1, oben + 1) und im Unterkiefer (1, count - 1).
      const oben = Math.floor(count / 2);
      if (index === oben - 1 || index === oben + 1 || index === 1 || index === count - 1) {
        return { kind: 'cone' as const, length: 76, width: 40 };
      }
      // Die zwei Mittezaehne je Kiefer sind breite Schneidezaehne (wie beim Raubtiergebiss).
      if (index === 0 || index === oben) {
        return { kind: 'square' as const, length: 42, width: 46 };
      }
      return { kind: 'flat' as const, length: 40, width: 32 };
    }),
  shellFactor: 0.55,
  ring: { cx: 320, cy: 270, rx: 200, ry: 150, fromDeg: 90, toDeg: 450, fullCircle: true },
  label: 'Schwarzer Panther mit offenem Maul und zwoelf Zaehnen, Blick von vorne oben',
};
