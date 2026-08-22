import { describe, it, expect } from 'vitest';
import {
  diffieHellmanModp2048,
  ecdhSecp256k1,
  ecdhP256,
} from '../../src/algorithms/asymmetric/dh';
import {
  DH_ALICE_PRIVATE,
  DH_BOB_PRIVATE,
  ECDH_SECP256K1_ALICE_PRIV,
  ECDH_SECP256K1_BOB_PRIV,
  ECDH_P256_ALICE_PRIV,
  ECDH_P256_BOB_PRIV,
} from '../../src/algorithms/asymmetric/dh/constants';

describe('Diffie-Hellman & ECDH Key Agreement (RFC 3526 / NIST SP 800-56A)', () => {
  it('Diffie-Hellman-MODP-2048: Alice and Bob derive identical 2048-bit shared secret', () => {
    const res = diffieHellmanModp2048.compute('');
    expect(res.digest).toBeDefined();
    expect(res.digest.length).toBe(512); // 256 bytes = 512 hex chars (2048 bits)
    expect(res.tagValid).toBe(true);
  });

  it('Diffie-Hellman-MODP-2048: Verified bit-for-bit against OpenSSL MODP Group 14 engine', async () => {
    // @ts-ignore
    const nodeCrypto = await import('node:crypto');
    const { DH_MODP_2048_PRIME } = await import('../../src/algorithms/asymmetric/dh/constants');
    const primeBuf = (globalThis as any).Buffer.from(DH_MODP_2048_PRIME.toString(16).padStart(512, '0'), 'hex');
    const genBuf = (globalThis as any).Buffer.from('02', 'hex');

    const dhAlice = nodeCrypto.createDiffieHellman(primeBuf, genBuf);
    const dhBob = nodeCrypto.createDiffieHellman(primeBuf, genBuf);

    const aBuf = (globalThis as any).Buffer.from(DH_ALICE_PRIVATE.toString(16).padStart(512, '0'), 'hex');
    const bBuf = (globalThis as any).Buffer.from(DH_BOB_PRIVATE.toString(16).padStart(512, '0'), 'hex');

    dhAlice.setPrivateKey(aBuf);
    dhBob.setPrivateKey(bBuf);

    dhAlice.generateKeys();
    dhBob.generateKeys();

    const openSslSecretAlice = dhAlice.computeSecret(dhBob.getPublicKey());
    const openSslSecretBob = dhBob.computeSecret(dhAlice.getPublicKey());

    expect(openSslSecretAlice.toString('hex')).toBe(openSslSecretBob.toString('hex'));

    const csRes = diffieHellmanModp2048.compute('');
    expect(csRes.digest).toBe(openSslSecretAlice.toString('hex'));
  });

  it('ECDH-secp256k1: Alice and Bob derive identical 256-bit shared point coordinate', () => {
    const res = ecdhSecp256k1.compute('');
    expect(res.digest).toBeDefined();
    expect(res.digest.length).toBe(64); // 32 bytes = 64 hex chars (256 bits)
    expect(res.tagValid).toBe(true);
  });

  it('ECDH-secp256k1: Verified bit-for-bit against OpenSSL secp256k1 ECDH engine', async () => {
    // @ts-ignore
    const nodeCrypto = await import('node:crypto');
    const ecdhAlice = nodeCrypto.createECDH('secp256k1');
    const ecdhBob = nodeCrypto.createECDH('secp256k1');

    ecdhAlice.setPrivateKey((globalThis as any).Buffer.from(ECDH_SECP256K1_ALICE_PRIV.toString(16).padStart(64, '0'), 'hex'));
    ecdhBob.setPrivateKey((globalThis as any).Buffer.from(ECDH_SECP256K1_BOB_PRIV.toString(16).padStart(64, '0'), 'hex'));

    const secretAlice = ecdhAlice.computeSecret(ecdhBob.getPublicKey());
    const secretBob = ecdhBob.computeSecret(ecdhAlice.getPublicKey());

    expect(secretAlice.toString('hex')).toBe(secretBob.toString('hex'));

    const csRes = ecdhSecp256k1.compute('');
    expect(csRes.digest).toBe(secretAlice.toString('hex'));
  });

  it('ECDH-P256 (NIST P-256): Alice and Bob derive identical 256-bit shared point coordinate', () => {
    const res = ecdhP256.compute('');
    expect(res.digest).toBeDefined();
    expect(res.digest.length).toBe(64);
    expect(res.tagValid).toBe(true);
  });

  it('ECDH-P256: Verified bit-for-bit against OpenSSL prime256v1 ECDH engine', async () => {
    // @ts-ignore
    const nodeCrypto = await import('node:crypto');
    const ecdhAlice = nodeCrypto.createECDH('prime256v1');
    const ecdhBob = nodeCrypto.createECDH('prime256v1');

    ecdhAlice.setPrivateKey((globalThis as any).Buffer.from(ECDH_P256_ALICE_PRIV.toString(16).padStart(64, '0'), 'hex'));
    ecdhBob.setPrivateKey((globalThis as any).Buffer.from(ECDH_P256_BOB_PRIV.toString(16).padStart(64, '0'), 'hex'));

    const secretAlice = ecdhAlice.computeSecret(ecdhBob.getPublicKey());
    const secretBob = ecdhBob.computeSecret(ecdhAlice.getPublicKey());

    expect(secretAlice.toString('hex')).toBe(secretBob.toString('hex'));

    const csRes = ecdhP256.compute('');
    expect(csRes.digest).toBe(secretAlice.toString('hex'));
  });

  it('generates rich 2-party key agreement protocol swimlane telemetry', () => {
    const dhRes = diffieHellmanModp2048.compute('');
    expect(dhRes.steps.length).toBeGreaterThan(0);
    expect(dhRes.steps.some((s) => s.visualizationType === 'key-exchange')).toBe(true);
    expect(dhRes.steps.some((s) => s.phase === 'Key Generation')).toBe(true);
    expect(dhRes.steps.some((s) => s.phase === 'Public Exchange')).toBe(true);
    expect(dhRes.steps.some((s) => s.phase === 'Secret Derivation')).toBe(true);

    const ecdhRes = ecdhP256.compute('');
    expect(ecdhRes.steps.some((s) => s.phase === 'Point Generation')).toBe(true);
    expect(ecdhRes.steps.some((s) => s.phase === 'Secret Derivation')).toBe(true);
  });
});
