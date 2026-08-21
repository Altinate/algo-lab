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
 * σ₀(x) = ROTR²(x) ⊕ ROTR¹³(x) ⊕ SHR¹⁰(x)
 *
 * "Small sigma" functions mix bits to create diffusion in the message schedule.
 */
export function sigma0(x: number): number {
  return (rightRotate32(x, 7) ^ rightRotate32(x, 18) ^ rightShift32(x, 3)) >>> 0;
}

/**
 * σ₁ (lowercase sigma 1) — used in message schedule expansion for W[16..63].
 * σ₁(x) = ROTR¹⁷(x) ⊕ ROTR¹⁹(x) ⊕ SHR¹⁰(x)
 */
export function sigma1(x: number): number {
  return (rightRotate32(x, 17) ^ rightRotate32(x, 19) ^ rightShift32(x, 10)) >>> 0;
}

// ─── Compression Round Functions ───────────────────────────────────────

/**
 * Σ₀ (uppercase Sigma 0) — used in compression rounds to compute T2.
 * Σ₀(a) = ROTR²(a) ⊕ ROTR¹³(a) ⊕ ROTR²²(a)
 *
 * "Big Sigma" functions provide non-linear mixing of working variables.
 */
export function bigSigma0(x: number): number {
  return (rightRotate32(x, 2) ^ rightRotate32(x, 13) ^ rightRotate32(x, 22)) >>> 0;
}

/**
 * Σ₁ (uppercase Sigma 1) — used in compression rounds to compute T1.
 * Σ₁(e) = ROTR⁶(e) ⊕ ROTR¹¹(e) ⊕ ROTR²⁵(e)
 */
export function bigSigma1(x: number): number {
  return (rightRotate32(x, 6) ^ rightRotate32(x, 11) ^ rightRotate32(x, 25)) >>> 0;
}

/**
 * Ch (Choice) — for each bit position, if e=1 pick f, else pick g.
 * Ch(e, f, g) = (e AND f) XOR (NOT e AND g)
 *
 * This is equivalent to a multiplexer: e selects between f and g.
 */
export function ch(e: number, f: number, g: number): number {
  return ((e & f) ^ (~e & g)) >>> 0;
}

/**
 * Maj (Majority) — for each bit position, output the majority of a, b, c.
 * Maj(a, b, c) = (a AND b) XOR (a AND c) XOR (b AND c)
 *
 * If at least 2 of the 3 bits are 1, output 1. Otherwise output 0.
 */
export function maj(a: number, b: number, c: number): number {
  return ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
}
