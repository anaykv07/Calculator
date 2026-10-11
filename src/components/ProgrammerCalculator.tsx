import React, { useState, useCallback } from 'react';
import { BaseType, HistoryItem, SoundEffect, ThemeConfig, WordSize } from '../types/calculator';
import {
  bitRotateLeft,
  bitRotateRight,
  bitShiftLeft,
  bitShiftRight,
  formatBin,
  formatDec,
  formatHex,
  formatOct,
  getBitAt,
  maskToWord,
  toggleBitAt,
  WORD_SIZE_BITS,
} from '../utils/programmerEngine';
import { soundController } from '../utils/audioFeedback';
import { Delete, Copy, Check } from 'lucide-react';

interface ProgrammerCalculatorProps {
  theme: ThemeConfig;
  soundMode: SoundEffect;
  onAddHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
}

type BitOp = 'AND' | 'OR' | 'XOR' | 'NAND' | 'NOR' | 'LSH' | 'RSH';

export const ProgrammerCalculator: React.FC<ProgrammerCalculatorProps> = ({
  theme,
  soundMode,
  onAddHistory,
}) => {
  const [currentValue, setCurrentValue] = useState<bigint>(0n);
  const [pendingValue, setPendingValue] = useState<bigint | null>(null);
  const [pendingOp, setPendingOp] = useState<BitOp | null>(null);
  const [activeBase, setActiveBase] = useState<BaseType>('DEC');
  const [wordSize, setWordSize] = useState<WordSize>('QWORD');
  const [isSigned, setIsSigned] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const playClick = useCallback(() => {
    soundController.playKeySound(soundMode);
  }, [soundMode]);

  const maxBits = WORD_SIZE_BITS[wordSize];

  const inputDigit = (digit: string) => {
    playClick();
    let baseRadix = 10;
    if (activeBase === 'HEX') baseRadix = 16;
    if (activeBase === 'OCT') baseRadix = 8;
    if (activeBase === 'BIN') baseRadix = 2;

    const parsedVal = parseInt(digit, baseRadix);
    if (isNaN(parsedVal)) return;

    const baseBig = BigInt(baseRadix);
    const newVal = currentValue * baseBig + BigInt(parsedVal);
    setCurrentValue(maskToWord(newVal, wordSize));
  };

  const backspace = () => {
    playClick();
    let baseRadix = 10;
    if (activeBase === 'HEX') baseRadix = 16;
    if (activeBase === 'OCT') baseRadix = 8;
    if (activeBase === 'BIN') baseRadix = 2;

    const baseBig = BigInt(baseRadix);
    const newVal = currentValue / baseBig;
    setCurrentValue(maskToWord(newVal, wordSize));
  };

  const clearAll = () => {
    playClick();
    setCurrentValue(0n);
    setPendingValue(null);
    setPendingOp(null);
  };

  const toggleBit = (idx: number) => {
    playClick();
    if (idx >= maxBits) return;
    const toggled = toggleBitAt(currentValue, idx, wordSize);
    setCurrentValue(toggled);
  };

  const performBitwiseOp = (op: BitOp) => {
    playClick();
    setPendingValue(currentValue);
    setPendingOp(op);
    setCurrentValue(0n);
  };

  const performBitNot = () => {
    playClick();
    const inverted = maskToWord(~currentValue, wordSize);
    onAddHistory({
      expression: `NOT (${currentValue.toString(10)})`,
      result: inverted.toString(10),
      mode: 'programmer',
    });
    setCurrentValue(inverted);
  };

  const performRotate = (dir: 'left' | 'right') => {
    playClick();
    const rotated = dir === 'left' ? bitRotateLeft(currentValue, 1, wordSize) : bitRotateRight(currentValue, 1, wordSize);
    setCurrentValue(rotated);
  };

  const performEquals = () => {
    playClick();
    if (pendingValue === null || pendingOp === null) return;

    let res = 0n;
    switch (pendingOp) {
      case 'AND':
        res = pendingValue & currentValue;
        break;
      case 'OR':
        res = pendingValue | currentValue;
        break;
      case 'XOR':
        res = pendingValue ^ currentValue;
        break;
      case 'NAND':
        res = ~(pendingValue & currentValue);
        break;
      case 'NOR':
        res = ~(pendingValue | currentValue);
        break;
      case 'LSH':
        res = bitShiftLeft(pendingValue, Number(currentValue), wordSize);
        break;
      case 'RSH':
        res = bitShiftRight(pendingValue, Number(currentValue), wordSize);
        break;
    }

    const masked = maskToWord(res, wordSize);
    onAddHistory({
      expression: `${pendingValue.toString(10)} ${pendingOp} ${currentValue.toString(10)}`,
      result: masked.toString(10),
      mode: 'programmer',
    });

    setCurrentValue(masked);
    setPendingValue(null);
    setPendingOp(null);
  };

  const copyCurrent = () => {
    let text = '';
    if (activeBase === 'HEX') text = formatHex(currentValue, wordSize).replace(/\s/g, '');
    else if (activeBase === 'DEC') text = formatDec(currentValue, wordSize, isSigned);
    else if (activeBase === 'OCT') text = formatOct(currentValue, wordSize);
    else text = formatBin(currentValue, wordSize).replace(/\s/g, '');

    navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 1500);
  };

  // Base key validity checker
  const isKeyValid = (keyChar: string): boolean => {
    const hexChars = ['A', 'B', 'C', 'D', 'E', 'F'];
    if (hexChars.includes(keyChar)) {
      return activeBase === 'HEX';
    }
    const val = parseInt(keyChar, 10);
    if (isNaN(val)) return false;

    if (activeBase === 'BIN') return val <= 1;
    if (activeBase === 'OCT') return val <= 7;
    return true; // DEC & HEX allow 0-9
  };

  return (
    <div className={`w-full max-w-3xl mx-auto p-4 sm:p-6 rounded-2xl ${theme.cardClass}`}>
      {/* Top Configuration Bar: Word Size & Signed/Unsigned */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          {(['QWORD', 'DWORD', 'WORD', 'BYTE'] as WordSize[]).map((size) => (
            <button
              key={size}
              onClick={() => {
                playClick();
                setWordSize(size);
                setCurrentValue((prev) => maskToWord(prev, size));
              }}
              className={`px-3 py-1 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
                wordSize === size
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {size} ({WORD_SIZE_BITS[size]}b)
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playClick();
              setIsSigned(!isSigned);
            }}
            className={`px-3 py-1 text-xs font-mono rounded-xl border transition-colors cursor-pointer ${
              isSigned
                ? 'bg-slate-800 text-cyan-300 border-cyan-800'
                : 'bg-slate-900/60 text-slate-400 border-slate-800'
            }`}
          >
            {isSigned ? 'Signed' : 'Unsigned'}
          </button>

          <button
            onClick={copyCurrent}
            className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
            title="Copy value"
          >
            {hasCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Live Base Representation Matrix */}
      <div className="space-y-1.5 mb-4">
        {(['HEX', 'DEC', 'OCT', 'BIN'] as BaseType[]).map((b) => {
          const isActive = activeBase === b;
          let valStr = '';
          if (b === 'HEX') valStr = formatHex(currentValue, wordSize);
          else if (b === 'DEC') valStr = formatDec(currentValue, wordSize, isSigned);
          else if (b === 'OCT') valStr = formatOct(currentValue, wordSize);
          else valStr = formatBin(currentValue, wordSize);

          return (
            <div
              key={b}
              onClick={() => {
                playClick();
                setActiveBase(b);
              }}
              className={`flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all cursor-pointer font-mono text-sm ${
                isActive
                  ? 'bg-cyan-950/40 border border-cyan-800/60 text-white shadow-sm'
                  : 'bg-slate-950/40 border border-slate-800/60 text-slate-400 hover:bg-slate-900/60 hover:text-slate-300'
              }`}
            >
              <span className={`w-8 font-bold text-xs ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                {b}
              </span>
              <span className="flex-1 font-mono tracking-wider tabular-nums overflow-x-auto select-all">
                {valStr}
              </span>
            </div>
          );
        })}
      </div>

      {/* Interactive 64-bit Bitboard Grid */}
      <div className="mb-4 p-3 bg-slate-950/70 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
          <span>64-Bit Interactive Bit Matrix</span>
          <span className="text-cyan-400">Click any bit to toggle</span>
        </div>

        {/* Render 2 rows of 32 bits (or 4 rows of 16 bits for great readability) */}
        <div className="space-y-2">
          {[0, 1].map((rowIdx) => {
            const startBit = 63 - rowIdx * 32;
            const endBit = startBit - 31;
            const bits: number[] = [];
            for (let b = startBit; b >= endBit; b--) {
              bits.push(b);
            }

            return (
              <div key={rowIdx} className="space-y-1">
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 px-0.5">
                  <span>bit {startBit}</span>
                  <span>bit {endBit}</span>
                </div>
                <div className="grid grid-cols-16 sm:grid-cols-32 gap-1">
                  {bits.map((bitNum) => {
                    const isEnabled = bitNum < maxBits;
                    const val = isEnabled ? getBitAt(currentValue, bitNum) : 0;

                    return (
                      <button
                        key={bitNum}
                        disabled={!isEnabled}
                        onClick={() => toggleBit(bitNum)}
                        title={`Bit ${bitNum}: ${val}`}
                        className={`h-6 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                          !isEnabled
                            ? 'opacity-20 bg-slate-900 text-slate-600 cursor-not-allowed'
                            : val === 1
                            ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-900/50'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operator and Keypad Grid */}
      <div className="grid grid-cols-6 gap-2">
        {/* Row 1: Bitwise logic */}
        <button
          onClick={() => performBitwiseOp('AND')}
          className={`h-11 rounded-xl text-xs font-mono font-semibold transition-all active:scale-95 cursor-pointer ${
            pendingOp === 'AND' ? 'bg-cyan-600 text-white font-bold' : theme.funcKeyClass
          }`}
        >
          AND
        </button>
        <button
          onClick={() => performBitwiseOp('OR')}
          className={`h-11 rounded-xl text-xs font-mono font-semibold transition-all active:scale-95 cursor-pointer ${
            pendingOp === 'OR' ? 'bg-cyan-600 text-white font-bold' : theme.funcKeyClass
          }`}
        >
          OR
        </button>
        <button
          onClick={() => performBitwiseOp('XOR')}
          className={`h-11 rounded-xl text-xs font-mono font-semibold transition-all active:scale-95 cursor-pointer ${
            pendingOp === 'XOR' ? 'bg-cyan-600 text-white font-bold' : theme.funcKeyClass
          }`}
        >
          XOR
        </button>
        <button
          onClick={performBitNot}
          className={`h-11 rounded-xl text-xs font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          NOT
        </button>
        <button
          onClick={() => performBitwiseOp('NAND')}
          className={`h-11 rounded-xl text-xs font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          NAND
        </button>
        <button
          onClick={() => performBitwiseOp('NOR')}
          className={`h-11 rounded-xl text-xs font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          NOR
        </button>

        {/* Row 2: Shifts & Hex A B */}
        <button
          onClick={() => performBitwiseOp('LSH')}
          className={`h-11 rounded-xl text-xs font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          &lt;&lt; LSH
        </button>
        <button
          onClick={() => performBitwiseOp('RSH')}
          className={`h-11 rounded-xl text-xs font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          &gt;&gt; RSH
        </button>
        <button
          onClick={() => performRotate('left')}
          className={`h-11 rounded-xl text-xs font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          RoL
        </button>
        <button
          onClick={() => performRotate('right')}
          className={`h-11 rounded-xl text-xs font-mono font-semibold transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          RoR
        </button>
        <button
          disabled={!isKeyValid('A')}
          onClick={() => inputDigit('A')}
          className={`h-11 rounded-xl font-mono text-sm font-bold transition-all active:scale-95 cursor-pointer ${
            !isKeyValid('A') ? 'opacity-30 cursor-not-allowed' : theme.funcKeyClass
          }`}
        >
          A
        </button>
        <button
          disabled={!isKeyValid('B')}
          onClick={() => inputDigit('B')}
          className={`h-11 rounded-xl font-mono text-sm font-bold transition-all active:scale-95 cursor-pointer ${
            !isKeyValid('B') ? 'opacity-30 cursor-not-allowed' : theme.funcKeyClass
          }`}
        >
          B
        </button>

        {/* Row 3: Hex C D + 7 8 9 */}
        <button
          disabled={!isKeyValid('C')}
          onClick={() => inputDigit('C')}
          className={`h-11 rounded-xl font-mono text-sm font-bold transition-all active:scale-95 cursor-pointer ${
            !isKeyValid('C') ? 'opacity-30 cursor-not-allowed' : theme.funcKeyClass
          }`}
        >
          C
        </button>
        <button
          disabled={!isKeyValid('D')}
          onClick={() => inputDigit('D')}
          className={`h-11 rounded-xl font-mono text-sm font-bold transition-all active:scale-95 cursor-pointer ${
            !isKeyValid('D') ? 'opacity-30 cursor-not-allowed' : theme.funcKeyClass
          }`}
        >
          D
        </button>
        <button
          disabled={!isKeyValid('7')}
          onClick={() => inputDigit('7')}
          className={`h-11 rounded-xl font-mono text-base font-semibold transition-all active:scale-95 cursor-pointer ${
            !isKeyValid('7') ? 'opacity-30 cursor-not-allowed' : theme.numKeyClass
          }`}
        >
          7
        </button>
        <button
          disabled={!isKeyValid('8')}
          onClick={() => inputDigit('8')}
          className={`h-11 rounded-xl font-mono text-base font-semibold transition-all active:scale-95 cursor-pointer ${
            !isKeyValid('8') ? 'opacity-30 cursor-not-allowed' : theme.numKeyClass
          }`}
        >
          8
        </button>
        <button
          disabled={!isKeyValid('9')}
          onClick={() => inputDigit('9')}
          className={`h-11 rounded-xl font-mono text-base font-semibold transition-all active:scale-95 cursor-pointer ${
            !isKeyValid('9') ? 'opacity-30 cursor-not-allowed' : theme.numKeyClass
          }`}
        >
          9
        </button>
        <button
          onClick={clearAll}
          className={`h-11 rounded-xl font-mono text-sm font-bold text-rose-400 transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
        >
          AC
        </button>

        {/* Row 4: Hex E F + 4 5 6 */}
        <button
          disabled={!isKeyValid('E')}
          onClick={() => inputDigit('E')}
          className={`h-11 rounded-xl font-mono text-sm font-bold transition-all active:scale-95 cursor-pointer ${
            !isKeyValid('E') ? 'opacity-30 cursor-not-allowed' : theme.funcKeyClass
          }`}
        >
          E
        </button>
        <button
          disabled={!isKeyValid('F')}
          onClick={() => inputDigit('F')}
          className={`h-11 rounded-xl font-mono text-sm font-bold transition-all active:scale-95 cursor-pointer ${
            !isKeyValid('F') ? 'opacity-30 cursor-not-allowed' : theme.funcKeyClass
          }`}
        >
          F
        </button>
        <button
          disabled={!isKeyValid('4')}
          onClick={() => inputDigit('4')}
          className={`h-11 rounded-xl font-mono text-base font-semibold transition-all active:scale-95 cursor-pointer ${
            !isKeyValid('4') ? 'opacity-30 cursor-not-allowed' : theme.numKeyClass
          }`}
        >
          4
        </button>
        <button
          disabled={!isKeyValid('5')}
          onClick={() => inputDigit('5')}
          className={`h-11 rounded-xl font-mono text-base font-semibold transition-all active:scale-95 cursor-pointer ${
            !isKeyValid('5') ? 'opacity-30 cursor-not-allowed' : theme.numKeyClass
          }`}
        >
          5
        </button>
        <button
          disabled={!isKeyValid('6')}
          onClick={() => inputDigit('6')}
          className={`h-11 rounded-xl font-mono text-base font-semibold transition-all active:scale-95 cursor-pointer ${
            !isKeyValid('6') ? 'opacity-30 cursor-not-allowed' : theme.numKeyClass
          }`}
        >
          6
        </button>
        <button
          onClick={backspace}
          className={`h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer ${theme.funcKeyClass}`}
          title="Backspace"
        >
          <Delete className="w-4 h-4" />
        </button>

        {/* Row 5: 1 2 3 0 and Equals */}
        <button
          disabled={!isKeyValid('1')}
          onClick={() => inputDigit('1')}
          className={`h-11 rounded-xl font-mono text-base font-semibold transition-all active:scale-95 cursor-pointer ${
            !isKeyValid('1') ? 'opacity-30 cursor-not-allowed' : theme.numKeyClass
          }`}
        >
          1
        </button>
        <button
          disabled={!isKeyValid('2')}
          onClick={() => inputDigit('2')}
          className={`h-11 rounded-xl font-mono text-base font-semibold transition-all active:scale-95 cursor-pointer ${
            !isKeyValid('2') ? 'opacity-30 cursor-not-allowed' : theme.numKeyClass
          }`}
        >
          2
        </button>
        <button
          disabled={!isKeyValid('3')}
          onClick={() => inputDigit('3')}
          className={`h-11 rounded-xl font-mono text-base font-semibold transition-all active:scale-95 cursor-pointer ${
            !isKeyValid('3') ? 'opacity-30 cursor-not-allowed' : theme.numKeyClass
          }`}
        >
          3
        </button>
        <button
          disabled={!isKeyValid('0')}
          onClick={() => inputDigit('0')}
          className={`h-11 rounded-xl font-mono text-base font-semibold transition-all active:scale-95 cursor-pointer col-span-2 ${
            !isKeyValid('0') ? 'opacity-30 cursor-not-allowed' : theme.numKeyClass
          }`}
        >
          0
        </button>
        <button
          onClick={performEquals}
          className={`h-11 rounded-xl font-mono text-lg font-bold transition-all active:scale-95 cursor-pointer ${theme.accentKeyClass}`}
        >
          =
        </button>
      </div>
    </div>
  );
};
