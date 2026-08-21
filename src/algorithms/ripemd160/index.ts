import { AlgorithmPlugin, AlgorithmInfo } from '../types';
import { computeRIPEMDFamily } from '../ripemd/engine';

export const ripemd160Info: AlgorithmInfo = {
  name: 'RIPEMD-160',
  family: 'RIPEMD',
  digestSize: 160,
  blockSize: 512,
  description: 'RIPEMD-160 (RACE Integrity Primitives Evaluation Message Digest) is an open European standard 160-bit cryptographic hash widely utilized in Bitcoin address generation (Base58Check).',
  useCases: ['Bitcoin address generation (HASH160: SHA-256 + RIPEMD-160)', 'PGP signatures', 'Cryptographic protocols'],
  security: 'secure',
  year: 1996,
  designers: ['Hans Dobbertin', 'Antoon Bosselaers', 'Bart Preneel'],
};

export class RIPEMD160Plugin implements AlgorithmPlugin {
  info = ripemd160Info;

  compute(input: string) {
    return computeRIPEMDFamily(input, { variant: 'RIPEMD-160' });
  }
}

export default new RIPEMD160Plugin();
