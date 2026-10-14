import { describe, expect, it, vi } from 'vitest';
import { createRoundRecorder } from './roundRecorder';
import { createLogFeed } from './logFeed';
import type { RoundRecord } from '../../contract/sessionLog';
import type { RoundLogPort } from '../../core/ports/roundLog';
import type { RoundState } from '../../core/domain/round';

class MemoryLog implements RoundLogPort {
  records: RoundRecord[] = [];
  saves = 0;
  load(): RoundRecord[] {
    return [...this.records];
  }
  save(records: readonly RoundRecord[]): void {
    this.records = [...records];
    this.saves += 1;
  }
  clear(): void {
    this.records = [];
  }
}

function makeRound(loser = true): RoundState {
  return {
    creatureId: 'crocodile',
    teeth: 10,
    mode: 'original',
    players: 1,
    status: loser ? 'snapped' : 'open',
    pressOrder: [1, 2, 3],
    liveTeethMin: 1,
    liveTeethMax: 3,
    live: [3],
    loser: loser
      ? {
          player: 1,
          tooth: 3,
          pressIndex: 3,
          liveCount: 1,
        }
      : null,
  };
}

describe('roundRecorder', () => {
  it('zählt anfängliche Runden aus dem Protokoll', () => {
    const log = new MemoryLog();
    const recorder = createRoundRecorder({ log });
    expect(recorder.count()).toBe(0);
    expect(recorder.records()).toEqual([]);
  });

  it('erzeugt und speichert Rundeneintrag mit Zeitstempel aus clock', () => {
    const log = new MemoryLog();
    const feed = createLogFeed();
    const listener = vi.fn();
    feed.subscribe(listener);

    const fixedTime = new Date('2026-10-14T10:00:00.000Z');
    const recorder = createRoundRecorder({
      log,
      feed,
      clock: () => fixedTime,
    });

    const record = recorder.record(makeRound(true));

    expect(record).not.toBeNull();
    expect(record?.round).toBe(1);
    expect(record?.playedAt).toBe('2026-10-14T10:00:00.000Z');
    expect(record?.loserTooth).toBe(3);
    expect(log.saves).toBe(1);
    expect(log.records).toHaveLength(1);
    expect(recorder.count()).toBe(1);
    expect(listener).toHaveBeenCalledWith('round-finished');
  });

  it('tut nichts, wenn die Runde keinen Verlierer hat', () => {
    const log = new MemoryLog();
    const feed = createLogFeed();
    const listener = vi.fn();
    feed.subscribe(listener);

    const recorder = createRoundRecorder({ log, feed });

    const record = recorder.record(makeRound(false));

    expect(record).toBeNull();
    expect(log.saves).toBe(0);
    expect(recorder.count()).toBe(0);
    expect(listener).not.toHaveBeenCalled();
  });

  it('liest vor dem Speichern neu ein (kein Überschreiben externer Änderungen)', () => {
    const log = new MemoryLog();
    const recorder = createRoundRecorder({ log });

    // Externer Tab fügt 2 Runden hinzu
    log.save([
      {
        round: 1,
        playedAt: '2026-10-14T09:00:00.000Z',
        mode: 'original',
        creature: 'crocodile',
        teeth: 10,
        players: 1,
        loserTooth: 2,
        pressIndex: 2,
        liveCount: 1,
        pressOrder: [1, 2],
      },
    ]);

    const record = recorder.record(makeRound(true));

    expect(record?.round).toBe(2);
    expect(log.records).toHaveLength(2);
    expect(recorder.count()).toBe(2);
  });

  it('aktualisiert den Stand bei sync()', () => {
    const log = new MemoryLog();
    const recorder = createRoundRecorder({ log });
    expect(recorder.count()).toBe(0);

    log.save([
      {
        round: 1,
        playedAt: '2026-10-14T09:00:00.000Z',
        mode: 'original',
        creature: 'crocodile',
        teeth: 10,
        players: 1,
        loserTooth: 2,
        pressIndex: 2,
        liveCount: 1,
        pressOrder: [1, 2],
      },
    ]);

    recorder.sync();
    expect(recorder.count()).toBe(1);
  });
});
