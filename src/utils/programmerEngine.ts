import { WordSize } from '../types/calculator';

export const WORD_SIZE_BITS: Record<WordSize, number> = {
  QWORD: 64,
  DWORD: 32,
  WORD: 16,
  BYTE: 8,
};

export const WORD_SIZE_MASKS: Record<WordSize, bigint> = {
  QWORD: 0xFFFFFFFFFFFFFFFFn,
  DWORD: 0xFFFFFFFFn,
  WORD: 0xFFFFn,
  BYTE: 0xFFn,
};

export function maskToWord(val: bigint, size: WordSize): bigint {
  const mask = WORD_SIZE_MASKS[size];
  return val & mask;
}

export function toSigned(val: bigint, size: WordSize): bigint {
  const bits = BigInt(WORD_SIZE_BITS[size]);
  const masked = maskToWord(val, size);
  const signBit = 1n << (bits - 1n);

  if ((masked & signBit) !== 0n) {
    return masked - (1n << bits);
  }
  return masked;
}

export function formatHex(val: bigint, size: WordSize): string {
  const bits = WORD_SIZE_BITS[size];
  const hexDigits = bits / 4;
  const masked = maskToWord(val, size);
  const raw = masked.toString(16).toUpperCase().padStart(hexDigits, '0');
  // Group in 4s
  return raw.replace(/(.{4})(?=.)/g, '$1 ');
}

export function formatBin(val: bigint, size: WordSize): string {
  const bits = WORD_SIZE_BITS[size];
  const masked = maskToWord(val, size);
  const raw = masked.toString(2).padStart(bits, '0');
  // Group in nibbles (4 bits)
  return raw.replace(/(.{4})(?=.)/g, '$1 ');
}

export function formatOct(val: bigint, size: WordSize): string {
  const masked = maskToWord(val, size);
  return masked.toString(8);
}

export function formatDec(val: bigint, size: WordSize, signed: boolean): string {
  if (signed) {
    const s = toSigned(val, size);
    return s.toString(10);
  }
  const u = maskToWord(val, size);
  return u.toString(10);
}

// Convert bit at index (0 = LSB, 63 = MSB)
export function getBitAt(val: bigint, index: number): number {
  return Number((val >> BigInt(index)) & 1n);
}

export function toggleBitAt(val: bigint, index: number, size: WordSize): bigint {
  const mask = 1n << BigInt(index);
  const toggled = val ^ mask;
  return maskToWord(toggled, size);
}

// Bit shifts & rotates
export function bitShiftLeft(val: bigint, count: number, size: WordSize): bigint {
  return maskToWord(val << BigInt(count), size);
}

export function bitShiftRight(val: bigint, count: number, size: WordSize): bigint {
  return maskToWord(val >> BigInt(count), size);
}

export function bitRotateLeft(val: bigint, count: number, size: WordSize): bigint {
  const bits = BigInt(WORD_SIZE_BITS[size]);
  const c = BigInt(count) % bits;
  const masked = maskToWord(val, size);
  const rotated = (masked << c) | (masked >> (bits - c));
  return maskToWord(rotated, size);
}

export function bitRotateRight(val: bigint, count: number, size: WordSize): bigint {
  const bits = BigInt(WORD_SIZE_BITS[size]);
  const c = BigInt(count) % bits;
  const masked = maskToWord(val, size);
  const rotated = (masked >> c) | (masked << (bits - c));
  return maskToWord(rotated, size);
}
