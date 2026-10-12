import { DEFAULT_CREATURE_ID, getCreature, isKnownCreature, type CreatureDefinition } from './creature';
import {
  creatureKWeights,
  expectedPresses as modelExpectedPresses,
  modeKWeights,
  pressPositionDistribution,
} from './probabilities';
import type { RoundRecord } from './records';
import { DEFAULT_MODE, DEFAULT_TEETH, type RandomMode } from './teeth';
import { survivedDanger } from './tension';

/**
 * Reine Statistik-Helfer fuer die Auswertungsseite: keine DOM-Zugriffe, keine
 * Uhr, kein Zustand — alles ist eine Funktion der Eingaben.
 */

/** Lebewesen einer Runde; fehlt die Kennung (Altdaten) oder ist sie unbekannt, gilt das Krokodil. */
function creatureOfRound(id: string | undefined): CreatureDefinition {
  return getCreature(id !== undefined && isKnownCreature(id) ? id : DEFAULT_CREATURE_ID);
}

/** Die mutigste Runde im Protokoll: die hoechste Bissgefahr, die ueberstanden wurde. */
export interface BravestRound {
  /** Laufende Nummer der Runde (wie im Protokoll). */
  round: number;
  /** Gebiss dieser Runde (Kennung aus dem Katalog). */
  creature: string;
  /** Bissgefahr des letzten harmlosen Drucks, 0..1. */
  danger: number;
}

/**
 * Sucht die Runde mit der hoechsten ueberstandenen Bissgefahr (`survivedDanger`). Die Zahl kommt aus
 * derselben Modellkurve wie der Balken: sie sagt, **was jemand gewagt hat**, nicht ob er Glueck
 * hatte. Runden, in denen schon der erste Druck schnappte, haben nichts ueberstanden und zaehlen
 * nicht; sind alle so, gibt es kein Ergebnis (dann zeigt die Seite einen Strich).
 */
export function bravestRound(records: readonly RoundRecord[]): BravestRound | null {
  let best: BravestRound | null = null;
  for (const record of records) {
    const creature = creatureOfRound(record.creature);
    const danger = survivedDanger({
      pressIndex: record.pressIndex,
      teeth: record.teeth,
      mode: record.mode,
      liveTeethMin: creature.liveTeethMin,
      liveTeethMax: creature.liveTeethMax,
    });
    if (danger > 0 && (best === null || danger > best.danger)) {
      best = { round: record.round, creature: record.creature, danger };
    }
  }
  return best;
}

export interface ChiSquareResult {
  chiSquare: number;
  df: number;
  pValue: number;
  significant: boolean;
}

/** Unterhalb dieser Rundenzahl sind Aussagen ehrlicherweise nicht belastbar. */
export const DEFAULT_MIN_SAMPLE = 30;

/** Obere Signifikanzschwelle fuer "auffaellig". */
const ALPHA = 0.05;
const EPS = 3e-16;
const FPMIN = 1e-300;
const ITMAX = 300;

// ---------------------------------------------------------------- Gammafunktion
// Lanczos-Naeherung (g = 607/128) fuer ln(Gamma(z)); ~1e-16 relativ genau.
const LANCZOS_G = 607 / 128;
const LANCZOS_COEFFS: readonly number[] = [
  0.99999999999999709182, 57.156235665862923517, -59.597960355475491248, 14.136097974741747174,
  -0.49191381609762019978, 0.33994649984811888699e-4, 0.46523628927048575665e-4,
  -0.98374475304879564677e-4, 0.15808870322491248884e-3, -0.21026444172410488319e-3,
  0.2174396181152126432e-3, -0.16431810653676389022e-3, 0.84418223983852743293e-4,
  -0.2619083840158140867e-4, 0.36899182659531622704e-5,
];

/** ln(Gamma(z)). Kein Math.lgamma in dieser Laufzeit verfuegbar. */
function logGamma(z: number): number {
  if (z < 0.5) {
    // Reflexionsformel
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  const shifted = z - 1;
  let sum = LANCZOS_COEFFS[0] ?? 0;
  for (let i = 1; i < LANCZOS_COEFFS.length; i += 1) {
    sum += (LANCZOS_COEFFS[i] ?? 0) / (shifted + i);
  }
  const t = shifted + LANCZOS_G + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(sum);
}

/** Reihenentwicklung fuer die regularisierte untere unvollstaendige Gammafunktion P(a,x). */
function gammaSeries(a: number, x: number): number {
  let ap = a;
  let del = 1 / a;
  let sum = del;
  for (let i = 0; i < ITMAX; i += 1) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * EPS) {
      break;
    }
  }
  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

