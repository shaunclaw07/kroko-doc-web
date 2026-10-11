import { describe, expect, it } from 'vitest';
import { openRound, pressTooth, remainingTeeth, isFinalToothTension } from './round';
import { DomainError } from './errors';
import type { LiveTeethSelector } from '../ports/liveTeeth';
import { SeededRandom } from '../../infrastructure/testing/seededRandom';

/** Stellt eine feste Auswahl scharfer Zähne bereit — so ist der Verlierer vorhersagbar. */
class FixedLiveTeethSelector implements LiveTeethSelector {
  constructor(private readonly live: number[]) {}

  select(): number[] {
    return [...this.live];
  }
}

const config = { teeth: 10, mode: 'original' as const, players: 3 };
const deps = { rng: new SeededRandom(1), selector: new FixedLiveTeethSelector([4]) };

describe('openRound', () => {
  it('öffnet die Runde ohne gedrückte Zähne', () => {
    const round = openRound(config, deps);
    expect(round.status).toBe('open');
    expect(round.pressOrder).toEqual([]);
    expect(round.loser).toBeNull();
    expect(remainingTeeth(round)).toBe(10);
  });

  it('weist unsinnige Zahnzahlen ab', () => {
    expect(() => openRound({ ...config, teeth: 0 }, deps)).toThrow(DomainError);
    expect(() => openRound({ ...config, teeth: 2.5 }, deps)).toThrow(DomainError);
    expect(() => openRound({ ...config, players: 0 }, deps)).toThrow(DomainError);
  });

  it('spielt eine Runde mit einem einzigen Zahn: der erste Druck schnappt zu', () => {
    // Kleinstes Gebiss (Wunsch vom 11.10.2026): ein Zahn — und der Tipp darauf schließt das Maul.
    const single = { rng: new SeededRandom(2), selector: new FixedLiveTeethSelector([1]) };
    for (const mode of ['original', 'classic'] as const) {
      const round = openRound({ teeth: 1, mode, players: 1 }, single);
      expect(round.teeth).toBe(1);
      expect(remainingTeeth(round)).toBe(1);
      const pressed = pressTooth(round, 1);
      expect(pressed.status).toBe('snapped');
      expect(pressed.loser).toEqual({ tooth: 1, pressIndex: 1, player: 1, liveCount: 1 });
    }
  });
});

describe('pressTooth', () => {
  it('lässt einen harmlosen Zahn gedrückt stehen', () => {
    const round = pressTooth(openRound(config, deps), 1);
    expect(round.status).toBe('open');
    expect(round.pressOrder).toEqual([1]);
    expect(round.loser).toBeNull();
  });

  it('schnappt beim scharfen Zahn zu und nennt Zahn, Druck-Nummer und Verlierer', () => {
    let round = openRound(config, deps);
    round = pressTooth(round, 1);
    round = pressTooth(round, 2);
    round = pressTooth(round, 4); // scharf
    expect(round.status).toBe('snapped');
    expect(round.pressOrder).toEqual([1, 2, 4]);
    expect(round.loser).toEqual({ tooth: 4, pressIndex: 3, player: 3, liveCount: 1 });
  });

  it('schnappt auch beim allerersten Druck zu', () => {
    const round = pressTooth(openRound(config, deps), 4);
    expect(round.loser?.pressIndex).toBe(1);
    expect(round.loser?.player).toBe(1);
  });

  it('verteilt die Verliererposition reihum auf die Spieler', () => {
    const twoPlayers = { ...config, players: 2 };
    // Druck 1 -> Spieler 1, Druck 2 -> Spieler 2, Druck 3 -> wieder Spieler 1
    expect(pressTooth(openRound(twoPlayers, deps), 4).loser?.player).toBe(1);
    expect(pressTooth(pressTooth(openRound(twoPlayers, deps), 1), 4).loser?.player).toBe(2);
    expect(pressTooth(pressTooth(pressTooth(openRound(twoPlayers, deps), 1), 2), 4).loser?.player).toBe(1);
  });

  it('weist doppelte Drücke, fremde Zähne und Drücke nach dem Zuschnappen ab', () => {
    const round = pressTooth(openRound(config, deps), 1);
    expect(() => pressTooth(round, 1)).toThrowError(/already pressed/);
    expect(() => pressTooth(round, 11)).toThrowError(/out of range/);
    expect(() => pressTooth(round, 0)).toThrowError(/out of range/);
    const snapped = pressTooth(round, 4);
    expect(() => pressTooth(snapped, 5)).toThrowError(/finished/);
  });

  it('verändert den vorherigen Zustand nicht (unveränderliche Runde)', () => {
    const before = openRound(config, deps);
    pressTooth(before, 1);
    expect(before.pressOrder).toEqual([]);
  });
});

describe('Spannungsregeln', () => {
  it('meldet, wenn nur noch ein ungedrückter Zahn übrig ist (garantiert scharf)', () => {
    let round = openRound({ ...config, mode: 'classic' }, { ...deps, selector: new FixedLiveTeethSelector([10]) });
    for (let tooth = 1; tooth <= 8; tooth += 1) {
      expect(isFinalToothTension(round)).toBe(false);
      round = pressTooth(round, tooth);
    }
    expect(remainingTeeth(round)).toBe(2);
    expect(isFinalToothTension(round)).toBe(false);
    round = pressTooth(round, 9);
    expect(remainingTeeth(round)).toBe(1);
    expect(isFinalToothTension(round)).toBe(true);
    expect(() => pressTooth(round, 10)).not.toThrow();
  });
});

describe('Gebiss des Lebewesens', () => {
  const deps = () => ({ rng: new SeededRandom(1), selector: new FixedLiveTeethSelector([2]) });

  it('nimmt Zahnzahl und Grenzen aus dem Katalog, wenn nur das Lebewesen genannt ist', () => {
    const wolf = openRound({ creatureId: 'wolf', mode: 'original', players: 2 }, deps());
    expect(wolf.creatureId).toBe('wolf');
    expect(wolf.teeth).toBe(12);

    const crocodile = openRound({ mode: 'original', players: 2 }, deps());
    expect(crocodile.creatureId).toBe('crocodile');
    expect(crocodile.teeth).toBe(10);
  });

  it('reicht die Grenzen des Gebisses an die Auswahl weiter', () => {
    let seen: { min: number; max: number; teeth: number } | null = null;
    const spy: LiveTeethSelector = {
      select(request) {
        seen = { min: request.min, max: request.max, teeth: request.teeth };
        return [1];
      },
    };
    openRound({ creatureId: 'wolf', mode: 'original', players: 2 }, { rng: new SeededRandom(1), selector: spy });
    expect(seen).toEqual({ min: 1, max: 2, teeth: 12 });
  });

  it('wirft bei unbekanntem Lebewesen, statt still etwas anderes zu spielen', () => {
    expect(() => openRound({ creatureId: 'drache', mode: 'original', players: 2 }, deps())).toThrow(DomainError);
  });

  it('lässt eine abweichende Zahnzahl weiterhin zu (Tests, Sonderfälle)', () => {
    const custom = openRound({ creatureId: 'wolf', teeth: 6, mode: 'original', players: 1 }, deps());
    expect(custom.teeth).toBe(6);
    expect(custom.creatureId).toBe('wolf');
  });
});
