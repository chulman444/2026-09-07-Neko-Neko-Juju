export type CheckerboardMode = 'off' | '2-color';

export interface PlayerState {
  checkerboardMode: CheckerboardMode;
  checkerColors: [string, string];
  inversePan: boolean;
  panSensitivity: number;
  dimBackdrop: boolean;
  isSettingsOpen: boolean;

  // Actions
  setCheckerboardMode: (mode: CheckerboardMode) => void;
  setCheckerColors: (colors: [string, string]) => void;
  setInversePan: (inversePan: boolean) => void;
  toggleInversePan: () => void;
  setPanSensitivity: (panSensitivity: number) => void;
  setDimBackdrop: (dimBackdrop: boolean) => void;
  toggleDimBackdrop: () => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
  toggleSettings: () => void;
}
