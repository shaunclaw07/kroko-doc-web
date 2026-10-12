/** Namen aller Klänge — die Umsetzung entscheidet, wie sie klingen. */
export type SoundName =
  | 'tap' // harmloser Druck auf einen Zahn
  | 'creak' // Knarren der Feder beim Öffnen
  | 'twitch' // Fakeout: Maul zuckt, schnappt aber nicht zu
  | 'snap' // das Zuschnappen
  | 'breath' // Atem des Tieres in der Pause vor der Auflösung
  | 'settle' // die Feder kommt zur Ruhe (harmloser Ausgang)
  | 'win' // Runde überlebt
  | 'lose'; // Verlierer-Moment

/** Tonausgabe nach außen. Der Kern ruft sie nie — die Bedienung steuert sie. */
export interface SoundPort {
  /** Spielt einen Klang; intensity 0..1 verschiebt Tonhöhe/Lautstärke. */
  play(name: SoundName, intensity?: number): void;
  /**
   * Die Stimme eines Tiers (Kennung aus dem Katalog). Kennt die Umsetzung das Tier nicht oder ist
   * die Stimme nicht rechtzeitig da, bleibt sie still. Die Bedienung ruft sie beim Wählen und nach
   * dem Biss — nie vor einem Urteil.
   */
  playVoice(creatureId: string): void;
  /** Spannungspegel 0..1 (steuert Tonhöhe und Lautstärke des Knarrens). */
  setTension(level: number): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  /** Alle laufenden Klänge sofort beenden (Totenstille vor dem Biss). */
  stopAll(): void;
  /** Nach der ersten Nutzergeste aufrufen (Browser-Sperre für Audio). */
  unlock(): void;
}
