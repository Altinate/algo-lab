import { describe, it, expect } from 'vitest';
import shake256 from '../../src/algorithms/shake256';

describe('SHAKE256 Plugin', () => {
  it('computes empty string correctly against NIST FIPS 202 (512 bits)', () => {
    const { digest, steps } = shake256.compute('');
    expect(digest).toBe('46b9dd2b0ba88d13233b3feb743eeb243fcd52ea62b81b82b50c27646ed5762fd75dc4ddd8c0f200cb05019d67b592f6fc821c49479ab48640292eacb3b7c4be');
    expect(digest.length).toBe(128); // 64 bytes
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" correctly against NIST FIPS 202 (512 bits)', () => {
    const { digest } = shake256.compute('abc');
    expect(digest).toBe('483366601360a8771c6863080cc4114d8db44530f8f1e1ee4f94ea37e78b5739d5a15bef186a5386c75744c0527e1faa9f8726e462a12a4feb06bd8801e751e4');
  });

  it('has correct metadata', () => {
    expect(shake256.info.name).toBe('SHAKE256');
    expect(shake256.info.family).toBe('SHA-3');
    expect(shake256.info.digestSize).toBe(512);
  });
});
