import type { ComboRule } from '../model/types';
import { DEFAULT_COMBO_RULES } from '../model/types';

export function evaluateFormula(
  formula: string | number | undefined | null,
  variables: { x: number; c?: number },
  fallback = 0
): number {
  if (formula === undefined || formula === null) return fallback;
  if (typeof formula === 'number') {
    return Number.isFinite(formula) ? formula : fallback;
  }
  const trimmed = String(formula).trim();
  if (!trimmed) return fallback;

  const directNum = Number(trimmed);
  if (!Number.isNaN(directNum)) {
    return directNum;
  }

  // Sanitize: allow numbers, arithmetic operators, parentheses, commas, whitespace, identifier characters
  if (!/^[0-9+\-*/%^().,\s_a-zA-Z]+$/.test(trimmed)) {
    return fallback;
  }

  const blockedWords =
    /\b(constructor|prototype|__proto__|window|document|global|process|eval|function|import|export|let|var|const|return|throw|while|for|if|else|switch|case|break|continue|new|class|this|void|typeof|delete|in|instanceof|yield|await|async)\b/i;
  if (blockedWords.test(trimmed)) {
    return fallback;
  }

  const expr = trimmed.replace(/\^/g, '**');

  try {
    const x = Number.isFinite(variables.x) ? variables.x : 0;
    const c = Number.isFinite(variables.c ?? 0) ? (variables.c ?? 0) : 0;

    const fn = new Function(
      'x',
      'c',
      'Math',
      `
      const { sin, cos, tan, atan, asin, acos, sqrt, pow, abs, min, max, floor, ceil, round, log, exp, PI, E } = Math;
      return (${expr});
      `
    );
    const result = fn(x, c, Math);
    if (typeof result === 'number' && Number.isFinite(result)) {
      return result;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function getMatchingComboRule(rules: ComboRule[], combo: number): ComboRule {
  if (!rules || rules.length === 0) {
    return DEFAULT_COMBO_RULES[0]!;
  }
  const sorted = [...rules].sort((a, b) => {
    const aVal = a.upToCombo ?? Infinity;
    const bVal = b.upToCombo ?? Infinity;
    return aVal - bVal;
  });
  for (const rule of sorted) {
    if (rule.upToCombo === null || combo <= rule.upToCombo) {
      return rule;
    }
  }
  return sorted[sorted.length - 1]!;
}
