/**
 * Poly1305 One-Time Authenticator (IETF RFC 8439 Section 2.5)
 */

import { POLY1305_PRIME } from './constants';
import { bytesToHex } from '../../utils';
import type { ComputationStep } from '../../types';

/** Clamp the r parameter according to RFC 8439 */
export function clampR(rBytes: Uint8Array): bigint {
  const clamped = new Uint8Array(16);
  clamped.set(rBytes.subarray(0, 16));

  clamped[3] &= 15;
  clamped[7] &= 15;
  clamped[11] &= 15;
  clamped[15] &= 15;

  clamped[4] &= 252;
  clamped[8] &= 252;
  clamped[12] &= 252;

  // Convert 16 bytes to little-endian BigInt
  let r = 0n;
  for (let i = 15; i >= 0; i--) {
    r = (r << 8n) | BigInt(clamped[i] & 0xff);
  }
  return r;
}

/** Convert 16-byte little-endian array to BigInt */
export function bytesToLeBigInt(bytes: Uint8Array): bigint {
  let val = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) {
    val = (val << 8n) | BigInt(bytes[i] & 0xff);
  }
  return val;
}

/** Compute Poly1305 MAC over input data with key (r, s) */
export function poly1305Mac(
  key32: Uint8Array,
  data: Uint8Array,
): { tag: Uint8Array; tagHex: string } {
  const r = clampR(key32.subarray(0, 16));
  const s = bytesToLeBigInt(key32.subarray(16, 32));

  let accumulator = 0n;
  const chunkCount = Math.ceil(data.length / 16);

  for (let i = 0; i < (data.length === 0 ? 0 : chunkCount); i++) {
    const chunk = data.subarray(i * 16, Math.min((i + 1) * 16, data.length));
    // Append 0x01 byte after chunk
    let chunkVal = bytesToLeBigInt(chunk);
    chunkVal += 1n << BigInt(chunk.length * 8);

    accumulator = (accumulator + chunkVal) % POLY1305_PRIME;
    accumulator = (accumulator * r) % POLY1305_PRIME;
  }

  // Final tag = (accumulator + s) mod 2^128
  const tagVal = (accumulator + s) & ((1n << 128n) - 1n);

  const tag = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    tag[i] = Number((tagVal >> BigInt(i * 8)) & 0xffn);
  }

  return { tag, tagHex: bytesToHex(tag) };
}
