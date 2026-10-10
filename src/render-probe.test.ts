/**
 * Zeichnungs-Sonde: schreibt für jedes Lebewesen im Katalog ein eigenständiges SVG in ein
 * Arbeitsverzeichnis, damit die Zeichnung ohne Browser begutachtet werden kann.
 *
 * Aufruf:  pnpm vitest run src/render-probe.test.ts
 * Ausgabe: <TMPDIR>/zahn_agent-artwork/<lebewesen>.svg — im Browser zu öffnen
 * Weiter:  scripts/artwork-png.py rastern (für Prüfer ohne Browser)
 *
 * Der Vertrag der Zeichnungen steht in presentation/game/creatures/creatureViews.test.ts.
 * Diese Sonde prüft bewusst schlank und macht die Zeichnung sichtbar — sie ersetzt die
 * Vertragsprüfung nicht.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CREATURES } from './core/domain/creature';
import { listCreatureViews } from './presentation/game/creatures';

const OUT = join(process.env.TMPDIR ?? tmpdir(), 'zahn_agent-artwork');

/** Bühnenmarkup als eigenständige Datei: mit Namensraum, damit Browser und Rasterer sie lesen. */
function standalone(markup: string): string {
  return markup.includes('xmlns=')
    ? markup
    : markup.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
}

describe('Zeichnungs-Sonde', () => {
  mkdirSync(OUT, { recursive: true });

  for (const view of listCreatureViews()) {
    it(`schreibt ${view.id} als SVG zum Ansehen`, () => {
      const markup = view.render();
      expect(markup.startsWith('<svg')).toBe(true);
      // Der Schließweg steckt im Markup — die Sonde prüft, dass er zur Ansicht passt.
      expect(markup).toContain(`--close-shift: ${view.closeShift.toFixed(1)}px`);
      writeFileSync(join(OUT, `${view.id}.svg`), standalone(markup));
      console.log(`${view.id}: ${join(OUT, `${view.id}.svg`)}`);
    });
  }

  it('deckt jedes Lebewesen des Katalogs ab', () => {
    expect(listCreatureViews().map((view) => view.id).sort()).toEqual(
      CREATURES.map((creature) => creature.id).sort(),
    );
  });
});
