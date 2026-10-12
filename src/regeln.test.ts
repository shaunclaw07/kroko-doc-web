/**
 * Wächter des Regeln-Blatts: was dort über die Tiere steht, muss zum Katalog passen.
 *
 * Am 12.10.2026 nannte das Blatt sechs Tiere, der Katalog hatte zehn; und die Notiz des Vampirs
 * behauptete „meist sind genau die [Eckzähne] scharf", obwohl die Auswahl gleichverteilt zieht.
 * Diese Datei liegt **neben** `src/pages/` (ein Test darin bricht den Bau, siehe `auswahl.test.ts`).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { listCreatures } from './core/domain/creature';
import { expectedPresses, modeKWeights, pressPositionDistribution } from './core/domain/probabilities';

const SEITE = readFileSync(new URL('./pages/index.astro', import.meta.url), 'utf8');
/** Das Blatt als eine Zeile — der Fließtext ist im Markup umbrochen. */
const REGELN = SEITE.slice(SEITE.indexOf('id="rules-sheet"'), SEITE.indexOf('<script>'))
  .split(/\s+/)
  .join(' ');
const MARKE = ' stellen <strong>1–3 Zähne gleichzeitig scharf</strong>';

describe('Regeln-Blatt', () => {
  it('nennt genau die Tiere mit 1–3 scharfen Zähnen beim Namen', () => {
    const ende = REGELN.indexOf(MARKE);
    expect(ende, 'der Satz über die 1–3-Tiere fehlt').toBeGreaterThan(-1);
    const satz = REGELN.slice(REGELN.lastIndexOf('.', ende) + 1, ende);
    for (const creature of listCreatures()) {
      expect(satz.includes(creature.name), creature.name).toBe(creature.liveTeethMax === 3);
    }
  });

  it('nennt die erwarteten Drücke bei 12 Zähnen so, wie das Modell sie rechnet', () => {
    const komma = (wert: number): string => wert.toFixed(2).replace('.', ',');
    const eng = expectedPresses(pressPositionDistribution(12, modeKWeights('original', 1, 2)));
    const weit = expectedPresses(pressPositionDistribution(12, modeKWeights('original', 1, 3)));
    expect(REGELN).toContain(`${komma(eng)} statt ${komma(weit)}`);
  });

  it('behauptet in keiner Tier-Notiz, bestimmte Zähne seien öfter scharf', () => {
    for (const creature of listCreatures()) {
      expect(creature.note, creature.id).not.toMatch(/meist|häufiger/i);
    }
  });
});
