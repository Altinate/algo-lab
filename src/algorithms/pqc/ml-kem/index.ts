/**
 * NIST FIPS 203 ML-KEM (Module-Lattice Key Encapsulation Mechanism) Algorithm Plugins
 */

import type { AlgorithmPlugin, AlgorithmInfo, ComputationResult } from '../../types';
import {
  ML_KEM_512_PARAMS,
  ML_KEM_768_PARAMS,
  ML_KEM_1024_PARAMS,
  NIST_FIPS203_KAT_SEED_D,
  NIST_FIPS203_KAT_SEED_Z,
  NIST_FIPS203_KAT_SEED_M,
} from './constants';
import { mlKemKeyGen, mlKemEncaps, mlKemDecaps } from './ml-kem-engine';
import { hexToBytes, bytesToHex } from '../../utils';

export interface MlKemComputeOptions {
  seedDHex?: string;
  seedZHex?: string;
  seedMHex?: string;
  ekHex?: string;
  dkHex?: string;
  cHex?: string;
}

// 1. ML-KEM-768 (Recommended / NIST Security Category 3)
export const mlKem768KeyGenPlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-KEM-768 (KeyGen)',
    family: 'ML-KEM (Kyber)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 1184 * 8,
    description:
      'NIST FIPS 203 ML-KEM-768 Key Generation. Generates 1184-byte Encapsulation Key (ek) and 2400-byte Decapsulation Key (dk) over Module-Lattice rank k=3 with NTT and Centered Binomial noise sampling (η₁=2).',
    useCases: ['Post-Quantum Key Exchange', 'TLS 1.3 Hybrid Key Exchange (X25519MLKEM768)', 'SSH Post-Quantum KEX'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Kyber Team (Schwabe, Avanzi, Bos, Ducas, Kiltz, Lepoint, Lyubashevsky, Schanck, Seiler, Stehlé)'],
    keySize: 768,
    direction: 'encrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlKemComputeOptions;
    const seedD = opts.seedDHex ? hexToBytes(opts.seedDHex) : hexToBytes(NIST_FIPS203_KAT_SEED_D);
    const seedZ = opts.seedZHex ? hexToBytes(opts.seedZHex) : hexToBytes(NIST_FIPS203_KAT_SEED_Z);

    const { ek, dk, steps } = mlKemKeyGen(ML_KEM_768_PARAMS, seedD, seedZ);
    return {
      digest: bytesToHex(ek),
      steps,
      tagValid: true,
    };
  },
};

export const mlKem768EncapsulatePlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-KEM-768 (Encapsulate)',
    family: 'ML-KEM (Kyber)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 1088 * 8,
    description:
      'NIST FIPS 203 ML-KEM-768 Encapsulation. Generates 32-byte Post-Quantum Shared Key (K) and 1088-byte Ciphertext (c) using public key (ek).',
    useCases: ['TLS 1.3 Post-Quantum Handshake', 'WireGuard Post-Quantum Tunneling', 'Quantum-Safe Data Protection'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Kyber Team'],
    keySize: 768,
    direction: 'encrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlKemComputeOptions;
    const seedD = opts.seedDHex ? hexToBytes(opts.seedDHex) : hexToBytes(NIST_FIPS203_KAT_SEED_D);
    const seedZ = opts.seedZHex ? hexToBytes(opts.seedZHex) : hexToBytes(NIST_FIPS203_KAT_SEED_Z);
    const seedM = opts.seedMHex ? hexToBytes(opts.seedMHex) : hexToBytes(NIST_FIPS203_KAT_SEED_M);

    const { ek } = mlKemKeyGen(ML_KEM_768_PARAMS, seedD, seedZ);
    const targetEk = opts.ekHex ? hexToBytes(opts.ekHex) : ek;

    const { c, sharedKey, steps } = mlKemEncaps(ML_KEM_768_PARAMS, targetEk, seedM);
    return {
      digest: bytesToHex(sharedKey),
      steps,
      tagValid: true,
    };
  },
};

export const mlKem768DecapsulatePlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-KEM-768 (Decapsulate)',
    family: 'ML-KEM (Kyber)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 1088 * 8,
    description:
      'NIST FIPS 203 ML-KEM-768 Decapsulation. Recovers 32-byte Post-Quantum Shared Key (K) from 1088-byte Ciphertext (c) using private key (dk) with constant-time re-encryption verification.',
    useCases: ['Quantum-Safe Key Agreement', 'Post-Quantum Server Handshake Decapsulation'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Kyber Team'],
    keySize: 768,
    direction: 'decrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlKemComputeOptions;
    const seedD = opts.seedDHex ? hexToBytes(opts.seedDHex) : hexToBytes(NIST_FIPS203_KAT_SEED_D);
    const seedZ = opts.seedZHex ? hexToBytes(opts.seedZHex) : hexToBytes(NIST_FIPS203_KAT_SEED_Z);
    const seedM = opts.seedMHex ? hexToBytes(opts.seedMHex) : hexToBytes(NIST_FIPS203_KAT_SEED_M);

    const { ek, dk } = mlKemKeyGen(ML_KEM_768_PARAMS, seedD, seedZ);
    const { c, sharedKey: originalKey } = mlKemEncaps(ML_KEM_768_PARAMS, ek, seedM);

    const targetDk = opts.dkHex ? hexToBytes(opts.dkHex) : dk;
    const targetC = opts.cHex ? hexToBytes(opts.cHex) : c;

    const { sharedKey, steps } = mlKemDecaps(ML_KEM_768_PARAMS, targetDk, targetC);
    const matched = bytesToHex(sharedKey) === bytesToHex(originalKey);

    return {
      digest: bytesToHex(sharedKey),
      steps,
      tagValid: matched,
    };
  },
};

