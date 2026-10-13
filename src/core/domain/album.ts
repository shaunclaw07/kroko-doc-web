import { CREATURES, creatureOrDefault } from './creature';

/**
 * Das Tier-Album: bis zu drei Sterne je Lebewesen, **abgeleitet** aus dem Rundenprotokoll. Es gibt
 * keinen eigenen Speicher — wer das Protokoll löscht, löscht die Sterne, und die Zahl kann nie von
 * den Runden abweichen, aus denen sie stammt.
 *
 * Die Sterne sind Glück, kein Können: welcher Zahn scharf ist, entscheidet allein der Zufall.
 */
export const ALBUM_STARS = ['played', 'halfway', 'lastTooth'] as const;
export type AlbumStar = (typeof ALBUM_STARS)[number];

export interface AlbumPage {
  /** Kennung aus dem Katalog. */
  creature: string;
  name: string;
  /** Gespielte Runden mit diesem Tier, egal mit wie vielen Zähnen. */
  rounds: number;
  /** Verdiente Sterne in der Reihenfolge von `ALBUM_STARS`. */
  stars: readonly AlbumStar[];
}

export interface NewStar {
  creature: string;
  name: string;
  star: AlbumStar;
}

/** Was das Album von einer Runde wissen muss — jeder Protokolleintrag erfüllt das. */
export interface AlbumRound {
  creature?: string;
  teeth: number;
  /** Der Druck, bei dem es schnappte (1-basiert). */
  pressIndex: number;
}

/**
 * Zählt eine Runde mit dieser Zahnzahl für alle drei Sterne? Ja ab dem **ganzen Gebiss** des
 * Tiers: mit zwei eingestellten Zähnen wäre ein einziger harmloser Druck schon „halb geschafft"
 * und „bis zum letzten Zahn" zugleich.
 *
 * **Mehr Zähne zählen auch** (seit dem 13.10.2026, gemeldet vom Auftraggeber: das Krokodil gab mit
 * 12 Zähnen keinen Stern, obwohl nur noch ein Zahn übrig war). Vorher galt nur genau die Zahnzahl
 * des Katalogs. Leichter wird es mit mehr Zähnen nicht: die Hälfte ist mehr, und der letzte Zahn
 * ist seltener der scharfe.
 */
export function earnsAllStars(creature: string | undefined, teeth: number): boolean {
  return teeth >= creatureOrDefault(creature).teeth;
}

/** Sterne einer einzelnen Runde; unter dem ganzen Gebiss gibt es nur „gespielt". */
export function starsOfRound(round: AlbumRound): AlbumStar[] {
  const stars: AlbumStar[] = ['played'];
  if (!earnsAllStars(round.creature, round.teeth)) {
    return stars;
  }
  const harmless = round.pressIndex - 1;
  if (harmless >= Math.ceil(round.teeth / 2)) {
    stars.push('halfway');
  }
  if (round.pressIndex === round.teeth) {
    stars.push('lastTooth');
  }
  return stars;
}

/** Eine Seite je Katalogtier, in Katalogreihenfolge. */
export function albumFromRecords(records: readonly AlbumRound[]): AlbumPage[] {
  const earned = new Map<string, { rounds: number; stars: Set<AlbumStar> }>();
  for (const record of records) {
    const id = creatureOrDefault(record.creature).id;
    const entry = earned.get(id) ?? { rounds: 0, stars: new Set<AlbumStar>() };
    entry.rounds += 1;
    for (const star of starsOfRound(record)) {
      entry.stars.add(star);
    }
    earned.set(id, entry);
  }
  return CREATURES.map((creature) => {
    const entry = earned.get(creature.id);
    return {
      creature: creature.id,
      name: creature.name,
      rounds: entry?.rounds ?? 0,
      stars: ALBUM_STARS.filter((star) => entry?.stars.has(star) ?? false),
    };
  });
}

/** Sterne, die in `after` stehen und in `before` noch nicht — in Katalog- und Sternreihenfolge. */
export function newStars(before: readonly AlbumPage[], after: readonly AlbumPage[]): NewStar[] {
  const found: NewStar[] = [];
  for (const page of after) {
    const had = before.find((entry) => entry.creature === page.creature)?.stars ?? [];
    for (const star of page.stars) {
      if (!had.includes(star)) {
        found.push({ creature: page.creature, name: page.name, star });
      }
    }
  }
  return found;
}
