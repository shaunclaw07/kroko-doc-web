import { describe, expect, it } from 'vitest';
import { playPress } from './playPress';
import { openRound } from '../domain/round';
import { DomainError } from '../domain/errors';
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
    const outcome = playPress({ state, tooth: 5, tension: 0.2, rng: new ScriptedRandom([0.9]) });
    expect(outcome.snapped).toBe(true);
    expect(outcome.drama.silenceMs).toBeGreaterThan(0);
    expect(outcome.state.loser?.tooth).toBe(5);
  });

  it('lässt harmlose Drücke ohne Totenstille durch — dort darf nur gezuckt werden', () => {
    const outcome = playPress({ state, tooth: 1, tension: 0.2, rng: new ScriptedRandom([0]) });
    expect(outcome.snapped).toBe(false);
    expect(outcome.drama.silenceMs).toBe(0);
    expect(outcome.drama.twitch).toBe(true);
    expect(outcome.state.status).toBe('open');
  });

  it('reicht Regelverstöße des Kerns weiter', () => {
    const after = playPress({ state, tooth: 1, tension: 0, rng: new ScriptedRandom([0.9]) }).state;
    expect(() => playPress({ state: after, tooth: 1, tension: 0, rng: new ScriptedRandom([0.9]) })).toThrow(DomainError);
  });
});
