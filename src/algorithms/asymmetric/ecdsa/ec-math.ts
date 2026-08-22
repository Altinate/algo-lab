/**
 * Elliptic Curve Arithmetic Primaries (Weierstrass curves y^2 = x^3 + ax + b mod p)
 * Implements Affine Point Addition, Doubling, Scalar Multiplication, and Double-and-Add telemetry.
 */

import { EllipticCurve } from './constants';
import { modInverse } from '../rsa/rsa-math';

export interface Point {
  x: bigint;
  y: bigint;
  infinity?: boolean;
}

export const POINT_AT_INFINITY: Point = {
  x: 0n,
  y: 0n,
  infinity: true,
};

export interface EcScalarStep {
  bitIndex: number;
  bitValue: number;
  operation: 'double' | 'double-and-add';
  currentPointHex: { x: string; y: string };
}

/** Check if point is on curve */
export function isOnCurve(P: Point, curve: EllipticCurve): boolean {
  if (P.infinity) return true;
  const p = curve.p;
  const left = (P.y * P.y) % p;
  const right = (P.x * P.x * P.x + curve.a * P.x + curve.b) % p;
  const normalizedLeft = ((left % p) + p) % p;
  const normalizedRight = ((right % p) + p) % p;
  return normalizedLeft === normalizedRight;
}

/** Point Doubling: 2P on Weierstrass curve */
export function pointDouble(P: Point, curve: EllipticCurve): Point {
  if (P.infinity || P.y === 0n) return POINT_AT_INFINITY;
  const p = curve.p;

  // lambda = (3*x^2 + a) / (2*y) mod p
  const num = (3n * P.x * P.x + curve.a) % p;
  const den = (2n * P.y) % p;
  const lambda = (num * modInverse(den, p)) % p;

  // x3 = lambda^2 - 2*x mod p
  let x3 = (lambda * lambda - 2n * P.x) % p;
  if (x3 < 0n) x3 += p;

  // y3 = lambda*(x - x3) - y mod p
  let y3 = (lambda * (P.x - x3) - P.y) % p;
  if (y3 < 0n) y3 += p;

  return { x: x3, y: y3, infinity: false };
}

/** Point Addition: P + Q on Weierstrass curve */
export function pointAdd(P: Point, Q: Point, curve: EllipticCurve): Point {
  if (P.infinity) return Q;
  if (Q.infinity) return P;

  const p = curve.p;

  if (P.x === Q.x) {
    if (P.y === Q.y) {
      return pointDouble(P, curve);
    }
    // P.y == -Q.y mod p -> Point at infinity
    return POINT_AT_INFINITY;
  }

  // lambda = (Q.y - P.y) / (Q.x - P.x) mod p
  let num = (Q.y - P.y) % p;
  if (num < 0n) num += p;
  let den = (Q.x - P.x) % p;
  if (den < 0n) den += p;

  const lambda = (num * modInverse(den, p)) % p;

  // x3 = lambda^2 - P.x - Q.x mod p
  let x3 = (lambda * lambda - P.x - Q.x) % p;
  if (x3 < 0n) x3 += p;

  // y3 = lambda*(P.x - x3) - P.y mod p
  let y3 = (lambda * (P.x - x3) - P.y) % p;
  if (y3 < 0n) y3 += p;

  return { x: x3, y: y3, infinity: false };
}

/** Scalar Multiplication: k * P using Double-and-Add Algorithm */
export function scalarMultiply(
  k: bigint,
  P: Point,
  curve: EllipticCurve,
  maxSampleSteps = 24,
): { result: Point; scalarSteps: EcScalarStep[] } {
  if (k === 0n || P.infinity) return { result: POINT_AT_INFINITY, scalarSteps: [] };

  const scalarSteps: EcScalarStep[] = [];
  const kBits = k.toString(2);
  let R: Point = POINT_AT_INFINITY;

  const stepInterval = Math.max(1, Math.floor(kBits.length / maxSampleSteps));

  for (let i = 0; i < kBits.length; i++) {
    const bit = parseInt(kBits[i], 10);
    R = pointDouble(R, curve);

    let operation: 'double' | 'double-and-add' = 'double';
    if (bit === 1) {
      R = pointAdd(R, P, curve);
      operation = 'double-and-add';
    }

    if (i % stepInterval === 0 || i === kBits.length - 1) {
      scalarSteps.push({
        bitIndex: i,
        bitValue: bit,
        operation,
        currentPointHex: {
          x: R.x.toString(16),
          y: R.y.toString(16),
        },
      });
    }
  }

  return { result: R, scalarSteps };
}
