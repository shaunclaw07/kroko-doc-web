import { describe, expect, it } from 'vitest';
import { requestPersistence } from './browserPersistence';

/** Aufzeichnender Navigator-Ersatz: merkt sich, ob um die Zusage gebeten wurde. */
function navigatorWith(options: { persisted: boolean; granted: boolean }) {
  const calls: string[] = [];
  return {
    calls,
    nav: {
      storage: {
        persisted: async () => { calls.push('persisted'); return options.persisted; },
        persist: async () => { calls.push('persist'); return options.granted; },
      },
    },
  };
}

describe('requestPersistence', () => {
  it('meldet eine Zusage, die der Browser gibt', async () => {
    const { calls, nav } = navigatorWith({ persisted: false, granted: true });
    expect(await requestPersistence(nav)).toBe('persistent');
    expect(calls).toEqual(['persisted', 'persist']);
  });

  it('bittet nicht erneut, wenn die Zusage schon steht', async () => {
    const { calls, nav } = navigatorWith({ persisted: true, granted: false });
    expect(await requestPersistence(nav)).toBe('persistent');
    expect(calls).toEqual(['persisted']);
  });

  it('meldet eine verweigerte Zusage als „best-effort"', async () => {
    const { nav } = navigatorWith({ persisted: false, granted: false });
    expect(await requestPersistence(nav)).toBe('best-effort');
  });

  it('kommt ohne `persisted` aus (ältere Browser kennen nur `persist`)', async () => {
    expect(await requestPersistence({ storage: { persist: async () => true } })).toBe('persistent');
  });

  it('erkennt eine fehlende Schnittstelle', async () => {
    expect(await requestPersistence(null)).toBe('unknown');
    expect(await requestPersistence({})).toBe('unknown');
    expect(await requestPersistence({ storage: {} })).toBe('unknown');
  });

  it('bleibt ruhig, wenn der Browser beim Aufruf wirft oder ablehnt', async () => {
    const wirft = { storage: { persist: (): Promise<boolean> => { throw new Error('nope'); } } };
    const lehntAb = { storage: { persist: () => Promise.reject(new Error('nope')) } };
    expect(await requestPersistence(wirft)).toBe('unknown');
    expect(await requestPersistence(lehntAb)).toBe('unknown');
  });
});
