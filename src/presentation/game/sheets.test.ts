// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  closeSheet,
  isPointerClickBeside,
  openSheet,
  topmostOpenSheet,
  wireOutsideTapDismissal,
  type Box,
} from './sheets';

/**
 * Wächter der Blätter. Die Maße sind die am 12.10.2026 im Chromium gemessenen eines Tablets
 * (768 × 1024): das Auswahlblatt ist höher als das Einstellungsblatt — seine oberen Kacheln liegen
 * geometrisch **neben** dem Einstellungsblatt. jsdom rechnet keine Geometrie, deshalb setzt der Test
 * die Kästen selbst.
 */
const SETTINGS_BOX: Box = { left: 24, top: 413, right: 744, bottom: 1000 };
const CREATURE_BOX: Box = { left: 74, top: 160, right: 694, bottom: 1000 };
const RESULT_BOX: Box = { left: 0, top: 560, right: 390, bottom: 844 };

const DOM = `
  <main><button id="stage-tooth" type="button">Zahn</button></main>
  <dialog class="sheet" id="settings-sheet"><button id="teeth-minus" type="button">−</button></dialog>
  <dialog class="sheet" id="creature-sheet"><button id="tile" type="button">Krokodil</button></dialog>
  <dialog class="sheet" id="result-sheet" data-keep-on-outside-tap>
    <button id="result-again" type="button">Noch eine Runde</button>
  </dialog>
`;

function sheet(id: string): HTMLDialogElement {
  return document.getElementById(id) as HTMLDialogElement;
}

function place(id: string, box: Box): void {
  sheet(id).getBoundingClientRect = () =>
    ({
      ...box,
      x: box.left,
      y: box.top,
      width: box.right - box.left,
      height: box.bottom - box.top,
      toJSON: () => ({}),
    }) as DOMRect;
}

/** Ein Zeigerklick (`detail` 1) an einer Stelle; `detail` 0 ist der Klick der Tastatur. */
function tap(targetId: string, clientX: number, clientY: number, detail = 1): void {
  document
    .getElementById(targetId)
    ?.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX, clientY, detail }));
}

describe('isPointerClickBeside', () => {
  it('erkennt drinnen und draußen an der Geometrie', () => {
    expect(isPointerClickBeside(SETTINGS_BOX, { clientX: 300, clientY: 600, detail: 1 })).toBe(false);
    expect(isPointerClickBeside(SETTINGS_BOX, { clientX: 300, clientY: 250, detail: 1 })).toBe(true);
    expect(isPointerClickBeside(SETTINGS_BOX, { clientX: 10, clientY: 600, detail: 1 })).toBe(true);
  });

  it('hält einen Tastaturklick nie für daneben — er trägt die Koordinaten (0, 0)', () => {
    expect(isPointerClickBeside(SETTINGS_BOX, { clientX: 0, clientY: 0, detail: 0 })).toBe(false);
  });
});

describe('Blätter öffnen, schließen, daneben tippen', () => {
  let unwire: () => void = () => undefined;

  beforeEach(() => {
    document.body.innerHTML = DOM;
    place('settings-sheet', SETTINGS_BOX);
    place('creature-sheet', CREATURE_BOX);
    place('result-sheet', RESULT_BOX);
    unwire = wireOutsideTapDismissal(document);
  });

  afterEach(() => {
    unwire();
  });

  it('öffnet und schließt auch ohne showModal/close (jsdom, alte Browser)', () => {
    openSheet(sheet('settings-sheet'));
    expect(sheet('settings-sheet').hasAttribute('open')).toBe(true);
    openSheet(sheet('settings-sheet'));
    expect(sheet('settings-sheet').hasAttribute('open')).toBe(true);
    closeSheet(sheet('settings-sheet'));
    expect(sheet('settings-sheet').hasAttribute('open')).toBe(false);
    expect(() => closeSheet(null)).not.toThrow();
    expect(() => openSheet(null)).not.toThrow();
  });

  it('nennt das oberste offene Blatt', () => {
    expect(topmostOpenSheet(document)).toBeNull();
    openSheet(sheet('settings-sheet'));
    expect(topmostOpenSheet(document)?.id).toBe('settings-sheet');
    openSheet(sheet('creature-sheet'));
    expect(topmostOpenSheet(document)?.id).toBe('creature-sheet');
  });

  it('lässt das Einstellungsblatt offen, wenn „−" mit der Tastatur gedrückt wird', () => {
    // Gemessen: Enter auf „−" löst einen Klick mit (0, 0) aus; das Blatt beginnt erst bei y 413.
    openSheet(sheet('settings-sheet'));
    tap('teeth-minus', 0, 0, 0);
    expect(sheet('settings-sheet').hasAttribute('open')).toBe(true);
  });

  it('schließt bei einem Tipp daneben nur das oberste Blatt', () => {
    openSheet(sheet('settings-sheet'));
    openSheet(sheet('creature-sheet'));
    tap('stage-tooth', 10, 50);
    expect(sheet('creature-sheet').hasAttribute('open')).toBe(false);
    expect(sheet('settings-sheet').hasAttribute('open')).toBe(true);
    tap('stage-tooth', 10, 50);
    expect(sheet('settings-sheet').hasAttribute('open')).toBe(false);
  });

  it('lässt das Einstellungsblatt offen, wenn eine Kachel oberhalb davon gewählt wird', () => {
    // Die Kachel schließt ihr eigenes Blatt (ein Tipp wählt und schließt). Ihr Ort (y 250) liegt
    // über der Oberkante des Einstellungsblatts (y 413) — das darf es nicht mitschließen.
    openSheet(sheet('settings-sheet'));
    openSheet(sheet('creature-sheet'));
    document.getElementById('tile')?.addEventListener('click', () => closeSheet(sheet('creature-sheet')));
    tap('tile', 300, 250);
    expect(sheet('creature-sheet').hasAttribute('open')).toBe(false);
    expect(sheet('settings-sheet').hasAttribute('open')).toBe(true);
  });

  it('lässt das Ergebnis stehen, wenn nach dem Biss weiter auf die Bühne getippt wird', () => {
    openSheet(sheet('result-sheet'));
    tap('stage-tooth', 195, 250);
    expect(sheet('result-sheet').hasAttribute('open')).toBe(true);
  });

  it('hängt den Lauscher wieder ab', () => {
    openSheet(sheet('settings-sheet'));
    unwire();
    tap('stage-tooth', 10, 50);
    expect(sheet('settings-sheet').hasAttribute('open')).toBe(true);
  });
});
