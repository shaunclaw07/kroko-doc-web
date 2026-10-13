import { describe, expect, it } from 'vitest';
import { settingsAfterCreatureChoice, settingsWithUnlockedCreature } from './creatureChoice';
import type { GameSettings } from '../../infrastructure/storage/localStorageSettings';

const CURRENT: GameSettings = {
  mode: 'original',
  players: 2,
  sound: true,
  vibration: false,
  creature: 'crocodile',
  teethOverride: 5,
};

describe('settingsAfterCreatureChoice', () => {
  it('ändert nichts, wenn dasselbe Tier erneut getippt wird — die eigene Zahnzahl bleibt', () => {
    expect(settingsAfterCreatureChoice(CURRENT, 'crocodile')).toBeNull();
  });

  it('nimmt beim Wechsel das Gebiss des neuen Tiers und lässt alles andere stehen', () => {
    expect(settingsAfterCreatureChoice(CURRENT, 'wolf')).toEqual({
      ...CURRENT,
      creature: 'wolf',
      teethOverride: null,
    });
  });

  it('ändert nichts, wenn die Kachel keine Kennung trägt', () => {
    expect(settingsAfterCreatureChoice(CURRENT, undefined)).toBeNull();
    expect(settingsAfterCreatureChoice(CURRENT, '')).toBeNull();
  });

  it('wählt kein gesperrtes Tier — ein offenes schon', () => {
    expect(settingsAfterCreatureChoice(CURRENT, 'shark', ['crocodile', 'mouse', 'wolf'])).toBeNull();
    expect(settingsAfterCreatureChoice(CURRENT, 'wolf', ['crocodile', 'mouse', 'wolf'])?.creature).toBe('wolf');
  });
});

describe('settingsWithUnlockedCreature', () => {
  it('lässt die Einstellungen stehen, wenn das gespeicherte Tier offen ist', () => {
    expect(settingsWithUnlockedCreature(CURRENT, ['crocodile', 'mouse', 'wolf'])).toBe(CURRENT);
  });

  it('fällt auf das Krokodil mit dessen Gebiss zurück, wenn das gespeicherte Tier gesperrt ist', () => {
    const saved: GameSettings = { ...CURRENT, creature: 'shark', teethOverride: 4 };
    expect(settingsWithUnlockedCreature(saved, ['crocodile', 'mouse', 'wolf'])).toEqual({
      ...CURRENT,
      creature: 'crocodile',
      teethOverride: null,
    });
  });
});
