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
  if (players === 1) {
    return 'Zugeschnappt!';
  }
  // Bei zwei Spielern steht der **Gewinner** im Titel — er ist der, der nicht gedrückt hat. Der
  // Verlierer geht nicht verloren: er steht im Ergebnistext. Bei drei und vier Spielern (nur im
  // Protokoll, etwa aus einem Import) gibt es drei Gewinner, dort bleibt es beim Verlierer-Satz.
  if (players === 2) {
    return `${playerName(loserPlayer === 1 ? 2 : 1, 2)} hat gewonnen!`;
  }
  return `${playerName(loserPlayer, players)} hat verloren!`;
}

/**
 * Zählt Zahn-Nummern in Worten auf: „7", „3 und 7", „2, 5 und 7".
 *
 * Dieselbe Regel wie `joinNames` (`presentation/game/unlockNotice.ts`) — die gilt dort für Namen.
 * Beide Stellen sind bewusst getrennt: hier bleibt die Aufzählung typisiert (Zahlen, keine
 * beliebigen Zeichenketten), und das Ergebnis-Modul hängt nicht am Freischaltungs-Modul.
 */
export function joinNumbers(numbers: readonly number[]): string {
  const parts = numbers.map(String);
  if (parts.length <= 1) {
    return parts[0] ?? '';
  }
  return `${parts.slice(0, -1).join(', ')} und ${parts[parts.length - 1]}`;
}

/**
 * Der Ergebnissatz. Er **wiederholt den Titel nicht**: der Titel nennt den Ausgang („Zugeschnappt!"
 * bzw. den Gewinner), der Text die Auskunft — welcher Zahn der falsche war, wie viele Zähne scharf
 * waren und wer ihn gedrückt hat.
 *
 * Die Nummer des Drucks („der 3. Druck dieser Runde") ist bewusst nicht mehr zu sehen: sie ist die
 * Zahl der gedrückten Zähne und steht vollständig im Protokoll (`pressIndex`, siehe
 * `docs/domain-model.md`, „Position") — die Statistikseite zeigt sie weiter. Dafür steht der Satz
 * kürzer da, und die Spielseite scrollt auf 320 × 568 nicht (`scripts/pruefen-bedienung.py`).
 */
export function resultText(
  round: Pick<RoundState, 'teeth' | 'mode' | 'liveTeethMin' | 'liveTeethMax' | 'players' | 'live' | 'loser'>,
): string {
  const loser = round.loser;
  if (!loser) {
    return '';
  }
  const live = [...round.live].sort((a, b) => a - b);
  const toothSentence = `Zahn ${loser.tooth} war der falsche`;
  // Nur bei zwei Spielern: dort nennt der Titel den Gewinner. Bei drei und vier Spielern steht der
  // Verlierer schon im Titel — der Text wiederholt ihn nicht.
  const presser = round.players === 2 ? `${playerName(loser.player, 2)} hat ihn gedrückt` : '';
  // Ein einziger scharfer Zahn: „Scharf war 1 Zahn: 7" sagte nur die Zahl noch einmal, die schon
  // am Satzanfang steht.
  const sentence =
    loser.liveCount === 1
      ? `${toothSentence} — der einzige scharfe.${presser ? ` ${presser}.` : ''}`
      : `${toothSentence}${presser ? ` — ${presser}` : ''}. Scharf waren ${loser.liveCount} Zähne: ${joinNumbers(live)}.`;
  return `${sentence}${mutSentence(round, loser.pressIndex)}`;
}

export function resultFact(creatureId: string): string {
  return `Wusstest du? ${getCreature(creatureId).fact}`;
}
