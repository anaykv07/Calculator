/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CalculatorMode, HistoryItem, SoundEffect, ThemeId } from './types/calculator';
import { THEMES } from './utils/themes';
import { Navbar } from './components/Navbar';
import { StandardCalculator } from './components/StandardCalculator';
import { ScientificCalculator } from './components/ScientificCalculator';
import { GraphingCalculator } from './components/GraphingCalculator';
import { ProgrammerCalculator } from './components/ProgrammerCalculator';
import { ConverterCalculator } from './components/ConverterCalculator';
import { FinancialCalculator } from './components/FinancialCalculator';
import { TapeHistory } from './components/TapeHistory';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { FileText, ChevronRight, ChevronLeft } from 'lucide-react';

export default function App() {
  const [currentMode, setCurrentMode] = useState<CalculatorMode>('standard');
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('obsidian');
  const [soundMode, setSoundMode] = useState<SoundEffect>('mechanical');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [externalLoadValue, setExternalLoadValue] = useState<string | undefined>(undefined);
  const [isTapeSidebarOpen, setIsTapeSidebarOpen] = useState(true);

  // Load saved preferences & history on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('omni_theme') as ThemeId;
      if (savedTheme && THEMES[savedTheme]) {
        setCurrentTheme(savedTheme);
      }
      const savedSound = localStorage.getItem('omni_sound') as SoundEffect;
      if (savedSound) {
        setSoundMode(savedSound);
      }
      const savedHistory = localStorage.getItem('omni_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch {
      // localStorage restriction fail-safe
    }
  }, []);

  // Save history to localStorage
  const saveHistoryToStorage = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('omni_history', JSON.stringify(newHistory.slice(0, 100)));
    } catch {
      // ignore
    }
  };

  const handleAddHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    saveHistoryToStorage([newItem, ...history]);
  };

  const handleClearHistory = () => {
    saveHistoryToStorage([]);
  };

  const handleUpdateNote = (id: string, note: string) => {
    const updated = history.map((h) => (h.id === id ? { ...h, note } : h));
    saveHistoryToStorage(updated);
  };

  const handleSelectHistory = (item: HistoryItem) => {
    // Clean formatted commas and pass to calculator
    const clean = item.result.replace(/,/g, '');
    setExternalLoadValue(clean);
  };

  const handleSelectTheme = (t: ThemeId) => {
    setCurrentTheme(t);
    try {
      localStorage.setItem('omni_theme', t);
    } catch {
      // ignore
    }
  };

  const handleToggleSound = () => {
    const order: SoundEffect[] = ['mechanical', 'soft', 'beep', 'off'];
    const idx = order.indexOf(soundMode);
    const next = order[(idx + 1) % order.length];
    setSoundMode(next);
    try {
      localStorage.setItem('omni_sound', next);
    } catch {
      // ignore
    }
  };

  const theme = THEMES[currentTheme];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${theme.bgClass}`}>
      {/* Top Bar Contract Navbar */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={(mode) => {
          setCurrentMode(mode);
          setExternalLoadValue(undefined);
        }}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        soundMode={soundMode}
        onToggleSound={handleToggleSound}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Workspace Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-start">
        {/* Left / Center Area: Main Calculator View */}
        <div className="flex-1 w-full flex flex-col items-center">
          {currentMode === 'standard' && (
            <StandardCalculator
              theme={theme}
              soundMode={soundMode}
              onAddHistory={handleAddHistory}
              externalLoadValue={externalLoadValue}
            />
          )}

          {currentMode === 'scientific' && (
            <ScientificCalculator
              theme={theme}
              soundMode={soundMode}
              onAddHistory={handleAddHistory}
              externalLoadValue={externalLoadValue}
            />
          )}

          {currentMode === 'graphing' && (
            <GraphingCalculator theme={theme} />
          )}

          {currentMode === 'programmer' && (
            <ProgrammerCalculator
              theme={theme}
              soundMode={soundMode}
              onAddHistory={handleAddHistory}
            />
          )}

          {currentMode === 'converter' && (
            <ConverterCalculator theme={theme} />
          )}

          {currentMode === 'financial' && (
            <FinancialCalculator theme={theme} />
          )}
        </div>

        {/* Right Area: Collapsible Tape & History Workspace (desktop drawer / sidebar) */}
        <div
          className={`w-full lg:w-80 shrink-0 transition-all duration-200 ${
            isTapeSidebarOpen ? 'block' : 'hidden lg:block lg:w-12'
          }`}
        >
          {isTapeSidebarOpen ? (
            <div className="h-[520px] sticky top-24">
              <div className="relative h-full">
                <TapeHistory
                  history={history}
                  onSelectHistory={handleSelectHistory}
                  onClearHistory={handleClearHistory}
                  onUpdateNote={handleUpdateNote}
                  theme={theme}
                />
                <button
                  onClick={() => setIsTapeSidebarOpen(false)}
                  title="Collapse tape sidebar"
                  className="hidden lg:flex absolute -left-3 top-4 p-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsTapeSidebarOpen(true)}
              title="Expand calculation tape"
              className="hidden lg:flex flex-col items-center gap-2 p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer sticky top-24"
            >
              <ChevronLeft className="w-4 h-4" />
              <FileText className="w-4 h-4" />
              <span className="text-[11px] font-mono [writing-mode:vertical-rl] tracking-wider uppercase font-semibold">
                Tape ({history.length})
              </span>
            </button>
          )}
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="w-full border-t border-slate-800/60 py-4 px-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OmniCalc Pro · Precision Computing Suite</span>
          <span>Keyboard enabled · Web Audio Tactile Synthesis</span>
        </div>
      </footer>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
