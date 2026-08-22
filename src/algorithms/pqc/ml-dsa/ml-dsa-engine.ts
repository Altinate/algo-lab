/**
 * NIST FIPS 204 ML-DSA (Module-Lattice Digital Signature Algorithm / CRYSTALS-Dilithium) Engine
 */

import type { ComputationStep } from '../../types';
import {
  ML_DSA_Q,
  ML_DSA_D,
  MlDsaParams,
} from './constants';
import { ntt, nttInv, multiplyNTTs, matVecMulNTT } from './ntt';
import { power2Round, highBits, lowBits, makeHint, useHint } from './rounding';
import { expandA, expandS, expandMask, sampleInBall } from './sampling';
import {
  pkEncode,
  pkDecode,
  encodeT0,
  decodeT0,
  encodeS,
  decodeS,
  encodeZ,
  decodeZ,
  encodeH,
  decodeH,
  encodeT1,
} from './packing';
import { shake256 } from '../ml-kem/sponge';
import { bytesToHex } from '../../utils';

export interface LatticePolynomialStepData {
  [key: string]: unknown;
  stageName: string;
  subTitle?: string;
  matrixRank?: number;
  k?: number;
  l?: number;
  noiseEta?: number;
  gamma1?: number;
  gamma2?: number;
  polynomialCoeffs?: number[];
  matrixSampleA?: number[][];
  noiseHistogram?: number[];
  nttStages?: Array<{
    stage: number;
    len: number;
    butterfliesCount: number;
    sampleValues: number[];
  }>;
  normStats?: {
    zNorm?: number;
    zBound?: number;
    r0Norm?: number;
    r0Bound?: number;
    ct0Norm?: number;
    ct0Bound?: number;
    hintCount?: number;
    hintBound?: number;
    attempts?: number;
    accepted?: boolean;
  };
  sharedKeyHex?: string;
  signatureHex?: string;
  verified?: boolean;
}

function skEncode(
  params: MlDsaParams,
  rho: Uint8Array,
  K: Uint8Array,
  tr: Uint8Array,
  s1: number[][],
  s2: number[][],
  t0: number[][]
): Uint8Array {
  const sk = new Uint8Array(params.skBytes);
  sk.set(rho, 0);
  sk.set(K, 32);
  sk.set(tr, 64);
  let offset = 128;

  const sBytes = params.eta === 2 ? 96 : 128;
  for (let i = 0; i < params.l; i++) {
    sk.set(encodeS(s1[i], params.eta), offset);
    offset += sBytes;
  }
  for (let i = 0; i < params.k; i++) {
    sk.set(encodeS(s2[i], params.eta), offset);
    offset += sBytes;
  }
  for (let i = 0; i < params.k; i++) {
    sk.set(encodeT0(t0[i]), offset);
    offset += 416;
  }
  return sk;
}

function skDecode(params: MlDsaParams, sk: Uint8Array) {
  const rho = sk.subarray(0, 32);
  const K = sk.subarray(32, 64);
  const tr = sk.subarray(64, 128);
  let offset = 128;

  const sBytes = params.eta === 2 ? 96 : 128;
  const s1: number[][] = [];
  for (let i = 0; i < params.l; i++) {
    s1.push(decodeS(sk.subarray(offset, offset + sBytes), params.eta));
    offset += sBytes;
  }
  const s2: number[][] = [];
  for (let i = 0; i < params.k; i++) {
    s2.push(decodeS(sk.subarray(offset, offset + sBytes), params.eta));
    offset += sBytes;
  }
  const t0: number[][] = [];
  for (let i = 0; i < params.k; i++) {
    t0.push(decodeT0(sk.subarray(offset, offset + 416)));
    offset += 416;
  }
  return { rho, K, tr, s1, s2, t0 };
}

