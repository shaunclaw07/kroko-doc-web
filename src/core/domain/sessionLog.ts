import { CSV_HEADER, type RoundRecord } from './records';
import { DEFAULT_TEETH, RANDOM_MODES, type RandomMode } from './teeth';

/**
 * Rundenprotokoll als CSV. Die ersten drei Spalten sind absichtlich identisch mit dem
 * Format des Analyse-Werkzeugs (~/projects/kroko-doc), damit Daten austauschbar sind:
 * `runde;reihenfolge;verlierer_zahn`.
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
        record.playedAt,
      ].join(';'),
    );
  }
  return `${lines.join('\n')}\n`;
}

function parseOrder(text: string): number[] {
  return text
    .split(/[-,\s]+/)
    .map((part) => Number.parseInt(part, 10))
    .filter((value) => Number.isInteger(value));
}

function isMode(value: string): value is RandomMode {
  return (RANDOM_MODES as readonly string[]).includes(value);
}

/** Liest sowohl das volle Format als auch die drei Spalten des Analyse-Werkzeugs. */
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
  const hasHeader = first.some((cell) => /[a-zäöü]/i.test(cell));
  const body = hasHeader ? rows.slice(1) : rows;
  const records: RoundRecord[] = [];
  body.forEach((cells, index) => {
    const [roundRaw, orderRaw, loserRaw, modeRaw, teethRaw, playersRaw, pressRaw, liveRaw, timeRaw] = cells;
    const loserTooth = Number.parseInt(loserRaw ?? '', 10);
    if (!Number.isInteger(loserTooth)) {
      return;
    }
    const pressOrder = parseOrder(orderRaw ?? '');
    const teeth = Number.parseInt(teethRaw ?? '', 10);
    const liveCount = Number.parseInt(liveRaw ?? '', 10);
    records.push({
      round: Number.parseInt(roundRaw ?? '', 10) || index + 1,
      playedAt: (timeRaw ?? '').trim() || '',
      // Kurzformat kennt die Zahnzahl nicht. Statt sie zu raten, gilt der Spielstandard;
      // das Analyse-Werkzeug kennt nur das 10-Zähne-Krokodil.
      teeth: Number.isInteger(teeth) ? teeth : DEFAULT_TEETH,
      mode: isMode((modeRaw ?? '').trim()) ? ((modeRaw ?? '').trim() as RandomMode) : 'original',
      players: Number.parseInt(playersRaw ?? '', 10) || 1,
      loserTooth,
      pressIndex: Number.parseInt(pressRaw ?? '', 10) || Math.max(1, pressOrder.indexOf(loserTooth) + 1),
      liveCount: Number.isInteger(liveCount) ? liveCount : 0,
      pressOrder,
    });
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
}): RoundRecord {
  return { ...input, pressOrder: [...input.pressOrder] };
}
