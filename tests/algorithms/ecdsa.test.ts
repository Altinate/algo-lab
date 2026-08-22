import { describe, it, expect } from 'vitest';
import {
  ecdsaSecp256k1Sign,
  ecdsaSecp256k1Verify,
  ecdsaP256Sign,
  ecdsaP256Verify,
} from '../../src/algorithms/asymmetric/ecdsa';
import {
  CURVE_SECP256K1,
  CURVE_NIST_P256,
  SECP256K1_TEST_KEY,
  NIST_P256_TEST_KEY,
} from '../../src/algorithms/asymmetric/ecdsa/constants';
import { isOnCurve } from '../../src/algorithms/asymmetric/ecdsa/ec-math';

describe('ECDSA Digital Signature Algorithm (SECG SEC 2 / NIST FIPS 186-5)', () => {
  const message = 'CryptoScope ECDSA Transaction Audit Payload';

  it('verifies base generator points and public keys lie on their respective curves', () => {
    // secp256k1
    expect(isOnCurve({ x: CURVE_SECP256K1.Gx, y: CURVE_SECP256K1.Gy }, CURVE_SECP256K1)).toBe(true);
    expect(isOnCurve({ x: SECP256K1_TEST_KEY.Qx, y: SECP256K1_TEST_KEY.Qy }, CURVE_SECP256K1)).toBe(true);

    // NIST P-256
    expect(isOnCurve({ x: CURVE_NIST_P256.Gx, y: CURVE_NIST_P256.Gy }, CURVE_NIST_P256)).toBe(true);
    expect(isOnCurve({ x: NIST_P256_TEST_KEY.Qx, y: NIST_P256_TEST_KEY.Qy }, CURVE_NIST_P256)).toBe(true);
  });

  it('ECDSA-secp256k1 (SECG SEC 2): Signature Generation and Verification Round-Trip', () => {
    const signRes = ecdsaSecp256k1Sign.compute(message);
    expect(signRes.digest).toBeDefined();
    expect(signRes.digest.length).toBe(128); // 64 bytes = 128 hex chars (r || s)

    const verifyRes = ecdsaSecp256k1Verify.compute(message, { signatureHex: signRes.digest });
    expect(verifyRes.tagValid).toBe(true);
    expect(verifyRes.digest).toBe('VALID (AUTHENTIC)');
  });

  it('ECDSA-secp256k1: Signature Verification detects message tampering / forgery', () => {
    const signRes = ecdsaSecp256k1Sign.compute(message);
    const forgedMessage = 'CryptoScope Modified Tampered Payload';

    const verifyRes = ecdsaSecp256k1Verify.compute(forgedMessage, { signatureHex: signRes.digest });
    expect(verifyRes.tagValid).toBe(false);
  });

  it('ECDSA-P256 (NIST FIPS 186-5): Signature Generation and Verification Round-Trip', () => {
    const signRes = ecdsaP256Sign.compute(message);
    expect(signRes.digest).toBeDefined();
    expect(signRes.digest.length).toBe(128);

    const verifyRes = ecdsaP256Verify.compute(message, { signatureHex: signRes.digest });
    expect(verifyRes.tagValid).toBe(true);
    expect(verifyRes.digest).toBe('VALID (AUTHENTIC)');
  });

  it('ECDSA-P256: Verified against OpenSSL standard crypto engine', async () => {
    // @ts-ignore
    const nodeCrypto = await import('node:crypto');
    // Construct JWK for NIST P-256 key
    const jwk = {
      kty: 'EC',
      crv: 'P-256',
      d: (globalThis as any).Buffer.from(NIST_P256_TEST_KEY.d.toString(16).padStart(64, '0'), 'hex').toString('base64url'),
      x: (globalThis as any).Buffer.from(NIST_P256_TEST_KEY.Qx.toString(16).padStart(64, '0'), 'hex').toString('base64url'),
      y: (globalThis as any).Buffer.from(NIST_P256_TEST_KEY.Qy.toString(16).padStart(64, '0'), 'hex').toString('base64url'),
    };

    const pubKey = nodeCrypto.createPublicKey({ key: jwk, format: 'jwk' });
    const privKey = nodeCrypto.createPrivateKey({ key: jwk, format: 'jwk' });

    const msgBuf = (globalThis as any).Buffer.from(message, 'utf8');

    // 1. OpenSSL signs -> CryptoScope verifies
    const openSslIeeeSig = nodeCrypto.sign('sha256', msgBuf, {
      key: privKey,
      dsaEncoding: 'ieee-p1363', // 64-byte r || s format
    });

    const csVerify = ecdsaP256Verify.compute(message, {
      signatureHex: openSslIeeeSig.toString('hex'),
    });
    expect(csVerify.tagValid).toBe(true);

    // 2. CryptoScope signs -> OpenSSL verifies
    const csSig = ecdsaP256Sign.compute(message);
    const openSslVerify = nodeCrypto.verify(
      'sha256',
      msgBuf,
      { key: pubKey, dsaEncoding: 'ieee-p1363' },
      (globalThis as any).Buffer.from(csSig.digest, 'hex')
    );
    expect(openSslVerify).toBe(true);
  });

  it('generates rich Elliptic Curve point telemetry with Double-and-Add ladders', () => {
    const signRes = ecdsaSecp256k1Sign.compute(message);
    expect(signRes.steps.length).toBeGreaterThan(0);
    expect(signRes.steps.some((s) => s.visualizationType === 'ecc-point')).toBe(true);
    expect(signRes.steps.some((s) => s.phase === 'Point Multiplication')).toBe(true);

    const verifyRes = ecdsaP256Verify.compute(message, { signatureHex: signRes.digest });
    expect(verifyRes.steps.some((s) => s.phase === 'Multiplier Derivation')).toBe(true);
    expect(verifyRes.steps.some((s) => s.phase === 'Point Verification')).toBe(true);
  });
});