function packW1(params: MlDsaParams, w1: number[][]): Uint8Array {
  const is6Bits = params.gamma2 === (ML_DSA_Q - 1) / 88;
  const polyBytes = is6Bits ? 192 : 128;
  const out = new Uint8Array(params.k * polyBytes);

  let offset = 0;
  for (let i = 0; i < params.k; i++) {
    if (is6Bits) {
      for (let j = 0; j < 64; j++) {
        const a0 = w1[i][j * 4 + 0];
        const a1 = w1[i][j * 4 + 1];
        const a2 = w1[i][j * 4 + 2];
        const a3 = w1[i][j * 4 + 3];
        out[offset + j * 3 + 0] = (a0 & 0x3f) | ((a1 & 0x03) << 6);
        out[offset + j * 3 + 1] = ((a1 >> 2) & 0x0f) | ((a2 & 0x0f) << 4);
        out[offset + j * 3 + 2] = ((a2 >> 4) & 0x03) | ((a3 & 0x3f) << 2);
      }
    } else {
      for (let j = 0; j < 128; j++) {
        const a0 = w1[i][j * 2 + 0];
        const a1 = w1[i][j * 2 + 1];
        out[offset + j] = (a0 & 0x0f) | ((a1 & 0x0f) << 4);
      }
    }
    offset += polyBytes;
  }
  return out;
}

function sigEncode(params: MlDsaParams, cTilde: Uint8Array, z: number[][], h: number[][]): Uint8Array {
  const sig = new Uint8Array(params.sigBytes);
  const cBytes = (2 * params.lambda) / 8;
  sig.set(cTilde, 0);
  let offset = cBytes;

  const zBytes = params.gamma1 === 1 << 17 ? 576 : 640;
  for (let i = 0; i < params.l; i++) {
    sig.set(encodeZ(z[i], params.gamma1), offset);
    offset += zBytes;
  }
  sig.set(encodeH(h, params.omega), offset);
  return sig;
}

function sigDecode(params: MlDsaParams, sig: Uint8Array) {
  const cBytes = (2 * params.lambda) / 8;
  const cTilde = sig.subarray(0, cBytes);
  let offset = cBytes;

  const zBytes = params.gamma1 === 1 << 17 ? 576 : 640;
  const z: number[][] = [];
  for (let i = 0; i < params.l; i++) {
    z.push(decodeZ(sig.subarray(offset, offset + zBytes), params.gamma1));
    offset += zBytes;
  }
  const h = decodeH(sig.subarray(offset), params.k, params.omega);
  return { cTilde, z, h };
}

function getZNorm(z: number[][]): number {
  let maxVal = 0;
  for (let i = 0; i < z.length; i++) {
    for (let j = 0; j < 256; j++) {
      let val = z[i][j];
      if (val > ML_DSA_Q / 2) val = ML_DSA_Q - val;
      if (val > maxVal) maxVal = val;
    }
  }
  return maxVal;
}

function getR0Norm(r0: number[][]): number {
  let maxVal = 0;
  for (let i = 0; i < r0.length; i++) {
    for (let j = 0; j < 256; j++) {
      const val = Math.abs(r0[i][j]);
      if (val > maxVal) maxVal = val;
    }
  }
  return maxVal;
}

function getCt0Norm(ct0: number[][]): number {
  let maxVal = 0;
  for (let i = 0; i < ct0.length; i++) {
    for (let j = 0; j < 256; j++) {
      let val = ct0[i][j];
      if (val > ML_DSA_Q / 2) val = ML_DSA_Q - val;
      if (val > maxVal) maxVal = val;
    }
  }
  return maxVal;
}

/**
 * ML-DSA Key Generation (FIPS 204 Algorithm 1)
 */
