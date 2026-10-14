import type { GameSettings } from '../../core/domain/settings';

export type SettingsListener = (next: GameSettings, previous: GameSettings) => void;

export interface SettingsStore {
  get(): GameSettings;
  set(next: GameSettings): void;
  subscribe(listener: SettingsListener): () => void;
}

/** Vergleicht zwei Einstellungsobjekte auf inhaltliche Gleichheit aller Felder. */
export function areSettingsEqual(a: GameSettings, b: GameSettings): boolean {
  return (
    a.mode === b.mode &&
    a.players === b.players &&
    a.sound === b.sound &&
    a.vibration === b.vibration &&
    a.creature === b.creature &&
    a.teethOverride === b.teethOverride
  );
}

/**
 * Speicher für Einstellungen mit Benachrichtigung bei Änderungen.
 * Zuhörer erhalten (next, previous); set() mit gleichem Inhalt meldet nichts.
 */
export function createSettingsStore(initial: GameSettings): SettingsStore {
  let current: GameSettings = { ...initial };
  const listeners = new Set<SettingsListener>();

  return {
    get(): GameSettings {
      return current;
    },
    set(next: GameSettings): void {
      if (areSettingsEqual(current, next)) {
        return;
      }
      const previous = current;
      current = { ...next };
      for (const listener of [...listeners]) {
        listener(current, previous);
      }
    },
    subscribe(listener: SettingsListener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
