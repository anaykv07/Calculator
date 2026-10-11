export type CalculatorMode = 
  | 'standard' 
  | 'scientific' 
  | 'graphing' 
  | 'programmer' 
  | 'converter' 
  | 'financial';

export type ThemeId = 'obsidian' | 'swiss' | 'rams' | 'amber';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  bgClass: string;
  cardClass: string;
  keypadBgClass: string;
  numKeyClass: string;
  opKeyClass: string;
  accentKeyClass: string;
  funcKeyClass: string;
  displayBgClass: string;
  textPrimary: string;
  textSecondary: string;
  accentColor: string;
}

export type SoundEffect = 'mechanical' | 'soft' | 'beep' | 'off';

export interface HistoryItem {
  id: string;
  timestamp: number;
  expression: string;
  result: string;
  mode: CalculatorMode;
  note?: string;
}

export type AngleMode = 'DEG' | 'RAD';

export type WordSize = 'QWORD' | 'DWORD' | 'WORD' | 'BYTE'; // 64, 32, 16, 8 bits

export type BaseType = 'HEX' | 'DEC' | 'OCT' | 'BIN';

export type UnitCategory = 
  | 'length' 
  | 'mass' 
  | 'temperature' 
  | 'digital' 
  | 'area' 
  | 'volume' 
  | 'speed' 
  | 'time' 
  | 'energy' 
  | 'pressure';

export type FinanceTab = 'loan' | 'compound' | 'tip';
