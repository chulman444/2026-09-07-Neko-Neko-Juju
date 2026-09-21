import { create } from 'zustand';

export interface PhaseProgressionState {
  phase1Score: number;
  phase2Score: number;
  currentPhase: 1 | 2;
  isPhase1Over: boolean;

  addScore: (points: number, isPhase1?: boolean) => void;
  setPhase: (phase: 1 | 2) => void;
  setIsPhase1Over: (isOver: boolean) => void;
  resetProgression: () => void;
}

export const usePhaseProgressionStore = create<PhaseProgressionState>((set) => ({
  phase1Score: 0,
  phase2Score: 0,
  currentPhase: 1,
  isPhase1Over: false,

  addScore: (points: number, isPhase1) => {
    if (points <= 0) return;
    set((state) => {
      const isP1 = isPhase1 !== undefined ? isPhase1 : state.currentPhase === 1;
      return {
        phase1Score: isP1 ? state.phase1Score + points : state.phase1Score,
        phase2Score: isP1 ? state.phase2Score : state.phase2Score + points,
      };
    });
  },

  setPhase: (phase: 1 | 2) => {
    set({
      currentPhase: phase,
      isPhase1Over: phase === 2,
    });
  },

  setIsPhase1Over: (isOver: boolean) => {
    set({
      isPhase1Over: isOver,
      currentPhase: isOver ? 2 : 1,
    });
  },

  resetProgression: () => {
    set({
      phase1Score: 0,
      phase2Score: 0,
      currentPhase: 1,
      isPhase1Over: false,
    });
  },
}));
