import { DEFAULT_MODE, DEFAULT_PLAYERS, type RandomMode } from '../../core/domain/teeth';
import type { StorageLike } from './localStorageLog';

export const SETTINGS_KEY = 'kroko-doc-web:settings:v1';

export interface GameSettings {
  mode: RandomMode;
  players: number;
  sound: boolean;
  vibration: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  mode: DEFAULT_MODE,
  players: DEFAULT_PLAYERS,
  sound: true,
  vibration: true,
};

export function loadSettings(storage: StorageLike | null): GameSettings {
  if (!storage) {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const raw = storage.getItem(SETTINGS_KEY);
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
      players: Math.min(4, Math.max(1, players)),
      sound: candidate.sound !== false,
      vibration: candidate.vibration !== false,
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
