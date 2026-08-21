import { describe, it, expect } from 'vitest';
import sha3_512 from '../../src/algorithms/sha3-512';

describe('SHA3-512', () => {
  it('computes empty string hash correctly', () => {
    const result = sha3_512.compute('');
    expect(result.digest).toBe(
      'a69f73cca23a9ac5c8b567dc185a756e97c982164fe25859e0d1dcc1475c80a615b2123af1f5f94c11e3e9402c3ac558f500199d95b6d3e301758586281dcd26',
    );
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" hash correctly', () => {
    const result = sha3_512.compute('abc');
    expect(result.digest).toBe(
      'b751850b1a57168a5693cd924b6b096e08f621827444f70d884f5d0240d2712e10e116e9192af3c91a7ec57647e3934057340b4cf408d5a56592f8274eec53f0',
    );
    expect(result.digest.length).toBe(128);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('has correct metadata', () => {
    expect(sha3_512.info.name).toBe('SHA3-512');
    expect(sha3_512.info.family).toBe('SHA-3');
    expect(sha3_512.info.digestSize).toBe(512);
  });
});
