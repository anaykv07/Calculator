import { AngleMode } from '../types/calculator';

export interface EvaluationResult {
  success: boolean;
  value: number;
  formatted: string;
  error?: string;
}

// Math constants
export const CONSTANTS: Record<string, { value: number; symbol: string; label: string; description: string }> = {
  pi: { value: Math.PI, symbol: 'π', label: 'Pi', description: 'Ratio of circumference to diameter (3.14159...)' },
  e: { value: Math.E, symbol: 'e', label: "Euler's Number", description: 'Base of natural logarithms (2.71828...)' },
  phi: { value: (1 + Math.sqrt(5)) / 2, symbol: 'φ', label: 'Golden Ratio', description: 'Divine proportion (1.61803...)' },
  c: { value: 299792458, symbol: 'c', label: 'Speed of Light', description: 'Vacuum speed of light (299,792,458 m/s)' },
  g: { value: 9.80665, symbol: 'g', label: 'Standard Gravity', description: 'Earth gravitational acceleration (9.80665 m/s²)' },
  h: { value: 6.62607015e-34, symbol: 'h', label: 'Planck Constant', description: 'Quantum of electromagnetic action' },
};

// Factorial helper
export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) throw new Error('Domain Error: Factorial requires non-negative integer');
  if (n > 170) return Infinity;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) {
    res *= i;
  }
  return res;
}

// Round floating precision issue (e.g. 0.1 + 0.2 = 0.3)
export function sanitizeFloat(num: number): number {
  if (Math.abs(num) < 1e-15) return 0;
  return parseFloat(num.toPrecision(12));
}

