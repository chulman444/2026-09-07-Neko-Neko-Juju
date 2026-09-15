import React from 'react';
import { useGameSessionStore, DEFAULT_COMBO_RULES, type ComboRule } from '@/entities/game-session';

export const ComboProgressionSection: React.FC = () => {
  const comboRules = useGameSessionStore((state) => state.comboRules);
  const setComboRules = useGameSessionStore((state) => state.setComboRules);

  const handleAddRule = () => {
    // Determine a suggested upToCombo based on the highest existing bound
    const numericBounds = comboRules
      .map((r) => r.upToCombo)
      .filter((val): val is number => val !== null && Number.isFinite(val));
    const highestBound = numericBounds.length > 0 ? Math.max(...numericBounds) : 0;

    const newRule: ComboRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      upToCombo: highestBound > 0 ? highestBound + 3 : null,
      addTimeValue: '2',
      timerFlowMode: 'normal',
      pauseDuration: 'c',
      comboDuration: '3',
      scoreMultiplier: '1.5',
    };
    setComboRules([...comboRules, newRule]);
  };

  const handleRemoveRule = (id: string) => {
    if (comboRules.length <= 1) return;
    setComboRules(comboRules.filter((r) => r.id !== id));
  };

  const handleUpdateRule = (id: string, updates: Partial<ComboRule>) => {
    setComboRules(comboRules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const handleResetDefaults = () => {
    setComboRules([...DEFAULT_COMBO_RULES]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider">
          Combo Progression Rules
        </h4>
        <button
          type="button"
          onClick={handleResetDefaults}
          className="text-[11px] text-zinc-400 hover:text-amber-400 transition cursor-pointer"
        >
          Reset Defaults
        </button>
      </div>

      <div className="flex flex-col gap-2.5 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-700/80 text-zinc-400 text-[10px] uppercase font-semibold">
                <th className="py-1.5 px-2 whitespace-nowrap">Range (≤ x)</th>
                <th className="py-1.5 px-2 whitespace-nowrap">Add Time (s)</th>
                <th className="py-1.5 px-2 whitespace-nowrap text-center">Timer Flow</th>
                <th className="py-1.5 px-2 whitespace-nowrap">Pause Dur (s)</th>
                <th className="py-1.5 px-2 whitespace-nowrap">Combo Dur (s)</th>
                <th className="py-1.5 px-2 whitespace-nowrap">Score Mult</th>
                <th className="py-1.5 px-2 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/40">
              {comboRules.map((rule, idx) => {
                const isPause = rule.timerFlowMode === 'pause';

                return (
                  <tr key={rule.id} className="hover:bg-zinc-700/20 transition-colors">
                    {/* Range / Up To Combo */}
                    <td className="py-2 px-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          placeholder="∞"
                          value={rule.upToCombo ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            handleUpdateRule(rule.id, {
                              upToCombo: val === '' ? null : Math.max(1, parseInt(val, 10)),
                            });
                          }}
                          className="w-14 bg-zinc-850 border border-zinc-700 rounded px-2 py-1 text-right font-mono text-white text-xs focus:border-amber-500 focus:outline-none"
                          title="Max combo count for this rule. Blank means unbounded (∞)."
                        />
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {rule.upToCombo !== null ? `≤${rule.upToCombo}` : '∞'}
                        </span>
                      </div>
                    </td>

                    {/* Add Time Value */}
                    <td className="py-2 px-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={rule.addTimeValue}
                        onChange={(e) =>
                          handleUpdateRule(rule.id, { addTimeValue: e.target.value })
                        }
                        placeholder="e.g. 2 or x*0.5"
                        className="w-20 bg-zinc-850 border border-zinc-700 rounded px-2 py-1 text-right font-mono text-white text-xs focus:border-amber-500 focus:outline-none"
                        title="Time added to main countdown. Supports numbers or formulas with 'x' and 'c'."
                      />
                    </td>

                    {/* Timer Flow Mode (Radio: Normal | Pause) */}
                    <td className="py-2 px-2 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <label className="flex items-center gap-1 cursor-pointer text-[11px] text-zinc-300 hover:text-white">
                          <input
                            type="radio"
                            name={`timer-flow-${rule.id}`}
                            value="normal"
                            checked={rule.timerFlowMode === 'normal'}
                            onChange={() => handleUpdateRule(rule.id, { timerFlowMode: 'normal' })}
                            className="accent-amber-500 cursor-pointer"
                          />
                          <span>Normal</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer text-[11px] text-zinc-300 hover:text-white">
                          <input
                            type="radio"
                            name={`timer-flow-${rule.id}`}
                            value="pause"
                            checked={rule.timerFlowMode === 'pause'}
                            onChange={() => handleUpdateRule(rule.id, { timerFlowMode: 'pause' })}
                            className="accent-amber-500 cursor-pointer"
                          />
                          <span>Pause</span>
                        </label>
                      </div>
                    </td>

                    {/* Pause Duration */}
                    <td className="py-2 px-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={rule.pauseDuration}
                        disabled={!isPause}
                        onChange={(e) =>
                          handleUpdateRule(rule.id, { pauseDuration: e.target.value })
                        }
                        placeholder="c"
                        className="w-16 bg-zinc-850 border border-zinc-700 rounded px-2 py-1 text-right font-mono text-white text-xs focus:border-amber-500 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Pause duration in seconds. Evaluates 'x' and 'c' (default 'c')."
                      />
                    </td>

                    {/* Combo Duration */}
                    <td className="py-2 px-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={rule.comboDuration}
                        onChange={(e) =>
                          handleUpdateRule(rule.id, { comboDuration: e.target.value })
                        }
                        placeholder="e.g. 4"
                        className="w-16 bg-zinc-850 border border-zinc-700 rounded px-2 py-1 text-right font-mono text-white text-xs focus:border-amber-500 focus:outline-none"
                        title="Total duration in seconds for combo bar to deplete. Supports formulas with 'x'."
                      />
                    </td>

                    {/* Score Multiplier */}
                    <td className="py-2 px-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={rule.scoreMultiplier}
                        onChange={(e) =>
                          handleUpdateRule(rule.id, { scoreMultiplier: e.target.value })
                        }
                        placeholder="e.g. 1.5"
                        className="w-16 bg-zinc-850 border border-zinc-700 rounded px-2 py-1 text-right font-mono text-white text-xs focus:border-amber-500 focus:outline-none"
                        title="Score multiplier for matches at this combo tier. Supports formulas with 'x'."
                      />
                    </td>

                    {/* Remove Action */}
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(rule.id)}
                        disabled={comboRules.length <= 1}
                        className="px-2 py-1 text-[11px] font-bold text-zinc-400 hover:text-red-400 disabled:opacity-20 disabled:hover:text-zinc-400 transition cursor-pointer"
                        title={
                          comboRules.length <= 1
                            ? 'Cannot remove the last rule'
                            : `Remove rule #${idx + 1}`
                        }
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-700/60">
          <button
            type="button"
            onClick={handleAddRule}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <span>＋</span> Add Rule
          </button>
          <span className="text-[10px] text-zinc-400">
            Supports <code className="text-amber-300/90 font-mono">x</code> (combo),{' '}
            <code className="text-amber-300/90 font-mono">c</code> (duration), & Math functions
          </span>
        </div>
      </div>
    </div>
  );
};
