import { getCreature } from '../../core/domain/creature';
import { MAX_TEETH, MIN_TEETH } from '../../core/domain/teeth';
import type { GameSettings } from '../../infrastructure/storage/localStorageSettings';
import { settingsAfterCreatureChoice } from './creatureChoice';

/**
 * Die Leiste der Spielseite: Tier, Zahnzahl und (über die Steuerung) „Neue Runde".
 *
 * Bis zum 12.10.2026 lagen diese Griffe hinter dem Zahnrad — gemessen: 4 Tipps für ein anderes
 * Tier, 3 für eine andere Zahnzahl, und das Blatt scrollte auf jedem Handy. Die Verdrahtung stand
 * als Seitenskript in `pages/index.astro`; dort lädt jsdom sie nicht, also prüfte sie kein Test.
 */

/** Zahnzahl, die gerade gilt: eigener Wert oder das Gebiss des Tiers. */
export function effectiveTeeth(settings: GameSettings): number {
  return settings.teethOverride ?? getCreature(settings.creature).teeth;
}

/**
 * Was ein Tipp auf „−" oder „+" an den Einstellungen ändert. An den Grenzen ändert er nichts
 * (`null`) — sonst startete ein Tipp auf den abgeblendeten Rand die laufende Runde neu.
 */
export function settingsAfterTeethStep(current: GameSettings, delta: number): GameSettings | null {
  const now = effectiveTeeth(current);
  const next = Math.max(MIN_TEETH, Math.min(MAX_TEETH, now + delta));
  if (next === now) {
    return null;
  }
  const standard = getCreature(current.creature).teeth;
  return { ...current, teethOverride: next === standard ? null : next };
}

export interface QuickControlDeps {
  doc: Document;
  /** Dieselbe Referenz, die die Steuerung fortschreibt — `paint()` liest immer den Stand von jetzt. */
  settings: GameSettings;
  apply: (next: GameSettings) => void;
  portrait: (creatureId: string, suffix: string) => string;
  /** Nach jedem Tipp auf eine Kachel — die Seite schließt damit das Auswahlblatt. */
  onCreatureChosen: () => void;
  /** Ist dieses Tier gesperrt? Fehlt die Frage, ist jedes Tier offen. */
  isLocked?: (creatureId: string) => boolean;
  /** Ein Tipp auf ein gesperrtes Tier: gewählt wird nichts, die Auswahl bleibt offen. */
  onLockedTap?: (creatureId: string) => void;
}

export function wireQuickControls(deps: QuickControlDeps): { paint: () => void } {
  const { doc, settings } = deps;
  const byId = (id: string): HTMLElement | null => doc.getElementById(id);
  // `button[…]`, nicht `[data-creature]` allein: auch die Zeichnung auf der Bühne trägt das Attribut.
  const tiles = (): HTMLButtonElement[] =>
    Array.from(doc.querySelectorAll<HTMLButtonElement>('button[data-creature]'));

  const paint = (): void => {
    const creature = getCreature(settings.creature);
    const teeth = effectiveTeeth(settings);
    const value = byId('teeth-value');
    if (value) value.textContent = String(teeth);
    const label = byId('teeth-label');
    if (label) label.textContent = teeth === 1 ? 'Zahn' : 'Zähne';
    const minus = byId('teeth-minus') as HTMLButtonElement | null;
    const plus = byId('teeth-plus') as HTMLButtonElement | null;
    if (minus) minus.disabled = teeth <= MIN_TEETH;
    if (plus) plus.disabled = teeth >= MAX_TEETH;

    const name = byId('creature-name');
    if (name) name.textContent = creature.name;
    const icon = byId('creature-icon');
    if (icon) icon.innerHTML = deps.portrait(creature.id, 'wahl');
    byId('creature-open')?.setAttribute('aria-label', `Tier wählen, gerade: ${creature.name}`);
    for (const tile of tiles()) {
      tile.setAttribute('aria-pressed', String(tile.dataset.creature === settings.creature));
    }

    const line = byId('creature-detail-line');
    if (line) {
      const live =
        creature.liveTeethMin === creature.liveTeethMax
          ? `${creature.liveTeethMin}`
          : `${creature.liveTeethMin}–${creature.liveTeethMax}`;
      line.textContent = `${creature.name}: ${creature.teeth} Zähne — bei jedem Tipp sind ${live} davon gefährlich.`;
    }
    const note = byId('creature-detail-note');
    if (note) note.textContent = creature.note;
    const real = byId('creature-detail-real');
    if (real) real.textContent = `Echtes Gebiss: ${creature.realTeeth} Zähne.`;
  };

  const step = (delta: number): void => {
    const next = settingsAfterTeethStep(settings, delta);
    if (next) {
      deps.apply(next);
    }
    paint();
  };
  byId('teeth-minus')?.addEventListener('click', () => step(-1));
  byId('teeth-plus')?.addEventListener('click', () => step(1));

  for (const tile of tiles()) {
    tile.addEventListener('click', () => {
      const id = tile.dataset.creature;
      if (id && deps.isLocked?.(id)) {
        deps.onLockedTap?.(id);
        return;
      }
      const next = settingsAfterCreatureChoice(settings, tile.dataset.creature);
      if (next) {
        deps.apply(next);
      }
      paint();
      deps.onCreatureChosen();
    });
  }

  paint();
  return { paint };
}
