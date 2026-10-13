import type { CreatureArtwork } from './types';

/**
 * Venusfliegenfalle -- die erste Bonusfigur (ab 20 Sternen) und das einzige Wesen im Spiel, das
 * kein Tier ist. Sie ist das einzige Vorbild, das **wirklich zuschnappt**: die Klappe schliesst
 * sich in etwa einer Zehntelsekunde (de.wikipedia, *Venusfliegenfalle*).
 *
 * Gezeichnet als freundliche Comic-Pflanze (vom Auftraggeber gewaehlt, 13.10.2026):
 *
 * - **Silhouette:** die Klappe als breiter, flacher Kopf -- darunter **Stiel, zwei Blaetter und ein
 *   Tontopf**. Der Topf sagt sofort „Pflanze" und ist das, was kein anderer Kopf hat. Er steht in
 *   der Koerperebene, **vor** der Klappe gezeichnet (die Klappe deckt den Stielansatz zu), und
 *   bleibt ausserhalb des Beschnitts: beim Zuschnappen faehrt nichts ueber ihn.
 * - **Die „Zaehne" sind Randborsten.** Eine Pflanze hat keine Zaehne; im Spiel sind die Borsten
 *   trotzdem rund und cremefarben wie alle Zaehne, damit sie lesbar und drueckbar bleiben. Sie
 *   sind schlanker und laenger als die Zaehne der Tiere.
 * - **Augen** wie bei allen: weisse Linsen mit Pupille (`class="pupil"`), im gruenen Streifen ueber
 *   dem Ring. Eine echte Pflanze hat keine -- aber ohne Blick waere sie das einzige leblose Wesen.
 * - **Das Innere ist rosenrot** wie bei den Tieren -- und das stimmt sogar: die Innenseite der
 *   echten Falle faerbt sich in der Sonne stark rot. Die drei dunkleren Punkte je Haelfte sind die
 *   Fuehlborsten, die den Schnappmechanismus ausloesen.
 * - **Keine Nase:** bei geschlossenem Maul bleiben Augen, Wangen und das Laecheln der unteren
 *   Klappe.
 */
const KLAPPE =
  'M 320 30 C 452 30 560 86 562 204 C 564 304 462 366 320 370 C 178 366 76 304 78 204 C 80 86 188 30 320 30 Z';

const GRUEN = '#5fb65a';
const GRUEN_DUNKEL = '#3a8a3c';
const GRUEN_HELL = '#8fd487';
const TON = '#c8744a';
const TON_DUNKEL = '#9a5230';
const TON_HELL = '#dd9068';

