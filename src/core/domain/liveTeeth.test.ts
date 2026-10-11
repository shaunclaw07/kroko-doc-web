import { describe, expect, it } from 'vitest';
import { UniformLiveTeethSelector } from './liveTeeth';
import { MAX_LIVE_TEETH } from './teeth';
import { SeededRandom } from '../../infrastructure/testing/seededRandom';
import { ScriptedRandom } from '../../infrastructure/testing/scriptedRandom';

const selector = new UniformLiveTeethSelector();

/** Grenzen des Krokodils (1 bis 3) — die Voreinstellung des Spiels. */
const crocodile = { min: 1, max: 3 };

describe('UniformLiveTeethSelector', () => {
  it('classic: stellt genau einen Zahn scharf (Zahnnummer folgt der Zufallsquelle)', () => {
    const request = (value: number) => ({ rng: new ScriptedRandom([value]), teeth: 10, mode: 'classic' as const, ...crocodile });
    expect(selector.select(request(0))).toEqual([1]);
    expect(selector.select(request(0.9999))).toEqual([10]);
  });

  it('kappt die Grenzen auf die Zahnzahl: bei einem Zahn ist genau dieser scharf', () => {
    // Das kleinste Gebiss ist ein Zahn (Wunsch vom 11.10.2026). Damit der Tipp darauf auch
    // schnappt, müssen die Gebissgrenzen (hier 1 bis 3) auf die Zahnzahl gekappt werden.
    const rng = new SeededRandom(17);
    for (const mode of ['original', 'classic'] as const) {
      for (let round = 0; round < 50; round += 1) {
        expect(selector.select({ rng, teeth: 1, mode, ...crocodile })).toEqual([1]);
      }
    }
  });

  it('original: 1 bis 3 Zähne, niemals mehr als die Modellgrenze', () => {
    const rng = new SeededRandom(7);
    for (let round = 0; round < 2000; round += 1) {
      const live = selector.select({ rng, teeth: 10, mode: 'original', ...crocodile });
      expect(live.length).toBeGreaterThanOrEqual(1);
      expect(live.length).toBeLessThanOrEqual(3);
    }
  });

  it('original: die Anzahl scharfer Zähne ist über 1, 2, 3 etwa gleichverteilt', () => {
    const rng = new SeededRandom(11);
    const counts = new Map<number, number>([[1, 0], [2, 0], [3, 0]]);
    const draws = 9000;
    for (let round = 0; round < draws; round += 1) {
      const k = selector.select({ rng, teeth: 10, mode: 'original', ...crocodile }).length;
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
      const live = selector.select({ rng, teeth: 10, mode: 'original', ...crocodile });
      expect(new Set(live).size).toBe(live.length);
      for (const tooth of live) {
        expect(tooth).toBeGreaterThanOrEqual(1);
        expect(tooth).toBeLessThanOrEqual(10);
      }
    }
  });

  it('ist bei gleichem Startwert reproduzierbar', () => {
    const a = selector.select({ rng: new SeededRandom(42), teeth: 12, mode: 'original', ...crocodile });
    const b = selector.select({ rng: new SeededRandom(42), teeth: 12, mode: 'original', ...crocodile });
    expect(a).toEqual(b);
  });

  it('hält die Obergrenze des Gebisses ein (Wolf: höchstens zwei scharfe Zähne)', () => {
    const rng = new SeededRandom(5);
    const counts = new Set<number>();
    for (let round = 0; round < 3000; round += 1) {
      const live = selector.select({ rng, teeth: 12, mode: 'original', min: 1, max: 2 });
      counts.add(live.length);
    }
    expect([...counts].sort()).toEqual([1, 2]);
  });

  it('klemmt unsinnige Grenzen auf den gültigen Bereich', () => {
    const rng = new SeededRandom(9);
    for (let round = 0; round < 200; round += 1) {
      // max über der Modellgrenze und über der Zahnzahl -> hart begrenzt
      const live = selector.select({ rng, teeth: 4, mode: 'original', min: 1, max: 99 });
      expect(live.length).toBeLessThanOrEqual(Math.min(4, MAX_LIVE_TEETH));
      expect(live.length).toBeGreaterThanOrEqual(1);
      // Widersprüchliche Grenzen (min über max) kann der Katalog nicht erzeugen.
      // Kommt es doch dazu, hat die untere Grenze Vorrang — hart auf MAX_LIVE_TEETH begrenzt.
      const inverted = selector.select({ rng, teeth: 4, mode: 'original', min: 5, max: 1 });
      expect(inverted.length).toBe(MAX_LIVE_TEETH);
    }
  });

  it('classic bleibt bei genau einem Zahn, egal welche Grenzen das Gebiss meldet', () => {
    const rng = new SeededRandom(13);
    for (let round = 0; round < 200; round += 1) {
      expect(selector.select({ rng, teeth: 12, mode: 'classic', min: 1, max: 2 })).toHaveLength(1);
    }
  });
});
