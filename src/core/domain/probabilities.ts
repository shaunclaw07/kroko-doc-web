import type { CreatureDefinition } from './creature';
import { MAX_LIVE_TEETH, type RandomMode } from './teeth';

/** Gewichte über mögliche Anzahlen gleichzeitig scharfer Zähne. */
export type KWeights = Readonly<Record<number, number>>;

export const DEFAULT_K_WEIGHTS: KWeights = { 1: 1 / 3, 2: 1 / 3, 3: 1 / 3 };

/**
 * Gewichte über die Anzahl gleichzeitig scharfer Zähne.
 * Die Grenzen kommen aus dem Gebiss des Lebewesens (Krokodil 1–3, Wolf 1–2 …).
 */
export function modeKWeights(mode: RandomMode, min = 1, max = MAX_LIVE_TEETH): KWeights {
  if (mode === 'classic') {
    return { 1: 1 };
  }
  const lowest = Math.max(1, Math.floor(min));
  const highest = Math.max(lowest, Math.floor(max));
  const weights: Record<number, number> = {};
  const span = highest - lowest + 1;
  for (let k = lowest; k <= highest; k += 1) {
    weights[k] = 1 / span;
  }
  return weights;
}

/** Gewichte für ein Lebewesen aus dem Katalog. */
export function creatureKWeights(creature: CreatureDefinition, mode: RandomMode): KWeights {
  return modeKWeights(mode, creature.liveTeethMin, creature.liveTeethMax);
}

/** Binomialkoeffizient (iterativ, exakt für die hier vorkommenden kleinen n). */
export function binomial(n: number, k: number): number {
  if (k < 0 || n < 0 || k > n) {
    return 0;
  }
  const kk = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= kk; i += 1) {
    result = (result * (n - kk + i)) / i;
  }
  return Math.round(result);
}

function normalized(kWeights: KWeights): Array<[number, number]> {
  const entries = Object.entries(kWeights)
    .map(([k, w]) => [Number(k), w] as [number, number])
    .filter(([k, w]) => Number.isFinite(k) && k >= 1 && w > 0);
  const sum = entries.reduce((acc, [, w]) => acc + w, 0);
  return sum > 0 ? entries.map(([k, w]) => [k, w / sum] as [number, number]) : [];
}

/**
 * Verteilung der Druck-Nummer, bei der das Maul zuschnappt.
 * P(J = j | k scharfe Zähne) = C(n-j, k-1) / C(n, k), gemittelt über k.
 *
 * `k` wird dabei auf die Zahnzahl **gekappt** — genau wie die Auswahl der scharfen Zähne es tut
 * (`liveTeeth.ts`: `Math.min(min, teeth, MAX_LIVE_TEETH)`). Vorher fiel jedes k über der Zahnzahl
 * ganz weg; bei einem Ein-Zahn-Gebiss (seit 11.10.2026 möglich) zeigte die Statistik dadurch
 * „Erwartet 0,33" statt 1 — gefunden vom fremden Prüfer, nicht von den Tests.
 */
export function pressPositionDistribution(teeth: number, kWeights: KWeights = DEFAULT_K_WEIGHTS): number[] {
  const dist = new Array<number>(teeth).fill(0);
  for (const [k, weight] of normalized(kWeights)) {
    const live = Math.min(k, teeth);
    if (live < 1) {
      continue;
    }
    const total = binomial(teeth, live);
    if (total === 0) {
      continue;
    }
    for (let j = 1; j <= teeth; j += 1) {
      const rest = teeth - j;
      if (rest < live - 1) {
        continue;
      }
      dist[j - 1] = (dist[j - 1] ?? 0) + (weight * binomial(rest, live - 1)) / total;
    }
  }
  return dist;
}

/** Erwartete Zahl von Drücken bis zum Zuschnappen. */
export function expectedPresses(distribution: readonly number[]): number {
  return distribution.reduce((acc, p, index) => acc + p * (index + 1), 0);
}

/** P(Runde läuft noch), gemessen vor dem j-ten Druck: Eintrag 1 = vor dem ersten Druck. */
export function survivalCurve(distribution: readonly number[]): number[] {
  const curve: number[] = [1];
  let remaining = 1;
  for (const p of distribution) {
    remaining -= p;
    curve.push(Math.max(0, remaining));
  }
  return curve;
}

/** P(Spieler i verliert) bei reihum je einem Druck, i = 1..players. */
export function playerLoserProbabilities(
  teeth: number,
  players: number,
  kWeights: KWeights = DEFAULT_K_WEIGHTS,
): number[] {
  const dist = pressPositionDistribution(teeth, kWeights);
  const probabilities = new Array<number>(players).fill(0);
  dist.forEach((p, index) => {
    const slot = (index % players + players) % players;
    probabilities[slot] = (probabilities[slot] ?? 0) + p;
  });
  return probabilities;
}
