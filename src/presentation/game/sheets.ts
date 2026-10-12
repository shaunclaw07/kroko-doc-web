/**
 * Blätter (modale Dialoge): öffnen, schließen und per Tipp daneben verlassen.
 *
 * Die Regeln standen vorher als Seitenskript in `pages/index.astro` — dort lädt jsdom sie nicht,
 * also prüfte sie kein Test. Drei Fehler kamen genau daher (gemessen am 12.10.2026):
 *  - ein Klick per **Tastatur** trägt die Koordinaten (0, 0) und galt als „daneben";
 *  - ein Tipp auf eine Kachel des oberen Blatts lag geometrisch neben dem **unteren** Blatt und
 *    schloss es mit (Tablet: das Auswahlblatt ist höher als das Einstellungsblatt);
 *  - ein Tipp auf die Bühne direkt nach dem Biss schloss das Ergebnis, bevor es jemand las.
 */

/** Blätter mit diesem Attribut schließt nur ein Knopf im Blatt (und die Escape-Taste). */
export const KEEP_ON_OUTSIDE_TAP = 'data-keep-on-outside-tap';

export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ClickPoint {
  clientX: number;
  clientY: number;
  /** Zahl der Zeigerklicks; bei Tastatur und `element.click()` ist sie 0. */
  detail: number;
}

/**
 * Liegt ein **Zeiger**klick neben dem Kasten? Geprüft wird die Geometrie, nicht das Zielelement —
 * bei einem Dialog ist `event.target` auch der Innenabstand. Ein Klick ohne Zeiger (`detail === 0`)
 * hat keinen Ort und liegt deshalb nie daneben.
 */
export function isPointerClickBeside(box: Box, click: ClickPoint): boolean {
  if (click.detail === 0) {
    return false;
  }
  return (
    click.clientX < box.left ||
    click.clientX > box.right ||
    click.clientY < box.top ||
    click.clientY > box.bottom
  );
}

/**
 * Das oberste offene Blatt. Die Reihenfolge im Dokument ist die Stapelreihenfolge: Auswahl und
 * Regeln öffnen sich nur **aus** dem Einstellungsblatt und stehen im Markup dahinter; das Ergebnis
 * öffnet sich nur, wenn kein anderes Blatt offen ist. Wer ein Blatt ergänzt, das sich aus einem
 * späteren öffnet, muss diese Annahme ersetzen.
 */
export function topmostOpenSheet(doc: Document): HTMLDialogElement | null {
  const open = doc.querySelectorAll<HTMLDialogElement>('dialog.sheet[open]');
  return open[open.length - 1] ?? null;
}

/** Öffnet ein Blatt modal; Umgebungen ohne `showModal` (jsdom, alte Browser) bekommen das Attribut. */
export function openSheet(sheet: HTMLDialogElement | null): void {
  if (!sheet || sheet.hasAttribute('open')) {
    return;
  }
  if (typeof sheet.showModal === 'function') {
    sheet.showModal();
  } else {
    sheet.setAttribute('open', '');
  }
}

/** Schließt ein Blatt; mit demselben Rückfall wie `openSheet`. */
export function closeSheet(sheet: HTMLDialogElement | null): void {
  if (!sheet) {
    return;
  }
  if (typeof sheet.close === 'function') {
    sheet.close();
  } else {
    sheet.removeAttribute('open');
  }
}

/**
 * Ein Tipp neben das **oberste** Blatt schließt es. Der Lauscher sitzt am Dokument und in der
 * **Einfangphase**: er entscheidet über den Zustand, den der Nutzer beim Tippen gesehen hat —
 * bevor ein Knopf im Blatt es schließt und das Blatt darunter plötzlich das oberste wäre.
 * Gibt die Funktion zurück, die den Lauscher wieder abhängt.
 */
export function wireOutsideTapDismissal(doc: Document): () => void {
  const onClick = (event: MouseEvent): void => {
    const sheet = topmostOpenSheet(doc);
    if (!sheet || sheet.hasAttribute(KEEP_ON_OUTSIDE_TAP)) {
      return;
    }
    if (isPointerClickBeside(sheet.getBoundingClientRect(), event)) {
      closeSheet(sheet);
    }
  };
  doc.addEventListener('click', onClick, true);
  return () => doc.removeEventListener('click', onClick, true);
}
