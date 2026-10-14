import type { RoundRecord } from '../../contract/sessionLog';
import { createRoundRecord, nextRoundNumber } from '../../core/domain/sessionLog';
import type { RoundState } from '../../core/domain/round';
import type { RoundLogPort } from '../../core/ports/roundLog';
import type { LogFeed } from './logFeed';

export interface RoundRecorderDeps {
  log: RoundLogPort;
  feed?: LogFeed;
  /** Liefert den Zeitstempel für den Protokolleintrag. Standard ist `new Date()`. */
  clock?: () => Date;
}

export interface RoundRecorder {
  record(round: RoundState): RoundRecord | null;
  sync(): void;
  count(): number;
  records(): readonly RoundRecord[];
}

/**
 * Führt das Protokoll der gespielten Runden. Liest unmittelbar vor dem Anhängen
 * neu aus dem Speicher (die Regel „wer zurückschreibt, liest vorher“), damit
 * Änderungen aus anderen Tabs oder Importe nicht überschrieben werden.
 */
export function createRoundRecorder(deps: RoundRecorderDeps): RoundRecorder {
  const { log, feed, clock = () => new Date() } = deps;
  let currentRecords = log.load();

  return {
    record(round: RoundState): RoundRecord | null {
      const loser = round.loser;
      if (!loser) {
        return null;
      }
      // Erst lesen, dann anhängen: die Statistikseite (anderer Tab, oder vor der Zurück-Taste) kann
      // das Protokoll inzwischen gelöscht oder per Import erweitert haben. Mit dem Stand vom
      // Seitenstart überschrieb das Spiel beides (gemessen am 12.10.2026: 3 gelöschte Runden waren
      // wieder da, 5 importierte weg).
      currentRecords = log.load();
      const record = createRoundRecord({
        round: nextRoundNumber(currentRecords),
        playedAt: clock().toISOString(),
        mode: round.mode,
        creature: round.creatureId,
        teeth: round.teeth,
        players: round.players,
        loserTooth: loser.tooth,
        pressIndex: loser.pressIndex,
        liveCount: loser.liveCount,
        pressOrder: round.pressOrder,
      });
      currentRecords.push(record);
      log.save(currentRecords);
      feed?.roundFinished();
      return record;
    },

    sync(): void {
      currentRecords = log.load();
    },

    count(): number {
      return currentRecords.length;
    },

    records(): readonly RoundRecord[] {
      return [...currentRecords];
    },
  };
}
