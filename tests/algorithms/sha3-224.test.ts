import { describe, it, expect } from 'vitest';
import sha3_224 from '../../src/algorithms/sha3-224';

describe('SHA3-224 Plugin', () => {
  it('computes empty string correctly against NIST FIPS 202', () => {
    const { digest, steps } = sha3_224.compute('');
    expect(digest).toBe('6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7');
    expect(digest.length).toBe(56);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" correctly against NIST FIPS 202', () => {
    const { digest } = sha3_224.compute('abc');
    expect(digest).toBe('e642824c3f8cf24ad09234ee7d3c766fc9a3a5168d0c94ad73b46fdf');
  });

  it('has correct metadata', () => {
    expect(sha3_224.info.name).toBe('SHA3-224');
    expect(sha3_224.info.family).toBe('SHA-3');
    expect(sha3_224.info.digestSize).toBe(224);
  });
});
