import type { CreatureArtwork } from './types';

/**
 * T-Rex -- die zweite Bonusfigur und das letzte Ziel der Freischaltung (ab 28 Sternen).
 *
 * Unterscheiden muss er sich vor allem vom Krokodil, dem einzigen anderen Reptil im Spiel:
 *
 * - **Farbe:** warmes Orangebraun statt Gruen (vom Auftraggeber gewaehlt, 13.10.2026).
 * - **Silhouette:** ein kantiger Schaedel mit **zwei Hoeckern ueber den Augen** -- der Umriss
 *   steigt links und rechts der Stirnmitte an, statt wie beim Krokodil rund zu laufen. Die Hoecker
 *   stehen im **selben** Pfad wie der Kopf, nicht als Teilpfade: so gibt es keine zweite
 *   Laufrichtung, die im Beschnitt (Nonzero-Regel) ein Loch schneiden koennte.
 * - **Die winzigen Aermchen:** sie ragen links und rechts unten aus dem Kopfumriss und liegen
 *   deshalb in der Koerperebene, **vor** dem Kopf gezeichnet -- der Kopf deckt ihren Ansatz zu.
 *   Die Arme eines echten T. rex waren nur rund einen Meter lang (de.wikipedia, *Tyrannosaurus*).
 * - **Stirnstreifen:** dunkle Streifen auf den Hoeckern und an den Flanken, nur dort, wo wirklich
 *   Haut liegt (ausserhalb der Schnauzenflaeche und des Zahnrings).
 *
 * Bewusst **ohne Federn**: fuer T. rex selbst sind sie nicht belegt, und Kinder erwarten ihn ohne.
 * Zaehne rund und cremefarben wie bei allen; die zwei vorderen oberen sind etwas laenger.
 */
const KOPF =
  'M 320 70 C 346 70 366 54 396 44 C 440 30 500 52 528 96 C 552 134 572 190 572 250 ' +
  'C 572 330 548 392 498 422 C 450 448 380 452 320 452 C 260 452 190 448 142 422 ' +
  'C 92 392 68 330 68 250 C 68 190 88 134 112 96 C 140 52 200 30 244 44 C 274 54 294 70 320 70 Z';

const HAUT = '#dd7a3a';
const HAUT_DUNKEL = '#9c4a1c';
const HAUT_HELL = '#ec9a5c';

/** Ein Aermchen: dunkler Umriss, darueber die Hautfarbe, am Ende zwei runde Krallen. */
function arm(points: string, claws: ReadonlyArray<readonly [number, number]>): string {
  return (
    `<path d="${points}" fill="none" stroke="${HAUT_DUNKEL}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${points}" fill="none" stroke="${HAUT}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>` +
    claws.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#f4f1e6" stroke="#dcd2b8" stroke-width="2"/>`).join('')
  );
}

/** Streifen: kurze, dunkle Boegen. Links notiert, rechts gespiegelt (x -> 640 - x). */
const STREIFEN_LINKS: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
  [150, 70, 156, 80, 154, 92],     // auf dem Hoecker, neben dem Auge (Kopfrand dort bei y 58)
  [122, 96, 132, 104, 134, 118],   // Schlaefe (Kopfrand bei x 112)
  [104, 132, 114, 140, 118, 154],  // unter der Schlaefe (Kopfrand bei x 94)
  [80, 226, 94, 228, 106, 236],    // Flanke oben (Kopfrand bei x 69, Zahnring ab x 120)
  [78, 262, 92, 262, 104, 268],    // Flanke Mitte
  [84, 298, 96, 296, 108, 300],    // Flanke unten
];
const streifen = STREIFEN_LINKS.map(([x1, y1, cx, cy, x2, y2]) => {
  const stil = `fill="none" stroke="${HAUT_DUNKEL}" stroke-width="7" stroke-linecap="round" opacity="0.75"`;
  return (
    `<path d="M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}" ${stil}/>` +
    `<path d="M ${640 - x1} ${y1} Q ${640 - cx} ${cy} ${640 - x2} ${y2}" ${stil}/>`
  );
}).join('');

