import type { RingGeometry, ToothSpec } from './types';

export const VIEWBOX = { width: 640, height: 460 } as const;

/** Bogenlänge der Ellipse (Näherung nach Ramanujan) — Grundlage der Trefferflächen. */
export function arcLength(ring: RingGeometry): number {
  const a = ring.rx;
  const b = ring.ry;
  const h = ((a - b) / (a + b)) ** 2;
  const span = ring.fullCircle ? 1 : (ring.toDeg - ring.fromDeg) / 360;
  return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h))) * span;
}

/** Abstand zweier Nachbarzähne auf dem Ring (SVG-Einheiten). */
export function toothSpacing(count: number, ring: RingGeometry): number {
  return count > 1 ? arcLength(ring) / count : arcLength(ring);
}

/**
 * Trefferfläche je Zahn: halber Zahnabstand, damit sich zwei Zähne nicht überdecken,
 * nach oben begrenzt (ein 4-Zähne-Maul braucht keine meterlangen Flächen).
 */
export function hitRadius(count: number, ring: RingGeometry): number {
  return Math.max(14, Math.min(48, toothSpacing(count, ring) * 0.5));
}

/** Trefferfläche in CSS-Pixeln bei gegebener Bühnenbreite (Handy: rund 358 px). */
export function tapTargetPx(count: number, ring: RingGeometry, stageWidthPx = 358): number {
  return 2 * hitRadius(count, ring) * (stageWidthPx / VIEWBOX.width);
}

/** Kleinste Kantenlänge, die ein Finger treffen soll (Apple/Google-Richtwert). */
export const MIN_TAP_TARGET_PX = 44;

/** Höchste Zahnzahl, bei der jedes Tippziel noch MIN_TAP_TARGET_PX groß ist. */
export function maxTapFriendlyTeeth(ring: RingGeometry, stageWidthPx = 358): number {
  let best = 1;
  for (let count = 2; count <= MAX_TEETH_HARD; count += 1) {
    if (tapTargetPx(count, ring, stageWidthPx) < MIN_TAP_TARGET_PX) {
      break;
    }
    best = count;
  }
  return best;
}

/** Harte Obergrenze der Zeichnung (die Fachgrenze steht in core/domain/teeth.ts). */
export const MAX_TEETH_HARD = 20;

/**
 * Zähne an die Zahnzahl anpassen: bei vielen Zähnen werden sie schmaler (sonst
 * überlappen sie), bei wenigen etwas kräftiger. Die Länge bleibt fast unverändert.
 */
export function teethScale(count: number): { width: number; length: number } {
  const width = Math.max(0.5, Math.min(1.35, 12 / count));
  const length = Math.max(0.85, Math.min(1.15, Math.sqrt(12 / count)));
  return { width, length };
}

export function scaleToothSpec(spec: ToothSpec, scale: { width: number; length: number }): ToothSpec {
  return { kind: spec.kind, length: spec.length * scale.length, width: spec.width * scale.width };
}

export interface ToothPlacement {
  id: number;
  x: number;
  y: number;
  /** Richtung von der Wurzel zur Spitze (zeigt zur Maulmitte). */
  dirX: number;
  dirY: number;
  /** Drehung der Zahnform in Grad. */
  deg: number;
  spec: ToothSpec & { fill?: string; stroke?: string };
}

function rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function arcPoint(cx: number, cy: number, rx: number, ry: number, deg: number): { x: number; y: number } {
  return { x: cx + rx * Math.cos(rad(deg)), y: cy + ry * Math.sin(rad(deg)) };
}

/**
 * Fläche zwischen zwei Ellipsenbögen — Zahnfleisch- und Lippenbänder.
 * Die Dicke wächst zur Maulmitte hin.
 */
