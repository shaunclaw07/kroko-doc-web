import type { HapticsPort } from '../../core/ports/haptics';

type VibrateFunction = (pattern: number | number[]) => boolean;

/** Navigatorschnittstelle, die wir brauchen — absichtlich schmal gehalten. */
export interface VibrationCapable {
  vibrate?: VibrateFunction;
}

/**
 * Vibration des Browsers.
 *
 * Safari auf iOS kennt `navigator.vibrate` nicht — dort ist `isSupported()` falsch und die
 * Oberfläche sagt das offen, statt einen Schalter anzubieten, der nichts tut.
 */
export class BrowserHaptics implements HapticsPort {
  private readonly vibrateFunction: VibrateFunction | null;

  constructor(navigatorLike: VibrationCapable | null = typeof navigator === 'undefined' ? null : navigator) {
    const candidate = navigatorLike?.vibrate;
    // Gebunden aufrufen: der Browser verlangt `this === navigator`.
    this.vibrateFunction = typeof candidate === 'function' ? candidate.bind(navigatorLike) : null;
  }

  isSupported(): boolean {
    return this.vibrateFunction !== null;
  }

  vibrate(pattern: number | readonly number[]): boolean {
    if (!this.vibrateFunction) {
      return false;
    }
    try {
      return this.vibrateFunction(typeof pattern === 'number' ? pattern : [...pattern]) === true;
    } catch {
      // Rückmeldung ist ein Extra — sie darf das Spiel nie anhalten.
      return false;
    }
  }
}
