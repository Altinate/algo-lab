/**
 * Base58 (Bitcoin Alphabet) Encoding/Decoding Engine & Plugins
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { stringToBytes, bytesToString, bytesToHex, hexToBytes } from '../../utils';

export const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export interface RadixDivisionData {
  encodingType: string;
  operation: 'encode' | 'decode';
  dividendStr: string;
  divisor: number;
  quotientStr: string;
  remainder: number;
  mappedChar: string;
  leadingZerosCount: number;
  leadingZerosChars: string;
  digitStack: string[];
  outputBuffer: string;
  alphabet: string;
  iteration: number;
  totalIterations: number;
}

export function encodeBase58(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const bytes = stringToBytes(input);

  // 1. Count leading zero bytes
  let leadingZeros = 0;
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) {
    leadingZeros++;
  }

  steps.push({
    id: 'base58-encode-init',
    title: 'Base58 Input Analysis & Leading Zero Count',
    phase: 'INITIALIZATION',
    description: `Ingested ${bytes.length} bytes. Counted ${leadingZeros} leading 0x00 byte(s) (each maps to character '1'). Initialized BigInt radix-58 division accumulator.`,
    visualizationType: 'binary-transform',
    data: {
      input,
      hex: bytesToHex(bytes),
      bitLength: bytes.length * 8,
      radixDivision: {
        encodingType: 'Base58',
        operation: 'encode',
        dividendStr: bytesToHex(bytes),
        divisor: 58,
        quotientStr: '0',
        remainder: 0,
        mappedChar: '',
        leadingZerosCount: leadingZeros,
        leadingZerosChars: '1'.repeat(leadingZeros),
        digitStack: [],
        outputBuffer: '1'.repeat(leadingZeros),
        alphabet: BASE58_ALPHABET,
        iteration: 0,
        totalIterations: 0,
      } as RadixDivisionData,
    },
  });

  if (bytes.length === 0) {
    return { digest: '', steps };
  }

  // Convert bytes to BigInt
  let num = 0n;
  for (let i = 0; i < bytes.length; i++) {
    num = (num << 8n) | BigInt(bytes[i]);
  }

  const digits: string[] = [];
  let iter = 0;
  const initialBigIntStr = num.toString();

  // Perform division steps
  while (num > 0n) {
    iter++;
    const prevNum = num;
    const rem = Number(num % 58n);
    num = num / 58n;
    const char = BASE58_ALPHABET[rem];
    digits.push(char);

    steps.push({
      id: `base58-encode-iter-${iter}`,
      title: `Radix-58 Division #${iter}: Remainder ${rem} → '${char}'`,
      phase: 'RADIX CONVERSION',
      description: `Iter #${iter}: ${prevNum.toString().slice(0, 24)}${prevNum.toString().length > 24 ? '...' : ''} ÷ 58 = ${num.toString().slice(0, 24)}${num.toString().length > 24 ? '...' : ''} with remainder ${rem} (Alphabet[${rem}] = '${char}').`,
      visualizationType: 'binary-transform',
      data: {
        radixDivision: {
          encodingType: 'Base58',
          operation: 'encode',
          dividendStr: prevNum.toString(),
          divisor: 58,
          quotientStr: num.toString(),
          remainder: rem,
          mappedChar: char,
          leadingZerosCount: leadingZeros,
          leadingZerosChars: '1'.repeat(leadingZeros),
          digitStack: [...digits],
          outputBuffer: '1'.repeat(leadingZeros) + [...digits].reverse().join(''),
          alphabet: BASE58_ALPHABET,
          iteration: iter,
          totalIterations: digits.length,
        } as RadixDivisionData,
      },
    });
  }

  const encodedStr = '1'.repeat(leadingZeros) + digits.reverse().join('');

  steps.push({
    id: 'base58-encode-complete',
    title: 'Base58 Encoding Complete',
    phase: 'COMPLETE',
    description: `Reversed digit stack and prepended ${leadingZeros} leading '1's. Final Base58 string (${encodedStr.length} chars): "${encodedStr}".`,
    visualizationType: 'binary-transform',
    data: {
      bytes: encodedStr.length,
      hex: bytesToHex(stringToBytes(encodedStr)),
      input,
      output: encodedStr,
      radixDivision: {
        encodingType: 'Base58',
        operation: 'encode',
        dividendStr: initialBigIntStr,
        divisor: 58,
        quotientStr: '0',
        remainder: 0,
        mappedChar: '',
        leadingZerosCount: leadingZeros,
        leadingZerosChars: '1'.repeat(leadingZeros),
        digitStack: digits,
        outputBuffer: encodedStr,
        alphabet: BASE58_ALPHABET,
        iteration: iter,
        totalIterations: iter,
      } as RadixDivisionData,
    },
  });

  return { digest: encodedStr, steps };
}

export function decodeBase58(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const cleanInput = input.trim();

  // Count leading '1's
  let leadingZeros = 0;
  while (leadingZeros < cleanInput.length && cleanInput[leadingZeros] === '1') {
    leadingZeros++;
  }

  steps.push({
    id: 'base58-decode-init',
    title: 'Base58 Input Parsing & Leading 1s Count',
    phase: 'INITIALIZATION',
    description: `Parsed ${cleanInput.length}-char Base58 string. Counted ${leadingZeros} leading '1' character(s) (maps to ${leadingZeros} leading 0x00 byte(s)).`,
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
    const idx = BASE58_ALPHABET.indexOf(ch);
    if (idx < 0) {
      continue; // Skip invalid non-Base58 characters
    }
    const val = BigInt(idx);
    const prevNum = num;
    num = num * 58n + val;

    steps.push({
      id: `base58-decode-char-${i}`,
      title: `Accumulate Char ${i + 1}/${chars.length}: '${ch}' (Index ${val})`,
      phase: 'RADIX CONVERSION',
      description: `Iter #${i + 1}: ${prevNum.toString().slice(0, 16)} × 58 + ${val} ('${ch}') = ${num.toString().slice(0, 24)}${num.toString().length > 24 ? '...' : ''}.`,
      visualizationType: 'binary-transform',
      data: {
        radixDivision: {
          encodingType: 'Base58',
          operation: 'decode',
          dividendStr: num.toString(),
          divisor: 58,
          quotientStr: prevNum.toString(),
          remainder: Number(val),
          mappedChar: ch,
          leadingZerosCount: leadingZeros,
          leadingZerosChars: '0x00 '.repeat(leadingZeros),
          digitStack: Array.from(chars.slice(0, i + 1)),
          outputBuffer: num.toString(16),
          alphabet: BASE58_ALPHABET,
          iteration: i + 1,
          totalIterations: chars.length,
        } as RadixDivisionData,
      },
    });
  }

  // Convert BigInt back to bytes
  let hex = num.toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  const decodedRawBytes = hex ? hexToBytes(hex) : new Uint8Array(0);

  const finalBytes = new Uint8Array(leadingZeros + decodedRawBytes.length);
  finalBytes.fill(0, 0, leadingZeros);
  finalBytes.set(decodedRawBytes, leadingZeros);

  const decodedText = bytesToString(finalBytes);

  steps.push({
    id: 'base58-decode-complete',
    title: 'Base58 Decoding Complete',
    phase: 'COMPLETE',
    description: `Decoded ${cleanInput.length} Base58 characters into ${finalBytes.length} bytes: "${decodedText}" [0x${bytesToHex(finalBytes)}].`,
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

export const base58EncodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Base58 (Encode)',
    family: 'Positional/Radix Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 0,
    description: 'Bitcoin-style Base58 radix-58 arbitrary-precision division encoding omitting visually ambiguous characters (0, O, I, l).',
    useCases: ['Bitcoin legacy & SegWit addresses', 'IPFS content identifiers (CIDv0)', 'Solana wallet addresses', 'Monero subaddresses'],
    security: 'non-cryptographic',
    year: 2008,
    designers: ['Satoshi Nakamoto (Bitcoin Core)'],
    direction: 'encrypt',
  },
  compute(input: string): ComputationResult {
    return encodeBase58(input);
  },
};

export const base58DecodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Base58 (Decode)',
    family: 'Positional/Radix Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 0,
    description: 'Base58 decoding via arbitrary-precision multiplication into original raw bytes / text.',
    useCases: ['Bitcoin address validation', 'Solana public key unpacking', 'IPFS multihash resolution'],
    security: 'non-cryptographic',
    year: 2008,
    designers: ['Satoshi Nakamoto (Bitcoin Core)'],
    direction: 'decrypt',
  },
  compute(input: string): ComputationResult {
    return decodeBase58(input);
  },
};
