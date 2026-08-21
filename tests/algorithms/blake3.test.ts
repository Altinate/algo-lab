import { describe, it, expect } from 'vitest';
import blake3Plugin from '../../src/algorithms/blake3/index';

describe('BLAKE3 Algorithm Plugin', () => {
  it('should have correct algorithm info', () => {
    expect(blake3Plugin.info.name).toBe('BLAKE3');
    expect(blake3Plugin.info.digestSize).toBe(256);
  });

  it('should compute empty string correctly', () => {
    const result = blake3Plugin.compute('');
    expect(result.digest).toBe(
      'af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262',
    );
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('should compute "abc" correctly', () => {
    const result = blake3Plugin.compute('abc');
    expect(result.digest).toBe(
      '6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85',
    );
    expect(result.steps.length).toBeGreaterThan(0);
  });
});
