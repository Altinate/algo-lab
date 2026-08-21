import { describe, it, expect } from 'vitest';
import { sha224Plugin } from '../../src/algorithms/sha224';

describe('SHA-224', () => {
  // Test vectors from NIST FIPS 180-4
  const vectors = [
    {
      input: '',
      expected: 'd14a028c2a3a2bc9476102bb288234c415a2b01f828ea62ac5b3e42f',
    },
    {
      input: 'abc',
      expected: '23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7',
    },
    {
      input: 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
      expected: '75388b16512776cc5dba5da1fd890150b0c6455cb4f58b1952522525',
    },
  ];

  vectors.forEach(({ input, expected }) => {
    it(`hashes "${input.slice(0, 30)}${input.length > 30 ? '...' : ''}" correctly`, () => {
      const result = sha224Plugin.compute(input);
      expect(result.digest).toBe(expected);
    });
  });

  it('produces 224-bit (56 hex char) digest', () => {
    const result = sha224Plugin.compute('abc');
    expect(result.digest.length).toBe(56);
  });

  it('has correct algorithm info', () => {
    expect(sha224Plugin.info.name).toBe('SHA-224');
    expect(sha224Plugin.info.family).toBe('SHA-2');
    expect(sha224Plugin.info.digestSize).toBe(224);
    expect(sha224Plugin.info.security).toBe('secure');
  });
});
