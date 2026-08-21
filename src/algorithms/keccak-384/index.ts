import { AlgorithmPlugin, AlgorithmInfo } from '../types';
import { computeKeccakFamily } from '../keccak/engine';

export const keccak_384Info: AlgorithmInfo = {
  name: 'Keccak-384',
  family: 'SHA-3',
  digestSize: 384,
  blockSize: 832,
  description: 'Keccak-384 is the original submission specification of the Keccak sponge function (domain separation 0x01) producing a 384-bit digest.',
  useCases: ['Cryptographic protocols', 'High-security Keccak systems'],
  security: 'secure',
  year: 2008,
  designers: ['Guido Bertoni', 'Joan Daemen', 'Michaël Peeters', 'Gilles Van Assche'],
};

export class Keccak384Plugin implements AlgorithmPlugin {
  info = keccak_384Info;

  compute(input: string) {
    return computeKeccakFamily(input, {
      rate: 832,
      capacity: 768,
      outputLen: 384,
      domainSep: 0x01,
      algoName: 'Keccak-384',
    });
  }
}

export default new Keccak384Plugin();
