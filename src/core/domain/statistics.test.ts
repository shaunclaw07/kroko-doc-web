import { describe, expect, it } from 'vitest';
import { bravestRound } from './statistics';
import { DEFAULT_K_WEIGHTS, binomial, pressPositionDistribution } from './probabilities';
import type { RoundRecord } from './records';
import type { RandomMode } from './teeth';
import { fairRounds } from '../../infrastructure/testing/fairRounds';
import { SeededRandom } from '../../infrastructure/testing/seededRandom';
import {
  analyseSession,
  autocorrelation,
  chiSquareGoodnessOfFit,
  chiSquareSurvival,
  countBy,
  groupRounds,
  verdict,
  wilsonInterval,
  type ChiSquareResult,
  type SessionReport,
} from './statistics';

// Referenzwerte aus dem Python-Werkzeug (~/projects/kroko-doc/kroko_analyse.py).
const PREF_GOF = [63, 51, 46, 39, 32, 21, 15, 13, 12, 8];
const AUTOCORR_SERIES = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9];

function expectRelative(actual: number, expected: number, relativeTolerance: number): void {
  const tolerance = Math.abs(expected) * relativeTolerance;
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

describe('chiSquareSurvival', () => {
  it('trifft die tabellierten Quantile der Chi2-Verteilung', () => {
    expect(Math.abs(chiSquareSurvival(3.841, 1) - 0.05)).toBeLessThan(1e-3);
    expect(Math.abs(chiSquareSurvival(16.919, 9) - 0.05)).toBeLessThan(1e-3);
    expect(Math.abs(chiSquareSurvival(19.023, 9) - 0.025)).toBeLessThan(1e-3);
  });

  it('trifft den Referenzwert fuer chi2 = 1, df = 1', () => {
    expect(Math.abs(chiSquareSurvival(1, 1) - 0.31731051419628975)).toBeLessThan(1e-6);
  });

  it('faellt monoton mit wachsendem x', () => {
    let previous = chiSquareSurvival(0, 4);
    for (let x = 0.5; x <= 40; x += 0.5) {
      const current = chiSquareSurvival(x, 4);
      expect(current).toBeLessThanOrEqual(previous);
      previous = current;
    }
  });

  it('ergibt eins bei x = 0', () => {
    expect(chiSquareSurvival(0, 3)).toBe(1);
  });
});

describe('chiSquareGoodnessOfFit', () => {
  it('weist die Gleichverteilung deutlich zurueck (Referenz)', () => {
    const result = chiSquareGoodnessOfFit(PREF_GOF, 'uniform');
    expect(result).not.toBeNull();
    const value = result as ChiSquareResult;
    expectRelative(value.chiSquare, 109.13333333333333, 1e-12);
    expect(value.df).toBe(9);
    expectRelative(value.pValue, 2.207139718613823e-19, 1e-15);
    expect(value.significant).toBe(true);
  });

  it('bestaetigt das Zugmodell (Referenz)', () => {
    const result = chiSquareGoodnessOfFit(PREF_GOF, pressPositionDistribution(10, DEFAULT_K_WEIGHTS));
    expect(result).not.toBeNull();
    const value = result as ChiSquareResult;
    expectRelative(value.chiSquare, 2.8520389195665685, 1e-12);
    expect(value.df).toBe(9);
    expectRelative(value.pValue, 0.9698731394279975, 1e-9);
    expect(value.significant).toBe(false);
  });

  it('trifft den Referenzwert fuer [30,25,20,15,10] gegen Gleichverteilung', () => {
    const result = chiSquareGoodnessOfFit([30, 25, 20, 15, 10], 'uniform');
    expect(result).not.toBeNull();
    const value = result as ChiSquareResult;
    expect(value.chiSquare).toBeCloseTo(12.5, 10);
    expect(value.df).toBe(4);
    expectRelative(value.pValue, 0.013995792487650894, 1e-9);
  });

  it('setzt significant konsistent zu pValue < 0,05', () => {
    for (const counts of [PREF_GOF, [30, 25, 20, 15, 10], [10, 10, 10, 10], [40, 9, 1]]) {
      const result = chiSquareGoodnessOfFit(counts, 'uniform');
      if (result) {
        expect(result.significant).toBe(result.pValue < 0.05);
      }
    }
  });

  it('liefert null bei leerer Eingabe oder Erwartung <= 0', () => {
    expect(chiSquareGoodnessOfFit([], 'uniform')).toBeNull();
    expect(chiSquareGoodnessOfFit([5], 'uniform')).toBeNull();
    expect(chiSquareGoodnessOfFit([0, 0, 0], 'uniform')).toBeNull();
    expect(chiSquareGoodnessOfFit([5, 5, 5], [0.5, 0.5, 0])).toBeNull();
  });
});

describe('wilsonInterval', () => {
  it('trifft das Referenzintervall fuer 57 von 300', () => {
    const interval = wilsonInterval(57, 300);
    expect(interval.proportion).toBeCloseTo(0.19, 10);
    expect(interval.low).toBeCloseTo(0.149634, 6);
    expect(interval.high).toBeCloseTo(0.238205, 6);
  });

  it('bleibt in [0,1] und null bei leerer Stichprobe', () => {
    expect(wilsonInterval(0, 0)).toEqual({ proportion: 0, low: 0, high: 0 });
    const interval = wilsonInterval(30, 30);
    expect(interval.low).toBeGreaterThanOrEqual(0);
    expect(interval.high).toBeLessThanOrEqual(1);
  });
});

describe('autocorrelation', () => {
  it('trifft die Referenzwerte fuer Lag 1 bis 3', () => {
    expect(autocorrelation(AUTOCORR_SERIES, 1)).toBeCloseTo(0.259387, 6);
    expect(autocorrelation(AUTOCORR_SERIES, 2)).toBeCloseTo(0.176293, 6);
    expect(autocorrelation(AUTOCORR_SERIES, 3)).toBeCloseTo(0.233413, 6);
  });

  it('liefert null bei zu kurzer oder konstanter Reihe', () => {
    expect(autocorrelation([1, 2, 3], 1)).toBeNull();
    expect(autocorrelation([4, 4, 4, 4, 4], 1)).toBeNull();
  });
});

describe('countBy', () => {
  it('zaehlt Werte 1..domain in Index 0..domain-1', () => {
    expect(countBy([1, 1, 2, 3, 3, 3], 3)).toEqual([2, 1, 3]);
    expect(countBy([], 4)).toEqual([0, 0, 0, 0]);
    expect(countBy([0, 5, 2], 4)).toEqual([0, 1, 0, 0]);
  });
});

describe('pressPositionDistribution (Eigenschaft)', () => {
  it('summiert sich zu eins', () => {
    for (const teeth of [4, 8, 10, 16]) {
      const sum = pressPositionDistribution(teeth, DEFAULT_K_WEIGHTS).reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - 1)).toBeLessThan(1e-12);
    }
  });

  it('nutzt binomial (Referenz 120)', () => {
    expect(binomial(10, 3)).toBe(120);
  });
});

