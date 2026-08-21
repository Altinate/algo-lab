import { describe, it, expect } from 'vitest';
import keccak_256 from '../../src/algorithms/keccak';

describe('Keccak-256', () => {
  it('computes empty string hash correctly', () => {
    const result = keccak_256.compute('');
    expect(result.digest).toBe(
      'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
    );
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" hash correctly', () => {
    const result = keccak_256.compute('abc');
    expect(result.digest).toBe(
      '4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45',
    );
    expect(result.digest.length).toBe(64);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('has correct metadata', () => {
    expect(keccak_256.info.name).toBe('Keccak-256');
    expect(keccak_256.info.family).toBe('SHA-3');
    expect(keccak_256.info.digestSize).toBe(256);
  });
});
