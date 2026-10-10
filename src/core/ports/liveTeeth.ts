import type { RandomMode } from '../domain/teeth';
import type { RandomSource } from './random';

/** Stellt fest, welche Zähne in einer Runde "scharf" sind (löst das Zuschnappen aus). */
export interface LiveTeethSelector {
  select(rng: RandomSource, teeth: number, mode: RandomMode): number[];
}
