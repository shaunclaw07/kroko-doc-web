import { MAX_LIVE_TEETH, type RandomMode } from './teeth';

/** Gewichte über mögliche Anzahlen gleichzeitig scharfer Zähne. */
export type KWeights = Readonly<Record<number, number>>;

export const DEFAULT_K_WEIGHTS: KWeights = { 1: 1 / 3, 2: 1 / 3, 3: 1 / 3 };

export function modeKWeights(mode: RandomMode): KWeights {
  if (mode === 'classic') {
    return { 1: 1 };
  }
  const weights: Record<number, number> = {};
  for (let k = 1; k <= MAX_LIVE_TEETH; k += 1) {
    weights[k] = 1 / MAX_LIVE_TEETH;
  }
  return weights;
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
 */
export function pressPositionDistribution(teeth: number, kWeights: KWeights = DEFAULT_K_WEIGHTS): number[] {
  const dist = new Array<number>(teeth).fill(0);
  for (const [k, weight] of normalized(kWeights)) {
    if (k > teeth) {
      continue;
    }
    const total = binomial(teeth, k);
    if (total === 0) {
      continue;
    }
    for (let j = 1; j <= teeth; j += 1) {
      const rest = teeth - j;
      if (rest < k - 1) {
        continue;
      }
      dist[j - 1] = (dist[j - 1] ?? 0) + (weight * binomial(rest, k - 1)) / total;
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
