import { describe, it, expect } from 'vitest';
import ripemd256 from '../../src/algorithms/ripemd256';

describe('RIPEMD-256 Plugin', () => {
  it('computes empty string correctly against reference', () => {
    const { digest, steps } = ripemd256.compute('');
    expect(digest).toBe('02ba4c4e5f8ecd1877fc52d64d30e37a2d9774fb1e5d026380ae0168e3c5522d');
    expect(digest.length).toBe(64);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" correctly against reference', () => {
    const { digest } = ripemd256.compute('abc');
    expect(digest).toBe('afbd6e228b9d8cbbcef5ca2d03e6dba10ac0bc7dcbe4680e1e42d2e975459b65');
  });

  it('has correct metadata', () => {
    expect(ripemd256.info.name).toBe('RIPEMD-256');
    expect(ripemd256.info.family).toBe('RIPEMD');
    expect(ripemd256.info.digestSize).toBe(256);
  });
});
