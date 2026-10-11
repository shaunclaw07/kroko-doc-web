import { describe, expect, it } from 'vitest';
import {
  BEAT_MAX_MS,
  BEAT_MIN_MS,
  HEARTBEAT_FAST_MS,
  HEARTBEAT_SLOW_MS,
  HIGH_DANGER,
  heartbeatInterval,
  TENSE_LEVEL,
  isHighDanger,
  isTense,
  planPressDrama,
  pressBeatMs,
  pressProgress,
  reliefLevel,
  survivedDanger,
  tensionForPress,
  twitchChance,
} from './tension';
import { SeededRandom } from '../../infrastructure/testing/seededRandom';
import { ScriptedRandom } from '../../infrastructure/testing/scriptedRandom';

const KROKODIL = { mode: 'original' as const, liveTeethMin: 1, liveTeethMax: 3 };

/**
 * Die Spannung ist die **Biss-Wahrscheinlichkeit des nächsten Drucks** — bedingt darauf, dass die
 * Runde bis hierher überlebt hat. Sie kommt aus derselben Verteilung wie die Statistik
 * (`probabilities.ts`) und ist damit dieselbe Wahrheit wie die Zahlen in Doku und Python-Referenz.
 */
describe('tensionForPress', () => {
  it('nennt die Biss-Wahrscheinlichkeit je Druck (Krokodil: 10 Zähne, 1–3 scharf)', () => {
    const erwartet = [20.0, 21.3, 22.8, 24.6, 26.8, 29.7, 33.8, 40.7, 55.0, 100.0];
    erwartet.forEach((prozent, index) => {
      const wert = tensionForPress({ pressIndex: index + 1, teeth: 10, ...KROKODIL });
      expect(wert * 100).toBeCloseTo(prozent, 1);
    });
  });

  it('ist beim letzten Zahn genau 1 — dort schnappt es garantiert', () => {
    expect(tensionForPress({ pressIndex: 10, teeth: 10, ...KROKODIL })).toBe(1);
  });

  it('steigt mit jedem Druck und bleibt in 0..1', () => {
    let previous = 0;
    for (let pressIndex = 1; pressIndex <= 10; pressIndex += 1) {
      const tension = tensionForPress({ pressIndex, teeth: 10, ...KROKODIL });
      expect(tension).toBeGreaterThan(previous);
      expect(tension).toBeLessThanOrEqual(1);
      previous = tension;
    }
  });

  it('sättigt nicht schon in der ersten Hälfte — der Balken hat bis zum Schluss Weg', () => {
    expect(tensionForPress({ pressIndex: 4, teeth: 10, ...KROKODIL })).toBeLessThan(0.3);
    expect(tensionForPress({ pressIndex: 8, teeth: 10, ...KROKODIL })).toBeLessThan(0.5);
  });

  it('steigt bei wenigen Zähnen schneller (Maus: 6 Zähne, 1–2 scharf)', () => {
    const maus = { mode: 'original' as const, liveTeethMin: 1, liveTeethMax: 2 };
    const erwartet = [25.0, 28.9, 34.4, 42.9, 58.3, 100.0];
    erwartet.forEach((prozent, index) => {
      const wert = tensionForPress({ pressIndex: index + 1, teeth: 6, ...maus });
      expect(wert * 100).toBeCloseTo(prozent, 1);
    });
    const wolf = tensionForPress({ pressIndex: 4, teeth: 12, mode: 'original', liveTeethMin: 1, liveTeethMax: 2 });
    expect(tensionForPress({ pressIndex: 4, teeth: 6, ...maus })).toBeGreaterThan(wolf);
  });

  it('rechnet im Modus classic mit genau einem scharfen Zahn (1 ÷ übrige Zähne)', () => {
    const classic = { mode: 'classic' as const, liveTeethMin: 1, liveTeethMax: 3 };
    expect(tensionForPress({ pressIndex: 1, teeth: 10, ...classic })).toBeCloseTo(0.1, 3);
    expect(tensionForPress({ pressIndex: 9, teeth: 10, ...classic })).toBeCloseTo(0.5, 3);
    expect(tensionForPress({ pressIndex: 10, teeth: 10, ...classic })).toBe(1);
  });
});

/**
 * Die Pause vor der Auflösung ist das Spannungsmittel **und** die Ehrlichkeitsprobe:
 * sie kommt bei jedem Druck, und ihre Länge darf nichts über den Ausgang verraten.
 */
