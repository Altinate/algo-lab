/**
 * Centered Binomial Distribution (CBD) and Uniform NTT Sampling (NIST FIPS 203 Section 4.2)
 */

import { ML_KEM_Q } from './constants';
import { Poly } from './ntt';
import { shake128Xof, shake256 } from './sponge';

/** Sample a polynomial uniformly in R_q in NTT domain (FIPS 203 Algorithm 6: SampleNTT) */
export function sampleNTT(rho: Uint8Array, i: number, j: number): Poly {
  // FIPS 203: XOF(rho || j || i)
  const sponge = shake128Xof(rho, j, i);
  const a = new Array<number>(256);
  let count = 0;

  while (count < 256) {
    const buf = sponge.squeeze(3);
    const b0 = buf[0];
    const b1 = buf[1];
    const b2 = buf[2];

    const d1 = b0 + 256 * (b1 & 0x0f);
    const d2 = (b1 >> 4) + 16 * b2;

    if (d1 < ML_KEM_Q && count < 256) {
      a[count++] = d1;
    }
    if (d2 < ML_KEM_Q && count < 256) {
      a[count++] = d2;
    }
  }

  return a;
}

/** Centered Binomial Distribution Sampling for eta = 2 and eta = 3 (FIPS 203 Algorithm 7: SamplePolyCBD_eta) */
export function samplePolyCBD(sigma: Uint8Array, nonce: number, eta: number): { poly: Poly; histogram: Record<number, number> } {
  // PRF(sigma || nonce) with output length 64 * eta bytes
  const input = new Uint8Array(sigma.length + 1);
  input.set(sigma, 0);
  input[sigma.length] = nonce;

  const prfBytes = shake256(input, 64 * eta);
  const f = new Array<number>(256);
  const histogram: Record<number, number> = {};

  if (eta === 2) {
    let polyIdx = 0;
    for (let i = 0; i < prfBytes.length; i++) {
      const b = prfBytes[i];
      const a0 = (b & 1) + ((b >> 1) & 1);
      const b0 = ((b >> 2) & 1) + ((b >> 3) & 1);
      const diff0 = a0 - b0;
      f[polyIdx++] = (diff0 + ML_KEM_Q) % ML_KEM_Q;
      histogram[diff0] = (histogram[diff0] || 0) + 1;

      const a1 = ((b >> 4) & 1) + ((b >> 5) & 1);
      const b1 = ((b >> 6) & 1) + ((b >> 7) & 1);
      const diff1 = a1 - b1;
      f[polyIdx++] = (diff1 + ML_KEM_Q) % ML_KEM_Q;
      histogram[diff1] = (histogram[diff1] || 0) + 1;
    }
  } else if (eta === 3) {
    let polyIdx = 0;
    for (let i = 0; i < 256; i += 4) {
      // 3 bytes -> 24 bits -> 4 coefficients of 6 bits each
      const byteIdx = Math.floor((i * 3) / 4);
      const b0 = prfBytes[byteIdx];
      const b1 = prfBytes[byteIdx + 1];
      const b2 = prfBytes[byteIdx + 2];
      const num24 = b0 | (b1 << 8) | (b2 << 16);

      for (let j = 0; j < 4; j++) {
        const chunk = (num24 >> (6 * j)) & 0x3f;
        const a = (chunk & 1) + ((chunk >> 1) & 1) + ((chunk >> 2) & 1);
        const b = ((chunk >> 3) & 1) + ((chunk >> 4) & 1) + ((chunk >> 5) & 1);
        const diff = a - b;
        f[polyIdx++] = (diff + ML_KEM_Q) % ML_KEM_Q;
        histogram[diff] = (histogram[diff] || 0) + 1;
      }
    }
  }

  return { poly: f, histogram };
}
