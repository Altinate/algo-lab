/**
 * NIST FIPS 204 ML-DSA (Module-Lattice Digital Signature Algorithm) Plugins
 */

import type { AlgorithmPlugin, ComputationResult } from '../../types';
import {
  ML_DSA_44_PARAMS,
  ML_DSA_65_PARAMS,
  ML_DSA_87_PARAMS,
  NIST_FIPS204_KAT_44,
  NIST_FIPS204_KAT_65,
  NIST_FIPS204_KAT_87,
} from './constants';
import { mlDsaKeyGen, mlDsaSign, mlDsaVerify } from './ml-dsa-engine';
import { hexToBytes, bytesToHex } from '../../utils';

export interface MlDsaComputeOptions {
  seedHex?: string;
  skHex?: string;
  pkHex?: string;
  sigHex?: string;
  messageHex?: string;
  contextHex?: string;
}

// -----------------------------------------------------------------------------
// 1. ML-DSA-44 (NIST Security Category 2)
// -----------------------------------------------------------------------------

export const mlDsa44KeyGenPlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-DSA-44 (KeyGen)',
    family: 'ML-DSA (Dilithium)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 1312 * 8,
    description:
      'NIST FIPS 204 ML-DSA-44 Key Generation. Generates 1312-byte Public Key (pk) and 2560-byte Secret Key (sk) over (k=4, l=4) module lattice with η=2.',
    useCases: ['Post-Quantum Digital Signatures', 'Lightweight Authenticated Key Exchange', 'Quantum-Safe Certificates'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Dilithium Team (Ducas, Kiltz, Lepoint, Lyubashevsky, Schwabe, Seiler, Stehlé)'],
    keySize: 44,
    direction: 'encrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlDsaComputeOptions;
    const seed = hexToBytes(opts.seedHex || NIST_FIPS204_KAT_44.seed);
    const { pk, steps } = mlDsaKeyGen(ML_DSA_44_PARAMS, seed);
    return {
      digest: bytesToHex(pk),
      steps,
      tagValid: true,
    };
  },
};

export const mlDsa44SignPlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-DSA-44 (Sign)',
    family: 'ML-DSA (Dilithium)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 2420 * 8,
    description:
      'NIST FIPS 204 ML-DSA-44 Signature Generation. Produces 2420-byte deterministic digital signature σ = (c̃, z, h) with rejection sampling.',
    useCases: ['Post-Quantum Code Signing', 'TLS 1.3 Quantum-Safe Authentication'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Dilithium Team'],
    keySize: 44,
    direction: 'encrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlDsaComputeOptions;
    const seed = hexToBytes(opts.seedHex || NIST_FIPS204_KAT_44.seed);
    const { sk } = mlDsaKeyGen(ML_DSA_44_PARAMS, seed);
    const targetSk = hexToBytes(opts.skHex || bytesToHex(sk));
    const msg = hexToBytes(opts.messageHex || NIST_FIPS204_KAT_44.message);
    const ctx = hexToBytes(opts.contextHex || NIST_FIPS204_KAT_44.context);

    const { sig, steps } = mlDsaSign(ML_DSA_44_PARAMS, targetSk, msg, ctx, true);
    return {
      digest: bytesToHex(sig),
      steps,
      tagValid: true,
    };
  },
};

export const mlDsa44VerifyPlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-DSA-44 (Verify)',
    family: 'ML-DSA (Dilithium)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 2420 * 8,
    description:
      'NIST FIPS 204 ML-DSA-44 Signature Verification. Reconstructs high-bits w₁\' from hint vector h and verifies challenge commitment c̃.',
    useCases: ['Quantum-Safe Identity Verification', 'Post-Quantum Firmware Verification'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Dilithium Team'],
    keySize: 44,
    direction: 'decrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlDsaComputeOptions;
    const seed = hexToBytes(opts.seedHex || NIST_FIPS204_KAT_44.seed);
    const { pk, sk } = mlDsaKeyGen(ML_DSA_44_PARAMS, seed);
    const msg = hexToBytes(opts.messageHex || NIST_FIPS204_KAT_44.message);
    const ctx = hexToBytes(opts.contextHex || NIST_FIPS204_KAT_44.context);

    const targetPk = hexToBytes(opts.pkHex || bytesToHex(pk));
    let targetSig: Uint8Array;
    if (opts.sigHex) {
      targetSig = hexToBytes(opts.sigHex);
    } else {
      const { sig } = mlDsaSign(ML_DSA_44_PARAMS, sk, msg, ctx, true);
      targetSig = sig;
    }

    const { valid, steps } = mlDsaVerify(ML_DSA_44_PARAMS, targetPk, msg, targetSig, ctx);
    return {
      digest: bytesToHex(targetSig),
      steps,
      tagValid: valid,
    };
  },
};

