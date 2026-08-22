/**
 * Diffie-Hellman & ECDH Key Exchange Execution Engine (RFC 3526, NIST SP 800-56A)
 */

import {
  DH_MODP_2048_PRIME,
  DH_MODP_2048_GENERATOR,
  DH_ALICE_PRIVATE,
  DH_BOB_PRIVATE,
  ECDH_SECP256K1_ALICE_PRIV,
  ECDH_SECP256K1_BOB_PRIV,
  ECDH_P256_ALICE_PRIV,
  ECDH_P256_BOB_PRIV,
} from './constants';
import { CURVE_SECP256K1, CURVE_NIST_P256, EllipticCurve } from '../ecdsa/constants';
import { Point, scalarMultiply } from '../ecdsa/ec-math';
import { modPow, bigIntToBytes } from '../rsa/rsa-math';
import { bytesToHex } from '../../utils';
import type { ComputationStep, ComputationResult } from '../../types';

export interface DhOptions {
  alicePrivHex?: string;
  bobPrivHex?: string;
}

/** Execute RFC 3526 MODP Group 14 (2048-bit) Classic Diffie-Hellman Key Exchange */
export function executeDhModp2048(
  _input?: string,
  options?: DhOptions,
): ComputationResult {
  const steps: ComputationStep[] = [];
  const p = DH_MODP_2048_PRIME;
  const g = DH_MODP_2048_GENERATOR;

  let a = DH_ALICE_PRIVATE;
  let b = DH_BOB_PRIVATE;

  if (options?.alicePrivHex) {
    a = BigInt('0x' + options.alicePrivHex.replace(/\s+/g, '')) % p;
  }
  if (options?.bobPrivHex) {
    b = BigInt('0x' + options.bobPrivHex.replace(/\s+/g, '')) % p;
  }

  // Step 1: Domain Parameters
  steps.push({
    id: 'dh-domain-params',
    title: 'RFC 3526 MODP Group 14 Domain Parameters',
    phase: 'Group Setup',
    description: `2048-bit Safe Prime $p = 2^{2048} - 2^{1984} - 1 + 2^{64}(\\lfloor 2^{1918}\\pi \\rfloor + 124476)$. Generator $g = ${g}$.`,
    data: {
      protocolType: 'MODP-2048',
      pHex: p.toString(16),
      gHex: g.toString(16),
      aHex: a.toString(16),
      bHex: b.toString(16),
    },
    visualizationType: 'key-exchange',
  });

  // Step 2: Public Key Generation
  // Alice: A = g^a mod p
  const { result: A, bitSteps: aSteps } = modPow(g, a, p);
  // Bob: B = g^b mod p
  const { result: B, bitSteps: bSteps } = modPow(g, b, p);

  steps.push({
    id: 'dh-keygen',
    title: 'Two-Party Ephemeral Key Generation (A = gᵃ mod p, B = gᵇ mod p)',
    phase: 'Key Generation',
    description: `Alice computed public key $A = g^a \\bmod p$. Bob computed public key $B = g^b \\bmod p$.`,
    data: {
      protocolType: 'MODP-2048',
      aHex: a.toString(16),
      bHex: b.toString(16),
      AHex: A.toString(16),
      BHex: B.toString(16),
      aBitSteps: aSteps,
      bBitSteps: bSteps,
    },
    visualizationType: 'key-exchange',
  });

  // Step 3: Public Channel Exchange
  steps.push({
    id: 'dh-channel-transfer',
    title: 'Public Channel Key Transfer (Alice ⇆ Bob)',
    phase: 'Public Exchange',
    description: `Alice transmits $A$ to Bob. Bob transmits $B$ to Alice over untrusted network.`,
    data: {
      protocolType: 'MODP-2048',
      transferAtoB: A.toString(16),
      transferBtoA: B.toString(16),
    },
    visualizationType: 'key-exchange',
  });

  // Step 4: Shared Secret Derivation
  // Alice: S_A = B^a mod p
  const { result: Sa } = modPow(B, a, p);
  // Bob: S_B = A^b mod p
  const { result: Sb } = modPow(A, b, p);

  const matched = Sa === Sb;

  steps.push({
    id: 'dh-shared-secret',
    title: 'Shared Secret Agreement (S = Bᵃ ≡ Aᵇ ≡ gᵃᵇ mod p)',
    phase: 'Secret Derivation',
    description: `Alice computed $S_A = B^a \\bmod p$. Bob computed $S_B = A^b \\bmod p$. Agreement status: ${
      matched ? 'IDENTICAL SHARED SECRET ESTABLISHED.' : 'SECRET MISMATCH.'
    }`,
    data: {
      protocolType: 'MODP-2048',
      SaHex: Sa.toString(16),
      SbHex: Sb.toString(16),
      sharedSecretHex: Sa.toString(16),
      matched,
    },
    visualizationType: 'key-exchange',
  });

  const secretHex = Sa.toString(16).padStart(512, '0');

  return {
    digest: secretHex,
    tagValid: matched,
    steps,
  };
}