export function mlDsaKeyGen(
  params: MlDsaParams,
  seed: Uint8Array
): { pk: Uint8Array; sk: Uint8Array; steps: ComputationStep[] } {
  const steps: ComputationStep[] = [];

  const seedInput = new Uint8Array(34);
  seedInput.set(seed, 0);
  seedInput[32] = params.k;
  seedInput[33] = params.l;

  const seedHash = shake256(seedInput, 128);
  const rho = seedHash.subarray(0, 32);
  const sigma = seedHash.subarray(32, 96);
  const K = seedHash.subarray(96, 128);

  steps.push({
    id: 'mldsa-keygen-seed',
    title: 'Seed Expansion (SHAKE256)',
    phase: 'SEED EXPANSION',
    description: `Expanded 32-byte seed ξ into public seed ρ (32B), secret seed σ (64B), and signing key K (32B).`,
    visualizationType: 'lattice-polynomial',
    data: {
      stageName: 'Seed Expansion',
      subTitle: `Domain Separation: k=${params.k}, l=${params.l}`,
      k: params.k,
      l: params.l,
      noiseEta: params.eta,
    } as LatticePolynomialStepData,
  });

  const AHat = expandA(params, rho);
  const matrixSampleA = AHat.map((row) => row.map((poly) => poly[0]));

  steps.push({
    id: 'mldsa-keygen-expand-a',
    title: 'Matrix Generation (ExpandA)',
    phase: 'MATRIX GENERATION',
    description: `Sampled ${params.k}×${params.l} polynomial matrix Â in NTT domain using uniform rejection sampling over SHAKE128(ρ || j || i).`,
    visualizationType: 'lattice-polynomial',
    data: {
      stageName: 'ExpandA Sampling',
      subTitle: `Matrix Â ∈ R_q^{${params.k}×${params.l}}`,
      k: params.k,
      l: params.l,
      matrixSampleA,
      polynomialCoeffs: AHat[0][0],
    } as LatticePolynomialStepData,
  });

  const { s1, s2 } = expandS(params, sigma);

  // Compute bounded noise histogram
  const hist = new Array<number>(2 * params.eta + 1).fill(0);
  for (const poly of s1) {
    for (const coeff of poly) {
      let v = coeff;
      if (v > ML_DSA_Q / 2) v -= ML_DSA_Q;
      hist[v + params.eta]++;
    }
  }

  steps.push({
    id: 'mldsa-keygen-expand-s',
    title: 'Secret Vectors Sampling (ExpandS)',
    phase: 'SECRET SAMPLING',
    description: `Sampled short secret vectors s₁ ∈ [-η, η]^${params.l} and s₂ ∈ [-η, η]^${params.k} with η=${params.eta}.`,
    visualizationType: 'lattice-polynomial',
    data: {
      stageName: 'Secret Key Sampling',
      subTitle: `s₁ ∈ R_q^${params.l}, s₂ ∈ R_q^${params.k} (η=${params.eta})`,
      k: params.k,
      l: params.l,
      noiseEta: params.eta,
      noiseHistogram: hist,
      polynomialCoeffs: s1[0],
    } as LatticePolynomialStepData,
  });

  const s1Hat = s1.map((p) => ntt(p).transformed);
  const As1Hat = matVecMulNTT(AHat, s1Hat);
  const As1 = As1Hat.map((p) => nttInv(p));

  const t: number[][] = [];
  const t1: number[][] = [];
  const t0: number[][] = [];

  for (let i = 0; i < params.k; i++) {
    const tRow: number[] = [];
    const t1Row: number[] = [];
    const t0Row: number[] = [];
    for (let j = 0; j < 256; j++) {
      const val = (As1[i][j] + s2[i][j]) % ML_DSA_Q;
      tRow.push(val);
      const { r1, r0 } = power2Round(val);
      t1Row.push(r1);
      t0Row.push(r0);
    }
    t.push(tRow);
    t1.push(t1Row);
    t0.push(t0Row);
  }

  steps.push({
    id: 'mldsa-keygen-power2round',
    title: 'Power2Round Decomposition',
    phase: 'ROUNDING',
    description: `Decomposed t = Â·s₁ + s₂ into high bits t₁ (10 bits) and low bits t₀ (13 bits) modulo 2^${ML_DSA_D}.`,
    visualizationType: 'lattice-polynomial',
    data: {
      stageName: 'Power2Round',
      subTitle: `t = t₁·2^${ML_DSA_D} + t₀`,
      k: params.k,
      l: params.l,
      polynomialCoeffs: t[0],
    } as LatticePolynomialStepData,
  });

  const pk = pkEncode(params, rho, t1);
  const tr = shake256(pk, 64);
  const sk = skEncode(params, rho, K, tr, s1, s2, t0);

  steps.push({
    id: 'mldsa-keygen-complete',
    title: 'Keypair Generation Complete',
    phase: 'COMPLETE',
    description: `Generated ${params.pkBytes}-byte public key (pk) and ${params.skBytes}-byte secret key (sk).`,
    visualizationType: 'lattice-polynomial',
    data: {
      stageName: 'KeyGen Finalized',
      subTitle: `pk (${params.pkBytes}B), sk (${params.skBytes}B)`,
      k: params.k,
      l: params.l,
      sharedKeyHex: bytesToHex(pk),
    } as LatticePolynomialStepData,
  });

  return { pk, sk, steps };
}

