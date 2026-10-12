import type { CreatureArtwork } from './types';

/**
 * Saebelzahntiger (Smilodon) -- ausgestorben, aber der bekannteste Kopf unter den Raubkatzen:
 * sandfarbenes Fell, kraeftige Backen und **zwei sehr lange obere Eckzaehne**.
 *
 * Die Saebel sind das ganze Tier: echte Smilodon-Saebel ragten bis zu 20 cm aus dem Kiefer
 * ("bis zu 20 cm aus dem Kiefer", de.wikipedia, *Smilodon*), das Gebiss hatte 26 bis 28 Zaehne.
 * Im Spiel bekommen die beiden oberen Eckzaehne deshalb die groesste Laenge, die der Ring traegt:
 * die Spitze bleibt innerhalb der Kopfsilhouette, damit beim Zuschnappen nichts daneben haengt.
 *
 * Bewusst **ohne Maehne** -- der Kopf soll sich vom Loewen unterscheiden, und ohne Kranz bleibt
 * mehr Fellflaeche fuer die Wangen frei.
 *
 * **Ueberarbeitet am 11.10.2026** (Auftrag: „Die Ohren aehneln der Maus Ohren. Vielleicht kannst du
 * auch noch andere Besonderheiten hinzufuegen."). Die Ohren waren **Kreise mit rosa Innenkreis** --
 * genau die Rezeptur der Maus, nur kleiner, und im Vergleich der vier Koepfe (Maus, Panther,
 * Saebelzahntiger, Loewe) kaum zu unterscheiden. Gemessen vorher: der Fellstreifen am Aussenrand lag
 * bei y 240 bei x 90…119, die Ohren sassen als Kreise r 44 bei (150|490, 60). Jetzt:
 *
 * - **Kleinere, ovale Ohren** (30 x 28 statt 44 x 44) und tiefer angesetzt (Mitte y 78 statt 60).
 *   Sie beruehren den Kopfumriss: der Rand liegt bei x 150 bei y rund 110, die Ohrmitte fasst ihn.
 * - **Dunkle Innenflaeche** (`#b78243`) statt Rosa -- ein Smilodon-Ohr ist klein und dunkel
 *   ausgekleidet. Das ist der eigentliche Unterschied zur Maus.
 * - **Fellflecken als Rosetten** (dunkler Ring mit hellerem Kern, 12 Stueck). Sie sitzen nur dort,
 *   wo im gerasterten Bild wirklich Fell liegt (Stirnband y 80: x 215…265 und 375…425 · Aussenrand
 *   y 240: x 90…119 · Kinnbacken y 400: x 172…221 · Kinn y 420: x 207…433) -- nicht auf der
 *   Schnauzenflaeche und nicht auf Wangenrot und Augen.
 * - **Katzennase** als abgerundetes Dreieck statt Ellipse, mit dunklem Nasenruecken darueber.
 */
const KOPF =
  'M 320 64 C 448 64 546 116 552 240 C 558 350 470 438 320 450 C 170 438 82 350 88 240 C 94 116 192 64 320 64 Z';
/** Beide Ohren mit gleicher Laufrichtung -- im Beschnitt gilt die Nonzero-Regel. */
const OHR_LINKS = 'M 150 50 A 30 28 0 1 0 150 106 A 30 28 0 1 0 150 50 Z';
const OHR_RECHTS = 'M 490 50 A 30 28 0 1 0 490 106 A 30 28 0 1 0 490 50 Z';

/** Fellflecken: Ring, Kern, Position. Sitzen im Fell, nie auf Nase, Augen oder Wangenrot.
 *  Verschiedene Groessen und Tiefen -- gleich grosse Ringe auf einer Linie sahen im Bild wie eine
 *  Perlenkette aus, nicht wie Fellzeichnung.
 *
 *  **Nicht auf den Ohren:** dort wurde der Fleck von der Ohrenfläche zugedeckt, weil die Ohren in
 *  der Koerperebene *nach* den Flecken gezeichnet werden (im gerasterten Bild war er nicht zu
 *  finden). Vierzehn sichtbare Flecken statt sechzehn halb unsichtbaren. */
const FLECKEN: ReadonlyArray<readonly [number, number, number]> = [
  [226, 82, 6], [414, 82, 6],       // Stirn: der freie Fellstreifen dort ist nur rund 26 px
                                    //   breit (Kopfrand bei x 212, Schnauzenkante bei x 238) --
                                    //   r 12 und r 8 liefen darueber hinaus (Ring nur 40 bzw.
                                    //   51 von 72 Grad sichtbar, gemessen im gerasterten Bild)
  [100, 232, 8], [540, 232, 8],     // oberer Aussenrand
  [106, 258, 12], [534, 258, 12],   // Mitte
  [98, 286, 7], [542, 286, 7],      // unterer Aussenrand
  [168, 376, 10], [472, 376, 10],   // Wange unten
  [204, 404, 12], [436, 404, 12],   // Kinnbacken
  [250, 426, 8], [390, 426, 8],     // Kinn
];
const flecken = FLECKEN.map(
  ([x, y, r]) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#b78243" stroke-width="4"/>` +
    `<circle cx="${x}" cy="${y}" r="${Math.round(r / 3)}" fill="#e0ad69"/>`,
).join('');

