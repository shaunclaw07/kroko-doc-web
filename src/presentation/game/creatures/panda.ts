import type { CreatureArtwork } from './types';

/**
 * Panda -- freundlich gezeichnet: weisser Kopf, schwarze Ohren und Augenflecken, schwarze Nase,
 * rosa Wangen, runde Kulleraugen. Blick von vorne oben in das offene Maul.
 *
 * Das Gebiss ist das eines Baeren, der Bambus zermalmt: zwei kraeftige flache Zaehne an der
 * Maulmitte, breite Backenzaehne aussen und dazwischen zwei kurze Eckzaehne -- keine Reisszaehne.
 * Die Ohren stehen als eigene Kreise im Umriss, sonst schnitte der Beschnitt sie ab (wie bei der
 * Maus): alles ausserhalb des Kopfumrisses wird weggeschnitten.
 */
const KOPF =
  'M 320 58 C 452 58 552 116 566 238 C 576 344 508 434 320 448 C 132 434 64 344 74 238 C 88 116 188 58 320 58 Z';
const OHR_LINKS = 'M 148 34 A 54 54 0 1 0 148 142 A 54 54 0 1 0 148 34 Z';
const OHR_RECHTS = 'M 492 34 A 54 54 0 1 0 492 142 A 54 54 0 1 0 492 34 Z';

export const pandaArtwork: CreatureArtwork = {
  silhouette: `${KOPF} ${OHR_LINKS} ${OHR_RECHTS}`,
  body:
    `<path d="${KOPF}" fill="#f7f5f1" stroke="#c9c3b8" stroke-width="3"/>` +
    // Fellschatten in den Wangen und helle Fellkanten an den Kopfseiten.
    '<path d="M 156 306 C 196 350 444 350 484 306" fill="none" stroke="#eae5dc" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 124 206 C 108 254 112 318 136 366" fill="none" stroke="#fbfaf7" stroke-width="8" stroke-linecap="round"/>' +
    '<path d="M 516 206 C 532 254 528 318 504 366" fill="none" stroke="#fbfaf7" stroke-width="8" stroke-linecap="round"/>' +
    // Die schwarzen Ohren liegen auf dem Kopf -- sie tragen den Panda.
    '<circle cx="148" cy="88" r="54" fill="#3a3a40" stroke="#2b2b31" stroke-width="3"/>' +
    '<circle cx="492" cy="88" r="54" fill="#3a3a40" stroke="#2b2b31" stroke-width="3"/>' +
    '<circle cx="148" cy="90" r="26" fill="#565660"/>' +
    '<circle cx="492" cy="90" r="26" fill="#565660"/>' +
    // Wangen liegen im Gesicht, nicht auf dem Zahnfleisch: das Maul deckt sie (wie beim Wolf).
    '<ellipse cx="108" cy="300" rx="22" ry="14" fill="#f2a8b6" opacity="0.5"/>' +
    '<ellipse cx="532" cy="300" rx="22" ry="14" fill="#f2a8b6" opacity="0.5"/>',
  holeFill: '#e58c99',
  inner:
    '<ellipse cx="320" cy="258" rx="120" ry="68" fill="#ef9fab"/>' +
    '<ellipse cx="320" cy="250" rx="76" ry="42" fill="#d97f8f"/>' +
    '<ellipse cx="320" cy="352" rx="78" ry="30" fill="#f4a3b0"/>',
  upper: { thickness: 54, fromDeg: 192, toDeg: 348, fill: '#f8c6d0', stroke: '#e5a3b0' },
  // Die Schnauze ist kein hellerer Fleck, nur die Kontur trennt sie: weiss wie der Kopf.
  upperShell: { thickness: 42, fromDeg: 198, toDeg: 342, fill: '#fbfaf7', stroke: '#c9c3b8' },
  lower: { thickness: 26, fromDeg: 10, toDeg: 170, fill: '#f8c6d0', stroke: '#e5a3b0' },
  upperExtra:
    // Schwarze Nase dicht ueber dem Maul -- sie faehrt beim Biss mit.
    '<path d="M 288 92 C 288 76 352 76 352 92 C 352 106 334 114 320 114 C 306 114 288 106 288 92 Z" fill="#3a3a40"/>' +
    '<ellipse cx="310" cy="90" rx="5" ry="3" fill="#6b6b75"/>',
  lowerExtra:
    // Kinnkante unter dem unteren Zahnfleischband.
    '<path d="M 214 428 C 250 450 390 450 426 428" fill="none" stroke="#eae5dc" stroke-width="5" stroke-linecap="round"/>',
  face:
    // Augenflecken: die Panda-Maske. Sie liegen schraeg und bleiben gross -- die Linse sitzt
    // klein darin, sonst liest der Fleck sich wie eine Brille.
    '<g transform="rotate(-16 170 176)"><ellipse cx="170" cy="176" rx="54" ry="44" fill="#3a3a40"/></g>' +
    '<g transform="rotate(16 470 176)"><ellipse cx="470" cy="176" rx="54" ry="44" fill="#3a3a40"/></g>' +
    '<ellipse cx="172" cy="176" rx="27" ry="24" fill="#ffffff"/>' +
    '<ellipse cx="468" cy="176" rx="27" ry="24" fill="#ffffff"/>' +
    '<circle cx="174" cy="179" r="12" fill="#33333a" class="pupil"/>' +
    '<circle cx="466" cy="179" r="12" fill="#33333a" class="pupil"/>' +
    '<circle cx="168" cy="172" r="5" fill="#ffffff"/>' +
    '<circle cx="462" cy="172" r="5" fill="#ffffff"/>',
  teethProfile: (count) =>
    Array.from({ length: count }, (_, index) => {
      // Zwei kraeftige flache Zaehne in der Mitte des Unterkiefers (Zahn 0 ist die Ringmitte
      // unten), zwei kurze Eckzaehne gespiegelt daneben (i <-> count - i), alles andere breite
      // Mahlzaehne -- ein Baer behaelt die Eckzaehne, ein Bambusfresser zeigt sie kaum.
      if (index === 0 || index === 1 || index === count - 1) {
        return { kind: 'flat' as const, length: 48, width: 46 };
      }
      if (index === 2 || index === count - 2) {
        return { kind: 'cone' as const, length: 50, width: 34 };
      }
      return { kind: 'square' as const, length: 44, width: 44 };
    }),
  shellFactor: 0.55,
  // Ringbreite wie beim Löwen: mit rx 195 fiel die Trefferfläche auf der schmalsten Bühne schon
  // bei 11 Zähnen unter die 44-px-Vorgabe. Der Kopf hat den Platz, also gibt der Ring ihn her.
  ring: { cx: 320, cy: 270, rx: 200, ry: 150, fromDeg: 90, toDeg: 450, fullCircle: true },
  label: 'Panda mit offenem Maul und zwoelf Zaehnen, Blick von vorne oben',
};
