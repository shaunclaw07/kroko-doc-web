import { describe, expect, it } from 'vitest';
import { getCreature } from './creature';
import { creatureKWeights } from './probabilities';
import {
  DEFAULT_K_WEIGHTS,
  binomial,
  expectedPresses,
  modeKWeights,
  playerLoserProbabilities,
  pressPositionDistribution,
  survivalCurve,
} from './probabilities';

// Referenzwerte aus dem Python-Werkzeug (~/projects/kroko-doc/kroko_analyse.py,
// exakte Brüche: 1/5, 23/135, 31/216, 43/360, 53/540, 43/540, 23/360, 11/216, 11/270, 1/30)
const REFERENCE = [0.2, 0.17037, 0.143519, 0.119444, 0.098148, 0.07963, 0.063889, 0.050926, 0.040741, 0.033333];

describe('pressPositionDistribution', () => {
  it('trifft die Referenzverteilung für 10 Zähne und 1–3 scharfe Zähne', () => {
    const dist = pressPositionDistribution(10, DEFAULT_K_WEIGHTS);
    expect(dist).toHaveLength(10);
    dist.forEach((value, index) => {
      expect(Math.abs(value - REFERENCE[index]!)).toBeLessThan(1e-5);
    });
  });

  it('summiert sich zu genau eins', () => {
    const sum = pressPositionDistribution(10, DEFAULT_K_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(1e-12);
  });

  it('kappt die Zahl scharfer Zähne auf die Zahnzahl (kleine Gebisse)', () => {
    // Die Auswahl der scharfen Zähne kappt ihre Anzahl auf die Zahnzahl (`liveTeeth.ts`) — das
    // Modell muss dasselbe tun. Vorher fiel jedes k über der Zahnzahl weg: bei einem Ein-Zahn-Gebiss
    // (seit 11.10.2026 möglich) zeigte die Statistik „Erwartet 0,33" statt 1.
    const eins = pressPositionDistribution(1, DEFAULT_K_WEIGHTS);
    expect(eins).toEqual([1]);
    expect(expectedPresses(eins)).toBeCloseTo(1, 12);

    for (const zaehne of [2, 3]) {
      const dist = pressPositionDistribution(zaehne, DEFAULT_K_WEIGHTS);
      expect(dist.reduce((a, b) => a + b, 0), `${zaehne} Zähne`).toBeCloseTo(1, 12);
    }
    // Bei zwei Zähnen schnappt es meistens schon beim ersten Druck: zwei der drei Modellfälle
    // (zwei und drei scharfe Zähne) werden auf zwei gekappt.
    const zwei = pressPositionDistribution(2, DEFAULT_K_WEIGHTS);
    expect(zwei[0]!).toBeGreaterThan(zwei[1]!);
  });

  it('klassisch (genau ein scharfer Zahn) ist über alle Drücke gleichverteilt', () => {
    const dist = pressPositionDistribution(10, modeKWeights('classic'));
    dist.forEach((value) => expect(Math.abs(value - 0.1)).toBeLessThan(1e-12));
  });

  it('nennt den letzten Druck nur bei genau einem scharfen Zahn möglich', () => {
    expect(pressPositionDistribution(10, { 1: 1 })[9]).toBeCloseTo(0.1, 12);
    expect(pressPositionDistribution(10, { 2: 1 })[9]).toBe(0);
    expect(pressPositionDistribution(10, { 3: 1 })[9]).toBe(0);
  });
});

describe('expectedPresses', () => {
  it('ergibt 3,97 Drücke bei 1–3 scharfen Zähnen (10 Zähne)', () => {
    expect(expectedPresses(pressPositionDistribution(10, DEFAULT_K_WEIGHTS))).toBeCloseTo(3.972222, 5);
  });

  it('ergibt 5,50 Drücke beim klassischen Modell', () => {
    expect(expectedPresses(pressPositionDistribution(10, modeKWeights('classic')))).toBeCloseTo(5.5, 12);
  });
});

describe('survivalCurve', () => {
  it('stimmt mit der Referenz überein (80 %, 61,1 %, 48,6 % ...)', () => {
    const curve = survivalCurve(pressPositionDistribution(10, DEFAULT_K_WEIGHTS));
    expect(curve[0]).toBeCloseTo(1, 12);
    expect(curve[1]).toBeCloseTo(0.8, 12);
    expect(curve[2]).toBeCloseTo(0.62963, 5);
    expect(curve[3]).toBeCloseTo(0.486111, 5);
    expect(curve[7]).toBeCloseTo(0.125, 4);
    expect(curve[9]).toBeCloseTo(0.033333, 5);
  });
});

describe('playerLoserProbabilities', () => {
  it('verteilt die Verlustchance bei vier Spielern wie berechnet', () => {
    const probs = playerLoserProbabilities(10, 4, DEFAULT_K_WEIGHTS);
    expect(probs[0]).toBeCloseTo(0.338889, 5);
    expect(probs[1]).toBeCloseTo(0.283333, 5);
    expect(probs[2]).toBeCloseTo(0.207407, 5);
    expect(probs[3]).toBeCloseTo(0.17037, 5);
  });

  it('summiert sich über die Spieler zu eins', () => {
    const sum = playerLoserProbabilities(10, 3, DEFAULT_K_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(1e-12);
  });

  it('ist bei einem Spieler immer eins', () => {
    expect(playerLoserProbabilities(10, 1, DEFAULT_K_WEIGHTS)[0]).toBeCloseTo(1, 12);
  });
});

describe('binomial', () => {
  it('rechnet die Binomialkoeffizienten korrekt', () => {
    expect(binomial(10, 1)).toBe(10);
    expect(binomial(10, 3)).toBe(120);
    expect(binomial(0, 0)).toBe(1);
    expect(binomial(5, 6)).toBe(0);
  });
});

describe('Grenzen des Gebisses', () => {
  it('verteilt die Gewichte nur über die erlaubten Anzahlen', () => {
    const wolf = modeKWeights('original', 1, 2);
    expect(Object.keys(wolf).map(Number).sort()).toEqual([1, 2]);
    expect(wolf[1]).toBeCloseTo(0.5, 12);
    expect(wolf[2]).toBeCloseTo(0.5, 12);
  });

  it('lässt classic unabhängig von den Grenzen bei genau einem Zahn', () => {
    expect(modeKWeights('classic', 1, 3)).toEqual({ 1: 1 });
  });

  it('bleibt bei den Voreinstellungen unverändert (Krokodil 1–3)', () => {
    expect(modeKWeights('original')).toEqual(DEFAULT_K_WEIGHTS);
  });

  it('gibt für das Krokodil dieselben Gewichte wie die Voreinstellung zurück', () => {
    expect(creatureKWeights(getCreature('crocodile'), 'original')).toEqual(DEFAULT_K_WEIGHTS);
    expect(creatureKWeights(getCreature('wolf'), 'original')).toEqual({ 1: 0.5, 2: 0.5 });
  });

  it('verschiebt die Druckverteilung des Wolfes gegenüber dem Krokodil', () => {
    const crocodile = pressPositionDistribution(12, creatureKWeights(getCreature('crocodile'), 'original'));
    const wolf = pressPositionDistribution(12, creatureKWeights(getCreature('wolf'), 'original'));
    expect(crocodile).not.toEqual(wolf);
    // Referenzwerte (12 Zähne, unabhängig nachgerechnet):
    // Krokodil 1-3 scharfe Zähne: P(1. Druck) = 1/6, E[Drücke] = 4,694444
    // Wolf 1-2 scharfe Zähne:      P(1. Druck) = 1/8, E[Drücke] = 5,416667
    expect(crocodile[0]).toBeCloseTo(1 / 6, 12);
    expect(expectedPresses(crocodile)).toBeCloseTo(4.694444444444445, 12);
    expect(wolf[0]).toBeCloseTo(0.125, 12);
    expect(expectedPresses(wolf)).toBeCloseTo(5.416666666666667, 12);
    // Der Wolf beißt seltener früh zu — die Runde dauert länger, mehr Spannung.
    expect(wolf[0] ?? 1).toBeLessThan(crocodile[0] ?? 0);
    expect(expectedPresses(wolf)).toBeGreaterThan(expectedPresses(crocodile));
    // Dafür ist der letzte Zahn beim Wolf häufiger der scharfe (höhere Endspannung).
    expect(wolf[wolf.length - 1] ?? 0).toBeGreaterThan(crocodile[crocodile.length - 1] ?? 0);
  });
});
