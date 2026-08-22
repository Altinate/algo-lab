/**
 * NIST FIPS 203 ML-KEM Core Execution Engine (KeyGen, Encaps, Decaps)
 */

import { ML_KEM_N, ML_KEM_Q, MlKemParams } from './constants';
import { Poly, ntt, nttInv, multiplyNTTs, addPoly, subPoly } from './ntt';
import { sampleNTT, samplePolyCBD } from './cbd';
import { sha3_512, sha3_256, shake256 } from './sponge';
import { compress, decompress, byteEncode12, byteDecode12, byteEncodeD, byteDecodeD } from './compress';
import { bytesToHex, hexToBytes } from '../../utils';
import type { ComputationStep, ComputationResult } from '../../types';

export interface LatticeTelemetryData {
  pipelineStage: 'KeyGen' | 'Encapsulation' | 'Decapsulation';
  kRank: number;
  matrixDims: string;
  seedHex?: string;
  rhoHex?: string;
  sigmaHex?: string;
  polynomialSpectrum?: number[]; // 256 coefficients for active polynomial
  polyLabel?: string;
  nttStages?: Array<{ stage: number; subLength: number }>;
  cbdHistogram?: Record<number, number>;
  ekHex?: string;
  cHex?: string;
  sharedKeyHex?: string;
  decapsMatched?: boolean;
}

/** ML-KEM Key Generation (FIPS 203 Algorithm 19: ML-KEM.KeyGen) */
export function mlKemKeyGen(
  params: MlKemParams,
  seedD: Uint8Array,
  seedZ: Uint8Array,
): { ek: Uint8Array; dk: Uint8Array; steps: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  const k = params.k;

  // 1. (rho, sigma) = G(d)
  const gOut = sha3_512(seedD);
  const rho = gOut.slice(0, 32);
  const sigma = gOut.slice(32, 64);

  steps.push({
    id: 'pqc-keygen-setup',
    title: `${params.name} Module-Lattice Setup & Seed Expansion`,
    phase: 'Lattice Setup',
    description: `Expanded 32-byte seed $d$ via SHA3-512 into matrix seed $\\rho = ${bytesToHex(rho).slice(0, 16)}...$ and noise seed $\\sigma = ${bytesToHex(sigma).slice(0, 16)}...$. Module rank $k = ${k}$.`,
    data: {
      pipelineStage: 'KeyGen',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      seedHex: bytesToHex(seedD),
      rhoHex: bytesToHex(rho),
      sigmaHex: bytesToHex(sigma),
    },
    visualizationType: 'lattice-polynomial',
  });

  // 2. Generate Matrix A_hat (k x k) in NTT domain
  const aHat: Poly[][] = Array.from({ length: k }, () => Array(k));
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      aHat[i][j] = sampleNTT(rho, i, j);
    }
  }

  // 3. Sample secret vector s and error vector e
  let N = 0;
  const s: Poly[] = [];
  const sHat: Poly[] = [];
  let lastHistogram: Record<number, number> = {};

  for (let i = 0; i < k; i++) {
    const { poly, histogram } = samplePolyCBD(sigma, N++, params.eta1);
    s.push(poly);
    lastHistogram = histogram;
    const { transformed } = ntt(poly);
    sHat.push(transformed);
  }

  const e: Poly[] = [];
  const eHat: Poly[] = [];
  for (let i = 0; i < k; i++) {
    const { poly } = samplePolyCBD(sigma, N++, params.eta1);
    e.push(poly);
    const { transformed } = ntt(poly);
    eHat.push(transformed);
  }

  steps.push({
    id: 'pqc-keygen-cbd-sampling',
    title: `Centered Binomial Distribution (CBD η=${params.eta1}) Noise Sampling`,
    phase: 'Noise Sampling',
    description: `Sampled small error polynomials $\\mathbf{s}, \\mathbf{e} \\in \\mathcal{R}_q^k$ from binomial distribution centered at zero.`,
    data: {
      pipelineStage: 'KeyGen',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: s[0],
      polyLabel: 'Secret Polynomial s[0]',
      cbdHistogram: lastHistogram,
    },
    visualizationType: 'lattice-polynomial',
  });

  // 4. t_hat = A_hat * s_hat + e_hat
  const tHat: Poly[] = [];
  for (let i = 0; i < k; i++) {
    let sumPoly = new Array<number>(256).fill(0);
    for (let j = 0; j < k; j++) {
      const prod = multiplyNTTs(aHat[i][j], sHat[j]);
      sumPoly = addPoly(sumPoly, prod);
    }
    tHat.push(addPoly(sumPoly, eHat[i]));
  }

  // 5. Encode ek = ByteEncode_12(t_hat) || rho
  const ek = new Uint8Array(384 * k + 32);
  for (let i = 0; i < k; i++) {
    ek.set(byteEncode12(tHat[i]), i * 384);
  }
  ek.set(rho, 384 * k);

  // 6. Encode dk = ByteEncode_12(s_hat) || ek || H(ek) || z
  const hEk = sha3_256(ek);
  const dk = new Uint8Array(384 * k + ek.length + 32 + 32);
  for (let i = 0; i < k; i++) {
    dk.set(byteEncode12(sHat[i]), i * 384);
  }
  dk.set(ek, 384 * k);
  dk.set(hEk, 384 * k + ek.length);
  dk.set(seedZ, 384 * k + ek.length + 32);

  const { stages } = ntt(s[0]);

  steps.push({
    id: 'pqc-keygen-public-key',
    title: 'Public Key Assembly (t̂ = Â · ŝ + ê mod q)',
    phase: 'Key Assembly',
    description: `Public Encapsulation Key $ek$ (${ek.length} bytes) and Private Decapsulation Key $dk$ (${dk.length} bytes) successfully constructed.`,
    data: {
      pipelineStage: 'KeyGen',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: tHat[0],
      polyLabel: 'Public Key Polynomial t̂[0]',
      nttStages: stages.map((s) => ({ stage: s.stage, subLength: s.subLength })),
      ekHex: bytesToHex(ek).slice(0, 64) + '...',
    },
    visualizationType: 'lattice-polynomial',
  });

  return { ek, dk, steps };
}