/** Execute Elliptic Curve Diffie-Hellman (ECDH) Key Exchange */
export function executeEcdh(
  curve: EllipticCurve,
  defaultAlicePriv: bigint,
  defaultBobPriv: bigint,
  _input?: string,
  options?: DhOptions,
): ComputationResult {
  const steps: ComputationStep[] = [];
  const G: Point = { x: curve.Gx, y: curve.Gy, infinity: false };

  let dA = defaultAlicePriv;
  let dB = defaultBobPriv;

  if (options?.alicePrivHex) {
    dA = BigInt('0x' + options.alicePrivHex.replace(/\s+/g, '')) % curve.n;
  }
  if (options?.bobPrivHex) {
    dB = BigInt('0x' + options.bobPrivHex.replace(/\s+/g, '')) % curve.n;
  }

  // Step 1: Curve Parameters
  steps.push({
    id: 'ecdh-curve-params',
    title: `${curve.name} Domain Parameters & Setup`,
    phase: 'Curve Setup',
    description: `Weierstrass Curve: $y^2 \\equiv x^3 + ${curve.a === 0n ? '' : `${curve.a}x + `}${curve.b} \\pmod p$. Generator Base Point $G$.`,
    data: {
      protocolType: 'ECDH',
      curveName: curve.name,
      pHex: curve.p.toString(16),
      aHex: curve.a.toString(16),
      bHex: curve.b.toString(16),
      nHex: curve.n.toString(16),
      GxHex: curve.Gx.toString(16),
      GyHex: curve.Gy.toString(16),
      dAHex: dA.toString(16),
      dBHex: dB.toString(16),
    },
    visualizationType: 'key-exchange',
  });

  // Step 2: Public Points Generation
  // Alice: QA = dA * G
  const { result: QA, scalarSteps: aScalarSteps } = scalarMultiply(dA, G, curve);
  // Bob: QB = dB * G
  const { result: QB, scalarSteps: bScalarSteps } = scalarMultiply(dB, G, curve);

  steps.push({
    id: 'ecdh-point-gen',
    title: 'Two-Party Public Point Multiplication (Q_A = d_A · G, Q_B = d_B · G)',
    phase: 'Point Generation',
    description: `Alice multiplied $G$ by scalar $d_A \\implies Q_A = (x_A, y_A)$. Bob multiplied $G$ by scalar $d_B \\implies Q_B = (x_B, y_B)$.`,
    data: {
      protocolType: 'ECDH',
      curveName: curve.name,
      dAHex: dA.toString(16),
      dBHex: dB.toString(16),
      QAxHex: QA.x.toString(16),
      QAyHex: QA.y.toString(16),
      QBxHex: QB.x.toString(16),
      QByHex: QB.y.toString(16),
      aScalarSteps,
      bScalarSteps,
    },
    visualizationType: 'key-exchange',
  });

  // Step 3: Public Channel Exchange
  steps.push({
    id: 'ecdh-point-exchange',
    title: 'Public Channel Point Transfer (Q_A ⇆ Q_B)',
    phase: 'Public Exchange',
    description: `Alice transmits $Q_A$ to Bob. Bob transmits $Q_B$ to Alice over untrusted network.`,
    data: {
      protocolType: 'ECDH',
      transferAtoB: `(${QA.x.toString(16).slice(0, 16)}..., ${QA.y.toString(16).slice(0, 16)}...)`,
      transferBtoA: `(${QB.x.toString(16).slice(0, 16)}..., ${QB.y.toString(16).slice(0, 16)}...)`,
    },
    visualizationType: 'key-exchange',
  });

  // Step 4: Shared Secret Derivation
  // Alice: S_A = dA * QB
  const { result: SA } = scalarMultiply(dA, QB, curve);
  // Bob: S_B = dB * QA
  const { result: SB } = scalarMultiply(dB, QA, curve);

  const matched = !SA.infinity && !SB.infinity && SA.x === SB.x && SA.y === SB.y;
  const sharedKeyHex = SA.x.toString(16).padStart(64, '0');

  steps.push({
    id: 'ecdh-shared-secret',
    title: 'ECDH Shared Secret Point Agreement (S = d_A · Q_B ≡ d_B · Q_A)',
    phase: 'Secret Derivation',
    description: `Alice evaluated $S_A = d_A \\cdot Q_B$. Bob evaluated $S_B = d_B \\cdot Q_A$. Derived identical shared coordinate: $S_x = ${sharedKeyHex.slice(0, 32)}...$`,
    data: {
      protocolType: 'ECDH',
      curveName: curve.name,
      SAxHex: SA.x.toString(16),
      SAyHex: SA.y.toString(16),
      SBxHex: SB.x.toString(16),
      SByHex: SB.y.toString(16),
      sharedSecretHex: sharedKeyHex,
      matched,
    },
    visualizationType: 'key-exchange',
  });

  return {
    digest: sharedKeyHex,
    tagValid: matched,
    steps,
  };
}
