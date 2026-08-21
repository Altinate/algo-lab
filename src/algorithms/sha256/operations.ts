/**
 * SHA-256 Bitwise Operations
 *
 * These are the core bitwise functions used in SHA-256's message schedule
 * expansion and compression rounds. Each function is pure and operates
 * on 32-bit unsigned integers.
 */

import { rightRotate32, rightShift32 } from '../utils';

// ─── Message Schedule Functions ────────────────────────────────────────

/**
 * σ₀ (lowercase sigma 0) — used in message schedule expansion for W[16..63].
 * σ₀(x) = ROTR⁷(x) ⊕ ROTR¹⁸(x) ⊕ SHR³(x)
 */
export function sigma0(x: number): number {
  return (rightRotate32(x, 7) ^ rightRotate32(x, 18) ^ rightShift32(x, 3)) >>> 0;
}

export function sigma0Breakdown(x: number) {
  const rot7 = rightRotate32(x, 7);
  const rot18 = rightRotate32(x, 18);
  const shr3 = rightShift32(x, 3);
  const result = (rot7 ^ rot18 ^ shr3) >>> 0;
  return { input: x, rot7, rot18, shr3, result };
}

/**
 * σ₁ (lowercase sigma 1) — used in message schedule expansion for W[16..63].
 * σ₁(x) = ROTR¹⁷(x) ⊕ ROTR¹⁹(x) ⊕ SHR¹⁰(x)
 */
export function sigma1(x: number): number {
  return (rightRotate32(x, 17) ^ rightRotate32(x, 19) ^ rightShift32(x, 10)) >>> 0;
}

export function sigma1Breakdown(x: number) {
  const rot17 = rightRotate32(x, 17);
  const rot19 = rightRotate32(x, 19);
  const shr10 = rightShift32(x, 10);
  const result = (rot17 ^ rot19 ^ shr10) >>> 0;
  return { input: x, rot17, rot19, shr10, result };
}

// ─── Compression Round Functions ───────────────────────────────────────

/**
 * Σ₀ (uppercase Sigma 0) — used in compression rounds to compute T2.
 * Σ₀(a) = ROTR²(a) ⊕ ROTR¹³(a) ⊕ ROTR²²(a)
 */
export function bigSigma0(x: number): number {
  return (rightRotate32(x, 2) ^ rightRotate32(x, 13) ^ rightRotate32(x, 22)) >>> 0;
}

export function bigSigma0Breakdown(a: number) {
  const rot2 = rightRotate32(a, 2);
  const rot13 = rightRotate32(a, 13);
  const rot22 = rightRotate32(a, 22);
  const result = (rot2 ^ rot13 ^ rot22) >>> 0;
  return { input: a, rot2, rot13, rot22, result };
}

/**
 * Σ₁ (uppercase Sigma 1) — used in compression rounds to compute T1.
 * Σ₁(e) = ROTR⁶(e) ⊕ ROTR¹¹(e) ⊕ ROTR²⁵(e)
 */
export function bigSigma1(x: number): number {
  return (rightRotate32(x, 6) ^ rightRotate32(x, 11) ^ rightRotate32(x, 25)) >>> 0;
}

export function bigSigma1Breakdown(e: number) {
  const rot6 = rightRotate32(e, 6);
  const rot11 = rightRotate32(e, 11);
  const rot25 = rightRotate32(e, 25);
  const result = (rot6 ^ rot11 ^ rot25) >>> 0;
  return { input: e, rot6, rot11, rot25, result };
}

/**
 * Ch (Choice) — for each bit position, if e=1 pick f, else pick g.
 * Ch(e, f, g) = (e AND f) XOR (NOT e AND g)
 */
export function ch(e: number, f: number, g: number): number {
  return ((e & f) ^ (~e & g)) >>> 0;
}

export function chBreakdown(e: number, f: number, g: number) {
  const eAndF = (e & f) >>> 0;
  const notEAndG = ((~e) & g) >>> 0;
  const result = (eAndF ^ notEAndG) >>> 0;
  return { e, f, g, eAndF, notEAndG, result };
}

/**
 * Maj (Majority) — for each bit position, output the majority of a, b, c.
 * Maj(a, b, c) = (a AND b) XOR (a AND c) XOR (b AND c)
 */
export function maj(a: number, b: number, c: number): number {
  return ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
}

export function majBreakdown(a: number, b: number, c: number) {
  const aAndB = (a & b) >>> 0;
  const aAndC = (a & c) >>> 0;
  const bAndC = (b & c) >>> 0;
  const result = (aAndB ^ aAndC ^ bAndC) >>> 0;
  return { a, b, c, aAndB, aAndC, bAndC, result };
}
