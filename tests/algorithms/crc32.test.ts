import { describe, it, expect } from 'vitest';
import crc32Plugin from '../../src/algorithms/crc32';

describe('CRC32 Plugin', () => {
  it('computes empty string correctly', () => {
    const { digest, steps } = crc32Plugin.compute('');
    expect(digest).toBe('00000000');
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].id).toBeDefined();
    expect(steps[0].title).toBeDefined();
    expect(steps[0].phase).toBeDefined();
    expect(steps[0].description).toBeDefined();
  });

  it('computes "123456789" correctly', () => {
    const { digest } = crc32Plugin.compute('123456789');
    expect(digest).toBe('cbf43926');
  });

  it('computes "abc" correctly', () => {
    const { digest } = crc32Plugin.compute('abc');
    expect(digest).toBe('352441c2');
  });
});
