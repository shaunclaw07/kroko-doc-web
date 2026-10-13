import type { RoundRecord } from '../../core/domain/records';
import { isPlausibleRecord } from '../../core/domain/sessionLog';
import type { RemoteLogPort } from '../../core/ports/remoteLog';
import type { StorageLike } from './localStorageLog';

/** Unter diesem Schlüssel merkt sich das Gerät den Sicherungscode, solange es seine Ablage behält. */
export const BACKUP_CODE_KEY = 'zahn_agent:backup-code';
/** So sieht ein Sicherungscode aus — dieselbe Regel wie im Worker (`worker/backup.js`). */
const CODE_PATTERN = /^[a-z0-9-]{12,64}$/;

/**
 * Der Sicherungscode dieser Sitzung, oder `null`: dann gibt es keine Sicherung und die Seite
 * verhält sich wie immer.
 *
 * Er kommt aus der Adresse (`?s=…`). Die steht außerhalb der Ablage und übersteht deshalb ein
 * Profil, das seine Browserdaten verwirft. Die Verweise zwischen Spiel und Statistik tragen ihn
 * nicht — dafür wird er zusätzlich abgelegt und gilt weiter, bis das Profil die Ablage leert.
 */
export function backupCode(search: string, storage: StorageLike | null): string | null {
  const fromAddress = new URLSearchParams(search).get('s');
  if (fromAddress !== null && CODE_PATTERN.test(fromAddress)) {
    try {
      storage?.setItem(BACKUP_CODE_KEY, fromAddress);
    } catch {
      // Gesperrte Ablage: der Code gilt dann nur für diese Seite.
    }
    return fromAddress;
  }
  try {
    const stored = storage?.getItem(BACKUP_CODE_KEY) ?? null;
    return stored !== null && CODE_PATTERN.test(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Adresse der Sicherung — über den Basis-Pfad, wie jeder Verweis der Seite. */
export function backupUrl(baseUrl: string, code: string): string {
  return `${baseUrl}api/log/${code}`;
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/** Sicherung über den Worker (`worker/backup.js`): ein Protokoll je Code, als JSON-Liste. */
export class HttpRemoteLog implements RemoteLogPort {
  constructor(
    private readonly url: string,
    // Über einen Pfeil aufrufen: der Browser verlangt `this === window`.
    private readonly fetchFunction: FetchLike = (url, init) => fetch(url, init),
  ) {}

  async pull(): Promise<RoundRecord[]> {
    const response = await this.fetchFunction(this.url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`backup pull failed: ${response.status}`);
    }
    const parsed: unknown = await response.json();
    if (!Array.isArray(parsed)) {
      throw new Error('backup pull failed: not a list');
    }
    // Was von außen kommt, geht durch dieselbe Prüfung wie CSV und Ablage.
    return parsed.filter(isPlausibleRecord);
  }

  async push(records: readonly RoundRecord[]): Promise<void> {
    const response = await this.fetchFunction(this.url, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(records),
    });
    if (!response.ok) {
      throw new Error(`backup push failed: ${response.status}`);
    }
  }
}
