import { albumFromRecords } from '../../core/domain/album';
import { unlockState } from '../../core/domain/unlocks';
import type { HapticsPort } from '../../core/ports/haptics';
import type { RandomSource } from '../../core/ports/random';
import type { RemoteLogPort } from '../../core/ports/remoteLog';
import type { RoundLogPort } from '../../core/ports/roundLog';
import type { SessionMarkPort } from '../../core/ports/sessionMark';
import type { SoundPort } from '../../core/ports/sound';
import type { GameSettings } from '../../core/domain/settings';
import { STORAGE_KEY, type StorageLike } from '../../infrastructure/storage/localStorageLog';
import { loadSettings, saveSettings } from '../../infrastructure/storage/localStorageSettings';
import { wireAlbum } from './albumBadges';
import { wireBackup } from './backupSync';
import { settingsAfterCreatureChoice, settingsWithUnlockedCreature } from './creatureChoice';
import { GameController } from './gameController';
import { createLogFeed, type LogFeed } from './logFeed';
import { wireQuickControls } from './quickControls';
import { createSettingsStore } from './settingsStore';
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
  feed: LogFeed;
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
  const initialSettings = settingsWithUnlockedCreature(loaded, unlockState(albumFromRecords(log.load())).unlocked);
  if (initialSettings !== loaded) {
    saveSettings(storage, initialSettings);
  }
  const settingsStore = createSettingsStore(initialSettings);
  settingsStore.subscribe((next) => saveSettings(storage, next));
  const feed = createLogFeed();

  const controller = new GameController({
    rng,
    sound,
    haptics,
    log,
    feed,
    settings: settingsStore,
    session,
    document: doc,
  });

  controller.mount();

  // Das Tier-Album: Sterne an den Kacheln, abgeleitet aus derselben Ablage. Es hört auf den
  // feed: nach einem eigenen Biss (`round-finished`) feiert es; was von außen kommt (`changed-outside`),
  // öffnet die Tiere still.
  const album = wireAlbum({
    doc,
    log,
    feed,
    portrait,
    onPlay: (creatureId: string) => {
      const next = settingsAfterCreatureChoice(settingsStore.get(), creatureId);
      if (next) controller.applySettings(next);
    },
  });

  const sheetOf = (id: string): HTMLDialogElement | null =>
    doc.getElementById(id) as HTMLDialogElement | null;
  const openSheet = (id: string): void => showSheet(sheetOf(id));

  // Die Leiste der Spielseite (Tier, Zähne): Regeln und Test stehen in quickControls.ts.
  // Ein Tipp auf eine Kachel wählt und schließt das Auswahlblatt — auf dem Tablet ist es gar
  // nicht offen, `closeSheet` tut dann nichts.
  const quick = wireQuickControls({
    doc,
    settings: settingsStore,
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
      feed.changedOutside();
    }
  });
  win.addEventListener('pageshow', (event) => {
    if ((event as PageTransitionEvent).persisted) {
      feed.changedOutside();
    }
  });

  // Sicherung außerhalb des Geräts — nur, wenn die Adresse einen Sicherungscode trägt.
  if (remote) {
    const backup = wireBackup({
      local: log,
      remote,
      onLocalChange: () => {
        feed.changedOutside();
      },
    });
    void backup.sync();
    feed.subscribe((event) => {
      if (event === 'round-finished') {
        void backup.sync();
      }
    });
  }

  // Schalter und Segmente mit den gespeicherten Einstellungen abgleichen
  wireSettingsSheet({
    doc,
    settings: settingsStore,
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

  // Browser geben Ton erst nach einer Nutzergeste frei. `pointerup` statt `pointerdown`: ein
  // Finger, der nur scrollt, endet mit `pointercancel` und ist keine Freigabe — die Engine
  // hielte sich sonst für freigegeben, während der Browser den Ton noch sperrt. Bei **jeder**
  // Geste, nicht nur der ersten: die erste kann eine sein, die der Browser nicht zählt, und iOS
  // hält den Ton nach einem Anruf wieder an (`unlock()` tut nichts, solange er läuft).
  doc.addEventListener('pointerup', () => sound.unlock());
  doc.addEventListener('keydown', () => sound.unlock());

  return { controller, album, quick, feed };
}
