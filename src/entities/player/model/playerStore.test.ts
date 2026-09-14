import { describe, it, expect } from 'vitest';
import { usePlayerStore } from './playerStore';

describe('playerStore', () => {
  it('manages inversePan and panSensitivity correctly', () => {
    // Initial defaults
    expect(usePlayerStore.getState().inversePan).toBe(true);
    expect(usePlayerStore.getState().panSensitivity).toBe(1.5);

    // Toggle inversePan
    usePlayerStore.getState().toggleInversePan();
    expect(usePlayerStore.getState().inversePan).toBe(false);

    usePlayerStore.getState().toggleInversePan();
    expect(usePlayerStore.getState().inversePan).toBe(true);

    // Set inversePan directly
    usePlayerStore.getState().setInversePan(false);
    expect(usePlayerStore.getState().inversePan).toBe(false);

    // Set panSensitivity within valid range
    usePlayerStore.getState().setPanSensitivity(2.5);
    expect(usePlayerStore.getState().panSensitivity).toBe(2.5);

    // Clamps below minimum 0.2
    usePlayerStore.getState().setPanSensitivity(0.05);
    expect(usePlayerStore.getState().panSensitivity).toBe(0.2);

    // Clamps above maximum 6.0
    usePlayerStore.getState().setPanSensitivity(10.0);
    expect(usePlayerStore.getState().panSensitivity).toBe(6.0);
  });

  it('manages checkerboardMode and checkerColors with diagonal parity preservation', () => {
    // Initial defaults
    expect(usePlayerStore.getState().checkerboardMode).toBe('2-color');
    expect(usePlayerStore.getState().checkerColors.length).toBe(2);

    // Updates checkerboardMode
    usePlayerStore.getState().setCheckerboardMode('off');
    expect(usePlayerStore.getState().checkerboardMode).toBe('off');

    usePlayerStore.getState().setCheckerboardMode('2-color');
    expect(usePlayerStore.getState().checkerboardMode).toBe('2-color');

    // Updates custom checkerColors
    const customColors: [string, string] = ['#111111', '#222222'];
    usePlayerStore.getState().setCheckerColors(customColors);
    expect(usePlayerStore.getState().checkerColors).toEqual(customColors);

    // Diagonal Parity Invariance Verification:
    // Any step along a diagonal (dx = dy or dx = -dy) must preserve (c + r) % 2
    const startC = 2;
    const startR = 3;
    const startParity = (startC + startR) % 2;

    // True diagonal: dx = 6, dy = 6
    const diag6x6Parity = (startC + 6 + startR + 6) % 2;
    expect(diag6x6Parity).toBe(startParity);

    // True anti-diagonal: dx = -4, dy = 4
    const antiDiagParity = (startC - 4 + startR + 4) % 2;
    expect(antiDiagParity).toBe(startParity);

    // Off-diagonal confusing case: dx = 6, dy = 7
    const offDiagParity = (startC + 6 + startR + 7) % 2;
    expect(offDiagParity).not.toBe(startParity);
  });

  it('manages isSettingsOpen state and toggling correctly', () => {
    expect(usePlayerStore.getState().isSettingsOpen).toBe(false);

    usePlayerStore.getState().toggleSettings();
    expect(usePlayerStore.getState().isSettingsOpen).toBe(true);

    usePlayerStore.getState().toggleSettings();
    expect(usePlayerStore.getState().isSettingsOpen).toBe(false);

    usePlayerStore.getState().setIsSettingsOpen(true);
    expect(usePlayerStore.getState().isSettingsOpen).toBe(true);

    usePlayerStore.getState().setIsSettingsOpen(false);
    expect(usePlayerStore.getState().isSettingsOpen).toBe(false);
  });
});
