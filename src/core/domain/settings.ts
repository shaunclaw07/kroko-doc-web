import { DEFAULT_CREATURE_ID } from './creature';
import { DEFAULT_MODE, DEFAULT_PLAYERS, type RandomMode } from './teeth';

export interface GameSettings {
  mode: RandomMode;
  players: number;
  sound: boolean;
  vibration: boolean;
  /** Gewähltes Lebewesen (Kennung aus dem Katalog). */
  creature: string;
  /**
   * Abweichende Zahl drückbarer Zähne. `null` heißt: so viele Zähne, wie das Lebewesen
   * im Katalog vorsieht (Krokodil 10, Wolf 12, Mensch 12).
   */
  teethOverride: number | null;
}

export const DEFAULT_SETTINGS: GameSettings = {
  mode: DEFAULT_MODE,
  players: DEFAULT_PLAYERS,
  sound: true,
  vibration: true,
  creature: DEFAULT_CREATURE_ID,
  teethOverride: null,
};
