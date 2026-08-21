import { AlgorithmPlugin, AlgorithmInfo } from '../types';
import { computeKeccakFamily } from '../keccak/engine';

export const keccak_224Info: AlgorithmInfo = {
  name: 'Keccak-224',
  family: 'SHA-3',
  digestSize: 224,
  blockSize: 1152,
  description: 'Keccak-224 is the original submission specification of the Keccak sponge function (domain separation 0x01) producing a 224-bit digest.',
  useCases: ['Cryptographic protocols', 'Legacy Keccak systems'],
  security: 'secure',
  year: 2008,
  designers: ['Guido Bertoni', 'Joan Daemen', 'Michaël Peeters', 'Gilles Van Assche'],
};

export class Keccak224Plugin implements AlgorithmPlugin {
  info = keccak_224Info;

  compute(input: string) {
    return computeKeccakFamily(input, {
      rate: 1152,
      capacity: 448,
      outputLen: 224,
      domainSep: 0x01,
      algoName: 'Keccak-224',
    });
  }
}

export default new Keccak224Plugin();
