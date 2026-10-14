// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RoundRecord } from '../../contract/sessionLog';
import { getCreature, listCreatures } from '../../core/domain/creature';
import { UNLOCK_STEPS } from '../../core/domain/unlocks';
import type { RoundLogPort } from '../../core/ports/roundLog';
import { wireAlbum } from './albumBadges';
import { createLogFeed, type LogFeed } from './logFeed';
import {
  launchConfetti,
  lockedTileLabel,
  missingStarsSymbols,
  missingStarsText,
  playLabel,
  progressSentence,
  unlockTitle,
  joinNames,
  threeLiveNames,
} from './unlockNotice';

/** Die Auswahl mit allen zehn Tieren, die Meldungen über der Bühne und der Hinweis für Vorleser. */
const DOM = `
  <div id="stage" data-status="snapped">
    <div id="stage-notes">
      <p id="star-toast" class="hidden"></p>
      <p id="unlock-progress" class="hidden"></p>
      <div id="unlock-card" class="hidden">
        <span id="unlock-icon"></span><p id="unlock-title"></p>
        <button type="button" id="unlock-play"></button>
      </div>
    </div>
  </div>
  <p id="lock-hint"></p>
  <ul>${listCreatures()
    .map((creature) => `<li><button type="button" data-creature="${creature.id}"></button></li>`)
    .join('')}</ul>
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

/** Eine Runde mit ganzem Gebiss, die genau `stars` Sterne bringt. */
function played(creature: string, stars: 1 | 2 | 3): RoundRecord {
  const teeth = getCreature(creature).teeth;
  const pressIndex = stars === 3 ? teeth : stars === 2 ? Math.ceil(teeth / 2) + 1 : 1;
  return {
    round: 1,
    playedAt: '2026-10-13T09:00:00.000Z',
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

let feed: LogFeed;
const tile = (id: string): HTMLButtonElement =>
  document.querySelector(`button[data-creature="${id}"]`) as HTMLButtonElement;
const byId = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;
const finish = (): void => {
  feed.roundFinished();
};
const portrait = (id: string, suffix: string): string => `<svg data-portrait="${id}-${suffix}"></svg>`;

describe('Sperre an den Kacheln', () => {
  let log: MemoryLog;

  beforeEach(() => {
    document.body.innerHTML = DOM;
    log = new MemoryLog();
    feed = createLogFeed();
  });

  it('lässt am Anfang Krokodil, Maus und Wolf offen und sperrt die übrigen sieben', () => {
    wireAlbum({ doc: document, log });
    const locked = listCreatures().filter((creature) => tile(creature.id).classList.contains('is-locked'));
    expect(locked.map((creature) => creature.id).sort()).toEqual(UNLOCK_STEPS.map((step) => step.creature).sort());
    for (const id of ['crocodile', 'mouse', 'wolf']) {
      expect(tile(id).hasAttribute('aria-disabled')).toBe(false);
      expect(tile(id).getAttribute('aria-label')).toContain('von 3 Sternen');
    }
  });

  it('gibt jeder gesperrten Kachel ein Schloss und sagt, was fehlt — auch dem Vorleser', () => {
    log.records = [played('crocodile', 1)];
    wireAlbum({ doc: document, log });
    expect(tile('shark').querySelector('.lock-badge svg')).not.toBeNull();
    expect(tile('shark').querySelector('.lock-badge__text')?.textContent).toBe('Noch 2 Sterne');
    expect(tile('shark').getAttribute('aria-label')).toBe('Hai, gesperrt — noch 2 sterne');
    expect(tile('shark').getAttribute('aria-disabled')).toBe('true');
    // Nicht `disabled`: der Tipp muss ankommen, um sagen zu können, was fehlt.
    expect(tile('shark').disabled).toBe(false);
    expect(tile('sabertooth').querySelector('.lock-badge__text')?.textContent).toBe('Noch 14 Sterne');
  });

  it('hebt genau das nächste Tier hervor', () => {
    log.records = [played('crocodile', 1), played('mouse', 1), played('wolf', 1)];
    wireAlbum({ doc: document, log });
    const next = listCreatures().filter((creature) => tile(creature.id).classList.contains('is-next-unlock'));
    expect(next.map((creature) => creature.id)).toEqual(['panda']);
    expect(tile('shark').classList.contains('is-locked')).toBe(false);
  });

  it('meldet, ob ein Tier gesperrt ist — nach dem Stand der Ablage', () => {
    const album = wireAlbum({ doc: document, log });
    expect(album.isLocked('shark')).toBe(true);
    expect(album.isLocked('mouse')).toBe(false);
    log.records = [played('mouse', 3)];
    album.paint();
    expect(album.isLocked('shark')).toBe(false);
  });

  it('ein Tipp auf ein gesperrtes Tier lässt die Kachel sagen, was fehlt', () => {
    const album = wireAlbum({ doc: document, log });
    album.lockedTap('lion');
    expect(tile('lion').classList.contains('is-hinting')).toBe(true);
    expect(tile('shark').classList.contains('is-hinting')).toBe(false);
    expect(byId('lock-hint').textContent).toBe('Löwe ist noch gesperrt. Noch 9 Sterne.');
    // Ein offenes Tier bekommt keinen Hinweis.
    album.lockedTap('mouse');
    expect(tile('mouse').classList.contains('is-hinting')).toBe(false);
  });

  it('sperrt wieder, wenn das Protokoll gelöscht wird', () => {
    log.records = [played('mouse', 3)];
    const album = wireAlbum({ doc: document, log });
    expect(tile('shark').classList.contains('is-locked')).toBe(false);
    log.clear();
    album.paint();
    expect(tile('shark').classList.contains('is-locked')).toBe(true);
  });
});

describe('Freischaltung nach dem Biss', () => {
  let log: MemoryLog;

  beforeEach(() => {
    document.body.innerHTML = DOM;
    log = new MemoryLog();
    feed = createLogFeed();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('zeigt Kopfbild, Namen und Knopf des neuen Tiers und wirft Konfetti', () => {
    log.records = [played('crocodile', 1), played('mouse', 1)];
    wireAlbum({ doc: document, log, feed, portrait, random: () => 0.5 });
    log.records = [...log.records, played('wolf', 1)];
    finish();
    expect(byId('unlock-card').classList.contains('hidden')).toBe(false);
    expect(byId('unlock-title').textContent).toBe('Neu dabei: Hai!');
    expect(byId('unlock-icon').innerHTML).toContain('shark-neu');
    expect(byId('unlock-play').textContent).toBe('Mit dem Hai spielen');
    expect(document.querySelectorAll('#confetti i').length).toBeGreaterThan(50);
    expect(tile('shark').classList.contains('is-locked')).toBe(false);
    // Die Karte ist die Nachricht der Runde — der Satz zum Fortschritt schweigt.
    expect(byId('unlock-progress').classList.contains('hidden')).toBe(true);
  });

  it('der Knopf meldet das Tier und räumt die Karte weg', () => {
    const chosen: string[] = [];
    log.records = [played('crocodile', 1), played('mouse', 1)];
    wireAlbum({ doc: document, log, feed, portrait, onPlay: (id) => chosen.push(id), random: () => 0.5 });
    log.records = [...log.records, played('wolf', 1)];
    finish();
    byId('unlock-play').click();
    expect(chosen).toEqual(['shark']);
    expect(byId('unlock-card').classList.contains('hidden')).toBe(true);
  });

  it('nennt zwei Tiere, wenn eine Runde zwei Schwellen nimmt', () => {
    log.records = [played('crocodile', 1), played('mouse', 1)];
    wireAlbum({ doc: document, log, feed, portrait, random: () => 0.5 });
    log.records = [...log.records, played('wolf', 3)];
    finish();
    expect(byId('unlock-title').textContent).toBe('Neu dabei: Hai und Panda!');
    expect(byId('unlock-play').textContent).toBe('Mit dem Hai spielen');
  });

  it('zeigt nach einem neuen Stern den Weg zum nächsten Tier — mit Sternzeichen und Schattenriss', () => {
    wireAlbum({ doc: document, log, feed, portrait });
    log.records = [played('crocodile', 1)];
    finish();
    const line = byId('unlock-progress');
    expect(line.classList.contains('hidden')).toBe(false);
    expect(line.querySelector('.unlock-progress__stars')?.textContent).toBe('☆☆');
    expect(line.querySelector('.unlock-progress__icon')?.innerHTML).toContain('shark-weiter');
    expect(line.querySelector('.unlock-progress__text')?.textContent).toBe('Noch 2 Sterne bis zum Hai.');
    expect(byId('unlock-card').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('confetti')).toBeNull();
  });

  it('schweigt zum Fortschritt, wenn die Runde keinen neuen Stern brachte', () => {
    log.records = [played('crocodile', 1)];
    wireAlbum({ doc: document, log, feed, portrait });
    log.records = [...log.records, played('crocodile', 1)];
    finish();
    expect(byId('unlock-progress').classList.contains('hidden')).toBe(true);
  });

  it('räumt die Karte der letzten Runde weg, wenn die nächste nichts öffnet', () => {
    log.records = [played('crocodile', 1), played('mouse', 1)];
    wireAlbum({ doc: document, log, feed, portrait, random: () => 0.5 });
    log.records = [...log.records, played('wolf', 1)];
    finish();
    log.records = [...log.records, played('wolf', 1)];
    finish();
    expect(byId('unlock-card').classList.contains('hidden')).toBe(true);
  });

  it('feiert nicht, wenn Runden von außen kommen (Sicherung, anderer Tab, Import)', () => {
    wireAlbum({ doc: document, log, feed, portrait });
    log.records = [played('crocodile', 2), played('mouse', 2), played('wolf', 2)];
    feed.changedOutside();
    expect(tile('panda').classList.contains('is-locked')).toBe(false);
    expect(byId('unlock-card').classList.contains('hidden')).toBe(true);
    expect(byId('unlock-progress').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('confetti')).toBeNull();
  });
});

describe('Konfetti', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('entfällt, wenn am Gerät „Bewegung reduzieren" eingestellt ist', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
    expect(launchConfetti(document)).toBe(false);
    expect(document.getElementById('confetti')).toBeNull();
  });

  it('legt keine zweite Schicht an, wenn schon eine fällt', () => {
    expect(launchConfetti(document, () => 0.5)).toBe(true);
    launchConfetti(document, () => 0.5);
    expect(document.querySelectorAll('#confetti')).toHaveLength(1);
    expect(document.getElementById('confetti')?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('Sätze der Freischaltung', () => {
  it('gibt jeder Zahl ihr Substantiv', () => {
    expect(missingStarsText(1)).toBe('Noch 1 Stern');
    expect(missingStarsText(2)).toBe('Noch 2 Sterne');
    expect(missingStarsSymbols(2)).toBe('☆☆');
    expect(lockedTileLabel('Hai', 1)).toBe('Hai, gesperrt — noch 1 stern');
  });

  it('beugt jeden Namen der Folge richtig („bis zum Löwen", „mit dem Menschen", „zur Venusfliegenfalle")', () => {
    const sentences = UNLOCK_STEPS.map((step) => {
      const name = getCreature(step.creature).name;
      return [
        progressSentence({ creature: step.creature, name, stars: step.stars, missing: 1 }),
        playLabel(step.creature, name),
      ];
    });
    expect(sentences).toEqual([
      ['Noch 1 Stern bis zum Hai.', 'Mit dem Hai spielen'],
      ['Noch 1 Stern bis zum Panda.', 'Mit dem Panda spielen'],
      ['Noch 1 Stern bis zum Menschen.', 'Mit dem Menschen spielen'],
      ['Noch 1 Stern bis zum Löwen.', 'Mit dem Löwen spielen'],
      ['Noch 1 Stern bis zum Vampir.', 'Mit dem Vampir spielen'],
      ['Noch 1 Stern bis zum Panther.', 'Mit dem Panther spielen'],
      ['Noch 1 Stern bis zum Säbelzahntiger.', 'Mit dem Säbelzahntiger spielen'],
      ['Noch 1 Stern bis zur Venusfliegenfalle.', 'Mit der Venusfliegenfalle spielen'],
      ['Noch 1 Stern bis zum T-Rex.', 'Mit dem T-Rex spielen'],
    ]);
  });

  it('nennt ein, zwei oder drei Neue — ohne Oberbegriff, denn Mensch und Vampir sind keine Tiere', () => {
    expect(unlockTitle([{ name: 'Hai' }])).toBe('Neu dabei: Hai!');
    expect(unlockTitle([{ name: 'Mensch' }])).toBe('Neu dabei: Mensch!');
    expect(unlockTitle([{ name: 'Mensch' }])).not.toContain('Tier');
    expect(unlockTitle([{ name: 'Hai' }, { name: 'Panda' }])).toBe('Neu dabei: Hai und Panda!');
    expect(unlockTitle([{ name: 'Hai' }, { name: 'Panda' }, { name: 'Mensch' }])).toBe(
      'Neu dabei: Hai, Panda und Mensch!',
    );
  });

  it('zählt Namen auf: leer, einzeln, mit und, mit Komma', () => {
    expect(joinNames([])).toBe('');
    expect(joinNames(['A'])).toBe('A');
    expect(joinNames(['A', 'B'])).toBe('A und B');
    expect(joinNames(['A', 'B', 'C'])).toBe('A, B und C');
  });

  it('nennt die Tiere mit 1–3 scharfen Zähnen für das Regeln-Blatt', () => {
    expect(threeLiveNames()).toBe('Krokodil, Mensch und T-Rex');
  });
});
