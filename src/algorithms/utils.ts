/**
 * Shared utility functions for algorithm implementations.
 * Handles encoding, binary/hex conversions, and common bitwise operations.
 */

/** Convert a UTF-8 string to a Uint8Array of bytes */
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
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

/** Convert a byte to an 8-bit binary string */
export function byteToBinary(byte: number): string {
  return byte.toString(2).padStart(8, '0');
}

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

/** Right-shift a 32-bit integer by r positions */
export function rightShift32(value: number, r: number): number {
  return value >>> r;
}

/** Left-rotate a 32-bit integer by r positions */
export function leftRotate32(value: number, r: number): number {
  return ((value << r) | (value >>> (32 - r))) >>> 0;
}

/** Add two 32-bit integers with overflow (mod 2^32) */
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
