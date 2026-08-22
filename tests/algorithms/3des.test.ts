import { describe, it, expect } from 'vitest';
import {
  des3EcbEncrypt,
  des3EcbDecrypt,
  des3CbcEncrypt,
  des3CbcDecrypt,
} from '../../src/algorithms/symmetric/des';

describe('Triple-DES Algorithm (3DES / TDEA NIST SP 800-67)', () => {
  // NIST SP 800-67 / NIST CAVP TDES KAT 3-Key EDE Vector
  const key192 = '0123456789abcdef23456789abcdef01456789abcdef0123';
  const plain64 = '5468652071756963'; // "The quic"

  it('3DES-ECB Encryption & Decryption Invertibility', () => {
    const enc = des3EcbEncrypt.compute(plain64, { keyHex: key192 });
    expect(enc.digest).toBeDefined();
    expect(enc.digest.length).toBe(16);

    const dec = des3EcbDecrypt.compute(enc.digest, { keyHex: key192 });
    expect(dec.digest).toBe(plain64);
  });

  it('3DES-CBC Encryption & Decryption Round-Trip', () => {
    const iv = '1234567890abcdef';
    const plain = '4e6f77206973207468652074696d6520666f7220616c6c20'; // 24 bytes (3 blocks)
    const enc = des3CbcEncrypt.compute(plain, { keyHex: key192, ivHex: iv });
    expect(enc.digest.length).toBe(48);

    const dec = des3CbcDecrypt.compute(enc.digest, { keyHex: key192, ivHex: iv });
    expect(dec.digest).toBe(plain);
  });

  it('generates 3DES EDE step telemetry', () => {
    const enc = des3EcbEncrypt.compute(plain64, { keyHex: key192 });
    expect(enc.steps.length).toBeGreaterThan(45); // 3 passes of 16 rounds
    expect(enc.steps[0].phase).toBe('Key Expansion');
  });
});
