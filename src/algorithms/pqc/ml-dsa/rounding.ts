/**
 * ML-DSA Rounding and Decomposition Functions (NIST FIPS 204)
 */

import { ML_DSA_Q, ML_DSA_D } from './constants';

export interface Power2RoundResult {
  r1: number; // High bits (0 <= r1 <= 1023)
  r0: number; // Low bits (-4096 < r0 <= 4096)
}

export interface DecomposeResult {
  r1: number; // High bits
  r0: number; // Low bits
}

/**
 * Power2Round (FIPS 204 Algorithm 29)
 * Splits r in [0, q-1] into r1 * 2^d + r0 with -2^(d-1) < r0 <= 2^(d-1)
 */
export function power2Round(r: number): Power2RoundResult {
  const rNorm = ((r % ML_DSA_Q) + ML_DSA_Q) % ML_DSA_Q;
  let r0 = rNorm % (1 << ML_DSA_D);
  if (r0 > (1 << (ML_DSA_D - 1))) {
    r0 -= (1 << ML_DSA_D);
  }
  const r1 = (rNorm - r0) / (1 << ML_DSA_D);
  return { r1, r0 };
}

/**
 * Decompose (FIPS 204 Algorithm 30)
 * Decomposes r into high bits r1 and low bits r0 such that r = r1 * 2*gamma2 + r0
 */
export function decompose(r: number, twoGamma2: number): DecomposeResult {
  const rNorm = ((r % ML_DSA_Q) + ML_DSA_Q) % ML_DSA_Q;
  const gamma2 = twoGamma2 / 2;
  let r0 = rNorm % twoGamma2;
  if (r0 > gamma2) {
    r0 -= twoGamma2;
  }
  if (rNorm - r0 === ML_DSA_Q - 1) {
    return { r1: 0, r0: r0 - 1 };
  }
  const r1 = Math.floor((rNorm - r0) / twoGamma2);
  return { r1, r0 };
}

export function highBits(r: number, twoGamma2: number): number {
  return decompose(r, twoGamma2).r1;
}

export function lowBits(r: number, twoGamma2: number): number {
  return decompose(r, twoGamma2).r0;
}

/**
 * MakeHint (FIPS 204 Algorithm 33)
 * Computes hint bit indicating whether low bits overflow into high bits
 */
export function makeHint(z: number, r: number, twoGamma2: number): number {
  const r1 = highBits(r, twoGamma2);
  const v1 = highBits((r + z + ML_DSA_Q) % ML_DSA_Q, twoGamma2);
  return r1 !== v1 ? 1 : 0;
}

/**
 * UseHint (FIPS 204 Algorithm 34)
 * Reconstructs high bits r1 from r and hint bit h
 */
export function useHint(h: number, r: number, twoGamma2: number): number {
  const m = (ML_DSA_Q - 1) / twoGamma2;
  const { r1, r0 } = decompose(r, twoGamma2);
  if (h === 0) {
    return r1;
  }
  if (r0 > 0) {
    return (r1 + 1) % m;
  } else {
    return (r1 - 1 + m) % m;
  }
}