/**
 * ML-DSA Signature Generation (FIPS 204 Algorithm 2)
 */
export function mlDsaSign(
  params: MlDsaParams,
  skBytes: Uint8Array,
  message: Uint8Array,
  context: Uint8Array = new Uint8Array(0),
  deterministic: boolean = true
): { sig: Uint8Array; steps: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  const { rho, K, tr, s1, s2, t0 } = skDecode(params, skBytes);
  const AHat = expandA(params, rho);

  const mPrime = new Uint8Array(2 + context.length + message.length);
  mPrime[0] = 0;
  mPrime[1] = context.length;
  mPrime.set(context, 2);
  mPrime.set(message, 2 + context.length);

  const trMPrime = new Uint8Array(64 + mPrime.length);
  trMPrime.set(tr, 0);
  trMPrime.set(mPrime, 64);
  const mu = shake256(trMPrime, 64);

  const rnd = new Uint8Array(32);
  const kRndMu = new Uint8Array(32 + 32 + 64);
  kRndMu.set(K, 0);
  kRndMu.set(rnd, 32);
  kRndMu.set(mu, 64);
  const rhoPrime = shake256(kRndMu, 64);

  steps.push({
    id: 'mldsa-sign-init',
    title: 'Message Digest & Mask Seed Derivation',
    phase: 'INITIALIZATION',
    description: `Computed message commitment μ = SHAKE256(tr || M') and mask seed ρ' = SHAKE256(K || rnd || μ).`,
    visualizationType: 'lattice-polynomial',
    data: {
      stageName: 'Signing Digest Initialization',
      subTitle: `Context length: ${context.length}B, Message: ${message.length}B`,
      k: params.k,
      l: params.l,
    } as LatticePolynomialStepData,
  });

  const s1Hat = s1.map((p) => ntt(p).transformed);
  const s2Hat = s2.map((p) => ntt(p).transformed);
  const t0Hat = t0.map((p) => ntt(p).transformed);

  let kappa = 0;
  let attempts = 0;

  while (true) {
    attempts++;
    const y = expandMask(params, rhoPrime, kappa);
    kappa += params.l;

    const yHat = y.map((p) => ntt(p).transformed);
    const AyHat = matVecMulNTT(AHat, yHat);
    const w = AyHat.map((p) => nttInv(p));

    const w1: number[][] = [];
    for (let i = 0; i < params.k; i++) {
      w1.push(w[i].map((coeff) => highBits(coeff, 2 * params.gamma2)));
    }

    const w1Packed = packW1(params, w1);
    const muW1 = new Uint8Array(64 + w1Packed.length);
    muW1.set(mu, 0);
    muW1.set(w1Packed, 64);

    const cTilde = shake256(muW1, (2 * params.lambda) / 8);
    const c = sampleInBall(cTilde, params.tau);
    const cHat = ntt(c).transformed;

    const cs1 = s1Hat.map((s) => nttInv(multiplyNTTs(cHat, s)));
    const z: number[][] = [];
    for (let i = 0; i < params.l; i++) {
      z.push(y[i].map((yVal, j) => (yVal + cs1[i][j]) % ML_DSA_Q));
    }

    const zNorm = getZNorm(z);
    if (zNorm >= params.gamma1 - params.beta) {
      continue;
    }

    const cs2 = s2Hat.map((s) => nttInv(multiplyNTTs(cHat, s)));
    const r0: number[][] = [];
    for (let i = 0; i < params.k; i++) {
      r0.push(w[i].map((wVal, j) => lowBits((wVal - cs2[i][j] + ML_DSA_Q) % ML_DSA_Q, 2 * params.gamma2)));
    }

    const r0Norm = getR0Norm(r0);
    if (r0Norm >= params.gamma2 - params.beta) {
      continue;
    }

    const ct0 = t0Hat.map((t) => nttInv(multiplyNTTs(cHat, t)));
    const ct0Norm = getCt0Norm(ct0);
    if (ct0Norm >= params.gamma2) {
      continue;
    }

    const h: number[][] = [];
    let onesCount = 0;
    for (let i = 0; i < params.k; i++) {
      const hRow: number[] = [];
      for (let j = 0; j < 256; j++) {
        const hintBit = makeHint(
          (ML_DSA_Q - ct0[i][j]) % ML_DSA_Q,
          (w[i][j] - cs2[i][j] + ct0[i][j] + ML_DSA_Q) % ML_DSA_Q,
          2 * params.gamma2
        );
        hRow.push(hintBit);
        if (hintBit === 1) onesCount++;
      }
      h.push(hRow);
    }

    if (onesCount > params.omega) {
      continue;
    }

    const sig = sigEncode(params, cTilde, z, h);

    steps.push({
      id: 'mldsa-sign-loop',
      title: 'Rejection Sampling & Norm Verification',
      phase: 'REJECTION SAMPLING',
      description: `Rejection sampling succeeded on iteration ${attempts} with ||z||_∞=${zNorm} < ${params.gamma1 - params.beta}, ||r₀||_∞=${r0Norm} < ${params.gamma2 - params.beta}, and ${onesCount} hint bits.`,
      visualizationType: 'lattice-polynomial',
      data: {
        stageName: 'Rejection Sampling Check',
        subTitle: `Accepted on attempt #${attempts}`,
        k: params.k,
        l: params.l,
        gamma1: params.gamma1,
        gamma2: params.gamma2,
        polynomialCoeffs: z[0],
        normStats: {
          zNorm,
          zBound: params.gamma1 - params.beta,
          r0Norm,
          r0Bound: params.gamma2 - params.beta,
          ct0Norm,
          ct0Bound: params.gamma2,
          hintCount: onesCount,
          hintBound: params.omega,
          attempts,
          accepted: true,
        },
      } as LatticePolynomialStepData,
    });

    steps.push({
      id: 'mldsa-sign-complete',
      title: 'Signature Complete (σ)',
      phase: 'COMPLETE',
      description: `Constructed ${params.sigBytes}-byte post-quantum digital signature σ = (c̃, z, h).`,
      visualizationType: 'lattice-polynomial',
      data: {
        stageName: 'Signature Output',
        subTitle: `Signature size: ${params.sigBytes} bytes`,
        k: params.k,
        l: params.l,
        signatureHex: bytesToHex(sig),
      } as LatticePolynomialStepData,
    });

    return { sig, steps };
  }
}

