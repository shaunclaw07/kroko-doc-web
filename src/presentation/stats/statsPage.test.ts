// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RoundRecord } from '../../contract/sessionLog';
import type { RoundLogPort } from '../../core/ports/roundLog';
import { STORAGE_KEY } from '../../infrastructure/storage/localStorageLog';
import { DEFAULT_SETTINGS, type GameSettings } from '../../core/domain/settings';
import type { Backup } from '../game/backupSync';
import { wireStatsPage } from './statsPage';

const DOM = `
  <div id="report-mount"></div>
  <div id="danger-mount"></div>
  <button type="button" id="export-csv">CSV exportieren</button>
  <button type="button" id="toggle-import">CSV importieren</button>
  <button type="button" id="clear-log">Protokoll löschen</button>
  <div id="import-area" class="hidden">
    <textarea id="import-text"></textarea>
    <button type="button" id="import-run">Importieren</button>
    <span id="import-status"></span>
  </div>
  <p id="data-status"></p>
  <p id="storage-status"></p>
  <p id="backup-status" hidden></p>
`;

class MemoryLog implements RoundLogPort {
  records: RoundRecord[] = [];
  load(): RoundRecord[] {
    return [...this.records];
  }
  save(records: readonly RoundRecord[]): void {
    this.records = [...records];
  }
  clear(): void {
    this.records = [];
  }
}

function sampleRecord(round: number): RoundRecord {
  return {
    round,
    playedAt: '2026-10-14T10:00:00.000Z',
    creature: 'crocodile',
    teeth: 10,
    mode: 'original',
    players: 1,
    loserTooth: 5,
    pressIndex: 3,
    liveCount: 1,
    pressOrder: [1, 2, 5],
  };
}

describe('statsPage', () => {
  let log: MemoryLog;
  let backup: { sync: ReturnType<typeof vi.fn>; replace: ReturnType<typeof vi.fn> };
  let confirmMock = vi.fn((_msg: string) => true);
  let downloadMock = vi.fn((_name: string, _text: string) => {});

  beforeEach(() => {
    document.body.innerHTML = DOM;
    log = new MemoryLog();
    backup = {
      sync: vi.fn().mockResolvedValue(undefined),
      replace: vi.fn().mockResolvedValue(undefined),
    };
    confirmMock = vi.fn((_msg: string) => true);
    downloadMock = vi.fn((_name: string, _text: string) => {});
  });

  function setup(settings: Partial<GameSettings> = {}) {
    wireStatsPage({
      doc: document,
      win: window,
      log,
      settings: { ...DEFAULT_SETTINGS, ...settings },
      backup: backup as unknown as Backup,
      confirm: confirmMock,
      download: downloadMock,
      today: () => '2026-10-14',
    });
  }

  it('Import hängt an und zählt die Rundennummern weiter', () => {
    log.records = [sampleRecord(1), sampleRecord(2)];
    setup();

    const textarea = document.getElementById('import-text') as HTMLTextAreaElement;
    textarea.value = 'runde;reihenfolge;verlierer_zahn\n1;3-4;4\n2;1-2-5;5';

    document.getElementById('import-run')?.click();

    expect(log.records.length).toBe(4);
    expect(log.records[2]?.round).toBe(3);
    expect(log.records[3]?.round).toBe(4);

    expect(document.getElementById('import-status')?.textContent).toBe('2 Runden importiert.');
    expect(backup.sync).toHaveBeenCalled();
  });

  it('meldet „Keine gültigen Zeilen gefunden.“, wenn Import fehlschlägt', () => {
    setup();

    const textarea = document.getElementById('import-text') as HTMLTextAreaElement;
    textarea.value = 'irgendwas ohne sinn';

    document.getElementById('import-run')?.click();

    expect(document.getElementById('import-status')?.textContent).toBe('Keine gültigen Zeilen gefunden.');
    expect(log.records.length).toBe(0);
  });

  it('Löschen fragt nach, leert und ersetzt die Sicherung (replace([]), nicht sync)', () => {
    log.records = [sampleRecord(1), sampleRecord(2)];
    setup();

    document.getElementById('clear-log')?.click();

    expect(confirmMock).toHaveBeenCalled();
    expect(log.records.length).toBe(0);
    expect(backup.replace).toHaveBeenCalledWith([]);
  });

  it('Löschen bricht ab, wenn Bestätigung verneint wird', () => {
    log.records = [sampleRecord(1)];
    confirmMock.mockReturnValue(false);
    setup();

    document.getElementById('clear-log')?.click();

    expect(confirmMock).toHaveBeenCalled();
    expect(log.records.length).toBe(1);
    expect(backup.replace).not.toHaveBeenCalled();
  });

  it('ein storage-Ereignis rechnet den Bericht neu', () => {
    setup();
    expect(document.getElementById('data-status')?.textContent).toBe('0 von 100 Runden für eine belastbare Aussage.');

    log.records = [sampleRecord(1)];
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));

    expect(document.getElementById('data-status')?.textContent).toBe('1 von 100 Runden für eine belastbare Aussage.');
  });

  it('exportiert CSV unter zahn-agent-runden-<datum>.csv', () => {
    log.records = [sampleRecord(1)];
    setup();

    document.getElementById('export-csv')?.click();

    expect(downloadMock).toHaveBeenCalledWith(
      'zahn-agent-runden-2026-10-14.csv',
      expect.stringContaining('runde;reihenfolge;verlierer_zahn'),
    );
    expect(document.getElementById('data-status')?.textContent).toBe('CSV exportiert.');
  });
});
