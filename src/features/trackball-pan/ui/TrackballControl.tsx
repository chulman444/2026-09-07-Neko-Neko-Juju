import React from 'react';
import { useTrackball, type UseTrackballOptions } from '../model/useTrackball';

export interface TrackballControlProps extends UseTrackballOptions {
  className?: string;
}

export const TrackballControl: React.FC<TrackballControlProps> = ({
  className = '',
  sensitivity,
  inverseMovement,
}) => {
  const {
    knobOffset,
    trackballPadRef,
    handleTrackballPointerDown,
    handleTrackballPointerMove,
    handleTrackballPointerUpOrCancel,
    handleTrackballDoubleClick,
  } = useTrackball({ sensitivity, inverseMovement });

  return (
    <div className={`flex flex-col items-center justify-center relative px-1 ${className}`}>
      <div
        ref={trackballPadRef}
        onPointerDown={handleTrackballPointerDown}
        onPointerMove={handleTrackballPointerMove}
        onPointerUp={handleTrackballPointerUpOrCancel}
        onPointerCancel={handleTrackballPointerUpOrCancel}
        onDoubleClick={handleTrackballDoubleClick}
        className="w-[72px] h-[72px] rounded-full border-[3px] border-[#4a3422] dark:border-zinc-700 bg-[#fff9f1] dark:bg-zinc-950 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-[inset_0_-4px_0px_#edd4b2] dark:shadow-[inset_0_-4px_0px_#27272a] touch-none transition-shadow"
        title="Drag trackball to pan board view • Double-click to re-center"
        role="slider"
        aria-label="Trackball pan control"
      >
        <div
          className="w-[26px] h-[26px] rounded-full border-[3px] border-[#4a3422] dark:border-zinc-700 bg-[#ffba53] shadow-[inset_0_-3px_0px_#c96a2e] pointer-events-none transition-transform duration-75"
          style={{
            transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
          }}
        />
      </div>
    </div>
  );
};
