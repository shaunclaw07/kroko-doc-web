import { describe, expect, it } from 'vitest';
import { CREATURES } from '../../../core/domain/creature';
import { GAZE_FULL_DISTANCE, GAZE_MAX, clientToViewBox, gazeOffset, midpoint } from './gaze';
import { creatureView } from './index';

describe('gazeOffset', () => {
  it('schaut in die Richtung des Ziels, höchstens GAZE_MAX weit', () => {
    const eyes = { x: 320, y: 110 };
    expect(gazeOffset(eyes, { x: 320 + GAZE_FULL_DISTANCE, y: 110 })).toEqual({ x: GAZE_MAX, y: 0 });
    expect(gazeOffset(eyes, { x: 0, y: 110 })).toEqual({ x: -GAZE_MAX, y: 0 });
    const down = gazeOffset(eyes, { x: 320, y: 460 });
    expect(down.x).toBeCloseTo(0, 6);
    expect(down.y).toBeCloseTo(GAZE_MAX, 6);
  });

  it('schaut bei nahem Ziel weniger weit — und bei Abstand null gar nicht', () => {
    const eyes = { x: 320, y: 110 };
    const near = gazeOffset(eyes, { x: 320 + GAZE_FULL_DISTANCE / 2, y: 110 });
    expect(near.x).toBeCloseTo(GAZE_MAX / 2, 6);
    expect(gazeOffset(eyes, eyes)).toEqual({ x: 0, y: 0 });
  });

  it('liefert nie NaN, auch nicht für unsinnige Ziele', () => {
    const offset = gazeOffset({ x: 320, y: 110 }, { x: Number.NaN, y: Number.POSITIVE_INFINITY });
    expect(offset).toEqual({ x: 0, y: 0 });
  });
});

describe('midpoint', () => {
  it('mittelt die Punkte und übergeht unbrauchbare', () => {
    expect(midpoint([{ x: 146, y: 114 }, { x: 498, y: 114 }])).toEqual({ x: 322, y: 114 });
    expect(midpoint([{ x: 10, y: 20 }, { x: Number.NaN, y: 0 }])).toEqual({ x: 10, y: 20 });
    expect(midpoint([])).toBeNull();
  });
});

describe('clientToViewBox', () => {
  it('rechnet Bildschirmpunkte in die Einheiten der Zeichnung um', () => {
    const box = { left: 16, top: 100, width: 320, height: 230 };
    expect(clientToViewBox({ x: 16, y: 100 }, box)).toEqual({ x: 0, y: 0 });
    expect(clientToViewBox({ x: 176, y: 215 }, box)).toEqual({ x: 320, y: 230 });
  });

  it('liefert nichts, wenn die Zeichnung keine Größe hat (jsdom, versteckte Seite)', () => {
    expect(clientToViewBox({ x: 5, y: 5 }, { left: 0, top: 0, width: 0, height: 0 })).toBeNull();
  });
});

/** Attribut einer Form als Zahl. */
function attr(tag: string, name: string): number {
  const match = new RegExp(`\\s${name}="([-0-9.]+)"`).exec(tag);
  return match ? Number(match[1]) : Number.NaN;
}

interface Shape {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

function shape(tag: string): Shape {
  const r = attr(tag, 'r');
  return {
    cx: attr(tag, 'cx'),
    cy: attr(tag, 'cy'),
    rx: Number.isNaN(r) ? attr(tag, 'rx') : r,
    ry: Number.isNaN(r) ? attr(tag, 'ry') : r,
  };
}

function inside(lens: Shape, x: number, y: number): boolean {
  return ((x - lens.cx) / lens.rx) ** 2 + ((y - lens.cy) / lens.ry) ** 2 <= 1;
}

describe('Blick aller Tiere', () => {
  it('lässt die Pupille bei vollem Blick in jeder Richtung in der weißen Linse', () => {
    for (const creature of CREATURES) {
      const tags = creatureView(creature.id).render().match(/<(?:ellipse|circle)\b[^>]*>/g) ?? [];
      const pupils = tags.filter((tag) => tag.includes('class="pupil"')).map(shape);
      const lenses = tags.filter((tag) => tag.includes('fill="#ffffff"')).map(shape);
      expect(pupils, creature.id).toHaveLength(2);
      for (const pupil of pupils) {
        // Die Linse ist die **kleinste** weiße Form um die Pupille: der Glanzpunkt ist kleiner als
        // die Pupille, ein weißer Kopf (Panda) größer als die Linse.
        const lens = lenses
          .filter((candidate) => candidate.rx > pupil.rx && inside(candidate, pupil.cx, pupil.cy))
          .sort((one, other) => one.rx * one.ry - other.rx * other.ry)[0];
        expect(lens, `${creature.id}: keine Linse um die Pupille bei ${pupil.cx}/${pupil.cy}`).toBeDefined();
        if (!lens) continue;
        for (let direction = 0; direction < 8; direction += 1) {
          const angle = (direction * Math.PI) / 4;
          const cx = pupil.cx + Math.cos(angle) * GAZE_MAX;
          const cy = pupil.cy + Math.sin(angle) * GAZE_MAX;
          for (let edge = 0; edge < 16; edge += 1) {
            const around = (edge * Math.PI) / 8;
            const x = cx + Math.cos(around) * pupil.rx;
            const y = cy + Math.sin(around) * pupil.ry;
            expect(inside(lens, x, y), `${creature.id}: Pupille verlässt die Linse (Richtung ${direction})`).toBe(true);
          }
        }
      }
    }
  });
});