/** ML-KEM Encapsulation (FIPS 203 Algorithm 20: ML-KEM.Encaps) */
export function mlKemEncaps(
  params: MlKemParams,
  ek: Uint8Array,
  seedM: Uint8Array,
): { c: Uint8Array; sharedKey: Uint8Array; steps: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  const k = params.k;

  // 1. Decode ek into t_hat and rho
  const tHat: Poly[] = [];
  for (let i = 0; i < k; i++) {
    tHat.push(byteDecode12(ek.slice(i * 384, (i + 1) * 384)));
  }
  const rho = ek.slice(384 * k, 384 * k + 32);

  // 2. (K, r) = G(m || H(ek))
  const hEk = sha3_256(ek);
  const mWithHEk = new Uint8Array(seedM.length + 32);
  mWithHEk.set(seedM, 0);
  mWithHEk.set(hEk, seedM.length);

  const gOut = sha3_512(mWithHEk);
  const sharedKey = gOut.slice(0, 32);
  const r = gOut.slice(32, 64);

  // 3. Generate Transposed Matrix A_hat^T
  const aHatT: Poly[][] = Array.from({ length: k }, () => Array(k));
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      aHatT[i][j] = sampleNTT(rho, j, i);
    }
  }

  // 4. Sample r_noise, e1, e2
  let N = 0;
  const rNoise: Poly[] = [];
  const rHat: Poly[] = [];
  for (let i = 0; i < k; i++) {
    const { poly } = samplePolyCBD(r, N++, params.eta1);
    rNoise.push(poly);
    const { transformed } = ntt(poly);
    rHat.push(transformed);
  }

  const e1: Poly[] = [];
  for (let i = 0; i < k; i++) {
    const { poly } = samplePolyCBD(r, N++, params.eta2);
    e1.push(poly);
  }

  const { poly: e2 } = samplePolyCBD(r, N++, params.eta2);

  // 5. u = NTT^-1(A_hat^T * r_hat) + e1
  const u: Poly[] = [];
  for (let i = 0; i < k; i++) {
    let sumPoly = new Array<number>(256).fill(0);
    for (let j = 0; j < k; j++) {
      const prod = multiplyNTTs(aHatT[i][j], rHat[j]);
      sumPoly = addPoly(sumPoly, prod);
    }
    const inv = nttInv(sumPoly);
    u.push(addPoly(inv, e1[i]));
  }

  // 6. v = NTT^-1(t_hat^T * r_hat) + e2 + Decompress_q(Decode_1(m))
  let tProdSum = new Array<number>(256).fill(0);
  for (let i = 0; i < k; i++) {
    const prod = multiplyNTTs(tHat[i], rHat[i]);
    tProdSum = addPoly(tProdSum, prod);
  }
  const tInv = nttInv(tProdSum);

  // Decompress message bits m into polynomial
  const mu = byteDecodeD(seedM, 1);
  const muDecomp = new Array<number>(256);
  for (let i = 0; i < 256; i++) {
    muDecomp[i] = decompress(mu[i], 1);
  }

  const v = addPoly(addPoly(tInv, e2), muDecomp);

  // 7. Compress ciphertext c = (Compress_du(u), Compress_dv(v))
  const uCompressed: Poly[] = [];
  for (let i = 0; i < k; i++) {
    const comp = new Array<number>(256);
    for (let j = 0; j < 256; j++) {
      comp[j] = compress(u[i][j], params.du);
    }
    uCompressed.push(comp);
  }

  const vCompressed = new Array<number>(256);
  for (let i = 0; i < 256; i++) {
    vCompressed[i] = compress(v[i], params.dv);
  }

  // Byte encode c
  const cBytesU = 32 * params.du * k;
  const cBytesV = 32 * params.dv;
  const c = new Uint8Array(cBytesU + cBytesV);

  for (let i = 0; i < k; i++) {
    c.set(byteEncodeD(uCompressed[i], params.du), i * 32 * params.du);
  }
  c.set(byteEncodeD(vCompressed, params.dv), cBytesU);

  steps.push({
    id: 'pqc-encaps-derivation',
    title: `${params.name} Ciphertext Encapsulation (c = u || v)`,
    phase: 'Encapsulation',
    description: `Derived 256-bit Post-Quantum Shared Key $K = ${bytesToHex(sharedKey).slice(0, 32)}...$ and packed ${c.length}-byte ciphertext.`,
    data: {
      pipelineStage: 'Encapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: vCompressed,
      polyLabel: 'Encapsulated Ciphertext Polynomial v',
      cHex: bytesToHex(c).slice(0, 64) + '...',
      sharedKeyHex: bytesToHex(sharedKey),
    },
    visualizationType: 'lattice-polynomial',
  });

  return { c, sharedKey, steps };
}

