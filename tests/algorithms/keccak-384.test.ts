import { describe, it, expect } from 'vitest';
import keccak384 from '../../src/algorithms/keccak-384';

describe('Keccak-384 Plugin', () => {
  it('computes empty string correctly against Keccak reference', () => {
    const { digest, steps } = keccak384.compute('');
    expect(digest).toBe('2c23146a63a29acf99e73b88f8c24eaa7dc60aa771780ccc006afbfa8fe2479b2dd2b21362337441ac12b515911957ff');
    expect(digest.length).toBe(96);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" correctly against Keccak reference', () => {
    const { digest } = keccak384.compute('abc');
    expect(digest).toBe('f7df1165f033337be098e7d288ad6a2f74409d7a60b49c36642218de161b1f99f8c681e4afaf31a34db29fb763e3c28e');
  });

  it('has correct metadata', () => {
    expect(keccak384.info.name).toBe('Keccak-384');
    expect(keccak384.info.family).toBe('SHA-3');
    expect(keccak384.info.digestSize).toBe(384);
  });
});
