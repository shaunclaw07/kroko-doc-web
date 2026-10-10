/**
 * Kurze Rückmeldung über den Tastsinn. Der Kern ruft sie nie — die Bedienung steuert sie,
 * genau wie den Ton. Nicht jeder Browser kann das (Safari auf iOS kennt die Schnittstelle
 * überhaupt nicht), deshalb fragt die Oberfläche vorher `isSupported()`.
 */
export interface HapticsPort {
  /** Kann dieser Browser vibrieren? */
  isSupported(): boolean;
  /**
   * Zahl = Millisekunden; Liste = an/aus im Wechsel (Vibrationsmuster).
   * Rückgabe: `true`, wenn der Browser den Auftrag angenommen hat. `false` heißt abgelehnt
   * (Schnittstelle fehlt, Seite nicht sichtbar, kein vorausgegangener Finger) — das ist das
   * einzige ehrliche Signal, das ein Webspiel über die Vibration bekommen kann.
   */
  vibrate(pattern: number | readonly number[]): boolean;
}
