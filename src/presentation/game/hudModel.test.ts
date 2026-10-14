import { describe, expect, it } from 'vitest';
import { hudModel } from './hudModel';
import { openRound, type RoundState } from '../../core/domain/round';
import { ScriptedRandom } from '../../infrastructure/testing/scriptedRandom';
import type { LiveTeethSelector } from '../../core/ports/liveTeeth';

class FixedSelector implements LiveTeethSelector {
  constructor(private readonly live: number[]) {}
  select(): number[] {
    return [...this.live];
  }
}

function makeRound(
  overrides: {
    teeth?: number;
    players?: number;
    pressOrder?: number[];
    status?: 'open' | 'snapped';
    live?: number[];
  } = {},
): RoundState {
  const round = openRound(
    {
      creatureId: 'crocodile',
      teeth: overrides.teeth ?? 10,
      mode: 'original',
      players: overrides.players ?? 1,
    },
    {
      rng: new ScriptedRandom([0.5]),
      selector: new FixedSelector(overrides.live ?? [10]),
    },
  );
  return {
    ...round,
    pressOrder: overrides.pressOrder ?? round.pressOrder,
    status: overrides.status ?? round.status,
  };
}

describe('hudModel', () => {
  it('zeigt vor dem ersten Druck keine 0 % Bissgefahr', () => {
    const round = makeRound({ teeth: 10 });
    const model = hudModel({ round, roundNumber: 1 });

    expect(model.progressText).toBe('0 von 10 gedrückt');
    expect(model.tensionText).not.toBe('Bissgefahr 0 %');
    expect(model.tensionText).toBe('Bissgefahr 20 %');
    expect(model.howToVisible).toBe(true);
    expect(model.meterPercent).toBe(0);
    expect(model.roundOpen).toBe(true);
  });

  it('zeigt bei geschlossenem Maul keine Gefahr („Runde beendet“)', () => {
    const round = makeRound({
      teeth: 10,
      pressOrder: [1, 2, 3],
      status: 'snapped',
    });
    const model = hudModel({ round, tension: 1, roundNumber: 2 });

    expect(model.tensionText).toBe('Runde beendet');
    expect(model.turnSentence).toBe('Maul zu');
    expect(model.roundOpen).toBe(false);
    expect(model.howToVisible).toBe(false);
    expect(model.zoom).toBe(0);
    expect(model.tense).toBe(false);
    expect(model.danger).toBe(false);
  });

  it('nutzt Einzahl, wenn nur noch ein Zahn übrig ist', () => {
    const round = makeRound({
      teeth: 10,
      pressOrder: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    });
    const model = hudModel({ round, roundNumber: 1 });

    expect(model.remaining).toBe(1);
    expect(model.remainingLabel).toBe('Zahn übrig');
    expect(model.finalToothWarning).toBe(true);
    // Bei finalTooth ist die allgemeine Anleitung ausgeblendet
    expect(model.howToVisible).toBe(false);
  });

  it('nutzt Mehrzahl, wenn mehrere Zähne übrig sind', () => {
    const round = makeRound({
      teeth: 10,
      pressOrder: [1, 2],
    });
    const model = hudModel({ round, roundNumber: 1 });

    expect(model.remaining).toBe(8);
    expect(model.remainingLabel).toBe('Zähne übrig');
    expect(model.finalToothWarning).toBe(false);
    // Nach dem ersten Druck ist howTo nicht mehr sichtbar
    expect(model.howToVisible).toBe(false);
  });

  it('wechselt bei mehreren Spielern reihum die Zugzeile', () => {
    const roundP1 = makeRound({ teeth: 10, players: 3, pressOrder: [] });
    expect(hudModel({ round: roundP1, roundNumber: 1 }).turnSentence).toBe('Spieler 1 ist dran');

    const roundP2 = makeRound({ teeth: 10, players: 3, pressOrder: [1] });
    expect(hudModel({ round: roundP2, roundNumber: 1 }).turnSentence).toBe('Spieler 2 ist dran');

    const roundP3 = makeRound({ teeth: 10, players: 3, pressOrder: [1, 2] });
    expect(hudModel({ round: roundP3, roundNumber: 1 }).turnSentence).toBe('Spieler 3 ist dran');

    const roundP1Again = makeRound({ teeth: 10, players: 3, pressOrder: [1, 2, 3] });
    expect(hudModel({ round: roundP1Again, roundNumber: 1 }).turnSentence).toBe('Spieler 1 ist dran');
  });

  it('berechnet Zoom, Puls und Gefahrenklassen bei hoher Gefahr', () => {
    // 9 von 10 gedrückt: Gefahr ist 1.0 (100 %)
    const round = makeRound({
      teeth: 10,
      pressOrder: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    });
    const model = hudModel({ round, roundNumber: 1 });

    expect(model.danger).toBe(true);
    expect(model.tense).toBe(true);
    expect(model.zoom).toBeGreaterThan(0);
    expect(model.beatMs).toBeLessThan(1000);
  });
});
