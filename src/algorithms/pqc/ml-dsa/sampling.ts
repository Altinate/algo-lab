/**
 * ML-DSA Sampling Algorithms (NIST FIPS 204)
 */

import { ML_DSA_Q, MlDsaParams } from './constants';
import { shake128Xof, shake256Xof } from '../ml-kem/sponge';

/**
 * RejNTTPoly (FIPS 204 Algorithm 35)
 * Samples a polynomial in NTT domain from SHAKE128(rho || j || i)
 */
export function rejNttPoly(rho: Uint8Array, j: number, i: number): number[] {
  const seed = new Uint8Array(34);
  seed.set(rho, 0);
  seed[32] = j & 0xff;
  seed[33] = i & 0xff;

  const sponge = shake128Xof(seed);
  const a = new Array<number>(256);
  let count = 0;

  while (count < 256) {
    const chunk = sponge.squeeze(3);
    const z = chunk[0] | (chunk[1] << 8) | ((chunk[2] & 0x7f) << 16);
    if (z < ML_DSA_Q) {
      a[count++] = z;
    }
  }

  return a;
}

/**
 * ExpandA (FIPS 204 Algorithm 26)
 * Generates k x l matrix A_hat in NTT domain from 32-byte seed rho
 */
export function expandA(params: MlDsaParams, rho: Uint8Array): number[][][] {
  const { k, l } = params;
  const A: number[][][] = [];

  for (let r = 0; r < k; r++) {
    const row: number[][] = [];
    for (let c = 0; c < l; c++) {
      row.push(rejNttPoly(rho, c, r));
    }
    A.push(row);
  }

  return A;
}

/**
 * RejBoundedPoly (FIPS 204 Algorithm 36)
 * Samples bounded polynomial with coefficients in [-eta, eta]
 */
export function rejBoundedPoly(sigma: Uint8Array, idx: number, eta: number): number[] {
  const seed = new Uint8Array(66);
  seed.set(sigma, 0);
  seed[64] = idx & 0xff;
  seed[65] = (idx >> 8) & 0xff;

  const sponge = shake256Xof(seed);
  const s = new Array<number>(256);
  let count = 0;

  if (eta === 2) {
    while (count < 256) {
      const byte = sponge.squeeze(1)[0];
      const z0 = byte & 0x0f;
      const z1 = (byte >> 4) & 0x0f;

      if (z0 < 15) {
        const val = 2 - (z0 % 5);
        s[count++] = (val + ML_DSA_Q) % ML_DSA_Q;
        if (count === 256) break;
      }
      if (z1 < 15) {
        const val = 2 - (z1 % 5);
        s[count++] = (val + ML_DSA_Q) % ML_DSA_Q;
      }
    }
  } else if (eta === 4) {
    while (count < 256) {
      const byte = sponge.squeeze(1)[0];
      const z0 = byte & 0x0f;
      const z1 = (byte >> 4) & 0x0f;

      if (z0 < 9) {
        const val = 4 - z0;
        s[count++] = (val + ML_DSA_Q) % ML_DSA_Q;
        if (count === 256) break;
      }
      if (z1 < 9) {
        const val = 4 - z1;
        s[count++] = (val + ML_DSA_Q) % ML_DSA_Q;
      }
    }
  }

  return s;
}

/**
 * ExpandS (FIPS 204 Algorithm 27)
 * Samples secret vectors s1 (length l) and s2 (length k) from 64-byte seed sigma
 */
export function expandS(params: MlDsaParams, sigma: Uint8Array): { s1: number[][]; s2: number[][] } {
  const { k, l, eta } = params;
  const s1: number[][] = [];
  const s2: number[][] = [];

  for (let i = 0; i < l; i++) {
    s1.push(rejBoundedPoly(sigma, i, eta));
  }
  for (let i = 0; i < k; i++) {
    s2.push(rejBoundedPoly(sigma, l + i, eta));
  }

  return { s1, s2 };
}

/**
 * ExpandMask (FIPS 204 Algorithm 31)
 * Samples mask vector y (length l) with coefficients in [-gamma1 + 1, gamma1]
 */
export function expandMask(params: MlDsaParams, rhoPrime: Uint8Array, kappa: number): number[][] {
  const { l, gamma1 } = params;
  const y: number[][] = [];

  for (let i = 0; i < l; i++) {
    const seed = new Uint8Array(66);
    seed.set(rhoPrime, 0);
    const idx = kappa + i;
    seed[64] = idx & 0xff;
    seed[65] = (idx >> 8) & 0xff;

    const sponge = shake256Xof(seed);
    const poly = new Array<number>(256);

    if (gamma1 === 1 << 17) {
      // 18 bits per coefficient -> 9 bytes for every 4 coefficients
      const bytes = sponge.squeeze(576); // 256 * 18 / 8 = 576 bytes
      for (let j = 0; j < 64; j++) {
        const b = bytes.subarray(j * 9, j * 9 + 9);
        const z0 = b[0] | (b[1] << 8) | ((b[2] & 0x03) << 16);
        const z1 = (b[2] >> 2) | (b[3] << 6) | ((b[4] & 0x0f) << 14);
        const z2 = (b[4] >> 4) | (b[5] << 4) | ((b[6] & 0x3f) << 12);
        const z3 = (b[6] >> 6) | (b[7] << 2) | (b[8] << 10);

        poly[j * 4 + 0] = (gamma1 - z0 + ML_DSA_Q) % ML_DSA_Q;
        poly[j * 4 + 1] = (gamma1 - z1 + ML_DSA_Q) % ML_DSA_Q;
        poly[j * 4 + 2] = (gamma1 - z2 + ML_DSA_Q) % ML_DSA_Q;
        poly[j * 4 + 3] = (gamma1 - z3 + ML_DSA_Q) % ML_DSA_Q;
      }
    } else if (gamma1 === 1 << 19) {
      // 20 bits per coefficient -> 5 bytes for every 2 coefficients
      const bytes = sponge.squeeze(640); // 256 * 20 / 8 = 640 bytes
      for (let j = 0; j < 128; j++) {
        const b = bytes.subarray(j * 5, j * 5 + 5);
        const z0 = b[0] | (b[1] << 8) | ((b[2] & 0x0f) << 16);
        const z1 = (b[2] >> 4) | (b[3] << 4) | (b[4] << 12);

        poly[j * 2 + 0] = (gamma1 - z0 + ML_DSA_Q) % ML_DSA_Q;
        poly[j * 2 + 1] = (gamma1 - z1 + ML_DSA_Q) % ML_DSA_Q;
      }
    }

    y.push(poly);
  }

  return y;
}

/**
 * SampleInBall (FIPS 204 Algorithm 32)
 * Samples challenge polynomial c with tau non-zero coefficients in {-1, 1}
 */
export function sampleInBall(cTilde: Uint8Array, tau: number): number[] {
  const sponge = shake256Xof(cTilde);
  const c = new Array<number>(256).fill(0);
  const signsBytes = sponge.squeeze(8);

  let signs = 0n;
  for (let i = 0; i < 8; i++) {
    signs |= BigInt(signsBytes[i]) << BigInt(8 * i);
  }

  for (let i = 256 - tau; i < 256; i++) {
    let j: number;
    while (true) {
      const b = sponge.squeeze(1)[0];
      if (b <= i) {
        j = b;
        break;
      }
    }
    c[i] = c[j];
    const sign = Number(signs & 1n);
    signs >>= 1n;
    c[j] = sign === 1 ? ML_DSA_Q - 1 : 1;
  }

  return c;
}
