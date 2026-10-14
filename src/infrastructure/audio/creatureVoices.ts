import { listCreatures } from '../../core/domain/creature';

/**
 * Die Stimmen der Tiere sind kurze Tondateien unter `public/sounds/voices/` — die einzigen Klänge
 * des Spiels, die nicht synthetisiert sind (Entscheidung vom 12.10.2026). Herkunft und Lizenz jeder
 * Datei stehen daneben in `QUELLEN.md`; ein Test liefert keine Datei ohne diese Zeile aus.
 */
export const CREATURE_VOICE_FILES: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(listCreatures().map((creature) => [creature.id, `${creature.id}.mp3`])),
);

/** Obergrenze je Datei: 64 kbit/s sind 8000 Byte je Sekunde — das hält sie zugleich kurz. */
export const MAX_VOICE_BYTES = 16000;

/** Adresse einer Stimme unter dem Basis-Pfad der Seite (mit Schluss-Schrägstrich). */
export function voiceUrl(baseUrl: string, creatureId: string): string | null {
  const file = CREATURE_VOICE_FILES[creatureId];
  return file === undefined ? null : `${baseUrl}sounds/voices/${file}`;
}
