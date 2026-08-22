import { describe, it, expect } from 'vitest';
import { pbkdf2Plugin, pbkdf2HmacSha256 } from '../../src/algorithms/tools/pbkdf2';

describe('PBKDF2 (RFC 8018 / RFC 6070)', () => {
  it('should have correct algorithm metadata', () => {
    expect(pbkdf2Plugin.info.name).toBe('PBKDF2 (HMAC-SHA256)');
    expect(pbkdf2Plugin.info.category).toBe('tools');
    expect(pbkdf2Plugin.info.family).toBe('Key Derivation Functions (KDF)');
    expect(pbkdf2Plugin.info.security).toBe('secure');
  });

  describe('Official RFC 6070 & Standard HMAC-SHA256 Test Vectors', () => {
    it('computes c=1 iteration correctly', () => {
      const res = pbkdf2HmacSha256('password', 'salt', 1, 32);
      expect(res.digest).toBe('120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b');
      expect(res.steps.length).toBeGreaterThan(0);
    });

    it('computes c=2 iterations correctly', () => {
      const res = pbkdf2HmacSha256('password', 'salt', 2, 32);
      expect(res.digest).toBe('ae4d0c95af6b46d32d0adff928f06dd02a303f8ef3c251dfd6e2d85a95474c43');
    });

    it('computes c=4096 iterations (32 bytes DK) correctly', () => {
      const res = pbkdf2HmacSha256('password', 'salt', 4096, 32);
      expect(res.digest).toBe('c5e478d59288c841aa530db6845c4c8d962893a001ce4e11a4963873aa98134a');
      expect(res.steps.some((s) => s.id.includes('milestone'))).toBe(true);
    });

    it('computes c=4096 iterations with long password/salt and multi-block output (40 bytes DK)', () => {
      const password = 'passwordPASSWORDpassword';
      const salt = 'saltSALTsaltSALTsaltSALTsaltSALTsalt';
      const res = pbkdf2HmacSha256(password, salt, 4096, 40);
      expect(res.digest).toBe('348c89dbcbd32b2f32d814b8116e84cf2b17347ebc1800181c4e2a1fb8dd53e1c635518c7dac47e9');
    });

    it('computes c=4096 iterations with embedded null bytes', () => {
      const password = 'pass\0word';
      const salt = 'sa\0lt';
      const res = pbkdf2HmacSha256(password, salt, 4096, 16);
      expect(res.digest).toBe('89b69d0516f829893c696226650a8687');
    });
  });

  describe('Plugin Input Processing & Telemetry', () => {
    it('handles JSON string inputs with custom parameters', () => {
      const jsonInput = JSON.stringify({
        password: 'password',
        salt: 'salt',
        iterations: 2,
        keyLength: 32,
      });
      const res = pbkdf2Plugin.compute(jsonInput);
      expect(res.digest).toBe('ae4d0c95af6b46d32d0adff928f06dd02a303f8ef3c251dfd6e2d85a95474c43');
    });

    it('generates rich telemetry steps including initialization, PRF rounds, and derived key assembly', () => {
      const res = pbkdf2Plugin.compute('password', { salt: 'salt', iterations: 2, keyLength: 32 });
      const initStep = res.steps.find((s) => s.id === 'pbkdf2-init');
      const u1Step = res.steps.find((s) => s.id === 'pbkdf2-block-1-u1');
      const round2Step = res.steps.find((s) => s.id === 'pbkdf2-block-1-round-2');
      const completeStep = res.steps.find((s) => s.id === 'pbkdf2-complete');

      expect(initStep).toBeDefined();
      expect(u1Step).toBeDefined();
      expect(round2Step).toBeDefined();
      expect(completeStep).toBeDefined();
    });
  });
});
