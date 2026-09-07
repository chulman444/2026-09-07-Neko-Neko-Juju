import React from 'react';

interface TimerBarProps {
  countdown: number;
  maxCountdown: number;
  isPaused?: boolean;
}

export const TimerBar: React.FC<TimerBarProps> = ({
  countdown,
  maxCountdown,
  isPaused = false,
}) => {
  const widthPct = maxCountdown > 0 ? Math.max(0, Math.min(100, (countdown / maxCountdown) * 100)) : 0;
  
  let activeColor = '#2ca87c'; // Green
  if (widthPct <= 20) {
    activeColor = '#e74c3c'; // Red
  } else if (widthPct <= 50) {
    activeColor = '#ffba53'; // Yellow
  }

  return (
    <div className="flex items-center gap-2 bg-white border-[2.5px] border-[#4a3422] rounded-xl px-3 py-1.5 cursor-default select-none shadow-[0_2px_0px_#edd4b2]">
      {isPaused && (
        <span className="text-[0.85rem] font-bold text-[#e74c3c]">
          ⏸️
        </span>
      )}

      <div className="relative w-[180px] h-4 border-2 border-[#4a3422] rounded-md overflow-hidden bg-zinc-200">
        <div
          className="absolute top-0 left-0 h-full will-change-[width] transition-colors duration-300"
          style={{
            backgroundColor: activeColor,
            width: `${widthPct}%`,
          }}
        />
      </div>

      <span className="font-bold text-[0.9rem] min-w-[32px] text-right text-[#4a3422]">
        {Math.ceil(countdown)}s
      </span>
    </div>
  );
};
