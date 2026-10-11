// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { browserSessionMarks } from './sessionStorageMarks';

describe('browserSessionMarks', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('merkt sich ein Ereignis für die Sitzung', () => {
    const marks = browserSessionMarks();
    expect(marks.has('hint:meter')).toBe(false);
    marks.mark('hint:meter');
    expect(marks.has('hint:meter')).toBe(true);
  });

  it('haelt zwei Marken auseinander', () => {
    const marks = browserSessionMarks();
    marks.mark('a');
    expect(marks.has('b')).toBe(false);
  });

  it('faellt auf den Arbeitsspeicher zurueck, wenn es keinen Speicher gibt', () => {
    const marks = browserSessionMarks(null);
    expect(marks.has('hint:meter')).toBe(false);
    marks.mark('hint:meter');
    expect(marks.has('hint:meter')).toBe(true);
  });

  it('wirft nicht, wenn der Speicher gesperrt ist', () => {
    const blocked = { getItem: () => { throw new Error('gesperrt'); }, setItem: () => { throw new Error('gesperrt'); } } as unknown as Storage;
    const marks = browserSessionMarks(blocked);
    expect(() => marks.mark('x')).not.toThrow();
    expect(marks.has('x')).toBe(true);
  });
});
