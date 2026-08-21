import { AlgorithmPlugin, AlgorithmInfo } from '../types';
import { computeKeccakFamily } from '../keccak/engine';

export const shake128Info: AlgorithmInfo = {
  name: 'SHAKE128',
  family: 'SHA-3',
  digestSize: 256,
  blockSize: 1344,
  description: 'SHAKE128 is an Extendable-Output Function (XOF) from the NIST FIPS 202 standard using the Keccak sponge with 128-bit security level, capable of generating arbitrary output lengths (default: 256 bits / 32 bytes).',
  useCases: ['Key derivation (KDF)', 'Pseudorandom generation', 'Post-quantum cryptography (Kyber, Dilithium)'],
  security: 'secure',
  year: 2015,
  designers: ['Guido Bertoni', 'Joan Daemen', 'Michaël Peeters', 'Gilles Van Assche'],
  isXOF: true,
};

export class SHAKE128Plugin implements AlgorithmPlugin {
  info = shake128Info;

  compute(input: string, options?: Record<string, unknown>) {
    let outputBits = 256;
    if (typeof options?.outputBytes === 'number' && options.outputBytes > 0) {
      outputBits = options.outputBytes * 8;
    } else if (typeof options?.outputBits === 'number' && options.outputBits > 0) {
      outputBits = options.outputBits;
    }

    return computeKeccakFamily(input, {
      rate: 1344,
      capacity: 256,
      outputLen: outputBits,
      domainSep: 0x1F,
      algoName: 'SHAKE128',
    });
  }
}

export default new SHAKE128Plugin();
