import type { RandomSource } from '../../core/ports/random';

/** Zufall aus der Krypto-Quelle des Browsers — kein seedbarer Pseudo-Zufall. */
export class CryptoRandom implements RandomSource {
  private buffer: Uint32Array | null = null;
  private cursor = 0;

  next(): number {
    const source = globalThis.crypto;
    if (!source || typeof source.getRandomValues !== 'function') {
      // Ohne Krypto-Quelle bleibt echter Zufall übrig: Math.random ist ehrlicher als eine Konstante.
      return Math.random();
    }
    if (!this.buffer || this.cursor >= this.buffer.length) {
      this.buffer = new Uint32Array(32);
      source.getRandomValues(this.buffer);
      this.cursor = 0;
    }
    const value = this.buffer[this.cursor] ?? 0;
    this.cursor += 1;
    return value / 4294967296;
  }

  uniformInt(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }
}
