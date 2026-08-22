/**
 * Number Theoretic Transform (NTT) for ML-DSA (NIST FIPS 204)
 * Ring: Z_q[X] / (X^256 + 1) with q = 8380417, zeta = 1750
 */

import { ML_DSA_Q, ML_DSA_ZETAS } from './constants';

export interface NttResult {
  transformed: number[];
  stages: Array<{
    stage: number;
    len: number;
    butterfliesCount: number;
    sampleValues: number[];
  }>;
}

/**
 * Forward NTT: converts polynomial from standard domain to NTT domain
 * FIPS 204 Algorithm 39 (Cooley-Tukey)
 */
export function ntt(p: number[]): NttResult {
  const w = new Array<number>(256);
  for (let i = 0; i < 256; i++) {
    w[i] = ((p[i] % ML_DSA_Q) + ML_DSA_Q) % ML_DSA_Q;
  }

  const stages: NttResult['stages'] = [];
  let k = 1;
  let len = 128;
  let stageIdx = 0;

  while (len >= 1) {
    for (let start = 0; start < 256; start += 2 * len) {
      const zeta = ML_DSA_ZETAS[k++];
      for (let j = start; j < start + len; j++) {
        const t = Number((BigInt(zeta) * BigInt(w[j + len])) % BigInt(ML_DSA_Q));
        w[j + len] = (w[j] - t + ML_DSA_Q) % ML_DSA_Q;
        w[j] = (w[j] + t) % ML_DSA_Q;
      }
    }

    stages.push({
      stage: stageIdx + 1,
      len,
      butterfliesCount: 128,
      sampleValues: w.slice(0, 8),
    });

    len = Math.floor(len / 2);
    stageIdx++;
  }

  return { transformed: w, stages };
}

/**
 * Inverse NTT: converts polynomial from NTT domain back to standard domain
 * FIPS 204 Algorithm 40 (Gentleman-Sande)
 */
export function nttInv(wHat: number[]): number[] {
  const w = [...wHat];
  let k = 255;
  let len = 1;

  while (len <= 128) {
    for (let start = 0; start < 256; start += 2 * len) {
      const zeta = (ML_DSA_Q - ML_DSA_ZETAS[k--]) % ML_DSA_Q;
      for (let j = start; j < start + len; j++) {
        const t = w[j];
        w[j] = (t + w[j + len]) % ML_DSA_Q;
        const diff = (t - w[j + len] + ML_DSA_Q) % ML_DSA_Q;
        w[j + len] = Number((BigInt(zeta) * BigInt(diff)) % BigInt(ML_DSA_Q));
      }
    }
    len = len * 2;
  }

  // Multiply by n^(-1) = 256^(-1) mod 8380417 = 8347681
  const nInv = 8347681;
  for (let i = 0; i < 256; i++) {
    w[i] = Number((BigInt(w[i]) * BigInt(nInv)) % BigInt(ML_DSA_Q));
  }

  return w;
}

/**
 * Pointwise multiplication of two polynomials in NTT domain
 */
export function multiplyNTTs(aHat: number[], bHat: number[]): number[] {
  const cHat = new Array<number>(256);
  for (let i = 0; i < 256; i++) {
    cHat[i] = Number((BigInt(aHat[i]) * BigInt(bHat[i])) % BigInt(ML_DSA_Q));
  }
  return cHat;
}

/**
 * Vector-Vector dot product in NTT domain
 */
export function dotProductNTTs(uHat: number[][], vHat: number[][]): number[] {
  const acc = new Array<number>(256).fill(0);
  for (let i = 0; i < uHat.length; i++) {
    const prod = multiplyNTTs(uHat[i], vHat[i]);
    for (let j = 0; j < 256; j++) {
      acc[j] = (acc[j] + prod[j]) % ML_DSA_Q;
    }
  }
  return acc;
}

/**
 * Matrix-Vector multiplication in NTT domain: A_hat (k x l) * v_hat (l) -> w_hat (k)
 */
export function matVecMulNTT(AHat: number[][][], vHat: number[][]): number[][] {
  const k = AHat.length;
  const l = vHat.length;
  const result: number[][] = [];

  for (let i = 0; i < k; i++) {
    const rowAcc = new Array<number>(256).fill(0);
    for (let j = 0; j < l; j++) {
      const prod = multiplyNTTs(AHat[i][j], vHat[j]);
      for (let n = 0; n < 256; n++) {
        rowAcc[n] = (rowAcc[n] + prod[n]) % ML_DSA_Q;
      }
    }
    result.push(rowAcc);
  }

  return result;
}
