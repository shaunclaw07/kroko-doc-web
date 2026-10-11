import type { CreatureArtwork } from './types';

/**
 * Loewe -- freundlich gezeichnet: bernsteinfarbenes Fell, braune Maehne, runde Ohren mit rosa
 * Innenflaeche, runde Kulleraugen, rosa Zahnfleisch. Blick von vorne oben in das offene Maul.
 *
 * Die Maehne ist die Silhouette des Tieres: ein Kranz aus Fellbuescheln um den Kopf. Sie liegt
 * **innerhalb** des Kopfumrisses nur insoweit, wie der Beschnitt sie traegt -- deshalb sind die
 * Ohren eigene Kreise im Umriss (wie bei der Maus), und der Kranz deckt bewusst nur den oberen
 * Bogen: unter dem Kinn hat eine Maehne nichts zu suchen, und die Buehne ist dort zu kurz.
 *
 * Bewusst **ohne** rosa Wangen -- die Stilregel gilt fuer die anderen Tiere, hier ist keine Flaeche
 * frei: das Maul fuellt die Kopfmitte, zwischen seinem Rand und dem Kopfumriss liegen an den Seiten
 * nur wenige Pixel Fell, und jeder groessere Fleck laege entweder auf dem Zahnfleisch oder auf der
 * Maehne. Der Wolf legt seine Wangen in `body`, damit das Maul sie deckt; hier bliebe nichts uebrig.
 */
const MAEHNE_LINKS = 165;
const MAEHNE_RECHTS = 365;
const MITTE_X = 320;
const MITTE_Y = 250;

/**
 * Fellbueschel des Kranzes. Die Kreise liegen auf einer Ellipse um den Kopf und ueberlappen
 * einander, damit eine geschlossene, weiche Fellkante entsteht -- eckige Zacken saehen aus wie
 * ein Stern, nicht wie Fell.
 */
function maneTufts(count: number, rx: number, ry: number, radius: number, fill: string, stroke: string): string {
  const step = count > 1 ? (MAEHNE_RECHTS - MAEHNE_LINKS) / (count - 1) : 0;
  let markup = '';
  for (let index = 0; index < count; index += 1) {
    const deg = MAEHNE_LINKS + step * index;
    const rad = (deg * Math.PI) / 180;
    const x = MITTE_X + rx * Math.cos(rad);
    const y = MITTE_Y + ry * Math.sin(rad);
    markup +=
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}" ` +
      `fill="${fill}" stroke="${stroke}" stroke-width="3"/>`;
  }
  return markup;
}

const KOPF =
  'M 320 64 C 448 64 546 116 552 240 C 558 350 470 438 320 450 C 170 438 82 350 88 240 C 94 116 192 64 320 64 Z';
// Die Ohren sitzen so hoch, dass sie aus der Maehne schauen und die Augen frei lassen.
const OHR_LINKS = 'M 150 26 A 46 46 0 1 0 150 118 A 46 46 0 1 0 150 26 Z';
const OHR_RECHTS = 'M 490 26 A 46 46 0 1 0 490 118 A 46 46 0 1 0 490 26 Z';

