import { AlgorithmPlugin, AlgorithmInfo } from '../types';
import { computeKeccakFamily } from '../keccak/engine';

export const sha3_224Info: AlgorithmInfo = {
  name: 'SHA3-224',
  family: 'SHA-3',
  digestSize: 224,
  blockSize: 1152,
  description: 'SHA3-224 is a 224-bit member of the NIST FIPS 202 SHA-3 standard using the Keccak-f[1600] sponge with a rate of 1152 bits.',
  useCases: ['Digital signatures', 'Lightweight constraints', 'NIST compliant applications'],
  security: 'secure',
  year: 2015,
  designers: ['Guido Bertoni', 'Joan Daemen', 'Michaël Peeters', 'Gilles Van Assche'],
};

export class SHA3_224Plugin implements AlgorithmPlugin {
  info = sha3_224Info;

  compute(input: string) {
    return computeKeccakFamily(input, {
      rate: 1152,
      capacity: 448,
      outputLen: 224,
      domainSep: 0x06,
      algoName: 'SHA3-224',
    });
  }
}

export default new SHA3_224Plugin();