export const flytrapArtwork: CreatureArtwork = {
  silhouette: KLAPPE,
  body:
    // Tontopf: Koerper, darueber der Rand. Er endet am unteren Buehnenrand.
    `<path d="M 244 420 L 396 420 L 382 458 L 258 458 Z" fill="${TON}" stroke="${TON_DUNKEL}" stroke-width="3" stroke-linejoin="round"/>` +
    `<rect x="232" y="402" width="176" height="24" rx="8" fill="${TON_HELL}" stroke="${TON_DUNKEL}" stroke-width="3"/>` +
    // Stiel aus dem Topf bis unter die Klappe, mit zwei Blaettern.
    `<path d="M 320 404 L 320 352" fill="none" stroke="${GRUEN_DUNKEL}" stroke-width="20" stroke-linecap="round"/>` +
    `<path d="M 320 404 L 320 352" fill="none" stroke="${GRUEN}" stroke-width="14" stroke-linecap="round"/>` +
    `<path d="M 314 396 C 280 372 232 372 196 398 C 232 418 284 416 314 396 Z" fill="${GRUEN}" stroke="${GRUEN_DUNKEL}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M 326 396 C 360 372 408 372 444 398 C 408 418 356 416 326 396 Z" fill="${GRUEN}" stroke="${GRUEN_DUNKEL}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M 304 396 C 274 388 244 388 214 398" fill="none" stroke="${GRUEN_HELL}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M 336 396 C 366 388 396 388 426 398" fill="none" stroke="${GRUEN_HELL}" stroke-width="3" stroke-linecap="round"/>` +
    // Die Klappe selbst.
    `<path d="${KLAPPE}" fill="${GRUEN}" stroke="${GRUEN_DUNKEL}" stroke-width="3"/>` +
    // Helle Flanken, damit die Flaeche nicht flach wirkt.
    `<path d="M 100 168 C 90 204 94 244 112 276" fill="none" stroke="${GRUEN_HELL}" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M 540 168 C 550 204 546 244 528 276" fill="none" stroke="${GRUEN_HELL}" stroke-width="7" stroke-linecap="round"/>`,
  holeFill: '#e58c99',
  inner:
    '<ellipse cx="320" cy="206" rx="126" ry="62" fill="#ef9fab"/>' +
    '<ellipse cx="320" cy="200" rx="82" ry="38" fill="#d97f8f"/>' +
    '<ellipse cx="320" cy="284" rx="84" ry="26" fill="#f4a3b0"/>' +
    // Fuehlborsten: drei Punkte je Haelfte.
    '<circle cx="250" cy="196" r="4" fill="#c46a7b"/><circle cx="272" cy="214" r="4" fill="#c46a7b"/>' +
    '<circle cx="282" cy="186" r="4" fill="#c46a7b"/><circle cx="390" cy="196" r="4" fill="#c46a7b"/>' +
    '<circle cx="368" cy="214" r="4" fill="#c46a7b"/><circle cx="358" cy="186" r="4" fill="#c46a7b"/>',
  // Der Rand der Klappe ist die hellste Stufe im Maul -- hier ein helles Gelbgruen statt Rosa:
  // es ist das Blatt, kein Zahnfleisch.
  upper: { thickness: 46, fromDeg: 190, toDeg: 350, fill: '#d9f2b4', stroke: '#a6d07a' },
  upperShell: { thickness: 40, fromDeg: 196, toDeg: 344, fill: '#6cc066', stroke: GRUEN_DUNKEL },
  lower: { thickness: 24, fromDeg: 10, toDeg: 170, fill: '#d9f2b4', stroke: '#a6d07a' },
  lowerExtra:
    `<path d="M 232 350 C 264 366 376 366 408 350" fill="none" stroke="${GRUEN_DUNKEL}" stroke-width="5" stroke-linecap="round" opacity="0.6"/>`,
  face:
    // Augen im gruenen Streifen ueber dem Zahnring; die Braue liegt als Lid auf der Augenkante.
    `<ellipse cx="190" cy="80" rx="26" ry="23" fill="#ffffff" stroke="${GRUEN_DUNKEL}" stroke-width="3"/>` +
    `<ellipse cx="450" cy="80" rx="26" ry="23" fill="#ffffff" stroke="${GRUEN_DUNKEL}" stroke-width="3"/>` +
    '<circle cx="191.5" cy="82" r="11.5" fill="#3d5a2a" class="pupil"/>' +
    '<circle cx="448.5" cy="82" r="11.5" fill="#3d5a2a" class="pupil"/>' +
    '<circle cx="186.5" cy="77" r="4.7" fill="#ffffff"/>' +
    '<circle cx="443.5" cy="77" r="4.7" fill="#ffffff"/>' +
    `<path d="M 165 69 A 27 24 0 0 1 215 69" fill="none" stroke="${GRUEN_DUNKEL}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M 425 69 A 27 24 0 0 1 475 69" fill="none" stroke="${GRUEN_DUNKEL}" stroke-width="5" stroke-linecap="round"/>` +
    // Wangen seitlich ausserhalb des Rings; auf kraeftigem Gruen braucht das Rosa viel Deckkraft.
    '<ellipse cx="104" cy="250" rx="13" ry="9" fill="#f4a8b6" opacity="0.85"/>' +
    '<ellipse cx="536" cy="250" rx="13" ry="9" fill="#f4a8b6" opacity="0.85"/>',
  teethProfile: (count) =>
    Array.from({ length: count }, (_, index) => ({
      // Randborsten: schlank und lang, abwechselnd etwas laenger und kuerzer.
      kind: 'cone' as const,
      length: index % 2 === 0 ? 64 : 54,
      width: index % 2 === 0 ? 24 : 22,
    })),
  shellFactor: 0.6,
  ring: { cx: 320, cy: 214, rx: 190, ry: 124, fromDeg: 90, toDeg: 450, fullCircle: true },
  label: 'Venusfliegenfalle im Tontopf mit offener Klappe und acht runden Borsten, Blick von vorne oben',
};
