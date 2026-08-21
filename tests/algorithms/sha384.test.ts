import { describe, it, expect } from 'vitest';
import sha384 from '../../src/algorithms/sha384';

describe('SHA-384', () => {
  it('computes empty string hash correctly', () => {
    const result = sha384.compute('');
    expect(result.digest).toBe(
      '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b',
    );
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" hash correctly', () => {
    const result = sha384.compute('abc');
    expect(result.digest).toBe(
      'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
    );
    expect(result.digest.length).toBe(96); // 384 bits = 96 hex characters
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('has correct metadata', () => {
    expect(sha384.info.name).toBe('SHA-384');
    expect(sha384.info.digestSize).toBe(384);
    expect(sha384.info.blockSize).toBe(1024);
  });
});
