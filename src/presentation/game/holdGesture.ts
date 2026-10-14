/** So lange braucht der Zahn, um unter dem Finger zu sinken (ms) — nur Bild, kein Urteil. */
export const HOLD_SINK_MS = 320;

/**
 * Längstes Halten (ms). Danach federt der Zahn zurück, **ohne** Zug: ein verlorenes Loslassen
 * (Tabwechsel, Systemdialog) darf nichts entscheiden und die Bühne nicht sperren.
 */
export const HOLD_MAX_MS = 4000;

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

  let hold: Hold | null = null;
  let disposed = false;

  function toothElement(toothId: number): SVGGElement | null {
    return doc.querySelector<SVGGElement>(`.tooth[data-tooth="${toothId}"]`);
  }

  function beginHold(toothId: number, pointerId: number): void {
    if (disposed || hold || !canPress(toothId)) {
      return;
    }
    const current: Hold = { toothId, pointerId, startedAt: now() };
    hold = current;
    toothElement(toothId)?.classList.add('is-held');
    feel();
    wait(HOLD_MAX_MS, () => {
      if (hold === current) {
        cancelHold();
      }
    });
  }

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

  function releasedOnTooth(pointer: PointerEvent, toothId: number): boolean {
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

  doc.addEventListener('pointerup', onPointerUp);
  doc.addEventListener('pointercancel', onPointerCancel);

  return {
    wireTeeth(teeth: Iterable<SVGGElement>): void {
      for (const tooth of teeth) {
        const id = Number(tooth.dataset.tooth ?? '0');

        tooth.addEventListener('pointerdown', (event) => {
          const pointer = event as PointerEvent;
          if (!pointer.isPrimary || pointer.button !== 0) {
            return;
          }
          beginHold(id, pointer.pointerId);
        });

        tooth.addEventListener(
          'touchstart',
          (event) => {
            if (hold?.toothId === id && event.cancelable) {
              event.preventDefault();
            }
          },
          { passive: false },
        );

        tooth.addEventListener('click', (event) => {
          if ((event as MouseEvent).detail === 0) {
            if (hold || !canPress(id)) {
              return;
            }
            onPress(id, 0, false);
          }
        });

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
