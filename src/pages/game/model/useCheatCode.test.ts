import { describe, it, expect, beforeEach } from 'vitest';
import { VALID_CHEAT_CODES, isCheatCodeValid } from './useCheatCode';
import { useGameConfigStore } from '@/entities/game-config';

describe('useCheatCode logic', () => {
  beforeEach(() => {
    useGameConfigStore.getState().setFlag('enableDevTools', false);
  });

  it('recognizes valid cheat codes case-insensitively and with trimming', () => {
    expect(isCheatCodeValid('dev')).toBe(true);
    expect(isCheatCodeValid('  DEV  ')).toBe(true);
    expect(isCheatCodeValid('tools')).toBe(true);
    expect(isCheatCodeValid('juju')).toBe(true);
    expect(isCheatCodeValid('NEKO')).toBe(true);
    expect(isCheatCodeValid('ieatpoop')).toBe(true);
  });

  it('rejects invalid cheat codes', () => {
    expect(isCheatCodeValid('randomText')).toBe(false);
    expect(isCheatCodeValid('developer')).toBe(false);
    expect(isCheatCodeValid('')).toBe(false);
  });

  it('contains expected list of cheat codes', () => {
    expect(VALID_CHEAT_CODES).toContain('dev');
    expect(VALID_CHEAT_CODES).toContain('tools');
    expect(VALID_CHEAT_CODES).toContain('juju');
    expect(VALID_CHEAT_CODES).toContain('neko');
    expect(VALID_CHEAT_CODES).toContain('ieatpoop');
  });

  it('activates enableDevTools when cheat is applied', () => {
    expect(useGameConfigStore.getState().enableDevTools).toBe(false);

    if (isCheatCodeValid('dev')) {
      useGameConfigStore.getState().setFlag('enableDevTools', true);
    }

    expect(useGameConfigStore.getState().enableDevTools).toBe(true);
  });
});
