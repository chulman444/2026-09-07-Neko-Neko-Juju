export interface ComboRule {
  id: string;
  upToCombo: number | null; // null means unbounded (e.g., 8+)
  addTimeValue: string | number; // e.g., '2' or 'x * 0.5'
  timerFlowMode: 'normal' | 'pause';
  pauseDuration: string | number; // Evaluates 'x' and 'c'. Default: 'c'
  comboDuration: string | number; // in seconds, e.g. '4'
  scoreMultiplier: string | number; // e.g., '1.5' or '1 + x*0.1'
}

export const DEFAULT_COMBO_RULES: ComboRule[] = [
  {
    id: 'combo-rule-1',
    upToCombo: 4,
    addTimeValue: '1',
    timerFlowMode: 'normal',
    pauseDuration: 'c',
    comboDuration: '5',
    scoreMultiplier: '1',
  },
  {
    id: 'combo-rule-2',
    upToCombo: 7,
    addTimeValue: '3',
    timerFlowMode: 'normal',
    pauseDuration: 'c',
    comboDuration: '4',
    scoreMultiplier: '1.5',
  },
  {
    id: 'combo-rule-3',
    upToCombo: null,
    addTimeValue: '5',
    timerFlowMode: 'normal',
    pauseDuration: 'c',
    comboDuration: '3',
    scoreMultiplier: '2',
  },
];
