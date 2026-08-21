import { AlgorithmPlugin, AlgorithmInfo } from '../types';
import { computeRIPEMDFamily } from '../ripemd/engine';

export const ripemd128Info: AlgorithmInfo = {
  name: 'RIPEMD-128',
  family: 'RIPEMD',
  digestSize: 128,
  blockSize: 512,
  description: 'RIPEMD-128 is a 128-bit cryptographic hash using two parallel computation lines (left and right) designed by Hans Dobbertin, Antoon Bosselaers, and Bart Preneel in 1996.',
  useCases: ['Legacy security protocols', 'Cryptographic research'],
  security: 'weakened',
  securityNote: '128-bit digest length provides insufficient collision resistance for modern standards.',
  year: 1996,
  designers: ['Hans Dobbertin', 'Antoon Bosselaers', 'Bart Preneel'],
};

export class RIPEMD128Plugin implements AlgorithmPlugin {
  info = ripemd128Info;

  compute(input: string) {
    return computeRIPEMDFamily(input, { variant: 'RIPEMD-128' });
  }
}

export default new RIPEMD128Plugin();
