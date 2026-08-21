/**
 * SHA-224 Algorithm Plugin
 *
 * SHA-224 is a truncated variant of SHA-256 that produces a 224-bit digest.
 * It uses the same algorithm as SHA-256 but with different initial hash values
 * and outputs only the first 7 of 8 hash words (224 bits instead of 256).
 */

import type { AlgorithmPlugin } from '../types';
import { sha256Engine } from '../sha256/engine';
import { H_224 } from '../sha256/constants';

export const sha224Plugin: AlgorithmPlugin = {
  info: {
    name: 'SHA-224',
    family: 'SHA-2',
    digestSize: 224,
    blockSize: 512,
    description:
      'SHA-224 is a truncated variant of SHA-256 producing a 224-bit digest. It uses different initial hash values and outputs only 7 of 8 hash words. It provides roughly 112-bit security against collision attacks.',
    useCases: [
      'Digital signatures where shorter hash is acceptable',
      'Random number generation',
      'Key derivation',
    ],
    security: 'secure',
    year: 2004,
    designers: ['NSA (National Security Agency)'],
  },

  compute(input: string) {
    return sha256Engine(input, {
      initialHash: H_224,
      outputWords: 7,
      algorithmName: 'SHA-224',
    });
  },
};
