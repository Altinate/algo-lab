import { AlgorithmPlugin, AlgorithmInfo } from '../types';
import { computeKeccakFamily } from '../keccak/engine';

export const shake256Info: AlgorithmInfo = {
  name: 'SHAKE256',
  family: 'SHA-3',
  digestSize: 512,
  blockSize: 1088,
  description: 'SHAKE256 is an Extendable-Output Function (XOF) from the NIST FIPS 202 standard using the Keccak sponge with 256-bit security level, capable of generating arbitrary output lengths (default: 512 bits / 64 bytes).',
  useCases: ['Key derivation (KDF)', 'Post-quantum signature schemes (SPHINCS+, Dilithium)', 'Pseudorandom streams'],
  security: 'secure',
  year: 2015,
  designers: ['Guido Bertoni', 'Joan Daemen', 'Michaël Peeters', 'Gilles Van Assche'],
  isXOF: true,
};

export class SHAKE256Plugin implements AlgorithmPlugin {
  info = shake256Info;

  compute(input: string, options?: Record<string, unknown>) {
    let outputBits = 512;
    if (typeof options?.outputBytes === 'number' && options.outputBytes > 0) {
      outputBits = options.outputBytes * 8;
    } else if (typeof options?.outputBits === 'number' && options.outputBits > 0) {
      outputBits = options.outputBits;
    }

    return computeKeccakFamily(input, {
      rate: 1088,
      capacity: 512,
      outputLen: outputBits,
      domainSep: 0x1F,
      algoName: 'SHAKE256',
    });
  }
}

export default new SHAKE256Plugin();
