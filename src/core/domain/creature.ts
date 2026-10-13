import { DomainError } from './errors';
import { isValidToothCount } from './teeth';

/**
 * Ein Lebewesen mit eigenem Gebiss. Die Zahl der drückbaren Zähne ist eine
 * Spielentscheidung (Bildschirmgröße), die echte Zahnzahl steht nur zur Info daneben.
 */
export interface CreatureDefinition {
  id: string;
  name: string;
  /**
   * Kurzer Name für die Kachel der Auswahl, wo der volle nicht passt: „Venusfliegenfalle" bricht
   * auf der 65-px-Kachel in drei Zeilen und macht ihre Reihe höher als die anderen (gemessen,
   * `scripts/pruefen-freischaltung.py`). Sätze und Vorleser nennen immer den vollen Namen.
   */
  shortName?: string;
  /** Drückbare Zähne im Spiel. */
  teeth: number;
  /** Untere Grenze gleichzeitig scharfer Zähne (Originalmodell). */
  liveTeethMin: number;
  /** Obere Grenze gleichzeitig scharfer Zähne (Originalmodell). */
  liveTeethMax: number;
  /**
   * Zahnzahl des echten Lebewesens — nur als Notiz in der Oberfläche. `0` heißt: das Vorbild hat
   * gar keine Zähne (die Venusfliegenfalle trägt Borsten); die Oberfläche sagt das dann so.
   */
  realTeeth: number;
  /** Ein Satz für die Auswahl. */
  note: string;
  /** Ein Satz über das **echte** Tier, für Kinder — steht nach dem Biss unter dem Ergebnis. */
  fact: string;
}

