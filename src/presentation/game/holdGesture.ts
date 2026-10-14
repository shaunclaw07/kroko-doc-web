/** So lange braucht der Zahn, um unter dem Finger zu sinken (ms) — nur Bild, kein Urteil. */
export const HOLD_SINK_MS = 320;

/**
 * Längstes Halten (ms). Danach federt der Zahn zurück, **ohne** Zug: ein verlorenes Loslassen
 * (Tabwechsel, Systemdialog) darf nichts entscheiden und die Bühne nicht sperren.
 */
export const HOLD_MAX_MS = 4000;

/** Ein Finger liegt auf einem Zahn — entschieden ist noch nichts. */
interface Hold {
  toothId: number;
  pointerId: number;
  startedAt: number;
}

export interface HoldGestureDeps {
  doc: Document;
  now?: () => number;
  wait: (ms: number, run: () => void) => void;
  canPress: (toothId: number) => boolean;
  feel: () => void;
  onPress: (toothId: number, heldMs: number, felt: boolean) => void;
  onCancel: () => void;
}

export interface HoldGesture {
  wireTeeth(teeth: Iterable<SVGGElement>): void;
  cancel(): void;
  dispose(): void;
  isHolding(toothId?: number): boolean;
}

/**
 * Verwaltet die Haltegeste auf den Zähnen: Zeigerberührung, Halten, Wegschieben,
 * Obergrenze und das Unterdrücken des Standard-Wischens bei Berührung.
 */
export function createHoldGesture(deps: HoldGestureDeps): HoldGesture {
  const { doc, wait, canPress, feel, onPress, onCancel } = deps;
  const now = deps.now ?? (() => doc.defaultView?.performance.now() ?? 0);

  /** Das laufende Halten; höchstens eines zugleich. */
  let hold: Hold | null = null;
  /** Nach `dispose()` beginnt kein Halten mehr. */
  let disposed = false;

  function toothElement(toothId: number): SVGGElement | null {
    return doc.querySelector<SVGGElement>(`.tooth[data-tooth="${toothId}"]`);
  }

  /**
   * Der Finger liegt auf: der Zahn sinkt, der Kiefer knarrt, das Tier hält den Atem an.
   * Entschieden ist noch nichts — der Zug läuft erst beim Loslassen.
   */
  function beginHold(toothId: number, pointerId: number): void {
    if (disposed || hold || !canPress(toothId)) {
      return;
    }
    const current: Hold = { toothId, pointerId, startedAt: now() };
    hold = current;
    toothElement(toothId)?.classList.add('is-held');
    feel();
    // Die Obergrenze gehört zu **diesem** Halten — ein späteres rührt sie nicht an.
    wait(HOLD_MAX_MS, () => {
      if (hold === current) {
        cancelHold();
      }
    });
  }

  /** Der Zahn federt zurück, ohne Zug: Finger weggeschoben, Geste abgebrochen oder zu lange gezögert. */
  function cancelHold(): void {
    const current = hold;
    if (!current) {
      return;
    }
    hold = null;
    toothElement(current.toothId)?.classList.remove('is-held');
    onCancel();
  }

  function releaseHold(): void {
    const current = hold;
    if (!current) {
      return;
    }
    hold = null;
    toothElement(current.toothId)?.classList.remove('is-held');
    onPress(current.toothId, Math.max(0, now() - current.startedAt), true);
  }

  /** Liegt der Zeiger beim Loslassen noch auf dem Zahn? Wer ihn wegschiebt, nimmt den Druck zurück. */
  function releasedOnTooth(pointer: PointerEvent, toothId: number): boolean {
    // jsdom kennt `elementFromPoint` nicht — dort gilt jedes Loslassen als auf dem Zahn.
    if (typeof doc.elementFromPoint !== 'function') {
      return true;
    }
    const under = doc.elementFromPoint(pointer.clientX, pointer.clientY);
    return under !== null && toothElement(toothId)?.contains(under) === true;
  }

  const onPointerUp = (event: Event): void => {
    const current = hold;
    const pointer = event as PointerEvent;
    if (!current || pointer.pointerId !== current.pointerId) {
      return;
    }
    if (releasedOnTooth(pointer, current.toothId)) {
      releaseHold();
    } else {
      cancelHold();
    }
  };

  const onPointerCancel = (event: Event): void => {
    if (hold && (event as PointerEvent).pointerId === hold.pointerId) {
      cancelHold();
    }
  };

  // Das Loslassen wird am Dokument gehört: mit der Maus endet es dort, wo der Zeiger gerade
  // steht — nicht unbedingt auf dem Zahn.
  doc.addEventListener('pointerup', onPointerUp);
  doc.addEventListener('pointercancel', onPointerCancel);

  return {
    wireTeeth(teeth: Iterable<SVGGElement>): void {
      for (const tooth of teeth) {
        const id = Number(tooth.dataset.tooth ?? '0');

        tooth.addEventListener('pointerdown', (event) => {
          const pointer = event as PointerEvent;
          // Nur der erste Finger bzw. die Haupttaste — ein zweiter Finger beginnt keinen Druck.
          if (!pointer.isPrimary || pointer.button !== 0) {
            return;
          }
          beginHold(id, pointer.pointerId);
        });

        // Ein Finger, der beim Halten wackelt, ist kein Wischen: ohne dies brach der Browser das
        // Halten nach rund 10 px Weg mit `pointercancel` ab — mitten auf der Trefferfläche und ohne
        // dass die Seite scrollte (gemessen am 12.10.2026: 14 px Weg auf 65 px Fläche, kein Zug).
        // `touch-action` hilft hier nicht, Chromium wertet es an Teilen einer SVG-Zeichnung nicht
        // aus. Nur für den gehaltenen Zahn: von einem schon gedrückten aus lässt sich weiter scrollen.
        tooth.addEventListener(
          'touchstart',
          (event) => {
            if (hold?.toothId === id && event.cancelable) {
              event.preventDefault();
            }
          },
          { passive: false },
        );

        // Ein Zeiger-Tipp endet zusätzlich mit `click` (detail ≥ 1) — den Zug hat `pointerup` schon
        // ausgelöst. Ein `click` ohne Zeiger (detail 0) kommt von Tastatur und Hilfstechnik.
        tooth.addEventListener('click', (event) => {
          if ((event as MouseEvent).detail === 0) {
            if (hold || !canPress(id)) {
              return;
            }
            onPress(id, 0, false);
          }
        });

        // Langes Halten darf kein Systemmenü öffnen.
        tooth.addEventListener('contextmenu', (event) => event.preventDefault());

        tooth.addEventListener('keydown', (event) => {
          const key = (event as KeyboardEvent).key;
          if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
            event.preventDefault();
            if (hold || !canPress(id)) {
              return;
            }
            onPress(id, 0, false);
          }
        });
      }
    },

    /** Nimmt ein laufendes Halten still zurück (neue Runde) — ohne `onCancel`, die Bühne wird neu gebaut. */
    cancel(): void {
      const current = hold;
      if (!current) {
        return;
      }
      hold = null;
      toothElement(current.toothId)?.classList.remove('is-held');
    },

    dispose(): void {
      doc.removeEventListener('pointerup', onPointerUp);
      doc.removeEventListener('pointercancel', onPointerCancel);
      if (hold) {
        toothElement(hold.toothId)?.classList.remove('is-held');
        hold = null;
      }
      disposed = true;
    },

    isHolding(toothId?: number): boolean {
      if (toothId !== undefined) {
        return hold?.toothId === toothId;
      }
      return hold !== null;
    },
  };
}
