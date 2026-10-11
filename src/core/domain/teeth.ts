/** Zahn-Nummern sind 1-basiert (Zahn 1 ... Zahn n). */
export type ToothId = number;

/**
 * Zufallsmodell des Spiels:
 *  - `original`: beim Öffnen werden 1 bis 3 Zähne gleichzeitig scharf gestellt
 *    (so arbeitet das Original, make Magazin 1/2023).
 *  - `classic`: genau ein Zahn von n ist scharf.
 */
export type RandomMode = 'original' | 'classic';

export const DEFAULT_TEETH = 10;
/**
 * Kleinstes spielbares Gebiss: **ein einziger Zahn**. Wunsch vom 11.10.2026 („Mein Sohn freut sich,
 * wenn nur ein Zahn da ist und beim Tap das Maul schließt"). Bei einem Zahn kappt die Auswahl der
 * scharfen Zähne ihre Grenzen auf die Zahnzahl (siehe liveTeeth.ts) — dieser eine Zahn ist damit in
 * **beiden** Zufallsmodellen scharf, und der erste Tipp schnappt zu. Eine untere Schranke darüber
 * hinaus gibt es nicht: je weniger Zähne, desto größer die Trefferfläche — also genau das Gegenteil
 * der gemessenen Obergrenze unten.
 */
export const MIN_TEETH = 1;
/**
 * Obergrenze drückbarer Zähne. Sie ist gemessen, nicht geschätzt: die Trefferfläche
 * eines Zahns muss auf einem 358 px breiten Handy mindestens 44 × 44 CSS-Pixel groß sein
 * (Richtwert für Finger). Die Zähne sitzen auf einem Ring um das ganze Maul; aus dessen
 * Umfang folgt, wie viele Zähne sich diese Größe teilen können.
 * Bei 12 Zähnen sind es 51–63 px, bei 16 nur noch 38 px — deshalb Schluss bei 12.
 * Der Test in creatureViews.test.ts rechnet das für jedes Lebewesen nach.
 */
export const MAX_TEETH = 12;
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