export const sabertoothArtwork: CreatureArtwork = {
  silhouette: `${KOPF} ${OHR_LINKS} ${OHR_RECHTS}`,
  body:
    `<path d="${KOPF}" fill="#d9a35c" stroke="#a8732f" stroke-width="3"/>` +
    // Die Fellflecken zuerst, direkt auf den Kopf: Ohren, Backenknoepfe und Fellschatten liegen
    // danach darueber bzw. daneben (Begruendung oben im Kopfkommentar).
    flecken +
    // Kraeftige Backen: zwei weiche Fellknoepfe unterhalb der Ohren. Sie liegen **innerhalb** des
    // Kopfumrisses (gemessen: Kopfrand bei y 178 rund x 92 -- der Knopf beginnt bei 98).
    '<circle cx="122" cy="178" r="24" fill="#e0ad69"/>' +
    '<circle cx="518" cy="178" r="24" fill="#e0ad69"/>' +
    // Fellschatten an den Seiten und eine weiche Kinnkante.
    '<path d="M 132 202 C 116 252 120 316 142 364" fill="none" stroke="#f0bd7a" stroke-width="8" stroke-linecap="round"/>' +
    '<path d="M 508 202 C 524 252 520 316 498 364" fill="none" stroke="#f0bd7a" stroke-width="8" stroke-linecap="round"/>' +
    '<path d="M 158 310 C 198 352 442 352 482 310" fill="none" stroke="#c08f47" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 250 96 C 276 84 364 84 390 96" fill="none" stroke="#c08f47" stroke-width="5" stroke-linecap="round"/>' +
    // Kleinere, ovale Ohren mit **dunkler** Innenflaeche -- der Unterschied zur Maus (rosa Kreis).
    `<path d="${OHR_LINKS}" fill="#d9a35c" stroke="#a8732f" stroke-width="3"/>` +
    `<path d="${OHR_RECHTS}" fill="#d9a35c" stroke="#a8732f" stroke-width="3"/>` +
    '<ellipse cx="150" cy="78" rx="15" ry="13" fill="#b78243"/>' +
    '<ellipse cx="490" cy="78" rx="15" ry="13" fill="#b78243"/>' +
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
    // Katzennase: abgerundetes Dreieck (Nasenspiegel) statt Ellipse -- eine Katze hat einen breiten
    // Spiegel, kein rundes Maul. Darueber ein dunkler Nasenruecken, der beim Biss mitfaehrt.
    '<path d="M 320 86 C 338 86 348 94 348 102 C 348 114 334 124 320 124 ' +
    'C 306 124 292 114 292 102 C 292 94 302 86 320 86 Z" fill="#7d4c22"/>' +
    '<path d="M 320 68 C 328 74 332 80 332 86 L 308 86 C 308 80 312 74 320 68 Z" ' +
    'fill="#b78243" opacity="0.5"/>' +
    '<ellipse cx="308" cy="102" rx="7" ry="5" fill="#4a2a12"/>' +
    '<ellipse cx="332" cy="102" rx="7" ry="5" fill="#4a2a12"/>',
  lowerExtra:
    '<path d="M 214 430 C 250 452 390 452 426 430" fill="none" stroke="#c08f47" stroke-width="5" stroke-linecap="round"/>',
  face:
    // Kulleraugen wie beim Loewen, im Fellstreifen ueber dem Zahnring (kein Zahn liegt darunter).
    // Der dunkle Brauenbogen liegt als Lid direkt auf der oberen Augenkante: fuer einen freien
    // Strich darueber ist zwischen Auge und Kopfrand kein Platz.
    '<path d="M 182 104 A 26 23 0 0 1 230 104" fill="none" stroke="#a8732f" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 410 104 A 26 23 0 0 1 458 104" fill="none" stroke="#a8732f" stroke-width="5" stroke-linecap="round"/>' +
    '<ellipse cx="206" cy="114" rx="24" ry="21" fill="#ffffff" stroke="#a8732f" stroke-width="3"/>' +
    '<ellipse cx="434" cy="114" rx="24" ry="21" fill="#ffffff" stroke="#a8732f" stroke-width="3"/>' +
    '<circle cx="207.5" cy="116" r="11" fill="#a3651f" class="pupil"/>' +
    '<circle cx="432.5" cy="116" r="11" fill="#a3651f" class="pupil"/>' +
    '<circle cx="203" cy="111" r="4.5" fill="#ffffff"/>' +
    '<circle cx="428" cy="111" r="4.5" fill="#ffffff"/>',
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
