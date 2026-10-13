import type { RoundRecord } from '../../core/domain/records';
import type { RemoteLogPort } from '../../core/ports/remoteLog';
import type { RoundLogPort } from '../../core/ports/roundLog';
import { syncRoundLog } from '../../core/use-cases/syncRoundLog';

/** Was der letzte Abgleich ergeben hat. */
export type BackupStatus = { state: 'saved'; rounds: number } | { state: 'failed' };

export interface Backup {
  /** Gerät und Sicherung auf denselben Stand bringen. */
  sync(): Promise<void>;
  /** Die Sicherung durch diesen Stand ersetzen — nur fürs Löschen, sonst käme alles zurück. */
  replace(records: readonly RoundRecord[]): Promise<void>;
}

export interface BackupOptions {
  local: RoundLogPort;
  remote: RemoteLogPort;
  /** Der Abgleich hat die Ablage des Geräts verändert: die Anzeige zieht nach. */
  onLocalChange?: () => void;
  onStatus?: (status: BackupStatus) => void;
}

/**
 * Die Sicherung der Runden außerhalb des Geräts. Sie ist ein Extra wie Ton und Vibration: ein
 * Fehler daraus wird gemeldet (`onStatus`), aber das Spiel hält davon nie an.
 *
 * Abgleiche laufen **nacheinander**: zwei nebeneinander läsen beide den alten Stand der Sicherung,
 * und der langsamere schriebe ihn über den neuen.
 */
export function wireBackup(options: BackupOptions): Backup {
  let queue: Promise<void> = Promise.resolve();
  const enqueue = (job: () => Promise<number>): Promise<void> => {
    queue = queue.then(async () => {
      let status: BackupStatus;
      try {
        // Erst ausführen, dann melden: im Argument eines `?.()`-Aufrufs liefe der Auftrag ohne
        // Zuhörer gar nicht — die Spielseite hat keinen.
        status = { state: 'saved', rounds: await job() };
      } catch {
        status = { state: 'failed' };
      }
      options.onStatus?.(status);
    });
    return queue;
  };
  return {
    sync: () =>
      enqueue(async () => {
        const result = await syncRoundLog(options.local, options.remote);
        if (result.localChanged) {
          options.onLocalChange?.();
        }
        return result.rounds;
      }),
    replace: (records) =>
      enqueue(async () => {
        await options.remote.push(records);
        return records.length;
      }),
  };
}

/** Der Satz zur Sicherung auf der Statistikseite. */
export function backupNote(status: BackupStatus): string {
  if (status.state === 'failed') {
    return 'Sicherung: nicht erreichbar — die Runden liegen vorerst nur auf diesem Gerät.';
  }
  return status.rounds === 1
    ? 'Sicherung: 1 Runde liegt auch außerhalb dieses Geräts.'
    : `Sicherung: ${status.rounds} Runden liegen auch außerhalb dieses Geräts.`;
}
