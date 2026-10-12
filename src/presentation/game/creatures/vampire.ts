import type { CreatureArtwork } from './types';

/**
 * Vampir — freundlich gezeichnet: blasses Lavendel-Gesicht, dunkle Haare mit Spitzenansatz,
 * dunkelroter Umhangkragen unten, runde Kulleraugen, rosa Zahnfleisch. Blick von vorne oben
 * ins offene Maul. Erkennungszeichen sind die zwei langen Eckzaehne; sie sitzen links und
 * rechts der Maulmitte (nicht an den Seiten), weil dort der „Vorderzahn“ eines Gebisses
 * liegt. Meist sind genau sie die scharfen (ein bis zwei gleichzeitig).
 *
 * **Zwei Accessoires auf Wunsch des Auftraggebers (11.10.2026: „Der Vampir braucht auch noch
 * Accessoires, kannst du das Model auch nochmal ueberarbeiten?“):**
 *
 * - **Stehkragen** (zwei hochstehende Fluegel hinter dem Kopf, aussen dunkelviolett wie die Haare,
 *   mit einer hellen Kante). Er liegt **vor** dem Kopf in der Koerperebene: so verdeckt der Kopf
 *   seine Innenkanten, und nur die Fluegelspitzen stehen seitlich hervor — ein Kragen, den man
 *   *hinter* dem Kopf traegt, kann nicht im Gesichtsbereich liegen, denn der wird auf die
 *   Silhouette beschnitten (die Spitzen waeren abgeschnitten).
 * - **Monokel** am linken Auge (Ring, Glas mit schwachem Schimmer, Kette mit Gewicht). Es liegt im
 *   **Gesichtsbereich** — es sitzt *auf* dem Auge, also ueber der Mundebene, und bleibt innerhalb
 *   des Umrisses, stoert den Beschnitt also nicht.
 *
 * Die **Ohren** sind von der Gesichts- in die **Koerperebene** gewandert und zeigen jetzt schraeg
 * nach oben ausen. Vorher standen sie im Gesichtsbereich, und gemessen im gerasterten Bild waren
 * ihre Spitzen **abgeschnitten** (Spitze bei x 52, der Umriss lag bei y 116 aber erst bei x 110):
 * die Kontur des Kopfes schnitt 58 px der Ohren weg. Jetzt ragen die Spitzen ueber den Umriss
 * hinaus, weil die Koerperebene nicht beschnitten wird.
 */
const SILHOUETTE =
  'M 320 40 C 452 40 566 108 578 224 C 588 300 566 356 552 384 L 588 452 L 52 452 ' +
  'L 88 384 C 74 356 52 300 62 224 C 74 108 188 40 320 40 Z';

/** Ein Kragenfluegel: ein Band, das dem Kopfumriss folgt und oben spitz auslaeuft.
 *  Die erste Fassung stand weit ab (Aussenkante bei x 12) und sah wie eine Flosse aus; die zweite
 *  war bei y 200/320/360 nur 18/16/8 px breit. Jetzt haelt das Band rund 35 px Abstand zum Umriss
 *  (gemessen bei y 240: x 24…58), damit es als Kragen liest und nicht als Fluegel. */
const KRAGEN_LINKS =
  'M 110 420 C 54 378 24 318 26 248 C 28 196 44 156 76 114 ' +
  'C 88 140 78 176 68 214 C 60 254 62 306 76 362 C 82 386 94 404 110 420 Z';
const KRAGEN_RECHTS =
  'M 530 420 C 586 378 616 318 614 248 C 612 196 596 156 564 114 ' +
  'C 552 140 562 176 572 214 C 580 254 578 306 564 362 C 558 386 546 404 530 420 Z';
/** Helle Kante auf dem Fluegel — aussen, weil der Kopf die Innenkante verdeckt. */
const KRAGEN_KANTE_LINKS = 'M 102 400 C 62 356 40 306 40 250 C 40 204 54 166 78 132';
const KRAGEN_KANTE_RECHTS = 'M 538 400 C 578 356 600 306 600 250 C 600 204 586 166 562 132';

