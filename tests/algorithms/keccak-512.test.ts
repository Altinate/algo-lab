import { describe, it, expect } from 'vitest';
import keccak512 from '../../src/algorithms/keccak-512';

describe('Keccak-512 Plugin', () => {
  it('computes empty string correctly against Keccak reference', () => {
    const { digest, steps } = keccak512.compute('');
    expect(digest).toBe('0eab42de4c3ceb9235fc91acffe746b29c29a8c366b7c60e4e67c466f36a4304c00fa9caf9d87976ba469bcbe06713b435f091ef2769fb160cdab33d3670680e');
    expect(digest.length).toBe(128);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" correctly against Keccak reference', () => {
    const { digest } = keccak512.compute('abc');
    expect(digest).toBe('18587dc2ea106b9a1563e32b3312421ca164c7f1f07bc922a9c83d77cea3a1e5d0c69910739025372dc14ac9642629379540c17e2a65b19d77aa511a9d00bb96');
  });

  it('has correct metadata', () => {
    expect(keccak512.info.name).toBe('Keccak-512');
    expect(keccak512.info.family).toBe('SHA-3');
    expect(keccak512.info.digestSize).toBe(512);
  });
});