function buildRounds(
  teeth: number,
  mode: RandomMode,
  count: number,
  loser: number,
  pressIndex: number,
): Array<{ mode: RandomMode; teeth: number; loserTooth: number; pressIndex: number }> {
  return Array.from({ length: count }, () => ({
    mode,
    teeth,
    loserTooth: loser,
    pressIndex,
  }));
}

describe('analyseSession', () => {
  it('baut einen konsistenten Bericht aus genuegend Runden', () => {
    const rounds = [
      ...buildRounds(10, 'original', 40, 3, 1),
      ...buildRounds(10, 'original', 20, 7, 4),
    ];
    const report: SessionReport = analyseSession(rounds, 1);
    expect(report.rounds).toBe(60);
    expect(report.teeth).toBe(10);
    expect(report.countsByTooth[2]).toBe(40);
    expect(report.countsByTooth[6]).toBe(20);
    expect(report.mostLikelyTooth).toBe(3);
    expect(report.countsByPressIndex[0]).toBe(40);
    expect(report.observedPresses).toBeCloseTo((40 * 1 + 20 * 4) / 60, 12);
    expect(report.expectedPresses).toBeCloseTo(3.972222, 5);
    expect(report.toothTest).not.toBeNull();
    expect(report.modelTest).not.toBeNull();
    expect(report.autocorrelations).toHaveLength(6);
  });

  it('bleibt unter minSample bei null-Tests', () => {
    const rounds = buildRounds(10, 'classic', 5, 1, 1);
    const report = analyseSession(rounds, 30);
    expect(report.toothTest).toBeNull();
    expect(report.pressIndexTest).toBeNull();
    expect(report.modelTest).toBeNull();
    expect(report.mostLikelyTooth).toBe(1);
  });

  it('kommt mit einer leeren Sitzung zurecht', () => {
    const report = analyseSession([], 1);
    expect(report.rounds).toBe(0);
    expect(report.mostLikelyTooth).toBeNull();
    expect(report.observedPresses).toBe(0);
    expect(report.toothTest).toBeNull();
  });

  it('bleibt bei einem Ein-Zahn-Gebiss ehrlich: erwartet genau einen Druck', () => {
    // Fremder Prüfer (11.10.2026): mit einem einzigen Zahn zeigte der Bericht „Erwartet (Modell)
    // 0,33" und einen Modellbalken von 33 %, obwohl die beobachteten Drücke 1,00 und die
    // Gefahr-Kurve 100 % waren. Ursache: das Modell ließ jedes k über der Zahnzahl wegfallen,
    // statt es — wie die Auswahl der scharfen Zähne — auf die Zahnzahl zu kappen.
    const report = analyseSession(buildRounds(1, 'original', 3, 1, 1), 1);
    expect(report.observedPresses).toBeCloseTo(1, 12);
    expect(report.expectedPresses).toBeCloseTo(1, 12);
  });
});

