import { AlgorithmPlugin, AlgorithmInfo, ComputationResult } from '../types';
import { H_384 } from '../sha512/constants';
import { computeSHA512Family } from '../sha512/engine';

const info: AlgorithmInfo = {
  name: 'SHA-384',
  family: 'SHA-2',
  digestSize: 384,
  blockSize: 1024,
  description: 'SHA-384 is a truncated version of SHA-512 with different initial hash values. It provides strong security while saving some output space compared to SHA-512.',
  useCases: ['Digital Signatures', 'TLS', 'Certificate Authorities'],
  security: 'secure',
  year: 2001,
  designers: ['NSA']
};

export default {
  info,
  compute(input: string): ComputationResult {
    return computeSHA512Family(input, {
      initialHash: H_384,
      is384: true
    });
  }
} as AlgorithmPlugin;
