import { describe, it, expect } from 'vitest';
import {
  chacha20Encrypt,
  chacha20Decrypt,
} from '../../src/algorithms/symmetric/chacha20-poly1305';
import { hexToString } from '../../src/algorithms/utils';

describe('ChaCha20 Stream Cipher (IETF RFC 8439 Section 2.4)', () => {
  // RFC 8439 Section 2.4.2 Official Test Vector Parameters
  const keyHex = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
  const nonceHex = '000000000000004a00000000';
  const plaintext = "Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.";

  const expectedCipherHex =
    '6e2e359a2568f98041ba0728dd0d6981e97e7aec1d4360c20a27afccfd9fae0b' +
    'f91b65c5524733ab8f593dabcd62b3571639d624e65152ab8f530c359f0861d8' +
    '07ca0dbf500d6a6156a38e088a22b65e52bc514d16ccf806818ce91ab7793736' +
    '5af90bbf74a35be6b40b8eedf2785e42874d';

  it('RFC 8439 Section 2.4.2: ChaCha20 Multi-Block Keystream Encryption', () => {
    const res = chacha20Encrypt.compute(plaintext, { keyHex, ivHex: nonceHex });
    expect(res.digest).toBe(expectedCipherHex);
  });

  it('RFC 8439 Section 2.4.2: ChaCha20 Decryption Recovers Plaintext', () => {
    const res = chacha20Decrypt.compute(expectedCipherHex, { keyHex, ivHex: nonceHex });
    const decodedPlaintext = hexToString(res.digest);
    expect(decodedPlaintext).toBe(plaintext);
  });

  it('generates 4x4 ARX mixing telemetry with Quarter-Rounds', () => {
    const res = chacha20Encrypt.compute(plaintext, { keyHex, ivHex: nonceHex });
    expect(res.steps.length).toBeGreaterThan(20);
    expect(res.steps.some((s) => s.visualizationType === 'mixing-function')).toBe(true);
  });
});
