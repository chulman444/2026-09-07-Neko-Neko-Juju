import { useState, useRef, useCallback } from 'react';
import { useGameConfigStore } from '@/entities/game-config';

export const VALID_CHEAT_CODES = ['dev', 'tools', 'juju', 'neko', 'ieatpoop'];

export function isCheatCodeValid(input: string): boolean {
  return VALID_CHEAT_CODES.includes(input.trim().toLowerCase());
}

export interface UseCheatCodeOptions {
  onCheatSuccess?: () => void;
  resetDelayMs?: number;
}

export function useCheatCode(options: UseCheatCodeOptions = {}) {
  const { onCheatSuccess, resetDelayMs = 2500 } = options;
  const [cheatBuffer, setCheatBuffer] = useState('');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const setFlag = useGameConfigStore((state) => state.setFlag);

  const triggerFadeOut = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsFadingOut(true);
    setTimeout(() => {
      setCheatBuffer('');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      setIsFadingOut(false);
      setIsSuccess(false);
    }, 250);
  }, []);

  const restartCheatTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      triggerFadeOut();
    }, resetDelayMs);
  }, [triggerFadeOut, resetDelayMs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCheatBuffer(val);
    setIsFadingOut(false);
    restartCheatTimer();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (isCheatCodeValid(cheatBuffer)) {
        setFlag('enableDevTools', true);
        setIsSuccess(true);
        onCheatSuccess?.();
      }
      if (inputRef.current) {
        inputRef.current.blur();
      }
      triggerFadeOut();
      return;
    }

    if (e.key === 'Escape') {
      if (inputRef.current) {
        inputRef.current.blur();
      }
      triggerFadeOut();
      return;
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (cheatBuffer.length > 0) {
      triggerFadeOut();
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return {
    cheatBuffer,
    isFadingOut,
    isFocused,
    isSuccess,
    inputRef,
    handleInputChange,
    handleKeyDown,
    handleFocus,
    handleBlur,
    focusInput,
    triggerFadeOut,
  };
}
