import { describe, it, expect } from 'vitest';
import sha3_384 from '../../src/algorithms/sha3-384';

describe('SHA3-384 Plugin', () => {
  it('computes empty string correctly against NIST FIPS 202', () => {
    const { digest, steps } = sha3_384.compute('');
    expect(digest).toBe('0c63a75b845e4f7d01107d852e4c2485c51a50aaaa94fc61995e71bbee983a2ac3713831264adb47fb6bd1e058d5f004');
    expect(digest.length).toBe(96);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" correctly against NIST FIPS 202', () => {
    const { digest } = sha3_384.compute('abc');
    expect(digest).toBe('ec01498288516fc926459f58e2c6ad8df9b473cb0fc08c2596da7cf0e49be4b298d88cea927ac7f539f1edf228376d25');
  });

  it('has correct metadata', () => {
    expect(sha3_384.info.name).toBe('SHA3-384');
    expect(sha3_384.info.family).toBe('SHA-3');
    expect(sha3_384.info.digestSize).toBe(384);
  });
});
