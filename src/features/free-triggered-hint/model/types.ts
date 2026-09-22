export interface FreeTriggeredHintState {
  // Config & Tuning
  maxFreeHints: number;
  freeHintInterval: number;

  // Runtime State
  hintsRemaining: number;
  hintCountdown: number;
  hintPhaseStarted: boolean;
  isPhase1Over: boolean;

  // Actions
  setMaxFreeHints: (val: number) => void;
  setFreeHintInterval: (val: number) => void;
  tick: (
    deltaSeconds: number,
    isSurvivalDepleted: boolean,
    isTimerPaused?: boolean,
    tryTriggerHint?: () => boolean
  ) => void;
  resetHintSession: () => void;
}
