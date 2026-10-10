import type { RandomMode, ToothId } from './teeth';

/** Ein Eintrag pro gespielter Runde — Grundlage der Statistikseite. */
export interface RoundRecord {
  /** Laufende Nummer ab 1 (für den CSV-Austausch mit dem Analyse-Werkzeug). */
  round: number;
  /** Zeitpunkt der Runde (ISO 8601). */
  playedAt: string;
  /** Gebiss, mit dem gespielt wurde (Kennung aus dem Katalog). */
  creature: string;
  teeth: number;
  mode: RandomMode;
  players: number;
  /** Zahn, bei dem es schnappte. */
  loserTooth: ToothId;
  /** Bei welchem Druck der Runde es schnappte (1-basiert). */
  pressIndex: number;
  /** Wie viele Zähne gleichzeitig scharf waren. */
  liveCount: number;
  /** Alle Drücke der Runde in ihrer Reihenfolge. */
  pressOrder: readonly ToothId[];
}

/** Spaltenköpfe des Austauschformats; die ersten drei sind mit dem Analyse-Werkzeug identisch. */
export const CSV_HEADER =
  'runde;reihenfolge;verlierer_zahn;modus;zaehne;spieler;druck_nummer;scharfe_zaehne;lebewesen;zeitpunkt';
