/**
 * RSA Arithmetic & Cryptographic Primaries (NIST SP 800-56B, PKCS#1 v2.2)
 * Implements BigInt ModExp, Chinese Remainder Theorem (CRT), Extended Euclidean Algorithm, and PKCS#1 v1.5 padding.
 */

import { bytesToHex, hexToBytes } from '../../utils';
import type { ComputationStep } from '../../types';

export interface EeaStep {
  quotient: string;
  remainder: string;
  u: string;
  v: string;
}

export interface ModExpBitStep {
  bitIndex: number;
  bitValue: number;
  action: 'square' | 'square-and-multiply';
  accumulatorHex: string;
}

/** Extended Euclidean Algorithm: calculates gcd(a, b) and Bezout coefficients */
export function extendedEuclidWithTelemetry(
  a: bigint,
  b: bigint,
): { gcd: bigint; x: bigint; y: bigint; steps: EeaStep[] } {
  let oldR = a;
  let r = b;
  let oldS = 1n;
  let s = 0n;
  let oldT = 0n;
  let t = 1n;

  const steps: EeaStep[] = [];

  while (r !== 0n) {
    const q = oldR / r;
    const rem = oldR - q * r;

    steps.push({
      quotient: q.toString(),
      remainder: rem.toString(),
      u: oldS.toString(),
      v: oldT.toString(),
    });

    oldR = r;
    r = rem;

    const nextS = oldS - q * s;
    oldS = s;
    s = nextS;

    const nextT = oldT - q * t;
    oldT = t;
    t = nextT;
  }

  return { gcd: oldR, x: oldS, y: oldT, steps };
}

/** Modular Inverse: a^(-1) mod m */
export function modInverse(a: bigint, m: bigint): bigint {
  const { gcd, x } = extendedEuclidWithTelemetry(a, m);
  if (gcd !== 1n) {
    throw new Error('Modular inverse does not exist (not coprime)');
  }
  return ((x % m) + m) % m;
}

/** Modular Exponentiation using Square-and-Multiply Algorithm */
export function modPow(
  base: bigint,
  exponent: bigint,
  modulus: bigint,
  maxSampleSteps = 32,
): { result: bigint; bitSteps: ModExpBitStep[] } {
  if (modulus === 1n) return { result: 0n, bitSteps: [] };

  const bitSteps: ModExpBitStep[] = [];
  const expBits = exponent.toString(2);
  let acc = 1n;
  const b = base % modulus;

  // Sample or full step tracking
  const stepInterval = Math.max(1, Math.floor(expBits.length / maxSampleSteps));

  for (let i = 0; i < expBits.length; i++) {
    const bit = parseInt(expBits[i], 10);
    acc = (acc * acc) % modulus;

    let action: 'square' | 'square-and-multiply' = 'square';
    if (bit === 1) {
      acc = (acc * b) % modulus;
      action = 'square-and-multiply';
    }

    if (i % stepInterval === 0 || i === expBits.length - 1) {
      bitSteps.push({
        bitIndex: i,
        bitValue: bit,
        action,
        accumulatorHex: acc.toString(16),
      });
    }
  }

  return { result: acc, bitSteps };
}

/** CRT Accelerated Modular Exponentiation: Garner's Formula */
export function modPowCrt(
  c: bigint,
  p: bigint,
  q: bigint,
  dP: bigint,
  dQ: bigint,
  qInv: bigint,
): {
  result: bigint;
  m1: bigint;
  m2: bigint;
  h: bigint;
} {
  // m1 = c^dP mod p
  const { result: m1 } = modPow(c % p, dP, p);
  // m2 = c^dQ mod q
  const { result: m2 } = modPow(c % q, dQ, q);

  // Garner's Recombination: h = qInv * (m1 - m2) mod p
  let diff = (m1 - m2) % p;
  if (diff < 0n) diff += p;
  const h = (qInv * diff) % p;

  // m = m2 + h * q
  const result = m2 + h * q;

  return { result, m1, m2, h };
}

/** PKCS#1 v1.5 Encryption Padding (RFC 8017 / PKCS#1 v2.2 Section 7.2.1) */
export function pkcs1v15PadEncrypt(data: Uint8Array, keySizeBytes: number): Uint8Array {
  // Length check: data length <= keySizeBytes - 11
  const maxDataLen = keySizeBytes - 11;
  if (data.length > maxDataLen) {
    throw new Error(`Data too long for RSA key size (max ${maxDataLen} bytes, got ${data.length})`);
  }

  const psLen = keySizeBytes - data.length - 3;
  const padded = new Uint8Array(keySizeBytes);

  padded[0] = 0x00;
  padded[1] = 0x02; // Block type 2 (encryption)

  // Pseudo-random non-zero padding string (PS) from a CSPRNG
  const psBytes = new Uint8Array(psLen);
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(psBytes);
  }
  for (let i = 0; i < psLen; i++) {
    // Map 0..255 → 1..255 so that no padding byte is zero (PS must be non-zero)
    padded[2 + i] = (psBytes[i] % 255) + 1;
  }

  padded[2 + psLen] = 0x00;
  padded.set(data, 3 + psLen);

  return padded;
}

/** PKCS#1 v1.5 Encryption Unpadding */
export function pkcs1v15UnpadEncrypt(padded: Uint8Array): Uint8Array {
  if (padded.length < 11 || padded[0] !== 0x00 || padded[1] !== 0x02) {
    // Return raw if not standard PKCS1 padding
    return padded;
  }

  let sepIdx = -1;
  for (let i = 2; i < padded.length; i++) {
    if (padded[i] === 0x00) {
      sepIdx = i;
      break;
    }
  }

  if (sepIdx === -1) return padded;
  return padded.subarray(sepIdx + 1);
}

// SHA-256 DigestInfo Prefix for PKCS#1 v1.5 Signatures (RFC 8017 Section 9.2)
export const SHA256_DIGEST_INFO_PREFIX = hexToBytes(
  '3031300d060960864801650304020105000420'
);

/** PKCS#1 v1.5 Signature Padding: 0x00 || 0x01 || PS (0xFF) || 0x00 || DigestInfo */
export function pkcs1v15PadSign(hash32: Uint8Array, keySizeBytes: number): Uint8Array {
  const digestInfo = new Uint8Array(SHA256_DIGEST_INFO_PREFIX.length + hash32.length);
  digestInfo.set(SHA256_DIGEST_INFO_PREFIX, 0);
  digestInfo.set(hash32, SHA256_DIGEST_INFO_PREFIX.length);

  const psLen = keySizeBytes - digestInfo.length - 3;
  const padded = new Uint8Array(keySizeBytes);

  padded[0] = 0x00;
  padded[1] = 0x01; // Block type 1 (signature)
  for (let i = 0; i < psLen; i++) {
    padded[2 + i] = 0xff;
  }
  padded[2 + psLen] = 0x00;
  padded.set(digestInfo, 3 + psLen);

  return padded;
}

/** Convert BigInt to fixed-length big-endian Uint8Array */
export function bigIntToBytes(val: bigint, lengthBytes: number): Uint8Array {
  const hex = val.toString(16).padStart(lengthBytes * 2, '0');
  const cleanHex = hex.length > lengthBytes * 2 ? hex.slice(-lengthBytes * 2) : hex;
  return hexToBytes(cleanHex);
}

/** Convert big-endian Uint8Array to BigInt */
export function bytesToBigInt(bytes: Uint8Array): bigint {
  return BigInt('0x' + (bytesToHex(bytes) || '0'));
}
