/**
 * Wächter der Spielseite: die drei häufigen Griffe (Tier, Zahnzahl, Neue Runde) stehen auf der
 * Seite und nicht mehr hinter dem Zahnrad (Entscheidung vom 12.10.2026). Das Verhalten prüft
 * `scripts/pruefen-bedienung.py` im echten Browser; jsdom lädt das Seitenskript nicht.
 * Liegt neben `src/pages/`, nicht darin — Astro baut dort jede Datei als Seite.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SEITE = readFileSync(new URL('./pages/index.astro', import.meta.url), 'utf8');
const SPIEL = SEITE.slice(SEITE.indexOf('<main'), SEITE.indexOf('</main>'));
const ZAHNRAD = SEITE.slice(SEITE.indexOf('id="settings-sheet"'), SEITE.indexOf('id="creature-sheet"'));
const REGELN = SEITE.slice(SEITE.indexOf('id="rules-sheet"'), SEITE.indexOf('<script>'));

describe('Spielseite', () => {
  it('trägt Tier, Zahnzahl und Neue Runde selbst', () => {
    for (const id of ['creature-open', 'teeth-minus', 'teeth-plus', 'teeth-value', 'new-round']) {
      expect(SPIEL).toContain(`id="${id}"`);
    }
  });
  it('zeigt die Köpfe auf Tablets dauerhaft — mit eigener Beschnitt-Kennung', () => {
    expect(SPIEL).toContain('id="creature-rail"');
    expect(SPIEL).toContain("creaturePortrait(creature.id, 'leiste')");
  });
  it('zeigt das Ergebnis auf der Seite und nicht in einem Blatt', () => {
    expect(SPIEL).toContain('id="result-panel"');
    expect(SPIEL).toContain('id="result-title"');
    expect(SPIEL).toContain('id="result-text"');
    expect(SEITE).not.toContain('result-sheet');
    expect(SEITE).not.toContain('result-again');
    // Der Satz zum echten Tier steht NACH dem Ergebnis — ein Bildschirmleser liest in dieser Reihenfolge.
    expect(SPIEL.indexOf('id="result-fact"')).toBeGreaterThan(SPIEL.indexOf('id="result-text"'));
  });
  it('reicht der Engine den Basis-Pfad für die Tierstimmen — nie eine feste Adresse', () => {
    expect(SEITE).toContain('voiceBaseUrl: import.meta.env.BASE_URL');
    expect(SEITE).not.toContain("'/sounds/");
    expect(SEITE).not.toContain('"/sounds/');
  });
  it('zeigt die Zahl der Bissgefahr nicht mehr — für Vorleser steht sie weiter da', () => {
    expect(SPIEL).toContain('<span id="hud-tension" class="sr-only">');
    expect(SPIEL).toContain('<span id="hud-progress">');
    expect(REGELN).not.toContain('als Zahl dabei');
  });
  it('kennt die abgeschafften Anzeigen nicht mehr', () => {
    expect(SEITE).not.toContain('restart-round');
    expect(SEITE).not.toContain('hud-presses');
    expect(SEITE).not.toContain('teeth-reset');
  });
  it('trägt die Ansage eines neuen Sterns auf der Bühne — als Meldung, nicht als Blatt', () => {
    const buehne = SPIEL.slice(SPIEL.indexOf('id="stage"'), SPIEL.indexOf('id="hud-stats"'));
    expect(buehne).toContain('id="star-toast"');
    expect(buehne).toContain('role="status"');
  });
  it('trägt Fortschritt und Freischaltung über der Bühne — nicht im Ergebnis-Kasten, der sonst wüchse', () => {
    const buehne = SPIEL.slice(SPIEL.indexOf('id="stage"'), SPIEL.indexOf('id="hud-stats"'));
    for (const id of ['stage-notes', 'star-toast', 'unlock-progress', 'unlock-card', 'unlock-play']) {
      expect(buehne).toContain(`id="${id}"`);
    }
    const ergebnis = SPIEL.slice(SPIEL.indexOf('id="result-panel"'), SPIEL.indexOf('id="hud-panel"'));
    expect(ergebnis).not.toContain('unlock');
  });
  it('sagt dem Vorleser, was ein Tipp auf ein gesperrtes Tier ergibt', () => {
    expect(SPIEL).toMatch(/id="lock-hint" role="status"/);
  });
  it('ordnet die Auswahl nach der Freischaltung und sperrt beim Start über die Ablage', () => {
    expect(SEITE).toContain('UNLOCK_ORDER.map((id) => getCreature(id))');
    expect(SEITE).toContain('settingsWithUnlockedCreature(loaded, unlockState(albumFromRecords(log.load())).unlocked)');
    expect(SEITE).toContain('isLocked: (creatureId: string) => album.isLocked(creatureId)');
  });
  it('verdrahtet das Album mit derselben Ablage wie das Spiel', () => {
    expect(SEITE).toContain("from '../presentation/game/albumBadges'");
    expect(SEITE).toMatch(/wireAlbum\(\{\s+doc: document,\s+log,/);
  });
});

describe('Zahnrad', () => {
  it('enthält die häufigen Griffe nicht mehr', () => {
    for (const id of ['creature-open', 'teeth-minus', 'teeth-plus', 'new-round']) {
      expect(ZAHNRAD).not.toContain(`id="${id}"`);
    }
  });
  it('bietet genau einen oder zwei Spieler an', () => {
    expect(ZAHNRAD).toContain('data-players="1"');
    expect(ZAHNRAD).toContain('data-players="2"');
    expect(ZAHNRAD).not.toContain('data-players="3"');
    expect(ZAHNRAD).not.toContain('data-players="4"');
  });
  it('hat einen Ausgang am Fuß', () => {
    expect(ZAHNRAD).toContain('data-close-sheet');
    expect(ZAHNRAD).toContain('Fertig');
  });
});

describe('Regeln', () => {
  it('tragen die Kurzinfo zum gewählten Tier', () => {
    for (const id of ['creature-detail-line', 'creature-detail-note', 'creature-detail-real']) {
      expect(REGELN).toContain(id);
    }
  });
  it('rechnen nicht mehr mit vier Spielern', () => {
    expect(REGELN).not.toContain('4 Spielern');
  });
  it('erklären die Freischaltung mit Zahlen und Namen aus der Regel, nicht mit abgeschriebenen', () => {
    expect(REGELN).toContain('<strong>Freischalten:</strong>');
    // Kein Oberbegriff: unter den Neuen sind Mensch und Vampir.
    expect(REGELN).not.toContain('Tiere freischalten');
    expect(REGELN).not.toContain('neue Tiere');
    expect(REGELN).toContain('{startList}');
    expect(REGELN).toContain('{firstStep?.stars}');
    expect(REGELN).toContain('{lastStep?.stars}');
    expect(REGELN).toContain('Den dritten Stern');
  });
  it('erklären die drei Sterne beim Namen und sagen, dass sie Glück sind', () => {
    for (const wort of ['album-summary', 'gespielt', 'halb geschafft', 'bis zum letzten Zahn', 'Glück']) {
      expect(REGELN).toContain(wort);
    }
  });
});
