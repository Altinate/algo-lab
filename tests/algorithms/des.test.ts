import { describe, it, expect } from 'vitest';
import {
  desEcbEncrypt,
  desEcbDecrypt,
  desCbcEncrypt,
  desCbcDecrypt,
} from '../../src/algorithms/symmetric/des';

describe('DES Algorithm (NIST FIPS 46-3)', () => {
  // NIST FIPS 46-3 Official Test Vector
  const fipsKey = '133457799bbcdff1';
  const fipsPlain = '0123456789abcdef';
  const expectedCipher = '85e813540f0ab405';

  it('NIST FIPS 46-3: DES-ECB Encryption', () => {
    const res = desEcbEncrypt.compute(fipsPlain, { keyHex: fipsKey });
    expect(res.digest).toBe(expectedCipher);
  });

  it('NIST FIPS 46-3: DES-ECB Decryption', () => {
    const res = desEcbDecrypt.compute(expectedCipher, { keyHex: fipsKey });
    expect(res.digest).toBe(fipsPlain);
  });

  it('NIST FIPS 46-3: DES-CBC Encryption & Decryption Round-Trip', () => {
    const iv = '1234567890abcdef';
    const plain = '4e6f77206973207468652074696d6520'; // "Now is the time " (16 bytes = 2 blocks)
    const encRes = desCbcEncrypt.compute(plain, { keyHex: fipsKey, ivHex: iv });
    const decRes = desCbcDecrypt.compute(encRes.digest, { keyHex: fipsKey, ivHex: iv });
    expect(decRes.digest).toBe(plain);
  });

  it('generates Feistel step telemetry', () => {
    const res = desEcbEncrypt.compute(fipsPlain, { keyHex: fipsKey });
    expect(res.steps.length).toBeGreaterThan(16);
    expect(res.steps[0].phase).toBe('Key Expansion');
    expect(res.steps[1].phase).toBe('Initial Permutation');
    expect(res.steps.some((s) => s.visualizationType === 'feistel-ladder')).toBe(true);
  });
});
