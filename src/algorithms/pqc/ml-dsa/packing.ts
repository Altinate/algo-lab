/**
 * ML-DSA Bit-Packing and Serialization (NIST FIPS 204)
 */

import { ML_DSA_Q, MlDsaParams } from './constants';

/**
 * Encode t1 (high bits of t)
 * 10 bits per coefficient -> 320 bytes per polynomial
 */
export function encodeT1(t1Poly: number[]): Uint8Array {
  const out = new Uint8Array(320);
  for (let i = 0; i < 64; i++) {
    const a0 = t1Poly[i * 4 + 0];
    const a1 = t1Poly[i * 4 + 1];
    const a2 = t1Poly[i * 4 + 2];
    const a3 = t1Poly[i * 4 + 3];

    out[i * 5 + 0] = a0 & 0xff;
    out[i * 5 + 1] = (a0 >> 8) | ((a1 & 0x3f) << 2);
    out[i * 5 + 2] = (a1 >> 6) | ((a2 & 0x0f) << 4);
    out[i * 5 + 3] = (a2 >> 4) | ((a3 & 0x03) << 6);
    out[i * 5 + 4] = a3 >> 2;
  }
  return out;
}

export function decodeT1(bytes: Uint8Array): number[] {
  const poly = new Array<number>(256);
  for (let i = 0; i < 64; i++) {
    const b0 = bytes[i * 5 + 0];
    const b1 = bytes[i * 5 + 1];
    const b2 = bytes[i * 5 + 2];
    const b3 = bytes[i * 5 + 3];
    const b4 = bytes[i * 5 + 4];

    poly[i * 4 + 0] = b0 | ((b1 & 0x03) << 8);
    poly[i * 4 + 1] = (b1 >> 2) | ((b2 & 0x0f) << 6);
    poly[i * 4 + 2] = (b2 >> 4) | ((b3 & 0x3f) << 4);
    poly[i * 4 + 3] = (b3 >> 6) | (b4 << 2);
  }
  return poly;
}

/**
 * Encode t0 (low bits of t in [-2^12, 2^12])
 * 13 bits per coefficient -> 416 bytes per polynomial
 */
export function encodeT0(t0Poly: number[]): Uint8Array {
  const out = new Uint8Array(416);
  for (let i = 0; i < 32; i++) {
    const a = new Array<number>(8);
    for (let j = 0; j < 8; j++) {
      let v = t0Poly[i * 8 + j];
      if (v > ML_DSA_Q / 2) v -= ML_DSA_Q; // map to centered
      a[j] = (1 << 12) - v; // map [-2^12, 2^12] to [0, 2^13 - 1]
    }

    out[i * 13 + 0] = a[0] & 0xff;
    out[i * 13 + 1] = (a[0] >> 8) | ((a[1] & 0x1f) << 5);
    out[i * 13 + 2] = (a[1] >> 5) | ((a[2] & 0x03) << 7);
    out[i * 13 + 3] = (a[2] >> 2) & 0xff;
    out[i * 13 + 4] = (a[2] >> 10) | ((a[3] & 0x7f) << 1);
    out[i * 13 + 5] = (a[3] >> 7) | ((a[4] & 0x0f) << 4);
    out[i * 13 + 6] = (a[4] >> 4) | ((a[5] & 0x01) << 7);
    out[i * 13 + 7] = (a[5] >> 1) & 0xff;
    out[i * 13 + 8] = (a[5] >> 9) | ((a[6] & 0x3f) << 2);
    out[i * 13 + 9] = (a[6] >> 6) | ((a[7] & 0x07) << 5);
    out[i * 13 + 10] = a[7] >> 3;
    out[i * 13 + 11] = 0;
    out[i * 13 + 12] = 0;
  }

  // Exact 13-bit bit-packing
  const packed = new Uint8Array(416);
  let bitPos = 0;
  for (let i = 0; i < 256; i++) {
    let v = t0Poly[i];
    if (v > ML_DSA_Q / 2) v -= ML_DSA_Q;
    const val = (1 << 12) - v; // 13 bits
    for (let b = 0; b < 13; b++) {
      const bit = (val >> b) & 1;
      const byteIdx = Math.floor(bitPos / 8);
      const bitOffset = bitPos % 8;
      packed[byteIdx] |= bit << bitOffset;
      bitPos++;
    }
  }

  return packed;
}

export function decodeT0(bytes: Uint8Array): number[] {
  const poly = new Array<number>(256);
  let bitPos = 0;
  for (let i = 0; i < 256; i++) {
    let val = 0;
    for (let b = 0; b < 13; b++) {
      const byteIdx = Math.floor(bitPos / 8);
      const bitOffset = bitPos % 8;
      const bit = (bytes[byteIdx] >> bitOffset) & 1;
      val |= bit << b;
      bitPos++;
    }
    const signed = (1 << 12) - val;
    poly[i] = (signed + ML_DSA_Q) % ML_DSA_Q;
  }
  return poly;
}

/**
 * Encode s1 / s2 with eta bound
 */