// 2. ML-KEM-512 (NIST Security Category 1)
export const mlKem512KeyGenPlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-KEM-512 (KeyGen)',
    family: 'ML-KEM (Kyber)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 800 * 8,
    description:
      'NIST FIPS 203 ML-KEM-512 Key Generation (Module rank k=2, η₁=3, η₂=2). Generates 800-byte encapsulation key (ek) and 1632-byte decapsulation key (dk).',
    useCases: ['Lightweight Post-Quantum IoT', 'Resource-Constrained Embedded Devices'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Kyber Team'],
    keySize: 512,
    direction: 'encrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlKemComputeOptions;
    const seedD = opts.seedDHex ? hexToBytes(opts.seedDHex) : hexToBytes(NIST_FIPS203_KAT_SEED_D);
    const seedZ = opts.seedZHex ? hexToBytes(opts.seedZHex) : hexToBytes(NIST_FIPS203_KAT_SEED_Z);

    const { ek, dk, steps } = mlKemKeyGen(ML_KEM_512_PARAMS, seedD, seedZ);
    return {
      digest: bytesToHex(ek),
      steps,
      tagValid: true,
    };
  },
};

export const mlKem512EncapsulatePlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-KEM-512 (Encapsulate)',
    family: 'ML-KEM (Kyber)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 768 * 8,
    description:
      'NIST FIPS 203 ML-KEM-512 Encapsulation (Module rank k=2, η₁=3, η₂=2). Generates 768-byte ciphertext and 32-byte shared key.',
    useCases: ['Lightweight Post-Quantum IoT', 'Resource-Constrained Embedded Devices'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Kyber Team'],
    keySize: 512,
    direction: 'encrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlKemComputeOptions;
    const seedD = opts.seedDHex ? hexToBytes(opts.seedDHex) : hexToBytes(NIST_FIPS203_KAT_SEED_D);
    const seedZ = opts.seedZHex ? hexToBytes(opts.seedZHex) : hexToBytes(NIST_FIPS203_KAT_SEED_Z);
    const seedM = opts.seedMHex ? hexToBytes(opts.seedMHex) : hexToBytes(NIST_FIPS203_KAT_SEED_M);

    const { ek } = mlKemKeyGen(ML_KEM_512_PARAMS, seedD, seedZ);
    const targetEk = opts.ekHex ? hexToBytes(opts.ekHex) : ek;

    const { sharedKey, steps } = mlKemEncaps(ML_KEM_512_PARAMS, targetEk, seedM);

    return {
      digest: bytesToHex(sharedKey),
      steps,
      tagValid: true,
    };
  },
};

export const mlKem512DecapsulatePlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-KEM-512 (Decapsulate)',
    family: 'ML-KEM (Kyber)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 768 * 8,
    description:
      'NIST FIPS 203 ML-KEM-512 Decapsulation. Recovers 32-byte shared key from 768-byte ciphertext using private key (dk).',
    useCases: ['Lightweight Post-Quantum IoT Decapsulation'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Kyber Team'],
    keySize: 512,
    direction: 'decrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlKemComputeOptions;
    const seedD = opts.seedDHex ? hexToBytes(opts.seedDHex) : hexToBytes(NIST_FIPS203_KAT_SEED_D);
    const seedZ = opts.seedZHex ? hexToBytes(opts.seedZHex) : hexToBytes(NIST_FIPS203_KAT_SEED_Z);
    const seedM = opts.seedMHex ? hexToBytes(opts.seedMHex) : hexToBytes(NIST_FIPS203_KAT_SEED_M);

    const { ek, dk } = mlKemKeyGen(ML_KEM_512_PARAMS, seedD, seedZ);
    const { c, sharedKey: originalKey } = mlKemEncaps(ML_KEM_512_PARAMS, ek, seedM);

    const targetDk = opts.dkHex ? hexToBytes(opts.dkHex) : dk;
    const targetC = opts.cHex ? hexToBytes(opts.cHex) : c;

    const { sharedKey, steps } = mlKemDecaps(ML_KEM_512_PARAMS, targetDk, targetC);
    const matched = bytesToHex(sharedKey) === bytesToHex(originalKey);

    return {
      digest: bytesToHex(sharedKey),
      steps,
      tagValid: matched,
    };
  },
};

