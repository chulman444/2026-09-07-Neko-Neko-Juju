import { useEffect } from 'react';
import { useDevHotkeysStore } from './devHotkeysStore';
import {
  attachDevHotkeysListener,
  type DevHotkeysListenerOptions,
} from '../lib/devHotkeysListener';

export interface UseDevHotkeysOptions extends DevHotkeysListenerOptions {
  enabled?: boolean;
}

export function useDevHotkeys(options?: UseDevHotkeysOptions) {
  const storeEnabled = useDevHotkeysStore((state) => state.isDevHotkeysEnabled);
  const isEnabled = options?.enabled !== undefined ? options.enabled : storeEnabled;
  const onTileMutated = options?.onTileMutated;
  const targetCanvasSelector = options?.targetCanvasSelector;

  useEffect(() => {
    if (!isEnabled) return;
    return attachDevHotkeysListener({
      onTileMutated,
      targetCanvasSelector,
    });
  }, [isEnabled, onTileMutated, targetCanvasSelector]);
}