describe('verdict', () => {
  it('ist ehrlich bei zu wenig Daten', () => {
    const rounds = buildRounds(10, 'original', 12, 5, 2);
    const report = analyseSession(rounds, 1);
    const text = verdict(report, 30);
    expect(text).toContain('zu wenig Daten');
  });

  it('liefert bei genug Daten ein Fazit mit Modellbewertung', () => {
    const rounds = [
      ...buildRounds(10, 'original', 30, 1, 1),
      ...buildRounds(10, 'original', 20, 2, 2),
      ...buildRounds(10, 'original', 20, 3, 3),
    ];
    const report = analyseSession(rounds, 1);
    const text = verdict(report, 30);
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain('Zugmodell');
  });
});

describe('bravestRound', () => {
  const krokodil = (round: number, pressIndex: number) => ({
    round, playedAt: '2026-10-11T10:00:00.000Z', creature: 'crocodile', teeth: 10,
    mode: 'original' as const, players: 1, loserTooth: 1 as const, pressIndex, liveCount: 1,
    pressOrder: [1, 2, 3],
  });

  it('nennt nichts, wenn nichts protokolliert ist', () => {
    expect(bravestRound([])).toBeNull();
  });

  it('nimmt die hoechste ueberstandene Gefahr', () => {
    // Schnappt es beim 10. Druck, war Druck 9 mit 55,0 % der mutigste; beim 2. Druck nur 20,0 %.
    const best = bravestRound([krokodil(1, 2), krokodil(2, 10)]);
    expect(best?.round).toBe(2);
    expect(best?.danger).toBeCloseTo(0.55, 3);
  });

  it('uebergeht Runden, in denen schon der erste Druck schnappte', () => {
    expect(bravestRound([krokodil(3, 1)])).toBeNull();
  });
});

/** 360 faire Runden aus drei Gebissen — so sieht ein Protokoll aus, wenn ein Kind die Tiere wechselt. */
function mixedFairRounds(): RoundRecord[] {
  const rng = new SeededRandom(7);
  return [
    ...fairRounds(rng, 'crocodile', 120, 1),
    ...fairRounds(rng, 'mouse', 120, 121),
    ...fairRounds(rng, 'wolf', 120, 241),
  ];
}

