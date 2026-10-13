import type { CreatureArtwork } from './types';

/**
 * Mensch — freundlich gezeichnet: warme Haut, sanfte Lippen, runde Kulleraugen,
 * runde Zaehne. Zwoelf drueckbare Zaehne, 1–3 gleichzeitig scharf.
 */
const SILHOUETTE =
  'M 320 40 C 452 40 566 108 578 224 C 588 320 540 412 320 444 C 100 412 52 320 62 224 C 74 108 188 40 320 40 Z';

/**
 * **Der Hut.** Der Auftraggeber waehlte ihn am 11.10.2026 auf die Frage „Hut oder Brille?" mit
 * "Hut" -- gemeint war der **Mensch**, nicht der Panther (die Nachricht nannte beide; der Hut lag
 * zuerst falsch und wurde hierher umgesetzt). Ein weicher Filzhut: die Krempe folgt der
 * Kopfwoelbung (Kopfmitte y 40), die Krone steht darueber frei.
 *
 * Er liegt in der **Koerperebene** (`body`) und **nicht** im Gesichtsbereich: der wird auf die
 * Silhouette beschnitten (siehe `factory.ts`, `mouthLayers`), und die Krone ragt ueber den
 * Kopfumriss hinaus -- dort waere sie abgeschnitten. In die Silhouette gehoert er auch nicht: kein
 * Maulteil reicht bis zur Krempe (das Maul beginnt bei y 112, die Brauen liegen bei y 112, der Hut
 * endet bei y 80).
 *
 * **Rostrot** -- Gold traegt die Maehne des Loewen, Blau der Hai, Violett der Vampir, Gruen das
 * Krokodil. Braun waere am Menschen nicht zu unterscheiden: Brauen und Schnurrbart sind schon
 * `#c79b73`. Der Umriss ist `#8a3a2c` statt des harten `#2b2b33` -- der Mensch ist die
 * weichste Zeichnung im Katalog.
 */
const HUT_KREMPE =
  'M 202 66 C 202 54 256 46 320 46 C 384 46 438 54 438 66 C 438 78 384 86 320 86 C 256 86 202 78 202 66 Z';
const HUT_KRONE = 'M 244 64 C 240 34 276 6 320 6 C 364 6 400 34 396 64 Z';
const HUT_BAND = 'M 246 58 C 278 45 362 45 394 58';

/**
 * **Der Schnurrbart** neben der Nase. Entstanden am 11.10.2026 als zwei *Schlaeferlocken* unter
 * der Krempe ("kann man ggf noch ein weiteres Accessoire was das Modell noch menschlicher wirken
 * laesst") -- gelesen hat sie der Auftraggeber aber als **Bart**, und als solcher blieben sie beim
 * Zuschnappen falsch: die Nase fuhr mit dem Oberkiefer nach unten, der Bart klebte oben am Hut
 * ("der Bart des Menschen geht beim geschlossenen Mund gar nicht mit runter", 13.10.2026).
 *
 * Deshalb liegt er jetzt in `upperExtra` -- derselben Ebene wie die Nase -- und **faehrt mit ihr**
 * (`jaw__shell`). Vorher stand er im Gesichtsbereich (`face`), der beim Biss liegen bleibt.
 * In `body` darf er nicht: die Schnauzenflaeche des Mundes (`upperShell`, dieselbe Hautfarbe) wird
 * danach gezeichnet und deckte ihn zu (am 11.10.2026 mit einer Farbkarte gemessen).
 *
 * Die **Oberkante** folgt bei offenem Mund der Unterkante der Krempe, damit diese nicht
 * angeschnitten wird. Die beiden Haelften bleiben **aussen** (x 202…276 und 364…438): in der Mitte
 * sitzt die Nase (x 282…358, y 68…112, Nasenloecher bei y 98) -- eine durchgehende Form hat sie in
 * der ersten Fassung zugedeckt. Nach unten enden sie bei y 116; das Zahnfleischband beginnt dort
 * erst bei y 133 und liegt darueber.
 * Farbe wie die Brauen (`#c79b73`), damit Bart und Brauen dieselbe Haarfarbe tragen.
 */
