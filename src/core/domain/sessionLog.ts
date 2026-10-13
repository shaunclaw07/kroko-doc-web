import { DEFAULT_CREATURE_ID, isKnownCreature } from './creature';
import { CSV_HEADER, type RoundRecord } from './records';
import {
  DEFAULT_MODE,
  DEFAULT_TEETH,
  MAX_LIVE_TEETH,
  RANDOM_MODES,
  isValidPlayerCount,
  isValidToothCount,
  type RandomMode,
} from './teeth';

/**
 * Rundenprotokoll als CSV. Die ersten drei Spalten sind absichtlich identisch mit dem
 * Format des Analyse-Werkzeugs (~/projects/kroko-doc), damit Daten austauschbar sind:
 * `runde;reihenfolge;verlierer_zahn`.
 *
 * Gelesen wird über die Spaltennamen der Kopfzeile, nicht über Positionen — so kann
 * später eine Spalte dazukommen, ohne dass alte Dateien falsch gedeutet werden.
 */
export function toCsv(records: readonly RoundRecord[]): string {
  const lines = [CSV_HEADER];
  for (const record of records) {
    lines.push(
      [
        record.round,
        record.pressOrder.join('-'),
        record.loserTooth,
        record.mode,
        record.teeth,
        record.players,
        record.pressIndex,
        record.liveCount,
        record.creature,
        record.playedAt,
      ].join(';'),
    );
  }
  return `${lines.join('\n')}\n`;
}

type FieldName =
  | 'round'
  | 'order'
  | 'loser'
  | 'mode'
  | 'teeth'
  | 'players'
  | 'press'
  | 'live'
  | 'creature'
  | 'time';

/** Bekannte Spaltennamen; unbekannte Spalten werden beim Lesen übergangen. */
const COLUMN_NAMES: Readonly<Record<string, FieldName>> = {
  runde: 'round',
  reihenfolge: 'order',
  verlierer_zahn: 'loser',
  modus: 'mode',
  zaehne: 'teeth',
  spieler: 'players',
  druck_nummer: 'press',
  scharfe_zaehne: 'live',
  lebewesen: 'creature',
  zeitpunkt: 'time',
};

/**
 * Positionen für Dateien OHNE Kopfzeile:
 * Analyse-Werkzeug (3 Spalten) und die frühere Fassung dieses Formulars (9 Spalten).
 * Ohne Kopfzeile gibt es kein Lebewesen — dort gilt das Krokodil.
 */
const LEGACY_POSITIONS: readonly FieldName[] = [
  'round',
  'order',
  'loser',
  'mode',
  'teeth',
  'players',
  'press',
  'live',
  'time',
];

function parseOrder(text: string): number[] {
  return text
    .split(/[-,\s]+/)
    .map((part) => Number.parseInt(part, 10))
    .filter((value) => Number.isInteger(value));
}

function isMode(value: string): value is RandomMode {
  return (RANDOM_MODES as readonly string[]).includes(value);
}

/**
 * Ist das ein Protokolleintrag, mit dem die Auswertung rechnen kann? Geprüft wird an **beiden**
 * Eingängen — CSV-Import und Ablage im Browser: eine Zahnzahl von 1000000000 in einer CSV-Zeile
 * ließe die Statistikseite sonst einen Zählvektor dieser Länge anlegen, bei jedem Laden neu.
 * Ein fehlendes Lebewesen ist erlaubt (Altdaten vor den Gebissen) — dort gilt das Krokodil.
 */
export function isPlausibleRecord(value: unknown): value is RoundRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Partial<RoundRecord>;
  const teeth = record.teeth;
  const inJaw = (tooth: unknown): boolean =>
    typeof tooth === 'number' && Number.isInteger(tooth) && tooth >= 1 && tooth <= (teeth ?? 0);
  return (
    typeof record.round === 'number' &&
    Number.isInteger(record.round) &&
    record.round >= 1 &&
    typeof teeth === 'number' &&
    isValidToothCount(teeth) &&
    inJaw(record.loserTooth) &&
    inJaw(record.pressIndex) &&
    typeof record.mode === 'string' &&
    isMode(record.mode) &&
    typeof record.players === 'number' &&
    isValidPlayerCount(record.players) &&
    typeof record.liveCount === 'number' &&
    Number.isInteger(record.liveCount) &&
    record.liveCount >= 0 &&
    record.liveCount <= MAX_LIVE_TEETH &&
    Array.isArray(record.pressOrder) &&
    record.pressOrder.every(inJaw) &&
    (record.creature === undefined || typeof record.creature === 'string')
  );
}

