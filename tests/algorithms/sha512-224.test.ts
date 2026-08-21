import { describe, it, expect } from 'vitest';
import sha512_224 from '../../src/algorithms/sha512-224';

describe('SHA-512/224 Plugin', () => {
  it('computes empty string correctly against NIST FIPS 180-4', () => {
    const { digest, steps } = sha512_224.compute('');
    expect(digest).toBe('6ed0dd02806fa89e25de060c19d3ac86cabb87d6a0ddd05c333b84f4');
    expect(digest.length).toBe(56);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" correctly against NIST FIPS 180-4', () => {
    const { digest } = sha512_224.compute('abc');
    expect(digest).toBe('4634270f707b6a54daae7530460842e20e37ed265ceee9a43e8924aa');
  });

  it('has correct metadata', () => {
    expect(sha512_224.info.name).toBe('SHA-512/224');
    expect(sha512_224.info.family).toBe('SHA-2');
    expect(sha512_224.info.digestSize).toBe(224);
  });
});
