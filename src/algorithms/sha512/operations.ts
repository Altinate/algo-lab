import { rightRotate64, rightShift64 } from '../utils';

/**
 * SHA-512 Operations
 * Operating on 64-bit words (using BigInt).
 * 
 * ROTR amounts: 
 * σ₀ (sigma0): 1, 8, 7
 * σ₁ (sigma1): 19, 61, 6
 * Σ₀ (bigSigma0): 28, 34, 39
 * Σ₁ (bigSigma1): 14, 18, 41
 */

/** Ch(x, y, z) = (x AND y) XOR ((NOT x) AND z) */
export function ch64(x: bigint, y: bigint, z: bigint): bigint {
  const mask = 0xFFFFFFFFFFFFFFFFn;
  return ((x & y) ^ ((~x & mask) & z)) & mask;
}

/** Maj(x, y, z) = (x AND y) XOR (x AND z) XOR (y AND z) */
export function maj64(x: bigint, y: bigint, z: bigint): bigint {
  const mask = 0xFFFFFFFFFFFFFFFFn;
  return ((x & y) ^ (x & z) ^ (y & z)) & mask;
}

/** Σ₀(x) = ROTR(x, 28) XOR ROTR(x, 34) XOR ROTR(x, 39) */
export function bigSigma0_64(x: bigint): bigint {
  return rightRotate64(x, 28) ^ rightRotate64(x, 34) ^ rightRotate64(x, 39);
}

/** Σ₁(x) = ROTR(x, 14) XOR ROTR(x, 18) XOR ROTR(x, 41) */
export function bigSigma1_64(x: bigint): bigint {
  return rightRotate64(x, 14) ^ rightRotate64(x, 18) ^ rightRotate64(x, 41);
}

/** σ₀(x) = ROTR(x, 1) XOR ROTR(x, 8) XOR SHR(x, 7) */
export function sigma0_64(x: bigint): bigint {
  return rightRotate64(x, 1) ^ rightRotate64(x, 8) ^ rightShift64(x, 7);
}

/** σ₁(x) = ROTR(x, 19) XOR ROTR(x, 61) XOR SHR(x, 6) */
export function sigma1_64(x: bigint): bigint {
  return rightRotate64(x, 19) ^ rightRotate64(x, 61) ^ rightShift64(x, 6);
}
