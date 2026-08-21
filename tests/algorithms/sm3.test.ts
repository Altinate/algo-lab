import { describe, it, expect } from 'vitest';
import sm3 from '../../src/algorithms/sm3';

describe('SM3 Plugin', () => {
  it('computes empty string correctly against GB/T 32918.2-2016', () => {
    const { digest, steps } = sm3.compute('');
    expect(digest).toBe('1ab21d8355cfa17f8e61194831e81a8f22bec8c728fefb747ed035eb5082aa2b');
    expect(digest.length).toBe(64);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" correctly against GB/T 32918.2-2016', () => {
    const { digest } = sm3.compute('abc');
    expect(digest).toBe('66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0');
  });

  it('computes multi-block input "abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd"', () => {
    const { digest } = sm3.compute('abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd');
    expect(digest).toBe('debe9ff92275b8a138604889c18e5a4d6fdb70e5387e5765293dcba39c0c5732');
  });

  it('has correct metadata', () => {
    expect(sm3.info.name).toBe('SM3');
    expect(sm3.info.family).toBe('Chinese National Standard');
    expect(sm3.info.security).toBe('secure');
  });
});
