import type { GameSettings } from '../../infrastructure/storage/localStorageSettings';

/**
 * Was ein Tipp auf eine Kachel der Tier-Auswahl an den Einstellungen ändert.
 *
 * Ein **anderes** Tier bringt sein eigenes Gebiss mit: die abweichende Zahnzahl fällt weg. Dasselbe
 * Tier erneut zu tippen ändert nichts (`null`) — vorher verwarf es die eingestellte Zahnzahl und
 * startete die laufende Runde neu (gemessen am 12.10.2026: 5 Zähne, ein Druck gespielt, Krokodil
 * erneut getippt → 10 Zähne, 0 Drücke).
 */
export function settingsAfterCreatureChoice(
  current: GameSettings,
  chosen: string | undefined,
): GameSettings | null {
  if (!chosen || chosen === current.creature) {
    return null;
  }
  return { ...current, creature: chosen, teethOverride: null };
}