export function encodeS(sPoly: number[], eta: number): Uint8Array {
  if (eta === 2) {
    // 3 bits per coefficient -> 96 bytes
    const out = new Uint8Array(96);
    let bitPos = 0;
    for (let i = 0; i < 256; i++) {
      let v = sPoly[i];
      if (v > ML_DSA_Q / 2) v -= ML_DSA_Q;
      const val = eta - v; // [0, 4] fits in 3 bits
      for (let b = 0; b < 3; b++) {
        const bit = (val >> b) & 1;
        out[Math.floor(bitPos / 8)] |= bit << (bitPos % 8);
        bitPos++;
      }
    }
    return out;
  } else {
    // eta = 4 -> 4 bits per coefficient -> 128 bytes
    const out = new Uint8Array(128);
    for (let i = 0; i < 128; i++) {
      let v0 = sPoly[i * 2 + 0];
      let v1 = sPoly[i * 2 + 1];
      if (v0 > ML_DSA_Q / 2) v0 -= ML_DSA_Q;
      if (v1 > ML_DSA_Q / 2) v1 -= ML_DSA_Q;
      const a0 = eta - v0;
      const a1 = eta - v1;
      out[i] = (a0 & 0x0f) | ((a1 & 0x0f) << 4);
    }
    return out;
  }
}

export function decodeS(bytes: Uint8Array, eta: number): number[] {
  const poly = new Array<number>(256);
  if (eta === 2) {
    let bitPos = 0;
    for (let i = 0; i < 256; i++) {
      let val = 0;
      for (let b = 0; b < 3; b++) {
        const bit = (bytes[Math.floor(bitPos / 8)] >> (bitPos % 8)) & 1;
        val |= bit << b;
        bitPos++;
      }
      const v = eta - val;
      poly[i] = (v + ML_DSA_Q) % ML_DSA_Q;
    }
  } else {
    for (let i = 0; i < 128; i++) {
      const a0 = bytes[i] & 0x0f;
      const a1 = (bytes[i] >> 4) & 0x0f;
      poly[i * 2 + 0] = (eta - a0 + ML_DSA_Q) % ML_DSA_Q;
      poly[i * 2 + 1] = (eta - a1 + ML_DSA_Q) % ML_DSA_Q;
    }
  }
  return poly;
}

/**
 * Encode z vector polynomial (in [-gamma1 + 1, gamma1])
 */
export function encodeZ(zPoly: number[], gamma1: number): Uint8Array {
  if (gamma1 === 1 << 17) {
    // 18 bits per coefficient -> 576 bytes
    const out = new Uint8Array(576);
    let bitPos = 0;
    for (let i = 0; i < 256; i++) {
      let v = zPoly[i];
      if (v > ML_DSA_Q / 2) v -= ML_DSA_Q;
      const val = gamma1 - v;
      for (let b = 0; b < 18; b++) {
        const bit = (val >> b) & 1;
        out[Math.floor(bitPos / 8)] |= bit << (bitPos % 8);
        bitPos++;
      }
    }
    return out;
  } else {
    // 20 bits per coefficient -> 640 bytes
    const out = new Uint8Array(640);
    let bitPos = 0;
    for (let i = 0; i < 256; i++) {
      let v = zPoly[i];
      if (v > ML_DSA_Q / 2) v -= ML_DSA_Q;
      const val = gamma1 - v;
      for (let b = 0; b < 20; b++) {
        const bit = (val >> b) & 1;
        out[Math.floor(bitPos / 8)] |= bit << (bitPos % 8);
        bitPos++;
      }
    }
    return out;
  }
}

export function decodeZ(bytes: Uint8Array, gamma1: number): number[] {
  const poly = new Array<number>(256);
  const numBits = gamma1 === 1 << 17 ? 18 : 20;
  let bitPos = 0;
  for (let i = 0; i < 256; i++) {
    let val = 0;
    for (let b = 0; b < numBits; b++) {
      const bit = (bytes[Math.floor(bitPos / 8)] >> (bitPos % 8)) & 1;
      val |= bit << b;
      bitPos++;
    }
    const v = gamma1 - val;
    poly[i] = (v + ML_DSA_Q) % ML_DSA_Q;
  }
  return poly;
}

/**
 * Encode hint vector h
 */
export function encodeH(h: number[][], omega: number): Uint8Array {
  const k = h.length;
  const out = new Uint8Array(omega + k);
  let idx = 0;

  for (let i = 0; i < k; i++) {
    for (let j = 0; j < 256; j++) {
      if (h[i][j] !== 0) {
        out[idx++] = j;
      }
    }
    out[omega + i] = idx;
  }

  return out;
}

export function decodeH(bytes: Uint8Array, k: number, omega: number): number[][] {
  const h: number[][] = [];
  for (let i = 0; i < k; i++) {
    h.push(new Array<number>(256).fill(0));
  }

  let idx = 0;
  for (let i = 0; i < k; i++) {
    const end = bytes[omega + i];
    if (end < idx || end > omega) {
      return []; // Malformed hint
    }
    for (let j = idx; j < end; j++) {
      h[i][bytes[j]] = 1;
    }
    idx = end;
  }

  return h;
}

/**
 * Public key encode
 */
export function pkEncode(params: MlDsaParams, rho: Uint8Array, t1: number[][]): Uint8Array {
  const pk = new Uint8Array(params.pkBytes);
  pk.set(rho, 0);
  let offset = 32;
  for (let i = 0; i < params.k; i++) {
    const t1Bytes = encodeT1(t1[i]);
    pk.set(t1Bytes, offset);
    offset += 320;
  }
  return pk;
}

export function pkDecode(params: MlDsaParams, pk: Uint8Array): { rho: Uint8Array; t1: number[][] } {
  const rho = pk.subarray(0, 32);
  const t1: number[][] = [];
  let offset = 32;
  for (let i = 0; i < params.k; i++) {
    t1.push(decodeT1(pk.subarray(offset, offset + 320)));
    offset += 320;
  }
  return { rho, t1 };
}
