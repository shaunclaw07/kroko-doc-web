import type { CreatureArtwork } from './types';

/**
 * Saebelzahntiger (Smilodon) -- ausgestorben, aber der bekannteste Kopf unter den Raubkatzen:
 * sandfarbenes Fell, kurze runde Ohren, kraeftige Backen und **zwei sehr lange obere Eckzaehne**.
 *
 * Die Saebel sind das ganze Tier: echte Smilodon-Saebel ragten bis zu 20 cm aus dem Kiefer
 * ("bis zu 20 cm aus dem Kiefer", de.wikipedia, *Smilodon*), das Gebiss hatte 26 bis 28 Zaehne.
 * Im Spiel bekommen die beiden oberen Eckzaehne deshalb die groesste Laenge, die der Ring traegt:
 * die Spitze bleibt innerhalb der Kopfsilhouette, damit beim Zuschnappen nichts daneben haengt.
 *
 * Bewusst **ohne Maehne** -- der Kopf soll sich vom Loewen unterscheiden, und ohne Kranz bleibt
 * mehr Fellflaeche fuer die Wangen frei. Die Ohren stehen als eigene Kreise im Umriss.
 */
const KOPF =
  'M 320 64 C 448 64 546 116 552 240 C 558 350 470 438 320 450 C 170 438 82 350 88 240 C 94 116 192 64 320 64 Z';
const OHR_LINKS = 'M 150 16 A 44 44 0 1 0 150 104 A 44 44 0 1 0 150 16 Z';
const OHR_RECHTS = 'M 490 16 A 44 44 0 1 0 490 104 A 44 44 0 1 0 490 16 Z';

export const sabertoothArtwork: CreatureArtwork = {
  silhouette: `${KOPF} ${OHR_LINKS} ${OHR_RECHTS}`,
  body:
    `<path d="${KOPF}" fill="#d9a35c" stroke="#a8732f" stroke-width="3"/>` +
    // Kraeftige Backen: zwei weiche Fellknoepfe unterhalb der Ohren. Sie liegen **innerhalb** des
    // Kopfumrisses (gemessen: Kopfrand bei y 178 rund x 92 -- der Knopf beginnt bei 98).
    '<circle cx="122" cy="178" r="24" fill="#e0ad69"/>' +
    '<circle cx="518" cy="178" r="24" fill="#e0ad69"/>' +
    // Fellschatten an den Seiten und eine weiche Kinnkante.
    '<path d="M 132 202 C 116 252 120 316 142 364" fill="none" stroke="#f0bd7a" stroke-width="8" stroke-linecap="round"/>' +
    '<path d="M 508 202 C 524 252 520 316 498 364" fill="none" stroke="#f0bd7a" stroke-width="8" stroke-linecap="round"/>' +
    '<path d="M 158 310 C 198 352 442 352 482 310" fill="none" stroke="#c08f47" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 250 96 C 276 84 364 84 390 96" fill="none" stroke="#c08f47" stroke-width="5" stroke-linecap="round"/>' +
    // Kurze runde Ohren mit rosa Innenflaeche.
    '<circle cx="150" cy="60" r="44" fill="#d9a35c" stroke="#a8732f" stroke-width="3"/>' +
    '<circle cx="490" cy="60" r="44" fill="#d9a35c" stroke="#a8732f" stroke-width="3"/>' +
    '<circle cx="150" cy="64" r="20" fill="#e8a0ae"/>' +
    '<circle cx="490" cy="64" r="20" fill="#e8a0ae"/>' +
    // Wangen im Fellstreifen zwischen Maul und Kopfrand (bei y 300 ist er breit genug).
    '<ellipse cx="108" cy="300" rx="15" ry="10" fill="#f2a8b6" opacity="0.5"/>' +
    '<ellipse cx="532" cy="300" rx="15" ry="10" fill="#f2a8b6" opacity="0.5"/>',
  holeFill: '#e58c99',
  inner:
    '<ellipse cx="320" cy="258" rx="124" ry="68" fill="#ef9fab"/>' +
    '<ellipse cx="320" cy="250" rx="78" ry="42" fill="#d97f8f"/>' +
    '<ellipse cx="320" cy="352" rx="80" ry="30" fill="#f4a3b0"/>',
  upper: { thickness: 52, fromDeg: 192, toDeg: 348, fill: '#f8c6d0', stroke: '#e5a3b0' },
  // Die Schnauze ist kein hellerer Fleck: eine Stufe heller als das Fell, nur die Kontur trennt.
  upperShell: { thickness: 42, fromDeg: 200, toDeg: 340, fill: '#e2b273', stroke: '#a8732f' },
  lower: { thickness: 26, fromDeg: 10, toDeg: 170, fill: '#f8c6d0', stroke: '#e5a3b0' },
  upperExtra:
    // Breite Nase mit zwei Loechern -- sie faehrt beim Biss mit.
    '<ellipse cx="320" cy="98" rx="32" ry="18" fill="#7d4c22"/>' +
    '<ellipse cx="309" cy="96" rx="7" ry="5" fill="#4a2a12"/>' +
    '<ellipse cx="331" cy="96" rx="7" ry="5" fill="#4a2a12"/>',
  lowerExtra:
    '<path d="M 214 430 C 250 452 390 452 426 430" fill="none" stroke="#c08f47" stroke-width="5" stroke-linecap="round"/>',
  face:
    // Kulleraugen wie beim Loewen, nur etwas schmaler -- darueber ein dunkler Brauenbogen,
    // damit der Blick ernst wird, ohne dass ein Strich auf dem Ohr landet.
    '<path d="M 136 132 C 154 114 190 112 206 122" fill="none" stroke="#a8732f" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M 504 132 C 486 114 450 112 434 122" fill="none" stroke="#a8732f" stroke-width="6" stroke-linecap="round"/>' +
    '<ellipse cx="170" cy="162" rx="32" ry="26" fill="#ffffff" stroke="#a8732f" stroke-width="3"/>' +
    '<ellipse cx="470" cy="162" rx="32" ry="26" fill="#ffffff" stroke="#a8732f" stroke-width="3"/>' +
    '<circle cx="172" cy="165" r="14" fill="#a3651f" class="pupil"/>' +
    '<circle cx="468" cy="165" r="14" fill="#a3651f" class="pupil"/>' +
    '<circle cx="166" cy="158" r="6" fill="#ffffff"/>' +
    '<circle cx="462" cy="158" r="6" fill="#ffffff"/>',
  teethProfile: (count) =>
    Array.from({ length: count }, (_, index) => {
      // Die zwei Saebel: die oberen Eckzaehne links und rechts der Ringmitte (count/2). Sie sind
      // fast doppelt so lang wie der Fangzahn des Loewen und bleiben trotzdem im Ring.
      const oben = Math.floor(count / 2);
      if (index === oben - 1 || index === oben + 1) {
        return { kind: 'cone' as const, length: 132, width: 34 };
      }
      // Die unteren Eckzaehne sind kurz -- ein Saebelzahntiger biss mit dem Oberkiefer zu.
      if (index === 1 || index === count - 1) {
        return { kind: 'cone' as const, length: 62, width: 34 };
      }
      if (index === 0 || index === oben) {
        return { kind: 'square' as const, length: 42, width: 46 };
      }
      return { kind: 'flat' as const, length: 40, width: 30 };
    }),
  shellFactor: 0.55,
  ring: { cx: 320, cy: 268, rx: 200, ry: 150, fromDeg: 90, toDeg: 450, fullCircle: true },
  label: 'Saebelzahntiger mit zwei langen Eckzaehnen und offenem Maul, zwoelf Zaehne',
};