describe('pressBeatMs', () => {
  it('bleibt im vereinbarten Fenster', () => {
    const rng = new SeededRandom(7);
    for (let i = 0; i < 2000; i += 1) {
      const ms = pressBeatMs({ tension: rng.next(), rng });
      expect(ms).toBeGreaterThanOrEqual(BEAT_MIN_MS);
      expect(ms).toBeLessThanOrEqual(BEAT_MAX_MS);
    }
  });

  it('wird im Mittel länger, wenn die Spannung steigt', () => {
    const mittel = (tension: number): number => {
      const rng = new SeededRandom(11);
      let sum = 0;
      const runs = 4000;
      for (let i = 0; i < runs; i += 1) {
        sum += pressBeatMs({ tension, rng });
      }
      return sum / runs;
    };
    const frueh = mittel(0);
    const spaet = mittel(1);
    expect(spaet).toBeGreaterThan(frueh);
    // Früh sind lange Pausen selten, spät nicht mehr: der Unterschied ist deutlich.
    expect(spaet - frueh).toBeGreaterThan(100);
  });

  it('nimmt den Ausgang gar nicht erst entgegen — er kann die Pause nicht beeinflussen', () => {
    const quelle = pressBeatMs.toString();
    expect(quelle).not.toContain('willSnap');
    expect(quelle).not.toContain('snap');
  });
});

describe('reliefLevel', () => {
  it('ist an den Enden 0 und 1', () => {
    expect(reliefLevel(BEAT_MIN_MS)).toBe(0);
    expect(reliefLevel(BEAT_MAX_MS)).toBe(1);
  });

  it('wächst mit der Pause und bleibt in 0..1', () => {
    let previous = -1;
    for (let ms = 0; ms <= BEAT_MAX_MS + 200; ms += 25) {
      const level = reliefLevel(ms);
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(1);
      if (ms <= BEAT_MAX_MS) {
        expect(level).toBeGreaterThanOrEqual(previous);
        previous = level;
      }
    }
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

  it('gibt bei gleichem Startwert dieselbe Pause — ob der Zahn scharf ist oder nicht', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const scharf = planPressDrama({ ...base, willSnap: true, rng: new SeededRandom(seed) });
      const harmlos = planPressDrama({ ...base, willSnap: false, rng: new SeededRandom(seed) });
      expect(scharf.beatMs).toBe(harmlos.beatMs);
    }
  });

  it('gibt die Erleichterung nur beim harmlosen Druck', () => {
    const scharf = planPressDrama({ ...base, willSnap: true, rng: new SeededRandom(3) });
    const harmlos = planPressDrama({ ...base, willSnap: false, rng: new SeededRandom(3) });
    expect(scharf.reliefLevel).toBe(0);
    expect(harmlos.reliefLevel).toBe(reliefLevel(harmlos.beatMs));
  });

  it('zuckt bei einem scharfen Zahn nie — der Biss kommt sofort', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const drama = planPressDrama({ ...base, willSnap: true, rng: new SeededRandom(seed) });
      expect(drama.twitch).toBe(false);
      expect(drama.beatMs).toBeGreaterThanOrEqual(BEAT_MIN_MS);
    }
  });

  it('erzeugt vor dem Biss die stärkste Erschütterung', () => {
    const snap = planPressDrama({ ...base, willSnap: true, rng: new ScriptedRandom([0.5]) });
    const harmless = planPressDrama({ ...base, willSnap: false, rng: new ScriptedRandom([0.5, 0.99]) });
    expect(snap.shakeLevel).toBeGreaterThan(harmless.shakeLevel);
    expect(snap.shakeLevel).toBeGreaterThan(0.75);
  });

  it('setzt die Spannung nach dem Biss auf 1', () => {
    expect(planPressDrama({ ...base, willSnap: true, rng: new ScriptedRandom([0.5]) }).tensionAfter).toBe(1);
  });

  it('stellt nach einem harmlosen Druck die Gefahr des nächsten Drucks ein', () => {
    const drama = planPressDrama({ ...base, willSnap: false, rng: new ScriptedRandom([0.5, 0.99]) });
    const naechster = tensionForPress({ pressIndex: base.pressIndex + 1, teeth: 10, ...KROKODIL });
    expect(drama.tensionAfter).toBe(naechster);
  });

  it('zuckt nur bei harmlosen Drücken und nur bei niedrigem Zufallswert', () => {
    const zuckt = planPressDrama({ ...base, willSnap: false, rng: new ScriptedRandom([0, 0]) });
    const still = planPressDrama({ ...base, willSnap: false, rng: new ScriptedRandom([0, 0.99]) });
    expect(zuckt.twitch).toBe(true);
    expect(still.twitch).toBe(false);
  });

  it('ist bei gleichem Startwert reproduzierbar', () => {
    const a = planPressDrama({ ...base, willSnap: false, rng: new SeededRandom(99) });
    const b = planPressDrama({ ...base, willSnap: false, rng: new SeededRandom(99) });
    expect(a).toEqual(b);
  });
});

