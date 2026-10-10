import type { LiveTeethSelector } from '../ports/liveTeeth';
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
 * Standardauswahl scharfer Zähne: im Originalmodell 1 bis 3 gleichverteilt,
 * im klassischen Modell genau einer.
 */
export class UniformLiveTeethSelector implements LiveTeethSelector {
  select(rng: RandomSource, teeth: number, mode: RandomMode): number[] {
    const count = mode === 'classic' ? 1 : 1 + rng.uniformInt(MAX_LIVE_TEETH);
    return sampleDistinct(rng, teeth, count);
  }
}
