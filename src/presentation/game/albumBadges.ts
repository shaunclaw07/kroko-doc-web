import {
  ALBUM_STARS,
  albumFromRecords,
  newStars,
  type AlbumPage,
  type AlbumStar,
  type NewStar,
} from '../../core/domain/album';
import { UNLOCK_STEPS, newlyUnlocked, unlockState, type UnlockState } from '../../core/domain/unlocks';
import type { RoundLogPort } from '../../core/ports/roundLog';
import {
  LOCK_ICON,
  launchConfetti,
  lockedTileLabel,
  missingStarsSymbols,
  missingStarsText,
  playLabel,
  progressSentence,
  unlockTitle,
} from './unlockNotice';

/**
 * Das Tier-Album in der Bedienung: Sterne und Sperre an den Kacheln der Tier-Auswahl, und nach dem
 * Biss die Ansage eines neuen Sterns, der Fortschritt zum nächsten Tier und die Freischaltung.
 * Alles kommt bei **jedem** Malen frisch aus dem Protokoll — ein gemerkter Stand wäre eine zweite
 * Wahrheit neben der Ablage (die Statistikseite löscht und importiert dort).
 *
 * Sterne und Sperre malt **ein** Durchgang: beide setzen die Beschriftung der Kachel, und zwei
 * Module überschrieben einander je nach Reihenfolge ihrer Zuhörer.
 */

/** Jeder Stern hat ein Wort: ein Zeichen ohne Namen ist keine Aussage. */
export const STAR_LABELS: Readonly<Record<AlbumStar, string>> = {
  played: 'gespielt',
  halfway: 'halb geschafft',
  lastTooth: 'bis zum letzten Zahn',
};

export function albumSummary(pages: readonly AlbumPage[]): string {
  const playedCount = pages.filter((page) => page.rounds > 0).length;
  const stars = pages.reduce((sum, page) => sum + page.stars.length, 0);
  return `${playedCount} von ${pages.length} Tieren gespielt · ${stars} von ${pages.length * ALBUM_STARS.length} Sternen`;
}

/** Die Ansage nach dem Biss. Eine Runde gehört einem Tier — genannt wird das erste. */
export function newStarSentence(found: readonly NewStar[]): string {
  const first = found[0];
  if (!first) {
    return '';
  }
  const labels = found.filter((entry) => entry.creature === first.creature).map((entry) => STAR_LABELS[entry.star]);
  return `${labels.length === 1 ? 'Neuer Stern' : 'Neue Sterne'}: ${first.name} — ${labels.join(', ')}!`;
}

export interface AlbumDeps {
  doc: Document;
  log: RoundLogPort;
  /** Kopfbild eines Tiers — für den Fortschritt (als Schattenriss) und die Freischaltung. */
  portrait?: (creatureId: string, suffix: string) => string;
  /** Tipp auf „Mit dem … spielen" in der Karte der Freischaltung. */
  onPlay?: (creatureId: string) => void;
  /** Zufall des Konfettis; in Tests fest. */
  random?: () => number;
}

export interface Album {
  paint: () => void;
  /** Ist dieses Tier nach dem Stand der Ablage gesperrt? */
  isLocked: (creatureId: string) => boolean;
  /** Ein Tipp auf ein gesperrtes Tier: die Kachel sagt, was fehlt. */
  lockedTap: (creatureId: string) => void;
}

