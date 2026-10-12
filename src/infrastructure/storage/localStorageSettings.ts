import { DEFAULT_CREATURE_ID, isKnownCreature } from '../../core/domain/creature';
import {
  DEFAULT_MODE,
  DEFAULT_PLAYERS,
  MAX_SELECTABLE_PLAYERS,
  isValidToothCount,
  type RandomMode,
} from '../../core/domain/teeth';
import type { StorageLike } from './localStorageLog';

export type { StorageLike };

export const SETTINGS_KEY = 'zahn_agent:settings:v1';
/** Schlüssel der früheren Fassungen, jüngster zuerst (siehe localStorageLog). */
export const LEGACY_SETTINGS_KEYS = ['zahn-agent:settings:v1', 'kroko-doc-web:settings:v1'] as const;
/** Nur der jüngste frühere Schlüssel (Tests, Doku). */
export const LEGACY_SETTINGS_KEY: string = LEGACY_SETTINGS_KEYS[0];

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

export function loadSettings(storage: StorageLike | null): GameSettings {
  if (!storage) {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    let raw = storage.getItem(SETTINGS_KEY);
    if (!raw) {
      // Einmalige Übernahme der Einstellungen aus einer früheren Fassung.
      for (const key of LEGACY_SETTINGS_KEYS) {
        const older = storage.getItem(key);
        if (older) {
          raw = older;
          storage.setItem(SETTINGS_KEY, older);
          break;
        }
      }
    }
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return { ...DEFAULT_SETTINGS };
    }
    const candidate = parsed as Partial<GameSettings>;
    const players = Number.isInteger(candidate.players) ? Number(candidate.players) : DEFAULT_SETTINGS.players;
    return {
      mode: candidate.mode === 'classic' || candidate.mode === 'original' ? candidate.mode : DEFAULT_MODE,
      players: Math.min(MAX_SELECTABLE_PLAYERS, Math.max(1, players)),
      sound: candidate.sound !== false,
      vibration: candidate.vibration !== false,
      // Ein unbekanntes Lebewesen (alte Fassung, Tippfehler) wird zum Krokodil.
      creature: isKnownCreature(String(candidate.creature ?? ''))
        ? String(candidate.creature)
        : DEFAULT_CREATURE_ID,
      // Nur gültige Zahnzahlen übernehmen; alles andere fällt auf den Tier-Standard zurück.
      teethOverride:
        typeof candidate.teethOverride === 'number' && isValidToothCount(candidate.teethOverride)
          ? candidate.teethOverride
          : null,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(storage: StorageLike | null, settings: GameSettings): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Nicht speichern zu können darf das Spiel nicht aufhalten.
  }
}
