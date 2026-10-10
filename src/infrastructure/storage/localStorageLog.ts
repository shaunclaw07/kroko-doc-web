import type { RoundRecord } from '../../core/domain/records';
import type { RoundLogPort } from '../../core/ports/roundLog';

export const STORAGE_KEY = 'zahn-agent:rounds:v1';
/** Schlüssel der früheren Fassung — wird beim Lesen einmalig übernommen. */
export const LEGACY_STORAGE_KEY = 'kroko-doc-web:rounds:v1';

/** Minimale Storage-Schnittstelle — window.localStorage in echt, ein Objekt in Tests. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Ablage der Runden. Fällt auf den Arbeitsspeicher zurück, wenn der Browser blockt. */
export class LocalStorageRoundLog implements RoundLogPort {
  private fallback: RoundRecord[] = [];

  constructor(private readonly storage: StorageLike | null) {}

  load(): RoundRecord[] {
    const raw = this.read();
    if (raw === null) {
      return [...this.fallback];
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as RoundRecord[]) : [];
    } catch {
      // Kaputte Ablage darf das Spiel nicht anhalten.
      return [];
    }
  }

  save(records: readonly RoundRecord[]): void {
    this.fallback = [...records];
    if (!this.storage) {
      return;
    }
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      // Privater Modus oder voller Speicher: dann eben nur im Arbeitsspeicher.
    }
  }

  clear(): void {
    this.fallback = [];
    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      // siehe save()
    }
  }

  private read(): string | null {
    if (!this.storage) {
      return null;
    }
    try {
      const current = this.storage.getItem(STORAGE_KEY);
      if (current !== null) {
        return current;
      }
      // Einmalige Übernahme aus der früheren Fassung (anderer Name, gleiche Daten):
      // wer schon Runden gespielt hat, verliert sie beim Umbenennen nicht.
      const legacy = this.storage.getItem(LEGACY_STORAGE_KEY);
      if (legacy !== null) {
        this.storage.setItem(STORAGE_KEY, legacy);
      }
      return legacy;
    } catch {
      return null;
    }
  }
}

/** Liefert window.localStorage, oder null wenn es ihn nicht gibt. */
export function browserStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
