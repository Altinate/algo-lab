import { describe, it, expect } from 'vitest';
import adler32 from '../../src/algorithms/adler32';

describe('Adler-32 Plugin', () => {
  it('computes empty string correctly against RFC 1950', () => {
    const { digest, steps } = adler32.compute('');
    expect(digest).toBe('00000001');
    expect(digest.length).toBe(8);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "a" correctly', () => {
    const { digest } = adler32.compute('a');
    expect(digest).toBe('00620062');
  });

  it('computes "abc" correctly', () => {
    const { digest } = adler32.compute('abc');
    expect(digest).toBe('024d0127');
  });

  it('computes "123456789" correctly against standard check', () => {
    const { digest } = adler32.compute('123456789');
    expect(digest).toBe('091e01de');
  });

  it('has correct metadata', () => {
    expect(adler32.info.name).toBe('Adler-32');
    expect(adler32.info.family).toBe('Checksum');
    expect(adler32.info.security).toBe('non-cryptographic');
  });
});