// 3. ML-KEM-1024 (NIST Security Category 5)
export const mlKem1024KeyGenPlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-KEM-1024 (KeyGen)',
    family: 'ML-KEM (Kyber)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 1568 * 8,
    description:
      'NIST FIPS 203 ML-KEM-1024 Key Generation (Module rank k=4, η₁=2, η₂=2). Generates 1568-byte encapsulation key (ek) and 3168-byte decapsulation key (dk).',
    useCases: ['Top Secret Post-Quantum Key Generation', 'National Security Systems'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Kyber Team'],
    keySize: 1024,
    direction: 'encrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlKemComputeOptions;
    const seedD = opts.seedDHex ? hexToBytes(opts.seedDHex) : hexToBytes(NIST_FIPS203_KAT_SEED_D);
    const seedZ = opts.seedZHex ? hexToBytes(opts.seedZHex) : hexToBytes(NIST_FIPS203_KAT_SEED_Z);

    const { ek, dk, steps } = mlKemKeyGen(ML_KEM_1024_PARAMS, seedD, seedZ);
    return {
      digest: bytesToHex(ek),
      steps,
      tagValid: true,
    };
  },
};

export const mlKem1024EncapsulatePlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-KEM-1024 (Encapsulate)',
    family: 'ML-KEM (Kyber)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 1568 * 8,
    description:
      'NIST FIPS 203 ML-KEM-1024 Encapsulation (Module rank k=4, η₁=2, η₂=2). High-security 1568-byte ciphertext and 32-byte shared key.',
    useCases: ['High-Security Government Top Secret Classification', 'Long-Term Archive Encryption'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Kyber Team'],
    keySize: 1024,
    direction: 'encrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlKemComputeOptions;
    const seedD = opts.seedDHex ? hexToBytes(opts.seedDHex) : hexToBytes(NIST_FIPS203_KAT_SEED_D);
    const seedZ = opts.seedZHex ? hexToBytes(opts.seedZHex) : hexToBytes(NIST_FIPS203_KAT_SEED_Z);
    const seedM = opts.seedMHex ? hexToBytes(opts.seedMHex) : hexToBytes(NIST_FIPS203_KAT_SEED_M);

    const { ek } = mlKemKeyGen(ML_KEM_1024_PARAMS, seedD, seedZ);
    const targetEk = opts.ekHex ? hexToBytes(opts.ekHex) : ek;

    const { sharedKey, steps } = mlKemEncaps(ML_KEM_1024_PARAMS, targetEk, seedM);

    return {
      digest: bytesToHex(sharedKey),
      steps,
      tagValid: true,
    };
  },
};

export const mlKem1024DecapsulatePlugin: AlgorithmPlugin = {
  info: {
    name: 'ML-KEM-1024 (Decapsulate)',
    family: 'ML-KEM (Kyber)',
    category: 'pqc',
    digestSize: 256,
    blockSize: 1568 * 8,
    description:
      'NIST FIPS 203 ML-KEM-1024 Decapsulation. Recovers 32-byte shared key from 1568-byte ciphertext using private key (dk).',
    useCases: ['High-Security Quantum-Safe Server Decapsulation'],
    security: 'secure',
    year: 2024,
    designers: ['NIST / CRYSTALS-Kyber Team'],
    keySize: 1024,
    direction: 'decrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>): ComputationResult => {
    const opts = (options || {}) as MlKemComputeOptions;
    const seedD = opts.seedDHex ? hexToBytes(opts.seedDHex) : hexToBytes(NIST_FIPS203_KAT_SEED_D);
    const seedZ = opts.seedZHex ? hexToBytes(opts.seedZHex) : hexToBytes(NIST_FIPS203_KAT_SEED_Z);
    const seedM = opts.seedMHex ? hexToBytes(opts.seedMHex) : hexToBytes(NIST_FIPS203_KAT_SEED_M);

    const { ek, dk } = mlKemKeyGen(ML_KEM_1024_PARAMS, seedD, seedZ);
    const { c, sharedKey: originalKey } = mlKemEncaps(ML_KEM_1024_PARAMS, ek, seedM);

    const targetDk = opts.dkHex ? hexToBytes(opts.dkHex) : dk;
    const targetC = opts.cHex ? hexToBytes(opts.cHex) : c;

    const { sharedKey, steps } = mlKemDecaps(ML_KEM_1024_PARAMS, targetDk, targetC);
    const matched = bytesToHex(sharedKey) === bytesToHex(originalKey);

    return {
      digest: bytesToHex(sharedKey),
      steps,
      tagValid: matched,
    };
  },
};

export const mlKemPlugins: AlgorithmPlugin[] = [
  mlKem512KeyGenPlugin,
  mlKem512EncapsulatePlugin,
  mlKem512DecapsulatePlugin,
  mlKem768KeyGenPlugin,
  mlKem768EncapsulatePlugin,
  mlKem768DecapsulatePlugin,
  mlKem1024KeyGenPlugin,
  mlKem1024EncapsulatePlugin,
  mlKem1024DecapsulatePlugin,
];
