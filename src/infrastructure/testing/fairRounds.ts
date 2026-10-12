import { UniformLiveTeethSelector } from '../../core/domain/liveTeeth';
import type { RoundRecord } from '../../core/domain/records';
import { openRound, pressTooth } from '../../core/domain/round';
import type { RandomMode } from '../../core/domain/teeth';
import type { RandomSource } from '../../core/ports/random';

/**
 * Spielt faire Runden mit den echten Regeln des Kerns: scharfe Zähne aus der Standardauswahl,
 * gedrückt wird in zufälliger Reihenfolge bis zum Biss. Für Tests der Statistik — wer prüfen will,
 * ob eine Auswertung faire Daten zu Unrecht „auffällig" nennt, braucht faire Daten.
 */
export function fairRounds(
  rng: RandomSource,
  creature: string,
  count: number,
  firstRound = 1,
  teeth?: number,
  mode: RandomMode = 'original',
): RoundRecord[] {
  const selector = new UniformLiveTeethSelector();
  const records: RoundRecord[] = [];
  for (let index = 0; index < count; index += 1) {
    let state = openRound({ creatureId: creature, teeth, mode, players: 1 }, { rng, selector });
    const order = Array.from({ length: state.teeth }, (_, step) => step + 1);
    for (let last = order.length - 1; last > 0; last -= 1) {
      const pick = rng.uniformInt(last + 1);
      const swap = order[last] ?? 0;
      order[last] = order[pick] ?? 0;
      order[pick] = swap;
    }
    for (const tooth of order) {
      state = pressTooth(state, tooth);
      if (state.status === 'snapped') {
        break;
      }
    }
    records.push({
      round: firstRound + index,
      playedAt: '2026-10-12T09:00:00.000Z',
      creature,
      teeth: state.teeth,
      mode,
      players: 1,
      loserTooth: state.loser?.tooth ?? 0,
      pressIndex: state.loser?.pressIndex ?? 0,
      liveCount: state.live.length,
      pressOrder: [...state.pressOrder],
    });
  }
  return records;
}
