import { describe, expect, it } from 'vitest';
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
