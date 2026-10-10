import { describe, expect, it } from 'vitest';
import { MAX_TEETH, MIN_TEETH } from '../../core/domain/teeth';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type StorageLike } from './localStorageSettings';

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
    for (const bad of [3, MAX_TEETH + 1, 7.5, Number.NaN]) {
      storage.setItem('kroko-doc-web:settings:v1', JSON.stringify({ ...DEFAULT_SETTINGS, teethOverride: bad }));
      expect(loadSettings(storage).teethOverride, String(bad)).toBeNull();
    }
  });

  it('nimmt die äußersten erlaubten Zahnzahlen an', () => {
    const storage = new MemoryStorage();
    for (const good of [MIN_TEETH, MAX_TEETH]) {
      storage.setItem('kroko-doc-web:settings:v1', JSON.stringify({ ...DEFAULT_SETTINGS, teethOverride: good }));
      expect(loadSettings(storage).teethOverride, String(good)).toBe(good);
    }
  });

  it('macht aus einem unbekannten Lebewesen das Krokodil', () => {
    const storage = new MemoryStorage();
    storage.setItem('kroko-doc-web:settings:v1', JSON.stringify({ ...DEFAULT_SETTINGS, creature: 'drache' }));
    expect(loadSettings(storage).creature).toBe('crocodile');
  });
});
