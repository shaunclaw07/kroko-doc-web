import type { RoundRecord } from '../domain/records';

/** Ablage der Runden (im Browser: localStorage). */
export interface RoundLogPort {
  load(): RoundRecord[];
  save(records: readonly RoundRecord[]): void;
  clear(): void;
}
