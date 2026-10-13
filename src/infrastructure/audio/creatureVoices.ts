/**
 * Die Stimmen der Tiere sind kurze Tondateien unter `public/sounds/voices/` — die einzigen Klänge
 * des Spiels, die nicht synthetisiert sind (Entscheidung vom 12.10.2026). Herkunft und Lizenz jeder
 * Datei stehen daneben in `QUELLEN.md`; ein Test liefert keine Datei ohne diese Zeile aus.
 */
export const CREATURE_VOICE_FILES: Readonly<Record<string, string>> = {
  crocodile: 'crocodile.mp3',
  wolf: 'wolf.mp3',
  human: 'human.mp3',
  shark: 'shark.mp3',
  mouse: 'mouse.mp3',
  vampire: 'vampire.mp3',
  panda: 'panda.mp3',
  lion: 'lion.mp3',
  panther: 'panther.mp3',
  sabertooth: 'sabertooth.mp3',
  flytrap: 'flytrap.mp3',
  trex: 'trex.mp3',
};

/** Obergrenze je Datei: 64 kbit/s sind 8000 Byte je Sekunde — das hält sie zugleich kurz. */
export const MAX_VOICE_BYTES = 16000;

/** Adresse einer Stimme unter dem Basis-Pfad der Seite (mit Schluss-Schrägstrich). */
export function voiceUrl(baseUrl: string, creatureId: string): string | null {
  const file = CREATURE_VOICE_FILES[creatureId];
  return file === undefined ? null : `${baseUrl}sounds/voices/${file}`;
}
