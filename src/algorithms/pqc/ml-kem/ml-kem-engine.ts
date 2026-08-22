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

  // Generate 256-element seed spectrum from rho and sigma bytes to avoid placeholder
  const seedSpectrum = new Array<number>(256);
  for (let i = 0; i < 256; i++) {
    seedSpectrum[i] = (rho[i % 32] * 7 + sigma[i % 32] * 3) % ML_KEM_Q;
  }

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
      polynomialSpectrum: seedSpectrum,
      polyLabel: 'Seed Hash Spectrum G(d) = (ρ || σ)',
    },
    visualizationType: 'lattice-polynomial',
  });

  // 2. Generate Matrix A_hat (k x k) in NTT domain - step per row
  const aHat: Poly[][] = Array.from({ length: k }, () => Array(k));
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      aHat[i][j] = sampleNTT(rho, i, j);
    }
    steps.push({
      id: `pqc-keygen-matrix-row-${i}`,
      title: `${params.name} Matrix Row Â[${i}, :] Generation (SampleNTT)`,
      phase: 'Matrix Generation',
      description: `Sampled row ${i} of polynomial matrix $\\hat{\\mathbf{A}} \\in \\mathcal{R}_q^{${k} \\times ${k}}$ in NTT domain using rejection sampling over SHAKE128($\\rho \\parallel ${i} \\parallel j$).`,
      data: {
        pipelineStage: 'KeyGen',
        kRank: k,
        matrixDims: `${k} × ${k}`,
        polynomialSpectrum: aHat[i][0],
        polyLabel: `Matrix Element Â[${i}, 0] (NTT domain)`,
        rhoHex: bytesToHex(rho),
      },
      visualizationType: 'lattice-polynomial',
    });
  }

  // 3. Sample secret vector s and error vector e
  let N = 0;
  const s: Poly[] = [];
  const sHat: Poly[] = [];
  const sStagesList: Array<ReturnType<typeof ntt>['stages']> = [];

  for (let i = 0; i < k; i++) {
    const { poly, histogram } = samplePolyCBD(sigma, N++, params.eta1);
    s.push(poly);
    const { transformed, stages } = ntt(poly);
    sHat.push(transformed);
    sStagesList.push(stages);

    steps.push({
      id: `pqc-keygen-cbd-s-${i}`,
      title: `Secret Polynomial s[${i}] Sampling (CBD η₁=${params.eta1})`,
      phase: 'Noise Sampling',
      description: `Sampled secret polynomial $\\mathbf{s}[${i}] \\in \\mathcal{R}_q$ from Centered Binomial Distribution $\\mathrm{CBD}_{${params.eta1}}(\\mathrm{PRF}(\\sigma, ${N - 1}))$.`,
      data: {
        pipelineStage: 'KeyGen',
        kRank: k,
        matrixDims: `${k} × ${k}`,
        polynomialSpectrum: poly,
        polyLabel: `Secret Noise Polynomial s[${i}]`,
        cbdHistogram: histogram,
        noiseEta: params.eta1,
      },
      visualizationType: 'lattice-polynomial',
    });
  }

  const e: Poly[] = [];
  const eHat: Poly[] = [];
  let lastEHistogram: Record<number, number> = {};
  for (let i = 0; i < k; i++) {
    const { poly, histogram } = samplePolyCBD(sigma, N++, params.eta1);
    e.push(poly);
    lastEHistogram = histogram;
    const { transformed } = ntt(poly);
    eHat.push(transformed);
  }

  steps.push({
    id: 'pqc-keygen-cbd-e',
    title: `Error Vector ê Sampling (${k} polynomials, CBD η₁=${params.eta1})`,
    phase: 'Noise Sampling',
    description: `Sampled ${k} error polynomials $\\mathbf{e} \\in \\mathcal{R}_q^k$ from binomial distribution $\\mathrm{CBD}_{${params.eta1}}$ and transformed to NTT domain $\\hat{\\mathbf{e}}$.`,
    data: {
      pipelineStage: 'KeyGen',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: e[0],
      polyLabel: 'Error Noise Polynomial e[0]',
      cbdHistogram: lastEHistogram,
      noiseEta: params.eta1,
    },
    visualizationType: 'lattice-polynomial',
  });

  // 4. NTT Forward Stage Inspection
  steps.push({
    id: 'pqc-keygen-ntt-stages',
    title: `Forward NTT Butterfly Stages (s[0] → ŝ[0])`,
    phase: 'NTT Algebra',
    description: `Computed 7-stage Cooley-Tukey butterfly transform converting $\\mathbf{s}[0]$ into NTT domain $\\hat{\\mathbf{s}}[0]$ modulo $q=3329$.`,
    data: {
      pipelineStage: 'KeyGen',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: sHat[0],
      polyLabel: 'NTT Domain Secret ŝ[0]',
      nttStages: sStagesList[0].map((st) => ({ stage: st.stage, subLength: st.subLength })),
    },
    visualizationType: 'lattice-polynomial',
  });

  // 5. t_hat = A_hat * s_hat + e_hat
  const tHat: Poly[] = [];
  for (let i = 0; i < k; i++) {
    let sumPoly = new Array<number>(256).fill(0);
    for (let j = 0; j < k; j++) {
      const prod = multiplyNTTs(aHat[i][j], sHat[j]);
      sumPoly = addPoly(sumPoly, prod);
    }
    const tHatI = addPoly(sumPoly, eHat[i]);
    tHat.push(tHatI);

    steps.push({
      id: `pqc-keygen-t-comp-${i}`,
      title: `Matrix-Vector Product Row ${i}: t̂[${i}] = (Â · ŝ + ê)[${i}]`,
      phase: 'NTT Algebra',
      description: `Computed row ${i} public key component $\\hat{\\mathbf{t}}[${i}] = \\sum_{j=0}^{${k-1}} \\hat{\\mathbf{A}}[${i}][j] \\circ \\hat{\\mathbf{s}}[j] + \\hat{\\mathbf{e}}[${i}] \\pmod{q}$.`,
      data: {
        pipelineStage: 'KeyGen',
        kRank: k,
        matrixDims: `${k} × ${k}`,
        polynomialSpectrum: tHatI,
        polyLabel: `Public Key Polynomial t̂[${i}]`,
      },
      visualizationType: 'lattice-polynomial',
    });
  }

  // 6. Encode ek = ByteEncode_12(t_hat) || rho
  const ek = new Uint8Array(384 * k + 32);
  for (let i = 0; i < k; i++) {
    ek.set(byteEncode12(tHat[i]), i * 384);
  }
  ek.set(rho, 384 * k);

  // 7. Encode dk = ByteEncode_12(s_hat) || ek || H(ek) || z
  const hEk = sha3_256(ek);
  const dk = new Uint8Array(384 * k + ek.length + 32 + 32);
  for (let i = 0; i < k; i++) {
    dk.set(byteEncode12(sHat[i]), i * 384);
  }
  dk.set(ek, 384 * k);
  dk.set(hEk, 384 * k + ek.length);
  dk.set(seedZ, 384 * k + ek.length + 32);

  steps.push({
    id: 'pqc-keygen-public-key',
    title: `${params.name} Keypair Generation Complete (ek, dk)`,
    phase: 'Key Assembly',
    description: `Public Encapsulation Key $ek$ (${ek.length} bytes) and Private Decapsulation Key $dk$ (${dk.length} bytes) successfully constructed.`,
    data: {
      pipelineStage: 'KeyGen',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: tHat[0],
      polyLabel: 'Public Key Polynomial t̂[0]',
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

  // Decompress message bits m into polynomial muDecomp for spectrum display
  const mu = byteDecodeD(seedM, 1);
  const muDecomp = new Array<number>(256);
  for (let i = 0; i < 256; i++) {
    muDecomp[i] = decompress(mu[i], 1);
  }

  steps.push({
    id: 'pqc-encaps-seed',
    title: `${params.name} Message Hash & Seed Derivation (G(m ‖ H(ek)))`,
    phase: 'Lattice Setup',
    description: `Hashed message $m$ (${seedM.length} bytes) and public key digest $H(ek)$ via SHA3-512 into shared key candidate $K = ${bytesToHex(sharedKey).slice(0, 16)}...$ and randomness $r$.`,
    data: {
      pipelineStage: 'Encapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      seedHex: bytesToHex(seedM),
      sharedKeyHex: bytesToHex(sharedKey),
      polynomialSpectrum: muDecomp,
      polyLabel: 'Decompressed Message Polynomial μ = Decompress₁(m)',
    },
    visualizationType: 'lattice-polynomial',
  });

  // 3. Generate Transposed Matrix A_hat^T (step per row)
  const aHatT: Poly[][] = Array.from({ length: k }, () => Array(k));
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      aHatT[i][j] = sampleNTT(rho, j, i);
    }
    steps.push({
      id: `pqc-encaps-matrix-row-${i}`,
      title: `Transposed Matrix Row Âᵀ[${i}, :] Generation (SampleNTT)`,
      phase: 'Matrix Generation',
      description: `Regenerated row ${i} of transposed matrix $\\hat{\\mathbf{A}}^T$ from public key seed $\\rho$.`,
      data: {
        pipelineStage: 'Encapsulation',
        kRank: k,
        matrixDims: `${k} × ${k}`,
        polynomialSpectrum: aHatT[i][0],
        polyLabel: `Transposed Matrix Element Âᵀ[${i}, 0]`,
        rhoHex: bytesToHex(rho),
      },
      visualizationType: 'lattice-polynomial',
    });
  }

  // 4. Sample r_noise, e1, e2
  let N = 0;
  const rNoise: Poly[] = [];
  const rHat: Poly[] = [];
  const rStagesList: Array<ReturnType<typeof ntt>['stages']> = [];
  let lastRHist: Record<number, number> = {};

  for (let i = 0; i < k; i++) {
    const { poly, histogram } = samplePolyCBD(r, N++, params.eta1);
    rNoise.push(poly);
    lastRHist = histogram;
    const { transformed, stages } = ntt(poly);
    rHat.push(transformed);
    rStagesList.push(stages);
  }

  steps.push({
    id: 'pqc-encaps-cbd-r',
    title: `Ephemeral Noise Sampling r (${k} polynomials, CBD η₁=${params.eta1})`,
    phase: 'Noise Sampling',
    description: `Sampled ${k} ephemeral noise polynomials $\\mathbf{r} \\in \\mathcal{R}_q^k$ from binomial distribution $\\mathrm{CBD}_{${params.eta1}}$.`,
    data: {
      pipelineStage: 'Encapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: rNoise[0],
      polyLabel: 'Ephemeral Noise Polynomial r[0]',
      cbdHistogram: lastRHist,
      noiseEta: params.eta1,
    },
    visualizationType: 'lattice-polynomial',
  });

  const e1: Poly[] = [];
  for (let i = 0; i < k; i++) {
    const { poly } = samplePolyCBD(r, N++, params.eta2);
    e1.push(poly);
  }
  const { poly: e2 } = samplePolyCBD(r, N++, params.eta2);

  steps.push({
    id: 'pqc-encaps-cbd-e',
    title: `Error Perturbation Sampling (e₁, e₂, CBD η₂=${params.eta2})`,
    phase: 'Noise Sampling',
    description: `Sampled error vectors $\\mathbf{e}_1 \\in \\mathcal{R}_q^k$ and scalar error $e_2 \\in \\mathcal{R}_q$ from $\\mathrm{CBD}_{${params.eta2}}$.`,
    data: {
      pipelineStage: 'Encapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: e1[0],
      polyLabel: 'Perturbation Error e₁[0]',
      noiseEta: params.eta2,
    },
    visualizationType: 'lattice-polynomial',
  });

  // 5. NTT Transform of r
  steps.push({
    id: 'pqc-encaps-ntt-r',
    title: `Forward NTT on Ephemeral Noise (NTT(r[0]) → r̂[0])`,
    phase: 'NTT Algebra',
    description: `Transformed ephemeral noise polynomial $\\mathbf{r}[0]$ to NTT domain $\\hat{\\mathbf{r}}[0]$.`,
    data: {
      pipelineStage: 'Encapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: rHat[0],
      polyLabel: 'NTT Ephemeral Polynomial r̂[0]',
      nttStages: rStagesList[0].map((st) => ({ stage: st.stage, subLength: st.subLength })),
    },
    visualizationType: 'lattice-polynomial',
  });

  // 6. u = NTT^-1(A_hat^T * r_hat) + e1
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

  steps.push({
    id: 'pqc-encaps-u-comp',
    title: `Ciphertext Vector Computation (u = NTT⁻¹(Âᵀ · r̂) + e₁)`,
    phase: 'NTT Algebra',
    description: `Computed vector $\\mathbf{u} = \\mathrm{NTT}^{-1}(\\hat{\\mathbf{A}}^T \\circ \\hat{\\mathbf{r}}) + \\mathbf{e}_1 \\in \\mathcal{R}_q^k$.`,
    data: {
      pipelineStage: 'Encapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: u[0],
      polyLabel: 'Uncompressed Ciphertext Vector u[0]',
    },
    visualizationType: 'lattice-polynomial',
  });

  // 7. v = NTT^-1(t_hat^T * r_hat) + e2 + Decompress_q(Decode_1(m))
  let tProdSum = new Array<number>(256).fill(0);
  for (let i = 0; i < k; i++) {
    const prod = multiplyNTTs(tHat[i], rHat[i]);
    tProdSum = addPoly(tProdSum, prod);
  }
  const tInv = nttInv(tProdSum);
  const v = addPoly(addPoly(tInv, e2), muDecomp);

  steps.push({
    id: 'pqc-encaps-v-comp',
    title: `Message Modulation (v = NTT⁻¹(t̂ᵀ · r̂) + e₂ + μ mod q)`,
    phase: 'NTT Algebra',
    description: `Embedded 256-bit message into lattice polynomial $v = \\mathrm{NTT}^{-1}(\\hat{\\mathbf{t}}^T \\circ \\hat{\\mathbf{r}}) + e_2 + \\mathrm{Decompress}_1(m) \\pmod{q}$.`,
    data: {
      pipelineStage: 'Encapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: v,
      polyLabel: 'Modulated Ciphertext Scalar v',
    },
    visualizationType: 'lattice-polynomial',
  });

  // 8. Compress ciphertext c = (Compress_du(u), Compress_dv(v))
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

  steps.push({
    id: 'pqc-encaps-compression',
    title: `Ciphertext Coefficient Compression (dᵤ=${params.du}, dᵥ=${params.dv})`,
    phase: 'Rounding',
    description: `Compressed coefficients: $\\mathbf{u}$ rounded to ${params.du} bits, $v$ rounded to ${params.dv} bits for transmission efficiency.`,
    data: {
      pipelineStage: 'Encapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: vCompressed,
      polyLabel: 'Compressed Ciphertext Polynomial v (dv bits)',
    },
    visualizationType: 'lattice-polynomial',
  });

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
    title: `${params.name} Ciphertext Encapsulation Complete (c = u ‖ v)`,
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

  steps.push({
    id: 'pqc-decaps-parse',
    title: `${params.name} Decapsulation Key & Ciphertext Parse`,
    phase: 'Lattice Setup',
    description: `Loaded secret key components: $\\hat{\\mathbf{s}} \\in \\mathcal{R}_q^k$ (${384 * k} bytes), public key $ek$ (${ek.length} bytes), $H(ek)$, and rejection seed $z$.`,
    data: {
      pipelineStage: 'Decapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: sHat[0],
      polyLabel: 'Secret Key Polynomial ŝ[0] (NTT domain)',
      cHex: bytesToHex(c).slice(0, 64) + '...',
    },
    visualizationType: 'lattice-polynomial',
  });

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

  steps.push({
    id: 'pqc-decaps-decomp-u',
    title: `Ciphertext Vector Decompression (Decompress_{d_u}(u))`,
    phase: 'Rounding',
    description: `Decompressed ${cBytesU} bytes of ciphertext vector $\\mathbf{u}$ from $d_u=${params.du}$ bits per coefficient back to $\\mathbb{Z}_q$.`,
    data: {
      pipelineStage: 'Decapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: u[0],
      polyLabel: 'Decompressed Ciphertext Vector u[0]',
    },
    visualizationType: 'lattice-polynomial',
  });

  const cBytesV = 32 * params.dv;
  const vComp = byteDecodeD(c.slice(cBytesU), params.dv);
  const v = new Array<number>(256);
  for (let i = 0; i < 256; i++) {
    v[i] = decompress(vComp[i], params.dv);
  }

  steps.push({
    id: 'pqc-decaps-decomp-v',
    title: `Ciphertext Scalar Decompression (Decompress_{d_v}(v))`,
    phase: 'Rounding',
    description: `Decompressed ${cBytesV} bytes of ciphertext scalar $v$ from $d_v=${params.dv}$ bits per coefficient back to $\\mathbb{Z}_q$.`,
    data: {
      pipelineStage: 'Decapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: v,
      polyLabel: 'Decompressed Ciphertext Scalar v',
    },
    visualizationType: 'lattice-polynomial',
  });

  // Forward NTT on u
  const uHatList: Poly[] = [];
  const uStagesList: Array<ReturnType<typeof ntt>['stages']> = [];
  let sProdSum = new Array<number>(256).fill(0);
  for (let i = 0; i < k; i++) {
    const { transformed: uHat, stages } = ntt(u[i]);
    uHatList.push(uHat);
    uStagesList.push(stages);
    const prod = multiplyNTTs(sHat[i], uHat);
    sProdSum = addPoly(sProdSum, prod);
  }

  steps.push({
    id: 'pqc-decaps-ntt-u',
    title: `Forward NTT on Ciphertext (NTT(u[0]) → û[0])`,
    phase: 'NTT Algebra',
    description: `Transformed decompressed vector $\\mathbf{u}[0]$ into NTT domain $\\hat{\\mathbf{u}}[0]$ across 7 butterfly stages.`,
    data: {
      pipelineStage: 'Decapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: uHatList[0],
      polyLabel: 'NTT Ciphertext Polynomial û[0]',
      nttStages: uStagesList[0].map((st) => ({ stage: st.stage, subLength: st.subLength })),
    },
    visualizationType: 'lattice-polynomial',
  });

  const sInv = nttInv(sProdSum);

  steps.push({
    id: 'pqc-decaps-inner-prod',
    title: `Lattice Inner Product & Inverse NTT (sInv = NTT⁻¹(ŝᵀ · û))`,
    phase: 'NTT Algebra',
    description: `Computed dot product in NTT domain $\\hat{\\mathbf{s}}^T \\circ \\hat{\\mathbf{u}} = \\sum_{i=0}^{${k-1}} \\hat{\\mathbf{s}}[i] \\circ \\hat{\\mathbf{u}}[i]$ and transformed back via $\\mathrm{NTT}^{-1}$.`,
    data: {
      pipelineStage: 'Decapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: sInv,
      polyLabel: 'Lattice Projection sInv = NTT⁻¹(ŝᵀ · û)',
    },
    visualizationType: 'lattice-polynomial',
  });

  const diff = subPoly(v, sInv);

  steps.push({
    id: 'pqc-decaps-diff',
    title: `Noisy Message Extraction (diff = v − sInv mod q)`,
    phase: 'NTT Algebra',
    description: `Subtracted lattice projection: $\\mathrm{diff} = v - \\mathbf{s}^T \\mathbf{u} \\approx \\mathrm{Decompress}_1(m) + \\mathrm{noise} \\pmod{q}$.`,
    data: {
      pipelineStage: 'Decapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: diff,
      polyLabel: 'Noisy Extracted Message diff = v − sInv',
    },
    visualizationType: 'lattice-polynomial',
  });

  const mPrimeBits = new Array<number>(256);
  for (let i = 0; i < 256; i++) {
    mPrimeBits[i] = compress(diff[i], 1);
  }
  const mPrime = byteEncodeD(mPrimeBits, 1);

  // Scaled binary message polynomial for heatmap
  const mPrimePoly = mPrimeBits.map((b) => (b === 1 ? 1664 : 0));

  steps.push({
    id: 'pqc-decaps-rounding',
    title: `1-Bit Error Rounding & Message Recovery (m′ = Compress₁(diff))`,
    phase: 'Rounding',
    description: `Rounded each coefficient to closest center ($0$ or $\\lceil q/2 \\rceil = 1665$) recovering candidate 256-bit message $m' = ${bytesToHex(mPrime).slice(0, 16)}...$.`,
    data: {
      pipelineStage: 'Decapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: mPrimePoly,
      polyLabel: 'Recovered Message Bits m′ (0 or 1664)',
    },
    visualizationType: 'lattice-polynomial',
  });

  // (K', r') = G(m' || hEk)
  const mPrimeWithHEk = new Uint8Array(mPrime.length + 32);
  mPrimeWithHEk.set(mPrime, 0);
  mPrimeWithHEk.set(hEk, mPrime.length);
  const gOutPrime = sha3_512(mPrimeWithHEk);
  const kPrime = gOutPrime.slice(0, 32);

  steps.push({
    id: 'pqc-decaps-kprime',
    title: `Candidate Shared Key Derivation (G(m′ ‖ H(ek)))`,
    phase: 'Lattice Setup',
    description: `Derived candidate shared secret $K' = ${bytesToHex(kPrime).slice(0, 32)}...$ and pseudo-random seed $r'$ from reconstructed message $m'$.`,
    data: {
      pipelineStage: 'Decapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: diff,
      polyLabel: 'Reconstructed Message Spectrum diff',
      sharedKeyHex: bytesToHex(kPrime),
    },
    visualizationType: 'lattice-polynomial',
  });

  // Constant-time check: Re-encrypt and verify c' == c
  const { c: cPrime } = mlKemEncaps(params, ek, mPrime);
  let equal = true;
  for (let i = 0; i < c.length; i++) {
    if (c[i] !== cPrime[i]) equal = false;
  }

  steps.push({
    id: 'pqc-decaps-reencrypt',
    title: `Fujisaki-Okamoto Transform: Re-Encryption Verification (c′ == c)`,
    phase: 'Decapsulation',
    description: `Re-encrypted candidate message $m'$ into $c'$. Comparison result: ${
      equal ? 'MATCH (c′ == c) → CCA-2 SECURE' : 'MISMATCH (c′ ≠ c) → IMPLICIT REJECTION'
    }.`,
    data: {
      pipelineStage: 'Decapsulation',
      kRank: k,
      matrixDims: `${k} × ${k}`,
      polynomialSpectrum: diff,
      polyLabel: 'Re-Encryption Verified Message diff',
      cHex: bytesToHex(cPrime).slice(0, 64) + '...',
      decapsMatched: equal,
    },
    visualizationType: 'lattice-polynomial',
  });

  const finalSharedKey = equal ? kPrime : shake256(new Uint8Array([...z, ...c]), 32);

  steps.push({
    id: 'pqc-decaps-inversion',
    title: `${params.name} Decapsulation Finalized & Shared Key Output`,
    phase: 'Decapsulation',
    description: `Decapsulation finalized. Shared secret key verification: ${
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
