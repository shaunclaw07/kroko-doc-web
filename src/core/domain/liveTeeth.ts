import type { LiveTeethRequest, LiveTeethSelector } from '../ports/liveTeeth';
import type { RandomSource } from '../ports/random';
import { MAX_LIVE_TEETH, type RandomMode } from './teeth';

/** Zieht k verschiedene Zähne aus 1..population (Teil-Mischen, ohne Doppelte). */
export function sampleDistinct(rng: RandomSource, population: number, k: number): number[] {
  const pool = Array.from({ length: population }, (_, index) => index + 1);
  const picked: number[] = [];
  const wanted = Math.max(0, Math.min(k, population));
  for (let i = 0; i < wanted; i += 1) {
    const j = i + rng.uniformInt(population - i);
    const swap = pool[j] ?? pool[i] ?? 0;
    pool[j] = pool[i] ?? 0;
    pool[i] = swap;
    picked.push(swap);
  }
  return picked.sort((a, b) => a - b);
}

/**
 * Standardauswahl scharfer Zähne: im Originalmodell eine Anzahl zwischen min und max
 * (je nach Gebiss), im klassischen Modell genau einer. MAX_LIVE_TEETH bleibt die
 * harte Obergrenze — kein Gebiss dieser Spielzeug-Reihe hat mehr als drei.
 */
export class UniformLiveTeethSelector implements LiveTeethSelector {
  select({ rng, teeth, mode, min, max }: LiveTeethRequest): number[] {
    const lowest = Math.max(1, Math.min(min, teeth, MAX_LIVE_TEETH));
    const highest = Math.max(lowest, Math.min(max, teeth, MAX_LIVE_TEETH));
    const count = mode === 'classic' ? 1 : lowest + rng.uniformInt(highest - lowest + 1);
    return sampleDistinct(rng, teeth, count);
  }
}

/** Bequemer Aufruf für Aufrufer, die nur die harten Grenzen brauchen. */
export function defaultLimits(): { min: number; max: number } {
  return { min: 1, max: MAX_LIVE_TEETH };
}

export type { LiveTeethRequest, LiveTeethSelector, RandomMode, RandomSource };
