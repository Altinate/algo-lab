import { AlgorithmPlugin, AlgorithmInfo } from '../types';
import { computeKeccakFamily } from '../keccak/engine';

export const keccak_512Info: AlgorithmInfo = {
  name: 'Keccak-512',
  family: 'SHA-3',
  digestSize: 512,
  blockSize: 576,
  description: 'Keccak-512 is the original submission specification of the Keccak sponge function (domain separation 0x01) producing a 512-bit digest.',
  useCases: ['Cryptographic protocols', 'High-security Keccak systems', 'Zero-knowledge proofs'],
  security: 'secure',
  year: 2008,
  designers: ['Guido Bertoni', 'Joan Daemen', 'Michaël Peeters', 'Gilles Van Assche'],
};

export class Keccak512Plugin implements AlgorithmPlugin {
  info = keccak_512Info;

  compute(input: string) {
    return computeKeccakFamily(input, {
      rate: 576,
      capacity: 1024,
      outputLen: 512,
      domainSep: 0x01,
      algoName: 'Keccak-512',
    });
  }
}

export default new Keccak512Plugin();
