// @vitest-environment node
import { describe, expect, it } from 'vitest';
import worker, { MAX_BODY_BYTES } from '../worker/backup.js';

/**
 * Sonde für die Sicherung: lädt `worker/backup.js` — die Datei, die unverändert bei Cloudflare
 * läuft — gegen eine nachgestellte Datenbank. Ob der ausgelieferte Worker antwortet, zeigt nur ein
 * Abruf der echten Adresse.
 */

const CODE = 'kroko-abcd-efgh-2345';
const SITE = 'https://beispiel.test';

/** D1 in klein: kennt genau die zwei Anweisungen des Workers. */
function fakeEnv(rows: Record<string, string>) {
  const logs = new Map(Object.entries(rows));
  return {
    logs,
    DB: {
      prepare: (sql: string) => ({
        bind: (...values: string[]) => ({
          first: async () => {
            const body = logs.get(values[0] ?? '');
            return body === undefined ? null : { body };
          },
          run: async () => {
            if (!sql.startsWith('UPDATE')) throw new Error(`unexpected statement: ${sql}`);
            logs.set(values[2] ?? '', values[0] ?? '');
          },
        }),
      }),
    },
  };
}

function call(env: ReturnType<typeof fakeEnv>, path: string, init?: RequestInit): Promise<Response> {
  return worker.fetch(new Request(SITE + path, init), env);
}

describe('Sicherungs-Worker', () => {
  it('liefert das Protokoll eines bekannten Codes, ohne dass es zwischengespeichert wird', async () => {
    const response = await call(fakeEnv({ [CODE]: '[{"round":1}]' }), `/api/log/${CODE}`);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual([{ round: 1 }]);
  });

  it('ersetzt das Protokoll eines bekannten Codes', async () => {
    const env = fakeEnv({ [CODE]: '[]' });
    const response = await call(env, `/api/log/${CODE}`, { method: 'PUT', body: '[{"round":1},{"round":2}]' });
    expect(response.status).toBe(204);
    expect(env.logs.get(CODE)).toBe('[{"round":1},{"round":2}]');
  });

  it('legt für einen unbekannten Code nichts an — weder beim Lesen noch beim Schreiben', async () => {
    const env = fakeEnv({ [CODE]: '[]' });
    const other = 'fremd-abcd-efgh-9999';
    expect((await call(env, `/api/log/${other}`)).status).toBe(404);
    expect((await call(env, `/api/log/${other}`, { method: 'PUT', body: '[]' })).status).toBe(404);
    expect([...env.logs.keys()]).toEqual([CODE]);
  });

  it('weist ab, was kein Code oder keine Adresse der Sicherung ist', async () => {
    const env = fakeEnv({ [CODE]: '[]' });
    expect((await call(env, '/api/log/kurz')).status).toBe(404);
    expect((await call(env, `/api/log/${CODE}/mehr`)).status).toBe(404);
    expect((await call(env, '/api/anderes')).status).toBe(404);
  });

  it('nimmt nur JSON-Listen an und lässt den alten Stand sonst stehen', async () => {
    const env = fakeEnv({ [CODE]: '[{"round":1}]' });
    expect((await call(env, `/api/log/${CODE}`, { method: 'PUT', body: 'kein json' })).status).toBe(400);
    expect((await call(env, `/api/log/${CODE}`, { method: 'PUT', body: '{"round":1}' })).status).toBe(400);
    expect(env.logs.get(CODE)).toBe('[{"round":1}]');
  });

  it('weist zu große Sendungen und andere Methoden ab', async () => {
    const env = fakeEnv({ [CODE]: '[]' });
    const tooLarge = `["${'x'.repeat(MAX_BODY_BYTES)}"]`;
    expect((await call(env, `/api/log/${CODE}`, { method: 'PUT', body: tooLarge })).status).toBe(413);
    expect((await call(env, `/api/log/${CODE}`, { method: 'DELETE' })).status).toBe(405);
    expect(env.logs.get(CODE)).toBe('[]');
  });
});