export function bandPath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  thickness: number,
  fromDeg: number,
  toDeg: number,
): string {
  const innerRx = Math.max(1, rx - thickness);
  const innerRy = Math.max(1, ry - thickness);
  const outerFrom = arcPoint(cx, cy, rx, ry, fromDeg);
  const outerTo = arcPoint(cx, cy, rx, ry, toDeg);
  const innerTo = arcPoint(cx, cy, innerRx, innerRy, toDeg);
  const innerFrom = arcPoint(cx, cy, innerRx, innerRy, fromDeg);
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  return [
    `M ${outerFrom.x.toFixed(1)} ${outerFrom.y.toFixed(1)}`,
    `A ${rx} ${ry} 0 ${large} 1 ${outerTo.x.toFixed(1)} ${outerTo.y.toFixed(1)}`,
    `L ${innerTo.x.toFixed(1)} ${innerTo.y.toFixed(1)}`,
    `A ${innerRx} ${innerRy} 0 ${large} 0 ${innerFrom.x.toFixed(1)} ${innerFrom.y.toFixed(1)}`,
    'Z',
  ].join(' ');
}

/** Verteilt Zähne gleichmäßig auf dem Bogen und richtet sie zur Maulmitte aus. */
export function toothPlacements(
  count: number,
  ring: RingGeometry,
  specs: readonly (ToothSpec & { fill?: string; stroke?: string })[],
): ToothPlacement[] {
  const placements: ToothPlacement[] = [];
  const fallback: ToothPlacement['spec'] = { kind: 'cone', length: 60, width: 30 };
  for (let index = 0; index < count; index += 1) {
    const t = count === 1 ? 0.5 : index / (count - 1);
    // Voller Ring: die Zähne verteilen sich gleichmäßig um das ganze Maul (oben und unten),
    // damit jedem Zahn ein großes Tippziel bleibt.
    const span = ring.fullCircle ? 360 * ((count - 1) / count) : ring.toDeg - ring.fromDeg;
    const deg = ring.fromDeg + span * t;
    const point = arcPoint(ring.cx, ring.cy, ring.rx, ring.ry, deg);
    const dx = ring.cx - point.x;
    const dy = ring.cy - point.y;
    const norm = Math.hypot(dx, dy) || 1;
    const dirX = dx / norm;
    const dirY = dy / norm;
    placements.push({
      id: index + 1,
      x: point.x,
      y: point.y,
      dirX,
      dirY,
      // Die Zahnform zeigt lokal nach oben (-y); gedreht wird sie in Richtung Maulmitte.
      deg: (Math.atan2(dirX, -dirY) * 180) / Math.PI,
      spec: specs[index] ?? specs[specs.length - 1] ?? fallback,
    });
  }
  return placements;
}

/** Zahnform in lokalen Koordinaten: Wurzel bei (0,0), Spitze bei (0,-length). */
export function toothPath(spec: ToothSpec): string {
  const half = spec.width / 2;
  const length = spec.length;
  if (spec.kind === 'flat') {
    return [
      `M ${-half} 0`,
      `L ${-half} ${(-(length - 6)).toFixed(1)}`,
      `Q 0 ${(-(length + 4)).toFixed(1)} ${half} ${(-(length - 6)).toFixed(1)}`,
      `L ${half} 0`,
      'Z',
    ].join(' ');
  }
  if (spec.kind === 'square') {
    const shoulder = length * 0.82;
    return [
      `M ${-half} 0`,
      `L ${-half} ${(-shoulder).toFixed(1)}`,
      `Q ${(-half * 0.85).toFixed(1)} ${(-length).toFixed(1)} 0 ${(-length).toFixed(1)}`,
      `Q ${(half * 0.85).toFixed(1)} ${(-length).toFixed(1)} ${half} ${(-shoulder).toFixed(1)}`,
      `L ${half} 0`,
      'Z',
    ].join(' ');
  }
  return [
    `M ${-half} 0`,
    `C ${-half} ${(-length * 0.45).toFixed(1)} ${(-half * 0.52).toFixed(1)} ${(-length * 0.82).toFixed(1)} 0 ${(-length).toFixed(1)}`,
    `C ${(half * 0.52).toFixed(1)} ${(-length * 0.82).toFixed(1)} ${half} ${(-length * 0.45).toFixed(1)} ${half} 0`,
    'Z',
  ].join(' ');
}

/** Spitze eines Zahns in Bühnenkoordinaten. */
export function toothTip(placement: ToothPlacement): { x: number; y: number } {
  return {
    x: placement.x + placement.dirX * placement.spec.length,
    y: placement.y + placement.dirY * placement.spec.length,
  };
}
