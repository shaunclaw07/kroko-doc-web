/** Zahn-Nummern sind 1-basiert (Zahn 1 ... Zahn n). */
export type ToothId = number;

/**
 * Zufallsmodell des Spiels:
 *  - `original`: beim Öffnen werden 1 bis 3 Zähne gleichzeitig scharf gestellt
 *    (so arbeitet der echte Kroko Doc, make Magazin 1/2023).
 *  - `classic`: genau ein Zahn von n ist scharf.
 */
export type RandomMode = 'original' | 'classic';

export const DEFAULT_TEETH = 10;
export const MIN_TEETH = 4;
/**
 * Obergrenze drückbarer Zähne. Ein echtes Gebiss hat 32–42 Zähne; als Spiel sind mehr als
 * 20 auf einem Handy nicht mehr treffsicher zu bedienen (Zähne und Trefferflächen würden
 * einander überlappen). Deshalb: spielbar bis 20, echte Zahnzahl nur als Notiz im Katalog.
 */
export const MAX_TEETH = 20;
export const MAX_PLAYERS = 4;
export const DEFAULT_PLAYERS = 1;
export const DEFAULT_MODE: RandomMode = 'original';

export const RANDOM_MODES: readonly RandomMode[] = ['original', 'classic'];

/** Höchstzahl gleichzeitig scharfer Zähne im Originalmodell (Bumerang mit zwei Enden). */
export const MAX_LIVE_TEETH = 3;

export function isValidToothCount(teeth: number): boolean {
  return Number.isInteger(teeth) && teeth >= MIN_TEETH && teeth <= MAX_TEETH;
}

export function isValidPlayerCount(players: number): boolean {
  return Number.isInteger(players) && players >= 1 && players <= MAX_PLAYERS;
}
