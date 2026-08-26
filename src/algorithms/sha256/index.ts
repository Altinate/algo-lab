/**
 * SHA-256 Algorithm Plugin
 *
 * SHA-256 is a member of the SHA-2 family of hash functions designed by the NSA
 * and published by NIST in FIPS 180-4 (2001). It produces a 256-bit (32-byte)
 * digest from arbitrary-length input.
 *
 * SHA-256 is widely used in TLS/SSL certificates, Bitcoin mining, code signing,
 * and digital signatures. It remains cryptographically secure as of 2024.
 */

import type { AlgorithmPlugin } from '../types';
import { sha256Engine } from './engine';
import { H_256 } from './constants';

export const sha256Plugin: AlgorithmPlugin = {
  info: {
    name: 'SHA-256',
    family: 'SHA-2',
    digestSize: 256,
    blockSize: 512,
    description:
      'SHA-256 is a cryptographic hash function from the SHA-2 family, producing a 256-bit digest. It processes messages in 512-bit blocks through 64 rounds of compression, using bitwise operations, modular addition, and non-linear functions to achieve strong avalanche properties.',
    useCases: [
      'TLS/SSL certificates',
      'Bitcoin mining & blockchain',
      'Code signing',
      'Digital signatures (ECDSA, RSA)',
      'File integrity verification',
    ],
    security: 'secure',
    year: 2001,
    designers: ['NSA (National Security Agency)'],
  },

  compute(input: string) {
    return sha256Engine(input, {
      initialHash: H_256,
      outputWords: 8,
      algorithmName: 'SHA-256',
    });
  },
};

export default sha256Plugin;
