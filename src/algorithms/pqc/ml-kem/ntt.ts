/**
 * Number Theoretic Transform (NTT) for ML-KEM (NIST FIPS 203 Section 4.3)
 * Polynomial ring: R_q = Z_q[X] / (X^256 + 1) with q = 3329.
 */

import { ML_KEM_N, ML_KEM_Q, ZETAS } from './constants';

export type Poly = number[]; // 256 coefficients in [0, 3328]

export interface NttButterflyTelemetry {
  stage: number;
  subLength: number;
  zetasUsed: number[];
  activeCoeffRange: [number, number];
}

/** Forward Number Theoretic Transform (FIPS 203 Algorithm 9: NTT) */
export function ntt(f: Poly): { transformed: Poly; stages: NttButterflyTelemetry[] } {
  const r = [...f];
  const stages: NttButterflyTelemetry[] = [];
  let k = 1;
  let len = 128;
  let stageIdx = 1;

  while (len >= 2) {
    const stageZetas: number[] = [];

    for (let start = 0; start < 256; start += 2 * len) {
      const zeta = ZETAS[k++];
      stageZetas.push(zeta);

      for (let j = start; j < start + len; j++) {
        const t = (zeta * r[j + len]) % ML_KEM_Q;
        r[j + len] = (r[j] - t + ML_KEM_Q) % ML_KEM_Q;
        r[j] = (r[j] + t) % ML_KEM_Q;
      }
    }

    stages.push({
      stage: stageIdx++,
      subLength: len,
      zetasUsed: stageZetas,
      activeCoeffRange: [0, 255],
    });

    len >>= 1;
  }

  return { transformed: r, stages };
}

// Precompute modular inverses of ZETAS mod 3329 (ZETAS_INV[k] * ZETAS[k] = 1 mod 3329)
export const ZETAS_INV: number[] = new Array<number>(128);
for (let i = 0; i < 128; i++) {
  const z = ZETAS[i];
  for (let x = 1; x < ML_KEM_Q; x++) {
    if ((z * x) % ML_KEM_Q === 1) {
      ZETAS_INV[i] = x;
      break;
    }
  }
}

/** Inverse Number Theoretic Transform (FIPS 203 Algorithm 10: NTT^-1) */
export function nttInv(fHat: Poly): Poly {
  const r = [...fHat];
  let len = 2;

  while (len <= 128) {
    const numBlocks = 128 / len;
    const kStart = numBlocks;
    let blockIdx = 0;

    for (let start = 0; start < 256; start += 2 * len) {
      const zetaInv = ZETAS_INV[kStart + blockIdx++];

      for (let j = start; j < start + len; j++) {
        const u = r[j];
        const v = r[j + len];
        r[j] = (u + v) % ML_KEM_Q;
        r[j + len] = (zetaInv * (u - v + ML_KEM_Q)) % ML_KEM_Q;
      }
    }
    len <<= 1;
  }

  // Multiply by 128^(-1) = 3303 mod 3329
  const f = 3303;
  for (let i = 0; i < 256; i++) {
    r[i] = (r[i] * f) % ML_KEM_Q;
  }

  return r;
}

/** Base multiplication of two degree-1 polynomials mod (X^2 - zeta) (FIPS 203 Algorithm 11) */
function baseMul(a0: number, a1: number, b0: number, b1: number, zeta: number): [number, number] {
  const c0 = (a0 * b0 + ((a1 * b1) % ML_KEM_Q) * zeta) % ML_KEM_Q;
  const c1 = (a0 * b1 + a1 * b0) % ML_KEM_Q;
  return [c0, c1];
}

/** Multiply two polynomials in the NTT domain (FIPS 203 Algorithm 12: MultiplyNTTs) */
export function multiplyNTTs(fHat: Poly, gHat: Poly): Poly {
  const r = new Array<number>(256);

  for (let i = 0; i < 64; i++) {
    const zeta = ZETAS[64 + i];
    const zetaNeg = (ML_KEM_Q - zeta) % ML_KEM_Q;

    const [c0, c1] = baseMul(fHat[4 * i], fHat[4 * i + 1], gHat[4 * i], gHat[4 * i + 1], zeta);
    r[4 * i] = c0;
    r[4 * i + 1] = c1;

    const [c2, c3] = baseMul(fHat[4 * i + 2], fHat[4 * i + 3], gHat[4 * i + 2], gHat[4 * i + 3], zetaNeg);
    r[4 * i + 2] = c2;
    r[4 * i + 3] = c3;
  }

  return r;
}

/** Polynomial Addition mod q */
export function addPoly(a: Poly, b: Poly): Poly {
  const r = new Array<number>(256);
  for (let i = 0; i < 256; i++) {
    r[i] = (a[i] + b[i]) % ML_KEM_Q;
  }
  return r;
}

/** Polynomial Subtraction mod q */
export function subPoly(a: Poly, b: Poly): Poly {
  const r = new Array<number>(256);
  for (let i = 0; i < 256; i++) {
    r[i] = (a[i] - b[i] + ML_KEM_Q) % ML_KEM_Q;
  }
  return r;
}
