import { describe, it, expect } from 'vitest';
import xxh32 from '../../src/algorithms/xxhash/xxh32';

describe('XXH32 Plugin', () => {
  it('computes empty string correctly against reference', () => {
    const { digest, steps } = xxh32.compute('');
    expect(digest).toBe('02cc5d05');
    expect(digest.length).toBe(8);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" correctly against reference', () => {
    const { digest } = xxh32.compute('abc');
    expect(digest).toBe('32d153ff');
  });

  it('computes long string (>16 bytes) with multi-stripe accumulators', () => {
    const { digest, steps } = xxh32.compute('The quick brown fox jumps over the lazy dog');
    expect(digest.length).toBe(8);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('has correct metadata', () => {
    expect(xxh32.info.name).toBe('XXH32');
    expect(xxh32.info.family).toBe('XXHash');
    expect(xxh32.info.security).toBe('non-cryptographic');
  });
});
