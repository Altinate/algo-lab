/**
 * Shared utility functions for algorithm implementations.
 * Handles encoding, binary/hex conversions, and common bitwise operations.
 */

/** Convert a UTF-8 string to a Uint8Array of bytes */
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** Convert a byte array to a UTF-8 string */
export function bytesToString(bytes: Uint8Array | number[]): string {
  try {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    return new TextDecoder('utf-8', { fatal: false }).decode(u8);
  } catch {
    return '';
  }
}

/** Convert a byte array to a hex string */
export function bytesToHex(bytes: Uint8Array | number[]): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Convert a hex string to a byte array */
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/** Convert a byte to an 8-bit hex string */
export function uint8ToHex(n: number): string {
  return (n & 0xff).toString(16).padStart(2, '0');
}
export const formatHexByte = uint8ToHex;

/** Convert a hex string to a UTF-8 string */
export function hexToString(hex: string): string {
  try {
    const clean = hex.replace(/\s+/g, '');
    if (clean.length % 2 !== 0) return '';
    const bytes = hexToBytes(clean);
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return '';
  }
}

/** Convert a 16-bit unsigned integer to a 4-char hex string */
export function uint16ToHex(n: number): string {
  return (n & 0xffff).toString(16).padStart(4, '0');
}

/** Convert a byte to an 8-bit binary string */
export function byteToBinary(byte: number): string {
  return byte.toString(2).padStart(8, '0');
}
export const formatBinary = byteToBinary;

/** Convert a byte array to a binary string */
export function bytesToBinary(bytes: Uint8Array | number[]): string {
  return Array.from(bytes)
    .map((b) => byteToBinary(b))
    .join('');
}

/** Convert a 32-bit unsigned integer to a hex string */
export function uint32ToHex(n: number): string {
  return (n >>> 0).toString(16).padStart(8, '0');
}

/** Convert a 32-bit unsigned integer to a 32-bit binary string */
export function uint32ToBinary(n: number): string {
  return (n >>> 0).toString(2).padStart(32, '0');
}

/** Right-rotate a 32-bit integer by r positions */
export function rightRotate32(value: number, r: number): number {
  return ((value >>> r) | (value << (32 - r))) >>> 0;
}
export const rotr32 = rightRotate32;

/** Right-shift a 32-bit integer by r positions */
export function rightShift32(value: number, r: number): number {
  return value >>> r;
}

/** Left-rotate a 32-bit integer by r positions */
export function leftRotate32(value: number, r: number): number {
  return ((value << r) | (value >>> (32 - r))) >>> 0;
}
export const rotl32 = leftRotate32;

/** Add 32-bit integers with overflow (mod 2^32) */
export function add32(...values: number[]): number {
  let sum = 0;
  for (const v of values) {
    sum = (sum + v) >>> 0;
  }
  return sum >>> 0;
}

/**
 * Convert a 64-bit BigInt to a hex string (16 chars).
 * Used by SHA-512 family which operates on 64-bit words.
 */
export function uint64ToHex(n: bigint): string {
  return (n & 0xFFFFFFFFFFFFFFFFn).toString(16).padStart(16, '0');
}

/** Convert a 64-bit BigInt to a 64-bit binary string */
export function uint64ToBinary(n: bigint): string {
  return (n & 0xFFFFFFFFFFFFFFFFn).toString(2).padStart(64, '0');
}

/** Right-rotate a 64-bit BigInt by r positions */
export function rightRotate64(value: bigint, r: number): bigint {
  const mask = 0xFFFFFFFFFFFFFFFFn;
  return ((value >> BigInt(r)) | ((value << BigInt(64 - r)) & mask)) & mask;
}
export const rotr64 = rightRotate64;

/** Left-rotate a 64-bit BigInt by r positions */
export function leftRotate64(value: bigint, r: number): bigint {
  const mask = 0xFFFFFFFFFFFFFFFFn;
  const s = BigInt(r);
  return ((value << s) | (value >> (64n - s))) & mask;
}
export const rotl64 = leftRotate64;

/** Right-shift a 64-bit BigInt by r positions */
export function rightShift64(value: bigint, r: number): bigint {
  return value >> BigInt(r);
}

/** Add 64-bit BigInts with overflow (mod 2^64) */
export function add64(...values: bigint[]): bigint {
  const mask = 0xFFFFFFFFFFFFFFFFn;
  let sum = 0n;
  for (const v of values) {
    sum = (sum + v) & mask;
  }
  return sum;
}

/** Format a hex string into groups of specified size separated by spaces */
export function formatHexGroups(hex: string, groupSize: number = 8): string {
  const groups: string[] = [];
  for (let i = 0; i < hex.length; i += groupSize) {
    groups.push(hex.substring(i, i + groupSize));
  }
  return groups.join(' ');
}

/** Format a binary string into groups of specified size separated by spaces */
export function formatBinaryGroups(binary: string, groupSize: number = 8): string {
  const groups: string[] = [];
  for (let i = 0; i < binary.length; i += groupSize) {
    groups.push(binary.substring(i, i + groupSize));
  }
  return groups.join(' ');
}

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Convert a Uint8Array to standard Base64 string */
export function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;

    result += B64_CHARS[b0 >> 2];
    result += B64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < len ? B64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    result += i + 2 < len ? B64_CHARS[b2 & 63] : '=';
  }
  return result;
}

/** Convert a Base64 or Base64URL string to Uint8Array */
export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[\r\n\s=]/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const lookup = new Uint8Array(256);
  for (let i = 0; i < 64; i++) lookup[B64_CHARS.charCodeAt(i)] = i;

  const len = clean.length;
  const byteLen = Math.floor((len * 3) / 4);
  const bytes = new Uint8Array(byteLen);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const enc1 = lookup[clean.charCodeAt(i)];
    const enc2 = lookup[clean.charCodeAt(i + 1)];
    const enc3 = i + 2 < len ? lookup[clean.charCodeAt(i + 2)] : 0;
    const enc4 = i + 3 < len ? lookup[clean.charCodeAt(i + 3)] : 0;

    if (p < byteLen) bytes[p++] = (enc1 << 2) | (enc2 >> 4);
    if (i + 2 < len && p < byteLen) bytes[p++] = ((enc2 & 15) << 4) | (enc3 >> 2);
    if (i + 3 < len && p < byteLen) bytes[p++] = ((enc3 & 3) << 6) | enc4;
  }
  return bytes.subarray(0, p);
}

/** Convert a Uint8Array to URL-safe Base64URL string */
export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Convert a Base64URL string to Uint8Array */
export function base64UrlToBytes(b64url: string): Uint8Array {
  return base64ToBytes(b64url);
}
