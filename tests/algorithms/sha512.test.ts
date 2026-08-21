import { describe, it, expect } from 'vitest';
import sha512 from '../../src/algorithms/sha512';

describe('SHA-512', () => {
  it('computes empty string hash correctly', () => {
    const result = sha512.compute('');
    expect(result.digest).toBe(
      'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
    );
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" hash correctly', () => {
    const result = sha512.compute('abc');
    expect(result.digest).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    );
    expect(result.digest.length).toBe(128); // 512 bits = 128 hex chars
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('has correct metadata', () => {
    expect(sha512.info.name).toBe('SHA-512');
    expect(sha512.info.digestSize).toBe(512);
    expect(sha512.info.blockSize).toBe(1024);
  });
});
