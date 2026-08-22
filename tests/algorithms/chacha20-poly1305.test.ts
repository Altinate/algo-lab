import { describe, it, expect } from 'vitest';
import {
  chacha20Poly1305Encrypt,
  chacha20Poly1305Decrypt,
} from '../../src/algorithms/symmetric/chacha20-poly1305';

describe('ChaCha20-Poly1305 AEAD (IETF RFC 8439 Section 2.8)', () => {
  // RFC 8439 Section 2.8.2 Official AEAD Test Vector
  const keyHex = '808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f';
  const nonceHex = '070000004041424344454647';
  const aadHex = '50515253c0c1c2c3c4c5c6c7';
  const plaintext = "Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.";

  const expectedCipherHex =
    'd31a8d34648e60db7b86afbc53ef7ec2a4aded51296e08fea9e2b5a736ee62d6' +
    '3dbea45e8ca9671282fafb69da92728b1a71de0a9e060b2905d6a5b67ecd3b36' +
    '92ddbd7f2d778b8c9803aee328091b58fab324e4fad675945585808b4831d7bc' +
    '3ff4def08e4b7a9de576d26586cec64b6116';
  const expectedTagHex = '1ae10b594f09e26a7e902ecbd0600691';

  it('RFC 8439 Section 2.8.2: ChaCha20-Poly1305 AEAD Encryption & Tag Generation', () => {
    const res = chacha20Poly1305Encrypt.compute(plaintext, {
      keyHex,
      ivHex: nonceHex,
      aadHex,
    });
    expect(res.digest).toBe(expectedCipherHex);
    expect(res.tagHex).toBe(expectedTagHex);
  });

  it('RFC 8439 Section 2.8.2: ChaCha20-Poly1305 AEAD Decryption & Tag Verification', () => {
    const res = chacha20Poly1305Decrypt.compute(expectedCipherHex, {
      keyHex,
      ivHex: nonceHex,
      aadHex,
      tagHex: expectedTagHex,
    });
    const decodedPlaintext = new TextDecoder().decode(
      new Uint8Array(res.digest.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))
    );
    expect(decodedPlaintext).toBe(plaintext);
    expect(res.tagValid).toBe(true);
  });

  it('detects corrupted tag (forgery detection)', () => {
    const corruptedTag = '00000000000000000000000000000000';
    const res = chacha20Poly1305Decrypt.compute(expectedCipherHex, {
      keyHex,
      ivHex: nonceHex,
      aadHex,
      tagHex: corruptedTag,
    });
    expect(res.tagValid).toBe(false);
  });
});
