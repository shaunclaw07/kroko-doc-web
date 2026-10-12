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
 * Die **spitzen** Ohren sind Teil des Umrisses (wie die runden Ohren von Maus, Panda und Loewe):
 * alles ausserhalb des Kopfumrisses wird weggeschnitten. **Der Hut sitzt am Menschen**, nicht hier:
 * „Genau wie der Mensch vielleicht koennte man dem einen Hut anziehen" war auf den Menschen gemuenzt
 * (11.10.2026); der Hut lag zuerst faelschlich hier und wurde umgesetzt.
 *
 * Die Augen tragen einen **gelben** Irisring statt des hellblauen des Spielzeugs -- Kulleraugen
 * bleiben es, aber ein schwarzer Panther mit blauen Augen waere ein anderer Kopf. Die Pupille
 * bleibt rund und dunkelbraun, keine Spaltpupille (Regel fuer Kinder).
 */
const KOPF =
  'M 320 58 C 452 58 552 116 566 238 C 576 344 508 434 320 448 C 132 434 64 344 74 238 C 88 116 188 58 320 58 Z';
/**
 * **Spitze Ohren.** Sie sind der Unterschied, den man auf einen Blick sieht: mit den runden
 * Ohren des Pandas las der Kopf wie eine schwarze Maus (Rueckmeldung des Auftraggebers:
 * "Der Panther sieht eher wie eine schwarze Maus"). Eine Katze erkennt man an den Dreiecken,
 * nicht am Fell. Der Fuss des Dreiecks liegt **im** Kopfumriss und ist dort unsichtbar (gleiche
 * Fellfarbe), nur die Spitze steht heraus -- wie bei den runden Ohren der anderen Tiere.
 *
 * **Beide Ohren laufen gleichsinnig.** Sie sind Teil der Silhouette, und die Silhouette ist ein
 * `clipPath`; dort gilt die Nonzero-Regel: laeuft ein Teilpfad **gegen** den Kopf, hebt er die
 * Fuellung im Ueberlappungsbereich auf. Die erste Fassung spiegelte die Koordinaten des rechten
 * Ohrs einfach -- das kehrt die Laufrichtung um, und im Ueberlappungsbereich von Kopf und
 * rechtem Ohr wurde alles weggeschnitten (im Bild fehlte dem Panther das rechte Auge, gemessen:
 * Pixel (470,166) = Fellfarbe statt Weiss). Deshalb ist das rechte Ohr hier in **umgekehrter
 * Reihenfolge** notiert: dieselben Punkte, aber rueckwaerts durchlaufen.
 */
const OHR_LINKS = 'M 118 168 C 108 120 116 60 128 30 C 154 70 184 116 196 150 Z';
const OHR_RECHTS = 'M 444 150 C 456 116 486 70 512 30 C 524 60 532 120 522 168 Z';
// Innenraum: kleine Dreiecke, ganz im oberen Teil -- weiter unten laege die hellere Flaeche
// sichtbar im Fell des Kopfes.
const OHR_LINKS_INNEN = 'M 134 118 C 130 96 132 62 140 40 C 152 62 164 84 170 96 Z';
const OHR_RECHTS_INNEN = 'M 470 96 C 476 84 488 62 500 40 C 508 62 510 96 506 118 Z';

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
    // Spitze Katzenohren: Fell wie der Kopf, innen eine Stufe heller.
    `<path d="${OHR_LINKS}" fill="#3e3e46" stroke="#2b2b33" stroke-width="3"/>` +
    `<path d="${OHR_RECHTS}" fill="#3e3e46" stroke="#2b2b33" stroke-width="3"/>` +
    `<path d="${OHR_LINKS_INNEN}" fill="#5a5a66"/>` +
    `<path d="${OHR_RECHTS_INNEN}" fill="#5a5a66"/>` +
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
    // Schnurrhaare im Fellstreifen neben dem Maul. Der Streifen ist schmal (gemessen: der
    // Maulrand liegt dort bei x 120, der Kopfrand bei x 88..96) -- mehr als rund 30 px Laenge
    // gibt er nicht her. Auf dem fast schwarzen Fell brauchen sie einen mittleren Grauton.
    '<g stroke="#6d6d7a" stroke-width="4" stroke-linecap="round">' +
    '<path d="M 114 254 L 88 244"/>' +
    '<path d="M 116 274 L 86 274"/>' +
    '<path d="M 114 294 L 88 304"/>' +
    '<path d="M 526 254 L 552 244"/>' +
    '<path d="M 524 274 L 554 274"/>' +
    '<path d="M 526 294 L 552 304"/>' +
    '</g>' +
    // Kulleraugen mit gelbem Irisring. Die Pupille ist rund und dunkelbraun -- nie schwarz,
    // nie ein Schlitz (Regel fuer Kinder).
    '<ellipse cx="222" cy="108" rx="27" ry="24" fill="#ffffff"/>' +
    '<ellipse cx="418" cy="108" rx="27" ry="24" fill="#ffffff"/>' +
    '<circle cx="223.5" cy="109.5" r="17" fill="#f0c14b"/>' +
    '<circle cx="416.5" cy="109.5" r="17" fill="#f0c14b"/>' +
    '<circle cx="224.5" cy="110.5" r="10.5" fill="#4a3320" class="pupil"/>' +
    '<circle cx="415.5" cy="110.5" r="10.5" fill="#4a3320" class="pupil"/>' +
    '<circle cx="218" cy="102" r="5" fill="#ffffff"/>' +
    '<circle cx="409" cy="102" r="5" fill="#ffffff"/>',
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