const BART_LINKS =
  'M 202 66 C 202 78 250 86 276 88 C 268 106 248 118 232 116 C 216 110 206 86 202 66 Z';
const BART_RECHTS =
  'M 438 66 C 438 78 390 86 364 88 C 372 106 392 118 408 116 C 424 110 434 86 438 66 Z';

export const humanArtwork: CreatureArtwork = {
  silhouette: SILHOUETTE,
  body:
    '<path d="M 320 40 C 452 40 566 108 578 224 C 588 320 540 412 320 444 ' +
    'C 100 412 52 320 62 224 C 74 108 188 40 320 40 Z" fill="#f7cdaa" stroke="#d9a186" stroke-width="3"/>' +
    '<path d="M 150 306 C 190 352 450 352 490 306" fill="none" stroke="#edc6a4" stroke-width="5" stroke-linecap="round"/>' +
    '<ellipse cx="150" cy="300" rx="34" ry="20" fill="#f2a8b6" opacity="0.45"/>' +
    '<ellipse cx="490" cy="300" rx="34" ry="20" fill="#f2a8b6" opacity="0.45"/>' +
    // Der Hut zuletzt: er liegt ueber dem Kopf (Begruendung oben bei HUT_KREMPE).
    `<path d="${HUT_KREMPE}" fill="#a2473a" stroke="#8a3a2c" stroke-width="3"/>` +
    `<path d="${HUT_KRONE}" fill="#b5533f" stroke="#8a3a2c" stroke-width="3"/>` +
    `<path d="${HUT_BAND}" fill="none" stroke="#7c3227" stroke-width="11"/>` +
    '<path d="M 264 34 C 278 20 296 12 314 10" fill="none" stroke="#cf7a63" stroke-width="6" stroke-linecap="round"/>',
  holeFill: '#e58c99',
  inner:
    '<ellipse cx="320" cy="258" rx="116" ry="72" fill="#ef9fab"/>' +
    '<ellipse cx="320" cy="250" rx="74" ry="42" fill="#d97f8f"/>' +
    '<ellipse cx="320" cy="352" rx="74" ry="28" fill="#f4a3b0"/>',
  upper: { thickness: 58, fromDeg: 190, toDeg: 350, fill: '#f0959f', stroke: '#d98a99' },
  upperShell: { thickness: 44, fromDeg: 192, toDeg: 348, fill: '#f7cdaa', stroke: '#d9a186' },
  lower: { thickness: 26, fromDeg: 10, toDeg: 170, fill: '#f0959f', stroke: '#d98a99' },
  upperExtra:
    // Der Schnurrbart in der Ebene der Nase: beide fahren beim Biss mit dem Oberkiefer nach unten.
    `<path d="${BART_LINKS}" fill="#c79b73" stroke="#a8804f" stroke-width="3"/>` +
    `<path d="${BART_RECHTS}" fill="#c79b73" stroke="#a8804f" stroke-width="3"/>` +
    '<ellipse cx="320" cy="90" rx="38" ry="22" fill="#f7cdaa" stroke="#d9a186" stroke-width="3"/>' +
    '<ellipse cx="302" cy="98" rx="11" ry="7" fill="#c08a6a"/>' +
    '<ellipse cx="338" cy="98" rx="11" ry="7" fill="#c08a6a"/>',
  face:
    '<path d="M 112 128 A 38 33 0 0 1 180 128" fill="none" stroke="#c79b73" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M 460 128 A 38 33 0 0 1 528 128" fill="none" stroke="#c79b73" stroke-width="6" stroke-linecap="round"/>' +
    '<ellipse cx="146" cy="142" rx="33" ry="28" fill="#ffffff" stroke="#d9a186" stroke-width="3"/>' +
    '<ellipse cx="494" cy="142" rx="33" ry="28" fill="#ffffff" stroke="#d9a186" stroke-width="3"/>' +
    '<circle cx="148" cy="145" r="15" fill="#5b86a8" class="pupil"/><circle cx="496" cy="145" r="15" fill="#5b86a8" class="pupil"/>' +
    '<circle cx="142" cy="138" r="6" fill="#ffffff"/><circle cx="490" cy="138" r="6" fill="#ffffff"/>',
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
