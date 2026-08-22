import { describe, it, expect } from 'vitest';
import {
  aes192EcbEncrypt,
  aes192EcbDecrypt,
  aes192CbcEncrypt,
  aes192CbcDecrypt,
  aes192CtrEncrypt,
  aes192CtrDecrypt,
} from '../../src/algorithms/symmetric/aes';

describe('AES-192 Plugins (NIST FIPS 197 & SP 800-38A)', () => {
  const key192 = '8e73b0f7da0e6452c810f32b809079e562f8ead2522c6b7b';
  const plain192 = '6bc1bee22e409f96e93d7e117393172a';
  const ecbCipher192 = 'bd334f1d6e45f25ff712a214571fa5cc';

  it('computes AES-192-ECB Encryption & Decryption correctly against NIST FIPS 197 / SP 800-38A Section F.1.3', () => {
    const encRes = aes192EcbEncrypt.compute(plain192, { keyHex: key192 });
    expect(encRes.digest).toBe(ecbCipher192);

    const decRes = aes192EcbDecrypt.compute(ecbCipher192, { keyHex: key192 });
    expect(decRes.digest).toBe(plain192);
  });

  it('computes AES-192-CBC Encryption & Decryption correctly against NIST SP 800-38A Section F.2.3', () => {
    const iv = '000102030405060708090a0b0c0d0e0f';
    const cbcCipher = '4f021db243bc633d7178183a9fa071e8';

    const encRes = aes192CbcEncrypt.compute(plain192, { keyHex: key192, ivHex: iv });
    expect(encRes.digest).toBe(cbcCipher);

    const decRes = aes192CbcDecrypt.compute(cbcCipher, { keyHex: key192, ivHex: iv });
    expect(decRes.digest).toBe(plain192);
  });

  it('computes AES-192-CTR Encryption & Decryption correctly against NIST SP 800-38A Section F.5.3', () => {
    const iv = 'f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff';
    const ctrCipher = '1abc932417521ca24f2b0459fe7e6e0b';

    const encRes = aes192CtrEncrypt.compute(plain192, { keyHex: key192, ivHex: iv });
    expect(encRes.digest).toBe(ctrCipher);

    const decRes = aes192CtrDecrypt.compute(ctrCipher, { keyHex: key192, ivHex: iv });
    expect(decRes.digest).toBe(plain192);
  });
});
