import { describe, it, expect } from 'vitest';
import {
  aes128EcbEncrypt,
  aes128EcbDecrypt,
  aes128CbcEncrypt,
  aes128CbcDecrypt,
  aes128CtrEncrypt,
  aes128CtrDecrypt,
} from '../../src/algorithms/symmetric/aes';

describe('AES-128 Plugins (NIST FIPS 197 & SP 800-38A)', () => {
  const fipsKey = '2b7e151628aed2a6abf7158809cf4f3c';
  const fipsPlain = '3243f6a8885a308d313198a2e0370734';
  const fipsCipher = '3925841d02dc09fbdc118597196a0b32';

  it('computes AES-128-ECB Encryption correctly against NIST FIPS 197 Appendix B', () => {
    const res = aes128EcbEncrypt.compute(fipsPlain, { keyHex: fipsKey });
    expect(res.digest).toBe(fipsCipher);
    expect(res.steps.length).toBeGreaterThan(0);
  });

  it('computes AES-128-ECB Decryption correctly (Round-Trip)', () => {
    const res = aes128EcbDecrypt.compute(fipsCipher, { keyHex: fipsKey });
    expect(res.digest).toBe(fipsPlain);
    expect(res.steps.length).toBeGreaterThan(0);
  });

  it('computes AES-128-CBC Encryption correctly against NIST SP 800-38A Section F.2.1', () => {
    const cbcKey = '2b7e151628aed2a6abf7158809cf4f3c';
    const cbcIv = '000102030405060708090a0b0c0d0e0f';
    const cbcPlain = '6bc1bee22e409f96e93d7e117393172a';
    const cbcCipher = '7649abac8119b246cee98e9b12e9197d';

    const encRes = aes128CbcEncrypt.compute(cbcPlain, { keyHex: cbcKey, ivHex: cbcIv });
    expect(encRes.digest).toBe(cbcCipher);

    const decRes = aes128CbcDecrypt.compute(cbcCipher, { keyHex: cbcKey, ivHex: cbcIv });
    expect(decRes.digest).toBe(cbcPlain);
  });

  it('computes AES-128-CTR Encryption & Decryption correctly against NIST SP 800-38A Section F.5.1', () => {
    const ctrKey = '2b7e151628aed2a6abf7158809cf4f3c';
    const ctrIv = 'f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff';
    const ctrPlain = '6bc1bee22e409f96e93d7e117393172a';
    const ctrCipher = '874d6191b620e3261bef6864990db6ce';

    const encRes = aes128CtrEncrypt.compute(ctrPlain, { keyHex: ctrKey, ivHex: ctrIv });
    expect(encRes.digest).toBe(ctrCipher);

    const decRes = aes128CtrDecrypt.compute(ctrCipher, { keyHex: ctrKey, ivHex: ctrIv });
    expect(decRes.digest).toBe(ctrPlain);
  });
});
