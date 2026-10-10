import { describe, expect, it } from 'vitest';
import { playPress } from './playPress';
import { openRound } from '../domain/round';
import { DomainError } from '../domain/errors';
import { BEAT_MIN_MS } from '../domain/tension';
import { SeededRandom } from '../../infrastructure/testing/seededRandom';
import { ScriptedRandom } from '../../infrastructure/testing/scriptedRandom';
import type { LiveTeethSelector } from '../ports/liveTeeth';

class FixedLiveTeethSelector implements LiveTeethSelector {
  constructor(private readonly live: number[]) {}
  select(): number[] {
    return [...this.live];
  }
}

const state = openRound(
  { teeth: 10, mode: 'original', players: 2 },
  { rng: new SeededRandom(2), selector: new FixedLiveTeethSelector([5]) },
);

describe('playPress', () => {
  it('kündigt den Biss an, obwohl die Bedienung die scharfen Zähne nicht kennt', () => {
    const outcome = playPress({ state, tooth: 5, rng: new ScriptedRandom([0.9]) });
    expect(outcome.snapped).toBe(true);
    expect(outcome.drama.beatMs).toBeGreaterThan(0);
    // Beim Biss gibt es keine Erleichterung — aber dieselbe Pause wie sonst auch.
    expect(outcome.drama.reliefLevel).toBe(0);
    expect(outcome.state.loser?.tooth).toBe(5);
  });

  it('gibt auch dem harmlosen Druck eine Pause — dort darf nur gezuckt werden', () => {
    const outcome = playPress({ state, tooth: 1, rng: new ScriptedRandom([0]) });
    expect(outcome.snapped).toBe(false);
    // Die Pause kommt bei jedem Druck; ihre Länge ist kein Signal für den Ausgang.
    expect(outcome.drama.beatMs).toBe(BEAT_MIN_MS);
    expect(outcome.drama.twitch).toBe(true);
    expect(outcome.state.status).toBe('open');
  });

  it('reicht Regelverstöße des Kerns weiter', () => {
    const after = playPress({ state, tooth: 1, rng: new ScriptedRandom([0.9]) }).state;
    expect(() => playPress({ state: after, tooth: 1, rng: new ScriptedRandom([0.9]) })).toThrow(DomainError);
  });
});
