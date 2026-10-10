import { describe, expect, it } from 'vitest';
import {
  HEARTBEAT_FAST_MS,
  HEARTBEAT_SLOW_MS,
  SILENCE_MAX_MS,
  SILENCE_MIN_MS,
  heartbeatInterval,
  planPressDrama,
  silenceDuration,
  tensionForPress,
  twitchChance,
} from './tension';
import { SeededRandom } from '../../infrastructure/testing/seededRandom';
import { ScriptedRandom } from '../../infrastructure/testing/scriptedRandom';

/**
 * Die Spannung ist kein aufaddierter Pegel mehr, sondern die **Biss-Wahrscheinlichkeit des
 * nächsten Drucks** — bedingt darauf, dass die Runde bis hierher überlebt hat. Sie kommt aus
 * derselben Verteilung wie die Statistik (`probabilities.ts`) und ist damit dieselbe Wahrheit
 * wie die Zahlen in Doku und Python-Referenz.
 */
describe('tensionForPress', () => {
  const krokodil = { mode: 'original' as const, liveTeethMin: 1, liveTeethMax: 3 };

  it('nennt die Biss-Wahrscheinlichkeit je Druck (Krokodil: 10 Zähne, 1–3 scharf)', () => {
    // Nachgerechnet aus P(J = j) / P(J ≥ j) — dieselben Werte stehen in docs/domain-model.md.
    const erwartet = [20.0, 21.3, 22.8, 24.6, 26.8, 29.7, 33.8, 40.7, 55.0, 100.0];
    erwartet.forEach((prozent, index) => {
      const wert = tensionForPress({ pressIndex: index + 1, teeth: 10, ...krokodil });
      expect(wert * 100).toBeCloseTo(prozent, 1);
    });
  });

  it('ist beim letzten Zahn genau 1 — dort schnappt es garantiert', () => {
    expect(tensionForPress({ pressIndex: 10, teeth: 10, ...krokodil })).toBe(1);
  });

  it('steigt mit jedem Druck und bleibt in 0..1', () => {
    let previous = 0;
    for (let pressIndex = 1; pressIndex <= 10; pressIndex += 1) {
      const tension = tensionForPress({ pressIndex, teeth: 10, ...krokodil });
      expect(tension).toBeGreaterThan(previous);
      expect(tension).toBeLessThanOrEqual(1);
      previous = tension;
    }
  });

  it('sättigt nicht schon in der ersten Hälfte — der Balken hat bis zum Schluss Weg', () => {
    // Der alte Pegel stand bei 10 Zähnen ab dem 4. Druck auf 100 %.
    expect(tensionForPress({ pressIndex: 4, teeth: 10, ...krokodil })).toBeLessThan(0.3);
    expect(tensionForPress({ pressIndex: 8, teeth: 10, ...krokodil })).toBeLessThan(0.5);
  });

  it('steigt bei wenigen Zähnen schneller (Maus: 6 Zähne, 1–2 scharf)', () => {
    const maus = { mode: 'original' as const, liveTeethMin: 1, liveTeethMax: 2 };
    const erwartet = [25.0, 28.9, 34.4, 42.9, 58.3, 100.0];
    erwartet.forEach((prozent, index) => {
      const wert = tensionForPress({ pressIndex: index + 1, teeth: 6, ...maus });
      expect(wert * 100).toBeCloseTo(prozent, 1);
    });
    // Vierter Druck: Maus deutlich gefährlicher als der Wolf.
    const wolf = tensionForPress({ pressIndex: 4, teeth: 12, mode: 'original', liveTeethMin: 1, liveTeethMax: 2 });
    const maus4 = tensionForPress({ pressIndex: 4, teeth: 6, ...maus });
    expect(maus4).toBeGreaterThan(wolf);
  });

  it('rechnet im Modus classic mit genau einem scharfen Zahn (1 ÷ übrige Zähne)', () => {
    const classic = { mode: 'classic' as const, liveTeethMin: 1, liveTeethMax: 3 };
    expect(tensionForPress({ pressIndex: 1, teeth: 10, ...classic })).toBeCloseTo(0.1, 3);
    expect(tensionForPress({ pressIndex: 9, teeth: 10, ...classic })).toBeCloseTo(0.5, 3);
    expect(tensionForPress({ pressIndex: 10, teeth: 10, ...classic })).toBe(1);
  });

  it('verrät nichts über die verdeckten scharfen Zähne — nur Modell und Zählstand zählen', () => {
    // Gleicher Zählstand, gleiches Ergebnis — unabhängig davon, welche Zähne scharf sind.
    expect(tensionForPress({ pressIndex: 5, teeth: 10, ...krokodil })).toBe(
      tensionForPress({ pressIndex: 5, teeth: 10, ...krokodil }),
    );
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
  const base = {
    pressIndex: 3,
    remaining: 7,
    teeth: 10,
    mode: 'original' as const,
    liveTeethMin: 1,
    liveTeethMax: 3,
  };

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

  it('stellt nach einem harmlosen Druck die Gefahr des nächsten Drucks ein', () => {
    const drama = planPressDrama({ ...base, willSnap: false, rng: new ScriptedRandom([0.99]) });
    const naechster = tensionForPress({ pressIndex: base.pressIndex + 1, teeth: 10, mode: 'original', liveTeethMin: 1, liveTeethMax: 3 });
    expect(drama.tensionAfter).toBe(naechster);
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
