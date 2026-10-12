import type { RoundRecord } from '../../core/domain/records';
import { isPlausibleRecord } from '../../core/domain/sessionLog';
import type { RoundLogPort } from '../../core/ports/roundLog';

export const STORAGE_KEY = 'zahn_agent:rounds:v1';
/**
 * Schlüssel der früheren Fassungen, jüngster zuerst — beim Lesen wird der erste
 * gefundene einmalig unter dem neuen Namen abgelegt, damit keine Runden verloren gehen.
 */
export const LEGACY_STORAGE_KEYS = ['zahn-agent:rounds:v1', 'kroko-doc-web:rounds:v1'] as const;
/** Nur der jüngste frühere Schlüssel (Tests, Doku). */
export const LEGACY_STORAGE_KEY: string = LEGACY_STORAGE_KEYS[0];

/** Minimale Storage-Schnittstelle — window.localStorage in echt, ein Objekt in Tests. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Ablage der Runden. Fällt auf den Arbeitsspeicher zurück, wenn der Browser blockt. */
export class LocalStorageRoundLog implements RoundLogPort {
  private fallback: RoundRecord[] = [];
  /**
   * Das letzte Schreiben ist gescheitert (volle Ablage): bis es wieder klappt, gilt der
   * Arbeitsspeicher. Die Steuerung liest vor jedem Anhängen — aus der Ablage käme sonst der alte
   * Stand zurück, und jede Runde seit dem Fehlschlag ginge beim nächsten Biss verloren.
   */
  private unsaved = false;

  constructor(private readonly storage: StorageLike | null) {}

  load(): RoundRecord[] {
    const raw = this.unsaved ? null : this.read();
    if (raw === null) {
      return [...this.fallback];
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      // Was kein Protokolleintrag ist (fremde Fassung, von Hand verändert), wird übergangen.
      return Array.isArray(parsed) ? parsed.filter(isPlausibleRecord) : [];
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
      this.unsaved = false;
    } catch {
      // Privater Modus oder voller Speicher: dann eben nur im Arbeitsspeicher.
      this.unsaved = true;
    }
  }

  clear(): void {
    this.fallback = [];
    this.unsaved = false;
    try {
      this.storage?.removeItem(STORAGE_KEY);
      // Auch die früheren Fassungen: `read()` übernähme sie sonst beim nächsten Lesen erneut, und
      // die gelöschten Runden wären wieder da.
      for (const key of LEGACY_STORAGE_KEYS) {
        this.storage?.removeItem(key);
      }
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
      // Einmalige Übernahme aus einer früheren Fassung (anderer Name, gleiche Daten):
      // wer schon Runden gespielt hat, verliert sie beim Umbenennen nicht.
      for (const key of LEGACY_STORAGE_KEYS) {
        const older = this.storage.getItem(key);
        if (older !== null) {
          this.storage.setItem(STORAGE_KEY, older);
          return older;
        }
      }
      return null;
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
