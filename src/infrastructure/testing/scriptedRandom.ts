import type { RandomSource } from '../../core/ports/random';

/** Zufall aus einer Liste — für Tests, die ein Ergebnis exakt vorgeben wollen. */
export class ScriptedRandom implements RandomSource {
  private readonly values: number[];
  private cursor = 0;

  constructor(values: number[]) {
    this.values = [...values];
  }

  next(): number {
    const value = this.values[this.cursor % this.values.length] ?? 0;
    this.cursor += 1;
    return value;
  }

  uniformInt(maxExclusive: number): number {
    return Math.min(maxExclusive - 1, Math.floor(this.next() * maxExclusive));
  }
}
