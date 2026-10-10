import type { RandomMode } from '../domain/teeth';
import type { RandomSource } from './random';

/** Anfrage an die Auswahl: welche Grenzen gelten für dieses Gebiss? */
export interface LiveTeethRequest {
  rng: RandomSource;
  teeth: number;
  mode: RandomMode;
  /** Untere Grenze gleichzeitig scharfer Zähne (aus dem Gebiss des Lebewesens). */
  min: number;
  /** Obere Grenze gleichzeitig scharfer Zähne. */
  max: number;
}

/** Stellt fest, welche Zähne in einer Runde "scharf" sind (löst das Zuschnappen aus). */
export interface LiveTeethSelector {
  select(request: LiveTeethRequest): number[];
}
