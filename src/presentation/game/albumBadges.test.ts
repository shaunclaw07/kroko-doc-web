// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { albumFromRecords } from '../../core/domain/album';
import type { RoundRecord } from '../../contract/sessionLog';
import type { RoundLogPort } from '../../core/ports/roundLog';
import { albumSummary, newStarSentence, wireAlbum } from './albumBadges';

const DOM = `
  <div id="stage" data-status="snapped"><p id="star-toast" class="star-toast hidden"></p></div>
  <ul>
    <li><button type="button" data-creature="crocodile"><span class="creature-grid__name">Krokodil</span></button></li>
    <li><button type="button" data-creature="mouse"><span class="creature-grid__name">Maus</span></button></li>
  </ul>
  <ul><li><button type="button" data-creature="mouse"><span class="creature-grid__name">Maus</span></button></li></ul>
  <p class="album-summary"></p>
  <svg class="creature" data-creature="crocodile"></svg>
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

function played(creature: string, teeth: number, pressIndex: number): RoundRecord {
  return {
    round: 1,
    playedAt: '2026-10-12T09:00:00.000Z',
    creature,
    teeth,
    mode: 'original',
    players: 1,
    loserTooth: pressIndex,
    pressIndex,
    liveCount: 1,
    pressOrder: Array.from({ length: pressIndex }, (_, index) => index + 1),
  };
}

const tiles = (id: string): HTMLButtonElement[] =>
  Array.from(document.querySelectorAll<HTMLButtonElement>(`button[data-creature="${id}"]`));
const earned = (tile: Element): number => tile.querySelectorAll('.album-star.is-earned').length;
const finish = (): void => {
  document.dispatchEvent(new CustomEvent('kroko:round-finished'));
};

describe('Sterne an den Kacheln', () => {
  let log: MemoryLog;

  beforeEach(() => {
    document.body.innerHTML = DOM;
    log = new MemoryLog();
  });

  it('zeigt an jeder Kachel drei Plätze und füllt die verdienten', () => {
    log.records = [played('mouse', 6, 6), played('crocodile', 10, 1)];
    wireAlbum({ doc: document, log });
    for (const tile of tiles('mouse')) {
      expect(tile.querySelectorAll('.album-star')).toHaveLength(3);
      expect(earned(tile)).toBe(3);
    }
    expect(earned(tiles('crocodile')[0] as Element)).toBe(1);
  });

  it('benennt die Sterne für Bildschirmleser an der Kachel', () => {
    log.records = [played('crocodile', 10, 6)];
    wireAlbum({ doc: document, log });
    expect(tiles('crocodile')[0]?.getAttribute('aria-label')).toBe('Krokodil, 2 von 3 Sternen');
    expect(tiles('mouse')[0]?.getAttribute('aria-label')).toBe('Maus, 0 von 3 Sternen');
    expect(tiles('crocodile')[0]?.querySelector('.album-stars')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('rührt die Zeichnung auf der Bühne nicht an — auch sie trägt data-creature', () => {
    wireAlbum({ doc: document, log });
    expect(document.querySelector('svg.creature .album-stars')).toBeNull();
  });

  it('malt bei jedem Lauf dieselben drei Plätze, nicht drei weitere', () => {
    const album = wireAlbum({ doc: document, log });
    album.paint();
    album.paint();
    expect(tiles('mouse')[0]?.querySelectorAll('.album-stars')).toHaveLength(1);
    expect(tiles('mouse')[0]?.querySelectorAll('.album-star')).toHaveLength(3);
  });

  it('fasst das Album in einem Satz zusammen', () => {
    log.records = [played('mouse', 6, 6), played('crocodile', 10, 1)];
    wireAlbum({ doc: document, log });
    expect(document.querySelector('.album-summary')?.textContent).toBe(
      '2 von 12 Tieren gespielt · 4 von 36 Sternen',
    );
  });
});

describe('Ansage eines neuen Sterns', () => {
  let log: MemoryLog;

  beforeEach(() => {
    document.body.innerHTML = DOM;
    log = new MemoryLog();
  });

  const toast = (): HTMLElement => document.getElementById('star-toast') as HTMLElement;

  it('nennt nach dem Biss Tier und Stern beim Namen', () => {
    wireAlbum({ doc: document, log });
    log.records = [played('mouse', 6, 1)];
    finish();
    expect(toast().textContent).toBe('Neuer Stern: Maus — gespielt!');
    expect(toast().classList.contains('hidden')).toBe(false);
    expect(earned(tiles('mouse')[0] as Element)).toBe(1);
  });

  it('nennt mehrere Sterne einer Runde zusammen', () => {
    wireAlbum({ doc: document, log });
    log.records = [played('mouse', 6, 6)];
    finish();
    expect(toast().textContent).toBe('Neue Sterne: Maus — gespielt, halb geschafft, bis zum letzten Zahn!');
  });

  it('schweigt, wenn die Runde nichts Neues brachte — und räumt die alte Ansage weg', () => {
    wireAlbum({ doc: document, log });
    log.records = [played('mouse', 6, 1)];
    finish();
    log.records = [played('mouse', 6, 1), played('mouse', 6, 2)];
    finish();
    expect(toast().textContent).toBe('');
    expect(toast().classList.contains('hidden')).toBe(true);
  });

  it('sagt nichts an, wenn sich das Protokoll von außen ändert (anderer Tab, Import)', () => {
    const album = wireAlbum({ doc: document, log });
    log.records = [played('mouse', 6, 6)];
    album.paint();
    expect(toast().classList.contains('hidden')).toBe(true);
    expect(earned(tiles('mouse')[0] as Element)).toBe(3);
    // Und der nächste Biss vergleicht mit dem Stand von **jetzt**, nicht mit dem vom Seitenstart.
    log.records = [played('mouse', 6, 6), played('mouse', 6, 3)];
    finish();
    expect(toast().textContent).toBe('');
  });
});

describe('Sätze des Albums', () => {
  it('zählt Tiere und Sterne', () => {
    expect(albumSummary(albumFromRecords([]))).toBe('0 von 12 Tieren gespielt · 0 von 36 Sternen');
  });

  it('nennt nur das erste Tier, falls mehrere zugleich neue Sterne haben', () => {
    expect(
      newStarSentence([
        { creature: 'wolf', name: 'Wolf', star: 'halfway' },
        { creature: 'mouse', name: 'Maus', star: 'played' },
      ]),
    ).toBe('Neuer Stern: Wolf — halb geschafft!');
    expect(newStarSentence([])).toBe('');
  });
});
