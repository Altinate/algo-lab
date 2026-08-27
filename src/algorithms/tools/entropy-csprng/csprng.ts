/**
 * Cryptographically Secure Pseudo-Random Number Generator (CSPRNG)
 * Utilizes OS-level entropy pool via crypto.getRandomValues()
 * Computes live Shannon entropy and Chi-square statistics on generated stream.
 */

import { bytesToHex } from '../../utils';
import { computeShannonEntropy, type ShannonEntropyResult } from './shannon';
import { computeChiSquareTest, type ChiSquareResult } from './chi-square';

export interface CsprngGenerationResult {
  byteLength: number;
  hex: string;
  bytes: Uint8Array;
  bitRaster: number[]; // 0/1 values for 2D matrix rendering
  shannon: ShannonEntropyResult;
  chiSquare: ChiSquareResult;
  isCryptographic: boolean;
  entropySource: string;
}

/**
 * Generate cryptographically secure random bytes using crypto.getRandomValues()
 */
export function generateCsprngBytes(byteLength: number = 256): CsprngGenerationResult {
  const length = Math.max(1, Math.min(8192, byteLength));
  const bytes = new Uint8Array(length);

  // Use globalThis.crypto.getRandomValues() for universal browser & Node support
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    throw new Error('CSPRNG unavailable: crypto.getRandomValues() not supported in this runtime.');
  }

  const hex = bytesToHex(bytes);

  // Extract up to 1024 or 4096 individual bits for 2D raster visualization
  const bitRaster: number[] = [];
  const maxBits = Math.min(bytes.length * 8, 4096);
  for (let i = 0; i < bytes.length && bitRaster.length < maxBits; i++) {
    const b = bytes[i];
    for (let bitIdx = 7; bitIdx >= 0 && bitRaster.length < maxBits; bitIdx--) {
      bitRaster.push((b >> bitIdx) & 1);
    }
  }

  const shannon = computeShannonEntropy(bytes);
  const chiSquare = computeChiSquareTest(bytes);

  return {
    byteLength: length,
    hex,
    bytes,
    bitRaster,
    shannon,
    chiSquare,
    isCryptographic: true,
    entropySource: 'OS Kernel / Hardware Entropy Pool (crypto.getRandomValues)',
  };
}
