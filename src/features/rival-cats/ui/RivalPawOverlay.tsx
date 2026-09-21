import React from 'react';
import { useBoardStore } from '@/entities/board';
import { useRivalCatStore } from '../model/rivalCatStore';
import type { RivalCat } from '../model/types';

export interface RivalPawOverlayProps {
  className?: string;
}

export const RivalPawOverlay: React.FC<RivalPawOverlayProps> = ({ className = '' }) => {
  const isEnabled = useRivalCatStore((state) => state.isEnabled);
  const showTargets = useRivalCatStore((state) => state.showTargets);
  const showTimer = useRivalCatStore((state) => state.showTimer);
  const stealDuration = useRivalCatStore((state) => state.stealDuration);
  const cats = useRivalCatStore((state) => state.cats);
  const shapeSize = useBoardStore((state) => state.shapeSize);
  const tileBorder = useBoardStore((state) => state.tileBorder);

  if (!isEnabled) return null;

  const targetingCats = cats.filter(
    (c): c is RivalCat & { targetMatch: NonNullable<RivalCat['targetMatch']> } =>
      c.phase === 'targeting' && !!c.targetMatch && c.targetMatch.length > 0
  );

  if (targetingCats.length === 0) return null;

  const pitch = shapeSize + tileBorder * 2;

  return (
    <div
      data-testid="rival-paw-overlay"
      className={`absolute inset-0 pointer-events-none z-20 overflow-visible ${className}`}
    >
      {targetingCats.map((cat) => {
        const isTough = cat.type === 'tough';
        const startTile = cat.targetMatch[0];
        const startLeft = startTile.col * pitch + tileBorder;
        const startTop = startTile.row * pitch + tileBorder;

        // Drain progress: 1.0 (full) down to 0.0 (empty)
        const totalDuration = stealDuration > 0 ? stealDuration : 4;
        const progress = Math.max(0, Math.min(1, cat.countdown / totalDuration));

        return (
          <React.Fragment key={cat.id}>
            {/* Combo Path / Target Tile Outlines (only when showTargets is enabled) */}
            {showTargets &&
              cat.targetMatch.slice(1).map((tile) => {
                const tileLeft = tile.col * pitch + tileBorder;
                const tileTop = tile.row * pitch + tileBorder;

                return (
                  <div
                    key={`${cat.id}-tile-${tile.row}-${tile.col}`}
                    className={`absolute rounded-xl transition-all duration-150 ${
                      isTough
                        ? 'border-2 border-dashed border-rose-500/80 bg-rose-500/15 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                        : 'border-2 border-dashed border-pink-400/80 bg-pink-400/15 shadow-[0_0_8px_rgba(244,114,182,0.25)]'
                    }`}
                    style={{
                      left: `${tileLeft}px`,
                      top: `${tileTop}px`,
                      width: `${shapeSize}px`,
                      height: `${shapeSize}px`,
                    }}
                  />
                );
              })}

            {/* Telegraphed Start Tile Container with Draining Square Timer Fill */}
            <div
              className={`absolute rounded-xl overflow-hidden border-2 transition-all duration-75 ${
                isTough
                  ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.45)]'
                  : 'border-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.35)]'
              }`}
              style={{
                left: `${startLeft}px`,
                top: `${startTop}px`,
                width: `${shapeSize}px`,
                height: `${shapeSize}px`,
              }}
            >
              {/* Draining liquid square fill: empties from top to bottom as countdown runs out */}
              <div
                className={`absolute bottom-0 left-0 right-0 transition-[height] duration-75 ease-linear ${
                  isTough ? 'bg-rose-500/35' : 'bg-pink-400/30'
                }`}
                style={{
                  height: `${progress * 100}%`,
                }}
              />
            </div>

            {/* Countdown Timer Badge positioned slightly below the tile */}
            {showTimer && (
              <div
                className="absolute flex items-center justify-center transition-transform pointer-events-none select-none z-30"
                style={{
                  left: `${startLeft + shapeSize / 2}px`,
                  top: `${startTop + shapeSize + 4}px`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none shadow-md ${
                    isTough
                      ? 'bg-rose-950/95 text-rose-200 border border-rose-500/80'
                      : 'bg-pink-950/95 text-pink-200 border border-pink-400/80'
                  }`}
                >
                  {cat.countdown.toFixed(1)}s
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