/** Kettenbruch fuer die regularisierte obere unvollstaendige Gammafunktion Q(a,x). */
function gammaContinuedFraction(a: number, x: number): number {
  let b = x + 1 - a;
  let c = 1 / FPMIN;
  let d = 1 / (x + 1 - a);
  let h = d;
  for (let i = 1; i <= ITMAX; i += 1) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) {
      d = FPMIN;
    }
    c = b + an / c;
    if (Math.abs(c) < FPMIN) {
      c = FPMIN;
    }
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < EPS) {
      break;
    }
  }
  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

/** Regularisierte obere unvollstaendige Gammafunktion Q(a,x). */
function gammaUpper(a: number, x: number): number {
  if (a <= 0 || x < 0) {
    return Number.NaN;
  }
  if (x === 0) {
    return 1;
  }
  return x < a + 1 ? 1 - gammaSeries(a, x) : gammaContinuedFraction(a, x);
}

/** p-Wert = P(Chi2_df >= x) = Q(df/2, x/2). */
export function chiSquareSurvival(x: number, df: number): number {
  if (df <= 0 || x < 0) {
    return Number.NaN;
  }
  return gammaUpper(df / 2, x / 2);
}

/**
 * Chi2-Anpassungstest. `expected` ist entweder 'uniform' (gleiche Erwartung je
 * Zelle) oder ein Wahrscheinlichkeitsvektor. null bei leerer Eingabe, weniger
 * als zwei Zellen oder einer Zelle mit Erwartung <= 0.
 */
export function chiSquareGoodnessOfFit(
  counts: readonly number[],
  expected: readonly number[] | 'uniform',
): ChiSquareResult | null {
  if (counts.length < 2) {
    return null;
  }
  const total = counts.reduce((acc, value) => acc + value, 0);
  if (total <= 0) {
    return null;
  }

  let expectations: number[];
  if (expected === 'uniform') {
    const each = total / counts.length;
    expectations = new Array<number>(counts.length).fill(each);
  } else {
    if (expected.length !== counts.length) {
      return null;
    }
    expectations = expected.map((probability) => probability * total);
  }
  if (expectations.some((value) => !(value > 0))) {
    return null;
  }

  let chiSquare = 0;
  for (let i = 0; i < counts.length; i += 1) {
    const diff = (counts[i] ?? 0) - (expectations[i] ?? 0);
    chiSquare += (diff * diff) / (expectations[i] ?? 1);
  }
  const df = counts.length - 1;
  const pValue = chiSquareSurvival(chiSquare, df);
  return { chiSquare, df, pValue, significant: pValue < ALPHA };
}

/** Wilson-Konfidenzintervall fuer einen Anteil (Standard-z = 1,96 fuer 95 %). */
export function wilsonInterval(
  successes: number,
  trials: number,
  z = 1.96,
): { proportion: number; low: number; high: number } {
  if (trials <= 0) {
    return { proportion: 0, low: 0, high: 0 };
  }
  const proportion = successes / trials;
  const denominator = 1 + (z * z) / trials;
  const middle = (proportion + (z * z) / (2 * trials)) / denominator;
  const half =
    (z * Math.sqrt((proportion * (1 - proportion)) / trials + (z * z) / (4 * trials * trials))) /
    denominator;
  return {
    proportion,
    low: Math.max(0, middle - half),
    high: Math.min(1, middle + half),
  };
}

/** Autokorrelation einer Reihe bei gegebenem Lag; null, wenn zu kurz oder konstant. */
export function autocorrelation(series: readonly number[], lag: number): number | null {
  const n = series.length;
  if (!Number.isInteger(lag) || lag < 1 || n <= lag + 2) {
    return null;
  }
  const mean = series.reduce((acc, value) => acc + value, 0) / n;
  let numerator = 0;
  for (let i = 0; i < n - lag; i += 1) {
    numerator += ((series[i] ?? 0) - mean) * ((series[i + lag] ?? 0) - mean);
  }
  let denominator = 0;
  for (const value of series) {
    denominator += (value - mean) * (value - mean);
  }
  if (denominator === 0) {
    return null;
  }
  return numerator / denominator;
}

