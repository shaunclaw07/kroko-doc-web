import type { SessionMarkPort } from '../../core/ports/sessionMark';

/**
 * Marken für die laufende Sitzung. Gibt der Browser den Speicher nicht her (privater Modus,
 * gesperrte Ablage), greift eine Marke im Arbeitsspeicher: der Hinweis kommt dann ebenfalls nur
 * einmal je Sitzung — und das Spiel stürzt nie wegen eines Hinweises ab.
 */
export function browserSessionMarks(store: Storage | null = safeStore()): SessionMarkPort {
  const memory = new Set<string>();
  return {
    has(key: string): boolean {
      try {
        return store ? store.getItem(key) !== null : memory.has(key);
      } catch {
        // Nicht lesbar heißt für uns: schon gezeigt. Lieber kein Hinweis als ein Fehler.
        return true;
      }
    },
    mark(key: string): void {
      try {
        if (store) {
          store.setItem(key, '1');
        } else {
          memory.add(key);
        }
      } catch {
        memory.add(key);
      }
    },
  };
}

function safeStore(): Storage | null {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}
