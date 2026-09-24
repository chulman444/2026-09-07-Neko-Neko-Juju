import { create } from 'zustand';
import { useBoardStore, type TileCoord } from '@/entities/board';
import { orchestrator } from '@/shared/lib/orchestrator';
import type { CatPhase, CatType, DefeatCondition, RivalCat, RivalCatState } from './types';

let hintsResolver: (() => TileCoord[][]) | null = null;
let stealListener: ((tiles: TileCoord[]) => void) | null = null;

export const setRivalCatHintsResolver = (resolver: (() => TileCoord[][]) | null) => {
  hintsResolver = resolver;
};

export const getRivalCatHints = (): TileCoord[][] => {
  if (hintsResolver) return hintsResolver();
  return orchestrator.getClearableHints();
};

export const registerRivalStealListener = (listener: ((tiles: TileCoord[]) => void) | null) => {
  stealListener = listener;
};

export const notifyRivalSteal = (tiles: TileCoord[]) => {
  stealListener?.(tiles);
};

export const pickTargetMatch = (activeCats: RivalCat[]): TileCoord[] | null => {
  const hints = getRivalCatHints();
  if (!hints || hints.length === 0) return null;

  // Filter out hints already claimed by other targeting cats
  const alreadyTargeted = new Set<string>();
  for (const cat of activeCats) {
    if (cat.phase === 'targeting' && cat.targetMatch) {
      for (const t of cat.targetMatch) {
        alreadyTargeted.add(`${t.row},${t.col}`);
      }
    }
  }

  const available = hints.filter((h) => !h.some((t) => alreadyTargeted.has(`${t.row},${t.col}`)));

  const pool = available.length > 0 ? available : hints;
  const randomIndex = Math.floor(Math.random() * pool.length);
  const chosen = pool[randomIndex];
  return chosen ? chosen.map((c) => ({ row: c.row, col: c.col })) : null;
};

export const evaluatePlayerClear = (
  cat: RivalCat,
  clearedTiles: TileCoord[],
  defeatCondition: DefeatCondition
): 'defeated' | 'broken' | 'none' => {
  if (!cat.targetMatch || cat.targetMatch.length === 0) return 'none';

  const isExact =
    cat.targetMatch.length === clearedTiles.length &&
    cat.targetMatch.every((t) => clearedTiles.some((c) => c.row === t.row && c.col === t.col));

  const hasOverlap = cat.targetMatch.some((t) =>
    clearedTiles.some((c) => c.row === t.row && c.col === t.col)
  );

  const startTileMatch =
    cat.targetMatch.length > 0 &&
    clearedTiles.some(
      (c) => c.row === cat.targetMatch![0].row && c.col === cat.targetMatch![0].col
    );

  let isDefeated = false;
  if (defeatCondition === 'exact_match') {
    isDefeated = isExact;
  } else if (defeatCondition === 'any_overlap') {
    isDefeated = hasOverlap;
  } else if (defeatCondition === 'start_tile_only') {
    isDefeated = startTileMatch;
  }

  if (isDefeated) {
    return 'defeated';
  }
  if (hasOverlap) {
    return 'broken';
  }
  return 'none';
};

const createDefaultCat = (id = 'cat-1', type: CatType = 'normal', countdown = 5): RivalCat => ({
  id,
  type,
  phase: 'idle',
  countdown,
  targetMatch: null,
});

