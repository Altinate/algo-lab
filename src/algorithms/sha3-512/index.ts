import { AlgorithmPlugin, AlgorithmInfo, ComputationResult } from '../types';
import { computeKeccakFamily } from '../keccak/engine';

const info: AlgorithmInfo = {
  name: 'SHA3-512',
  family: 'SHA-3',
  digestSize: 512,
  blockSize: 576,
  description: 'SHA3-512 provides a 512-bit output with maximum security. It uses a smaller rate (576 bits) and larger capacity (1024 bits) than SHA3-256.',
  useCases: ['Digital Signatures', 'High-Security Environments'],
  security: 'secure',
  year: 2015,
  designers: ['Guido Bertoni', 'Joan Daemen', 'Michaël Peeters', 'Gilles Van Assche']
};

export default {
  info,
  compute(input: string): ComputationResult {
    return computeKeccakFamily(input, {
      rate: 576,
      capacity: 1024,
      outputLen: 512,
      domainSep: 0x06
    });
  }
} as AlgorithmPlugin;
