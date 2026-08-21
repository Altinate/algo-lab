import { describe, it, expect } from 'vitest';
import ripemd160 from '../../src/algorithms/ripemd160';

describe('RIPEMD-160 Plugin', () => {
  it('computes empty string correctly against ISO/IEC 10118-3', () => {
    const { digest, steps } = ripemd160.compute('');
    expect(digest).toBe('9c1185a5c5e9fc54612808977ee8f548b2258d31');
    expect(digest.length).toBe(40);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" correctly against ISO/IEC 10118-3', () => {
    const { digest } = ripemd160.compute('abc');
    expect(digest).toBe('8eb208f7e05d987a9b044a8e98c6b087f15a0bfc');
  });

  it('computes "message digest" correctly against ISO/IEC 10118-3', () => {
    const { digest } = ripemd160.compute('message digest');
    expect(digest).toBe('5d0689ef49d2fae572b881b123a85ffa21595f36');
  });

  it('has correct metadata', () => {
    expect(ripemd160.info.name).toBe('RIPEMD-160');
    expect(ripemd160.info.family).toBe('RIPEMD');
    expect(ripemd160.info.digestSize).toBe(160);
  });
});
