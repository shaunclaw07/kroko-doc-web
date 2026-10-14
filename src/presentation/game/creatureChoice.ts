import { DEFAULT_CREATURE_ID } from '../../core/domain/creature';
import type { GameSettings } from '../../core/domain/settings';

/**
 * Was ein Tipp auf eine Kachel der Tier-Auswahl an den Einstellungen ändert.
 *
 * Ein **anderes** Tier bringt sein eigenes Gebiss mit: die abweichende Zahnzahl fällt weg. Dasselbe
 * Tier erneut zu tippen ändert nichts (`null`) — vorher verwarf es die eingestellte Zahnzahl und
 * startete die laufende Runde neu (gemessen am 12.10.2026: 5 Zähne, ein Druck gespielt, Krokodil
 * erneut getippt → 10 Zähne, 0 Drücke).
 *
 * Ein **gesperrtes** Tier ändert ebenfalls nichts: `unlocked` nennt die offenen Tiere
 * (`core/domain/unlocks.ts`); fehlt die Liste, gilt jedes Tier als offen.
 */
export function settingsAfterCreatureChoice(
  current: GameSettings,
  chosen: string | undefined,
  unlocked?: readonly string[],
): GameSettings | null {
  if (!chosen || chosen === current.creature) {
    return null;
  }
  if (unlocked && !unlocked.includes(chosen)) {
    return null;
  }
  return { ...current, creature: chosen, teethOverride: null };
}

/**
 * Die Einstellungen beim Start: ein gespeichertes Tier, das (noch oder wieder) gesperrt ist, fällt
 * auf das Krokodil zurück — samt dessen Gebiss. Sonst bleibt alles, wie es war (dieselbe Referenz).
 */
export function settingsWithUnlockedCreature(current: GameSettings, unlocked: readonly string[]): GameSettings {
  if (unlocked.includes(current.creature)) {
    return current;
  }
  return { ...current, creature: DEFAULT_CREATURE_ID, teethOverride: null };
}
