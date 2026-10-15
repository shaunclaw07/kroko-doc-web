// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createHoldGesture, HOLD_MAX_MS } from './holdGesture';

function setupDom(): void {
  document.body.innerHTML = `
    <div id="stage">
      <svg class="creature">
        <g class="tooth" data-tooth="1"><rect width="20" height="20"/></g>
        <g class="tooth" data-tooth="2"><rect width="20" height="20"/></g>
      </svg>
    </div>
  `;
}

function pointer(
  type: 'pointerdown' | 'pointerup' | 'pointercancel',
  target: EventTarget,
  init: PointerEventInit = {},
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      isPrimary: true,
      button: 0,
      pointerId: 1,
      ...init,
    }),
  );
}

describe('holdGesture', () => {
  it('startet Halten bei primary pointerdown und ruft feel', () => {
    setupDom();
    const tooth1 = document.querySelector<SVGGElement>('.tooth[data-tooth="1"]')!;
    const feel = vi.fn();
    const onPress = vi.fn();
    const onCancel = vi.fn();
    let scheduledWait: { ms: number; run: () => void } | undefined;

    const gesture = createHoldGesture({
      doc: document,
      now: () => 1000,
      wait: (ms, run) => {
        scheduledWait = { ms, run };
      },
      canPress: () => true,
      feel,
      onPress,
      onCancel,
    });
    gesture.wireTeeth([tooth1]);

    pointer('pointerdown', tooth1);

    expect(tooth1.classList.contains('is-held')).toBe(true);
    expect(feel).toHaveBeenCalledTimes(1);
    expect(scheduledWait?.ms).toBe(HOLD_MAX_MS);
    expect(gesture.isHolding(1)).toBe(true);

    gesture.dispose();
  });

  it('löst onPress mit Haltedauer beim Loslassen auf dem Zahn aus', () => {
    setupDom();
    const tooth1 = document.querySelector<SVGGElement>('.tooth[data-tooth="1"]')!;
    let time = 1000;
    const onPress = vi.fn();
    const onCancel = vi.fn();

    const gesture = createHoldGesture({
      doc: document,
      now: () => time,
      wait: vi.fn(),
      canPress: () => true,
      feel: vi.fn(),
      onPress,
      onCancel,
    });
    gesture.wireTeeth([tooth1]);

    pointer('pointerdown', tooth1);

    time = 1450;
    pointer('pointerup', tooth1);

    expect(tooth1.classList.contains('is-held')).toBe(false);
    expect(onPress).toHaveBeenCalledWith(1, 450, true);
    expect(onCancel).not.toHaveBeenCalled();

    gesture.dispose();
  });

  it('bricht bei pointercancel ab und ruft onCancel', () => {
    setupDom();
    const tooth1 = document.querySelector<SVGGElement>('.tooth[data-tooth="1"]')!;
    const onPress = vi.fn();
    const onCancel = vi.fn();

    const gesture = createHoldGesture({
      doc: document,
      now: () => 1000,
      wait: vi.fn(),
      canPress: () => true,
      feel: vi.fn(),
      onPress,
      onCancel,
    });
    gesture.wireTeeth([tooth1]);

    pointer('pointerdown', tooth1);
    expect(tooth1.classList.contains('is-held')).toBe(true);

    pointer('pointercancel', document);
    expect(tooth1.classList.contains('is-held')).toBe(false);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();

    gesture.dispose();
  });

  it('löst Tastaturdruck ohne Halten direkt aus', () => {
    setupDom();
    const tooth1 = document.querySelector<SVGGElement>('.tooth[data-tooth="1"]')!;
    const onPress = vi.fn();

    const gesture = createHoldGesture({
      doc: document,
      wait: vi.fn(),
      canPress: () => true,
      feel: vi.fn(),
      onPress,
      onCancel: vi.fn(),
    });
    gesture.wireTeeth([tooth1]);

    tooth1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onPress).toHaveBeenCalledWith(1, 0, false);

    gesture.dispose();
  });
});
