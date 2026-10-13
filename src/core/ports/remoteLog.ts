import type { RoundRecord } from '../domain/records';

/**
 * Sicherung des Rundenprotokolls außerhalb des Geräts. Beide Aufrufe werfen, wenn die Sicherung
 * nicht erreichbar ist oder den Code nicht kennt — wer sie ruft, entscheidet, was dann gilt.
 */
export interface RemoteLogPort {
  pull(): Promise<RoundRecord[]>;
  push(records: readonly RoundRecord[]): Promise<void>;
}
