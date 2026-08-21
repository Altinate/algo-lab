import { describe, it, expect } from 'vitest';
import xxh64 from '../../src/algorithms/xxhash/xxh64';

describe('XXH64 Plugin', () => {
  it('computes empty string correctly against reference', () => {
    const { digest, steps } = xxh64.compute('');
    expect(digest).toBe('ef46db3751d8e999');
    expect(digest.length).toBe(16);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" correctly against reference', () => {
    const { digest } = xxh64.compute('abc');
    expect(digest).toBe('44bc2cf5ad770999');
  });

  it('computes long string (>32 bytes) with 64-bit multi-stripe accumulators', () => {
    const { digest, steps } = xxh64.compute('The quick brown fox jumps over the lazy dog');
    expect(digest.length).toBe(16);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('has correct metadata', () => {
    expect(xxh64.info.name).toBe('XXH64');
    expect(xxh64.info.family).toBe('XXHash');
    expect(xxh64.info.security).toBe('non-cryptographic');
  });
});