export const trexArtwork: CreatureArtwork = {
  silhouette: KOPF,
  body:
    // Die Aermchen zuerst: der Kopf deckt ihren Ansatz zu, nur Unterarm und Krallen stehen heraus.
    // Kopfrand bei y 372: x 94 -- von dort ragt ein kurzer Unterarm heraus, der nach unten knickt.
    arm('M 122 372 L 66 390 L 60 416', [[53, 424], [67, 427]]) +
    arm('M 518 372 L 574 390 L 580 416', [[587, 424], [573, 427]]) +
    `<path d="${KOPF}" fill="${HAUT}" stroke="${HAUT_DUNKEL}" stroke-width="3"/>` +
    streifen,
  holeFill: '#e58c99',
  inner:
    '<ellipse cx="320" cy="258" rx="124" ry="68" fill="#ef9fab"/>' +
    '<ellipse cx="320" cy="250" rx="78" ry="42" fill="#d97f8f"/>' +
    '<ellipse cx="320" cy="352" rx="80" ry="30" fill="#f4a3b0"/>',
  upper: { thickness: 52, fromDeg: 192, toDeg: 348, fill: '#f8c6d0', stroke: '#e5a3b0' },
  // Die Schnauze ist kein hellerer Fleck: eine Stufe heller als die Haut, nur die Kontur trennt.
  upperShell: { thickness: 44, fromDeg: 200, toDeg: 340, fill: '#e2853f', stroke: HAUT_DUNKEL },
  lower: { thickness: 26, fromDeg: 10, toDeg: 170, fill: '#f8c6d0', stroke: '#e5a3b0' },
  upperExtra:
    // Zwei Nasenloecher vorn auf der Schnauze und eine Rille mit Grat dazwischen.
    `<ellipse cx="292" cy="94" rx="10" ry="7" fill="${HAUT_DUNKEL}"/>` +
    `<ellipse cx="348" cy="94" rx="10" ry="7" fill="${HAUT_DUNKEL}"/>` +
    `<path d="M 262 112 C 286 104 354 104 378 112" fill="none" stroke="${HAUT_DUNKEL}" stroke-width="4" stroke-linecap="round" opacity="0.6"/>` +
    `<path d="M 264 106 C 288 98 352 98 376 106" fill="none" stroke="${HAUT_HELL}" stroke-width="3" stroke-linecap="round"/>`,
  lowerExtra:
    `<path d="M 214 430 C 250 452 390 452 426 430" fill="none" stroke="${HAUT_DUNKEL}" stroke-width="5" stroke-linecap="round" opacity="0.7"/>`,
  face:
    // Augen im Hautstreifen ueber dem Zahnring, unter den Hoeckern. Die kraeftige Braue liegt als
    // Lid auf der oberen Augenkante -- sie ist der Knochenwulst, der dem Kopf den Dino-Blick gibt.
    '<ellipse cx="194" cy="106" rx="27" ry="24" fill="#ffffff" stroke="' + HAUT_DUNKEL + '" stroke-width="3"/>' +
    '<ellipse cx="446" cy="106" rx="27" ry="24" fill="#ffffff" stroke="' + HAUT_DUNKEL + '" stroke-width="3"/>' +
    // Bernsteinfarbener Irisring -- das Reptilienauge, ohne Schlitzpupille.
    '<circle cx="195.5" cy="108" r="17" fill="#f2c14e"/>' +
    '<circle cx="444.5" cy="108" r="17" fill="#f2c14e"/>' +
    '<circle cx="195.5" cy="108" r="11" fill="#5a3418" class="pupil"/>' +
    '<circle cx="444.5" cy="108" r="11" fill="#5a3418" class="pupil"/>' +
    '<circle cx="190.5" cy="102.5" r="5" fill="#ffffff"/>' +
    '<circle cx="439.5" cy="102.5" r="5" fill="#ffffff"/>' +
    `<path d="M 166 95 A 28 25 0 0 1 222 95" fill="none" stroke="${HAUT_DUNKEL}" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M 418 95 A 28 25 0 0 1 474 95" fill="none" stroke="${HAUT_DUNKEL}" stroke-width="7" stroke-linecap="round"/>` +
    // Wangen im Hautstreifen neben dem Maul; auf kraeftigem Orange braucht das Rosa mehr Deckkraft.
    '<ellipse cx="102" cy="322" rx="13" ry="9" fill="#f6b3bf" opacity="0.7"/>' +
    '<ellipse cx="538" cy="322" rx="13" ry="9" fill="#f6b3bf" opacity="0.7"/>',
  teethProfile: (count) =>
    Array.from({ length: count }, (_, index) => {
      // Die zwei vorderen oberen Zaehne links und rechts der Ringmitte sind etwas laenger -- ein
      // Raubtiergebiss, aber rund und weit weg von den Saebeln des Saebelzahntigers (132).
      const oben = Math.floor(count / 2);
      if (index === oben - 1 || index === oben + 1) {
        return { kind: 'cone' as const, length: 74, width: 36 };
      }
      return { kind: 'cone' as const, length: index % 2 === 0 ? 58 : 50, width: index % 2 === 0 ? 34 : 30 };
    }),
  shellFactor: 0.55,
  ring: { cx: 320, cy: 268, rx: 200, ry: 150, fromDeg: 90, toDeg: 450, fullCircle: true },
  label: 'T-Rex mit offenem Maul, Hoeckern ueber den Augen, winzigen Armen und zwoelf runden Zaehnen',
};
