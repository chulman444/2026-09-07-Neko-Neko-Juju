export type DifficultyTier = 'easy' | 'medium' | 'hard' | 'any';

export interface DifficultyTiltRanges {
  easy: [number, number];
  medium: [number, number];
  hard: [number, number];
  any: [number, number];
}

export const DEFAULT_DIFFICULTY_TILT_RANGES: DifficultyTiltRanges = {
  easy: [2.0, 5.0],
  medium: [-1.0, 1.0],
  hard: [-5.0, -2.0],
  any: [-5.0, 5.0],
};
