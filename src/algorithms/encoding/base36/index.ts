/**
 * Base36 (Alphanumeric 0-9, a-z) Encoding & Decoding Engine & Plugins
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { stringToBytes, bytesToString, bytesToHex, hexToBytes } from '../../utils';
import type { RadixDivisionData } from '../base58';

export const BASE36_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

export function encodeBase36(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const bytes = stringToBytes(input);

  // Count leading zero bytes
  let leadingZeros = 0;
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) {
    leadingZeros++;
  }

  steps.push({
    id: 'base36-encode-init',
    title: 'Base36 Input Analysis & Accumulator Initialization',
    phase: 'INITIALIZATION',
    description: `Ingested ${bytes.length} bytes (${bytes.length * 8} bits). Counted ${leadingZeros} leading zero byte(s). Initialized BigInt radix-36 division accumulator.`,
    visualizationType: 'binary-transform',
    data: {
      input,
      hex: bytesToHex(bytes),
      bitLength: bytes.length * 8,
    },
  });

  if (bytes.length === 0) {
    return { digest: '', steps };
  }

  let num = 0n;
  for (let i = 0; i < bytes.length; i++) {
    num = (num << 8n) | BigInt(bytes[i]);
  }

  const initialBigIntStr = num.toString();
  const digits: string[] = [];
  let iter = 0;

  while (num > 0n) {
    iter++;
    const prevNum = num;
    const rem = Number(num % 36n);
    num = num / 36n;
    const char = BASE36_ALPHABET[rem];
    digits.push(char);

    steps.push({
      id: `base36-encode-iter-${iter}`,
      title: `Radix-36 Division #${iter}: Remainder ${rem} → '${char}'`,
      phase: 'RADIX CONVERSION',
      description: `Iter #${iter}: ${prevNum.toString().slice(0, 24)}${prevNum.toString().length > 24 ? '...' : ''} ÷ 36 = ${num.toString().slice(0, 24)}${num.toString().length > 24 ? '...' : ''} (REM: ${rem} → Alphabet[${rem}] = '${char}').`,
      visualizationType: 'binary-transform',
      data: {
        radixDivision: {
          encodingType: 'Base36',
          operation: 'encode',
          dividendStr: prevNum.toString(),
          divisor: 36,
          quotientStr: num.toString(),
          remainder: rem,
          mappedChar: char,
          leadingZerosCount: leadingZeros,
          leadingZerosChars: '0'.repeat(leadingZeros),
          digitStack: [...digits],
          outputBuffer: '0'.repeat(leadingZeros) + [...digits].reverse().join(''),
          alphabet: BASE36_ALPHABET,
          iteration: iter,
          totalIterations: digits.length,
        } as RadixDivisionData,
      },
    });
  }

  const encodedStr = '0'.repeat(leadingZeros) + digits.reverse().join('');

  steps.push({
    id: 'base36-encode-complete',
    title: 'Base36 Encoding Complete',
    phase: 'COMPLETE',
    description: `Reversed digit stack and prepended ${leadingZeros} leading '0's. Final Base36 string (${encodedStr.length} chars): "${encodedStr}".`,
    visualizationType: 'binary-transform',
    data: {
      bytes: encodedStr.length,
      hex: bytesToHex(stringToBytes(encodedStr)),
      input,
      output: encodedStr,
      radixDivision: {
        encodingType: 'Base36',
        operation: 'encode',
        dividendStr: initialBigIntStr,
        divisor: 36,
        quotientStr: '0',
        remainder: 0,
        mappedChar: '',
        leadingZerosCount: leadingZeros,
        leadingZerosChars: '0'.repeat(leadingZeros),
        digitStack: digits,
        outputBuffer: encodedStr,
        alphabet: BASE36_ALPHABET,
        iteration: iter,
        totalIterations: iter,
      } as RadixDivisionData,
    },
  });

  return { digest: encodedStr, steps };
}

export function decodeBase36(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const cleanInput = input.trim().toLowerCase();

  let leadingZeros = 0;
  while (leadingZeros < cleanInput.length && cleanInput[leadingZeros] === '0') {
    leadingZeros++;
  }

  steps.push({
    id: 'base36-decode-init',
    title: 'Base36 Input Parsing & Leading Zeros Count',
    phase: 'INITIALIZATION',
    description: `Parsed ${cleanInput.length}-char Base36 string. Counted ${leadingZeros} leading '0' character(s) (maps to ${leadingZeros} leading 0x00 byte(s)).`,
    visualizationType: 'binary-transform',
    data: {
      input: cleanInput,
      hex: bytesToHex(stringToBytes(cleanInput)),
      bitLength: cleanInput.length * 8,
    },
  });

  if (cleanInput.length === 0) {
    return { digest: '', steps };
  }

  let num = 0n;
  const chars = cleanInput.slice(leadingZeros);

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const idx = BASE36_ALPHABET.indexOf(ch);
    if (idx < 0) {
      continue;
    }
    const val = BigInt(idx);
    const prevNum = num;
    num = num * 36n + val;

    steps.push({
      id: `base36-decode-char-${i}`,
      title: `Accumulate Char ${i + 1}/${chars.length}: '${ch}' (Value ${val})`,
      phase: 'RADIX CONVERSION',
      description: `Iter #${i + 1}: ${prevNum.toString().slice(0, 16)} × 36 + ${val} ('${ch}') = ${num.toString().slice(0, 24)}${num.toString().length > 24 ? '...' : ''}.`,
      visualizationType: 'binary-transform',
      data: {
        radixDivision: {
          encodingType: 'Base36',
          operation: 'decode',
          dividendStr: num.toString(),
          divisor: 36,
          quotientStr: prevNum.toString(),
          remainder: Number(val),
          mappedChar: ch,
          leadingZerosCount: leadingZeros,
          leadingZerosChars: '0x00 '.repeat(leadingZeros),
          digitStack: Array.from(chars.slice(0, i + 1)),
          outputBuffer: num.toString(16),
          alphabet: BASE36_ALPHABET,
          iteration: i + 1,
          totalIterations: chars.length,
        } as RadixDivisionData,
      },
    });
  }

  let hex = num.toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  const decodedRawBytes = hex && num > 0n ? hexToBytes(hex) : new Uint8Array(0);

  const finalBytes = new Uint8Array(leadingZeros + decodedRawBytes.length);
  finalBytes.fill(0, 0, leadingZeros);
  finalBytes.set(decodedRawBytes, leadingZeros);

  const decodedText = bytesToString(finalBytes);

  steps.push({
    id: 'base36-decode-complete',
    title: 'Base36 Decoding Complete',
    phase: 'COMPLETE',
    description: `Decoded ${cleanInput.length} Base36 characters into ${finalBytes.length} bytes: "${decodedText}" [0x${bytesToHex(finalBytes)}].`,
    visualizationType: 'binary-transform',
    data: {
      bytes: finalBytes.length,
      hex: bytesToHex(finalBytes),
      input: cleanInput,
      output: decodedText,
    },
  });

  return { digest: decodedText, steps };
}

export const base36EncodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Base36 (Encode)',
    family: 'Positional/Radix Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 0,
    description: 'Case-insensitive alphanumeric base-36 (0-9, a-z) arbitrary-precision division encoding.',
    useCases: ['URL shorteners (e.g. TinyURL, bit.ly IDs)', 'Compact unique identifiers (UUIDs)', 'Database sequence obfuscation'],
    security: 'non-cryptographic',
    year: 1995,
    designers: ['General Computing Standard'],
    direction: 'encrypt',
  },
  compute(input: string): ComputationResult {
    return encodeBase36(input);
  },
};

export const base36DecodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Base36 (Decode)',
    family: 'Positional/Radix Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 0,
    description: 'Base36 decoding via arbitrary-precision multiplication into original text/bytes.',
    useCases: ['URL ID lookup', 'Sequence ID recovery', 'Compact token parsing'],
    security: 'non-cryptographic',
    year: 1995,
    designers: ['General Computing Standard'],
    direction: 'decrypt',
  },
  compute(input: string): ComputationResult {
    return decodeBase36(input);
  },
};
