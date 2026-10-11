import React, { useState, useEffect, useCallback } from 'react';
import { AngleMode, HistoryItem, SoundEffect, ThemeConfig } from '../types/calculator';
import { evaluateMathExpression } from '../utils/mathEngine';
import { soundController } from '../utils/audioFeedback';
import { Delete, Copy, Check, RotateCcw } from 'lucide-react';

interface ScientificCalculatorProps {
  theme: ThemeConfig;
  soundMode: SoundEffect;
  onAddHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  externalLoadValue?: string;
}

export const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({
  theme,
  soundMode,
  onAddHistory,
  externalLoadValue,
}) => {
  const [expression, setExpression] = useState('');
  const [angleMode, setAngleMode] = useState<AngleMode>('DEG');
  const [isSecondFunction, setIsSecondFunction] = useState(false);
  const [isHyperbolic, setIsHyperbolic] = useState(false);
  const [previewResult, setPreviewResult] = useState<string>('');
  const [hasCopied, setHasCopied] = useState(false);

  const playClick = useCallback(() => {
    soundController.playKeySound(soundMode);
  }, [soundMode]);

  // Sync external loaded value from history
  useEffect(() => {
    if (externalLoadValue) {
      setExpression(externalLoadValue);
    }
  }, [externalLoadValue]);

  // Compute live preview whenever expression changes
  useEffect(() => {
    if (!expression.trim()) {
      setPreviewResult('');
      return;
    }
    // Attempt evaluation
    const res = evaluateMathExpression(expression, angleMode);
    if (res.success && !isNaN(res.value)) {
      setPreviewResult(res.formatted);
    } else {
      setPreviewResult('');
    }
  }, [expression, angleMode]);

  const insertText = useCallback((txt: string) => {
    playClick();
    setExpression((prev) => prev + txt);
  }, [playClick]);

  const clearAll = useCallback(() => {
    playClick();
    setExpression('');
    setPreviewResult('');
  }, [playClick]);

  const backspace = useCallback(() => {
    playClick();
    setExpression((prev) => prev.slice(0, -1));
  }, [playClick]);

  const toggleAngleMode = useCallback(() => {
    playClick();
    setAngleMode((prev) => (prev === 'DEG' ? 'RAD' : 'DEG'));
  }, [playClick]);

  const performEquals = useCallback(() => {
    playClick();
    if (!expression.trim()) return;

    const res = evaluateMathExpression(expression, angleMode);
    if (res.success) {
      onAddHistory({
        expression,
        result: res.formatted,
        mode: 'scientific',
      });
      setExpression(res.formatted);
    } else {
      setPreviewResult(res.error || 'Syntax Error');
    }
  }, [expression, angleMode, onAddHistory, playClick]);

  const copyResult = () => {
    const valToCopy = previewResult || expression;
    navigator.clipboard.writeText(valToCopy.replace(/,/g, ''));
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 1500);
  };

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key >= '0' && e.key <= '9') {
        insertText(e.key);
      } else if (e.key === '.') {
        insertText('.');
      } else if (e.key === '+') {
        insertText('+');
      } else if (e.key === '-') {
        insertText('-');
      } else if (e.key === '*') {
        insertText('×');
      } else if (e.key === '/') {
        e.preventDefault();
        insertText('÷');
      } else if (e.key === '(' || e.key === ')') {
        insertText(e.key);
      } else if (e.key === '^') {
        insertText('^');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        performEquals();
      } else if (e.key === 'Backspace') {
        backspace();
      } else if (e.key === 'Escape') {
        clearAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [insertText, performEquals, backspace, clearAll]);

  return (
    <div className={`w-full max-w-2xl mx-auto p-4 sm:p-6 rounded-2xl ${theme.cardClass}`}>
      {/* Display Screen */}
      <div className={`p-4 rounded-xl mb-4 relative flex flex-col justify-between min-h-[120px] ${theme.displayBgClass} shadow-inner`}>
        {/* Top Controls on Display */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleAngleMode}
              className="px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider bg-slate-800/90 text-cyan-400 border border-slate-700 hover:bg-slate-700/80 transition-colors cursor-pointer"
            >
              {angleMode}
            </button>
            {isSecondFunction && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                2ND
              </span>
            )}
            {isHyperbolic && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                HYP
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={copyResult}
              title="Copy result"
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Live Expression */}
        <div className="w-full text-right font-mono text-xl sm:text-2xl font-medium tracking-tight text-white select-all break-all overflow-x-auto my-2 py-1">
          {expression || '0'}
        </div>

        {/* Live Preview / Result */}
        <div className="text-right text-xs sm:text-sm font-mono text-cyan-400 font-semibold h-5">
          {previewResult ? `= ${previewResult}` : '\u00A0'}
        </div>
      </div>

      {/* Function and Scientific Matrix Keypad */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {/* Row 1: Function toggles & Brackets */}
        <button
          onClick={() => {
            playClick();
            setIsSecondFunction(!isSecondFunction);
          }}
          className={`h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all active:scale-95 cursor-pointer ${
            isSecondFunction
              ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/50'
              : theme.funcKeyClass
          }`}
        >
          2nd
        </button>
        <button
          onClick={() => {
            playClick();
            setIsHyperbolic(!isHyperbolic);
          }}
          className={`h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all active:scale-95 cursor-pointer ${
            isHyperbolic
              ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-900/50'
              : theme.funcKeyClass
          }`}
        >
          hyp
        </button>
        <button
          onClick={() => insertText('(')}
          className={`h-11 sm:h-12 rounded-xl text-sm font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          (
        </button>
        <button
          onClick={() => insertText(')')}
          className={`h-11 sm:h-12 rounded-xl text-sm font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          )
        </button>
        <button
          onClick={clearAll}
          className={`h-11 sm:h-12 rounded-xl text-sm font-mono font-bold text-rose-400 transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          AC
        </button>

        {/* Row 2: Trig Functions */}
        <button
          onClick={() => {
            if (isHyperbolic) {
              insertText('sinh(');
            } else if (isSecondFunction) {
              insertText('asin(');
            } else {
              insertText('sin(');
            }
          }}
          className={`h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          {isHyperbolic ? 'sinh' : isSecondFunction ? 'sin⁻¹' : 'sin'}
        </button>
        <button
          onClick={() => {
            if (isHyperbolic) {
              insertText('cosh(');
            } else if (isSecondFunction) {
              insertText('acos(');
            } else {
              insertText('cos(');
            }
          }}
          className={`h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          {isHyperbolic ? 'cosh' : isSecondFunction ? 'cos⁻¹' : 'cos'}
        </button>
        <button
          onClick={() => {
            if (isHyperbolic) {
              insertText('tanh(');
            } else if (isSecondFunction) {
              insertText('atan(');
            } else {
              insertText('tan(');
            }
          }}
          className={`h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          {isHyperbolic ? 'tanh' : isSecondFunction ? 'tan⁻¹' : 'tan'}
        </button>
        <button
          onClick={() => insertText('π')}
          className={`h-11 sm:h-12 rounded-xl text-sm font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          π
        </button>
        <button
          onClick={backspace}
          className={`h-11 sm:h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
          title="Backspace"
        >
          <Delete className="w-4 h-4" />
        </button>

        {/* Row 3: Logarithms & Powers */}
        <button
          onClick={() => (isSecondFunction ? insertText('exp(') : insertText('ln('))}
          className={`h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          {isSecondFunction ? 'eˣ' : 'ln'}
        </button>
        <button
          onClick={() => (isSecondFunction ? insertText('10^') : insertText('log('))}
          className={`h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          {isSecondFunction ? '10ˣ' : 'log'}
        </button>
        <button
          onClick={() => (isSecondFunction ? insertText('cbrt(') : insertText('sqrt('))}
          className={`h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          {isSecondFunction ? '∛x' : '√x'}
        </button>
        <button
          onClick={() => insertText('^')}
          className={`h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          xʸ
        </button>
        <button
          onClick={() => insertText('÷')}
          className={`h-11 sm:h-12 rounded-xl text-lg font-mono font-bold transition-all active:scale-95 cursor-pointer ${theme.opKeyClass}`}
        >
          ÷
        </button>

        {/* Row 4: Factorial, Constants, 7 8 9 */}
        <button
          onClick={() => insertText('!')}
          className={`h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          n!
        </button>
        <button
          onClick={() => insertText('7')}
          className={`h-11 sm:h-12 rounded-xl text-lg font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          7
        </button>
        <button
          onClick={() => insertText('8')}
          className={`h-11 sm:h-12 rounded-xl text-lg font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          8
        </button>
        <button
          onClick={() => insertText('9')}
          className={`h-11 sm:h-12 rounded-xl text-lg font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          9
        </button>
        <button
          onClick={() => insertText('×')}
          className={`h-11 sm:h-12 rounded-xl text-lg font-mono font-bold transition-all active:scale-95 cursor-pointer ${theme.opKeyClass}`}
        >
          ×
        </button>

        {/* Row 5: 1/x, e, 4 5 6 */}
        <button
          onClick={() => insertText('e')}
          className={`h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          e
        </button>
        <button
          onClick={() => insertText('4')}
          className={`h-11 sm:h-12 rounded-xl text-lg font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          4
        </button>
        <button
          onClick={() => insertText('5')}
          className={`h-11 sm:h-12 rounded-xl text-lg font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          5
        </button>
        <button
          onClick={() => insertText('6')}
          className={`h-11 sm:h-12 rounded-xl text-lg font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          6
        </button>
        <button
          onClick={() => insertText('-')}
          className={`h-11 sm:h-12 rounded-xl text-lg font-mono font-bold transition-all active:scale-95 cursor-pointer ${theme.opKeyClass}`}
        >
          −
        </button>

        {/* Row 6: |x|, phi, 1 2 3 */}
        <button
          onClick={() => insertText('abs(')}
          className={`h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          |x|
        </button>
        <button
          onClick={() => insertText('1')}
          className={`h-11 sm:h-12 rounded-xl text-lg font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          1
        </button>
        <button
          onClick={() => insertText('2')}
          className={`h-11 sm:h-12 rounded-xl text-lg font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          2
        </button>
        <button
          onClick={() => insertText('3')}
          className={`h-11 sm:h-12 rounded-xl text-lg font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          3
        </button>
        <button
          onClick={() => insertText('+')}
          className={`h-11 sm:h-12 rounded-xl text-lg font-mono font-bold transition-all active:scale-95 cursor-pointer ${theme.opKeyClass}`}
        >
          +
        </button>

        {/* Row 7: phi, 0, ., % = */}
        <button
          onClick={() => insertText('phi')}
          className={`h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
          title="Golden Ratio (1.618...)"
        >
          φ
        </button>
        <button
          onClick={() => insertText('0')}
          className={`h-11 sm:h-12 rounded-xl text-lg font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          0
        </button>
        <button
          onClick={() => insertText('.')}
          className={`h-11 sm:h-12 rounded-xl text-lg font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          .
        </button>
        <button
          onClick={() => insertText('%')}
          className={`h-11 sm:h-12 rounded-xl text-base font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          %
        </button>
        <button
          onClick={performEquals}
          className={`h-11 sm:h-12 rounded-xl text-xl font-mono font-bold transition-all active:scale-95 cursor-pointer ${theme.accentKeyClass}`}
        >
          =
        </button>
      </div>
    </div>
  );
};
