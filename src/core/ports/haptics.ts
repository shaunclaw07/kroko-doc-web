/**
 * Kurze Rückmeldung über den Tastsinn. Der Kern ruft sie nie — die Bedienung steuert sie,
 * genau wie den Ton. Nicht jeder Browser kann das (Safari auf iOS kennt die Schnittstelle
 * überhaupt nicht), deshalb fragt die Oberfläche vorher `isSupported()`.
 */
export interface HapticsPort {
  /** Kann dieser Browser vibrieren? */
  isSupported(): boolean;
  /** Zahl = Millisekunden; Liste = an/aus im Wechsel (Vibrationsmuster). */
  vibrate(pattern: number | readonly number[]): void;
}

/** Tast-Rückmeldung: ein kurzer Tipp bei jedem Zahndruck (ms). */
export const TAP_VIBRATION_MS = 25;

/** Drei Stöße beim Zuschnappen (ms). */
export const BITE_VIBRATION_PATTERN = [120, 50, 220] as const;

/** Kürzester Stoß bei der Erleichterung (ms) — wächst mit der erlebten Pause. */
export const RELIEF_VIBRATION_MIN_MS = 12;
