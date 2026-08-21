import { describe, it, expect } from 'vitest';
import crc16 from '../../src/algorithms/crc16';

describe('CRC-16 Plugin', () => {
  it('computes empty string correctly', () => {
    const { digest, steps } = crc16.compute('');
    expect(digest).toBe('0000');
    expect(digest.length).toBe(4);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "123456789" correctly against standard CRC-16/IBM vector', () => {
    const { digest } = crc16.compute('123456789');
    expect(digest).toBe('bb3d');
  });

  it('computes "abc" correctly', () => {
    const { digest } = crc16.compute('abc');
    expect(digest).toBe('9738');
  });

  it('has correct metadata', () => {
    expect(crc16.info.name).toBe('CRC-16');
    expect(crc16.info.family).toBe('CRC');
    expect(crc16.info.security).toBe('non-cryptographic');
  });
});
