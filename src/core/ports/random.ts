/** Zufallsquelle des Kerns — die Umgebung liefert die Umsetzung, der Kern nie. */
export interface RandomSource {
  /** Gleichverteilte Zahl in [0, 1). */
  next(): number;
  /** Gleichverteilte ganze Zahl in [0, maxExclusive). */
  uniformInt(maxExclusive: number): number;
}
