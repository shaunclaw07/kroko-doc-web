import type { RandomSource } from '../../core/ports/random';

/** Reproduzierbarer Zufall für Tests (LCG) — keine Krypto-Qualität nötig. */
export class SeededRandom implements RandomSource {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0 || 1;
  }

  next(): number {
    // Numerical-Recipes-LCG, 32 Bit
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  uniformInt(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }
}
