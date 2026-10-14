import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type GameSettings } from '../../core/domain/settings';
import { createSettingsStore } from './settingsStore';

describe('settingsStore', () => {
  it('liefert den initialen Zustand über get()', () => {
    const store = createSettingsStore(DEFAULT_SETTINGS);
    expect(store.get()).toEqual(DEFAULT_SETTINGS);
  });

  it('set() aktualisiert den Zustand und benachrichtigt Zuhörer mit (next, previous)', () => {
    const store = createSettingsStore(DEFAULT_SETTINGS);
    const listener = vi.fn();
    store.subscribe(listener);

    const next: GameSettings = { ...DEFAULT_SETTINGS, sound: false };
    store.set(next);

    expect(store.get()).toEqual(next);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(next, DEFAULT_SETTINGS);
  });

  it('set() mit gleichem Inhalt meldet nichts', () => {
    const store = createSettingsStore(DEFAULT_SETTINGS);
    const listener = vi.fn();
    store.subscribe(listener);

    // Gleiche Werte, neue Objektreferenz
    store.set({ ...DEFAULT_SETTINGS });

    expect(listener).not.toHaveBeenCalled();
  });

  it('Abmelden entfernt den Zuhörer', () => {
    const store = createSettingsStore(DEFAULT_SETTINGS);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.set({ ...DEFAULT_SETTINGS, players: 2 });

    expect(listener).not.toHaveBeenCalled();
    expect(store.get().players).toBe(2);
  });
});
