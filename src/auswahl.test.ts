/**
 * Wächter des Auswahlblatts: Ein Tipp auf ein Tier wählt es und schließt das Blatt (Wunsch vom
 * 12.10.2026) — es gibt **keinen** Bestätigungsknopf mehr.
 *
 * Das Markup kann nur festhalten, dass der Knopf fehlt und das Blatt einen Ausgang hat; ob der Tipp
 * wirklich wählt und schließt, entscheidet sich im echten Browser — das prüft
 * `scripts/pruefen-tiere.py` (Kachel antippen, danach muss das Blatt zu und das Tier auf der
 * Bühne neu sein). jsdom lädt das Seitenskript der `.astro`-Datei nicht aus.
 *
 * Diese Datei liegt **neben** `src/pages/` und nicht darin: Astro baut jede Datei in `src/pages/`
 * als eigene Seite, ein Test dort bricht den Bau („Vitest failed to access its internal state").
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { listCreatures } from './core/domain/creature';

const SEITE = readFileSync(new URL('./pages/index.astro', import.meta.url), 'utf8');

/** Nur das Blatt „Welches Tier?" — die anderen Blätter haben eigene Knöpfe. */
const AUSWAHL = SEITE.slice(
  SEITE.indexOf('id="creature-sheet"'),
  SEITE.indexOf('id="rules-sheet"'),
);

describe('Auswahlblatt „Welches Tier?"', () => {
  it('kennt keine Bestätigung mehr — die Wahl gilt mit dem Tipp', () => {
    expect(AUSWAHL).not.toContain('creature-apply');
    expect(AUSWAHL).not.toContain('Damit spielen');
  });
  it('trägt keinen „Abbrechen"-Knopf, weil nach einem Tipp nichts mehr abzubrechen wäre', () => {
    expect(AUSWAHL).not.toContain('Abbrechen');
  });
  it('hat einen Ausgang „Fertig", der das Blatt schließt', () => {
    const aktionen = AUSWAHL.slice(AUSWAHL.indexOf('sheet__actions'));
    expect(aktionen).toContain('Fertig');
    expect(aktionen).toContain('data-close-sheet');
  });
  it('bietet jedes Lebewesen des Katalogs als Kachel an', () => {
    for (const creature of listCreatures()) {
      expect(AUSWAHL).toContain(`data-creature={creature.id}`);
    }
  });
  it('trägt keine Kurzinfo mehr — sie steht im Regeln-Blatt, damit alle Köpfe ohne Scrollen passen', () => {
    expect(AUSWAHL).not.toContain('creature-detail');
  });
});
