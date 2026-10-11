import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      } else if (e.key === '?' && !isOpen && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        onClose(); // toggle
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: '0 – 9', desc: 'Enter numbers' },
    { key: '.', desc: 'Decimal point' },
    { key: '+  -  *  /', desc: 'Basic arithmetic operations (+, −, ×, ÷)' },
    { key: 'Enter  or  =', desc: 'Evaluate expression' },
    { key: 'Backspace', desc: 'Delete last character' },
    { key: 'Escape', desc: 'Clear All (AC)' },
    { key: '%', desc: 'Percentage calculation' },
    { key: '(  )', desc: 'Open / close parentheses (Scientific mode)' },
    { key: '^', desc: 'Power / exponent function' },
    { key: '?', desc: 'Toggle keyboard shortcuts guide' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-5 space-y-2.5 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between py-1.5 border-b border-slate-800/40 text-xs"
            >
              <span className="text-slate-400">{sc.desc}</span>
              <kbd className="px-2 py-1 bg-slate-950 border border-slate-700/80 rounded font-mono text-[11px] text-cyan-300 font-medium">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-950/60 border-t border-slate-800 text-center">
          <p className="text-[11px] font-mono text-slate-500">
            Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">Esc</kbd> anytime to dismiss
          </p>
        </div>
      </div>
    </div>
  );
};
