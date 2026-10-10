import type { HapticsPort } from '../../core/ports/haptics';

/** Attrappe für Tests: merkt sich die Muster, statt zu vibrieren. */
export class RecordingHaptics implements HapticsPort {
  readonly patterns: (number | number[])[] = [];

  constructor(private readonly supported = true) {}

  isSupported(): boolean {
    return this.supported;
  }

  vibrate(pattern: number | readonly number[]): void {
    if (!this.supported) {
      return;
    }
    this.patterns.push(typeof pattern === 'number' ? pattern : [...pattern]);
  }
}
