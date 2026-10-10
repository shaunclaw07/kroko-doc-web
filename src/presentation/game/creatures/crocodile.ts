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
    'C 140 424 28 336 34 236 C 42 96 170 26 320 26 Z" fill="#8ed492" stroke="#5aa164" stroke-width="3"/>' +
    '<path d="M 74 190 C 58 240 60 292 78 336" fill="none" stroke="#a7e0aa" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M 566 190 C 582 240 580 292 562 336" fill="none" stroke="#a7e0aa" stroke-width="7" stroke-linecap="round"/>' +
    '<circle cx="96" cy="196" r="15" fill="#a7e0aa"/><circle cx="82" cy="250" r="13" fill="#a7e0aa"/>' +
    '<circle cx="90" cy="306" r="14" fill="#a7e0aa"/><circle cx="544" cy="196" r="15" fill="#a7e0aa"/>' +
    '<circle cx="558" cy="250" r="13" fill="#a7e0aa"/><circle cx="550" cy="306" r="14" fill="#a7e0aa"/>',
  holeFill: '#e58c99',
  inner:
    '<ellipse cx="320" cy="252" rx="150" ry="76" fill="#ef9fab"/>' +
    '<ellipse cx="320" cy="246" rx="104" ry="48" fill="#d97f8f"/>' +
    '<ellipse cx="320" cy="352" rx="98" ry="30" fill="#f4a3b0"/>',
  upper: { thickness: 62, fromDeg: 190, toDeg: 350, fill: '#f8c6d0', stroke: '#e5a3b0' },
  upperShell: { thickness: 62, fromDeg: 197, toDeg: 343, fill: '#a7e0aa', stroke: '#5aa164' },
  lower: { thickness: 26, fromDeg: 8, toDeg: 172, fill: '#f8c6d0', stroke: '#e5a3b0' },
  upperExtra:
    '<ellipse cx="268" cy="70" rx="22" ry="14" fill="#5aa164"/>' +
    '<ellipse cx="372" cy="70" rx="22" ry="14" fill="#5aa164"/>' +
    '<ellipse cx="262" cy="66" rx="7" ry="4" fill="#c7eec9"/>' +
    '<ellipse cx="366" cy="66" rx="7" ry="4" fill="#c7eec9"/>' +
    '<path d="M 320 46 C 300 62 296 84 306 100" fill="none" stroke="#7cc47f" stroke-width="5" stroke-linecap="round"/>',
  face:
    '<ellipse cx="165" cy="132" rx="38" ry="33" fill="#ffffff" stroke="#5aa164" stroke-width="3"/>' +
    '<ellipse cx="475" cy="132" rx="38" ry="33" fill="#ffffff" stroke="#5aa164" stroke-width="3"/>' +
    '<circle cx="167" cy="136" r="17" fill="#4a3521" class="pupil"/>' +
    '<circle cx="477" cy="136" r="17" fill="#4a3521" class="pupil"/>' +
    '<circle cx="161" cy="128" r="6" fill="#ffffff"/>' +
    '<circle cx="471" cy="128" r="6" fill="#ffffff"/>' +
    '<path d="M 135 96 C 152 84 180 84 197 96" fill="none" stroke="#5aa164" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 443 96 C 460 84 488 84 505 96" fill="none" stroke="#5aa164" stroke-width="5" stroke-linecap="round"/>' +
    '<ellipse cx="118" cy="196" rx="20" ry="13" fill="#f4a8b6" opacity="0.5"/>' +
    '<ellipse cx="522" cy="196" rx="20" ry="13" fill="#f4a8b6" opacity="0.5"/>',
  teethProfile: (count) =>
    Array.from({ length: count }, (_, index) => ({
      // Krokodil: gleichmaessige, runde Zaehnchen, abwechselnd etwas laenger und kuerzer.
      kind: 'cone' as const,
      length: index % 2 === 0 ? 56 : 48,
      width: index % 2 === 0 ? 36 : 32,
    })),
  shellFactor: 0.62,
  ring: { cx: 320, cy: 265, rx: 240, ry: 160, fromDeg: 90, toDeg: 450, fullCircle: true },
  label: 'Krokodil mit offenem Maul und zwoelf runden Zaehnen, Blick von vorne oben',
};
