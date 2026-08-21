import { describe, it, expect } from 'vitest';
import ripemd128 from '../../src/algorithms/ripemd128';

describe('RIPEMD-128 Plugin', () => {
  it('computes empty string correctly against reference', () => {
    const { digest, steps } = ripemd128.compute('');
    expect(digest).toBe('cdf26213a150dc3ecb610f18f6b38b46');
    expect(digest.length).toBe(32);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" correctly against reference', () => {
    const { digest } = ripemd128.compute('abc');
    expect(digest).toBe('c14a12199c66e4ba84636b0f69144c77');
  });

  it('computes "message digest" correctly against reference', () => {
    const { digest } = ripemd128.compute('message digest');
    expect(digest).toBe('9e327b3d6e523062afc1132d7df9d1b8');
  });

  it('has correct metadata', () => {
    expect(ripemd128.info.name).toBe('RIPEMD-128');
    expect(ripemd128.info.family).toBe('RIPEMD');
    expect(ripemd128.info.digestSize).toBe(128);
  });
});
