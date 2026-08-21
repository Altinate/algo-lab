import { describe, it, expect } from 'vitest';
import shake128 from '../../src/algorithms/shake128';

describe('SHAKE128 Plugin', () => {
  it('computes empty string correctly against NIST FIPS 202 (256 bits)', () => {
    const { digest, steps } = shake128.compute('');
    expect(digest).toBe('7f9c2ba4e88f827d616045507605853ed73b8093f6efbc88eb1a6eacfa66ef26');
    expect(digest.length).toBe(64); // 32 bytes
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" correctly against NIST FIPS 202 (256 bits)', () => {
    const { digest } = shake128.compute('abc');
    expect(digest).toBe('5881092dd818bf5cf8a3ddb793fbcba74097d5c526a6d35f97b83351940f2cc8');
  });

  it('has correct metadata', () => {
    expect(shake128.info.name).toBe('SHAKE128');
    expect(shake128.info.family).toBe('SHA-3');
    expect(shake128.info.digestSize).toBe(256);
  });
});