describe('groupRounds', () => {
  it('trennt nach Lebewesen, Zahnzahl und Modus — die größte Gruppe zuerst', () => {
    const rng = new SeededRandom(3);
    const groups = groupRounds([
      ...fairRounds(rng, 'crocodile', 2, 1),
      ...fairRounds(rng, 'mouse', 5, 3),
      ...fairRounds(rng, 'crocodile', 3, 8, 4),
      ...fairRounds(rng, 'crocodile', 1, 11),
      ...fairRounds(rng, 'crocodile', 3, 12, undefined, 'classic'),
    ]);
    expect(groups.map((group) => `${group.creature}/${group.teeth}/${group.mode}/${group.rounds.length}`)).toEqual([
      'mouse/6/original/5',
      'crocodile/10/original/3',
      'crocodile/4/original/3',
      'crocodile/10/classic/3',
    ]);
  });

  it('zählt Runden ohne oder mit unbekanntem Lebewesen zum Krokodil (Altdaten)', () => {
    const groups = groupRounds([
      { mode: 'original' as const, teeth: 10 },
      { mode: 'original' as const, teeth: 10, creature: 'drache' },
      { mode: 'original' as const, teeth: 10, creature: 'crocodile' },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.creature).toBe('crocodile');
    expect(groups[0]?.rounds).toHaveLength(3);
  });

  it('liefert für ein leeres Protokoll keine Gruppe', () => {
    expect(groupRounds([])).toEqual([]);
  });
});

describe('Auswertung je Gebiss', () => {
  it('meldet bei gemischten, fairen Runden keinen falschen Alarm', () => {
    const rounds = mixedFairRounds();
    // Zusammengeworfen schlagen beide Tests an — genau der Fehler, den die Gruppen verhindern.
    const lumped = analyseSession(rounds, 100);
    expect(lumped.toothTest?.significant).toBe(true);
    expect(lumped.modelTest?.significant).toBe(true);

    const groups = groupRounds(rounds);
    expect(groups.map((group) => group.creature).sort()).toEqual(['crocodile', 'mouse', 'wolf']);
    for (const group of groups) {
      const report = analyseSession(group.rounds, 100);
      expect(report.teeth, group.creature).toBe(group.teeth);
      expect(report.countsByTooth, group.creature).toHaveLength(group.teeth);
      expect(report.toothTest?.significant, `${group.creature}: Zahn-Test`).toBe(false);
      expect(report.modelTest?.significant, `${group.creature}: Modell-Test`).toBe(false);
      expect(report.autocorrelations.some((entry) => entry.remarkable), `${group.creature}: Muster`).toBe(false);
    }
  });

  it('nennt das Modell, gegen das geprüft wird — beim Wolf 5,42 erwartete Drücke, nicht 4,69', () => {
    const report = analyseSession(fairRounds(new SeededRandom(7), 'wolf', 10), 100);
    expect(report.creature).toBe('wolf');
    expect(report.mode).toBe('original');
    expect(report.model).toHaveLength(12);
    expect(report.model.reduce((sum, share) => sum + share, 0)).toBeCloseTo(1, 12);
    expect(report.expectedPresses).toBeCloseTo(5.4167, 3);
  });

  it('prüft die Druck-Position nur im Modus classic gegen die Gleichverteilung', () => {
    const rng = new SeededRandom(7);
    expect(analyseSession(fairRounds(rng, 'crocodile', 120), 100).pressIndexTest).toBeNull();
    expect(analyseSession(fairRounds(rng, 'crocodile', 120, 1, undefined, 'classic'), 100).pressIndexTest).not.toBeNull();
  });

  it('lässt die Mustersuche unter der Mindestzahl aus', () => {
    const report = analyseSession(fairRounds(new SeededRandom(7), 'crocodile', 99), 100);
    expect(report.autocorrelations).toEqual([]);
  });

  it('spricht keinen Test frei, der nicht lief (ein Zahn, 100 Runden)', () => {
    const report = analyseSession(fairRounds(new SeededRandom(7), 'crocodile', 100, 1, 1), 100);
    expect(report.toothTest).toBeNull();
    expect(report.modelTest).toBeNull();
    const text = verdict(report, 100);
    expect(text).toContain('Zugmodell lässt sich bei diesem Gebiss nicht prüfen');
    expect(text).not.toContain('passt zu den Daten');
    expect(text).not.toContain('vereinbar');
    expect(text).not.toContain('kein erkennbares Muster');
  });

  it('schreibt das Fazit mit Umlauten', () => {
    const text = verdict(analyseSession(mixedFairRounds().slice(0, 120), 100), 100);
    expect(text).toContain('Verlierer-Zähne');
    expect(text).toContain('Häufigster');
    expect(text).not.toMatch(/Zaehne|auffaellig|Haeufigster/);
  });

  it('kommt mit einem unbekannten Lebewesen im Protokoll zurecht', () => {
    const [round] = fairRounds(new SeededRandom(7), 'crocodile', 1);
    expect(() => bravestRound([{ ...round!, creature: 'drache' }])).not.toThrow();
  });
});
