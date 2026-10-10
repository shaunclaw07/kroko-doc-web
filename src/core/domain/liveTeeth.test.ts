import { describe, expect, it } from 'vitest';
import { UniformLiveTeethSelector } from './liveTeeth';
import { SeededRandom } from '../../infrastructure/testing/seededRandom';
import { ScriptedRandom } from '../../infrastructure/testing/scriptedRandom';

const selector = new UniformLiveTeethSelector();

describe('UniformLiveTeethSelector', () => {
  it('classic: stellt genau einen Zahn scharf (Zahnnummer folgt der Zufallsquelle)', () => {
    expect(selector.select(new ScriptedRandom([0]), 10, 'classic')).toEqual([1]);
    expect(selector.select(new ScriptedRandom([0.9999]), 10, 'classic')).toEqual([10]);
  });

  it('original: 1 bis 3 Zähne, niemals mehr als die Modellgrenze', () => {
    const rng = new SeededRandom(7);
    for (let round = 0; round < 2000; round += 1) {
      const live = selector.select(rng, 10, 'original');
      expect(live.length).toBeGreaterThanOrEqual(1);
      expect(live.length).toBeLessThanOrEqual(3);
    }
  });

  it('original: die Anzahl scharfer Zähne ist über 1, 2, 3 etwa gleichverteilt', () => {
    const rng = new SeededRandom(11);
    const counts = new Map<number, number>([[1, 0], [2, 0], [3, 0]]);
    const draws = 9000;
    for (let round = 0; round < draws; round += 1) {
      const k = selector.select(rng, 10, 'original').length;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    for (const k of [1, 2, 3]) {
      const share = (counts.get(k) ?? 0) / draws;
      expect(share).toBeGreaterThan(0.3);
      expect(share).toBeLessThan(0.37);
    }
  });

  it('liefert nur Zähne aus dem gültigen Bereich, ohne Doppelte', () => {
    const rng = new SeededRandom(3);
    for (let round = 0; round < 500; round += 1) {
      const live = selector.select(rng, 10, 'original');
      expect(new Set(live).size).toBe(live.length);
      for (const tooth of live) {
        expect(tooth).toBeGreaterThanOrEqual(1);
        expect(tooth).toBeLessThanOrEqual(10);
      }
    }
  });

  it('ist bei gleichem Startwert reproduzierbar', () => {
    const a = selector.select(new SeededRandom(42), 12, 'original');
    const b = selector.select(new SeededRandom(42), 12, 'original');
    expect(a).toEqual(b);
  });
});
