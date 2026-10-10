import type { CreatureDefinition } from '../../../core/domain/creature';
import {
  VIEWBOX,
  bandPath,
  hitRadius,
  scaleToothSpec,
  teethScale,
  toothPath,
  toothPlacements,
  toothSpacing,
  toothTip,
  type ToothPlacement,
} from './geometry';
import type {
  BandSpec,
  CreatureArtwork,
  CreatureView,
  RingGeometry,
  ToothAnchor,
} from './types';

function n(value: number): string {
  return value.toFixed(1);
}

function teethMarkup(placements: readonly ToothPlacement[], pressable: boolean, hit: number): string {
  return placements
    .map((placement) => {
      const transform = `translate(${n(placement.x)} ${n(placement.y)}) rotate(${n(placement.deg)})`;
      const shape = toothPath(placement.spec);
      const fill = placement.spec.fill ?? '#f4f1e6';
      const stroke = placement.spec.stroke ?? '#c9c2ac';
      if (!pressable) {
        return (
          `<g class="rest-tooth" transform="${transform}" aria-hidden="true">` +
          `<path class="tooth__shape" d="${shape}" fill="${fill}" stroke="${stroke}"/>` +
          '</g>'
        );
      }
      return (
        `<g class="tooth" data-tooth="${placement.id}" data-kind="${placement.spec.kind}" ` +
        `transform="${transform}" tabindex="0" role="button" aria-label="Zahn ${placement.id}">` +
        // Trefferfläche für den Finger: größer als die Zeichnung, folgt der Zahnachse.
        `<circle class="tooth__hit" cy="${(-placement.spec.length / 2).toFixed(1)}" r="${hit.toFixed(1)}"/>` +
        `<path class="tooth__glow" d="${shape}"/>` +
        `<path class="tooth__shape" d="${shape}" fill="${fill}" stroke="${stroke}"/>` +
        '</g>'
      );
    })
    .join('');
}

/** Außenring: Band vom erweiterten Ellipsenbogen nach innen auf den Ring zu. */
function shellMarkup(ring: RingGeometry, shell: BandSpec): string {
  const t = shell.thickness;
  const d = bandPath(ring.cx, ring.cy, ring.rx + t, ring.ry + t, t, shell.fromDeg, shell.toDeg);
  const stroke = shell.stroke ? ` stroke="${shell.stroke}"` : '';
  return `<path class="jaw__shell" d="${d}" fill="${shell.fill}"${stroke}/>`;
}

/** Zähne oberhalb der Maulmitte gehören zum Oberkiefer und fahren beim Biss mit. */
function splitByJaw(placements: readonly ToothPlacement[], ring: RingGeometry): { upper: ToothPlacement[]; lower: ToothPlacement[] } {
  const upper: ToothPlacement[] = [];
  const lower: ToothPlacement[] = [];
  for (const placement of placements) {
    (placement.y < ring.cy ? upper : lower).push(placement);
  }
  return { upper, lower };
}

function bandMarkup(ring: RingGeometry, band: BandSpec, className: string): string {
  const d = bandPath(ring.cx, ring.cy, ring.rx, ring.ry, band.thickness, band.fromDeg, band.toDeg);
  const stroke = band.stroke ? ` stroke="${band.stroke}"` : '';
  return `<path class="${className}" d="${d}" fill="${band.fill}"${stroke}/>`;
}

/**
 * Baut aus Kunstwerk-Daten und Katalog-Eintrag die fertige Ansicht.
 *
 * Der Schließweg des Oberkiefers wird berechnet, nicht gesetzt: beide Zahnfleischbänder
 * liegen auf demselben Ring, also treffen sich ihre Innenkanten genau dann, wenn der
 * Oberkiefer um (2*ry - Dicke oben - Dicke unten) gefahren ist. So stimmt die Schließung
 * auch für ein neues Lebewesen mit anderem Gebiss.
 */
export function createCreatureView(creature: CreatureDefinition, art: CreatureArtwork): CreatureView {
  const scale = teethScale(creature.teeth);
  const specs = art.teethProfile(creature.teeth).map((entry) => scaleToothSpec(entry, scale));
  const placements = toothPlacements(creature.teeth, art.ring, specs);
  const hit = hitRadius(creature.teeth, art.ring);
  const jaws = splitByJaw(placements, art.ring);
  const closeShift = Math.max(0, 2 * art.ring.ry - art.upper.thickness - art.lower.thickness);
  // Die Schnauze fährt nur einen Teil des Weges mit: ganz gefahren verschwände sie unter
  // dem Kopf, halb gefahren liest sie sich als zufahrender Kiefer.
  const shellShift = closeShift * (art.shellFactor ?? 0.55);
  // Die Maulöffnung reicht bis zur Innenkante des schmaleren Bandes — dann deckt sie
  // oben und unten genau ab und es bleibt kein Rand aus Kopffarbe stehen.
  const holeInset = Math.min(art.upper.thickness, art.lower.thickness);
  const holeMarkup =
    `<ellipse class="mouth__hole-shape" cx="${art.ring.cx}" cy="${art.ring.cy}" ` +
    `rx="${n(art.ring.rx - holeInset)}" ry="${n(art.ring.ry - holeInset)}" fill="${art.holeFill}"/>`;

  const render = (): string =>
    [
      `<svg class="creature" data-creature="${creature.id}" viewBox="0 0 ${VIEWBOX.width} ${VIEWBOX.height}" ` +
        `style="--close-shift: ${n(closeShift)}px; --shell-shift: ${n(shellShift)}px" ` +
        `role="img" aria-label="${art.label}">`,
      `<g class="creature__body">${art.body}</g>`,
      `<g class="mouth__hole">${holeMarkup}</g>`,
      `<g class="mouth__inner">${art.inner}</g>`,
      `<g class="jaw__shell">${art.upperShell ? shellMarkup(art.ring, art.upperShell) : ''}` +
        `${art.upperExtra ?? ''}</g>`,
      // Oberkiefer: Band und die Zähne der oberen Maulhälfte — beide fahren beim Biss mit.
      `<g class="jaw__upper">${bandMarkup(art.ring, art.upper, 'jaw__band jaw__band--upper')}` +
        `<g class="teeth teeth--upper">${teethMarkup(jaws.upper, true, hit)}</g></g>`,
      `<g class="teeth">${teethMarkup(jaws.lower, true, hit)}</g>`,
      `<g class="jaw__lower">${art.lowerExtra ?? ''}${bandMarkup(art.ring, art.lower, 'jaw__band jaw__band--lower')}</g>`,
      `<g class="creature__face">${art.face}</g>`,
      '<g class="creature__biter" opacity="0">',
      '<circle class="creature__biter-ring" r="30"/>',
      '<circle class="creature__biter-ring creature__biter-ring--outer" r="46"/>',
      '<text class="creature__biter-label" x="0" y="-34" text-anchor="middle"></text>',
      '</g>',
      '</svg>',
    ].join('');

  return {
    id: creature.id,
    name: creature.name,
    teeth: creature.teeth,
    viewBox: { ...VIEWBOX },
    closeShift,
    render,
    toothAnchor(toothId: number): ToothAnchor {
      const placement = placements.find((entry) => entry.id === toothId);
      return placement ? toothTip(placement) : { x: art.ring.cx, y: art.ring.cy };
    },
  };
}
