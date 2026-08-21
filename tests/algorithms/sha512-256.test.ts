import { describe, it, expect } from 'vitest';
import sha512_256 from '../../src/algorithms/sha512-256';

describe('SHA-512/256 Plugin', () => {
  it('computes empty string correctly against NIST FIPS 180-4', () => {
    const { digest, steps } = sha512_256.compute('');
    expect(digest).toBe('c672b8d1ef56ed28ab87c3622c5114069bdd3ad7b8f9737498d0c01ecef0967a');
    expect(digest.length).toBe(64);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" correctly against NIST FIPS 180-4', () => {
    const { digest } = sha512_256.compute('abc');
    expect(digest).toBe('53048e2681941ef99b2e29b76b4c7dabe4c2d0c634fc6d46e0e2f13107e7af23');
  });

  it('has correct metadata', () => {
    expect(sha512_256.info.name).toBe('SHA-512/256');
    expect(sha512_256.info.family).toBe('SHA-2');
    expect(sha512_256.info.digestSize).toBe(256);
  });
});
