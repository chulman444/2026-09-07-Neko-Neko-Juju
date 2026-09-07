import React from 'react';

interface TimerBarProps {
  countdown: number;
  initialCountdown: number;
  defeatThreshold: number;
  isPaused?: boolean;
}

export const TimerBar: React.FC<TimerBarProps> = ({
  countdown,
  initialCountdown,
  defeatThreshold,
  isPaused = false,
}) => {
  const getTimerBarParams = (t: number, lCap: number, dCap: number) => {
    if (t <= 0) {
      const pct = Math.max(0, Math.min(100, ((t + dCap) / dCap) * 100));
      return {
        activeColor: '#e74c3c',
        bgColor: '#ffffff',
        widthPct: pct,
        label: 'x0',
        isDeficit: true
      };
    } else if (t <= lCap) {
      const pct = Math.max(0, Math.min(100, (t / lCap) * 100));
      return {
        activeColor: '#ffba53',
        bgColor: '#e74c3c',
        widthPct: pct,
        label: 'x1',
        isDeficit: false
      };
    } else {
      const pct = Math.max(0, Math.min(100, ((t - lCap) / lCap) * 100));
      return {
        activeColor: '#2ca87c',
        bgColor: '#ffba53',
        widthPct: pct,
        label: 'x2',
        isDeficit: false
      };
    }
  };

  const params = getTimerBarParams(countdown, initialCountdown, defeatThreshold);

  return (
    <div
      className="flex items-center gap-2 bg-white border-[2.5px] border-[#4a3422] rounded-xl px-3 py-1.5 cursor-default select-none shadow-[0_2px_0px_#edd4b2]"
    >
      {isPaused && (
        <span className="text-[0.85rem] font-bold text-[#e74c3c]">
          ⏸️
        </span>
      )}

      <div
        className="relative w-[180px] h-4 border-2 border-[#4a3422] rounded-md overflow-hidden"
        style={{ backgroundColor: params.bgColor }}
      >
        {/* Active Bar (Smooth continuous update like hud-timer-bar) */}
        <div
          className="absolute top-0 left-0 h-full will-change-[width]"
          style={{
            backgroundColor: params.activeColor,
            width: `${params.widthPct}%`,
          }}
        />
      </div>

      <span
        className="font-bold text-[0.9rem] min-w-[24px] text-center"
        style={{ color: params.isDeficit ? '#e74c3c' : '#4a3422' }}
      >
        {params.label}
      </span>
    </div>
  );
};