/**
 * ML-DSA Signature Verification (FIPS 204 Algorithm 3)
 */
export function mlDsaVerify(
  params: MlDsaParams,
  pkBytes: Uint8Array,
  message: Uint8Array,
  sigBytes: Uint8Array,
  context: Uint8Array = new Uint8Array(0)
): { valid: boolean; steps: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  const { rho, t1 } = pkDecode(params, pkBytes);
  const { cTilde, z, h } = sigDecode(params, sigBytes);

  const zNorm = getZNorm(z);
  const zValid = zNorm < params.gamma1 - params.beta;

  let onesCount = 0;
  for (let i = 0; i < h.length; i++) {
    for (let j = 0; j < 256; j++) {
      if (h[i][j] === 1) onesCount++;
    }
  }
  const hValid = onesCount <= params.omega;

  steps.push({
    id: 'mldsa-verify-bounds',
    title: 'Signature Norm & Hint Bounds Check',
    phase: 'BOUNDS CHECK',
    description: `Verified ||z||_∞ = ${zNorm} < ${params.gamma1 - params.beta} (${zValid ? 'PASS' : 'FAIL'}) and hint weight = ${onesCount} ≤ ${params.omega} (${hValid ? 'PASS' : 'FAIL'}).`,
    visualizationType: 'lattice-polynomial',
    data: {
      stageName: 'Norm Bounds Verification',
      subTitle: `||z||_∞ check: ${zValid ? 'PASS' : 'FAIL'}`,
      k: params.k,
      l: params.l,
      polynomialCoeffs: z[0],
      normStats: {
        zNorm,
        zBound: params.gamma1 - params.beta,
        hintCount: onesCount,
        hintBound: params.omega,
        accepted: zValid && hValid,
      },
    } as LatticePolynomialStepData,
  });

  if (!zValid || !hValid) {
    return { valid: false, steps };
  }

  const AHat = expandA(params, rho);
  const tr = shake256(pkBytes, 64);

  const mPrime = new Uint8Array(2 + context.length + message.length);
  mPrime[0] = 0;
  mPrime[1] = context.length;
  mPrime.set(context, 2);
  mPrime.set(message, 2 + context.length);

  const trMPrime = new Uint8Array(64 + mPrime.length);
  trMPrime.set(tr, 0);
  trMPrime.set(mPrime, 64);
  const mu = shake256(trMPrime, 64);

  const c = sampleInBall(cTilde, params.tau);
  const cHat = ntt(c).transformed;

  const zHat = z.map((p) => ntt(p).transformed);
  const AzHat = matVecMulNTT(AHat, zHat);

  const t1Shifted = t1.map((row) => row.map((coeff) => (coeff << ML_DSA_D) % ML_DSA_Q));
  const t1ShiftedHat = t1Shifted.map((row) => ntt(row).transformed);

  const ct1Hat = t1ShiftedHat.map((t) => multiplyNTTs(cHat, t));

  const wApproxHat = AzHat.map((row, i) => row.map((val, j) => (val - ct1Hat[i][j] + ML_DSA_Q) % ML_DSA_Q));
  const wApprox = wApproxHat.map((row) => nttInv(row));

  const w1Prime: number[][] = [];
  for (let i = 0; i < params.k; i++) {
    w1Prime.push(wApprox[i].map((coeff, j) => useHint(h[i][j], coeff, 2 * params.gamma2)));
  }

  const w1PrimePacked = packW1(params, w1Prime);
  const muW1 = new Uint8Array(64 + w1PrimePacked.length);
  muW1.set(mu, 0);
  muW1.set(w1PrimePacked, 64);

  const cTildePrime = shake256(muW1, (2 * params.lambda) / 8);

  let matched = true;
  for (let i = 0; i < cTilde.length; i++) {
    if (cTilde[i] !== cTildePrime[i]) {
      matched = false;
      break;
    }
  }

  steps.push({
    id: 'mldsa-verify-complete',
    title: matched ? 'Signature Verified (VALID)' : 'Signature Rejected (INVALID)',
    phase: 'VERIFICATION',
    description: matched
      ? `Successfully reconstructed high-bits w₁' and verified challenge hash c̃' == c̃.`
      : `Challenge hash mismatch: c̃' ≠ c̃. Signature is invalid or forged.`,
    visualizationType: 'lattice-polynomial',
    data: {
      stageName: 'Verification Result',
      subTitle: matched ? 'SIGNATURE VALID' : 'SIGNATURE REJECTED',
      k: params.k,
      l: params.l,
      verified: matched,
    } as LatticePolynomialStepData,
  });

  return { valid: matched, steps };
}
