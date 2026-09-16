import { describe, it, expect, beforeEach } from 'vitest';
import { useDevHotkeysStore } from './devHotkeysStore';

describe('devHotkeysStore', () => {
  beforeEach(() => {
    useDevHotkeysStore.setState({ isDevHotkeysEnabled: false });
  });

  it('initializes with dev hotkeys disabled', () => {
    expect(useDevHotkeysStore.getState().isDevHotkeysEnabled).toBe(false);
  });

  it('updates state via setDevHotkeysEnabled', () => {
    useDevHotkeysStore.getState().setDevHotkeysEnabled(true);
    expect(useDevHotkeysStore.getState().isDevHotkeysEnabled).toBe(true);

    useDevHotkeysStore.getState().setDevHotkeysEnabled(false);
    expect(useDevHotkeysStore.getState().isDevHotkeysEnabled).toBe(false);
  });

  it('toggles state via toggleDevHotkeys', () => {
    expect(useDevHotkeysStore.getState().isDevHotkeysEnabled).toBe(false);
    useDevHotkeysStore.getState().toggleDevHotkeys();
    expect(useDevHotkeysStore.getState().isDevHotkeysEnabled).toBe(true);
    useDevHotkeysStore.getState().toggleDevHotkeys();
    expect(useDevHotkeysStore.getState().isDevHotkeysEnabled).toBe(false);
  });
});
