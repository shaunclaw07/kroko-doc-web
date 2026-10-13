/**
 * Was der Browser über die Haltbarkeit der Ablage sagt: `persistent` heißt, er räumt sie nicht von
 * selbst weg; `best-effort` heißt, er darf es, wenn der Platz knapp wird; `unknown` heißt, er
 * kennt die Schnittstelle nicht oder antwortet nicht.
 */
export type PersistenceState = 'persistent' | 'best-effort' | 'unknown';

/** Navigatorschnittstelle, die wir brauchen — absichtlich schmal gehalten. */
export interface PersistenceCapable {
  storage?: {
    persist?: () => Promise<boolean>;
    persisted?: () => Promise<boolean>;
  };
}

/**
 * Bittet den Browser, die Ablage (Runden, Sterne, Einstellungen) dauerhaft zu halten.
 *
 * Ohne diese Bitte gilt sie als „best effort": bei knappem Gerätespeicher darf der Browser sie
 * leeren. Chromium entscheidet still nach eigenen Regeln, Firefox fragt den Nutzer einmal. Gegen
 * ein Profil, das seine Daten **absichtlich** verwirft (privater Tab, Kinderprofil), hilft auch
 * eine Zusage nicht — deshalb zeigt die Statistikseite die Antwort, statt sie zu verschweigen.
 */
export async function requestPersistence(
  navigatorLike: PersistenceCapable | null = typeof navigator === 'undefined' ? null : navigator,
): Promise<PersistenceState> {
  const storage = navigatorLike?.storage;
  if (typeof storage?.persist !== 'function') {
    return 'unknown';
  }
  try {
    if (typeof storage.persisted === 'function' && (await storage.persisted())) {
      return 'persistent';
    }
    return (await storage.persist()) ? 'persistent' : 'best-effort';
  } catch {
    // Die Zusage ist ein Extra — sie darf das Spiel nie anhalten.
    return 'unknown';
  }
}
