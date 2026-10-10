import { DomainError } from './errors';
import { isValidToothCount } from './teeth';

/**
 * Ein Lebewesen mit eigenem Gebiss. Die Zahl der drückbaren Zähne ist eine
 * Spielentscheidung (Bildschirmgröße), die echte Zahnzahl steht nur zur Info daneben.
 */
export interface CreatureDefinition {
  id: string;
  name: string;
  /** Drückbare Zähne im Spiel. */
  teeth: number;
  /** Untere Grenze gleichzeitig scharfer Zähne (Originalmodell). */
  liveTeethMin: number;
  /** Obere Grenze gleichzeitig scharfer Zähne (Originalmodell). */
  liveTeethMax: number;
  /** Zahnzahl des echten Lebewesens — nur als Notiz in der Oberfläche. */
  realTeeth: number;
  /** Ein Satz für die Auswahl. */
  note: string;
}

export const DEFAULT_CREATURE_ID = 'crocodile';

/** Katalog aller spielbaren Lebewesen. Ein neues Tier ist hier ein Eintrag plus Zeichnung. */
export const CREATURES: readonly CreatureDefinition[] = [
  {
    id: 'crocodile',
    name: 'Krokodil',
    teeth: 10,
    liveTeethMin: 1,
    liveTeethMax: 3,
    realTeeth: 32,
    note: 'Der Klassiker: breiter Kiefer, 1–3 Zähne gleichzeitig scharf (wie das echte Spielzeug).',
  },
  {
    id: 'wolf',
    name: 'Wolf',
    teeth: 12,
    liveTeethMin: 1,
    liveTeethMax: 2,
    realTeeth: 42,
    note: 'Vier große Fangzähne, aber nur 1–2 scharfe Zähne: der Biss kommt selten, dann sitzt er.',
  },
  {
    id: 'human',
    name: 'Mensch',
    teeth: 12,
    liveTeethMin: 1,
    liveTeethMax: 3,
    realTeeth: 32,
    note: 'Schneide-, Eck- und Backenzähne, 1–3 scharfe Zähne — das Zahnarzt-Gefühl.',
  },
  {
    id: 'shark',
    name: 'Hai',
    teeth: 12,
    liveTeethMin: 1,
    liveTeethMax: 2,
    // Ein Hai trägt Hunderte Zähne in Reihen — die Notiz ist ein Spaßfakt, keine Spielzahl.
    realTeeth: 300,
    note: 'Reihen runder Raubtierzähne: der Biss kommt selten, dann sitzt er.',
  },
  {
    id: 'mouse',
    name: 'Maus',
    teeth: 6,
    liveTeethMin: 1,
    liveTeethMax: 2,
    // Echte Maus: vier Nagezähne plus zwölf Backenzähne.
    realTeeth: 16,
    note: 'Nur sechs Zähne — die kürzeste Runde, also schnell viel Spannung.',
  },
  {
    id: 'vampire',
    name: 'Vampir',
    teeth: 12,
    liveTeethMin: 1,
    liveTeethMax: 2,
    // Der Witz: ein Vampir hat ein menschliches Gebiss — mit zwei langen Eckzähnen.
    realTeeth: 32,
    note: 'Zwei lange Eckzähne, meist sind genau die scharf.',
  },
];

export function listCreatures(): readonly CreatureDefinition[] {
  return CREATURES;
}

export function isKnownCreature(id: string): boolean {
  return CREATURES.some((creature) => creature.id === id);
}

export function getCreature(id: string = DEFAULT_CREATURE_ID): CreatureDefinition {
  const found = CREATURES.find((creature) => creature.id === id);
  if (!found) {
    throw new DomainError('unknown-creature', `creature '${id}' is not known`);
  }
  return found;
}

/** Prüft einen Katalogeintrag auf Widersprüche — genutzt vom Katalogtest. */
export function validateCreature(creature: CreatureDefinition): string[] {
  const problems: string[] = [];
  if (!isValidToothCount(creature.teeth)) {
    problems.push(`${creature.id}: teeth ${creature.teeth} is outside the allowed range`);
  }
  if (!Number.isInteger(creature.liveTeethMin) || creature.liveTeethMin < 1) {
    problems.push(`${creature.id}: liveTeethMin must be at least 1`);
  }
  if (creature.liveTeethMax < creature.liveTeethMin) {
    problems.push(`${creature.id}: liveTeethMax is below liveTeethMin`);
  }
  if (creature.liveTeethMax > creature.teeth) {
    problems.push(`${creature.id}: liveTeethMax exceeds the number of teeth`);
  }
  if (creature.note.trim().length === 0) {
    problems.push(`${creature.id}: note is empty`);
  }
  return problems;
}
