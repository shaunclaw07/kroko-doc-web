import { describe, expect, it } from 'vitest';
import type { RoundRecord } from '../../core/domain/records';
import { createRoundRecord } from '../../core/domain/sessionLog';
import type { RemoteLogPort } from '../../core/ports/remoteLog';
import type { RoundLogPort } from '../../core/ports/roundLog';
import { backupNote, wireBackup, type BackupStatus } from './backupSync';

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

function memoryLog(initial: RoundRecord[]): RoundLogPort & { records(): RoundRecord[] } {
  let records = [...initial];
  return {
    records: () => records,
    load: () => [...records],
    save: (next) => { records = [...next]; },
    clear: () => { records = []; },
  };
}

/** Sicherung im Arbeitsspeicher; jede Antwort wartet einen Takt, wie ein echtes Netz. */
function memoryRemote(initial: RoundRecord[]) {
  let records = [...initial];
  let reachable = true;
  const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
  const port: RemoteLogPort = {
    pull: async () => {
      const answer = [...records];
      await tick();
      if (!reachable) throw new Error('offline');
      return answer;
    },
    push: async (next) => {
      await tick();
      if (!reachable) throw new Error('offline');
      records = [...next];
    },
  };
  return { port, records: () => records, setReachable: (value: boolean) => { reachable = value; } };
}

describe('wireBackup', () => {
  it('holt die Runden zurück und lässt die Anzeige nachziehen', async () => {
    const local = memoryLog([]);
    const remote = memoryRemote([round(1, 1), round(2, 2)]);
    const statuses: BackupStatus[] = [];
    let repaints = 0;
    const backup = wireBackup({
      local,
      remote: remote.port,
      onLocalChange: () => { repaints += 1; },
      onStatus: (status) => statuses.push(status),
    });
    await backup.sync();
    expect(local.records()).toHaveLength(2);
    expect(repaints).toBe(1);
    expect(statuses).toEqual([{ state: 'saved', rounds: 2 }]);
  });

  it('zieht die Anzeige nicht nach, wenn nur gesichert wurde', async () => {
    const local = memoryLog([round(1, 1)]);
    const remote = memoryRemote([]);
    let repaints = 0;
    await wireBackup({ local, remote: remote.port, onLocalChange: () => { repaints += 1; } }).sync();
    expect(remote.records()).toEqual([round(1, 1)]);
    expect(repaints).toBe(0);
  });

  it('lässt zwei Abgleiche nacheinander laufen — keine Runde geht verloren', async () => {
    const local = memoryLog([round(1, 1)]);
    const remote = memoryRemote([]);
    const backup = wireBackup({ local, remote: remote.port });
    const first = backup.sync();
    local.save([round(1, 1), round(2, 2)]);
    const second = backup.sync();
    await Promise.all([first, second]);
    expect(remote.records()).toEqual([round(1, 1), round(2, 2)]);
  });

  it('meldet einen Fehlschlag, wirft nicht, und holt beim nächsten Mal nach', async () => {
    const local = memoryLog([round(1, 1)]);
    const remote = memoryRemote([]);
    const statuses: BackupStatus[] = [];
    const backup = wireBackup({ local, remote: remote.port, onStatus: (status) => statuses.push(status) });
    remote.setReachable(false);
    await expect(backup.sync()).resolves.toBeUndefined();
    expect(local.records()).toEqual([round(1, 1)]);
    remote.setReachable(true);
    await backup.sync();
    expect(remote.records()).toEqual([round(1, 1)]);
    expect(statuses).toEqual([{ state: 'failed' }, { state: 'saved', rounds: 1 }]);
  });

  it('ersetzt die Sicherung beim Löschen, statt zusammenzuführen', async () => {
    const local = memoryLog([]);
    const remote = memoryRemote([round(1, 1), round(2, 2)]);
    const backup = wireBackup({ local, remote: remote.port });
    await backup.replace([]);
    await backup.sync();
    expect(remote.records()).toEqual([]);
    expect(local.records()).toEqual([]);
  });
});

describe('backupNote', () => {
  it('nennt die Zahl der gesicherten Runden mit ihrem Substantiv', () => {
    expect(backupNote({ state: 'saved', rounds: 0 })).toContain('0 Runden');
    expect(backupNote({ state: 'saved', rounds: 1 })).toContain('1 Runde liegt');
    expect(backupNote({ state: 'saved', rounds: 512 })).toContain('512 Runden');
  });

  it('sagt offen, wenn die Sicherung nicht erreichbar ist', () => {
    expect(backupNote({ state: 'failed' })).toContain('nicht erreichbar');
  });
});
