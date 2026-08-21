import { describe, it, expect } from 'vitest';
import keccak224 from '../../src/algorithms/keccak-224';

describe('Keccak-224 Plugin', () => {
  it('computes empty string correctly against Keccak reference', () => {
    const { digest, steps } = keccak224.compute('');
    expect(digest).toBe('f71837502ba8e10837bdd8d365adb85591895602fc552b48b7390abd');
    expect(digest.length).toBe(56);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" correctly against Keccak reference', () => {
    const { digest } = keccak224.compute('abc');
    expect(digest).toBe('c30411768506ebe1c2871b1ee2e87d38df342317300a9b97a95ec6a8');
  });

  it('has correct metadata', () => {
    expect(keccak224.info.name).toBe('Keccak-224');
    expect(keccak224.info.family).toBe('SHA-3');
    expect(keccak224.info.digestSize).toBe(224);
  });
});