/** Zaehlt Werte 1..domain in einen Zaehlvektor (Index 0 -> Wert 1). */
export function countBy(values: readonly number[], domain: number): number[] {
  const size = Number.isInteger(domain) && domain > 0 ? domain : 0;
  const counts = new Array<number>(size).fill(0);
  for (const value of values) {
    if (Number.isInteger(value) && value >= 1 && value <= size) {
      counts[value - 1] = (counts[value - 1] ?? 0) + 1;
    }
  }
  return counts;
}

/** Runden desselben Gebisses: gleiches Lebewesen, gleiche Zahnzahl, gleiches Zufallsmodell. */
export interface RoundGroup<T> {
  creature: string;
  teeth: number;
  mode: RandomMode;
  rounds: T[];
}

/**
 * Teilt ein Protokoll in Gruppen gleichen Gebisses — die größte zuerst, bei Gleichstand die zuerst
 * gespielte. **Nur innerhalb einer Gruppe** gelten Gleichverteilung und Zugmodell: wer Krokodil
 * (10 Zähne), Maus (6) und Wolf (12) zusammenwirft, prüft drei Verteilungen gegen eine und bekommt
 * „auffällig", obwohl jede für sich fair ist (nachgerechnet am 12.10.2026 mit 300 fairen Runden:
 * Zahn-Test p = 6e-13, Modell-Test p = 1e-5).
 */
export function groupRounds<T extends { mode: RandomMode; teeth: number; creature?: string }>(
  rounds: readonly T[],
): RoundGroup<T>[] {
  const groups = new Map<string, RoundGroup<T>>();
  for (const round of rounds) {
    const creature = creatureOfRound(round.creature).id;
    const key = `${creature}|${round.teeth}|${round.mode}`;
    const group = groups.get(key);
    if (group) {
      group.rounds.push(round);
    } else {
      groups.set(key, { creature, teeth: round.teeth, mode: round.mode, rounds: [round] });
    }
  }
  // Array.prototype.sort ist stabil: bei gleicher Größe bleibt die Reihenfolge des ersten Auftretens.
  return [...groups.values()].sort((a, b) => b.rounds.length - a.rounds.length);
}

export interface SessionReport {
  rounds: number;
  teeth: number;
  /** Gebiss, gegen das gerechnet wurde (Kennung aus dem Katalog) — die Anzeige nennt es. */
  creature: string;
  mode: RandomMode;
  /** Verteilung der Druck-Position nach dem Zugmodell — dieselbe, gegen die `modelTest` prüft. */
  model: number[];
  countsByTooth: number[];
  countsByPressIndex: number[];
  toothTest: ChiSquareResult | null;
  pressIndexTest: ChiSquareResult | null;
  modelTest: ChiSquareResult | null;
  autocorrelations: Array<{ lag: number; value: number | null; remarkable: boolean }>;
  mostLikelyTooth: number | null;
  expectedPresses: number;
  observedPresses: number;
}

const AUTOCORRELATION_LAGS: readonly number[] = [1, 2, 3, 4, 5, 6];

/** Sechs Versätze werden zugleich geprüft: z für 5 % ÷ 6 (zweiseitig), sonst schlägt bei fairen
 *  Daten rund jede vierte Auswertung allein durch die Mehrfachprüfung an. */
const AUTOCORRELATION_Z = 2.64;

/**
 * Baut den Bericht aus Runden **eines** Gebisses (siehe `groupRounds`): Lebewesen und Modus
 * kommen aus der ersten Runde, die Zahnzahl ist die größte. Unterhalb `minSample` Runden bleiben
 * Chi2-Tests und Mustersuche aus — ehrlicher als eine Aussage auf zu duennem Datenfundament.
 */
