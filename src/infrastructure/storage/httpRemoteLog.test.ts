import { describe, expect, it } from 'vitest';
import { createRoundRecord } from '../../core/domain/sessionLog';
import { BACKUP_CODE_KEY, HttpRemoteLog, backupCode, backupUrl } from './httpRemoteLog';
import type { StorageLike } from './localStorageLog';

const CODE = 'kroko-abcd-efgh-2345';

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value); },
    removeItem: (key) => { data.delete(key); },
  };
}

const record = createRoundRecord({
  round: 1,
  playedAt: '2026-10-13T09:00:00.000Z',
  mode: 'original',
  teeth: 10,
  players: 1,
  loserTooth: 4,
  pressIndex: 3,
  liveCount: 2,
  pressOrder: [1, 2, 4],
});

/** Aufzeichnender Ersatz für `fetch`. */
function fetchWith(answer: () => Response) {
  const calls: { url: string; init?: RequestInit }[] = [];
  return {
    calls,
    fetch: async (url: string, init?: RequestInit) => { calls.push({ url, init }); return answer(); },
  };
}

describe('backupCode', () => {
  it('liest den Code aus der Adresse und merkt ihn sich', () => {
    const storage = memoryStorage();
    expect(backupCode(`?s=${CODE}`, storage)).toBe(CODE);
    expect(storage.data.get(BACKUP_CODE_KEY)).toBe(CODE);
  });

  it('gilt weiter, wenn die Adresse ihn nicht mehr trägt (Wechsel zur Statistik)', () => {
    expect(backupCode('', memoryStorage({ [BACKUP_CODE_KEY]: CODE }))).toBe(CODE);
  });

  it('gibt ohne Code nichts zurück — dann gibt es keine Sicherung', () => {
    expect(backupCode('', memoryStorage())).toBeNull();
    expect(backupCode('?x=1', null)).toBeNull();
  });

  it('weist ab, was kein Code ist, und legt es nicht ab', () => {
    const storage = memoryStorage();
    expect(backupCode('?s=kurz', storage)).toBeNull();
    expect(backupCode('?s=../../etwas/anderes', storage)).toBeNull();
    expect(backupCode('?s=GROSS-GESCHRIEBEN-1234', storage)).toBeNull();
    expect(storage.data.size).toBe(0);
    expect(backupCode('', memoryStorage({ [BACKUP_CODE_KEY]: '<script>' }))).toBeNull();
  });

  it('kommt mit einer gesperrten Ablage aus', () => {
    const locked: StorageLike = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => undefined,
    };
    expect(backupCode(`?s=${CODE}`, locked)).toBe(CODE);
    expect(backupCode('', locked)).toBeNull();
  });
});

describe('backupUrl', () => {
  it('hängt am Basis-Pfad der Seite', () => {
    expect(backupUrl('/', CODE)).toBe(`/api/log/${CODE}`);
    expect(backupUrl('/zahn_agent/', CODE)).toBe(`/zahn_agent/api/log/${CODE}`);
  });
});

describe('HttpRemoteLog', () => {
  it('holt die Liste und übergeht, was kein Protokolleintrag ist', async () => {
    const { calls, fetch } = fetchWith(() => new Response(JSON.stringify([record, { round: 'x' }, null])));
    expect(await new HttpRemoteLog('/api/log/x', fetch).pull()).toEqual([record]);
    expect(calls[0]?.url).toBe('/api/log/x');
    expect(calls[0]?.init?.cache).toBe('no-store');
  });

  it('wirft, wenn der Server den Code nicht kennt oder keine Liste schickt', async () => {
    const unknown = fetchWith(() => new Response('{"error":"not-found"}', { status: 404 }));
    await expect(new HttpRemoteLog('/api/log/x', unknown.fetch).pull()).rejects.toThrow('404');
    const noList = fetchWith(() => new Response('{"a":1}'));
    await expect(new HttpRemoteLog('/api/log/x', noList.fetch).pull()).rejects.toThrow('not a list');
  });

  it('schreibt die ganze Liste als JSON', async () => {
    const { calls, fetch } = fetchWith(() => new Response(null, { status: 204 }));
    await new HttpRemoteLog('/api/log/x', fetch).push([record]);
    expect(calls[0]?.init?.method).toBe('PUT');
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual([record]);
  });

  it('wirft, wenn das Schreiben abgelehnt wird', async () => {
    const { fetch } = fetchWith(() => new Response('{"error":"too-large"}', { status: 413 }));
    await expect(new HttpRemoteLog('/api/log/x', fetch).push([record])).rejects.toThrow('413');
  });
});