/** Die Füllung des Balkens: wie weit die Runde durch ist (nicht wie gefährlich sie ist). */
describe('pressProgress', () => {
  it('nennt den Anteil gedrückter Zähne', () => {
    expect(pressProgress({ pressed: 0, teeth: 10 })).toBe(0);
    expect(pressProgress({ pressed: 6, teeth: 10 })).toBeCloseTo(0.6, 5);
    expect(pressProgress({ pressed: 10, teeth: 10 })).toBe(1);
  });

  it('bleibt in 0..1, auch bei unsinnigen Eingaben', () => {
    expect(pressProgress({ pressed: 12, teeth: 10 })).toBe(1);
    expect(pressProgress({ pressed: -3, teeth: 10 })).toBe(0);
    expect(pressProgress({ pressed: 3, teeth: 0 })).toBe(0);
  });
});

/** Der Mut der Runde: die hoechste ueberstandene Bissgefahr. */
describe('survivedDanger', () => {
  it('ist vor dem ersten Druck null — da war nichts zu ueberstehen', () => {
    expect(survivedDanger({ pressIndex: 1, teeth: 10, ...KROKODIL })).toBe(0);
  });

  it('nennt die Gefahr des letzten harmlosen Drucks', () => {
    // Krokodil: schnappt beim 10. Druck → ueberstanden wurden 1..9, die Gefahr stieg bis 55,0 %.
    expect(survivedDanger({ pressIndex: 10, teeth: 10, ...KROKODIL })).toBeCloseTo(0.55, 3);
    expect(survivedDanger({ pressIndex: 2, teeth: 10, ...KROKODIL })).toBeCloseTo(0.2, 3);
  });

  it('rechnet im Modus classic mit 1 geteilt durch die uebrigen Zaehne', () => {
    expect(survivedDanger({ pressIndex: 3, teeth: 10, mode: 'classic', liveTeethMin: 1, liveTeethMax: 1 }))
      .toBeCloseTo(1 / 9, 4);
  });

  it('bleibt in 0..1', () => {
    const MAUS = { mode: 'original' as const, liveTeethMin: 1, liveTeethMax: 2 };
    expect(survivedDanger({ pressIndex: 6, teeth: 6, ...MAUS })).toBeLessThanOrEqual(1);
  });
});

/** Ab wann der Balken rot wird — eine Kernregel, kein Wert im Stylesheet. */
describe('isHighDanger', () => {
  it('greift ab der vereinbarten Schwelle', () => {
    expect(isHighDanger(HIGH_DANGER - 0.01)).toBe(false);
    expect(isHighDanger(HIGH_DANGER)).toBe(true);
    expect(isHighDanger(1)).toBe(true);
  });

  it('brennt nicht schon beim ersten Druck', () => {
    expect(isHighDanger(tensionForPress({ pressIndex: 1, teeth: 10, ...KROKODIL }))).toBe(false);
  });

  it('wird beim Krokodil ab dem vorletzten Zahn rot', () => {
    // 40,7 % beim achten, 55,0 % beim neunten, 100 % beim zehnten Druck. Die Schwelle liegt bei
    // 50 %, damit ein roter Druck ueberlebt werden kann — sonst waere jeder rote Druck ein Biss und
    // der Mut koennte nie ins Rote reichen.
    expect(isHighDanger(tensionForPress({ pressIndex: 8, teeth: 10, ...KROKODIL }))).toBe(false);
    expect(isHighDanger(tensionForPress({ pressIndex: 9, teeth: 10, ...KROKODIL }))).toBe(true);
    expect(isHighDanger(tensionForPress({ pressIndex: 10, teeth: 10, ...KROKODIL }))).toBe(true);
  });
});

/** Die Bühne spannt sich früher an als der Balken rot wird. */
describe('isTense', () => {
  it('greift knapp über der Schwelle', () => {
    expect(isTense(TENSE_LEVEL)).toBe(false);
    expect(isTense(TENSE_LEVEL + 0.01)).toBe(true);
  });
});
