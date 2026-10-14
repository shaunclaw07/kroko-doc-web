import { albumFromRecords } from '../../core/domain/album';
import { unlockState } from '../../core/domain/unlocks';
import type { HapticsPort } from '../../core/ports/haptics';
import type { RandomSource } from '../../core/ports/random';
import type { RemoteLogPort } from '../../core/ports/remoteLog';
import type { RoundLogPort } from '../../core/ports/roundLog';
import type { SessionMarkPort } from '../../core/ports/sessionMark';
import type { SoundPort } from '../../core/ports/sound';
import { STORAGE_KEY, type StorageLike } from '../../infrastructure/storage/localStorageLog';
import { loadSettings, saveSettings, type GameSettings } from '../../infrastructure/storage/localStorageSettings';
import { wireAlbum } from './albumBadges';
import { wireBackup } from './backupSync';
import { settingsAfterCreatureChoice, settingsWithUnlockedCreature } from './creatureChoice';
import { GameController } from './gameController';
import { wireQuickControls } from './quickControls';
import { wireSettingsSheet } from './settingsSheet';
import { closeSheet, openSheet as showSheet, wireOutsideTapDismissal } from './sheets';

export interface WireGamePageDeps {
  doc: Document;
  win: Window;
  storage: StorageLike;
  log: RoundLogPort;
  rng: RandomSource;
  sound: SoundPort;
  haptics: HapticsPort;
  session?: SessionMarkPort;
  portrait: (creatureId: string, suffix: string) => string;
  remote?: RemoteLogPort;
}

export interface WireGamePageResult {
  controller: GameController;
  album: ReturnType<typeof wireAlbum>;
  quick: ReturnType<typeof wireQuickControls>;
}

/**
 * Verdrahtet die gesamte Spielseite: Einstellungen laden, Controller montieren,
 * Album, Leiste, Einstellungsblatt, Dialoge, Ereignisse und Ton-Freigabe.
 */
export function wireGamePage(deps: WireGamePageDeps): WireGamePageResult {
  const { doc, win, storage, log, rng, sound, haptics, session, portrait, remote } = deps;

  const loaded = loadSettings(storage);
  // Ein gespeichertes Tier, das (noch oder wieder) gesperrt ist, fällt auf das Krokodil zurück —
  // etwa nach „Protokoll löschen". Welche Tiere offen sind, folgt allein aus den Sternen.
  const settings = settingsWithUnlockedCreature(loaded, unlockState(albumFromRecords(log.load())).unlocked);
  if (settings !== loaded) {
    saveSettings(storage, settings);
  }

  const controller = new GameController({
    rng,
    sound,
    haptics,
    log,
    settings,
    session,
    document: doc,
    onSettingsChange: (next: GameSettings) => saveSettings(storage, next),
  });

  controller.mount();

  let quick: ReturnType<typeof wireQuickControls>;

  // Das Tier-Album: Sterne an den Kacheln, abgeleitet aus derselben Ablage. Es hört selbst auf
  // `kroko:round-finished`; was von außen kommt (anderer Tab, Zurück-Taste), zieht `paint()` nach.
  // Dazu die Sperre der Tiere und, nach dem Biss, die Freischaltung mit ihrem Knopf.
  const album = wireAlbum({
    doc,
    log,
    portrait,
    onPlay: (creatureId: string) => {
      const next = settingsAfterCreatureChoice(settings, creatureId);
      if (next) controller.applySettings(next);
      quick.paint();
    },
  });

  const sheetOf = (id: string): HTMLDialogElement | null =>
    doc.getElementById(id) as HTMLDialogElement | null;
  const openSheet = (id: string): void => showSheet(sheetOf(id));

  // Die Leiste der Spielseite (Tier, Zähne): Regeln und Test stehen in quickControls.ts.
  // Ein Tipp auf eine Kachel wählt und schließt das Auswahlblatt — auf dem Tablet ist es gar
  // nicht offen, `closeSheet` tut dann nichts.
  quick = wireQuickControls({
    doc,
    settings,
    isLocked: (creatureId: string) => album.isLocked(creatureId),
    onLockedTap: (creatureId: string) => album.lockedTap(creatureId),
    apply: (next: GameSettings) => controller.applySettings(next),
    portrait,
    onCreatureChosen: () => {
      const sheet = sheetOf('creature-sheet');
      if (sheet?.hasAttribute('open')) closeSheet(sheet);
    },
  });

  // Das Protokoll kann sich außerhalb dieser Seite ändern: die Statistikseite löscht oder
  // importiert in einem anderen Tab (`storage`), oder diese Seite kommt über die Zurück-Taste
  // unverändert aus dem Zwischenspeicher des Browsers (`pageshow` mit `persisted`).
  win.addEventListener('storage', (event) => {
    if (event.key === null || event.key === STORAGE_KEY) {
      controller.syncLog();
      album.paint();
    }
  });
  win.addEventListener('pageshow', (event) => {
    if ((event as PageTransitionEvent).persisted) {
      controller.syncLog();
      album.paint();
    }
  });

  // Sicherung außerhalb des Geräts — nur, wenn die Adresse einen Sicherungscode trägt.
  if (remote) {
    const backup = wireBackup({
      local: log,
      remote,
      onLocalChange: () => {
        controller.syncLog();
        album.paint();
      },
    });
    void backup.sync();
    doc.addEventListener('kroko:round-finished', () => void backup.sync());
  }

  // Schalter und Segmente mit den gespeicherten Einstellungen abgleichen
  wireSettingsSheet({
    doc,
    settings,
    haptics,
    apply: (next: GameSettings) => controller.applySettings(next),
  });

  doc.getElementById('settings-open')?.addEventListener('click', () => openSheet('settings-sheet'));
  doc.getElementById('creature-open')?.addEventListener('click', () => openSheet('creature-sheet'));
  doc.getElementById('rules-open')?.addEventListener('click', () => openSheet('rules-sheet'));
  doc.querySelectorAll('[data-close-sheet]').forEach((button) => {
    button.addEventListener('click', () => closeSheet(button.closest('dialog')));
  });

  // Ein Tipp neben das oberste Blatt schließt es — die Regeln stehen (geprüft) in sheets.ts.
  wireOutsideTapDismissal(doc);

  // Browser geben Ton erst nach einer Nutzergeste frei.
  const unlockAudio = (): void => sound.unlock();
  doc.addEventListener('pointerup', unlockAudio);
  doc.addEventListener('keydown', unlockAudio);
  win.addEventListener('pointerup', unlockAudio);
  win.addEventListener('keydown', unlockAudio);

  return { controller, album, quick };
}
