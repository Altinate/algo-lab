import { AlgorithmPlugin, AlgorithmInfo, ComputationResult } from '../types';
import { H_512 } from './constants';
import { computeSHA512Family } from './engine';

const info: AlgorithmInfo = {
  name: 'SHA-512',
  family: 'SHA-2',
  digestSize: 512,
  blockSize: 1024,
  description: 'SHA-512 is part of the SHA-2 family. It operates on 64-bit words and produces a 512-bit digest.',
  useCases: ['Digital Signatures', 'Certificate Authorities', 'Password Hashing (with salts)'],
  security: 'secure',
  year: 2001,
  designers: ['NSA']
};

export default {
  info,
  compute(input: string): ComputationResult {
    return computeSHA512Family(input, {
      initialHash: H_512,
      is384: false
    });
  }
} as AlgorithmPlugin;