export function analyseSession(
  rounds: readonly {
    mode: RandomMode;
    teeth: number;
    loserTooth: number;
    pressIndex: number;
    /** Gebiss der Runde; fehlt es (Altdaten), gilt das Krokodil. */
    creature?: string;
  }[],
  minSample = DEFAULT_MIN_SAMPLE,
): SessionReport {
  const sample = rounds.length;
  const teeth = rounds.reduce((max, round) => Math.max(max, round.teeth), 0) || DEFAULT_TEETH;
  const mode = rounds[0]?.mode ?? DEFAULT_MODE;
  const enough = sample >= minSample;

  const loserTeeth = rounds.map((round) => round.loserTooth);
  const pressIndices = rounds.map((round) => round.pressIndex);

  const countsByTooth = countBy(loserTeeth, teeth);
  const countsByPressIndex = countBy(pressIndices, teeth);

  const creature = creatureOfRound(rounds[0]?.creature);
  const model = pressPositionDistribution(teeth, creatureKWeights(creature, mode, teeth));

  const toothTest = enough ? chiSquareGoodnessOfFit(countsByTooth, 'uniform') : null;
  // Gleichverteilt ist die Druck-Position nur bei genau einem scharfen Zahn. Im Originalmodell
  // schnappt es vorne öfter — der Test wäre dort bei fairen Daten immer „auffällig".
  const pressIndexTest =
    enough && mode === 'classic' ? chiSquareGoodnessOfFit(countsByPressIndex, 'uniform') : null;
  const modelTest = enough ? chiSquareGoodnessOfFit(countsByPressIndex, model) : null;

  const band = sample > 0 ? AUTOCORRELATION_Z / Math.sqrt(sample) : 0;
  const autocorrelations = enough
    ? AUTOCORRELATION_LAGS.map((lag) => {
        const value = autocorrelation(pressIndices, lag);
        return { lag, value, remarkable: value !== null && Math.abs(value) > band };
      })
    : [];

  let mostLikelyTooth: number | null = null;
  let bestCount = 0;
  countsByTooth.forEach((count, index) => {
    if (count > bestCount) {
      bestCount = count;
      mostLikelyTooth = index + 1;
    }
  });

  const observedPresses =
    sample > 0 ? pressIndices.reduce((acc, value) => acc + value, 0) / sample : 0;

  return {
    rounds: sample,
    teeth,
    creature: creature.id,
    mode,
    model,
    countsByTooth,
    countsByPressIndex,
    toothTest,
    pressIndexTest,
    modelTest,
    autocorrelations,
    mostLikelyTooth,
    expectedPresses: modelExpectedPresses(model),
    observedPresses,
  };
}

/**
 * Kurzes deutsches Fazit für die Statistikseite. Ein Test, der nicht lief (`null` — etwa bei einem
 * einzigen Zahn), bekommt **keinen** Freispruch: „passt zu den Daten" darf nur dastehen, wenn
 * geprüft wurde.
 */
export function verdict(report: SessionReport, minSample = DEFAULT_MIN_SAMPLE): string {
  if (report.rounds < minSample) {
    return `Noch zu wenig Daten: erst ${report.rounds} Runden, belastbare Aussagen ab ${minSample}.`;
  }

  const sentences: string[] = [];

  if (report.toothTest === null) {
    sentences.push('Die Verlierer-Zähne lassen sich bei diesem Gebiss nicht prüfen.');
  } else {
    sentences.push(
      report.toothTest.significant
        ? 'Die Verlierer-Zähne sind auffällig ungleich verteilt (p < 0,05).'
        : 'Die Verlierer-Zähne sind mit der Gleichverteilung vereinbar.',
    );
  }
  // Nur im Modus „genau ein Zahn" gibt es diesen Test — dort ist die Druck-Nummer gleichverteilt.
  if (report.pressIndexTest !== null) {
    sentences.push(
      report.pressIndexTest.significant
        ? 'Die Druck-Nummer ist auffällig ungleich verteilt (p < 0,05).'
        : 'Die Druck-Nummer ist mit der Gleichverteilung vereinbar.',
    );
  }
  if (report.modelTest === null) {
    sentences.push('Das Zugmodell lässt sich bei diesem Gebiss nicht prüfen.');
  } else {
    sentences.push(
      report.modelTest.significant ? 'Das Zugmodell passt nicht zu den Daten.' : 'Das Zugmodell passt zu den Daten.',
    );
  }

  const remarkable = report.autocorrelations.filter((entry) => entry.remarkable);
  sentences.push(
    report.autocorrelations.every((entry) => entry.value === null)
      ? 'Eine Mustersuche ist bei diesen Daten nicht möglich.'
      : remarkable.length > 0
        ? `Auffällige Autokorrelation bei Versatz ${remarkable.map((entry) => entry.lag).join(', ')} — ein Muster ist nicht ausgeschlossen.`
        : 'Keine auffällige Autokorrelation — kein erkennbares Muster.',
  );

  if (report.mostLikelyTooth !== null) {
    sentences.push(`Häufigster Verlierer-Zahn: ${report.mostLikelyTooth}.`);
  }

  return sentences.join(' ');
}