// -----------------------------------------------------------------------------
// 2. ML-DSA-65 (NIST Security Category 3 / Recommended)
// -----------------------------------------------------------------------------

export const mlDsa65KeyGenPlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-DSA-65 (KeyGen)',
    family: 'ML-DSA (Dilithium)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 1952 * 8,
    description:
      'NIST FIPS 204 ML-DSA-65 Key Generation (Recommended). Generates 1952-byte Public Key (pk) and 4032-byte Secret Key (sk) over (k=6, l=5) module lattice with η=4.',
    useCases: ['Primary Post-Quantum PKI standard', 'X.509 PQC Certificates', 'DNSSEC Post-Quantum Signatures'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Dilithium Team'],
    keySize: 65,
    direction: 'encrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlDsaComputeOptions;
    const seed = hexToBytes(opts.seedHex || NIST_FIPS204_KAT_65.seed);
    const { pk, steps } = mlDsaKeyGen(ML_DSA_65_PARAMS, seed);
    return {
      digest: bytesToHex(pk),
      steps,
      tagValid: true,
    };
  },
};

export const mlDsa65SignPlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-DSA-65 (Sign)',
    family: 'ML-DSA (Dilithium)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 3309 * 8,
    description:
      'NIST FIPS 204 ML-DSA-65 Signature Generation. Produces 3309-byte digital signature σ = (c̃, z, h) with rejection sampling (γ₁=2¹⁹, γ₂=(q-1)/32).',
    useCases: ['Standard Post-Quantum TLS 1.3 Handshake Signatures', 'Code Signing Certificates'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Dilithium Team'],
    keySize: 65,
    direction: 'encrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlDsaComputeOptions;
    const seed = hexToBytes(opts.seedHex || NIST_FIPS204_KAT_65.seed);
    const { sk } = mlDsaKeyGen(ML_DSA_65_PARAMS, seed);
    const targetSk = hexToBytes(opts.skHex || bytesToHex(sk));
    const msg = hexToBytes(opts.messageHex || NIST_FIPS204_KAT_65.message);
    const ctx = hexToBytes(opts.contextHex || NIST_FIPS204_KAT_65.context);

    const { sig, steps } = mlDsaSign(ML_DSA_65_PARAMS, targetSk, msg, ctx, true);
    return {
      digest: bytesToHex(sig),
      steps,
      tagValid: true,
    };
  },
};

export const mlDsa65VerifyPlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-DSA-65 (Verify)',
    family: 'ML-DSA (Dilithium)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 3309 * 8,
    description:
      'NIST FIPS 204 ML-DSA-65 Signature Verification. Verifies signature against 1952-byte public key.',
    useCases: ['Post-Quantum Web PKI Verification', 'Secure Boot & App Store Signature Verification'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Dilithium Team'],
    keySize: 65,
    direction: 'decrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlDsaComputeOptions;
    const seed = hexToBytes(opts.seedHex || NIST_FIPS204_KAT_65.seed);
    const { pk, sk } = mlDsaKeyGen(ML_DSA_65_PARAMS, seed);
    const msg = hexToBytes(opts.messageHex || NIST_FIPS204_KAT_65.message);
    const ctx = hexToBytes(opts.contextHex || NIST_FIPS204_KAT_65.context);

    const targetPk = hexToBytes(opts.pkHex || bytesToHex(pk));
    let targetSig: Uint8Array;
    if (opts.sigHex) {
      targetSig = hexToBytes(opts.sigHex);
    } else {
      const { sig } = mlDsaSign(ML_DSA_65_PARAMS, sk, msg, ctx, true);
      targetSig = sig;
    }

    const { valid, steps } = mlDsaVerify(ML_DSA_65_PARAMS, targetPk, msg, targetSig, ctx);
    return {
      digest: bytesToHex(targetSig),
      steps,
      tagValid: valid,
    };
  },
};

