import { describe, expect, it } from 'vitest';
import { BrowserHaptics } from './browserHaptics';

/** Navigator ohne Vibrations-Schnittstelle (so sieht Safari auf iOS aus). */
function navigatorWithout(): { vibrate?: (pattern: number | number[]) => boolean } {
  return {};
}

/** Aufzeichnender Navigator-Ersatz: merkt sich, was wirklich vibrieren sollte. */
function navigatorWith(vibrate: (pattern: number | number[]) => boolean = () => true) {
  const calls: (number | number[])[] = [];
  return {
    calls,
    nav: { vibrate: (p: number | number[]) => { calls.push(p); return vibrate(p); } },
  };
}

describe('BrowserHaptics', () => {
  it('erkennt fehlende Vibrations-Schnittstelle (Safari auf iOS)', () => {
    const haptics = new BrowserHaptics(navigatorWithout());
    expect(haptics.isSupported()).toBe(false);
    expect(() => haptics.vibrate([100, 50, 100])).not.toThrow();
  });

  it('gibt Muster als Zahl und als Liste weiter', () => {
    const { calls, nav } = navigatorWith();
    const haptics = new BrowserHaptics(nav);
    expect(haptics.isSupported()).toBe(true);
    haptics.vibrate(24);
    haptics.vibrate([120, 50, 220]);
    expect(calls).toEqual([24, [120, 50, 220]]);
  });

  it('reicht nur echte Listen weiter (kein readonly-Objekt an den Browser)', () => {
    const { calls, nav } = navigatorWith();
    const muster = [10, 20, 30] as const;
    new BrowserHaptics(nav).vibrate(muster);
    expect(Array.isArray(calls[0])).toBe(true);
    expect(calls[0]).toEqual([10, 20, 30]);
  });

  it('bleibt ruhig, wenn der Browser beim Aufruf wirft', () => {
    const { nav } = navigatorWith(() => { throw new Error('nope'); });
    const haptics = new BrowserHaptics(nav);
    expect(() => haptics.vibrate(50)).not.toThrow();
  });

});
