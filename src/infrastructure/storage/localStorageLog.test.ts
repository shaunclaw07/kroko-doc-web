import { describe, expect, it } from 'vitest';
import {
  LEGACY_STORAGE_KEY,
  LEGACY_STORAGE_KEYS,
  LocalStorageRoundLog,
  STORAGE_KEY,
  type StorageLike,
} from './localStorageLog';
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

  it('übergeht Einträge, die kein Protokolleintrag sind', () => {
    const storage = new FakeStorage();
    storage.map.set(STORAGE_KEY, JSON.stringify([null, record, { ...record, teeth: 1000000000 }, 'x']));
    expect(new LocalStorageRoundLog(storage).load()).toEqual([record]);
  });

  it('übernimmt Runden der früheren Fassung unter dem neuen Schlüssel', () => {
    const storage = new FakeStorage();
    storage.map.set(LEGACY_STORAGE_KEY, JSON.stringify([record]));
    expect(new LocalStorageRoundLog(storage).load()).toEqual([record]);
    // einmal übernommen, danach liegt alles unter dem neuen Namen
    expect(storage.map.has(STORAGE_KEY)).toBe(true);
  });

  it('holt Runden auch aus der ältesten Fassung (Kette der früheren Namen)', () => {
    const storage = new FakeStorage();
    storage.map.set(LEGACY_STORAGE_KEYS[1], JSON.stringify([record]));
    expect(new LocalStorageRoundLog(storage).load()).toEqual([record]);
    expect(storage.map.has(STORAGE_KEY)).toBe(true);
  });

  it('nimmt bei mehreren früheren Fassungen die jüngere', () => {
    const storage = new FakeStorage();
    const juenger = createRoundRecord({
      round: 7, playedAt: '2026-10-11T00:10:00.000Z', mode: 'classic', teeth: 12, players: 1,
      loserTooth: 2, pressIndex: 1, liveCount: 1, pressOrder: [2],
    });
    storage.map.set(LEGACY_STORAGE_KEYS[0], JSON.stringify([juenger]));
    storage.map.set(LEGACY_STORAGE_KEYS[1], JSON.stringify([record]));
    expect(new LocalStorageRoundLog(storage).load()).toEqual([juenger]);
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

  it('behält die Runden der Sitzung, wenn das Schreiben über einem älteren Stand scheitert', () => {
    // Volle Ablage: der alte Stand liegt noch dort. Wer danach wieder aus der Ablage liest, verlöre
    // jede Runde seit dem Fehlschlag — die Steuerung liest vor jedem Anhängen.
    const storage = new FakeStorage();
    const log = new LocalStorageRoundLog(storage);
    log.save([record]);
    storage.failNextWrite = true;
    const zweite = { ...record, round: 2 };
    log.save([record, zweite]);
    expect(log.load()).toEqual([record, zweite]);
    // Klappt das Schreiben wieder, gilt wieder die Ablage (ein anderer Tab darf sie ändern).
    storage.failNextWrite = false;
    log.save([record, zweite]);
    storage.map.set(STORAGE_KEY, JSON.stringify([record]));
    expect(log.load()).toEqual([record]);
  });

  it('leert auch die früheren Fassungen — gelöschte Runden kommen nicht zurück', () => {
    const storage = new FakeStorage();
    storage.map.set(LEGACY_STORAGE_KEYS[0], JSON.stringify([record]));
    storage.map.set(LEGACY_STORAGE_KEYS[1], JSON.stringify([record]));
    const log = new LocalStorageRoundLog(storage);
    expect(log.load()).toEqual([record]);
    log.clear();
    expect(log.load()).toEqual([]);
    expect(new LocalStorageRoundLog(storage).load()).toEqual([]);
  });
});
