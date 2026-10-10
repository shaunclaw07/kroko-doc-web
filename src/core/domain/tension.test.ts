import { describe, expect, it } from 'vitest';
import {
  HEARTBEAT_FAST_MS,
  HEARTBEAT_SLOW_MS,
  SILENCE_MAX_MS,
  SILENCE_MIN_MS,
  heartbeatInterval,
  planPressDrama,
  silenceDuration,
  tensionAfterPress,
  twitchChance,
} from './tension';
import { SeededRandom } from '../../infrastructure/testing/seededRandom';
import { ScriptedRandom } from '../../infrastructure/testing/scriptedRandom';

describe('tensionAfterPress', () => {
  it('steigt mit jedem Druck und bleibt in 0..1', () => {
    let tension = 0;
    let previous = tension;
    for (let pressIndex = 1; pressIndex <= 10; pressIndex += 1) {
      tension = tensionAfterPress({ current: tension, pressIndex, remaining: 11 - pressIndex, teeth: 10 });
      // Streng steigend, bis der Pegel bei 1 sättigt — danach bleibt er oben.
      if (previous < 1) {
        expect(tension).toBeGreaterThan(previous);
      }
      expect(tension).toBeLessThanOrEqual(1);
      previous = tension;
    }
    expect(tension).toBe(1);
  });

  it('sättigt bei 1, statt darüber zu wachsen', () => {
    expect(tensionAfterPress({ current: 0.99, pressIndex: 9, remaining: 1, teeth: 10 })).toBe(1);
  });

  it('steigt stärker, wenn nur noch wenige Zähne übrig sind', () => {
    const early = tensionAfterPress({ current: 0.2, pressIndex: 1, remaining: 9, teeth: 10 });
    const late = tensionAfterPress({ current: 0.2, pressIndex: 1, remaining: 2, teeth: 10 });
    expect(late).toBeGreaterThan(early);
  });
});

describe('twitchChance', () => {
  it('ist beim letzten Zahn immer null (dort schnappt es garantiert)', () => {
    expect(twitchChance({ tension: 1, remaining: 1 })).toBe(0);
  });

  it('wächst mit der Spannung', () => {
    expect(twitchChance({ tension: 1, remaining: 5 })).toBeGreaterThan(twitchChance({ tension: 0, remaining: 5 }));
  });

  it('bleibt unter 25 Prozent', () => {
    expect(twitchChance({ tension: 1, remaining: 2 })).toBeLessThan(0.25);
  });
});

describe('silenceDuration', () => {
  it('ist ohne Zuschnappen null — nur vor dem Biss wird es still', () => {
    expect(silenceDuration({ willSnap: false, remaining: 5, teeth: 10, rng: new ScriptedRandom([0.5]) })).toBe(0);
  });

  it('liegt vor dem Biss im Spannungsfenster', () => {
    const rng = new SeededRandom(4);
    for (let round = 0; round < 500; round += 1) {
      const ms = silenceDuration({ willSnap: true, remaining: 1 + (round % 10), teeth: 10, rng });
      expect(ms).toBeGreaterThanOrEqual(SILENCE_MIN_MS);
      expect(ms).toBeLessThanOrEqual(SILENCE_MAX_MS + 30);
    }
  });

  it('dehnt sich, je weniger Zähne noch übrig sind', () => {
    const rng = new ScriptedRandom([0.5, 0.5]);
    const early = silenceDuration({ willSnap: true, remaining: 10, teeth: 10, rng });
    const late = silenceDuration({ willSnap: true, remaining: 1, teeth: 10, rng });
    expect(late).toBeGreaterThan(early);
  });
});

describe('heartbeatInterval', () => {
  it('beschleunigt zwischen den Grenzen', () => {
    expect(heartbeatInterval(0)).toBe(HEARTBEAT_SLOW_MS);
    expect(heartbeatInterval(1)).toBe(HEARTBEAT_FAST_MS);
    expect(heartbeatInterval(0.5)).toBeLessThan(HEARTBEAT_SLOW_MS);
    expect(heartbeatInterval(0.5)).toBeGreaterThan(HEARTBEAT_FAST_MS);
  });

  it('klemmt unsinnige Werte', () => {
    expect(heartbeatInterval(-3)).toBe(HEARTBEAT_SLOW_MS);
    expect(heartbeatInterval(7)).toBe(HEARTBEAT_FAST_MS);
  });
});

describe('planPressDrama', () => {
  const base = { tension: 0.3, pressIndex: 3, remaining: 6, teeth: 10 };

  it('zuckt bei einem scharfen Zahn nie — der Biss kommt sofort', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const drama = planPressDrama({ ...base, willSnap: true, rng: new SeededRandom(seed) });
      expect(drama.twitch).toBe(false);
      expect(drama.silenceMs).toBeGreaterThanOrEqual(SILENCE_MIN_MS);
    }
  });

  it('erzeugt vor dem Biss die stärkste Erschütterung', () => {
    const snap = planPressDrama({ ...base, willSnap: true, rng: new ScriptedRandom([0.5]) });
    const harmless = planPressDrama({ ...base, willSnap: false, rng: new ScriptedRandom([0.99]) });
    expect(snap.shakeLevel).toBeGreaterThan(harmless.shakeLevel);
    expect(snap.shakeLevel).toBeGreaterThan(0.75);
  });

  it('setzt die Spannung nach dem Biss auf 1', () => {
    expect(planPressDrama({ ...base, willSnap: true, rng: new ScriptedRandom([0.5]) }).tensionAfter).toBe(1);
  });

  it('zuckt nur bei harmlosen Drücken und nur bei niedrigem Zufallswert', () => {
    const zuckt = planPressDrama({ ...base, willSnap: false, rng: new ScriptedRandom([0]) });
    const still = planPressDrama({ ...base, willSnap: false, rng: new ScriptedRandom([0.99]) });
    expect(zuckt.twitch).toBe(true);
    expect(still.twitch).toBe(false);
  });

  it('ist bei gleichem Startwert reproduzierbar', () => {
    const a = planPressDrama({ ...base, willSnap: false, rng: new SeededRandom(99) });
    const b = planPressDrama({ ...base, willSnap: false, rng: new SeededRandom(99) });
    expect(a).toEqual(b);
  });
});
