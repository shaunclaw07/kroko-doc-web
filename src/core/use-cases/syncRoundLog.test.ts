import { describe, expect, it } from 'vitest';
import type { RoundRecord } from '../domain/records';
import { createRoundRecord } from '../domain/sessionLog';
import type { RemoteLogPort } from '../ports/remoteLog';
import type { RoundLogPort } from '../ports/roundLog';
import { syncRoundLog } from './syncRoundLog';

function round(minute: number, number: number): RoundRecord {
  return createRoundRecord({
    round: number,
    playedAt: `2026-10-13T09:${String(minute).padStart(2, '0')}:00.000Z`,
    mode: 'original',
    teeth: 10,
    players: 1,
    loserTooth: 4,
    pressIndex: 3,
    liveCount: 2,
    pressOrder: [1, 2, 4],
  });
}

/** Ablage im Arbeitsspeicher, die ihre Schreibzugriffe zählt. */
function memoryLog(initial: RoundRecord[]) {
  let records = [...initial];
  let saves = 0;
  const port: RoundLogPort = {
    load: () => [...records],
    save: (next) => { records = [...next]; saves += 1; },
    clear: () => { records = []; },
  };
  return { port, records: () => records, saves: () => saves };
}

/** Sicherung im Arbeitsspeicher; `beforeAnswer` läuft, während der Abruf noch unterwegs ist. */
function memoryRemote(initial: RoundRecord[], beforeAnswer: () => void = () => undefined) {
  let records = [...initial];
  const pushes: RoundRecord[][] = [];
  const port: RemoteLogPort = {
    pull: async () => {
      const answer = [...records];
      beforeAnswer();
      return answer;
    },
    push: async (next) => { records = [...next]; pushes.push([...next]); },
  };
  return { port, records: () => records, pushes };
}

describe('syncRoundLog', () => {
  it('holt die Runden zurück, wenn das Gerät leer ist (geleertes Profil)', async () => {
    const local = memoryLog([]);
    const remote = memoryRemote([round(1, 1), round(2, 2)]);
    expect(await syncRoundLog(local.port, remote.port)).toEqual({ rounds: 2, localChanged: true });
    expect(local.records()).toEqual([round(1, 1), round(2, 2)]);
    expect(remote.pushes).toHaveLength(0);
  });

  it('sichert eine neue Runde und lässt das Gerät unberührt', async () => {
    const local = memoryLog([round(1, 1), round(2, 2)]);
    const remote = memoryRemote([round(1, 1)]);
    expect(await syncRoundLog(local.port, remote.port)).toEqual({ rounds: 2, localChanged: false });
    expect(local.saves()).toBe(0);
    expect(remote.records()).toEqual([round(1, 1), round(2, 2)]);
  });

  it('schreibt nirgends, wenn beide Seiten gleich sind', async () => {
    const local = memoryLog([round(1, 1)]);
    const remote = memoryRemote([round(1, 1)]);
    expect(await syncRoundLog(local.port, remote.port)).toEqual({ rounds: 1, localChanged: false });
    expect(local.saves()).toBe(0);
    expect(remote.pushes).toHaveLength(0);
  });

  it('verliert keine Runde, die während des Abrufs zu Ende geht', async () => {
    const local = memoryLog([]);
    const remote = memoryRemote([round(1, 1)], () => local.port.save([round(9, 1)]));
    await syncRoundLog(local.port, remote.port);
    expect(local.records().map((entry) => entry.playedAt.slice(14, 16))).toEqual(['01', '09']);
    expect(remote.records()).toEqual(local.records());
  });

  it('rührt das Gerät nicht an, wenn die Sicherung nicht antwortet', async () => {
    const local = memoryLog([round(1, 1)]);
    const remote: RemoteLogPort = {
      pull: () => Promise.reject(new Error('offline')),
      push: () => Promise.reject(new Error('offline')),
    };
    await expect(syncRoundLog(local.port, remote)).rejects.toThrow('offline');
    expect(local.records()).toEqual([round(1, 1)]);
    expect(local.saves()).toBe(0);
  });
});
