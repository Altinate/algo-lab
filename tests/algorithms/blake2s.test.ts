import { describe, it, expect } from 'vitest';
import blake2sPlugin from '../../src/algorithms/blake2s/index';

describe('BLAKE2s Algorithm Plugin', () => {
  it('should have correct algorithm info', () => {
    expect(blake2sPlugin.info.name).toBe('BLAKE2s');
    expect(blake2sPlugin.info.digestSize).toBe(256);
  });

  it('should compute empty string correctly', () => {
    const result = blake2sPlugin.compute('');
    expect(result.digest).toBe('69217a3079908094e11121d042354a7c1f55b6482ca1a51e1b250dfd1ed0eef9');
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('should compute "abc" correctly', () => {
    const result = blake2sPlugin.compute('abc');
    expect(result.digest).toBe('508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982');
    expect(result.steps.length).toBeGreaterThan(0);
  });
});