/** Liest das eigene Format, das Kurzformat des Werkzeugs und die frühere 9-Spalten-Fassung. */
export function fromCsv(text: string): RoundRecord[] {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(';'));
  if (rows.length === 0) {
    return [];
  }

  const first = rows[0] ?? [];
  const headerFields = first.map((cell) => COLUMN_NAMES[cell.trim().toLowerCase()]);
  const hasHeader = headerFields.some((field) => field !== undefined);
  const indexByName = new Map<FieldName, number>();
  if (hasHeader) {
    headerFields.forEach((field, position) => {
      if (field !== undefined && !indexByName.has(field)) {
        indexByName.set(field, position);
      }
    });
  }

  /** Kopfzeile: nur nach Namen suchen. Ohne Kopfzeile: feste Positionen. */
  const cell = (cells: readonly string[], field: FieldName): string | undefined => {
    if (hasHeader) {
      const position = indexByName.get(field);
      return position === undefined ? undefined : cells[position];
    }
    const position = LEGACY_POSITIONS.indexOf(field);
    return position < 0 ? undefined : cells[position];
  };

  const body = hasHeader ? rows.slice(1) : rows;
  const records: RoundRecord[] = [];
  body.forEach((cells, index) => {
    const loserTooth = Number.parseInt(cell(cells, 'loser') ?? '', 10);
    if (!Number.isInteger(loserTooth)) {
      return;
    }
    const pressOrder = parseOrder(cell(cells, 'order') ?? '');
    const teeth = Number.parseInt(cell(cells, 'teeth') ?? '', 10);
    const liveCount = Number.parseInt(cell(cells, 'live') ?? '', 10);
    const players = Number.parseInt(cell(cells, 'players') ?? '', 10);
    const modeRaw = (cell(cells, 'mode') ?? '').trim();
    // Kurzformat kennt kein Lebewesen; das Analyse-Werkzeug nur das 10-Zähne-Krokodil.
    const creatureRaw = (cell(cells, 'creature') ?? '').trim();
    const record: RoundRecord = {
      round: Number.parseInt(cell(cells, 'round') ?? '', 10) || index + 1,
      playedAt: (cell(cells, 'time') ?? '').trim(),
      creature: isKnownCreature(creatureRaw) ? creatureRaw : DEFAULT_CREATURE_ID,
      // Kurzformat kennt die Zahnzahl nicht. Statt sie zu raten, gilt der Spielstandard.
      teeth: Number.isInteger(teeth) ? teeth : DEFAULT_TEETH,
      mode: isMode(modeRaw) ? modeRaw : DEFAULT_MODE,
      players: Number.isInteger(players) ? players : 1,
      loserTooth,
      pressIndex:
        Number.parseInt(cell(cells, 'press') ?? '', 10) || Math.max(1, pressOrder.indexOf(loserTooth) + 1),
      liveCount: Number.isInteger(liveCount) ? liveCount : 0,
      pressOrder,
    };
    // Unmögliche Werte (Zahn außerhalb des Gebisses, Zahnzahl jenseits der Spielgrenzen) sind
    // kaputte Zeilen — übersprungen wie Zeilen ohne Verlierer-Zahn.
    if (isPlausibleRecord(record)) {
      records.push(record);
    }
  });
  return records;
}

export function nextRoundNumber(records: readonly RoundRecord[]): number {
  return records.reduce((max, record) => Math.max(max, record.round), 0) + 1;
}

export function createRoundRecord(input: {
  round: number;
  playedAt: string;
  mode: RandomMode;
  teeth: number;
  players: number;
  loserTooth: number;
  pressIndex: number;
  liveCount: number;
  pressOrder: readonly number[];
  creature?: string;
}): RoundRecord {
  const { creature, ...rest } = input;
  return {
    ...rest,
    creature: creature ?? DEFAULT_CREATURE_ID,
    pressOrder: [...input.pressOrder],
  };
}

/** Woran zwei Einträge als dieselbe Runde erkannt werden — die laufende Nummer gehört nicht dazu. */
function roundIdentity(record: RoundRecord): string {
  return [record.playedAt, record.creature, record.teeth, record.mode, record.pressOrder.join('-')].join('|');
}

/**
 * Führt zwei Stände desselben Protokolls zusammen (Gerät und Sicherung). Der Stand der Sicherung
 * bleibt, wie er ist; was nur das Gerät kennt — die Runden seit dem letzten Abgleich —, wird
 * angehängt und weitergezählt. Gleiche Einträge zählen **je Vorkommen**: zwei Runden ohne
 * Zeitpunkt (Kurzformat-Import) mit derselben Druckfolge sind zwei Runden, nicht eine.
 */
export function mergeRoundLogs(local: readonly RoundRecord[], remote: readonly RoundRecord[]): RoundRecord[] {
  const unmatched = new Map<string, number>();
  for (const record of remote) {
    const key = roundIdentity(record);
    unmatched.set(key, (unmatched.get(key) ?? 0) + 1);
  }
  const merged = [...remote];
  let next = nextRoundNumber(remote);
  for (const record of local) {
    const key = roundIdentity(record);
    const left = unmatched.get(key) ?? 0;
    if (left > 0) {
      unmatched.set(key, left - 1);
      continue;
    }
    merged.push({ ...record, round: next });
    next += 1;
  }
  return merged;
}
