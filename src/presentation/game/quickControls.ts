import { earnsAllStars } from '../../core/domain/album';
import { getCreature } from '../../core/domain/creature';
import { MAX_TEETH, MIN_TEETH } from '../../core/domain/teeth';
import type { GameSettings } from '../../core/domain/settings';
import { settingsAfterCreatureChoice } from './creatureChoice';

import type { SettingsStore } from './settingsStore';

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

/**
 * Der Satz, der vor dem ersten Druck an der Stelle der Anleitung steht, wenn die eingestellte
 * Zahnzahl nur den ersten Stern bringt. Ohne ihn spielte man Runde um Runde mit wenigen Zähnen
 * und wunderte sich, dass kein Stern dazukommt (gemeldet vom Auftraggeber, 13.10.2026). Er nennt
 * die Zahl, ab der es wieder alle drei gibt — und keinen Artikel, den jedes Tier anders bräuchte.
 */
export function fewTeethWarning(standardTeeth: number): string {
  return `Nur der erste Stern: für alle drei braucht es mindestens ${standardTeeth} Zähne.`;
}

export interface QuickControlDeps {
  doc: Document;
  settings: SettingsStore;
  apply?: (next: GameSettings) => void;
  portrait: (creatureId: string, suffix: string) => string;
  /** Nach jedem Tipp auf eine Kachel — die Seite schließt damit das Auswahlblatt. */
  onCreatureChosen: () => void;
  /** Ist dieses Tier gesperrt? Fehlt die Frage, ist jedes Tier offen. */
  isLocked?: (creatureId: string) => boolean;
  /** Ein Tipp auf ein gesperrtes Tier: gewählt wird nichts, die Auswahl bleibt offen. */
  onLockedTap?: (creatureId: string) => void;
}

export function wireQuickControls(deps: QuickControlDeps): { paint: () => void; dispose: () => void } {
  const { doc, settings } = deps;
  const apply = deps.apply ?? ((next: GameSettings) => settings.set(next));
  const byId = (id: string): HTMLElement | null => doc.getElementById(id);
  // `button[…]`, nicht `[data-creature]` allein: auch die Zeichnung auf der Bühne trägt das Attribut.
  const tiles = (): HTMLButtonElement[] =>
    Array.from(doc.querySelectorAll<HTMLButtonElement>('button[data-creature]'));

  // Die Anleitung steht im Markup der Seite; die Warnung tritt an ihre Stelle und gibt sie zurück.
  const howToText = byId('how-to')?.textContent ?? '';

  const paint = (): void => {
    const current = settings.get();
    const creature = getCreature(current.creature);
    const teeth = effectiveTeeth(current);
    const howTo = byId('how-to');
    if (howTo) {
      const few = !earnsAllStars(creature.id, teeth);
      howTo.textContent = few ? fewTeethWarning(creature.teeth) : howToText;
      howTo.classList.toggle('how-to--warning', few);
    }
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
      tile.setAttribute('aria-pressed', String(tile.dataset.creature === current.creature));
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
    if (real) {
      // 0 ist keine Zahl zum Vorlesen: das Vorbild hat dann gar keine Zähne (Venusfliegenfalle).
      real.textContent =
        creature.realTeeth === 0 ? 'Echtes Gebiss: keine Zähne.' : `Echtes Gebiss: ${creature.realTeeth} Zähne.`;
    }
  };

  const unsubscribe = settings.subscribe(() => paint());

  const step = (delta: number): void => {
    const next = settingsAfterTeethStep(settings.get(), delta);
    if (next) {
      apply(next);
    }
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
      const next = settingsAfterCreatureChoice(settings.get(), tile.dataset.creature);
      if (next) {
        apply(next);
      }
      deps.onCreatureChosen();
    });
  }

  paint();
  return { paint, dispose: unsubscribe };
}
