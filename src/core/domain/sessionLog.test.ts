import { describe, expect, it } from 'vitest';
import { createRoundRecord, fromCsv, nextRoundNumber, toCsv } from './sessionLog';

const record = createRoundRecord({
  round: 1,
  playedAt: '2026-10-10T09:40:00.000Z',
  mode: 'original',
  teeth: 10,
  players: 2,
  loserTooth: 4,
  pressIndex: 3,
  liveCount: 2,
  pressOrder: [1, 2, 4],
});

describe('toCsv', () => {
  it('schreibt Kopfzeile und Runde', () => {
    const csv = toCsv([record]);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toContain('runde;reihenfolge;verlierer_zahn');
    expect(lines[0]).toContain('lebewesen');
    expect(lines[1]).toBe('1;1-2-4;4;original;10;2;3;2;crocodile;2026-10-10T09:40:00.000Z');
  });

  it('schreibt eine leere Liste als reine Kopfzeile', () => {
    expect(toCsv([]).trim().split('\n')).toHaveLength(1);
  });
});

describe('fromCsv', () => {
  it('liest das eigene Format unverändert zurück', () => {
    expect(fromCsv(toCsv([record]))).toEqual([record]);
  });

  it('gibt das Lebewesen unverändert zurück', () => {
    const wolf = createRoundRecord({ ...record, round: 2, creature: 'wolf', teeth: 12, loserTooth: 9 });
    const back = fromCsv(toCsv([record, wolf]));
    expect(back).toHaveLength(2);
    expect(back[0]?.creature).toBe('crocodile');
    expect(back[1]?.creature).toBe('wolf');
    expect(back[1]?.teeth).toBe(12);
  });

  it('liest das Kurzformat des Analyse-Werkzeugs', () => {
    const csv = 'runde;reihenfolge;verlierer_zahn\n1;3-7-1-2-9;1\n2;5-2-8-10-4-6-7-9-1-3;3\n';
    const records = fromCsv(csv);
    expect(records).toHaveLength(2);
    expect(records[0]?.loserTooth).toBe(1);
    expect(records[0]?.pressIndex).toBe(3);
    expect(records[0]?.teeth).toBe(10);
    expect(records[1]?.pressIndex).toBe(10);
    expect(records[1]?.mode).toBe('original');
  });

  it('liest die frühere Fassung ohne Lebewesen-Spalte (dort gilt das Krokodil)', () => {
    const csv =
      'runde;reihenfolge;verlierer_zahn;modus;zaehne;spieler;druck_nummer;scharfe_zaehne;zeitpunkt\n' +
      '1;1-2-4;4;original;10;2;3;2;2026-10-10T09:40:00.000Z\n';
    const records = fromCsv(csv);
    expect(records).toHaveLength(1);
    expect(records[0]?.creature).toBe('crocodile');
    expect(records[0]?.playedAt).toBe('2026-10-10T09:40:00.000Z');
    expect(records[0]?.pressIndex).toBe(3);
  });

  it('deutet eine unbekannte Kennung nicht, sondern nimmt das Krokodil', () => {
    const csv =
      'runde;reihenfolge;verlierer_zahn;modus;zaehne;spieler;druck_nummer;scharfe_zaehne;lebewesen;zeitpunkt\n' +
      '1;1-2-4;4;original;10;2;3;2;drache;2026-10-10T09:40:00.000Z\n';
    expect(fromCsv(csv)[0]?.creature).toBe('crocodile');
  });

  it('überspringt kaputte Zeilen, statt zu werfen', () => {
    const records = fromCsv('1;1-2-3;x\n2;1-2-3;3\n\n');
    expect(records).toHaveLength(1);
    expect(records[0]?.round).toBe(2);
  });

  it('liefert für leere Eingabe eine leere Liste', () => {
    expect(fromCsv('')).toEqual([]);
  });
});

describe('nextRoundNumber', () => {
  it('zählt ab der höchsten vorhandenen Nummer weiter', () => {
    expect(nextRoundNumber([])).toBe(1);
    expect(nextRoundNumber([record, { ...record, round: 7 }])).toBe(8);
  });
});
