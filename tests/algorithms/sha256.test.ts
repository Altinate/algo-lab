import { describe, it, expect } from 'vitest';
import { sha256Plugin } from '../../src/algorithms/sha256';

describe('SHA-256', () => {
  // Test vectors from NIST FIPS 180-4
  const vectors = [
    {
      input: '',
      expected: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
    {
      input: 'abc',
      expected: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    },
    {
      input: 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
      expected: '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    },
    {
      input: 'Hello, World!',
      expected: 'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f',
    },
  ];

  vectors.forEach(({ input, expected }) => {
    it(`hashes "${input.slice(0, 30)}${input.length > 30 ? '...' : ''}" correctly`, () => {
      const result = sha256Plugin.compute(input);
      expect(result.digest).toBe(expected);
    });
  });

  it('returns non-empty steps array', () => {
    const result = sha256Plugin.compute('abc');
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('steps have all required fields', () => {
    const result = sha256Plugin.compute('abc');
    for (const step of result.steps) {
      expect(step.id).toBeTruthy();
      expect(step.title).toBeTruthy();
      expect(step.phase).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(step.visualizationType).toBeTruthy();
      expect(step.data).toBeDefined();
    }
  });

  it('first step is input encoding', () => {
    const result = sha256Plugin.compute('abc');
    expect(result.steps[0].id).toBe('input-encoding');
    expect(result.steps[0].phase).toBe('Pre-processing');
  });

  it('last step is final digest', () => {
    const result = sha256Plugin.compute('abc');
    const lastStep = result.steps[result.steps.length - 1];
    expect(lastStep.id).toBe('final-digest');
    expect(lastStep.phase).toBe('Output');
  });

  it('handles multi-block messages (> 55 bytes)', () => {
    const longInput = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
    const result = sha256Plugin.compute(longInput);
    expect(result.digest).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
    // Should have 2 message block steps
    const blockSteps = result.steps.filter((s) => s.id.startsWith('block-'));
    expect(blockSteps.length).toBeGreaterThanOrEqual(2);
  });

  it('has correct algorithm info', () => {
    expect(sha256Plugin.info.name).toBe('SHA-256');
    expect(sha256Plugin.info.family).toBe('SHA-2');
    expect(sha256Plugin.info.digestSize).toBe(256);
    expect(sha256Plugin.info.blockSize).toBe(512);
    expect(sha256Plugin.info.security).toBe('secure');
  });
});
