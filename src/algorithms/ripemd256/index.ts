import { AlgorithmPlugin, AlgorithmInfo } from '../types';
import { computeRIPEMDFamily } from '../ripemd/engine';

export const ripemd256Info: AlgorithmInfo = {
  name: 'RIPEMD-256',
  family: 'RIPEMD',
  digestSize: 256,
  blockSize: 512,
  description: 'RIPEMD-256 is a 256-bit double-width extension of RIPEMD-128 using parallel left and right compression paths to output an unmerged 256-bit state.',
  useCases: ['Data integrity verification', 'Cryptographic protocols'],
  security: 'secure',
  year: 1996,
  designers: ['Hans Dobbertin', 'Antoon Bosselaers', 'Bart Preneel'],
};

export class RIPEMD256Plugin implements AlgorithmPlugin {
  info = ripemd256Info;

  compute(input: string) {
    return computeRIPEMDFamily(input, { variant: 'RIPEMD-256' });
  }
}

export default new RIPEMD256Plugin();
