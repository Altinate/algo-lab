import { describe, it, expect } from 'vitest';
import { argon2idPlugin, argon2Core } from '../../src/algorithms/tools/argon2id';

describe('Argon2id (RFC 9106 Password Hashing Standard)', () => {
  it('should have correct algorithm metadata', () => {
    expect(argon2idPlugin.info.name).toBe('Argon2id');
    expect(argon2idPlugin.info.category).toBe('tools');
    expect(argon2idPlugin.info.family).toBe('Key Derivation Functions (KDF)');
    expect(argon2idPlugin.info.security).toBe('secure');
  });

  describe('Official RFC 9106 Test Vectors', () => {
    it('computes RFC 9106 Section 5.3 Argon2id Test Vector correctly', () => {
      const P = new Uint8Array(32).fill(1);
      const S = new Uint8Array(16).fill(2);
      const K = new Uint8Array(8).fill(3);
      const X_data = new Uint8Array(12).fill(4);

      const res = argon2Core('argon2id', P, S, 4, 32, 32, 3, K, X_data);
      expect(res.digest).toBe('0d640df58d78766c08c037a34a8b53c9d01ef0452d75b65eb52520e96b01e659');
      expect(res.steps.length).toBeGreaterThan(0);
    });

    it('computes RFC 9106 Section 5.1 Argon2d Test Vector correctly', () => {
      const P = new Uint8Array(32).fill(1);
      const S = new Uint8Array(16).fill(2);
      const K = new Uint8Array(8).fill(3);
      const X_data = new Uint8Array(12).fill(4);

      const res = argon2Core('argon2d', P, S, 4, 32, 32, 3, K, X_data);
      expect(res.digest).toBe('512b391b6f1162975371d30919734294f868e3be3984f3c1a13a4db9fabe4acb');
    });

    it('computes RFC 9106 Section 5.2 Argon2i Test Vector correctly', () => {
      const P = new Uint8Array(32).fill(1);
      const S = new Uint8Array(16).fill(2);
      const K = new Uint8Array(8).fill(3);
      const X_data = new Uint8Array(12).fill(4);

      const res = argon2Core('argon2i', P, S, 4, 32, 32, 3, K, X_data);
      expect(res.digest).toBe('c814d9d1dc7f37aa13f0d77f2494bda1c8de6b016dd388d29952a4c4672b6ce8');
    });
  });

  describe('Plugin Input Processing & Telemetry', () => {
    it('handles JSON string inputs with custom parameters', () => {
      const P_hex = '01'.repeat(32);
      const S_hex = '02'.repeat(16);
      const K_hex = '03'.repeat(8);
      const X_hex = '04'.repeat(12);

      const jsonInput = JSON.stringify({
        password: `0x${P_hex}`,
        salt: `0x${S_hex}`,
        p: 4,
        tagLength: 32,
        m: 32,
        t: 3,
        secretKey: `0x${K_hex}`,
        associatedData: `0x${X_hex}`,
      });
      const res = argon2idPlugin.compute(jsonInput);
      expect(res.digest).toBe('0d640df58d78766c08c037a34a8b53c9d01ef0452d75b65eb52520e96b01e659');
    });

    it('generates rich memory telemetry steps including H0, genesis blocks, slice rounds, and tag assembly', () => {
      const res = argon2idPlugin.compute('password', { salt: 'somesalt', m: 32, t: 1, p: 1, tagLength: 32 });
      const initStep = res.steps.find((s) => s.id === 'argon2id-init');
      const h0Step = res.steps.find((s) => s.id === 'argon2id-h0');
      const genesisStep = res.steps.find((s) => s.id === 'argon2id-genesis');
      const finalFoldStep = res.steps.find((s) => s.id === 'argon2id-final-fold');
      const completeStep = res.steps.find((s) => s.id === 'argon2id-complete');

      expect(initStep).toBeDefined();
      expect(h0Step).toBeDefined();
      expect(genesisStep).toBeDefined();
      expect(finalFoldStep).toBeDefined();
      expect(completeStep).toBeDefined();
    });
  });
});
