import React from 'react';

export interface FooterConsoleProps {
  // Row 1 (Primary Row)
  row1Left?: React.ReactNode;
  row1Center?: React.ReactNode;
  row1Right?: React.ReactNode;

  // Row 2 (Secondary Extension Row)
  row2Left?: React.ReactNode;
  row2Center?: React.ReactNode;
  row2Right?: React.ReactNode;

  // Fallback / legacy slot props
  leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;

  // Global Console Slots
  overlaySlot?: React.ReactNode;
  children?: React.ReactNode;
  collapsedContent?: React.ReactNode;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const FooterConsole: React.FC<FooterConsoleProps> = ({
  row1Left,
  row1Center,
  row1Right,
  row2Left,
  row2Center,
  row2Right,
  leftSlot,
  centerSlot,
  rightSlot,
  bottomSlot,
  overlaySlot,
  children,
  collapsedContent,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
}) => {
  // If collapsed, show compact floating trigger pill
  if (isCollapsed) {
    return (
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-150 ${className}`}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 dark:bg-zinc-900/95 hover:bg-amber-50 dark:hover:bg-zinc-800 border-[2.5px] border-[#4a3422] dark:border-zinc-700 shadow-xl text-xs font-bold text-[#4a3422] dark:text-zinc-200 transition cursor-pointer hover:scale-105 active:scale-95 group backdrop-blur-md"
          title="Open mechanical console"
        >
          <span className="text-sm">🎒</span>
          <span>Footer Console</span>
          {collapsedContent}
          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold group-hover:-translate-y-0.5 transition-transform ml-1">
            ▲ Expand
          </span>
        </button>
      </div>
    );
  }

  const r1Left = row1Left ?? leftSlot;
  const r1Center = row1Center ?? centerSlot;
  const r1Right = row1Right ?? rightSlot;

  const hasRow1 = Boolean(r1Left || r1Center || r1Right);
  const hasRow2 = Boolean(row2Left || row2Center || row2Right);

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center select-none animate-in fade-in slide-in-from-bottom-3 duration-200 ${className}`}
    >
      {/* Optional Overlay Banner Slot directly above the console */}
      {overlaySlot && (
        <div className="w-full flex justify-center mb-2 pointer-events-auto">{overlaySlot}</div>
      )}

      {/* Main Floating Console Deck Frame */}
      <div className="relative flex flex-col items-center justify-between bg-[#fff9f1]/95 dark:bg-zinc-900/95 backdrop-blur-md border-[3px] border-[#4a3422] dark:border-zinc-700 rounded-2xl shadow-2xl px-4 py-3 w-fit max-w-[calc(100vw-2rem)] box-border gap-2.5">
        {children ? (
          children
        ) : (
          <>
            {/* Row 1: Primary Row (Left, Center, Right in symmetric 3-column layout) */}
            {hasRow1 && (
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 w-full">
                <div className="flex items-center justify-end gap-2.5">{r1Left}</div>
                <div className="flex flex-col items-center justify-center relative px-1">
                  {r1Center}
                </div>
                <div className="flex items-center justify-start gap-2.5">{r1Right}</div>
              </div>
            )}

            {/* Row 2: Secondary Extension Row (Symmetric 3-column grid matching Row 1) */}
            {hasRow2 && (
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 w-full pt-1.5 border-t border-[#edd4b2]/60 dark:border-zinc-800">
                <div className="flex items-center justify-end">{row2Left}</div>
                <div className="flex items-center justify-center">{row2Center}</div>
                <div className="flex items-center justify-start">{row2Right}</div>
              </div>
            )}

            {/* Optional legacy bottom slot when row2 is not used */}
            {!hasRow2 && bottomSlot && (
              <div className="w-full pt-1.5 border-t border-[#edd4b2]/60 dark:border-zinc-800 flex items-center justify-center">
                {bottomSlot}
              </div>
            )}
          </>
        )}

        {/* Optional Collapse Mini Button on Console Frame */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="absolute -top-3 -right-2 w-6 h-6 rounded-full bg-[#fff9f1] dark:bg-zinc-800 border-2 border-[#4a3422] dark:border-zinc-600 text-[#4a3422] dark:text-zinc-200 text-[10px] font-black flex items-center justify-center shadow-md hover:bg-amber-100 dark:hover:bg-zinc-700 transition cursor-pointer"
            title="Collapse footer console"
          >
            ▼
          </button>
        )}
      </div>
    </div>
  );
};
