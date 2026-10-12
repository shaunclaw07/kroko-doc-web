import type { CreatureArtwork } from './types';

/**
 * Krokodil — freundlich gezeichnet: helles Grün, weiche Umrisse, runde Kulleraugen,
 * rosa Zahnfleisch, runder Rachen. Blick von vorne oben in das offene Maul.
 * Der Oberkiefer (Schnauze und Zahnfleisch) faehrt beim Biss herunter, darunter liegt
 * die Kopffarbe — das Maul ist dann sichtbar zu.
 */
const SILHOUETTE =
  'M 320 26 C 470 26 598 96 606 236 C 612 336 500 424 320 438 C 140 424 28 336 34 236 C 42 96 170 26 320 26 Z';

export const crocodileArtwork: CreatureArtwork = {
  silhouette: SILHOUETTE,
  body:
    '<path d="M 320 26 C 470 26 598 96 606 236 C 612 336 500 424 320 438 ' +
    'C 140 424 28 336 34 236 C 42 96 170 26 320 26 Z" fill="#8fce33" stroke="#5f8f1e" stroke-width="3"/>' +
    '<path d="M 74 190 C 58 240 60 292 78 336" fill="none" stroke="#a8dd4f" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M 566 190 C 582 240 580 292 562 336" fill="none" stroke="#a8dd4f" stroke-width="7" stroke-linecap="round"/>' +
    '<circle cx="96" cy="196" r="15" fill="#a8dd4f"/><circle cx="82" cy="250" r="13" fill="#a8dd4f"/>' +
    '<circle cx="90" cy="306" r="14" fill="#a8dd4f"/><circle cx="544" cy="196" r="15" fill="#a8dd4f"/>' +
    '<circle cx="558" cy="250" r="13" fill="#a8dd4f"/><circle cx="550" cy="306" r="14" fill="#a8dd4f"/>',
  holeFill: '#e58c99',
  inner:
    '<ellipse cx="320" cy="252" rx="150" ry="76" fill="#eb8593"/>' +
    '<ellipse cx="320" cy="246" rx="104" ry="48" fill="#d4707f"/>' +
    '<ellipse cx="320" cy="352" rx="98" ry="30" fill="#f094a2"/>',
  upper: { thickness: 62, fromDeg: 190, toDeg: 350, fill: '#f8c6d0', stroke: '#e5a3b0' },
  upperShell: { thickness: 62, fromDeg: 197, toDeg: 343, fill: '#8fce33', stroke: '#5f8f1e' },
  lower: { thickness: 26, fromDeg: 8, toDeg: 172, fill: '#f8c6d0', stroke: '#e5a3b0' },
  upperExtra:
    // Schnauzenfalten wie beim Spielzeug: drei Querrillen ueber der Schnauze, jede als heller
    // Grat mit dunkler Schattenlinie darunter. Sie folgen der Maulkurve (konzentrisch zum Ring)
    // und bleiben im runden Schnauzenband.
    '<path d="M 232 62 C 258 52 382 52 408 62" fill="none" stroke="#c8f2c4" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M 230 70 C 256 60 384 60 410 70" fill="none" stroke="#6ab96f" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 226 84 C 252 74 388 74 414 84" fill="none" stroke="#c8f2c4" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M 224 92 C 250 82 390 82 416 92" fill="none" stroke="#6ab96f" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 220 104 C 246 94 394 94 420 104" fill="none" stroke="#c8f2c4" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M 218 112 C 244 102 396 102 422 112" fill="none" stroke="#6ab96f" stroke-width="5" stroke-linecap="round"/>' +
    // Mittelrille der Schnauze (wie die Naht am Original) — sie schneidet die Falten.
    '<path d="M 320 50 C 302 64 298 86 308 102" fill="none" stroke="#7cc47f" stroke-width="4" stroke-linecap="round"/>' +
    // Nasenloecher: zwei kleine Schlitze am Schnauzenrand, nicht die grossen Punkte von vorher.
    '<ellipse cx="288" cy="54" rx="9" ry="5" fill="#5f8f1e"/>' +
    '<ellipse cx="352" cy="54" rx="9" ry="5" fill="#5f8f1e"/>',
  face:
    // Augen und Wangen liegen **ausserhalb** des Zahnrings (zwischen Ring und Kopfumriss): das
    // Gesicht wird ueber die Zaehne gemalt, und was in den Ring ragt, deckt je nach Zahnzahl
    // einen Zahn zu. Die Braue liegt als Lid auf der oberen Augenkante.
    '<ellipse cx="144" cy="111" rx="33" ry="29" fill="#ffffff" stroke="#5f8f1e" stroke-width="3"/>' +
    '<ellipse cx="496" cy="111" rx="33" ry="29" fill="#ffffff" stroke="#5f8f1e" stroke-width="3"/>' +
    // Hellblauer Irisring wie beim Original; die Pupille zieht sich beim Druck darin zusammen.
    '<ellipse cx="146" cy="114" rx="22" ry="24" fill="#a8d8e8"/>' +
    '<ellipse cx="498" cy="114" rx="22" ry="24" fill="#a8d8e8"/>' +
    '<ellipse cx="146" cy="114" rx="14" ry="17" fill="#4a3521" class="pupil"/>' +
    '<ellipse cx="498" cy="114" rx="14" ry="17" fill="#4a3521" class="pupil"/>' +
    '<circle cx="140" cy="107" r="5" fill="#ffffff"/>' +
    '<circle cx="492" cy="107" r="5" fill="#ffffff"/>' +
    '<path d="M 113 98 A 34 30 0 0 1 175 98" fill="none" stroke="#5f8f1e" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 465 98 A 34 30 0 0 1 527 98" fill="none" stroke="#5f8f1e" stroke-width="5" stroke-linecap="round"/>' +
    '<ellipse cx="66" cy="224" rx="16" ry="11" fill="#f4a8b6" opacity="0.85"/>' +
    '<ellipse cx="574" cy="224" rx="16" ry="11" fill="#f4a8b6" opacity="0.85"/>',
  teethProfile: (count) =>
    Array.from({ length: count }, (_, index) => ({
      // Krokodil: gleichmaessige, runde Zaehnchen, abwechselnd etwas laenger und kuerzer.
      kind: 'cone' as const,
      length: index % 2 === 0 ? 56 : 48,
      width: index % 2 === 0 ? 36 : 32,
    })),
  shellFactor: 0.62,
  ring: { cx: 320, cy: 265, rx: 240, ry: 160, fromDeg: 90, toDeg: 450, fullCircle: true },
  label: 'Krokodil mit offenem Maul, Schnauzenfalten und zwoelf runden Zaehnen, Blick von vorne oben',
};
