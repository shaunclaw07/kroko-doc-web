import { describe, expect, it } from 'vitest';
import { mutSentence, playerName, resultFact, resultText, resultTitle, turnSentence } from './resultText';
import type { RoundState } from '../../core/domain/round';

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

  it('erzeugt Ergebnistitel und -text', () => {
    expect(resultTitle(1, 1)).toBe('Zugeschnappt!');
    expect(resultTitle(2, 2)).toBe('Spieler 2 hat verloren!');

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
    expect(text).toContain('Zahn 5 hat zugeschnappt — der 3. Druck dieser Runde.');
    expect(text).toContain('Insgesamt 1 Zahn war scharf (5).');
    expect(text).toContain('Dein mutigster Druck:');

    // Mehrere scharfe Zähne
    const roundMultiLive: Parameters<typeof resultText>[0] = {
      ...round,
      live: [3, 7],
      loser: {
        player: 1,
        tooth: 7,
        pressIndex: 2,
        liveCount: 2,
      },
    };
    expect(resultText(roundMultiLive)).toContain('Insgesamt 2 Zähne waren scharf (3, 7).');
  });

  it('liefert Tierfakt für creatureId', () => {
    expect(resultFact('crocodile')).toContain('Wusstest du?');
  });
});
