/**
 * Shannon Entropy Calculator
 * Formula: H = -sum(p(x) * log2(p(x)))
 * Measures information density and average uncertainty per byte/symbol.
 */

import { stringToBytes, hexToBytes } from '../../utils';

export interface SymbolFrequency {
  byteVal: number;
  hex: string;
  char: string;
  count: number;
  probability: number;
  partialEntropy: number;
}

export interface ShannonEntropyResult {
  byteLength: number;
  uniqueBytes: number;
  shannonEntropy: number;
  maxEntropy: number; // 8.0 for byte data
  entropyRatioPercent: number; // (H / 8.0) * 100
  totalBits: number;
  theoreticalCompressionRatio: number; // (1 - H/8.0) * 100
  frequencyTable: SymbolFrequency[];
  topFrequencies: SymbolFrequency[];
  byteHistogram: number[]; // 256 counts
}

export function parseInputToBytes(input: string): Uint8Array {
  const clean = input.trim();
  const hexMatch = clean.replace(/\s+/g, '');
  if (/^[0-9a-fA-F]+$/.test(hexMatch) && hexMatch.length % 2 === 0 && hexMatch.length >= 2 && (clean.startsWith('0x') || clean.includes(' ') || hexMatch.length >= 32)) {
    try {
      return hexToBytes(hexMatch.startsWith('0x') ? hexMatch.slice(2) : hexMatch);
    } catch {
      // Fallback to UTF-8
    }
  }
  return stringToBytes(input);
}

export function computeShannonEntropy(input: string | Uint8Array): ShannonEntropyResult {
  const bytes = typeof input === 'string' ? parseInputToBytes(input) : input;
  const N = bytes.length;

  if (N === 0) {
    return {
      byteLength: 0,
      uniqueBytes: 0,
      shannonEntropy: 0,
      maxEntropy: 8.0,
      entropyRatioPercent: 0,
      totalBits: 0,
      theoreticalCompressionRatio: 100,
      frequencyTable: [],
      topFrequencies: [],
      byteHistogram: new Array(256).fill(0),
    };
  }

  const counts = new Array(256).fill(0);
  for (let i = 0; i < N; i++) {
    counts[bytes[i]]++;
  }

  let H = 0;
  let uniqueCount = 0;
  const table: SymbolFrequency[] = [];

  for (let b = 0; b < 256; b++) {
    const c = counts[b];
    if (c > 0) {
      uniqueCount++;
      const p = c / N;
      const partial = -p * Math.log2(p);
      H += partial;

      const charRepr = b >= 32 && b <= 126 ? String.fromCharCode(b) : `\\x${b.toString(16).padStart(2, '0').toUpperCase()}`;

      table.push({
        byteVal: b,
        hex: '0x' + b.toString(16).padStart(2, '0').toUpperCase(),
        char: charRepr,
        count: c,
        probability: p,
        partialEntropy: partial,
      });
    }
  }

  // Sort descending by frequency count
  table.sort((a, b) => b.count - a.count || a.byteVal - b.byteVal);

  const roundedH = Number(H.toFixed(6));
  const ratio = Number(((H / 8.0) * 100).toFixed(2));
  const compRatio = Number((Math.max(0, (1 - H / 8.0) * 100)).toFixed(2));

  return {
    byteLength: N,
    uniqueBytes: uniqueCount,
    shannonEntropy: roundedH,
    maxEntropy: 8.0,
    entropyRatioPercent: ratio,
    totalBits: Number((H * N).toFixed(2)),
    theoreticalCompressionRatio: compRatio,
    frequencyTable: table,
    topFrequencies: table.slice(0, 10),
    byteHistogram: counts,
  };
}
