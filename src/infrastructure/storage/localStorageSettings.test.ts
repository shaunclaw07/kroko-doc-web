import { describe, expect, it } from 'vitest';
import { MAX_TEETH, MIN_TEETH } from '../../core/domain/teeth';
import {
  DEFAULT_SETTINGS,
  LEGACY_SETTINGS_KEY,
  LEGACY_SETTINGS_KEYS,
  SETTINGS_KEY,
  loadSettings,
  saveSettings,
  type StorageLike,
} from './localStorageSettings';

class MemoryStorage implements StorageLike {
  private readonly map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

describe('Einstellungen', () => {
  it('liefert ohne Speicher die Voreinstellungen (Krokodil, Zahnzahl vom Tier)', () => {
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.teethOverride).toBeNull();
    expect(DEFAULT_SETTINGS.creature).toBe('crocodile');
  });

  it('speichert und liest Lebewesen und Zahnzahl', () => {
    const storage = new MemoryStorage();
    saveSettings(storage, { ...DEFAULT_SETTINGS, creature: 'wolf', teethOverride: 12 });
    const back = loadSettings(storage);
    expect(back.creature).toBe('wolf');
    expect(back.teethOverride).toBe(12);
  });

  it('verwirft eine unmögliche Zahnzahl und nimmt dann den Tier-Standard', () => {
    const storage = new MemoryStorage();
    // Alles von MIN_TEETH (1) bis MAX_TEETH (12) ist erlaubt — unmöglich ist darunter/darüber.
    for (const bad of [MIN_TEETH - 1, MAX_TEETH + 1, 7.5, Number.NaN]) {
      storage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, teethOverride: bad }));
      expect(loadSettings(storage).teethOverride, String(bad)).toBeNull();
    }
  });

  it('nimmt die äußersten erlaubten Zahnzahlen an', () => {
    const storage = new MemoryStorage();
    for (const good of [MIN_TEETH, MAX_TEETH]) {
      storage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, teethOverride: good }));
      expect(loadSettings(storage).teethOverride, String(good)).toBe(good);
    }
  });

  it('nimmt ein einziges Gebiss an — 1 Zahn ist erlaubt (Wunsch vom 11.10.2026)', () => {
    const storage = new MemoryStorage();
    saveSettings(storage, { ...DEFAULT_SETTINGS, teethOverride: 1 });
    expect(loadSettings(storage).teethOverride).toBe(1);
  });

  it('übernimmt die Einstellungen der früheren Fassung unter dem neuen Schlüssel', () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, creature: 'wolf', teethOverride: 6 }));
    const back = loadSettings(storage);
    expect(back.creature).toBe('wolf');
    expect(back.teethOverride).toBe(6);
    // und legt sie unter dem neuen Namen ab, damit sie nicht nochmal gelesen werden müssen
    expect(storage.getItem(SETTINGS_KEY)).not.toBeNull();
  });

  it('holt Einstellungen auch aus der ältesten Fassung', () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_SETTINGS_KEYS[1], JSON.stringify({ ...DEFAULT_SETTINGS, players: 3 }));
    // Gespeichert sind 3, gelesen werden 2: die Bedienung bietet nur noch 1 und 2 (12.10.2026).
    expect(loadSettings(storage).players).toBe(2);
    expect(storage.getItem(SETTINGS_KEY)).not.toBeNull();
  });

  it('begrenzt eine gespeicherte Spielerzahl von 3 oder 4 auf 2 — die Bedienung bietet nur noch 1 und 2', () => {
    for (const players of [3, 4]) {
      const storage = new MemoryStorage();
      storage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, players }));
      expect(loadSettings(storage).players).toBe(2);
    }
  });

  it('macht aus einem unbekannten Lebewesen das Krokodil', () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, creature: 'drache' }));
    expect(loadSettings(storage).creature).toBe('crocodile');
  });
});
