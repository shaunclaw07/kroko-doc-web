import { getCreature } from '../../core/domain/creature';
import { fromCsv, toCsv } from '../../core/domain/sessionLog';
import { MAX_TEETH, MIN_TEETH } from '../../core/domain/teeth';
import type { RemoteLogPort } from '../../core/ports/remoteLog';
import type { RoundLogPort } from '../../core/ports/roundLog';
import { STORAGE_KEY } from '../../infrastructure/storage/localStorageLog';
import type { GameSettings } from '../../core/domain/settings';
import type { PersistenceState } from '../../infrastructure/storage/browserPersistence';
import type { Backup } from '../game/backupSync';
import { backupNote, wireBackup } from '../game/backupSync';
import { persistenceNote, renderDangerCurve, renderReport, sampleStatus } from './statsView';

export interface WireStatsPageDeps {
  doc: Document;
  win: Window;
  log: RoundLogPort;
  settings: GameSettings;
  backup?: Backup | null;
  remote?: RemoteLogPort;
  confirm: (message: string) => boolean;
  download: (name: string, text: string) => void;
  today: () => string;
  persistence?: Promise<PersistenceState>;
}

/** Standard-Download im Browser über ein dynamisches Anchor-Element. */
export function browserDownload(name: string, text: string): void {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Verdrahtet die Statistikseite: Gefahr-Kurve, Berichts-Aktualisierung,
 * CSV-Export, CSV-Import, Protokoll löschen, Sicherungsstatus und Speicherprüfung.
 */
export function wireStatsPage(deps: WireStatsPageDeps): void {
  const { doc, win, log, settings, confirm, download, today } = deps;

  const mountPoint = doc.getElementById('report-mount');
  const status = doc.getElementById('data-status');

  function refresh(): void {
    const records = log.load();
    if (mountPoint) {
      renderReport(mountPoint, records);
    }
    if (status) {
      status.textContent = sampleStatus(records);
    }
  }

  const backupStatus = doc.getElementById('backup-status');
  const backup =
    deps.backup !== undefined
      ? deps.backup
      : deps.remote
        ? wireBackup({
            local: log,
            remote: deps.remote,
            onLocalChange: () => refresh(),
            onStatus: (state) => {
              if (backupStatus) {
                backupStatus.hidden = false;
                backupStatus.textContent = backupNote(state);
              }
            },
          })
        : null;

  // Die Gefahr-Kurve zeigt das eingestellte Gebiss — dieselbe Einstellung wie im Spiel.
  const creature = getCreature(settings.creature);
  const teeth = Math.min(MAX_TEETH, Math.max(MIN_TEETH, settings.teethOverride ?? creature.teeth));
  const dangerMount = doc.getElementById('danger-mount');
  if (dangerMount) {
    renderDangerCurve(dangerMount, {
      creatureName: creature.name,
      teeth,
      mode: settings.mode,
      liveTeethMin: creature.liveTeethMin,
      liveTeethMax: creature.liveTeethMax,
    });
  }

  doc.getElementById('export-csv')?.addEventListener('click', () => {
    const csv = toCsv(log.load());
    download(`zahn-agent-runden-${today()}.csv`, csv);
    if (status) {
      status.textContent = 'CSV exportiert.';
    }
  });

  doc.getElementById('toggle-import')?.addEventListener('click', () => {
    doc.getElementById('import-area')?.classList.toggle('hidden');
  });

  doc.getElementById('import-run')?.addEventListener('click', () => {
    const field = doc.getElementById('import-text') as HTMLTextAreaElement | null;
    const hint = doc.getElementById('import-status');
    if (!field) return;
    const imported = fromCsv(field.value);
    if (imported.length === 0) {
      if (hint) {
        hint.textContent = 'Keine gültigen Zeilen gefunden.';
      }
      return;
    }
    // Import hängt an und zählt die Rundennummern fortlaufend weiter.
    const existing = log.load();
    const start = existing.reduce((max, record) => Math.max(max, record.round), 0);
    const merged = [...existing, ...imported.map((record, index) => ({ ...record, round: start + index + 1 }))];
    log.save(merged);
    if (hint) {
      hint.textContent = `${imported.length} Runden importiert.`;
    }
    refresh();
    void backup?.sync();
  });

  doc.getElementById('clear-log')?.addEventListener('click', () => {
    if (confirm('Wirklich alle protokollierten Runden löschen? Damit verschwinden auch die Sterne im Tier-Album.')) {
      log.clear();
      refresh();
      // Ersetzen statt abgleichen: sonst brächte die Sicherung die gelöschten Runden zurück.
      void backup?.replace([]);
    }
  });

  refresh();
  void backup?.sync();

  if (deps.persistence) {
    const storageStatus = doc.getElementById('storage-status');
    void deps.persistence.then((state) => {
      if (storageStatus) {
        storageStatus.textContent = persistenceNote(state);
      }
    });
  }

  // Das Spiel in einem anderen Tab schreibt in dieselbe Ablage — die Auswertung zieht nach.
  win.addEventListener('storage', (event) => {
    if (event.key === null || event.key === STORAGE_KEY) {
      refresh();
    }
  });
}
