import { describe, it, expect } from 'vitest';
import blake2bPlugin from '../../src/algorithms/blake2b/index';

describe('BLAKE2b Algorithm Plugin', () => {
  it('should have correct algorithm info', () => {
    expect(blake2bPlugin.info.name).toBe('BLAKE2b');
    expect(blake2bPlugin.info.digestSize).toBe(512);
  });

  it('should compute empty string correctly', () => {
    const result = blake2bPlugin.compute('');
    expect(result.digest).toBe(
      '786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce',
    );
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('should compute "abc" correctly', () => {
    const result = blake2bPlugin.compute('abc');
    expect(result.digest).toBe(
      'ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923',
    );
    expect(result.steps.length).toBeGreaterThan(0);
  });
});