/** Längster erlaubter Satz: mehr passt nach dem Biss nicht unter das Ergebnis (gemessen, Sonde). */
export const MAX_FACT_LENGTH = 110;

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
    fact: 'Einem Krokodil wachsen neue Zähne nach — viele Male in seinem Leben.',
  },
  {
    id: 'wolf',
    name: 'Wolf',
    teeth: 12,
    liveTeethMin: 1,
    liveTeethMax: 2,
    realTeeth: 42,
    note: 'Zwei lange Fangzähne und drei breite Schneidezähne, aber nur 1–2 scharfe Zähne: der Biss kommt selten, dann sitzt er.',
    fact: 'Ein Wolf hat 42 Zähne. Das sind zehn mehr, als ein erwachsener Mensch hat.',
  },
  {
    id: 'human',
    name: 'Mensch',
    teeth: 12,
    liveTeethMin: 1,
    liveTeethMax: 3,
    realTeeth: 32,
    note: 'Schneide-, Eck- und Backenzähne, 1–3 scharfe Zähne — das Zahnarzt-Gefühl.',
    fact: 'Du bekommst zweimal Zähne: erst 20 Milchzähne, später bis zu 32 bleibende.',
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
    fact: 'Ein Hai verliert ständig Zähne. Dahinter wartet schon die nächste Reihe.',
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
    fact: 'Die Nagezähne einer Maus wachsen ihr ganzes Leben lang. Darum nagt sie so viel.',
  },
  {
    id: 'vampire',
    name: 'Vampir',
    teeth: 12,
    liveTeethMin: 1,
    liveTeethMax: 2,
    // Der Witz: ein Vampir hat ein menschliches Gebiss — mit zwei langen Eckzähnen.
    realTeeth: 32,
    note: 'Zwei lange Eckzähne — welcher Zahn scharf ist, entscheidet aber auch hier der Zufall.',
    fact: 'Vampire gibt es nur in Geschichten. Ihre spitzen Zähne heißen bei dir Eckzähne.',
  },
  {
    id: 'panda',
    name: 'Panda',
    teeth: 12,
    liveTeethMin: 1,
    liveTeethMax: 2,
    // Wie die meisten Bären 42 Zähne; die hinteren Backenzähne sind breiter — er zermahlt Bambus.
    realTeeth: 42,
    note: 'Breite Mahlzähne statt Reißzähne: der Bambusfresser beißt nur selten zu.',
    fact: 'Ein Panda frisst fast nur Bambus. Dafür hat er besonders breite Backenzähne.',
  },
  {
    id: 'lion',
    name: 'Löwe',
    teeth: 12,
    liveTeethMin: 1,
    liveTeethMax: 2,
    // 30 Zähne (I 3/3, C 1/1, P 3/2, M 1/1) — weniger als der Wolf, dafür zwei lange Fangzähne.
    realTeeth: 30,
    note: 'Mähne, zwei lange Fangzähne und drei breite Schneidezähne: der König beißt selten zu, dann aber richtig.',
    fact: 'Ein Löwe hat 30 Zähne. Die vier langen heißen Fangzähne.',
  },
  {
    id: 'panther',
    name: 'Panther',
    teeth: 12,
    liveTeethMin: 1,
    liveTeethMax: 2,
    // Schwarzer Panther = melanistische Form des Leoparden, 30 Zähne (I 3/3, C 1/1, P 3/2, M 1/1).
    realTeeth: 30,
    note: 'Vier Fangzähne, je einer oben und unten links und rechts: die Raubkatze beißt selten zu, dann aber richtig.',
    fact: 'Ein schwarzer Panther ist ein Leopard mit schwarzem Fell.',
  },
  {
    id: 'sabertooth',
    name: 'Säbelzahntiger',
    teeth: 12,
    liveTeethMin: 1,
    liveTeethMax: 2,
    // Smilodon hatte 26 bis 28 Zähne — der untere Wert steht hier, die Spanne in der Notiz.
    realTeeth: 26,
    note: 'Zwei Säbel oben und zwei kurze Eckzähne unten: der längste Zahn im Spiel ist fast doppelt so lang wie der Fangzahn des Löwen.',
    fact: 'Seine Säbel ragten bis zu 20 cm aus dem Kiefer. Das Tier ist seit rund 12.000 Jahren ausgestorben.',
  },
  {
    id: 'flytrap',
    name: 'Venusfliegenfalle',
    shortName: 'Fliegenfalle',
    // Bonusfigur (ab 20 Sternen). Acht Zähne: eine eigene Rundenlänge zwischen Maus und Krokodil.
    teeth: 8,
    liveTeethMin: 1,
    liveTeethMax: 2,
    // Eine Pflanze hat keine Zähne: am Rand der Klappe stehen Borsten. Eine belegte Zahl je
    // Blatthälfte gibt es nicht (docs/tier-quellen.md) — also steht hier keine erfundene.
    realTeeth: 0,
    note: 'Eine Pflanze, die zuschnappt: was wie Zähne aussieht, sind Borsten am Rand der Klappe. Nur acht davon — eine kurze Runde.',
    fact: 'Die Venusfliegenfalle ist eine Pflanze. Ihre Klappe schnappt in einer Zehntelsekunde zu.',
  },
  {
    id: 'trex',
    name: 'T-Rex',
    // Bonusfigur und letztes Ziel (ab 28 Sternen): volles Gebiss **und** bis zu drei scharfe Zähne —
    // der dritte Stern gelingt hier in 2,8 % der Runden, seltener als bei jedem anderen.
    teeth: 12,
    liveTeethMin: 1,
    liveTeethMax: 3,
    // Je Seite 4 Zähne im Zwischenkiefer, 12 im Oberkiefer, 13 im Unterkiefer: 2 × 29 = 58.
    realTeeth: 58,
    note: 'Der König der Dinosaurier: zwölf Zähne und 1–3 davon scharf. Wer hier bis zum letzten Zahn kommt, hat das größte Glück im Spiel.',
    fact: 'Der längste Zahn eines T-Rex war mit Wurzel etwa 30 cm lang — so lang wie ein Lineal.',
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

/** Lebewesen einer Runde; fehlt die Kennung (Altdaten) oder ist sie unbekannt, gilt das Krokodil. */
export function creatureOrDefault(id: string | undefined): CreatureDefinition {
  return getCreature(id !== undefined && isKnownCreature(id) ? id : DEFAULT_CREATURE_ID);
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
  if (!Number.isInteger(creature.realTeeth) || (creature.realTeeth !== 0 && creature.realTeeth < creature.teeth)) {
    problems.push(`${creature.id}: realTeeth must be 0 (no teeth at all) or at least the number of teeth`);
  }
  if (creature.note.trim().length === 0) {
    problems.push(`${creature.id}: note is empty`);
  }
  if (creature.fact.trim().length === 0) {
    problems.push(`${creature.id}: fact is empty`);
  }
  if (creature.fact.length > MAX_FACT_LENGTH) {
    problems.push(`${creature.id}: fact is longer than ${MAX_FACT_LENGTH} characters`);
  }
  return problems;
}