export const lionArtwork: CreatureArtwork = {
  silhouette: `${KOPF} ${OHR_LINKS} ${OHR_RECHTS}`,
  body:
    // Zwei Lagen Fell: aussen dunkel, innen heller -- das gibt der Maehne Tiefe.
    maneTufts(9, 250, 176, 50, '#c07a35', '#94541f') +
    maneTufts(9, 226, 158, 42, '#d99a4e', '#b8722f') +
    `<path d="${KOPF}" fill="#f2c469" stroke="#c2913c" stroke-width="3"/>` +
    '<path d="M 152 312 C 196 354 444 354 488 312" fill="none" stroke="#e6b667" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 120 210 C 104 258 108 320 132 368" fill="none" stroke="#f7d894" stroke-width="8" stroke-linecap="round"/>' +
    '<path d="M 520 210 C 536 258 532 320 508 368" fill="none" stroke="#f7d894" stroke-width="8" stroke-linecap="round"/>',
  holeFill: '#e58c99',
  inner:
    '<ellipse cx="320" cy="258" rx="124" ry="68" fill="#ef9fab"/>' +
    '<ellipse cx="320" cy="250" rx="78" ry="42" fill="#d97f8f"/>' +
    '<ellipse cx="320" cy="352" rx="80" ry="30" fill="#f4a3b0"/>',
  upper: { thickness: 52, fromDeg: 192, toDeg: 348, fill: '#f8c6d0', stroke: '#e5a3b0' },
  // Die Schnauze ist kein hellerer Fleck: nur die Kontur trennt sie vom Kopf.
  upperShell: { thickness: 42, fromDeg: 200, toDeg: 340, fill: '#f6d18a', stroke: '#c2913c' },
  lower: { thickness: 26, fromDeg: 10, toDeg: 170, fill: '#f8c6d0', stroke: '#e5a3b0' },
  upperExtra:
    // Braune Nase mit zwei Loechern -- sie faehrt beim Biss mit.
    '<ellipse cx="320" cy="96" rx="30" ry="19" fill="#7d4c22"/>' +
    '<ellipse cx="309" cy="93" rx="7" ry="5" fill="#4a2a12"/>' +
    '<ellipse cx="331" cy="93" rx="7" ry="5" fill="#4a2a12"/>',
  lowerExtra:
    '<path d="M 210 430 C 250 452 390 452 430 430" fill="none" stroke="#e6b667" stroke-width="5" stroke-linecap="round"/>',
  face:
    // Runde Ohren mit rosa Innenflaeche -- sie stehen aus der Maehne heraus. Keine Brauen:
    // zwischen Ohr und Augenlid ist keine Flaeche frei, ein Strich dort laege auf dem Ohr.
    '<circle cx="150" cy="72" r="46" fill="#f2c469" stroke="#c2913c" stroke-width="3"/>' +
    '<circle cx="150" cy="72" r="24" fill="#e8a0ae"/>' +
    '<circle cx="490" cy="72" r="46" fill="#f2c469" stroke="#c2913c" stroke-width="3"/>' +
    '<circle cx="490" cy="72" r="24" fill="#e8a0ae"/>' +
    '<ellipse cx="170" cy="152" rx="34" ry="29" fill="#ffffff" stroke="#c2913c" stroke-width="3"/>' +
    '<ellipse cx="470" cy="152" rx="34" ry="29" fill="#ffffff" stroke="#c2913c" stroke-width="3"/>' +
    '<circle cx="172" cy="155" r="15" fill="#a3651f" class="pupil"/>' +
    '<circle cx="468" cy="155" r="15" fill="#a3651f" class="pupil"/>' +
    '<circle cx="166" cy="148" r="6" fill="#ffffff"/>' +
    '<circle cx="462" cy="148" r="6" fill="#ffffff"/>',
  teethProfile: (count) =>
    Array.from({ length: count }, (_, index) => {
      // Loewe: oben vier breite Backenzaehne, links und rechts je ein langer Fangzahn (wie beim
      // Wolf), dazwischen und unten flache Schneidezaehne -- nur 30 echte Zaehne, aber die beissen zu.
      if (index <= 1 || index >= count - 2) {
        return { kind: 'square' as const, length: 46, width: 48 };
      }
      if (index === 2 || index === count - 3) {
        return { kind: 'cone' as const, length: 74, width: 40 };
      }
      return { kind: 'flat' as const, length: 40, width: 30 };
    }),
  shellFactor: 0.55,
  ring: { cx: 320, cy: 268, rx: 200, ry: 150, fromDeg: 90, toDeg: 450, fullCircle: true },
  label: 'Loewe mit Maehne und offenem Maul, zwoelf Zaehne, Blick von vorne oben',
};
