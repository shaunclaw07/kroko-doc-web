import { describe, expect, it } from 'vitest';
import { createRoundRecord, fromCsv, isPlausibleRecord, mergeRoundLogs, nextRoundNumber, toCsv } from './sessionLog';

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

  it('überspringt Zeilen mit unmöglichen Werten — eine Zahnzahl von einer Milliarde legt nichts lahm', () => {
    const kopf = 'runde;reihenfolge;verlierer_zahn;modus;zaehne;spieler;druck_nummer;scharfe_zaehne;lebewesen;zeitpunkt';
    const records = fromCsv(
      [
        kopf,
        '1;1-2-4;4;original;1000000000;2;3;2;crocodile;x', // Zahnzahl jenseits der Spielgrenze
        '2;1-2-4;4;original;0;2;3;2;crocodile;x', // kein Gebiss
        '3;1-2-11;11;original;10;2;3;2;crocodile;x', // Verlierer-Zahn außerhalb des Gebisses
        '4;1-2-4;4;original;10;2;12;2;crocodile;x', // Druck-Nummer größer als die Zahnzahl
        '5;1-2-4;4;original;10;9;3;2;crocodile;x', // neun Spieler
        '6;1-2-4;4;original;10;2;3;2;crocodile;x',
      ].join('\n'),
    );
    expect(records.map((entry) => entry.round)).toEqual([6]);
  });
});

describe('isPlausibleRecord', () => {
  it('nimmt einen echten Eintrag und Altdaten ohne Lebewesen an', () => {
    expect(isPlausibleRecord(record)).toBe(true);
    const { creature: _creature, ...older } = record;
    expect(isPlausibleRecord(older)).toBe(true);
  });

  it('nimmt das Kurzformat des Analyse-Werkzeugs an (keine scharfen Zähne bekannt)', () => {
    expect(fromCsv(['runde;reihenfolge;verlierer_zahn', '1;3-7-1-2-9;1'].join('\n'))).toHaveLength(1);
  });

  it('weist ab, was kein Eintrag ist', () => {
    for (const garbage of [null, undefined, 7, 'x', [], {}]) {
      expect(isPlausibleRecord(garbage)).toBe(false);
    }
    expect(isPlausibleRecord({ ...record, teeth: 13 })).toBe(false);
    expect(isPlausibleRecord({ ...record, loserTooth: 0 })).toBe(false);
    expect(isPlausibleRecord({ ...record, pressIndex: 2.5 })).toBe(false);
    expect(isPlausibleRecord({ ...record, mode: 'schnell' })).toBe(false);
    expect(isPlausibleRecord({ ...record, pressOrder: 'eins' })).toBe(false);
    expect(isPlausibleRecord({ ...record, liveCount: 4 })).toBe(false);
  });
});

describe('nextRoundNumber', () => {
  it('zählt ab der höchsten vorhandenen Nummer weiter', () => {
    expect(nextRoundNumber([])).toBe(1);
    expect(nextRoundNumber([record, { ...record, round: 7 }])).toBe(8);
  });
});

describe('mergeRoundLogs', () => {
  const at = (minute: number, round: number) =>
    ({ ...record, round, playedAt: `2026-10-10T09:${String(minute).padStart(2, '0')}:00.000Z` });

  it('ändert nichts, wenn beide Stände gleich sind', () => {
    const stand = [at(1, 1), at(2, 2)];
    expect(mergeRoundLogs(stand, stand)).toEqual(stand);
  });

  it('holt alles zurück, wenn das Gerät leer ist (geleertes Profil)', () => {
    const sicherung = [at(1, 1), at(2, 2), at(3, 3)];
    expect(mergeRoundLogs([], sicherung)).toEqual(sicherung);
  });

  it('hängt Runden an, die nur das Gerät kennt, und zählt sie weiter', () => {
    // Das Gerät war leer und hat vor dem Abgleich schon zwei Runden gespielt (Nummern 1 und 2).
    const merged = mergeRoundLogs([at(8, 1), at(9, 2)], [at(1, 1), at(2, 2), at(3, 3)]);
    expect(merged.map((entry) => entry.round)).toEqual([1, 2, 3, 4, 5]);
    expect(merged.map((entry) => entry.playedAt.slice(14, 16))).toEqual(['01', '02', '03', '08', '09']);
  });

  it('erkennt dieselbe Runde auch unter einer anderen laufenden Nummer', () => {
    expect(mergeRoundLogs([at(1, 7)], [at(1, 1)])).toEqual([at(1, 1)]);
  });

  it('zählt gleiche Einträge je Vorkommen (Kurzformat-Import ohne Zeitpunkt)', () => {
    const ohneZeit = { ...record, playedAt: '' };
    const merged = mergeRoundLogs([ohneZeit, ohneZeit, ohneZeit], [ohneZeit]);
    expect(merged).toHaveLength(3);
    expect(merged.map((entry) => entry.round)).toEqual([1, 2, 3]);
  });

  it('lässt die Eingaben unverändert', () => {
    const geraet = [at(8, 1)];
    const sicherung = [at(1, 1)];
    mergeRoundLogs(geraet, sicherung);
    expect(geraet).toEqual([at(8, 1)]);
    expect(sicherung).toEqual([at(1, 1)]);
  });
});
