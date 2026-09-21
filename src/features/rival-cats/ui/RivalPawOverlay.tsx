import React from 'react';
import { useBoardStore } from '@/entities/board';
import { useRivalCatStore } from '../model/rivalCatStore';
import type { RivalCat } from '../model/types';

export interface RivalPawOverlayProps {
  className?: string;
}

export const RivalPawOverlay: React.FC<RivalPawOverlayProps> = ({ className = '' }) => {
  const isEnabled = useRivalCatStore((state) => state.isEnabled);
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

        return (
          <React.Fragment key={cat.id}>
            {/* Combo Path / Tile Highlights */}
            {cat.targetMatch.map((tile, idx) => {
              const tileLeft = tile.col * pitch + tileBorder;
              const tileTop = tile.row * pitch + tileBorder;
              const isStart = idx === 0;

              return (
                <div
                  key={`${cat.id}-tile-${tile.row}-${tile.col}`}
                  className={`absolute rounded-xl transition-all duration-150 ${
                    isTough
                      ? 'border-2 border-dashed border-rose-400 bg-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.45)]'
                      : 'border-2 border-dashed border-amber-400 bg-amber-400/20 shadow-[0_0_10px_rgba(251,191,36,0.35)]'
                  } ${isStart ? 'ring-2 ring-offset-1 ' + (isTough ? 'ring-rose-500 ring-offset-rose-950' : 'ring-amber-400 ring-offset-amber-950') : ''}`}
                  style={{
                    left: `${tileLeft}px`,
                    top: `${tileTop}px`,
                    width: `${shapeSize}px`,
                    height: `${shapeSize}px`,
                  }}
                />
              );
            })}

            {/* The Rival Paw Indicator on the Start Tile */}
            <div
              className="absolute flex flex-col items-center justify-center transition-transform pointer-events-none select-none"
              style={{
                left: `${startLeft}px`,
                top: `${startTop}px`,
                width: `${shapeSize}px`,
                height: `${shapeSize}px`,
              }}
            >
              {/* Paw Icon */}
              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg ${
                  isTough
                    ? 'bg-rose-950/90 border border-rose-500 text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse'
                    : 'bg-amber-950/90 border border-amber-400 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                }`}
              >
                <span className="text-base select-none leading-none">{isTough ? '😾' : '🐾'}</span>
                {isTough && (
                  <span className="absolute -top-1.5 -right-1 text-[8px] font-black uppercase px-1 py-0.2 bg-rose-600 text-white rounded-full tracking-tighter">
                    Tough
                  </span>
                )}
              </div>

              {/* Countdown Badge */}
              <div
                className={`mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none shadow-md ${
                  isTough
                    ? 'bg-rose-900/90 text-rose-200 border border-rose-500/60'
                    : 'bg-zinc-900/90 text-amber-300 border border-amber-400/60'
                }`}
              >
                {cat.countdown.toFixed(1)}s
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
