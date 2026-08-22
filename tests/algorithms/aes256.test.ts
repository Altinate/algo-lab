import { describe, it, expect } from 'vitest';
import {
  aes256EcbEncrypt,
  aes256EcbDecrypt,
  aes256CbcEncrypt,
  aes256CbcDecrypt,
  aes256CtrEncrypt,
  aes256CtrDecrypt,
} from '../../src/algorithms/symmetric/aes';

describe('AES-256 Plugins (NIST FIPS 197 & SP 800-38A)', () => {
  const key256 = '603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4';
  const plain256 = '6bc1bee22e409f96e93d7e117393172a';
  const ecbCipher256 = 'f3eed1bdb5d2a03c064b5a7e3db181f8';

  it('computes AES-256-ECB Encryption & Decryption correctly against NIST FIPS 197 / SP 800-38A Section F.1.5', () => {
    const encRes = aes256EcbEncrypt.compute(plain256, { keyHex: key256 });
    expect(encRes.digest).toBe(ecbCipher256);

    const decRes = aes256EcbDecrypt.compute(ecbCipher256, { keyHex: key256 });
    expect(decRes.digest).toBe(plain256);
  });

  it('computes AES-256-CBC Encryption & Decryption correctly against NIST SP 800-38A Section F.2.5', () => {
    const iv = '000102030405060708090a0b0c0d0e0f';
    const cbcCipher = 'f58c4c04d6e5f1ba779eabfb5f7bfbd6';

    const encRes = aes256CbcEncrypt.compute(plain256, { keyHex: key256, ivHex: iv });
    expect(encRes.digest).toBe(cbcCipher);

    const decRes = aes256CbcDecrypt.compute(cbcCipher, { keyHex: key256, ivHex: iv });
    expect(decRes.digest).toBe(plain256);
  });

  it('computes AES-256-CTR Encryption & Decryption correctly against NIST SP 800-38A Section F.5.5', () => {
    const iv = 'f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff';
    const ctrCipher = '601ec313775789a5b7a7f504bbf3d228';

    const encRes = aes256CtrEncrypt.compute(plain256, { keyHex: key256, ivHex: iv });
    expect(encRes.digest).toBe(ctrCipher);

    const decRes = aes256CtrDecrypt.compute(ctrCipher, { keyHex: key256, ivHex: iv });
    expect(decRes.digest).toBe(plain256);
  });
});
