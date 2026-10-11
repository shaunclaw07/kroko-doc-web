import { getCreature, listCreatures } from '../../../core/domain/creature';
import { createCreatureView } from './factory';
import { crocodileArtwork } from './crocodile';
import { humanArtwork } from './human';
import { lionArtwork } from './lion';
import { mouseArtwork } from './mouse';
import { pandaArtwork } from './panda';
import { pantherArtwork } from './panther';
import { sabertoothArtwork } from './sabertooth';
import { sharkArtwork } from './shark';
import { vampireArtwork } from './vampire';
import { wolfArtwork } from './wolf';
import type { CreatureArtwork, CreatureView } from './types';

/**
 * Registry der Zeichnungen. Ein neues Lebewesen braucht:
 *   1. einen Eintrag im Katalog (core/domain/creature.ts),
 *   2. ein Kunstwerk-Modul wie crocodile.ts,
 *   3. eine Zeile in dieser Zuordnung.
 * Der Test creatureViews.test.ts prüft, dass Katalog und Registry zusammenpassen.
 */
export const ARTWORKS: Readonly<Record<string, CreatureArtwork>> = {
  crocodile: crocodileArtwork,
  wolf: wolfArtwork,
  human: humanArtwork,
  shark: sharkArtwork,
  mouse: mouseArtwork,
  vampire: vampireArtwork,
  panda: pandaArtwork,
  lion: lionArtwork,
  panther: pantherArtwork,
  sabertooth: sabertoothArtwork,
};

/**
 * Zeichnung eines Lebewesens. `teeth` überschreibt die Zahnzahl aus dem Katalog — damit ist
 * die Zahl drückbarer Zähne einstellbar (Standard bleibt das tiergerechte Gebiss).
 */
export function creatureView(id: string, teeth?: number): CreatureView {
  const creature = getCreature(id);
  const artwork = ARTWORKS[creature.id];
  if (!artwork) {
    throw new Error(`creature '${creature.id}' has no artwork`);
  }
  const count = teeth === undefined ? creature.teeth : teeth;
  return createCreatureView({ ...creature, teeth: count }, artwork);
}

/** Alle Zeichnungen in Katalogreihenfolge — Grundlage der Auswahl in der Oberfläche. */
export function listCreatureViews(): CreatureView[] {
  return listCreatures().map((creature) => creatureView(creature.id));
}

/**
 * Kopfbild eines Lebewesens (für Kacheln und Vorschauen). `suffix` hält die Beschnitt-Kennung
 * eindeutig: beide Blätter und die Bühne stehen gleichzeitig im Dokument.
 */
export function creaturePortrait(id: string, suffix: string): string {
  return creatureView(id).portrait(suffix);
}

/** Erlaubter Bereich drückbarer Zähne (für die Oberfläche). */
export { MAX_TEETH, MIN_TEETH } from '../../../core/domain/teeth';

export type { CreatureView } from './types';
