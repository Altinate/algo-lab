import { AlgorithmPlugin, AlgorithmInfo } from '../types';
import { computeSHA512Family } from '../sha512/engine';
import { H_512_224 } from '../sha512/constants';

export const sha512_224Info: AlgorithmInfo = {
  name: 'SHA-512/224',
  family: 'SHA-2',
  digestSize: 224,
  blockSize: 1024,
  description: 'SHA-512/224 is a 224-bit hash using the 64-bit SHA-512 engine with unique initial values to mitigate length extension vulnerabilities on 64-bit hardware.',
  useCases: ['Digital signatures', '64-bit hardware acceleration', 'TLS certificates'],
  security: 'secure',
  year: 2012,
  designers: ['NSA (National Security Agency)'],
};

export class SHA512_224Plugin implements AlgorithmPlugin {
  info = sha512_224Info;

  compute(input: string) {
    return computeSHA512Family(input, {
      initialHash: H_512_224,
      outputBits: 224,
      algoName: 'SHA-512/224',
    });
  }
}

export default new SHA512_224Plugin();
