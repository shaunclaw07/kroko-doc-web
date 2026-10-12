import { describe, expect, it } from 'vitest';
import { settingsAfterCreatureChoice } from './creatureChoice';
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
});
