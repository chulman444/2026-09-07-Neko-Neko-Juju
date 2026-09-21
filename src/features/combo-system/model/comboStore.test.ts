import { describe, it, expect, beforeEach } from 'vitest';
import {
  useComboStore,
  DEFAULT_COMBO_RULES,
  evaluateFormula,
  getMatchingComboRule,
  type ComboRule,
} from '../index';

describe('comboStore & comboMath', () => {
  beforeEach(() => {
    useComboStore.getState().resetCombo();
    useComboStore.getState().setComboRules([...DEFAULT_COMBO_RULES]);
  });

  describe('default combo rules', () => {
    it('has sensible default combo rules defined', () => {
      expect(DEFAULT_COMBO_RULES.length).toBeGreaterThanOrEqual(3);
      expect(DEFAULT_COMBO_RULES[0]?.upToCombo).toBe(4);
      expect(DEFAULT_COMBO_RULES[DEFAULT_COMBO_RULES.length - 1]?.upToCombo).toBeNull();
    });
  });

  describe('evaluateFormula', () => {
    it('evaluates raw numbers and numerical strings', () => {
      expect(evaluateFormula(5, { x: 1 })).toBe(5);
      expect(evaluateFormula('3.5', { x: 1 })).toBe(3.5);
    });

    it('evaluates dynamic equations with x and c', () => {
      expect(evaluateFormula('x * 0.5', { x: 4 })).toBe(2);
      expect(evaluateFormula('1 + x * 0.1', { x: 10 })).toBe(2);
      expect(evaluateFormula('c', { x: 3, c: 4.5 })).toBe(4.5);
      expect(evaluateFormula('c * 0.5', { x: 2, c: 6 })).toBe(3);
    });

    it('evaluates standard math functions', () => {
      expect(evaluateFormula('atan(x)', { x: 0 })).toBe(0);
      expect(evaluateFormula('min(10, x * 3)', { x: 5 })).toBe(10);
      expect(evaluateFormula('max(2, x)', { x: 1 })).toBe(2);
      expect(evaluateFormula('sqrt(x)', { x: 16 })).toBe(4);
    });

    it('safely handles invalid syntax or empty input', () => {
      expect(evaluateFormula('', { x: 1 }, 0)).toBe(0);
      expect(evaluateFormula(null, { x: 1 }, 5)).toBe(5);
      expect(evaluateFormula('x * +', { x: 1 }, 2)).toBe(2);
      expect(evaluateFormula('console.log(1)', { x: 1 }, 0)).toBe(0);
    });
  });

  describe('getMatchingComboRule', () => {
    const sampleRules: ComboRule[] = [
      {
        id: 'tier1',
        upToCombo: 4,
        addTimeValue: 1,
        timerFlowMode: 'normal',
        pauseDuration: 'c',
        comboDuration: 5,
        scoreMultiplier: 1,
      },
      {
        id: 'tier2',
        upToCombo: 7,
        addTimeValue: 3,
        timerFlowMode: 'normal',
        pauseDuration: 'c',
        comboDuration: 4,
        scoreMultiplier: 1.5,
      },
      {
        id: 'tier3',
        upToCombo: null,
        addTimeValue: 5,
        timerFlowMode: 'pause',
        pauseDuration: 'c',
        comboDuration: 3,
        scoreMultiplier: 2,
      },
    ];

    it('matches correct rule by combo thresholds', () => {
      expect(getMatchingComboRule(sampleRules, 1).id).toBe('tier1');
      expect(getMatchingComboRule(sampleRules, 4).id).toBe('tier1');
      expect(getMatchingComboRule(sampleRules, 5).id).toBe('tier2');
      expect(getMatchingComboRule(sampleRules, 7).id).toBe('tier2');
      expect(getMatchingComboRule(sampleRules, 8).id).toBe('tier3');
      expect(getMatchingComboRule(sampleRules, 25).id).toBe('tier3');
    });

    it('handles unordered rules correctly', () => {
      const unordered = [sampleRules[2]!, sampleRules[0]!, sampleRules[1]!];
      expect(getMatchingComboRule(unordered, 3).id).toBe('tier1');
      expect(getMatchingComboRule(unordered, 6).id).toBe('tier2');
      expect(getMatchingComboRule(unordered, 10).id).toBe('tier3');
    });
  });

  describe('registerMatch', () => {
    it('increments combo count and evaluates score multiplier and added time', () => {
      const store = useComboStore.getState();
      store.setComboRules([
        {
          id: 'rule-test',
          upToCombo: null,
          addTimeValue: 'x * 2',
          timerFlowMode: 'normal',
          pauseDuration: 'c',
          comboDuration: 5,
          scoreMultiplier: '1.5',
        },
      ]);

      const result1 = store.registerMatch();
      expect(result1.newComboCount).toBe(1);
      expect(result1.scoreMultiplier).toBe(1.5);
      expect(result1.addTime).toBe(2); // 1 * 2

      const state1 = useComboStore.getState();
      expect(state1.comboCount).toBe(1);
      expect(state1.comboPct).toBe(100);

      const result2 = store.registerMatch();
      expect(result2.newComboCount).toBe(2);
      expect(result2.addTime).toBe(4); // 2 * 2
    });

    it('sets pauseRemaining when timerFlowMode is pause', () => {
      const store = useComboStore.getState();
      store.setComboRules([
        {
          id: 'pause-rule',
          upToCombo: null,
          addTimeValue: 0,
          timerFlowMode: 'pause',
          pauseDuration: 'c',
          comboDuration: 4,
          scoreMultiplier: 1,
        },
      ]);

      const result = store.registerMatch();
      expect(result.pauseRemaining).toBe(4);
      expect(store.isTimerPaused()).toBe(true);
    });
  });

  describe('tick & drain', () => {
    it('drains combo percentage over duration and resets when reaching 0', () => {
      useComboStore.getState().setComboRules([
        {
          id: 'test',
          upToCombo: null,
          addTimeValue: 0,
          timerFlowMode: 'normal',
          pauseDuration: 'c',
          comboDuration: 2, // 50% per second
          scoreMultiplier: 1,
        },
      ]);

      useComboStore.getState().registerMatch(); // comboCount: 1, comboPct: 100
      expect(useComboStore.getState().comboPct).toBe(100);

      // Tick 1s: drains 50%
      useComboStore.getState().tick(1.0);
      expect(useComboStore.getState().comboPct).toBeCloseTo(50);
      expect(useComboStore.getState().comboCount).toBe(1);

      // Tick 1.1s: drains beyond 0, resets to 0
      useComboStore.getState().tick(1.1);
      expect(useComboStore.getState().comboPct).toBe(0);
      expect(useComboStore.getState().comboCount).toBe(0);
    });

    it('drains comboPauseRemaining on tick', () => {
      useComboStore.getState().setComboRules([
        {
          id: 'pause',
          upToCombo: null,
          addTimeValue: 0,
          timerFlowMode: 'pause',
          pauseDuration: 3,
          comboDuration: 5,
          scoreMultiplier: 1,
        },
      ]);

      useComboStore.getState().registerMatch();
      expect(useComboStore.getState().comboPauseRemaining).toBe(3);

      useComboStore.getState().tick(1.5);
      expect(useComboStore.getState().comboPauseRemaining).toBe(1.5);
    });
  });
});
