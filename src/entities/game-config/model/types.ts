export type GamePreset = 'classic' | 'editor' | 'arcade' | 'roguelite';

export interface GameFeatureFlags {
  enableItems: boolean;
  enableDevTools: boolean;
  enableSolidBlocks: boolean;
  enableBounties: boolean;
  enableCombos: boolean;
  enableHints: boolean;
  enableTimer: boolean;
  enableSelectionHUD: boolean;
}

export interface GameConfigState extends GameFeatureFlags {
  preset: GamePreset;
  setPreset: (preset: GamePreset) => void;
  setFlag: <K extends keyof GameFeatureFlags>(flag: K, value: GameFeatureFlags[K]) => void;
  resetToPreset: () => void;
}
