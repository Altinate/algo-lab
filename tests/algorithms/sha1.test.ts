import { describe, it, expect } from 'vitest';
import sha1Plugin from '../../src/algorithms/sha1';

describe('SHA-1 Plugin', () => {
  it('computes empty string correctly', () => {
    const { digest, steps } = sha1Plugin.compute('');
    expect(digest).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].id).toBeDefined();
    expect(steps[0].title).toBeDefined();
    expect(steps[0].phase).toBeDefined();
    expect(steps[0].description).toBeDefined();
  });

  it('computes "abc" correctly', () => {
    const { digest } = sha1Plugin.compute('abc');
    expect(digest).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
  });

  it('computes long string correctly', () => {
    const { digest } = sha1Plugin.compute('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq');
    expect(digest).toBe('84983e441c3bd26ebaae4aa1f95129e5e54670f1');
  });
});
