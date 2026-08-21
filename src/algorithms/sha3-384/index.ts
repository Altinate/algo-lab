import { AlgorithmPlugin, AlgorithmInfo } from '../types';
import { computeKeccakFamily } from '../keccak/engine';

export const sha3_384Info: AlgorithmInfo = {
  name: 'SHA3-384',
  family: 'SHA-3',
  digestSize: 384,
  blockSize: 832,
  description: 'SHA3-384 is a 384-bit member of the NIST FIPS 202 SHA-3 standard using the Keccak-f[1600] sponge with a rate of 832 bits.',
  useCases: ['High-security digital signatures', 'Public-key cryptography', 'Post-quantum key derivation'],
  security: 'secure',
  year: 2015,
  designers: ['Guido Bertoni', 'Joan Daemen', 'Michaël Peeters', 'Gilles Van Assche'],
};

export class SHA3_384Plugin implements AlgorithmPlugin {
  info = sha3_384Info;

  compute(input: string) {
    return computeKeccakFamily(input, {
      rate: 832,
      capacity: 768,
      outputLen: 384,
      domainSep: 0x06,
      algoName: 'SHA3-384',
    });
  }
}

export default new SHA3_384Plugin();
