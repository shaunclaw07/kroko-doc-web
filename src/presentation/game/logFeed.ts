/**
 * Meldet Änderungen am Rundenprotokoll an die Bedienung.
 *
 * Fachliche Unterscheidung (docs/freischaltung.md, „Tiere freischalten"):
 * - `roundFinished`: nach einem eigenen Biss — Album kündigt neue Sterne an, zeigt die Karte
 *   des freigeschalteten Tiers und lässt Konfetti regnen.
 * - `changedOutside`: aus einem anderen Tab, über die Zurück-Taste oder durch den Abgleich
 *   der Sicherung — Album und Steuerung ziehen nach, aber die Tiere öffnen sich still
 *   (kein Konfetti, keine Karte).
 */

export type LogFeedEvent = 'round-finished' | 'changed-outside';

export type LogFeedListener = (event: LogFeedEvent) => void;

export interface LogFeed {
  /** Ein eigener Biss hat die Runde beendet und das Protokoll fortgeschrieben. */
  roundFinished(): void;
  /** Das Protokoll wurde außerhalb der laufenden Steuerung geändert. */
  changedOutside(): void;
  /** Meldet einen Zuhörer an. Gibt die Abmeldefunktion zurück. */
  subscribe(listener: LogFeedListener): () => void;
}

export function createLogFeed(): LogFeed {
  const listeners = new Set<LogFeedListener>();

  const notify = (event: LogFeedEvent): void => {
    for (const listener of [...listeners]) {
      listener(event);
    }
  };

  return {
    roundFinished(): void {
      notify('round-finished');
    },
    changedOutside(): void {
      notify('changed-outside');
    },
    subscribe(listener: LogFeedListener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
