import { AlgorithmPlugin, AlgorithmInfo } from '../types';
import { computeSHA512Family } from '../sha512/engine';
import { H_512_256 } from '../sha512/constants';

export const sha512_256Info: AlgorithmInfo = {
  name: 'SHA-512/256',
  family: 'SHA-2',
  digestSize: 256,
  blockSize: 1024,
  description: 'SHA-512/256 is a 256-bit hash using the 64-bit SHA-512 engine with unique initial values, providing high performance on 64-bit platforms and length extension resistance.',
  useCases: ['High-performance 64-bit hashing', 'File integrity', 'Digital signatures'],
  security: 'secure',
  year: 2012,
  designers: ['NSA (National Security Agency)'],
};

export class SHA512_256Plugin implements AlgorithmPlugin {
  info = sha512_256Info;

  compute(input: string) {
    return computeSHA512Family(input, {
      initialHash: H_512_256,
      outputBits: 256,
      algoName: 'SHA-512/256',
    });
  }
}

export default new SHA512_256Plugin();
