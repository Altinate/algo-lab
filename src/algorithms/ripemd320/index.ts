import { AlgorithmPlugin, AlgorithmInfo } from '../types';
import { computeRIPEMDFamily } from '../ripemd/engine';

export const ripemd320Info: AlgorithmInfo = {
  name: 'RIPEMD-320',
  family: 'RIPEMD',
  digestSize: 320,
  blockSize: 512,
  description: 'RIPEMD-320 is a 320-bit double-width extension of RIPEMD-160 using parallel left and right compression paths to output an unmerged 320-bit state.',
  useCases: ['High collision resistance', 'Specialized cryptographic applications'],
  security: 'secure',
  year: 1996,
  designers: ['Hans Dobbertin', 'Antoon Bosselaers', 'Bart Preneel'],
};

export class RIPEMD320Plugin implements AlgorithmPlugin {
  info = ripemd320Info;

  compute(input: string) {
    return computeRIPEMDFamily(input, { variant: 'RIPEMD-320' });
  }
}

export default new RIPEMD320Plugin();
