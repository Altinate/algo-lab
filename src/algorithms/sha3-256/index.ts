import { AlgorithmPlugin, AlgorithmInfo, ComputationResult } from '../types';
import { computeKeccakFamily } from '../keccak/engine';

const info: AlgorithmInfo = {
  name: 'SHA3-256',
  family: 'SHA-3',
  digestSize: 256,
  blockSize: 1088,
  description: 'SHA-3 (Secure Hash Algorithm 3) is the latest member of the Secure Hash Algorithm family of standards, based on the Keccak sponge construction.',
  useCases: ['Digital Signatures', 'Message Authentication', 'Cryptocurrencies'],
  security: 'secure',
  year: 2015,
  designers: ['Guido Bertoni', 'Joan Daemen', 'Michaël Peeters', 'Gilles Van Assche']
};

export default {
  info,
  compute(input: string): ComputationResult {
    return computeKeccakFamily(input, {
      rate: 1088,
      capacity: 512,
      outputLen: 256,
      domainSep: 0x06
    });
  }
} as AlgorithmPlugin;
