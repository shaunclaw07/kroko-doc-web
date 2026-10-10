import { describe, expect, it } from 'vitest';
import { LocalStorageRoundLog, STORAGE_KEY, type StorageLike } from './localStorageLog';
import { createRoundRecord } from '../../core/domain/sessionLog';

class FakeStorage implements StorageLike {
  readonly map = new Map<string, string>();
  failNextWrite = false;

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failNextWrite) {
      throw new Error('QuotaExceededError');
    }
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

const record = createRoundRecord({
  round: 1, playedAt: '2026-10-10T09:40:00.000Z', mode: 'original', teeth: 10, players: 1,
  loserTooth: 4, pressIndex: 3, liveCount: 2, pressOrder: [1, 2, 4],
});

describe('LocalStorageRoundLog', () => {
  it('legt Runden ab und liest sie wieder', () => {
    const storage = new FakeStorage();
    const log = new LocalStorageRoundLog(storage);
    log.save([record]);
    expect(storage.map.has(STORAGE_KEY)).toBe(true);
    expect(new LocalStorageRoundLog(storage).load()).toEqual([record]);
  });

  it('leert die Ablage', () => {
    const storage = new FakeStorage();
    const log = new LocalStorageRoundLog(storage);
    log.save([record]);
    log.clear();
    expect(storage.map.has(STORAGE_KEY)).toBe(false);
    expect(log.load()).toEqual([]);
  });

  it('überlebt kaputtes JSON ohne Ausnahme', () => {
    const storage = new FakeStorage();
    storage.map.set(STORAGE_KEY, '{kaputt');
    expect(new LocalStorageRoundLog(storage).load()).toEqual([]);
  });

  it('arbeitet ohne Storage weiter (privater Modus)', () => {
    const log = new LocalStorageRoundLog(null);
    log.save([record]);
    expect(log.load()).toEqual([record]);
  });

  it('behält Daten im Arbeitsspeicher, wenn das Schreiben scheitert', () => {
    const storage = new FakeStorage();
    storage.failNextWrite = true;
    const log = new LocalStorageRoundLog(storage);
    expect(() => log.save([record])).not.toThrow();
    expect(log.load()).toEqual([record]);
  });
});