/** ML-KEM Decapsulation (FIPS 203 Algorithm 21: ML-KEM.Decaps) */
export function mlKemDecaps(
  params: MlKemParams,
  dk: Uint8Array,
  c: Uint8Array,
): { sharedKey: Uint8Array; steps: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  const k = params.k;

  // Parse dk: s_hat (384 * k), ek, hEk (32), z (32)
  const sHat: Poly[] = [];
  for (let i = 0; i < k; i++) {
    sHat.push(byteDecode12(dk.slice(i * 384, (i + 1) * 384)));
  }
  const ekLen = 384 * k + 32;
  const ek = dk.slice(384 * k, 384 * k + ekLen);
  const hEk = dk.slice(384 * k + ekLen, 384 * k + ekLen + 32);
  const z = dk.slice(384 * k + ekLen + 32, 384 * k + ekLen + 64);

  // Parse c: u_compressed and v_compressed
  const cBytesU = 32 * params.du * k;
  const u: Poly[] = [];
  for (let i = 0; i < k; i++) {
    const comp = byteDecodeD(c.slice(i * 32 * params.du, (i + 1) * 32 * params.du), params.du);
    const decomp = new Array<number>(256);
    for (let j = 0; j < 256; j++) {
      decomp[j] = decompress(comp[j], params.du);
    }
    u.push(decomp);
  }

  const vComp = byteDecodeD(c.slice(cBytesU), params.dv);
  const v = new Array<number>(256);
  for (let i = 0; i < 256; i++) {
    v[i] = decompress(vComp[i], params.dv);
  }

  // m' = Compress_1(v - NTT^-1(s_hat^T * NTT(u)))
  let sProdSum = new Array<number>(256).fill(0);
  for (let i = 0; i < k; i++) {
    const { transformed: uHat } = ntt(u[i]);
    const prod = multiplyNTTs(sHat[i], uHat);
    sProdSum = addPoly(sProdSum, prod);
  }
  const sInv = nttInv(sProdSum);
  const diff = subPoly(v, sInv);

  const mPrimeBits = new Array<number>(256);
  for (let i = 0; i < 256; i++) {
    mPrimeBits[i] = compress(diff[i], 1);
  }
  const mPrime = byteEncodeD(mPrimeBits, 1);

  // (K', r') = G(m' || hEk)
  const mPrimeWithHEk = new Uint8Array(mPrime.length + 32);
  mPrimeWithHEk.set(mPrime, 0);
  mPrimeWithHEk.set(hEk, mPrime.length);
  const gOutPrime = sha3_512(mPrimeWithHEk);
  const kPrime = gOutPrime.slice(0, 32);

  // Constant-time check: Re-encrypt and verify c' == c
  const { c: cPrime } = mlKemEncaps(params, ek, mPrime);
  let equal = true;
  for (let i = 0; i < c.length; i++) {
    if (c[i] !== cPrime[i]) equal = false;
  }

  const finalSharedKey = equal ? kPrime : shake256(new Uint8Array([...z, ...c]), 32);

  steps.push({
    id: 'pqc-decaps-inversion',
    title: `${params.name} Lattice Inversion & Shared Key Recovery`,
    phase: 'Decapsulation',
    description: `Decapsulated ciphertext via NTT inner product and error rounding. Shared secret verification: ${
      equal ? 'VALID (MATCHED ORIGINAL SHARED KEY)' : 'IMPLICIT REJECTION (INVALID)'
    }.`,
    data: {
      pipelineStage: 'Decapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: diff,
      polyLabel: 'Reconstructed Message Polynomial m′',
      sharedKeyHex: bytesToHex(finalSharedKey),
      decapsMatched: equal,
    },
    visualizationType: 'lattice-polynomial',
  });

  return { sharedKey: finalSharedKey, steps };
}
