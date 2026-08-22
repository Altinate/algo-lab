import { describe, it, expect } from 'vitest';
import {
  aes128GcmEncrypt,
  aes128GcmDecrypt,
  aes256GcmEncrypt,
  aes256GcmDecrypt,
} from '../../src/algorithms/symmetric/aes';

describe('AES-GCM Authenticated Encryption (NIST SP 800-38D)', () => {
  // NIST GCM Test Case 1 (128-bit key, empty plaintext, empty AAD)
  it('computes AES-128-GCM Test Case 1 (Empty Plaintext, Empty AAD)', () => {
    const key = '00000000000000000000000000000000';
    const iv = '000000000000000000000000'; // 96-bit IV
    const plain = '';

    const encRes = aes128GcmEncrypt.compute(plain, { keyHex: key, ivHex: iv, aadHex: '' });
    expect(encRes.digest).toBe('');
    expect(encRes.tagHex).toBe('58e2fccefa7e3061367f1d57a4e7455a');

    const decRes = aes128GcmDecrypt.compute('', {
      keyHex: key,
      ivHex: iv,
      aadHex: '',
      tagHex: '58e2fccefa7e3061367f1d57a4e7455a',
    });
    expect(decRes.digest).toBe('');
    expect(decRes.tagValid).toBe(true);
  });

  // NIST GCM Test Case 2 (128-bit key, 16B plaintext, empty AAD)
  it('computes AES-128-GCM Test Case 2 (16B Plaintext, Empty AAD)', () => {
    const key = '00000000000000000000000000000000';
    const iv = '000000000000000000000000';
    const plain = '00000000000000000000000000000000';

    const encRes = aes128GcmEncrypt.compute(plain, { keyHex: key, ivHex: iv, aadHex: '' });
    expect(encRes.digest).toBe('0388dace60b6a392f328c2b971b2fe78');
    expect(encRes.tagHex).toBe('ab6e47d42cec13bdf53a67b21257bddf');

    const decRes = aes128GcmDecrypt.compute('0388dace60b6a392f328c2b971b2fe78', {
      keyHex: key,
      ivHex: iv,
      aadHex: '',
      tagHex: 'ab6e47d42cec13bdf53a67b21257bddf',
    });
    expect(decRes.digest).toBe(plain);
    expect(decRes.tagValid).toBe(true);
  });

  // NIST GCM Test Case with AAD
  it('computes AES-256-GCM Encryption and Decryption with AAD', () => {
    const key = 'feffe9928665731c6d6a8f9467308308feffe9928665731c6d6a8f9467308308';
    const iv = 'cafebabefacedbaddecaf888';
    const plain = 'd9313225f88406e5a55909c5aff5269a86a7a9531534f7da2e4c303d8a318a721c3c0c95956809532fcf0e2449a6b525b16aedf5aa0de657ba637b391aafd255';
    const aad = 'feedfacedeadbeefcafebeeffeedfacedeadbeefcafebeefabaddad2';
    const expectedCipher =
      '522dc1f099567d07f47f37a32a84427d643a8cdcbfe5c0c97598a2bd2555d1aa8cb08e48590dbb3da7b08b1056828838c5f61e6393ba7a0abcc9f662898015ad';
    const expectedTag = '9d16d6be9b3a6694e75130b189aab55f';

    const encRes = aes256GcmEncrypt.compute(plain, { keyHex: key, ivHex: iv, aadHex: aad });
    expect(encRes.digest).toBe(expectedCipher);
    expect(encRes.tagHex).toBe(expectedTag);

    const decRes = aes256GcmDecrypt.compute(expectedCipher, {
      keyHex: key,
      ivHex: iv,
      aadHex: aad,
      tagHex: expectedTag,
    });
    expect(decRes.digest).toBe(plain);
    expect(decRes.tagValid).toBe(true);
  });
});
