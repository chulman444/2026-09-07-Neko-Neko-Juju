import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { useState, useEffect } from 'react';
import { GameBoardWidget } from './GameBoardWidget';

const meta = {
  title: 'Widgets/GameBoard/GameBoardWidget',
  component: GameBoardWidget,
  parameters: {
    layout: 'centered',
  },
  args: {
    interactive: true,
    targetSum: 10,
    gameBg: '#fbf2df',
    onTilesCleared: fn(),
    onSelectionChange: fn(),
  },
  argTypes: {
    interactive: {
      control: 'boolean',
      description: 'Whether the board accepts pointer drags and matches',
    },
    targetSum: {
      control: 'number',
      description: 'Sum required for a valid match',
    },
    gameBg: {
      control: 'color',
      description: 'Background color of the board canvas',
    },
  },
} satisfies Meta<typeof GameBoardWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 1. Default Interactive Board
 * Use pointer to drag across tiles that sum to 10 (e.g. 5+5, 1+9).
 * Watch the Actions tab log onTilesCleared and onSelectionChange events!
 */
export const Default: Story = {};

/**
 * 2. Locked By Timer (interactive = false)
 * Simulates when the game timer expires or during pause.
 * Clicks and drags are ignored, cursor changes to not-allowed.
 */
export const LockedByTimer: Story = {
  args: {
    interactive: false,
  },
};

/**
 * 3. With Hint Highlighted
 * Demonstrates a Hint module communicating with the board
 * by passing coordinates to highlight with a pulsating golden aura.
 */
export const WithHintHighlighted: Story = {
  args: {
    highlightedTiles: [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ],
  },
};

/**
 * 4. Custom Mini Board (4x4)
 * Uses a controlled matrix with known pairs that sum to 10:
 * (7+3, 5+5, 6+4, 8+2).
 */
export const CustomMiniBoard: Story = {
  args: {
    matrix: [
      [7, 3, 5, 5],
      [6, 4, 1, 9],
      [8, 2, 4, 6],
      [9, 1, 3, 7],
    ],
  },
};

const TIMER_DEMO_DEFAULT_MATRIX = [
  [7, 3, 5, 5, 2, 8],
  [6, 4, 1, 9, 3, 7],
  [8, 2, 4, 6, 5, 5],
  [9, 1, 3, 7, 6, 4],
];

/**
 * 5. Interactive Board + Timer Simulation
 * A complete interactive demo showing how an external timer component
 * controls the board's interactive state and listens to onTilesCleared.
 */
export const BoardWithTimerDemo: Story = {
  render: function BoardWithTimer() {
    const [secondsLeft, setSecondsLeft] = useState(15);
    const [clearedCount, setClearedCount] = useState(0);
    const [score, setScore] = useState(0);
    const [resetKey, setResetKey] = useState(0);
    const isTimeUp = secondsLeft <= 0;

    useEffect(() => {
      if (secondsLeft <= 0) return;
      const interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
      return () => clearInterval(interval);
    }, [secondsLeft]);

    const handleClear = (tiles: { col: number; row: number }[], sum: number) => {
      setClearedCount((c) => c + tiles.length);
      setScore((s) => s + sum * 10);
      // Reward +2 seconds per cleared match
      setSecondsLeft((t) => t + 2);
    };

    return (
      <div className="flex flex-col items-center gap-4 p-6 bg-amber-50 rounded-2xl shadow-md border border-amber-200">
        {/* External Header / Timer / Score Modules */}
        <div className="flex items-center justify-between w-full max-w-xl px-4 py-2 bg-white rounded-xl shadow-sm border border-amber-100">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Timer Module
            </span>
            <span
              className={`text-2xl font-black ${
                isTimeUp ? 'text-red-500 animate-pulse' : 'text-amber-950'
              }`}
            >
              {secondsLeft}s {isTimeUp ? '(LOCKED)' : ''}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Matches Cleared
            </span>
            <span className="text-2xl font-black text-emerald-600">{clearedCount}</span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Score</span>
            <span className="text-2xl font-black text-amber-900">{score}</span>
          </div>
        </div>

        {/* The Standalone GameBoardWidget */}
        <GameBoardWidget
          key={resetKey}
          interactive={!isTimeUp}
          onTilesCleared={handleClear}
          matrix={TIMER_DEMO_DEFAULT_MATRIX}
        />

        {/* Reset / Bonus Controls */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setSecondsLeft(15);
              setClearedCount(0);
              setScore(0);
              setResetKey((k) => k + 1);
            }}
            className="px-4 py-1.5 text-sm font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
          >
            Reset Board & Timer (15s)
          </button>
          <button
            type="button"
            onClick={() => setSecondsLeft((s) => s + 5)}
            className="px-4 py-1.5 text-sm font-bold text-emerald-900 bg-emerald-200 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
          >
            +5 Bonus Seconds
          </button>
        </div>
      </div>
    );
  },
};
