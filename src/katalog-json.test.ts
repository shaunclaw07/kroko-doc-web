/**
 * Katalog-Sonde: exportiert die Tierdaten und Freischaltung nach `scripts/katalog.json`, damit
 * Python-Sonden dieselben Daten nutzen wie der TypeScript-Kern — ohne Dopplung.
 *
 * Neu erzeugen (nach Änderungen am Katalog oder der Freischaltung):
 *     KATALOG_NEU=1 pnpm test:run
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { listCreatures } from './core/domain/creature';
import { UNLOCK_ORDER, UNLOCK_STEPS } from './core/domain/unlocks';

const PROJEKT = fileURLToPath(new URL('..', import.meta.url));
const KATALOG_DATEI = join(PROJEKT, 'scripts', 'katalog.json');

export function buildKatalogJson(): string {
  const data = {
    creatures: listCreatures().map((creature) => ({
      id: creature.id,
      name: creature.name,
      teeth: creature.teeth,
    })),
    unlockOrder: UNLOCK_ORDER,
    unlockSteps: UNLOCK_STEPS.map((step) => ({
      creature: step.creature,
      stars: step.stars,
    })),
  };
  return `${JSON.stringify(data, null, 2)}\n`;
}

describe('Katalogdatei für die Sonden (scripts/katalog.json)', () => {
  it('stimmt mit dem Fachmodell überein', () => {
    const erwartet = buildKatalogJson();
    if (process.env.KATALOG_NEU === '1') {
      writeFileSync(KATALOG_DATEI, erwartet, 'utf8');
      console.log(`neu erzeugt: ${KATALOG_DATEI}`);
    }
    expect(
      existsSync(KATALOG_DATEI),
      'scripts/katalog.json fehlt — mit KATALOG_NEU=1 pnpm test:run erzeugen',
    ).toBe(true);
    expect(readFileSync(KATALOG_DATEI, 'utf8')).toBe(erwartet);
  });
});
