/** Namen aller Klänge — die Umsetzung entscheidet, wie sie klingen. */
export type SoundName =
  | 'tap' // harmloser Druck auf einen Zahn
  | 'creak' // Knarren der Feder beim Öffnen
  | 'heartbeat' // Herzschlag, wird mit der Spannung schneller
  | 'twitch' // Fakeout: Maul zuckt, schnappt aber nicht zu
  | 'snap' // das Zuschnappen
  | 'win' // Runde überlebt
  | 'lose'; // Verlierer-Moment

/** Tonausgabe nach außen. Der Kern ruft sie nie — die Bedienung steuert sie. */
export interface SoundPort {
  /** Spielt einen Klang; intensity 0..1 verschiebt Tonhöhe/Lautstärke. */
  play(name: SoundName, intensity?: number): void;
  /** Spannungspegel 0..1 (steuert Tempo von Herzschlag und Knarren). */
  setTension(level: number): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  /** Alle laufenden Klänge sofort beenden (Totenstille vor dem Biss). */
  stopAll(): void;
  /** Nach der ersten Nutzergeste aufrufen (Browser-Sperre für Audio). */
  unlock(): void;
}
