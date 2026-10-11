import React from 'react';
import { CalculatorMode, SoundEffect, ThemeId } from '../types/calculator';
import { THEMES } from '../utils/themes';
import { Volume2, VolumeX, Keyboard, Sun, Moon, Sparkles, Sliders } from 'lucide-react';

interface NavbarProps {
  currentMode: CalculatorMode;
  onSelectMode: (mode: CalculatorMode) => void;
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
  soundMode: SoundEffect;
  onToggleSound: () => void;
  onOpenShortcuts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  currentTheme,
  onSelectTheme,
  soundMode,
  onToggleSound,
  onOpenShortcuts,
}) => {
  const theme = THEMES[currentTheme];

  const modes: { id: CalculatorMode; label: string }[] = [
    { id: 'standard', label: 'Standard' },
    { id: 'scientific', label: 'Scientific' },
    { id: 'graphing', label: 'Graphing' },
    { id: 'programmer', label: 'Programmer' },
    { id: 'converter', label: 'Converter' },
    { id: 'financial', label: 'Finance' },
  ];

  // Cycle themes
  const cycleTheme = () => {
    const list: ThemeId[] = ['obsidian', 'swiss', 'rams', 'amber'];
    const idx = list.indexOf(currentTheme);
    const next = list[(idx + 1) % list.length];
    onSelectTheme(next);
  };

  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onSelectMode('standard');
            }}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-mono font-bold text-base shadow-sm shadow-cyan-900/40 group-hover:scale-105 transition-transform">
              ∑
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap">
              OmniCalc <span className="text-cyan-400 font-semibold text-xs ml-1 uppercase tracking-wider font-mono">Pro</span>
            </span>
          </a>
        </div>

        {/* Zone 2: Navigation Links (Single Line, functional segmented tabs) */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-1">
          {modes.map((m) => {
            const isActive = currentMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectMode(m.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={`Sound: ${soundMode} (Click to switch)`}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 transition-colors border border-transparent hover:border-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer"
          >
            {soundMode === 'off' ? (
              <VolumeX className="w-4 h-4 text-slate-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
            <span className="sr-only">Toggle sound</span>
          </button>

          {/* Theme switcher */}
          <button
            onClick={cycleTheme}
            title={`Theme: ${theme.name} (Click to cycle)`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800/90 rounded-lg border border-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer"
          >
            {currentTheme === 'swiss' ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : currentTheme === 'rams' ? (
              <Sliders className="w-3.5 h-3.5 text-orange-400" />
            ) : currentTheme === 'amber' ? (
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="hidden sm:inline-block">{theme.name.split(' ')[0]}</span>
          </button>

          {/* Keyboard Shortcuts Dialog trigger */}
          <button
            onClick={onOpenShortcuts}
            title="Keyboard shortcuts (?)"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 transition-colors border border-transparent hover:border-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer"
          >
            <Keyboard className="w-4 h-4" />
            <span className="sr-only">Keyboard shortcuts</span>
          </button>
        </div>
      </div>
    </header>
  );
};
