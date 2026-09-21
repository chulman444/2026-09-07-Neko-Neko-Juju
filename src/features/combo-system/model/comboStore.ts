import { create } from 'zustand';
import type { ComboRule } from './types';
import { DEFAULT_COMBO_RULES } from './types';
import { evaluateFormula, getMatchingComboRule } from '../lib/comboMath';

export interface MatchComboResult {
  newComboCount: number;
  scoreMultiplier: number;
  addTime: number;
  pauseRemaining: number;
}

export interface ComboState {
  comboCount: number;
  comboPct: number;
  comboPauseRemaining: number;
  comboRules: ComboRule[];

  setComboRules: (rules: ComboRule[]) => void;
  resetCombo: () => void;
  registerMatch: (clearedTileCount?: number, spanTileCount?: number) => MatchComboResult;
  tick: (deltaSeconds: number) => void;
  isTimerPaused: () => boolean;
}

export const useComboStore = create<ComboState>((set, get) => ({
  comboCount: 0,
  comboPct: 0,
  comboPauseRemaining: 0,
  comboRules: [...DEFAULT_COMBO_RULES],

  setComboRules: (rules) => {
    set({ comboRules: rules });
  },

  resetCombo: () => {
    set({
      comboCount: 0,
      comboPct: 0,
      comboPauseRemaining: 0,
    });
  },

  registerMatch: (_clearedTileCount = 0, _spanTileCount) => {
    const state = get();
    const newComboCount = state.comboCount + 1;
    const rule = getMatchingComboRule(state.comboRules, newComboCount);

    // 1. Evaluate comboDuration (c)
    const evaluatedComboDuration = Math.max(
      0.1,
      evaluateFormula(rule.comboDuration, { x: newComboCount, c: 0 }, 4)
    );

    // 2. Evaluate addTimeValue
    const evaluatedAddTime = Math.max(
      0,
      evaluateFormula(rule.addTimeValue, { x: newComboCount, c: evaluatedComboDuration }, 0)
    );

    // 3. Evaluate scoreMultiplier
    const evaluatedMultiplier = Math.max(
      0,
      evaluateFormula(rule.scoreMultiplier, { x: newComboCount, c: evaluatedComboDuration }, 1)
    );

    // 4. Timer flow state
    let nextComboPauseRemaining = 0;
    if (rule.timerFlowMode === 'pause') {
      nextComboPauseRemaining = Math.max(
        0,
        evaluateFormula(
          rule.pauseDuration,
          { x: newComboCount, c: evaluatedComboDuration },
          evaluatedComboDuration
        )
      );
    }

    set({
      comboCount: newComboCount,
      comboPct: 100,
      comboPauseRemaining: nextComboPauseRemaining,
    });

    return {
      newComboCount,
      scoreMultiplier: evaluatedMultiplier,
      addTime: evaluatedAddTime,
      pauseRemaining: nextComboPauseRemaining,
    };
  },

  tick: (deltaSeconds: number) => {
    if (deltaSeconds <= 0) return;
    const state = get();
    if (state.comboCount <= 0 && state.comboPauseRemaining <= 0) return;

    let nextPause = state.comboPauseRemaining;
    if (nextPause > 0) {
      nextPause = Math.max(0, nextPause - deltaSeconds);
    }

    let nextCount = state.comboCount;
    let nextPct = state.comboPct;

    if (state.comboCount > 0) {
      const rule = getMatchingComboRule(state.comboRules, state.comboCount);
      const evaluatedDuration = Math.max(
        0.1,
        evaluateFormula(rule.comboDuration, { x: state.comboCount, c: 0 }, 4)
      );
      const drainRate = 100 / evaluatedDuration;
      nextPct = state.comboPct - drainRate * deltaSeconds;

      if (nextPct <= 0) {
        nextCount = 0;
        nextPct = 0;
        nextPause = 0;
      }
    }

    set({
      comboCount: nextCount,
      comboPct: nextPct,
      comboPauseRemaining: nextPause,
    });
  },

  isTimerPaused: () => {
    const state = get();
    if (state.comboCount <= 0) return false;
    if (state.comboPauseRemaining > 0) return true;
    const rule = getMatchingComboRule(state.comboRules, state.comboCount);
    return rule.timerFlowMode === 'pause' && rule.pauseDuration === 'c';
  },
}));
