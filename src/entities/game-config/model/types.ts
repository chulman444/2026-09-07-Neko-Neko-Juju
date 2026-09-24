export type GamePreset = 'classic' | 'editor' | 'arcade' | 'roguelite';

export interface GameFeatureFlags {
  enableItems: boolean;
  enableItemRefills: boolean;
  itemRefillStyle: 'wipe' | 'spin';
  itemButtonVariant: 'classic' | 'split';
  itemSplitStyle: 'cell' | 'badge';
  itemBadgePlacement: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  itemCdDirection: 'left' | 'right' | 'top' | 'bottom';
  itemCdFormat: 'integer' | 'decimal';
  enableDevTools: boolean;
  enableSolidBlocks: boolean;
  enableBounties: boolean;
  enableCombos: boolean;
  enableFreeTriggeredHint: boolean;
  enableTimer: boolean;
  enableSelectionHUD: boolean;
}

export interface GameConfigState extends GameFeatureFlags {
  preset: GamePreset;
  setPreset: (preset: GamePreset) => void;
  setFlag: <K extends keyof GameFeatureFlags>(flag: K, value: GameFeatureFlags[K]) => void;
  resetToPreset: () => void;
}
