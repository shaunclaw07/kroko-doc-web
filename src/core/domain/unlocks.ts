import type { AlbumPage } from './album';
import { getCreature } from './creature';

/**
 * Welche Tiere offen sind: **abgeleitet** aus den Sternen des Tier-Albums, also aus dem
 * Rundenprotokoll. Es gibt keinen eigenen Speicher — wer das Protokoll löscht, sperrt die Tiere
 * wieder, und eine Sicherung des Protokolls bringt die Freischaltungen von selbst mit.
 *
 * Die Währung ist die **Gesamtzahl** der Sterne, nicht die Zahl der Drei-Sterne-Tiere: der dritte
 * Stern ist reines Glück und selten (Krokodil 3,3 % je Runde). Keine Schwelle der Stammtiere und
 * auch nicht die Venusfliegenfalle braucht ihn — ein Kind soll nicht fünfzig Runden ohne
 * Fortschritt spielen. **Die eine, benannte Ausnahme ist der T-Rex** (`FINAL_GOAL`): er ist das
 * letzte Ziel und soll weit weg sein (vom Auftraggeber entschieden, 13.10.2026).
 */

/** Am Anfang offen, in der Reihenfolge der Auswahl. */
export const STARTING_CREATURES = ['crocodile', 'mouse', 'wolf'] as const;

export interface UnlockStep {
  /** Kennung aus dem Katalog. */
  creature: string;
  /** Ab so vielen Sternen insgesamt ist das Tier offen. */
  stars: number;
}

/**
 * Die Folge der übrigen Tiere. Fest, nicht wählbar: das Kind sieht am gesperrten Tier, was als
 * Nächstes kommt. Simuliert (20 000 Durchläufe, Modus „wie das Spielzeug", zufälliger Wechsel
 * zwischen den offenen Tieren): erstes neues Tier nach 3 Runden, alle offen nach 28 (Median).
 */
export const UNLOCK_STEPS: readonly UnlockStep[] = [
  { creature: 'shark', stars: 3 },
  { creature: 'panda', stars: 5 },
  { creature: 'human', stars: 7 },
  { creature: 'lion', stars: 9 },
  { creature: 'vampire', stars: 11 },
  { creature: 'panther', stars: 13 },
  { creature: 'sabertooth', stars: 15 },
  // Die zwei Bonusfiguren. Simuliert (5 000 Durchläufe, zufälliger Wechsel): die Venusfliegenfalle
  // nach 49 Runden, der T-Rex nach 181 (Median). 33 Sterne — „alle elf auf drei Sternen" — wären
  // 761 Runden gewesen, weil die letzten dritten Sterne an ganz bestimmten Tieren hängen.
  { creature: 'flytrap', stars: 20 },
  { creature: 'trex', stars: 28 },
];

/**
 * Das letzte Ziel: der einzige Schritt, dessen Schwelle dritte Sterne **braucht** (mindestens
 * sechs: 28 − 2 × 11 offene Wesen davor). Jeder andere Schritt ist ohne Glück beim letzten Zahn
 * erreichbar — der Test hält beides fest.
 */
export const FINAL_GOAL = 'trex';

/**
 * Reihenfolge der Tier-Auswahl: die Starttiere, dann die Folge. So steht das nächste Tier immer
 * gleich hinter den offenen — die Katalogreihenfolge würfelte offene und gesperrte durcheinander.
 */
export const UNLOCK_ORDER: readonly string[] = [...STARTING_CREATURES, ...UNLOCK_STEPS.map((step) => step.creature)];

export interface NextUnlock {
  creature: string;
  name: string;
  /** Die Schwelle des Tiers. */
  stars: number;
  /** Wie viele Sterne bis dahin fehlen (mindestens 1). */
  missing: number;
}

export interface UnlockState {
  /** Sterne aller Tiere zusammen — auch solcher, die heute gesperrt wären (alte Runden). */
  stars: number;
  /** Offene Tiere: die Starttiere, dann die Folge, soweit die Sterne reichen. */
  unlocked: readonly string[];
  /** Das nächste gesperrte Tier, oder `null`, wenn alle offen sind. */
  next: NextUnlock | null;
}

export function unlockState(pages: readonly AlbumPage[]): UnlockState {
  const stars = pages.reduce((sum, page) => sum + page.stars.length, 0);
  const reached = UNLOCK_STEPS.filter((step) => stars >= step.stars);
  const pending = UNLOCK_STEPS.find((step) => stars < step.stars);
  return {
    stars,
    unlocked: [...STARTING_CREATURES, ...reached.map((step) => step.creature)],
    next: pending
      ? {
          creature: pending.creature,
          name: getCreature(pending.creature).name,
          stars: pending.stars,
          missing: pending.stars - stars,
        }
      : null,
  };
}

/** Tiere, die in `after` offen sind und in `before` noch nicht — in der Reihenfolge der Folge. */
export function newlyUnlocked(before: UnlockState, after: UnlockState): { creature: string; name: string }[] {
  return after.unlocked
    .filter((creature) => !before.unlocked.includes(creature))
    .map((creature) => ({ creature, name: getCreature(creature).name }));
}
