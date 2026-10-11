import React, { useState, useEffect, useCallback } from 'react';
import { HistoryItem, SoundEffect, ThemeConfig } from '../types/calculator';
import { evaluateMathExpression, formatResultNumber } from '../utils/mathEngine';
import { soundController } from '../utils/audioFeedback';
import { Delete, Copy, Check } from 'lucide-react';

interface StandardCalculatorProps {
  theme: ThemeConfig;
  soundMode: SoundEffect;
  onAddHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  externalLoadValue?: string;
}

export const StandardCalculator: React.FC<StandardCalculatorProps> = ({
  theme,
  soundMode,
  onAddHistory,
  externalLoadValue,
}) => {
  const [displayValue, setDisplayValue] = useState('0');
  const [expression, setExpression] = useState('');
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [memoryValue, setMemoryValue] = useState<number>(0);
  const [hasCopied, setHasCopied] = useState(false);

  // Sync external loaded value from history
  useEffect(() => {
    if (externalLoadValue) {
      setDisplayValue(externalLoadValue);
      setWaitingForOperand(false);
    }
  }, [externalLoadValue]);

  const playClick = useCallback(() => {
    soundController.playKeySound(soundMode);
  }, [soundMode]);

  const inputDigit = useCallback((digit: string) => {
    playClick();
    if (waitingForOperand) {
      setDisplayValue(digit);
      setWaitingForOperand(false);
    } else {
      if (displayValue === '0' && digit !== '.') {
        setDisplayValue(digit);
      } else {
        if (digit === '.' && displayValue.includes('.')) return;
        if (displayValue.length >= 16) return;
        setDisplayValue(displayValue + digit);
      }
    }
  }, [displayValue, waitingForOperand, playClick]);

  const inputDecimal = useCallback(() => {
    playClick();
    if (waitingForOperand) {
      setDisplayValue('0.');
      setWaitingForOperand(false);
    } else if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  }, [displayValue, waitingForOperand, playClick]);

  const clearAll = useCallback(() => {
    playClick();
    setDisplayValue('0');
    setExpression('');
    setWaitingForOperand(false);
  }, [playClick]);

  const clearEntry = useCallback(() => {
    playClick();
    setDisplayValue('0');
  }, [playClick]);

  const backspace = useCallback(() => {
    playClick();
    if (waitingForOperand) return;
    if (displayValue.length > 1) {
      setDisplayValue(displayValue.slice(0, -1));
    } else {
      setDisplayValue('0');
    }
  }, [displayValue, waitingForOperand, playClick]);

  const toggleSign = useCallback(() => {
    playClick();
    const val = parseFloat(displayValue);
    if (!isNaN(val)) {
      setDisplayValue((-val).toString());
    }
  }, [displayValue, playClick]);

  const inputPercent = useCallback(() => {
    playClick();
    const val = parseFloat(displayValue);
    if (!isNaN(val)) {
      const res = val / 100;
      setDisplayValue(res.toString());
      onAddHistory({
        expression: `${val}%`,
        result: res.toString(),
        mode: 'standard',
      });
    }
  }, [displayValue, onAddHistory, playClick]);

  // Single-number operations (x², √x, 1/x)
  const performUnary = useCallback((op: 'sqr' | 'sqrt' | 'recip') => {
    playClick();
    const val = parseFloat(displayValue);
    if (isNaN(val)) return;

    let res = 0;
    let exprText = '';

    if (op === 'sqr') {
      res = val * val;
      exprText = `sqr(${val})`;
    } else if (op === 'sqrt') {
      if (val < 0) {
        setDisplayValue('Error');
        return;
      }
      res = Math.sqrt(val);
      exprText = `√(${val})`;
    } else if (op === 'recip') {
      if (val === 0) {
        setDisplayValue('Error');
        return;
      }
      res = 1 / val;
      exprText = `1/(${val})`;
    }

    const formatted = formatResultNumber(res);
    setDisplayValue(formatted);
    setWaitingForOperand(true);
    onAddHistory({
      expression: exprText,
      result: formatted,
      mode: 'standard',
    });
  }, [displayValue, onAddHistory, playClick]);

  // Operator (+, -, *, /)
  const performOperation = useCallback((nextOp: string) => {
    playClick();
    const currentNum = displayValue;

    if (expression && !waitingForOperand) {
      // Evaluate previous chain
      const fullExpr = `${expression} ${currentNum}`;
      const evalRes = evaluateMathExpression(fullExpr);
      if (evalRes.success) {
        setDisplayValue(evalRes.formatted);
        setExpression(`${evalRes.formatted} ${nextOp}`);
        onAddHistory({
          expression: fullExpr,
          result: evalRes.formatted,
          mode: 'standard',
        });
      } else {
        setDisplayValue('Error');
        setExpression('');
      }
    } else {
      setExpression(`${currentNum} ${nextOp}`);
    }

    setWaitingForOperand(true);
  }, [displayValue, expression, waitingForOperand, onAddHistory, playClick]);

  // Equals (=)
  const performEquals = useCallback(() => {
    playClick();
    if (!expression) return;

    const fullExpr = `${expression} ${displayValue}`;
    const evalRes = evaluateMathExpression(fullExpr);

    if (evalRes.success) {
      setDisplayValue(evalRes.formatted);
      setExpression('');
      setWaitingForOperand(true);
      onAddHistory({
        expression: fullExpr,
        result: evalRes.formatted,
        mode: 'standard',
      });
    } else {
      setDisplayValue(evalRes.error || 'Error');
      setExpression('');
    }
  }, [expression, displayValue, onAddHistory, playClick]);

  // Memory functions
  const memoryClear = () => {
    playClick();
    setMemoryValue(0);
  };
  const memoryRecall = () => {
    playClick();
    setDisplayValue(memoryValue.toString());
    setWaitingForOperand(true);
  };
  const memoryAdd = () => {
    playClick();
    setMemoryValue((prev) => prev + (parseFloat(displayValue) || 0));
  };
  const memorySubtract = () => {
    playClick();
    setMemoryValue((prev) => prev - (parseFloat(displayValue) || 0));
  };
  const memoryStore = () => {
    playClick();
    setMemoryValue(parseFloat(displayValue) || 0);
  };

  const copyDisplay = () => {
    navigator.clipboard.writeText(displayValue.replace(/,/g, ''));
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 1500);
  };

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid capturing when in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key >= '0' && e.key <= '9') {
        inputDigit(e.key);
      } else if (e.key === '.') {
        inputDecimal();
      } else if (e.key === '+') {
        performOperation('+');
      } else if (e.key === '-') {
        performOperation('-');
      } else if (e.key === '*') {
        performOperation('×');
      } else if (e.key === '/') {
        e.preventDefault();
        performOperation('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        performEquals();
      } else if (e.key === 'Backspace') {
        backspace();
      } else if (e.key === 'Escape') {
        clearAll();
      } else if (e.key === '%') {
        inputPercent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputDigit, inputDecimal, performOperation, performEquals, backspace, clearAll, inputPercent]);

  // Responsive font size for main display
  const getDisplayFontSize = (text: string) => {
    const len = text.length;
    if (len > 14) return 'text-2xl sm:text-3xl';
    if (len > 10) return 'text-3xl sm:text-4xl';
    return 'text-4xl sm:text-5xl';
  };

  return (
    <div className={`w-full max-w-md mx-auto p-4 sm:p-6 rounded-2xl ${theme.cardClass}`}>
      {/* Display Screen */}
      <div className={`p-4 rounded-xl mb-4 relative flex flex-col justify-end min-h-[110px] ${theme.displayBgClass} shadow-inner`}>
        {/* Memory Badge */}
        {memoryValue !== 0 && (
          <span className="absolute top-2.5 left-3 text-[10px] font-mono font-bold tracking-wider text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
            M = {formatResultNumber(memoryValue)}
          </span>
        )}

        {/* Copy button */}
        <button
          onClick={copyDisplay}
          title="Copy to clipboard"
          className="absolute top-2.5 right-3 p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        {/* Top Expression line */}
        <div className="text-right text-xs sm:text-sm font-mono text-slate-400 h-5 overflow-hidden text-ellipsis whitespace-nowrap mb-1">
          {expression || '\u00A0'}
        </div>

        {/* Main Display value */}
        <div className={`text-right font-mono font-bold tracking-tight text-white ${getDisplayFontSize(displayValue)} select-all break-all`}>
          {displayValue}
        </div>
      </div>

      {/* Memory Bar */}
      <div className="grid grid-cols-5 gap-1.5 mb-3 text-xs font-mono font-semibold">
        <button
          onClick={memoryClear}
          disabled={memoryValue === 0}
          className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
            memoryValue === 0
              ? 'opacity-30 cursor-not-allowed text-slate-500'
              : 'hover:bg-slate-800/80 text-slate-300'
          }`}
        >
          MC
        </button>
        <button
          onClick={memoryRecall}
          disabled={memoryValue === 0}
          className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
            memoryValue === 0
              ? 'opacity-30 cursor-not-allowed text-slate-500'
              : 'hover:bg-slate-800/80 text-slate-300 font-bold'
          }`}
        >
          MR
        </button>
        <button
          onClick={memoryAdd}
          className="py-1.5 rounded-lg hover:bg-slate-800/80 text-slate-300 transition-colors cursor-pointer"
        >
          M+
        </button>
        <button
          onClick={memorySubtract}
          className="py-1.5 rounded-lg hover:bg-slate-800/80 text-slate-300 transition-colors cursor-pointer"
        >
          M-
        </button>
        <button
          onClick={memoryStore}
          className="py-1.5 rounded-lg hover:bg-slate-800/80 text-slate-300 transition-colors cursor-pointer"
        >
          MS
        </button>
      </div>

      {/* Main Keypad Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1: Function row */}
        <button
          onClick={inputPercent}
          className={`h-12 sm:h-13 rounded-xl font-mono text-sm font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          %
        </button>
        <button
          onClick={clearEntry}
          className={`h-12 sm:h-13 rounded-xl font-mono text-sm font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          CE
        </button>
        <button
          onClick={clearAll}
          className={`h-12 sm:h-13 rounded-xl font-mono text-sm font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          C
        </button>
        <button
          onClick={backspace}
          className={`h-12 sm:h-13 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
          title="Backspace"
        >
          <Delete className="w-4 h-4" />
        </button>

        {/* Row 2: Secondary math */}
        <button
          onClick={() => performUnary('recip')}
          className={`h-12 sm:h-13 rounded-xl font-mono text-sm font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          1/x
        </button>
        <button
          onClick={() => performUnary('sqr')}
          className={`h-12 sm:h-13 rounded-xl font-mono text-sm font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          x²
        </button>
        <button
          onClick={() => performUnary('sqrt')}
          className={`h-12 sm:h-13 rounded-xl font-mono text-sm font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          √x
        </button>
        <button
          onClick={() => performOperation('÷')}
          className={`h-12 sm:h-13 rounded-xl font-mono text-lg font-bold transition-all active:scale-95 cursor-pointer ${theme.opKeyClass}`}
        >
          ÷
        </button>

        {/* Row 3: 7 8 9 × */}
        <button
          onClick={() => inputDigit('7')}
          className={`h-12 sm:h-13 rounded-xl font-mono text-lg font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          7
        </button>
        <button
          onClick={() => inputDigit('8')}
          className={`h-12 sm:h-13 rounded-xl font-mono text-lg font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          8
        </button>
        <button
          onClick={() => inputDigit('9')}
          className={`h-12 sm:h-13 rounded-xl font-mono text-lg font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          9
        </button>
        <button
          onClick={() => performOperation('×')}
          className={`h-12 sm:h-13 rounded-xl font-mono text-lg font-bold transition-all active:scale-95 cursor-pointer ${theme.opKeyClass}`}
        >
          ×
        </button>

        {/* Row 4: 4 5 6 - */}
        <button
          onClick={() => inputDigit('4')}
          className={`h-12 sm:h-13 rounded-xl font-mono text-lg font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          4
        </button>
        <button
          onClick={() => inputDigit('5')}
          className={`h-12 sm:h-13 rounded-xl font-mono text-lg font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          5
        </button>
        <button
          onClick={() => inputDigit('6')}
          className={`h-12 sm:h-13 rounded-xl font-mono text-lg font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          6
        </button>
        <button
          onClick={() => performOperation('-')}
          className={`h-12 sm:h-13 rounded-xl font-mono text-lg font-bold transition-all active:scale-95 cursor-pointer ${theme.opKeyClass}`}
        >
          −
        </button>

        {/* Row 5: 1 2 3 + */}
        <button
          onClick={() => inputDigit('1')}
          className={`h-12 sm:h-13 rounded-xl font-mono text-lg font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          1
        </button>
        <button
          onClick={() => inputDigit('2')}
          className={`h-12 sm:h-13 rounded-xl font-mono text-lg font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          2
        </button>
        <button
          onClick={() => inputDigit('3')}
          className={`h-12 sm:h-13 rounded-xl font-mono text-lg font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          3
        </button>
        <button
          onClick={() => performOperation('+')}
          className={`h-12 sm:h-13 rounded-xl font-mono text-lg font-bold transition-all active:scale-95 cursor-pointer ${theme.opKeyClass}`}
        >
          +
        </button>

        {/* Row 6: +/- 0 . = */}
        <button
          onClick={toggleSign}
          className={`h-12 sm:h-13 rounded-xl font-mono text-base font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          +/−
        </button>
        <button
          onClick={() => inputDigit('0')}
          className={`h-12 sm:h-13 rounded-xl font-mono text-lg font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          0
        </button>
        <button
          onClick={inputDecimal}
          className={`h-12 sm:h-13 rounded-xl font-mono text-lg font-semibold transition-all active:scale-95 cursor-pointer ${theme.numKeyClass}`}
        >
          .
        </button>
        <button
          onClick={performEquals}
          className={`h-12 sm:h-13 rounded-xl font-mono text-xl font-bold transition-all active:scale-95 cursor-pointer ${theme.accentKeyClass}`}
        >
          =
        </button>
      </div>
    </div>
  );
};