export const useRivalCatStore = create<RivalCatState>((set, get) => ({
  isEnabled: false,
  defeatCondition: 'any_overlap',
  cats: [createDefaultCat()],
  dormantDuration: 6,
  spawnInterval: 5,
  stealDuration: 4,
  pushbackPerClear: 1.5,
  toughCatPushbackBonus: -0.5,
  stolenTilesCount: 0,
  showTargets: true,
  showTimer: true,

  // Backward compatibility aliases
  rivalCatInterval: 5,
  rivalCatCountdown: 5,
  activeRivalCats: 1,

  setIsEnabled: (enabled: boolean) => {
    set({ isEnabled: enabled });
  },

  setShowTargets: (show: boolean) => {
    set({ showTargets: show });
  },

  setShowTimer: (show: boolean) => {
    set({ showTimer: show });
  },

  setDefeatCondition: (condition: DefeatCondition) => {
    set({ defeatCondition: condition });
  },

  setDormantDuration: (val: number) => {
    set({ dormantDuration: Math.max(0.5, val) });
  },

  setSpawnInterval: (val: number) => {
    const sanitized = Math.max(0.5, val);
    set((state) => ({
      spawnInterval: sanitized,
      rivalCatInterval: sanitized,
      cats: state.cats.map((c) =>
        c.phase === 'idle' ? { ...c, countdown: Math.min(c.countdown, sanitized) } : c
      ),
      rivalCatCountdown: Math.min(state.rivalCatCountdown, sanitized),
    }));
  },

  setStealDuration: (val: number) => {
    set({ stealDuration: Math.max(0.5, val) });
  },

  setPushbackPerClear: (val: number) => {
    set({ pushbackPerClear: Math.max(0, val) });
  },

  setToughCatPushbackBonus: (val: number) => {
    set({ toughCatPushbackBonus: val });
  },

  setRivalCatInterval: (val: number) => {
    get().setSpawnInterval(val);
  },

  setActiveRivalCats: (count: number) => {
    const targetCount = Math.max(1, count);
    const currentCats = get().cats;
    if (targetCount === currentCats.length) return;

    if (targetCount > currentCats.length) {
      const added: RivalCat[] = [];
      for (let i = currentCats.length; i < targetCount; i++) {
        added.push(createDefaultCat(`cat-${Date.now()}-${i}`, 'normal', get().spawnInterval));
      }
      const newCats = [...currentCats, ...added];
      set({
        cats: newCats,
        activeRivalCats: newCats.length,
      });
    } else {
      const newCats = currentCats.slice(0, targetCount);
      set({
        cats: newCats,
        activeRivalCats: newCats.length,
      });
    }
  },

  setStolenTilesCount: (count: number) => {
    set({ stolenTilesCount: Math.max(0, count) });
  },

  setCats: (cats: RivalCat[]) => {
    const safeCats = cats.length > 0 ? cats : [createDefaultCat()];
    set({
      cats: safeCats,
      activeRivalCats: safeCats.length,
      rivalCatCountdown: safeCats[0]?.countdown ?? get().spawnInterval,
    });
  },

  addCat: (type: CatType = 'normal') => {
    const newId = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newCat = createDefaultCat(newId, type, get().spawnInterval);
    const newCats = [...get().cats, newCat];
    set({
      cats: newCats,
      activeRivalCats: newCats.length,
    });
    return newId;
  },

  removeCat: (id: string) => {
    const currentCats = get().cats;
    if (currentCats.length <= 1) return;
    const newCats = currentCats.filter((c) => c.id !== id);
    set({
      cats: newCats,
      activeRivalCats: newCats.length,
      rivalCatCountdown: newCats[0]?.countdown ?? get().spawnInterval,
    });
  },

  resetCountdown: () => {
    const state = get();
    const updatedCats = state.cats.map((c) => {
      let resetVal = state.spawnInterval;
      if (c.phase === 'targeting') resetVal = state.stealDuration;
      if (c.phase === 'dormant') resetVal = state.dormantDuration;
      return { ...c, countdown: resetVal };
    });
    set({
      cats: updatedCats,
      rivalCatCountdown: updatedCats[0]?.countdown ?? state.spawnInterval,
    });
  },

  resetRivalCats: () => {
    const state = get();
    const defaultCat = createDefaultCat('cat-1', 'normal', state.spawnInterval);
    set({
      cats: [defaultCat],
      activeRivalCats: 1,
      rivalCatCountdown: state.spawnInterval,
      stolenTilesCount: 0,
    });
  },

  onPlayerClearedTiles: (clearedTiles: TileCoord[]) => {
    const state = get();
    if (!state.isEnabled || clearedTiles.length === 0) return;

    let changed = false;
    const updatedCats = state.cats.map((cat) => {
      // 1. Idle cats receive pushback when player clears tiles
      if (cat.phase === 'idle') {
        changed = true;
        const bonus = cat.type === 'tough' ? state.toughCatPushbackBonus : 0;
        const pushback = Math.max(0, state.pushbackPerClear + bonus);
        return {
          ...cat,
          countdown: cat.countdown + pushback,
        };
      }

      // 2. Targeting cats: evaluate counter-play (defeat or break), but no pushback on unrelated clear
      if (cat.phase === 'targeting' && cat.targetMatch) {
        const result = evaluatePlayerClear(cat, clearedTiles, state.defeatCondition);

        if (result === 'defeated') {
          changed = true;
          if (cat.type === 'normal') {
            return {
              ...cat,
              phase: 'dormant' as CatPhase,
              countdown: state.dormantDuration,
              targetMatch: null,
            };
          } else {
            // Tough cat: massive timer penalty
            return {
              ...cat,
              phase: 'idle' as CatPhase,
              countdown: state.spawnInterval * 2,
              targetMatch: null,
            };
          }
        }

        if (result === 'broken') {
          changed = true;
          if (cat.type === 'normal') {
            // Normal cat: forgive, retreat to idle
            return {
              ...cat,
              phase: 'idle' as CatPhase,
              countdown: state.spawnInterval,
              targetMatch: null,
            };
          } else {
            // Tough cat: relentless! instantly pick new target, stay targeting, restart stealDuration
            const otherCats = state.cats.filter((c) => c.id !== cat.id);
            const newTarget = pickTargetMatch(otherCats);
            if (newTarget) {
              return {
                ...cat,
                phase: 'targeting' as CatPhase,
                countdown: state.stealDuration,
                targetMatch: newTarget,
              };
            } else {
              return {
                ...cat,
                phase: 'idle' as CatPhase,
                countdown: state.spawnInterval,
                targetMatch: null,
              };
            }
          }
        }

        // result === 'none': Player cleared other tiles -> no pushback while targeting
        return cat;
      }

      return cat;
    });

    if (changed) {
      set({
        cats: updatedCats,
        rivalCatCountdown: updatedCats[0]?.countdown ?? state.spawnInterval,
      });
    }
  },

  tick: (deltaSeconds: number, isPaused = false) => {
    const state = get();
    if (!state.isEnabled || isPaused || deltaSeconds <= 0) return;

    let changed = false;
    let additionalStolen = 0;

    const currentCats = state.cats.map((c) => ({ ...c }));

    for (let i = 0; i < currentCats.length; i++) {
      const cat = currentCats[i];

      if (cat.phase === 'dormant') {
        const nextCountdown = cat.countdown - deltaSeconds;
        if (nextCountdown <= 0) {
          currentCats[i] = {
            ...cat,
            phase: 'idle',
            countdown: state.spawnInterval,
            targetMatch: null,
          };
          changed = true;
        } else {
          currentCats[i] = {
            ...cat,
            countdown: nextCountdown,
          };
          changed = true;
        }
      } else if (cat.phase === 'idle') {
        const nextCountdown = cat.countdown - deltaSeconds;
        if (nextCountdown <= 0) {
          // Pick target from hints
          const otherCats = currentCats.filter((_, idx) => idx !== i);
          const target = pickTargetMatch(otherCats);
          if (target) {
            currentCats[i] = {
              ...cat,
              phase: 'targeting',
              countdown: state.stealDuration,
              targetMatch: target,
            };
          } else {
            // No hints available right now, retry soon
            currentCats[i] = {
              ...cat,
              countdown: Math.min(state.spawnInterval, 1.0),
            };
          }
          changed = true;
        } else {
          currentCats[i] = {
            ...cat,
            countdown: nextCountdown,
          };
          changed = true;
        }
      } else if (cat.phase === 'targeting') {
        // Target Validation Check: check if target tiles still form a valid match
        const isStillValid =
          cat.targetMatch &&
          cat.targetMatch.length > 0 &&
          orchestrator.isComboValid(cat.targetMatch);

        if (!isStillValid) {
          // Target was broken externally (e.g. shuffle item or bomb)
          if (cat.type === 'normal') {
            currentCats[i] = {
              ...cat,
              phase: 'idle',
              countdown: state.spawnInterval,
              targetMatch: null,
            };
          } else {
            // Tough cat: relentless!
            const otherCats = currentCats.filter((_, idx) => idx !== i);
            const newTarget = pickTargetMatch(otherCats);
            if (newTarget) {
              currentCats[i] = {
                ...cat,
                phase: 'targeting',
                countdown: state.stealDuration,
                targetMatch: newTarget,
              };
            } else {
              currentCats[i] = {
                ...cat,
                phase: 'idle',
                countdown: state.spawnInterval,
                targetMatch: null,
              };
            }
          }
          changed = true;
          continue;
        }

        const nextCountdown = cat.countdown - deltaSeconds;
        if (nextCountdown <= 0) {
          // Execute steal
          const targetCombo = cat.targetMatch!;
          const handled = orchestrator.executeRivalSteal(targetCombo);
          if (!handled) {
            useBoardStore.getState().clearTiles(targetCombo);
            notifyRivalSteal(targetCombo);
          }
          additionalStolen += targetCombo.length;

          currentCats[i] = {
            ...cat,
            phase: 'idle',
            countdown: state.spawnInterval,
            targetMatch: null,
          };
          changed = true;
        } else {
          currentCats[i] = {
            ...cat,
            countdown: nextCountdown,
          };
          changed = true;
        }
      }
    }

    if (changed || additionalStolen > 0) {
      set((s) => ({
        cats: currentCats,
        stolenTilesCount: s.stolenTilesCount + additionalStolen,
        rivalCatCountdown: currentCats[0]?.countdown ?? s.spawnInterval,
      }));
    }
  },

  stealMatch: (catId?: string, explicitCombos?: TileCoord[][]) => {
    const state = get();
    const catIndex = catId
      ? state.cats.findIndex((c) => c.id === catId)
      : state.cats.findIndex((c) => c.phase === 'targeting' && c.targetMatch) >= 0
        ? state.cats.findIndex((c) => c.phase === 'targeting' && c.targetMatch)
        : 0;

    if (catIndex < 0 || catIndex >= state.cats.length) return false;
    const targetCat = state.cats[catIndex];

    let targetCombo =
      targetCat.phase === 'targeting' && targetCat.targetMatch ? targetCat.targetMatch : null;

    if (!targetCombo) {
      const activeClearables = explicitCombos ?? getRivalCatHints();
      if (activeClearables.length === 0) {
        return false;
      }
      const randomIndex = Math.floor(Math.random() * activeClearables.length);
      targetCombo = activeClearables[randomIndex];
    }

    if (!targetCombo || targetCombo.length === 0) {
      return false;
    }

    const handled = orchestrator.executeRivalSteal(targetCombo);
    if (!handled) {
      useBoardStore.getState().clearTiles(targetCombo);
      notifyRivalSteal(targetCombo);
    }
    const stolenAmount = targetCombo.length;

    const updatedCats = state.cats.map((c, idx) =>
      idx === catIndex
        ? {
            ...c,
            phase: 'idle' as CatPhase,
            countdown: state.spawnInterval,
            targetMatch: null,
          }
        : c
    );

    set((s) => ({
      cats: updatedCats,
      stolenTilesCount: s.stolenTilesCount + stolenAmount,
      rivalCatCountdown: updatedCats[0]?.countdown ?? s.spawnInterval,
    }));

    return true;
  },
}));