// -----------------------------------------------------------------------------
// 3. ML-DSA-87 (NIST Security Category 5)
// -----------------------------------------------------------------------------

export const mlDsa87KeyGenPlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-DSA-87 (KeyGen)',
    family: 'ML-DSA (Dilithium)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 2592 * 8,
    description:
      'NIST FIPS 204 ML-DSA-87 Key Generation. Generates 2592-byte Public Key (pk) and 4896-byte Secret Key (sk) over (k=8, l=7) module lattice with η=2.',
    useCases: ['National Security Systems', 'Top Secret Government Document Signing'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Dilithium Team'],
    keySize: 87,
    direction: 'encrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlDsaComputeOptions;
    const seed = hexToBytes(opts.seedHex || NIST_FIPS204_KAT_87.seed);
    const { pk, steps } = mlDsaKeyGen(ML_DSA_87_PARAMS, seed);
    return {
      digest: bytesToHex(pk),
      steps,
      tagValid: true,
    };
  },
};

export const mlDsa87SignPlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-DSA-87 (Sign)',
    family: 'ML-DSA (Dilithium)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 4627 * 8,
    description:
      'NIST FIPS 204 ML-DSA-87 Signature Generation. Produces 4627-byte digital signature σ = (c̃, z, h) with rejection sampling.',
    useCases: ['High-Security Post-Quantum Digital Signatures', 'Long-Term Archive Document Sealing'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Dilithium Team'],
    keySize: 87,
    direction: 'encrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlDsaComputeOptions;
    const seed = hexToBytes(opts.seedHex || NIST_FIPS204_KAT_87.seed);
    const { sk } = mlDsaKeyGen(ML_DSA_87_PARAMS, seed);
    const targetSk = hexToBytes(opts.skHex || bytesToHex(sk));
    const msg = hexToBytes(opts.messageHex || NIST_FIPS204_KAT_87.message);
    const ctx = hexToBytes(opts.contextHex || NIST_FIPS204_KAT_87.context);

    const { sig, steps } = mlDsaSign(ML_DSA_87_PARAMS, targetSk, msg, ctx, true);
    return {
      digest: bytesToHex(sig),
      steps,
      tagValid: true,
    };
  },
};

export const mlDsa87VerifyPlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-DSA-87 (Verify)',
    family: 'ML-DSA (Dilithium)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 4627 * 8,
    description:
      'NIST FIPS 204 ML-DSA-87 Signature Verification. Verifies signature against 2592-byte public key.',
    useCases: ['Top Secret PQC Signature Verification'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Dilithium Team'],
    keySize: 87,
    direction: 'decrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlDsaComputeOptions;
    const seed = hexToBytes(opts.seedHex || NIST_FIPS204_KAT_87.seed);
    const { pk, sk } = mlDsaKeyGen(ML_DSA_87_PARAMS, seed);
    const msg = hexToBytes(opts.messageHex || NIST_FIPS204_KAT_87.message);
    const ctx = hexToBytes(opts.contextHex || NIST_FIPS204_KAT_87.context);

    const targetPk = hexToBytes(opts.pkHex || bytesToHex(pk));
    let targetSig: Uint8Array;
    if (opts.sigHex) {
      targetSig = hexToBytes(opts.sigHex);
    } else {
      const { sig } = mlDsaSign(ML_DSA_87_PARAMS, sk, msg, ctx, true);
      targetSig = sig;
    }

    const { valid, steps } = mlDsaVerify(ML_DSA_87_PARAMS, targetPk, msg, targetSig, ctx);
    return {
      digest: bytesToHex(targetSig),
      steps,
      tagValid: valid,
    };
  },
};

export const mlDsaPlugins: AlgorithmPlugin[] = [
  mlDsa44KeyGenPlugin,
  mlDsa44SignPlugin,
  mlDsa44VerifyPlugin,
  mlDsa65KeyGenPlugin,
  mlDsa65SignPlugin,
  mlDsa65VerifyPlugin,
  mlDsa87KeyGenPlugin,
  mlDsa87SignPlugin,
  mlDsa87VerifyPlugin,
];
