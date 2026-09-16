import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useBoardStore } from '@/entities/board';
import { attachDevHotkeysListener } from './devHotkeysListener';

describe('attachDevHotkeysListener', () => {
  let windowListeners: Record<string, ((e: unknown) => void)[]> = {};

  const mockCanvas = {
    getBoundingClientRect: () => ({
      left: 100,
      top: 100,
      width: 400,
      height: 400,
      right: 500,
      bottom: 500,
    }),
    width: 400,
    height: 400,
  };

  beforeEach(() => {
    windowListeners = {};

    (globalThis as unknown as { window: unknown }).window = {
      addEventListener: vi.fn((event: string, cb: (e: unknown) => void) => {
        windowListeners[event] = windowListeners[event] || [];
        windowListeners[event].push(cb);
      }),
      removeEventListener: vi.fn((event: string, cb: (e: unknown) => void) => {
        if (windowListeners[event]) {
          windowListeners[event] = windowListeners[event].filter((l) => l !== cb);
        }
      }),
    };

    (globalThis as unknown as { document: unknown }).document = {
      querySelector: vi.fn((selector: string) => {
        if (selector.includes('canvas')) {
          return mockCanvas;
        }
        return null;
      }),
    };

    useBoardStore.setState({
      cols: 4,
      rows: 4,
      shapeSize: 40,
      tileBorder: 0,
      minNum: 1,
      maxNum: 9,
      matrix: [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 1, 2, 3],
        [4, 5, 6, 7],
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function trigger(event: string, data: Record<string, unknown>) {
    windowListeners[event]?.forEach((cb) => cb(data));
  }

  it('registers and unregisters window event listeners', () => {
    const unbind = attachDevHotkeysListener();

    expect(windowListeners['pointermove']?.length).toBe(1);
    expect(windowListeners['pointerleave']?.length).toBe(1);
    expect(windowListeners['keydown']?.length).toBe(1);

    unbind();

    expect(windowListeners['pointermove']?.length).toBe(0);
    expect(windowListeners['pointerleave']?.length).toBe(0);
    expect(windowListeners['keydown']?.length).toBe(0);
  });

  it('mutates tile value when hovering and pressing a digit 1-9', () => {
    const onTileMutated = vi.fn();
    const unbind = attachDevHotkeysListener({ onTileMutated });

    // Hover over canvas at pixel (160, 160) -> local (60, 60) -> pitch=40 -> col=1, row=1 (initially 6)
    trigger('pointermove', { clientX: 160, clientY: 160 });

    // Press key '9'
    trigger('keydown', { key: '9', target: {} });

    expect(useBoardStore.getState().matrix[1]?.[1]).toBe(9);
    expect(onTileMutated).toHaveBeenCalledWith(1, 1, 9);

    unbind();
  });

  it('clears tile value to 0 on Backspace', () => {
    const onTileMutated = vi.fn();
    const unbind = attachDevHotkeysListener({ onTileMutated });

    // Hover over (col 0, row 0) -> clientX 110, clientY 110
    trigger('pointermove', { clientX: 110, clientY: 110 });

    trigger('keydown', { key: 'Backspace', target: {} });

    expect(useBoardStore.getState().matrix[0]?.[0]).toBe(0);
    expect(onTileMutated).toHaveBeenCalledWith(0, 0, 0);

    unbind();
  });

  it('randomizes tile on pressing r', () => {
    const onTileMutated = vi.fn();
    const unbind = attachDevHotkeysListener({ onTileMutated });

    trigger('pointermove', { clientX: 110, clientY: 110 });

    trigger('keydown', { key: 'r', target: {} });

    const afterVal = useBoardStore.getState().matrix[0]?.[0] ?? 0;
    expect(afterVal).toBeGreaterThanOrEqual(1);
    expect(afterVal).toBeLessThanOrEqual(9);
    expect(onTileMutated).toHaveBeenCalled();

    unbind();
  });

  it('ignores keydown when target is an input element', () => {
    const onTileMutated = vi.fn();
    const unbind = attachDevHotkeysListener({ onTileMutated });

    trigger('pointermove', { clientX: 160, clientY: 160 });

    // Simulate input element
    const inputElement = { tagName: 'INPUT' };

    trigger('keydown', { key: '3', target: inputElement });

    expect(useBoardStore.getState().matrix[1]?.[1]).toBe(6);
    expect(onTileMutated).not.toHaveBeenCalled();

    unbind();
  });

  it('ignores keydown when pointer is outside canvas', () => {
    const onTileMutated = vi.fn();
    const unbind = attachDevHotkeysListener({ onTileMutated });

    // Pointer outside canvas (e.g. 50, 50 while canvas left/top is 100)
    trigger('pointermove', { clientX: 50, clientY: 50 });
    trigger('keydown', { key: '5', target: {} });

    expect(useBoardStore.getState().matrix[0]?.[0]).toBe(1);
    expect(onTileMutated).not.toHaveBeenCalled();

    unbind();
  });

  it('resets hover tile on pointerleave', () => {
    const unbind = attachDevHotkeysListener();

    trigger('pointermove', { clientX: 160, clientY: 160 });
    trigger('pointerleave', {});

    // Now keydown should do nothing
    trigger('keydown', { key: '9', target: {} });
    expect(useBoardStore.getState().matrix[1]?.[1]).toBe(6);

    unbind();
  });
});
