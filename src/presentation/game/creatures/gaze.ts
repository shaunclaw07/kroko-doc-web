import { VIEWBOX } from './geometry';

/** Punkt in den Einheiten der Zeichnung (oder des Bildschirms, wo es dabeisteht). */
export interface Point {
  x: number;
  y: number;
}

/**
 * Größter Weg einer Pupille in SVG-Einheiten. Nachgerechnet am engsten Auge (Panther: Pupille
 * r 10,5 in einer Iris von r 17); der Test hält es für alle Tiere fest. Wer den Wert anhebt,
 * fährt `gaze.test.ts` und `scripts/pruefen-blick.py`.
 */
export const GAZE_MAX = 4;
/** Ab diesem Abstand schaut das Tier voll zur Seite; ein nahes Ziel zieht den Blick weniger weit. */
export const GAZE_FULL_DISTANCE = 120;

/**
 * Versatz der Pupillen: von der Augenmitte in Richtung des Ziels. Hängt nur an zwei Punkten —
 * der Blick kann deshalb nichts über scharfe Zähne verraten.
 */
export function gazeOffset(from: Point, target: Point): Point {
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance < 1) {
    return { x: 0, y: 0 };
  }
  const reach = GAZE_MAX * Math.min(1, distance / GAZE_FULL_DISTANCE);
  return { x: (dx / distance) * reach, y: (dy / distance) * reach };
}

/** Mitte mehrerer Punkte — die Augenmitte aus den beiden Pupillen. */
export function midpoint(points: readonly Point[]): Point | null {
  const usable = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (usable.length === 0) {
    return null;
  }
  return {
    x: usable.reduce((sum, point) => sum + point.x, 0) / usable.length,
    y: usable.reduce((sum, point) => sum + point.y, 0) / usable.length,
  };
}

/**
 * Bildschirmpunkt → Einheiten der Zeichnung. `box` ist der gemessene Kasten des SVG; hat er keine
 * Größe (jsdom, versteckte Seite), gibt es keinen Punkt.
 */
export function clientToViewBox(
  client: Point,
  box: { left: number; top: number; width: number; height: number },
): Point | null {
  if (!(box.width > 0) || !(box.height > 0)) {
    return null;
  }
  return {
    x: ((client.x - box.left) / box.width) * VIEWBOX.width,
    y: ((client.y - box.top) / box.height) * VIEWBOX.height,
  };
}
