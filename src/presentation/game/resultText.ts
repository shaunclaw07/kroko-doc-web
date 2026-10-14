import { getCreature } from '../../core/domain/creature';
import type { RoundState } from '../../core/domain/round';
import { survivedDanger } from '../../core/domain/tension';

export function playerName(player: number, players: number): string {
  return players === 1 ? 'Du' : `Spieler ${player}`;
}

/**
 * Zugzeile. Bei einem Spieler heißt es „Du bist dran“ — die erste Fassung klebte „ ist dran“ an
 * `playerName()` und schrieb damit „Du ist dran“. Bei mehreren Spielern genügt der Name: die
 * Spielerzahl steht in den Einstellungen, sie muss nicht in jedem Zug wiederholt werden.
 */
export function turnSentence(round: Pick<RoundState, 'status' | 'players' | 'pressOrder'>): string {
  if (round.status === 'snapped') {
    return 'Maul zu';
  }
  const pressIndex = round.pressOrder.length;
  const currentPlayer = (pressIndex % round.players) + 1;
  return round.players === 1 ? 'Du bist dran' : `${playerName(currentPlayer, round.players)} ist dran`;
}

/**
 * Der Mut der Runde: die höchste überstandene Bissgefahr. Er gibt dem Gefahren-Balken einen
 * Zweck — die Gefahr, die man übersteht, ist das, was am Tisch erzählt wird. Kommt aus derselben
 * Kurve wie der Balken (`survivedDanger`), ist also dieselbe Wahrheit wie die Anzeige.
 */
export function mutSentence(
  round: Pick<RoundState, 'teeth' | 'mode' | 'liveTeethMin' | 'liveTeethMax' | 'players'>,
  pressIndex: number,
): string {
  const percent = Math.round(
    survivedDanger({
      pressIndex,
      teeth: round.teeth,
      mode: round.mode,
      liveTeethMin: round.liveTeethMin,
      liveTeethMax: round.liveTeethMax,
    }) * 100,
  );
  if (percent <= 0) {
    return '';
  }
  if (round.players === 1) {
    return ` Dein mutigster Druck: ${percent} % Bissgefahr — und der Zahn war harmlos.`;
  }
  // Der letzte harmlose Druck kam reihum von diesem Spieler.
  const player = ((pressIndex - 2) % round.players) + 1;
  return (
    ` Mutigster Druck: ${playerName(player, round.players)} bei ${percent} % Bissgefahr` +
    ' — und der Zahn war harmlos.'
  );
}

export function resultTitle(players: number, loserPlayer: number): string {
  return players === 1 ? 'Zugeschnappt!' : `${playerName(loserPlayer, players)} hat verloren!`;
}

export function resultText(
  round: Pick<RoundState, 'teeth' | 'mode' | 'liveTeethMin' | 'liveTeethMax' | 'players' | 'live' | 'loser'>,
): string {
  const loser = round.loser;
  if (!loser) {
    return '';
  }
  const live = [...round.live].sort((a, b) => a - b).join(', ');
  const liveWord = loser.liveCount === 1 ? 'Zahn war scharf' : 'Zähne waren scharf';
  return (
    `Zahn ${loser.tooth} hat zugeschnappt — der ${loser.pressIndex}. Druck dieser Runde. ` +
    `Insgesamt ${loser.liveCount} ${liveWord} (${live}).` +
    mutSentence(round, loser.pressIndex)
  );
}

export function resultFact(creatureId: string): string {
  return `Wusstest du? ${getCreature(creatureId).fact}`;
}
