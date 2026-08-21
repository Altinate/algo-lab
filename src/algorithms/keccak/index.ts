import { AlgorithmPlugin, AlgorithmInfo, ComputationResult } from '../types';
import { computeKeccakFamily } from './engine';

const info: AlgorithmInfo = {
  name: 'Keccak-256',
  family: 'SHA-3',
  digestSize: 256,
  blockSize: 1088,
  description: 'Original Keccak submission which became SHA-3. This version uses 0x01 padding instead of SHA-3\'s 0x06 padding. It is widely used by Ethereum.',
  useCases: ['Ethereum', 'Smart Contracts', 'Cryptocurrencies'],
  security: 'secure',
  year: 2012,
  securityNote: 'Original Keccak submission (uses 0x01 padding instead of SHA-3\'s 0x06). Used by Ethereum.',
  designers: ['Guido Bertoni', 'Joan Daemen', 'Michaël Peeters', 'Gilles Van Assche']
};

export default {
  info,
  compute(input: string): ComputationResult {
    return computeKeccakFamily(input, {
      rate: 1088,
      capacity: 512,
      outputLen: 256,
      domainSep: 0x01
    });
  }
} as AlgorithmPlugin;
