import { describe, it, expect } from 'vitest';
import { scryptPlugin, scryptCore } from '../../src/algorithms/tools/scrypt';

describe('Scrypt (RFC 7914 Memory-Hard KDF)', () => {
  it('should have correct algorithm metadata', () => {
    expect(scryptPlugin.info.name).toBe('Scrypt');
    expect(scryptPlugin.info.category).toBe('tools');
    expect(scryptPlugin.info.family).toBe('Key Derivation Functions (KDF)');
    expect(scryptPlugin.info.security).toBe('secure');
  });

  describe('Official RFC 7914 Appendix A Test Vectors', () => {
    it('computes Vector 1: P="", S="", N=16, r=1, p=1, dkLen=64', () => {
      const res = scryptCore('', '', 16, 1, 1, 64);
      expect(res.digest).toBe(
        '77d6576238657b203b19ca42c18a0497f16b4844e3074ae8dfdffa3fede21442fcd0069ded0948f8326a753a0fc81f17e8d3e0fb2e0d3628cf35e20c38d18906',
      );
      expect(res.steps.length).toBeGreaterThan(0);
    });

    it('computes Vector 2: P="password", S="NaCl", N=1024, r=8, p=16, dkLen=64', () => {
      const res = scryptCore('password', 'NaCl', 1024, 8, 16, 64);
      expect(res.digest).toBe(
        'fdbabe1c9d3472007856e7190d01e9fe7c6ad7cbc8237830e77376634b3731622eaf30d92e22a3886ff109279d9830dac727afb94a83ee6d8360cbdfa2cc0640',
      );
    }, 20000);

    it('computes Vector 3: P="pleaseletmein", S="SodiumChloride", N=16384, r=8, p=1, dkLen=64', () => {
      const res = scryptCore('pleaseletmein', 'SodiumChloride', 16384, 8, 1, 64);
      expect(res.digest).toBe(
        '7023bdcb3afd7348461c06cd81fd38ebfda8fbba904f8e3ea9b543f6545da1f2d5432955613f0fcf62d49705242a9af9e61e85dc0d651e40dfcf017b45575887',
      );
    }, 20000);
  });

  describe('Plugin Input Processing & Telemetry', () => {
    it('handles JSON string inputs with custom parameters', () => {
      const jsonInput = JSON.stringify({
        password: '',
        salt: '',
        N: 16,
        r: 1,
        p: 1,
        dkLen: 64,
      });
      const res = scryptPlugin.compute(jsonInput);
      expect(res.digest).toBe(
        '77d6576238657b203b19ca42c18a0497f16b4844e3074ae8dfdffa3fede21442fcd0069ded0948f8326a753a0fc81f17e8d3e0fb2e0d3628cf35e20c38d18906',
      );
    });

    it('generates rich memory telemetry steps including V-array fill, integerify lookups, and derived key', () => {
      const res = scryptPlugin.compute('password', { salt: 'NaCl', N: 16, r: 1, p: 1, dkLen: 32 });
      const initStep = res.steps.find((s) => s.id === 'scrypt-init');
      const preStep = res.steps.find((s) => s.id === 'scrypt-pbkdf2-pre');
      const postStep = res.steps.find((s) => s.id === 'scrypt-pbkdf2-post');
      const completeStep = res.steps.find((s) => s.id === 'scrypt-complete');

      expect(initStep).toBeDefined();
      expect(preStep).toBeDefined();
      expect(postStep).toBeDefined();
      expect(completeStep).toBeDefined();
    });
  });
});