export function wireAlbum(deps: AlbumDeps): Album {
  const { doc, log } = deps;
  let shown: AlbumPage[] = [];
  let state: UnlockState = unlockState([]);

  // `button[…]`, nicht `[data-creature]` allein: auch die Zeichnung auf der Bühne trägt das Attribut.
  const tiles = (): HTMLButtonElement[] =>
    Array.from(doc.querySelectorAll<HTMLButtonElement>('button[data-creature]'));

  /** Die drei Plätze einer Kachel — einmal angelegt, danach nur umgefärbt. */
  const starsOf = (tile: HTMLButtonElement): HTMLElement[] => {
    let holder = tile.querySelector<HTMLElement>('.album-stars');
    if (!holder) {
      holder = doc.createElement('span');
      holder.className = 'album-stars';
      holder.setAttribute('aria-hidden', 'true');
      for (let index = 0; index < ALBUM_STARS.length; index += 1) {
        const star = doc.createElement('span');
        star.className = 'album-star';
        star.textContent = '★';
        holder.appendChild(star);
      }
      tile.appendChild(holder);
    }
    return Array.from(holder.querySelectorAll<HTMLElement>('.album-star'));
  };

  /** Schloss und Marke einer Kachel — einmal angelegt; sichtbar macht sie das CSS an `is-locked`. */
  const lockTextOf = (tile: HTMLButtonElement): HTMLElement => {
    let text = tile.querySelector<HTMLElement>('.lock-badge__text');
    if (!text) {
      const badge = doc.createElement('span');
      badge.className = 'lock-badge';
      badge.setAttribute('aria-hidden', 'true');
      badge.innerHTML = LOCK_ICON;
      text = doc.createElement('span');
      text.className = 'lock-badge__text';
      badge.appendChild(text);
      tile.appendChild(badge);
    }
    return text;
  };

  /** Wie viele Sterne diesem Tier bis zu seiner Schwelle fehlen (0 = offen). */
  const missingFor = (creatureId: string): number => {
    if (state.unlocked.includes(creatureId)) {
      return 0;
    }
    const step = UNLOCK_STEPS.find((entry) => entry.creature === creatureId);
    return step ? Math.max(1, step.stars - state.stars) : 0;
  };

  const paint = (): void => {
    shown = albumFromRecords(log.load());
    state = unlockState(shown);
    for (const tile of tiles()) {
      const page = shown.find((entry) => entry.creature === tile.dataset.creature);
      if (!page) {
        continue;
      }
      starsOf(tile).forEach((star, index) => star.classList.toggle('is-earned', index < page.stars.length));
      const missing = missingFor(page.creature);
      const locked = missing > 0;
      tile.classList.toggle('is-locked', locked);
      tile.classList.toggle('is-next-unlock', state.next?.creature === page.creature);
      tile.classList.remove('is-hinting');
      lockTextOf(tile).textContent = locked ? missingStarsText(missing) : '';
      if (locked) {
        // Nicht `disabled`: der Tipp soll ankommen und sagen, was fehlt.
        tile.setAttribute('aria-disabled', 'true');
        tile.setAttribute('aria-label', lockedTileLabel(page.name, missing));
      } else {
        tile.removeAttribute('aria-disabled');
        tile.setAttribute('aria-label', `${page.name}, ${page.stars.length} von ${ALBUM_STARS.length} Sternen`);
      }
    }
    const summary = albumSummary(shown);
    doc.querySelectorAll('.album-summary').forEach((element) => {
      element.textContent = summary;
    });
  };

  const announce = (sentence: string): void => {
    const toast = doc.getElementById('star-toast');
    if (!toast) {
      return;
    }
    toast.textContent = sentence;
    toast.classList.toggle('hidden', sentence.length === 0);
  };

  /** „Noch 1 Stern bis zum Hai" — mit Sternzeichen und dem Tier als Schattenriss. */
  const showProgress = (visible: boolean): void => {
    const line = doc.getElementById('unlock-progress');
    if (!line) {
      return;
    }
    const next = state.next;
    line.classList.toggle('hidden', !visible || !next);
    if (!visible || !next) {
      line.textContent = '';
      return;
    }
    line.innerHTML =
      `<span class="unlock-progress__stars" aria-hidden="true">${missingStarsSymbols(next.missing)}</span>` +
      `<span class="unlock-progress__icon" aria-hidden="true">${deps.portrait?.(next.creature, 'weiter') ?? ''}</span>` +
      '<span class="unlock-progress__text"></span>';
    const text = line.querySelector('.unlock-progress__text');
    if (text) {
      text.textContent = progressSentence(next);
    }
  };

  /** Die Karte der Freischaltung: Kopfbild, Name und der Knopf zum neuen Tier. */
  const showUnlock = (found: readonly { creature: string; name: string }[]): void => {
    const card = doc.getElementById('unlock-card');
    if (!card) {
      return;
    }
    const first = found[0];
    card.classList.toggle('hidden', !first);
    if (!first) {
      return;
    }
    const icon = doc.getElementById('unlock-icon');
    if (icon) icon.innerHTML = deps.portrait?.(first.creature, 'neu') ?? '';
    const title = doc.getElementById('unlock-title');
    if (title) title.textContent = unlockTitle(found);
    const play = doc.getElementById('unlock-play');
    if (play) {
      play.textContent = playLabel(first.creature, first.name);
      play.dataset.play = first.creature;
    }
  };

  doc.getElementById('unlock-play')?.addEventListener('click', (event) => {
    const creatureId = (event.currentTarget as HTMLElement).dataset.play;
    if (creatureId) {
      showUnlock([]);
      deps.onPlay?.(creatureId);
    }
  });

  // Die Steuerung meldet jede beendete Runde, **nachdem** sie gespeichert hat. Nur hier wird
  // angesagt und gefeiert: kommen Runden von außen (anderer Tab, Import, Sicherung), ruft die
  // Seite `paint()` — die Tiere öffnen sich dann still.
  doc.addEventListener('kroko:round-finished', () => {
    const before = shown;
    const stateBefore = state;
    paint();
    const stars = newStars(before, shown);
    const unlocked = newlyUnlocked(stateBefore, state);
    announce(newStarSentence(stars));
    showUnlock(unlocked);
    // Die Karte ist die Nachricht dieser Runde; der Weg zum übernächsten Tier steht an der Kachel.
    showProgress(stars.length > 0 && unlocked.length === 0);
    if (unlocked.length > 0) {
      launchConfetti(doc, deps.random);
    }
  });

  const lockedTap = (creatureId: string): void => {
    const page = shown.find((entry) => entry.creature === creatureId);
    const missing = missingFor(creatureId);
    if (!page || missing === 0) {
      return;
    }
    for (const tile of tiles().filter((entry) => entry.dataset.creature === creatureId)) {
      // Klasse neu setzen: die Animation der Marke soll bei jedem Tipp von vorn laufen.
      tile.classList.remove('is-hinting');
      void tile.offsetWidth;
      tile.classList.add('is-hinting');
    }
    const hint = doc.getElementById('lock-hint');
    if (hint) {
      hint.textContent = `${page.name} ist noch gesperrt. ${missingStarsText(missing)}.`;
    }
  };

  paint();
  return { paint, isLocked: (creatureId) => missingFor(creatureId) > 0, lockedTap };
}
