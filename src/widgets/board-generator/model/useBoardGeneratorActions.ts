import { useBoardStore, generateLinearTileWeights, sampleNormal } from '@/entities/board';
import { useBoardGenConfigStore } from '@/features/board-generator';
import { useDifficultyStore } from '@/entities/difficulty';
import { useSolverStore } from '@/features/look-ahead-solver';
import { useGameSessionStore } from '@/entities/game-session';

export function useBoardGeneratorActions() {
  const updateDimensions = (nextCols: number, nextRows: number) => {
    const clampedCols = Math.min(20, Math.max(3, nextCols));
    const clampedRows = Math.min(20, Math.max(3, nextRows));
    const { timerMultiplier } = useDifficultyStore.getState();
    const { setMaxCountdown, resetSession } = useGameSessionStore.getState();
    const { setDimensions } = useBoardStore.getState();

    setDimensions(clampedCols, clampedRows);

    // Auto-calculate and set initial timer cap for the new board size
    const calculatedTimer = Math.max(1, Math.round(clampedCols * clampedRows * timerMultiplier));
    setMaxCountdown(calculatedTimer);

    resetSession();
    useSolverStore
      .getState()
      .recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
  };

  const generateBoard = () => {
    const boardGenConfig = useBoardGenConfigStore.getState();
    const difficultyState = useDifficultyStore.getState();

    const [minVal, maxVal] = boardGenConfig.boardSizeRanges[boardGenConfig.selectedSizeTier];
    const low = Math.min(minVal, maxVal);
    const high = Math.max(minVal, maxVal);
    // The tier range bounds the longest side of the board
    const longestSide = Math.floor(Math.random() * (high - low + 1)) + low;

    const { ratioMean, ratioSpread } =
      boardGenConfig.tierAspectConfigs[boardGenConfig.selectedSizeTier];
    // Sample aspect ratio from normal distribution (bell curve)
    const sampledRatio = Math.max(0.3, Math.min(3.0, sampleNormal(ratioMean, ratioSpread)));

    let nextCols: number;
    let nextRows: number;

    if (sampledRatio >= 1.0) {
      // Wide or Square: Cols is the longest side, rows scales down from it
      nextCols = longestSide;
      nextRows = Math.max(3, Math.round(longestSide / sampledRatio));
    } else {
      // Tall: Rows is the longest side, cols scales down from it
      nextRows = longestSide;
      nextCols = Math.max(3, Math.round(longestSide * sampledRatio));
    }

    // Clamp both dimensions to [3, 20]
    nextCols = Math.min(20, Math.max(3, nextCols));
    nextRows = Math.min(20, Math.max(3, nextRows));

    // Roll difficulty tilt within selected difficulty tier range
    const [minTilt, maxTilt] =
      difficultyState.difficultyTiltRanges[difficultyState.selectedDifficultyTier];
    const lowTilt = Math.min(minTilt, maxTilt);
    const highTilt = Math.max(minTilt, maxTilt);
    const rolledTilt = Math.round((lowTilt + Math.random() * (highTilt - lowTilt)) * 10) / 10;
    const weights = generateLinearTileWeights(rolledTilt, difficultyState.difficultyNoiseSpread);
    useBoardStore.getState().setTileWeights(weights, rolledTilt);

    if (boardGenConfig.rollSeedOnGenerate) {
      useBoardStore.getState().generateNewBoard();
    }

    updateDimensions(nextCols, nextRows);
  };

  const applyDifficultyOnly = () => {
    const difficultyState = useDifficultyStore.getState();
    const [minTilt, maxTilt] =
      difficultyState.difficultyTiltRanges[difficultyState.selectedDifficultyTier];
    const lowTilt = Math.min(minTilt, maxTilt);
    const highTilt = Math.max(minTilt, maxTilt);
    const rolledTilt = Math.round((lowTilt + Math.random() * (highTilt - lowTilt)) * 10) / 10;
    const weights = generateLinearTileWeights(rolledTilt, difficultyState.difficultyNoiseSpread);
    useBoardStore.getState().setTileWeights(weights, rolledTilt);
    useGameSessionStore.getState().resetSession();
    useSolverStore
      .getState()
      .recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
  };

  const revertTimerCap = () => {
    const { cols, rows } = useBoardStore.getState();
    const { timerMultiplier } = useDifficultyStore.getState();
    const { setMaxCountdown } = useGameSessionStore.getState();
    const calculated = Math.max(1, Math.round(cols * rows * timerMultiplier));
    setMaxCountdown(calculated);
  };

  const loadSeed = (seedToLoad: string) => {
    useBoardStore.getState().setSeed(seedToLoad);
    useGameSessionStore.getState().resetSession();
    useSolverStore.getState().recalculate(useBoardStore.getState().matrix, seedToLoad);
  };

  const rollNewSeed = () => {
    useBoardStore.getState().generateNewBoard();
    useGameSessionStore.getState().resetSession();
    useSolverStore
      .getState()
      .recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
  };

  return {
    updateDimensions,
    generateBoard,
    applyDifficultyOnly,
    revertTimerCap,
    loadSeed,
    rollNewSeed,
  };
}
