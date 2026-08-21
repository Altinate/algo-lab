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

const mask = 0xFFFFFFFFFFFFFFFFn;

/** Ch(x, y, z) = (x AND y) XOR ((NOT x) AND z) */
export function ch64(x: bigint, y: bigint, z: bigint): bigint {
  return ((x & y) ^ ((~x & mask) & z)) & mask;
}

/** Maj(x, y, z) = (x AND y) XOR (x AND z) XOR (y AND z) */
export function maj64(x: bigint, y: bigint, z: bigint): bigint {
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

/** Detailed breakdown for σ₀(x) */
export function sigma0Breakdown64(x: bigint) {
  const rot1 = rightRotate64(x, 1);
  const rot8 = rightRotate64(x, 8);
  const shr7 = rightShift64(x, 7);
  return {
    rot1,
    rot8,
    shr7,
    result: rot1 ^ rot8 ^ shr7,
  };
}

/** Detailed breakdown for σ₁(x) */
export function sigma1Breakdown64(x: bigint) {
  const rot19 = rightRotate64(x, 19);
  const rot61 = rightRotate64(x, 61);
  const shr6 = rightShift64(x, 6);
  return {
    rot19,
    rot61,
    shr6,
    result: rot19 ^ rot61 ^ shr6,
  };
}

/** Detailed breakdown for Σ₀(x) */
export function bigSigma0Breakdown64(x: bigint) {
  const rot28 = rightRotate64(x, 28);
  const rot34 = rightRotate64(x, 34);
  const rot39 = rightRotate64(x, 39);
  return {
    rot28,
    rot34,
    rot39,
    result: rot28 ^ rot34 ^ rot39,
  };
}

/** Detailed breakdown for Σ₁(x) */
export function bigSigma1Breakdown64(x: bigint) {
  const rot14 = rightRotate64(x, 14);
  const rot18 = rightRotate64(x, 18);
  const rot41 = rightRotate64(x, 41);
  return {
    rot14,
    rot18,
    rot41,
    result: rot14 ^ rot18 ^ rot41,
  };
}

/** Detailed breakdown for Ch(x, y, z) */
export function chBreakdown64(x: bigint, y: bigint, z: bigint) {
  const xAndY = (x & y) & mask;
  const notXAndZ = ((~x & mask) & z) & mask;
  return {
    xAndY,
    notXAndZ,
    result: (xAndY ^ notXAndZ) & mask,
  };
}

/** Detailed breakdown for Maj(x, y, z) */
export function majBreakdown64(x: bigint, y: bigint, z: bigint) {
  const xAndY = (x & y) & mask;
  const xAndZ = (x & z) & mask;
  const yAndZ = (y & z) & mask;
  return {
    xAndY,
    xAndZ,
    yAndZ,
    result: (xAndY ^ xAndZ ^ yAndZ) & mask,
  };
}
