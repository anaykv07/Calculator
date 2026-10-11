import React, { useState, useMemo } from 'react';
import { ThemeConfig, UnitCategory } from '../types/calculator';
import { convertUnits, UNIT_CATEGORIES } from '../utils/converterEngine';
import { ArrowLeftRight, Copy, Check } from 'lucide-react';

interface ConverterCalculatorProps {
  theme: ThemeConfig;
}

export const ConverterCalculator: React.FC<ConverterCalculatorProps> = ({ theme }) => {
  const [category, setCategory] = useState<UnitCategory>('length');
  const catConfig = UNIT_CATEGORIES[category];

  const [fromUnitId, setFromUnitId] = useState<string>(catConfig.units[0].id);
  const [toUnitId, setToUnitId] = useState<string>(catConfig.units[1].id);
  const [inputValue, setInputValue] = useState<string>('1');
  const [hasCopied, setHasCopied] = useState(false);

  // Update units when category changes
  const handleCategoryChange = (newCat: UnitCategory) => {
    setCategory(newCat);
    const newConfig = UNIT_CATEGORIES[newCat];
    setFromUnitId(newConfig.units[0].id);
    setToUnitId(newConfig.units[1] ? newConfig.units[1].id : newConfig.units[0].id);
  };

  const numericInput = parseFloat(inputValue) || 0;

  const { result, formula } = useMemo(() => {
    return convertUnits(numericInput, category, fromUnitId, toUnitId);
  }, [numericInput, category, fromUnitId, toUnitId]);

  const swapUnits = () => {
    const prevFrom = fromUnitId;
    setFromUnitId(toUnitId);
    setToUnitId(prevFrom);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result.toString());
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 1500);
  };

  // Compute all units in this category for the quick overview matrix
  const allUnitConversions = useMemo(() => {
    return catConfig.units.map((u) => {
      const res = convertUnits(numericInput, category, fromUnitId, u.id);
      return {
        unit: u,
        value: res.result,
      };
    });
  }, [numericInput, category, fromUnitId, catConfig]);

  return (
    <div className={`w-full max-w-3xl mx-auto p-4 sm:p-6 rounded-2xl ${theme.cardClass}`}>
      {/* Category Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-4 border-b border-slate-800">
        {(Object.keys(UNIT_CATEGORIES) as UnitCategory[]).map((catKey) => {
          const c = UNIT_CATEGORIES[catKey];
          const isActive = category === catKey;
          return (
            <button
              key={catKey}
              onClick={() => handleCategoryChange(catKey)}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Main Conversion Cards */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 mb-6">
        {/* FROM Card */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
            From
          </label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full text-2xl font-mono font-bold text-white bg-transparent border-b border-slate-800 pb-2 focus:outline-none focus:border-cyan-500 mb-3"
            placeholder="0"
          />
          <select
            value={fromUnitId}
            onChange={(e) => setFromUnitId(e.target.value)}
            className="w-full text-xs font-mono bg-slate-900 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {catConfig.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* SWAP Button */}
        <div className="flex justify-center">
          <button
            onClick={swapUnits}
            title="Swap Units"
            className="p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-transform active:scale-90 cursor-pointer shadow-md"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* TO Card */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              To
            </span>
            <button
              onClick={copyResult}
              title="Copy result"
              className="p-1 rounded text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="w-full text-2xl font-mono font-bold text-cyan-300 border-b border-slate-800 pb-2 mb-3 overflow-x-auto select-all tabular-nums">
            {Number(result.toPrecision(8)).toLocaleString('en-US', { maximumFractionDigits: 6 })}
          </div>
          <select
            value={toUnitId}
            onChange={(e) => setToUnitId(e.target.value)}
            className="w-full text-xs font-mono bg-slate-900 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {catConfig.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Formula Reference Banner */}
      {formula && (
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center text-xs font-mono text-slate-400 mb-6">
          <span className="text-slate-500 mr-2">Formula:</span>
          <span className="text-cyan-400">{formula}</span>
        </div>
      )}

      {/* Complete Category Conversion Overview Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-400 mb-3">
          All {catConfig.name} Equivalents
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {allUnitConversions.map(({ unit, value }) => (
            <div
              key={unit.id}
              className={`p-2.5 rounded-lg border text-left transition-colors ${
                unit.id === toUnitId
                  ? 'bg-cyan-950/30 border-cyan-800/60'
                  : 'bg-slate-900/30 border-slate-800/60'
              }`}
            >
              <div className="text-[10px] text-slate-500 font-mono">
                {unit.name} ({unit.symbol})
              </div>
              <div className="text-sm font-mono font-bold text-slate-200 tabular-nums overflow-x-auto mt-0.5">
                {Number(value.toPrecision(7)).toLocaleString('en-US', { maximumFractionDigits: 5 })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
