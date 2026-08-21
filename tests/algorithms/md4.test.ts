import { describe, it, expect } from 'vitest';
import md4 from '../../src/algorithms/md4';

describe('MD4 Plugin', () => {
  it('computes empty string correctly against RFC 1320', () => {
    const { digest, steps } = md4.compute('');
    expect(digest).toBe('31d6cfe0d16ae931b73c59d7e0c089c0');
    expect(digest.length).toBe(32);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "a" correctly against RFC 1320', () => {
    const { digest } = md4.compute('a');
    expect(digest).toBe('bde52cb31de33e46245e05fbdbd6fb24');
  });

  it('computes "abc" correctly against RFC 1320', () => {
    const { digest } = md4.compute('abc');
    expect(digest).toBe('a448017aaf21d8525fc10ae87aa6729d');
  });

  it('computes "message digest" correctly against RFC 1320', () => {
    const { digest } = md4.compute('message digest');
    expect(digest).toBe('d9130a8164549fe818874806e1c7014b');
  });

  it('has correct metadata', () => {
    expect(md4.info.name).toBe('MD4');
    expect(md4.info.family).toBe('MD');
    expect(md4.info.security).toBe('broken');
  });
});
