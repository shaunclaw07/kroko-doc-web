import { describe, expect, it } from 'vitest';
import {
  joinNumbers,
  mutSentence,
  playerName,
  resultFact,
  resultText,
  resultTitle,
  turnSentence,
} from './resultText';

describe('resultText', () => {
  it('formatiert Spielername für Einzel- und Mehrspieler', () => {
    expect(playerName(1, 1)).toBe('Du');
    expect(playerName(1, 2)).toBe('Spieler 1');
    expect(playerName(2, 2)).toBe('Spieler 2');
  });

  it('formatiert turnSentence für offen und zuschnappt', () => {
    expect(turnSentence({ status: 'open', players: 1, pressOrder: [] })).toBe('Du bist dran');
    expect(turnSentence({ status: 'open', players: 2, pressOrder: [1] })).toBe('Spieler 2 ist dran');
    expect(turnSentence({ status: 'snapped', players: 2, pressOrder: [1] })).toBe('Maul zu');
  });

  it('erzeugt Mut-Satz für Einzelspieler und Mehrspieler', () => {
    const roundConfig = {
      teeth: 10,
      mode: 'original' as const,
      liveTeethMin: 1,
      liveTeethMax: 3,
      players: 1,
    };

    // Erster Druck (pressIndex 1) hat keinen überstandenen Druck -> leer
    expect(mutSentence(roundConfig, 1)).toBe('');

    // Druck 3 hat 2 überstandene Drücke
    const mut1 = mutSentence(roundConfig, 3);
    expect(mut1).toContain('Dein mutigster Druck:');
    expect(mut1).toContain('und der Zahn war harmlos.');

    // 2 Spieler
    const round2P = { ...roundConfig, players: 2 };
    const mut2 = mutSentence(round2P, 3);
    // Bei pressIndex 3 war der letzte harmlose Druck (3 - 2) % 2 + 1 = Spieler 2
    expect(mut2).toContain('Mutigster Druck: Spieler 2 bei');
  });

  it('zählt Zahlen in Worten auf — eine, zwei und drei', () => {
    expect(joinNumbers([7])).toBe('7');
    expect(joinNumbers([3, 7])).toBe('3 und 7');
    expect(joinNumbers([2, 5, 7])).toBe('2, 5 und 7');
  });

  it('nennt den Gewinner im Titel — nur bei zwei Spielern', () => {
    expect(resultTitle(1, 1)).toBe('Zugeschnappt!');
    expect(resultTitle(2, 1)).toBe('Spieler 2 hat gewonnen!');
    expect(resultTitle(2, 2)).toBe('Spieler 1 hat gewonnen!');
  });

  it('bleibt bei drei und vier Spielern beim Verlierer-Satz (Gegenprobe zu E4)', () => {
    // Drei und vier Spieler bietet die Bedienung nicht mehr an (MAX_SELECTABLE_PLAYERS = 2),
    // im Protokoll gibt es sie aber weiter (Import, Altdaten): MAX_PLAYERS = 4. Dort gibt es
    // drei Gewinner — „X hat verloren!“ bleibt die richtige Aussage.
    const round: Parameters<typeof resultText>[0] = {
      teeth: 12,
      mode: 'original',
      liveTeethMin: 1,
      liveTeethMax: 2,
      players: 4,
      live: [3, 9],
      loser: {
        player: 3,
        tooth: 9,
        pressIndex: 7,
        liveCount: 2,
      },
    };

    expect(resultTitle(4, 3)).toBe('Spieler 3 hat verloren!');
    // Der Titel nennt den Verlierer schon — der Text wiederholt ihn nicht (E1).
    expect(resultText(round)).not.toContain('Spieler 3');
    expect(resultText(round)).toContain('Zahn 9 war der falsche. Scharf waren 2 Zähne: 3 und 9.');
  });

  it('sagt, welcher Zahn der falsche war — und wiederholt den Titel nicht', () => {
    const round: Parameters<typeof resultText>[0] = {
      teeth: 10,
      mode: 'original',
      liveTeethMin: 1,
      liveTeethMax: 1,
      players: 1,
      live: [5],
      loser: {
        player: 1,
        tooth: 5,
        pressIndex: 3,
        liveCount: 1,
      },
    };

    const text = resultText(round);
    // Ein einziger scharfer Zahn: die Aufzählung sagte nur die Zahl noch einmal, die vorn steht.
    expect(text).toContain('Zahn 5 war der falsche — der einzige scharfe.');
    expect(text).toContain('Dein mutigster Druck:');
    // Der Titel sagt den Ausgang („Zugeschnappt!“), der Text sagt die Auskunft.
    expect(text).not.toContain('zugeschnappt');
    expect(text).not.toContain('Insgesamt');
    expect(text).not.toContain('Druck dieser Runde');
  });

  it('zählt mehrere scharfe Zähne in Worten auf', () => {
    const round: Parameters<typeof resultText>[0] = {
      teeth: 10,
      mode: 'original',
      liveTeethMin: 1,
      liveTeethMax: 3,
      players: 1,
      live: [3, 7],
      loser: {
        player: 1,
        tooth: 7,
        pressIndex: 2,
        liveCount: 2,
      },
    };

    expect(resultText(round)).toContain('Zahn 7 war der falsche. Scharf waren 2 Zähne: 3 und 7.');
  });

  it('nennt bei zwei Spielern den, der gedrückt hat — im Text', () => {
    const round: Parameters<typeof resultText>[0] = {
      teeth: 10,
      mode: 'original',
      liveTeethMin: 1,
      liveTeethMax: 3,
      players: 2,
      live: [2, 5, 7],
      loser: {
        player: 1,
        tooth: 7,
        pressIndex: 3,
        liveCount: 3,
      },
    };

    expect(resultText(round)).toContain(
      'Zahn 7 war der falsche — Spieler 1 hat ihn gedrückt. Scharf waren 3 Zähne: 2, 5 und 7.',
    );
    expect(resultText(round)).toContain('Mutigster Druck: Spieler 2 bei');
  });

  it('nennt bei zwei Spielern auch beim einzigen scharfen Zahn den, der gedrückt hat', () => {
    const round: Parameters<typeof resultText>[0] = {
      teeth: 10,
      mode: 'original',
      liveTeethMin: 1,
      liveTeethMax: 3,
      players: 2,
      live: [7],
      loser: {
        player: 2,
        tooth: 7,
        pressIndex: 4,
        liveCount: 1,
      },
    };

    const text = resultText(round);
    expect(text).toContain('Zahn 7 war der falsche — der einzige scharfe.');
    expect(text).toContain('Spieler 2 hat ihn gedrückt.');
  });

  it('liefert Tierfakt für creatureId', () => {
    expect(resultFact('crocodile')).toContain('Wusstest du?');
  });
});
