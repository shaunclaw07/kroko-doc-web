import type { RoundRecord } from '../domain/records';
import { mergeRoundLogs } from '../domain/sessionLog';
import type { RemoteLogPort } from '../ports/remoteLog';
import type { RoundLogPort } from '../ports/roundLog';

export interface SyncResult {
  /** Runden nach dem Abgleich — auf dem Gerät und in der Sicherung dieselben. */
  rounds: number;
  /** Hat der Abgleich die Ablage des Geräts verändert? Dann muss die Anzeige nachziehen. */
  localChanged: boolean;
}

/**
 * Gleicht die Ablage des Geräts mit der Sicherung ab: holen, zusammenführen, beide Seiten auf
 * denselben Stand bringen. Geschrieben wird nur, wo sich etwas ändert.
 *
 * Die Ablage wird erst **nach** dem Abruf gelesen und ohne weitere Wartezeit geschrieben: eine
 * Runde, die während des Abrufs zu Ende ging, wäre sonst mit dem alten Stand überschrieben.
 */
export async function syncRoundLog(local: RoundLogPort, remote: RemoteLogPort): Promise<SyncResult> {
  const theirs = await remote.pull();
  const mine = local.load();
  const merged = mergeRoundLogs(mine, theirs);
  const localChanged = !sameLog(merged, mine);
  if (localChanged) {
    local.save(merged);
  }
  if (merged.length !== theirs.length) {
    await remote.push(merged);
  }
  return { rounds: merged.length, localChanged };
}

function sameLog(a: readonly RoundRecord[], b: readonly RoundRecord[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
