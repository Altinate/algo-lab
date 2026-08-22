import { describe, it, expect } from 'vitest';
import {
  rsa2048Encrypt,
  rsa2048Decrypt,
  rsa2048Sign,
  rsa2048Verify,
  rsaPedagogicalEncrypt,
  rsaPedagogicalDecrypt,
  rsaPedagogicalSign,
  rsaPedagogicalVerify,
} from '../../src/algorithms/asymmetric/rsa';
import { hexToString } from '../../src/algorithms/utils';

describe('RSA Cryptosystem (NIST SP 800-56B Rev 2 / PKCS#1 v2.2)', () => {
  const plaintext = 'CryptoScope NIST 2048';

  it('RSA-2048: Public Key Encryption and CRT-Accelerated Decryption Round-Trip', () => {
    const encRes = rsa2048Encrypt.compute(plaintext);
    expect(encRes.digest).toBeDefined();
    expect(encRes.digest.length).toBe(512); // 256 bytes = 512 hex chars (2048 bits)

    const decRes = rsa2048Decrypt.compute(encRes.digest);
    const recoveredText = hexToString(decRes.digest);
    expect(recoveredText).toBe(plaintext);
  });

  it('RSA-2048: SHA-256 EMSA-PKCS1 Signature Generation and Verification', () => {
    const message = 'CryptoScope Secure Audit Document';
    const signRes = rsa2048Sign.compute(message);
    expect(signRes.digest).toBeDefined();
    expect(signRes.digest.length).toBe(512);

    const verifyRes = rsa2048Verify.compute(message, { signatureHex: signRes.digest });
    expect(verifyRes.tagValid).toBe(true);
    expect(verifyRes.digest).toBe('VALID (AUTHENTIC)');
  });

  it('RSA-2048: Verified bit-for-bit against standard OpenSSL / NIST CAVP PKCS#1 v1.5 implementation', async () => {
    // @ts-ignore
    const nodeCrypto = await import('node:crypto');
    const { NIST_RSA_2048 } = await import('../../src/algorithms/asymmetric/rsa/constants');
    const message = 'CryptoScope Secure Audit Document';
    const msgBuf = (globalThis as any).Buffer.from(message, 'utf8');

    const jwk = {
      kty: 'RSA',
      n: (globalThis as any).Buffer.from(NIST_RSA_2048.n.toString(16).padStart(512, '0'), 'hex').toString('base64url'),
      e: (globalThis as any).Buffer.from('010001', 'hex').toString('base64url'),
      d: (globalThis as any).Buffer.from(NIST_RSA_2048.d.toString(16).padStart(512, '0'), 'hex').toString('base64url'),
      p: (globalThis as any).Buffer.from(NIST_RSA_2048.p.toString(16).padStart(256, '0'), 'hex').toString('base64url'),
      q: (globalThis as any).Buffer.from(NIST_RSA_2048.q.toString(16).padStart(256, '0'), 'hex').toString('base64url'),
      dp: (globalThis as any).Buffer.from(NIST_RSA_2048.dP.toString(16).padStart(256, '0'), 'hex').toString('base64url'),
      dq: (globalThis as any).Buffer.from(NIST_RSA_2048.dQ.toString(16).padStart(256, '0'), 'hex').toString('base64url'),
      qi: (globalThis as any).Buffer.from(NIST_RSA_2048.qInv.toString(16).padStart(256, '0'), 'hex').toString('base64url'),
    };

    const nodePrivKey = nodeCrypto.createPrivateKey({ key: jwk, format: 'jwk' });
    const nodePubKey = nodeCrypto.createPublicKey({ key: jwk, format: 'jwk' });

    // OpenSSL generates signature
    const openSslSig = nodeCrypto.sign('sha256', msgBuf, {
      key: nodePrivKey,
      padding: nodeCrypto.constants.RSA_PKCS1_PADDING,
    });

    const cryptoScopeSig = rsa2048Sign.compute(message);

    // 1. Bit-for-bit exact match
    expect(cryptoScopeSig.digest).toBe(openSslSig.toString('hex'));

    // 2. OpenSSL verifies CryptoScope signature
    const openSslVerifies = nodeCrypto.verify(
      'sha256',
      msgBuf,
      { key: nodePubKey, padding: nodeCrypto.constants.RSA_PKCS1_PADDING },
      (globalThis as any).Buffer.from(cryptoScopeSig.digest, 'hex')
    );
    expect(openSslVerifies).toBe(true);

    // 3. CryptoScope verifies OpenSSL signature
    const csVerifies = rsa2048Verify.compute(message, { signatureHex: openSslSig.toString('hex') });
    expect(csVerifies.tagValid).toBe(true);
  });

  it('RSA-2048: Signature Verification detects forgery', () => {
    const message = 'CryptoScope Secure Audit Document';
    const signRes = rsa2048Sign.compute(message);
    const forgedMessage = 'CryptoScope Tampered Document';

    const verifyRes = rsa2048Verify.compute(forgedMessage, { signatureHex: signRes.digest });
    expect(verifyRes.tagValid).toBe(false);
  });

  it('RSA-Pedagogical (32-bit): Step-by-Step Textbook Arithmetic (p=61, q=53, N=3233, e=17, d=2753)', () => {
    // Encrypt m = 65: c = 65^17 mod 3233 = 2790
    const enc = rsaPedagogicalEncrypt.compute('65');
    const cVal = parseInt(enc.digest, 16);
    expect(cVal).toBe(2790);

    // Decrypt c = 2790: m = 2790^2753 mod 3233 = 65
    const dec = rsaPedagogicalDecrypt.compute(enc.digest);
    const mVal = parseInt(dec.digest, 16);
    expect(mVal).toBe(65);
  });

  it('generates rich Asymmetric ModExp telemetry with CRT and bit ladders', () => {
    const encRes = rsa2048Encrypt.compute(plaintext);
    expect(encRes.steps.length).toBeGreaterThan(0);
    expect(encRes.steps.some((s) => s.visualizationType === 'asymmetric-modexp')).toBe(true);

    const decRes = rsa2048Decrypt.compute(encRes.digest);
    expect(decRes.steps.some((s) => s.phase === 'CRT Reduction p')).toBe(true);
    expect(decRes.steps.some((s) => s.phase === 'CRT Recombination')).toBe(true);
  });
});