/** Spitze Ohren, schraeg nach oben aussen — die Spitze liegt ausserhalb des Kopfumrisses.
 *  Breite Basis (58 px) und gut das Anderthalbfache hoch: eine Nadel (39 px Basis, 90 px hoch)
 *  sah im gerasterten Bild wie ein Horn aus. */
const OHR_LINKS = 'M 156 226 L 60 148 L 104 200 Z';
const OHR_LINKS_INNEN = 'M 142 216 L 78 158 L 108 194 Z';
const OHR_RECHTS = 'M 484 226 L 580 148 L 536 200 Z';
const OHR_RECHTS_INNEN = 'M 498 216 L 562 158 L 532 194 Z';

export const vampireArtwork: CreatureArtwork = {
  silhouette: SILHOUETTE,
  body:
    // Der Kragen zuerst: er liegt hinter dem Kopf und wird von ihm verdeckt (Begruendung oben).
    `<path d="${KRAGEN_LINKS}" fill="#4a3b5c" stroke="#3a2d49" stroke-width="3"/>` +
    `<path d="${KRAGEN_KANTE_LINKS}" fill="none" stroke="#5d4b70" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="${KRAGEN_RECHTS}" fill="#4a3b5c" stroke="#3a2d49" stroke-width="3"/>` +
    `<path d="${KRAGEN_KANTE_RECHTS}" fill="none" stroke="#5d4b70" stroke-width="5" stroke-linecap="round"/>` +
    '<path d="M 320 40 C 452 40 566 108 578 224 C 588 300 566 356 552 384 L 588 452 L 52 452 ' +
    'L 88 384 C 74 356 52 300 62 224 C 74 108 188 40 320 40 Z" ' +
    'fill="#efe4f2" stroke="#c1aed1" stroke-width="3"/>' +
    // Die Ohren ueber dem Kopf, aber in der Koerperebene (nicht beschnitten — Begruendung oben).
    `<path d="${OHR_LINKS}" fill="#efe4f2" stroke="#c1aed1" stroke-width="3"/>` +
    `<path d="${OHR_LINKS_INNEN}" fill="#f6c1c9"/>` +
    `<path d="${OHR_RECHTS}" fill="#efe4f2" stroke="#c1aed1" stroke-width="3"/>` +
    `<path d="${OHR_RECHTS_INNEN}" fill="#f6c1c9"/>` +
    // Umhangkragen: dunkelrot, mit heller Kante, damit er sich vom Gesicht abhebt.
    '<path d="M 92 388 C 150 372 254 366 320 366 C 386 366 490 372 548 388 ' +
    'L 588 452 L 52 452 Z" fill="#7d2231" stroke="#5c1723" stroke-width="3"/>' +
    '<path d="M 112 404 C 180 384 268 378 320 378 C 372 378 460 384 528 404" ' +
    'fill="none" stroke="#a03a48" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 320 380 L 344 452 L 296 452 Z" fill="#5c1723" opacity="0.55"/>',
  holeFill: '#e58c99',
  inner:
    '<ellipse cx="320" cy="266" rx="112" ry="66" fill="#ef9fab"/>' +
    '<ellipse cx="320" cy="258" rx="72" ry="40" fill="#d97f8f"/>' +
    '<ellipse cx="320" cy="348" rx="74" ry="28" fill="#f4a3b0"/>',
  upper: { thickness: 52, fromDeg: 190, toDeg: 350, fill: '#f0959f', stroke: '#d98a99' },
  upperShell: { thickness: 40, fromDeg: 192, toDeg: 348, fill: '#efe4f2', stroke: '#c1aed1' },
  lower: { thickness: 26, fromDeg: 10, toDeg: 170, fill: '#f0959f', stroke: '#d98a99' },
  upperExtra:
    '<ellipse cx="320" cy="108" rx="28" ry="19" fill="#efe4f2" stroke="#c1aed1" stroke-width="3"/>' +
    '<ellipse cx="311" cy="113" rx="8" ry="6" fill="#c1aed1"/>' +
    '<ellipse cx="329" cy="113" rx="8" ry="6" fill="#c1aed1"/>',
  face:
    '<ellipse cx="110" cy="252" rx="19" ry="12" fill="#f2a8b6" opacity="0.45"/>' +
    '<ellipse cx="530" cy="252" rx="19" ry="12" fill="#f2a8b6" opacity="0.45"/>' +
    '<path d="M 110 150 C 128 138 160 138 178 150" fill="none" stroke="#4a3b5c" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 462 150 C 480 138 512 138 530 150" fill="none" stroke="#4a3b5c" stroke-width="5" stroke-linecap="round"/>' +
    '<ellipse cx="140" cy="170" rx="30" ry="26" fill="#ffffff" stroke="#c1aed1" stroke-width="3"/>' +
    '<ellipse cx="500" cy="170" rx="30" ry="26" fill="#ffffff" stroke="#c1aed1" stroke-width="3"/>' +
    '<circle cx="142" cy="173" r="14" fill="#a8562f" class="pupil"/>' +
    '<circle cx="502" cy="173" r="14" fill="#a8562f" class="pupil"/>' +
    '<circle cx="142" cy="173" r="7" fill="#3a2d49"/>' +
    '<circle cx="502" cy="173" r="7" fill="#3a2d49"/>' +
    '<circle cx="137" cy="167" r="5" fill="#ffffff"/>' +
    '<circle cx="497" cy="167" r="5" fill="#ffffff"/>' +
    // Das Monokel am linken Auge: Ring, schwacher Schimmer im Glas, Kette mit Gewicht.
    // Vor den Haaren, damit die Haube es sauber einfasst (Begruendung oben im Kopfkommentar).
    '<ellipse cx="140" cy="170" rx="36" ry="32" fill="#eaf2f8" fill-opacity="0.18" ' +
    'stroke="#8f86a3" stroke-width="5"/>' +
    '<path d="M 112 148 C 122 138 136 134 148 134" fill="none" stroke="#c9c2d6" ' +
    'stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M 110 192 C 94 206 84 218 80 228" fill="none" stroke="#8f86a3" ' +
    'stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="80" cy="233" r="5" fill="#8f86a3"/>' +
    // Haare zuletzt: schmale Haube am Kopfrand mit Spitzenansatz (Zipfel zeigt zum Mund).
    '<path d="M 106 156 C 114 106 194 54 320 54 C 446 54 526 106 534 156 ' +
    'C 494 120 442 100 388 98 L 320 122 L 252 98 C 198 100 146 120 106 156 Z" ' +
    'fill="#4a3b5c" stroke="#3a2d49" stroke-width="3"/>' +
    '<path d="M 152 132 C 200 102 440 102 488 132" fill="none" stroke="#5d4b70" stroke-width="5" stroke-linecap="round"/>',
  teethProfile: (count) =>
    Array.from({ length: count }, (_, index) => {
      // Maulmitte ist die Mitte der Zahnreihe; die Eckzaehne liegen links und rechts davon.
      const front = Math.floor(count / 2);
      if (Math.abs(index - front) === 1) {
        return { kind: 'cone' as const, length: 86, width: 26 };
      }
      if (index <= 1 || index >= count - 2) {
        return { kind: 'square' as const, length: 44, width: 42 };
      }
      return { kind: 'flat' as const, length: 46, width: 34 };
    }),
  shellFactor: 0.55,
  ring: { cx: 320, cy: 278, rx: 186, ry: 138, fromDeg: 90, toDeg: 450, fullCircle: true },
  label: 'Vampir mit offenem Mund und zwoelf Zaehnen, Blick von vorne oben',
};
