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
const REGELN = SEITE.slice(SEITE.indexOf('id="rules-sheet"'), SEITE.indexOf('id="result-sheet"'));

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
  it('kennt die abgeschafften Anzeigen nicht mehr', () => {
    expect(SEITE).not.toContain('restart-round');
    expect(SEITE).not.toContain('hud-presses');
    expect(SEITE).not.toContain('teeth-reset');
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
});
