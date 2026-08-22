/**
 * Byte Encoding, Decoding, Compression, and Decompression for ML-KEM (NIST FIPS 203 Section 4.2.1)
 */

import { ML_KEM_Q } from './constants';
import { Poly } from './ntt';

/** Compress_d(x): maps x in Z_q to Z_(2^d) (FIPS 203 Definition 4.5) */
export function compress(x: number, d: number): number {
  const twoPowerD = 1 << d;
  return Math.floor(((x * twoPowerD + (ML_KEM_Q >> 1)) / ML_KEM_Q)) % twoPowerD;
}

/** Decompress_d(y): maps y in Z_(2^d) to Z_q (FIPS 203 Definition 4.6) */
export function decompress(y: number, d: number): number {
  const twoPowerD = 1 << d;
  return Math.floor(((y * ML_KEM_Q + (twoPowerD >> 1)) / twoPowerD));
}

/** Encode 256 12-bit coefficients into 384 bytes (FIPS 203 Algorithm 4: ByteEncode_12) */
export function byteEncode12(f: Poly): Uint8Array {
  const out = new Uint8Array(384);
  for (let i = 0; i < 128; i++) {
    const a = f[2 * i];
    const b = f[2 * i + 1];
    out[3 * i] = a & 0xff;
    out[3 * i + 1] = ((a >> 8) & 0x0f) | ((b & 0x0f) << 4);
    out[3 * i + 2] = (b >> 4) & 0xff;
  }
  return out;
}

/** Decode 384 bytes into 256 12-bit coefficients (FIPS 203 Algorithm 5: ByteDecode_12) */
export function byteDecode12(bytes: Uint8Array): Poly {
  const f = new Array<number>(256);
  for (let i = 0; i < 128; i++) {
    const b0 = bytes[3 * i];
    const b1 = bytes[3 * i + 1];
    const b2 = bytes[3 * i + 2];
    f[2 * i] = b0 | ((b1 & 0x0f) << 8);
    f[2 * i + 1] = (b1 >> 4) | (b2 << 4);
  }
  return f;
}

/** Encode polynomial with d bits per coefficient (ByteEncode_d) */
export function byteEncodeD(f: Poly, d: number): Uint8Array {
  const totalBits = 256 * d;
  const out = new Uint8Array(totalBits / 8);
  let bitPos = 0;

  for (let i = 0; i < 256; i++) {
    const val = f[i] & ((1 << d) - 1);
    for (let bit = 0; bit < d; bit++) {
      const bitVal = (val >> bit) & 1;
      const byteIdx = bitPos >> 3;
      const bitOffset = bitPos & 7;
      out[byteIdx] |= bitVal << bitOffset;
      bitPos++;
    }
  }

  return out;
}

/** Decode bytes to polynomial with d bits per coefficient (ByteDecode_d) */
export function byteDecodeD(bytes: Uint8Array, d: number): Poly {
  const f = new Array<number>(256);
  let bitPos = 0;

  for (let i = 0; i < 256; i++) {
    let val = 0;
    for (let bit = 0; bit < d; bit++) {
      const byteIdx = bitPos >> 3;
      const bitOffset = bitPos & 7;
      const bitVal = (bytes[byteIdx] >> bitOffset) & 1;
      val |= bitVal << bit;
      bitPos++;
    }
    f[i] = val;
  }

  return f;
}
