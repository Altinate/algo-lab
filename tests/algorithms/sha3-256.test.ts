import { describe, it, expect } from 'vitest';
import sha3_256 from '../../src/algorithms/sha3-256';

describe('SHA3-256', () => {
  it('computes empty string hash correctly', () => {
    const result = sha3_256.compute('');
    expect(result.digest).toBe(
      'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a',
    );
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" hash correctly', () => {
    const result = sha3_256.compute('abc');
    expect(result.digest).toBe(
      '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532',
    );
    expect(result.digest.length).toBe(64);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('has correct metadata', () => {
    expect(sha3_256.info.name).toBe('SHA3-256');
    expect(sha3_256.info.family).toBe('SHA-3');
    expect(sha3_256.info.digestSize).toBe(256);
  });
});
