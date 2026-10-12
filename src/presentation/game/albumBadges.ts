import {
  ALBUM_STARS,
  albumFromRecords,
  newStars,
  type AlbumPage,
  type AlbumStar,
  type NewStar,
} from '../../core/domain/album';
import type { RoundLogPort } from '../../core/ports/roundLog';

/**
 * Das Tier-Album in der Bedienung: Sterne an den Kacheln der Tier-Auswahl und die Ansage eines
 * neuen Sterns nach dem Biss. Die Sterne kommen bei **jedem** Malen frisch aus dem Protokoll — ein
 * gemerkter Stand wäre eine zweite Wahrheit neben der Ablage (die Statistikseite löscht und
 * importiert dort).
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
}

export function wireAlbum(deps: AlbumDeps): { paint: () => void } {
  const { doc, log } = deps;
  let shown: AlbumPage[] = [];

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

  const paint = (): void => {
    shown = albumFromRecords(log.load());
    // `button[…]`, nicht `[data-creature]` allein: auch die Zeichnung auf der Bühne trägt das Attribut.
    for (const tile of Array.from(doc.querySelectorAll<HTMLButtonElement>('button[data-creature]'))) {
      const page = shown.find((entry) => entry.creature === tile.dataset.creature);
      if (!page) {
        continue;
      }
      starsOf(tile).forEach((star, index) => star.classList.toggle('is-earned', index < page.stars.length));
      tile.setAttribute('aria-label', `${page.name}, ${page.stars.length} von ${ALBUM_STARS.length} Sternen`);
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

  // Die Steuerung meldet jede beendete Runde, **nachdem** sie gespeichert hat.
  doc.addEventListener('kroko:round-finished', () => {
    const before = shown;
    paint();
    announce(newStarSentence(newStars(before, shown)));
  });

  paint();
  return { paint };
}
