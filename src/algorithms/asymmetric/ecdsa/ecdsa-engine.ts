/**
 * ECDSA Signing & Verification Engine (NIST FIPS 186-5, SECG SEC 2)
 */

import { EccKeyPair, CURVE_SECP256K1, CURVE_NIST_P256 } from './constants';
import {
  Point,
  pointAdd,
  scalarMultiply,
  isOnCurve,
  EcScalarStep,
} from './ec-math';
import { modInverse } from '../rsa/rsa-math';
import { sha256Plugin } from '../../sha256';
import { hexToBytes, bytesToHex } from '../../utils';
import type { ComputationStep, ComputationResult } from '../../types';

export type EcdsaOperation = 'sign' | 'verify';

export interface EcdsaOptions {
  signatureHex?: string; // 128-char hex (r || s, 64 bytes)
  kNonceHex?: string;
  publicKeyHex?: { x: string; y: string };
}

export function executeEcdsa(
  input: string,
  keyPair: EccKeyPair,
  operation: EcdsaOperation,
  options?: EcdsaOptions,
): ComputationResult {
  const steps: ComputationStep[] = [];
  const curve = keyPair.curve;
  const G: Point = { x: curve.Gx, y: curve.Gy, infinity: false };
  const Q: Point = { x: keyPair.Qx, y: keyPair.Qy, infinity: false };

  // Step 1: Curve Parameters & Public Key
  steps.push({
    id: 'ecdsa-curve-params',
    title: `${curve.name} Domain Parameters & Key Setup`,
    phase: 'Curve Setup',
    description: `Weierstrass Curve: $y^2 \\equiv x^3 + ${curve.a === 0n ? '' : `${curve.a}x + `}${curve.b} \\pmod p$. Generator Base Point $G$ (order $n$). Public Key $Q = d \\cdot G$.`,
    data: {
      curveName: curve.name,
      pHex: curve.p.toString(16),
      aHex: curve.a.toString(16),
      bHex: curve.b.toString(16),
      nHex: curve.n.toString(16),
      GxHex: curve.Gx.toString(16),
      GyHex: curve.Gy.toString(16),
      QxHex: keyPair.Qx.toString(16),
      QyHex: keyPair.Qy.toString(16),
      dHex: keyPair.d.toString(16),
    },
    visualizationType: 'ecc-point',
  });

  const message = input || 'CryptoScope Elliptic Curve Audit';
  const hashResult = sha256Plugin.compute(message);
  const z = BigInt('0x' + hashResult.digest) % curve.n;

  // Step 2: Message Digest
  steps.push({
    id: 'ecdsa-message-hash',
    title: 'Message SHA-256 Digest Computation',
    phase: 'Hash Preprocessing',
    description: `Hashed input payload with SHA-256: $z = H(M) = ${hashResult.digest}$. Truncated to scalar $z \\in \\mathbb{Z}_n^*$.`,
    data: {
      message,
      hashHex: hashResult.digest,
      zHex: z.toString(16),
    },
    visualizationType: 'ecc-point',
  });

  if (operation === 'sign') {
    // SIGN: (r, s)
    let k = keyPair.standardK || 0xa6e3c57dd01abe90086538398355dd4c3b17aa873382b0f150b5711a393240a6n;
    if (options?.kNonceHex) {
      k = BigInt('0x' + options.kNonceHex.replace(/\s+/g, '')) % curve.n;
    }

    // Ephemeral Point R = k * G
    const { result: R, scalarSteps: rScalarSteps } = scalarMultiply(k, G, curve);
    const r = R.x % curve.n;

    steps.push({
      id: 'ecdsa-ephemeral-point',
      title: 'Ephemeral Nonce Scalar Point (R = k · G)',
      phase: 'Point Multiplication',
      description: `Multiplied base point $G$ by secret nonce $k$. Ephemeral point $R = (x_1, y_1)$. Derived signature coordinate $r = x_1 \\bmod n = ${r.toString(16).slice(0, 24)}...$`,
      data: {
        kHex: k.toString(16),
        RxHex: R.x.toString(16),
        RyHex: R.y.toString(16),
        rHex: r.toString(16),
        scalarSteps: rScalarSteps,
      },
      visualizationType: 'ecc-point',
    });

    // Signature equation: s = k^(-1) * (z + r * d) mod n
    const kInv = modInverse(k, curve.n);
    const s = (kInv * (z + r * keyPair.d)) % curve.n;

    const rHex = r.toString(16).padStart(64, '0');
    const sHex = s.toString(16).padStart(64, '0');
    const sigHex = rHex + sHex;

    steps.push({
      id: 'ecdsa-signature-eval',
      title: 'Signature Equation Evaluation (s = k⁻¹(z + r·d) mod n)',
      phase: 'Signature Generation',
      description: `Evaluated signature second component: $s = k^{-1}(z + r \\cdot d) \\bmod n$. Assembled final 64-byte signature $(r, s)$.`,
      data: {
        kInvHex: kInv.toString(16),
        rHex,
        sHex,
        sigHex,
      },
      visualizationType: 'ecc-point',
    });

    return { digest: sigHex, steps };
  } else {
    // VERIFY: check r == (u1 * G + u2 * Q).x mod n
    let r: bigint;
    let s: bigint;

    const cleanSig = (options?.signatureHex || '').replace(/\s+/g, '');
    if (cleanSig.length >= 128) {
      r = BigInt('0x' + cleanSig.slice(0, 64)) % curve.n;
      s = BigInt('0x' + cleanSig.slice(64, 128)) % curve.n;
    } else {
      // Default self-sign to verify standard vector
      const k = keyPair.standardK || 0xa6e3c57dd01abe90086538398355dd4c3b17aa873382b0f150b5711a393240a6n;
      const { result: R } = scalarMultiply(k, G, curve);
      r = R.x % curve.n;
      const kInv = modInverse(k, curve.n);
      s = (kInv * (z + r * keyPair.d)) % curve.n;
    }

    // w = s^(-1) mod n
    const w = modInverse(s, curve.n);
    // u1 = z * w mod n
    const u1 = (z * w) % curve.n;
    // u2 = r * w mod n
    const u2 = (r * w) % curve.n;

    // Linear point combination: P = u1 * G + u2 * Q
    const { result: u1G, scalarSteps: u1Steps } = scalarMultiply(u1, G, curve);
    const { result: u2Q, scalarSteps: u2Steps } = scalarMultiply(u2, Q, curve);
    const P = pointAdd(u1G, u2Q, curve);

    const recoveredX = P.x % curve.n;
    const isValid = !P.infinity && recoveredX === r;

    steps.push({
      id: 'ecdsa-verify-decomp',
      title: 'Verification Inversion & Multipliers (w = s⁻¹ mod n, u₁, u₂)',
      phase: 'Multiplier Derivation',
      description: `Inverted signature scalar $w = s^{-1} \\bmod n$. Computed curve multipliers: $u_1 = z \\cdot w \\bmod n = ${u1.toString(16).slice(0, 16)}...$, $u_2 = r \\cdot w \\bmod n = ${u2.toString(16).slice(0, 16)}...$`,
      data: {
        rHex: r.toString(16).padStart(64, '0'),
        sHex: s.toString(16).padStart(64, '0'),
        wHex: w.toString(16),
        u1Hex: u1.toString(16),
        u2Hex: u2.toString(16),
      },
      visualizationType: 'ecc-point',
    });

    steps.push({
      id: 'ecdsa-verify-combination',
      title: 'Curve Linear Combination (P = u₁·G + u₂·Q)',
      phase: 'Point Verification',
      description: `Evaluated linear point combination $P = u_1 G + u_2 Q = (x_1, y_1)$. Compared recovered coordinate $x_1 \\bmod n$ against signature coordinate $r$.${
        isValid ? ' MATCH: SIGNATURE VALID.' : ' MISMATCH: SIGNATURE INVALID.'
      }`,
      data: {
        u1GxHex: u1G.x.toString(16),
        u1GyHex: u1G.y.toString(16),
        u2QxHex: u2Q.x.toString(16),
        u2QyHex: u2Q.y.toString(16),
        PxHex: P.x.toString(16),
        PyHex: P.y.toString(16),
        recoveredXHex: recoveredX.toString(16).padStart(64, '0'),
        expectedRHex: r.toString(16).padStart(64, '0'),
        isValid,
      },
      visualizationType: 'ecc-point',
    });

    return {
      digest: isValid ? 'VALID (AUTHENTIC)' : 'INVALID (FORGED)',
      tagValid: isValid,
      steps,
    };
  }
}