// Format numbers with thousands commas and neat decimals
export function formatResultNumber(num: number): string {
  if (isNaN(num)) return 'NaN';
  if (!isFinite(num)) return num > 0 ? 'Infinity' : '-Infinity';

  const absNum = Math.abs(num);
  if (absNum > 0 && (absNum >= 1e12 || absNum < 1e-7)) {
    return num.toExponential(6).replace('e+', 'e+');
  }

  const clean = sanitizeFloat(num);
  const parts = clean.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

// Tokenize and evaluate expressions
type TokenType = 'NUMBER' | 'OP' | 'FUNC' | 'LPAREN' | 'RPAREN' | 'COMMA';

interface Token {
  type: TokenType;
  value: string;
}

const OPERATOR_PRECEDENCE: Record<string, { prec: number; assoc: 'L' | 'R' }> = {
  '+': { prec: 2, assoc: 'L' },
  '-': { prec: 2, assoc: 'L' },
  '*': { prec: 3, assoc: 'L' },
  '/': { prec: 3, assoc: 'L' },
  '%': { prec: 3, assoc: 'L' },
  '^': { prec: 4, assoc: 'R' },
  'u-': { prec: 5, assoc: 'R' }, // unary minus
  'u+': { prec: 5, assoc: 'R' }, // unary plus
};

const KNOWN_FUNCS = new Set([
  'sin', 'cos', 'tan',
  'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh',
  'sqrt', 'cbrt', 'ln', 'log', 'log2',
  'abs', 'exp', 'floor', 'ceil', 'round', 'fact'
]);

export function tokenize(expr: string): Token[] {
  // Normalize symbols
  let s = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/φ/g, 'phi')
    .trim();

  const tokens: Token[] = [];
  let i = 0;

  while (i < s.length) {
    const ch = s[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Number (including decimal and scientific notation like 1e5)
    if (/[0-9.]/.test(ch)) {
      let numStr = '';
      while (i < s.length && /[0-9.]/.test(s[i])) {
        numStr += s[i];
        i++;
      }
      // Check for scientific notation exponent like 1e-4
      if (i < s.length && (s[i] === 'e' || s[i] === 'E')) {
        const nextChar = s[i + 1];
        if (/[0-9+-]/.test(nextChar)) {
          numStr += s[i];
          i++;
          if (s[i] === '+' || s[i] === '-') {
            numStr += s[i];
            i++;
          }
          while (i < s.length && /[0-9]/.test(s[i])) {
            numStr += s[i];
            i++;
          }
        }
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    // Operators
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '%' || ch === '^') {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }

    // Parentheses
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    // Factorial suffix !
    if (ch === '!') {
      tokens.push({ type: 'OP', value: '!' });
      i++;
      continue;
    }

    // Alphabetic identifiers (functions or constants or variable x)
    if (/[a-zA-Z_]/.test(ch)) {
      let id = '';
      while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) {
        id += s[i];
        i++;
      }
      id = id.toLowerCase();

      if (KNOWN_FUNCS.has(id)) {
        tokens.push({ type: 'FUNC', value: id });
      } else if (id in CONSTANTS) {
        tokens.push({ type: 'NUMBER', value: CONSTANTS[id].value.toString() });
      } else if (id === 'x') {
        tokens.push({ type: 'NUMBER', value: 'x' });
      } else {
        throw new Error(`Unknown identifier: ${id}`);
      }
      continue;
    }

    throw new Error(`Unexpected character: ${ch}`);
  }

  // Insert implicit multiplications: e.g. 2(3) -> 2 * (3), (2)(3) -> (2) * (3), 5sin -> 5 * sin, x(2) -> x * (2)
  const resolved: Token[] = [];
  for (let j = 0; j < tokens.length; j++) {
    const curr = tokens[j];
    const prev = tokens[j - 1];

    if (prev) {
      const prevCanMultiply = prev.type === 'NUMBER' || prev.type === 'RPAREN' || prev.value === '!';
      const currCanMultiply = curr.type === 'NUMBER' || curr.type === 'FUNC' || curr.type === 'LPAREN';

      if (prevCanMultiply && currCanMultiply) {
        resolved.push({ type: 'OP', value: '*' });
      }
    }
    resolved.push(curr);
  }

  // Mark unary operators
  const finalTokens: Token[] = [];
  for (let k = 0; k < resolved.length; k++) {
    const tok = resolved[k];
    const prev = k > 0 ? resolved[k - 1] : null;

    if (tok.type === 'OP' && (tok.value === '+' || tok.value === '-')) {
      const isUnary = !prev || prev.type === 'OP' || prev.type === 'LPAREN';
      if (isUnary) {
        finalTokens.push({ type: 'OP', value: tok.value === '-' ? 'u-' : 'u+' });
        continue;
      }
    }
    finalTokens.push(tok);
  }

  return finalTokens;
}

// Shunting Yard Algorithm to evaluate tokens
export function evaluateTokens(tokens: Token[], angleMode: AngleMode = 'DEG', variableX?: number): number {
  const outputQueue: (number | string)[] = [];
  const opStack: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];

    if (tok.type === 'NUMBER') {
      if (tok.value === 'x') {
        if (variableX === undefined) throw new Error('Variable x is undefined');
        outputQueue.push(variableX);
      } else {
        outputQueue.push(parseFloat(tok.value));
      }
    } else if (tok.type === 'FUNC') {
      opStack.push(tok.value);
    } else if (tok.type === 'OP') {
      if (tok.value === '!') {
        // Postfix operator: evaluate immediately on top of output queue
        const top = outputQueue.pop();
        if (top === undefined || typeof top !== 'number') throw new Error('Syntax error for factorial');
        outputQueue.push(factorial(top));
        continue;
      }

      const o1 = tok.value;
      const prec1 = OPERATOR_PRECEDENCE[o1]?.prec || 0;
      const assoc1 = OPERATOR_PRECEDENCE[o1]?.assoc || 'L';

      while (opStack.length > 0) {
        const topOp = opStack[opStack.length - 1];
        if (topOp === '(') break;

        const isFunc = KNOWN_FUNCS.has(topOp);
        const prec2 = OPERATOR_PRECEDENCE[topOp]?.prec || 0;

        if (isFunc || (assoc1 === 'L' && prec1 <= prec2) || (assoc1 === 'R' && prec1 < prec2)) {
          outputQueue.push(opStack.pop()!);
        } else {
          break;
        }
      }
      opStack.push(o1);
    } else if (tok.type === 'LPAREN') {
      opStack.push('(');
    } else if (tok.type === 'RPAREN') {
      while (opStack.length > 0 && opStack[opStack.length - 1] !== '(') {
        outputQueue.push(opStack.pop()!);
      }
      if (opStack.length === 0) {
        throw new Error('Mismatched parentheses');
      }
      opStack.pop(); // Pop '('

      if (opStack.length > 0 && KNOWN_FUNCS.has(opStack[opStack.length - 1])) {
        outputQueue.push(opStack.pop()!);
      }
    }
  }

  while (opStack.length > 0) {
    const top = opStack.pop()!;
    if (top === '(' || top === ')') throw new Error('Mismatched parentheses');
    outputQueue.push(top);
  }

  // Evaluate RPN
  const evalStack: number[] = [];

  for (const item of outputQueue) {
    if (typeof item === 'number') {
      evalStack.push(item);
    } else if (KNOWN_FUNCS.has(item)) {
      const a = evalStack.pop();
      if (a === undefined) throw new Error('Syntax Error');

      let res = 0;
      const toRad = angleMode === 'DEG' ? (a * Math.PI) / 180 : a;
      const fromRad = (val: number) => (angleMode === 'DEG' ? (val * 180) / Math.PI : val);

      switch (item) {
        case 'sin':
          res = Math.sin(toRad);
          break;
        case 'cos':
          res = Math.cos(toRad);
          break;
        case 'tan':
          // Catch tan(90 deg)
          if (angleMode === 'DEG' && Math.abs(a % 180) === 90) {
            throw new Error('Domain Error: tan undefined');
          }
          res = Math.tan(toRad);
          break;
        case 'asin':
          if (a < -1 || a > 1) throw new Error('Domain Error: asin out of range [-1, 1]');
          res = fromRad(Math.asin(a));
          break;
        case 'acos':
          if (a < -1 || a > 1) throw new Error('Domain Error: acos out of range [-1, 1]');
          res = fromRad(Math.acos(a));
          break;
        case 'atan':
          res = fromRad(Math.atan(a));
          break;
        case 'sinh':
          res = Math.sinh(a);
          break;
        case 'cosh':
          res = Math.cosh(a);
          break;
        case 'tanh':
          res = Math.tanh(a);
          break;
        case 'sqrt':
          if (a < 0) throw new Error('Domain Error: Square root of negative number');
          res = Math.sqrt(a);
          break;
        case 'cbrt':
          res = Math.cbrt(a);
          break;
        case 'ln':
          if (a <= 0) throw new Error('Domain Error: ln undefined for <= 0');
          res = Math.log(a);
          break;
        case 'log':
          if (a <= 0) throw new Error('Domain Error: log10 undefined for <= 0');
          res = Math.log10(a);
          break;
        case 'log2':
          if (a <= 0) throw new Error('Domain Error: log2 undefined for <= 0');
          res = Math.log2(a);
          break;
        case 'exp':
          res = Math.exp(a);
          break;
        case 'abs':
          res = Math.abs(a);
          break;
        case 'fact':
          res = factorial(a);
          break;
        case 'floor':
          res = Math.floor(a);
          break;
        case 'ceil':
          res = Math.ceil(a);
          break;
        case 'round':
          res = Math.round(a);
          break;
        default:
          throw new Error(`Unknown function: ${item}`);
      }
      evalStack.push(res);
    } else {
      // Binary or unary operator
      if (item === 'u-') {
        const a = evalStack.pop();
        if (a === undefined) throw new Error('Syntax Error');
        evalStack.push(-a);
        continue;
      }
      if (item === 'u+') {
        continue; // Unary plus does not change value
      }

      const b = evalStack.pop();
      const a = evalStack.pop();
      if (a === undefined || b === undefined) throw new Error('Syntax Error');

      let res = 0;
      switch (item) {
        case '+':
          res = a + b;
          break;
        case '-':
          res = a - b;
          break;
        case '*':
          res = a * b;
          break;
        case '/':
          if (b === 0) throw new Error('Error: Division by 0');
          res = a / b;
          break;
        case '%':
          res = a % b;
          break;
        case '^':
          res = Math.pow(a, b);
          break;
        default:
          throw new Error(`Unknown operator: ${item}`);
      }
      evalStack.push(res);
    }
  }

  if (evalStack.length !== 1) {
    throw new Error('Syntax Error: incomplete expression');
  }

  return evalStack[0];
}

// Complete evaluation pipeline
export function evaluateMathExpression(expr: string, angleMode: AngleMode = 'DEG'): EvaluationResult {
  if (!expr || !expr.trim()) {
    return { success: true, value: 0, formatted: '0' };
  }

  try {
    const tokens = tokenize(expr);
    const value = evaluateTokens(tokens, angleMode);

    if (isNaN(value)) {
      return { success: false, value: NaN, formatted: 'Error', error: 'Undefined operation' };
    }

    return {
      success: true,
      value,
      formatted: formatResultNumber(value),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Syntax Error';
    return {
      success: false,
      value: NaN,
      formatted: 'Error',
      error: msg,
    };
  }
}

// Function compiler for graphing $f(x)$
export function createFunctionEvaluator(expr: string, angleMode: AngleMode = 'RAD'): (x: number) => number | null {
  try {
    const tokens = tokenize(expr);
    return (x: number) => {
      try {
        const val = evaluateTokens(tokens, angleMode, x);
        if (isNaN(val) || !isFinite(val)) return null;
        return val;
      } catch {
        return null;
      }
    };
  } catch {
    return () => null;
  }
}
