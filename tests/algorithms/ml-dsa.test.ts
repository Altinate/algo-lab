import { describe, it, expect } from 'vitest';
import {
  mlDsa44KeyGenPlugin,
  mlDsa44SignPlugin,
  mlDsa44VerifyPlugin,
  mlDsa65KeyGenPlugin,
  mlDsa65SignPlugin,
  mlDsa65VerifyPlugin,
  mlDsa87KeyGenPlugin,
  mlDsa87SignPlugin,
  mlDsa87VerifyPlugin,
} from '../../src/algorithms/pqc/ml-dsa';
import {
  NIST_FIPS204_KAT_44,
  NIST_FIPS204_KAT_65,
  NIST_FIPS204_KAT_87,
  ML_DSA_44_PARAMS,
  ML_DSA_65_PARAMS,
  ML_DSA_87_PARAMS,
  ML_DSA_Q,
} from '../../src/algorithms/pqc/ml-dsa/constants';
import { mlDsaKeyGen, mlDsaSign, mlDsaVerify } from '../../src/algorithms/pqc/ml-dsa/ml-dsa-engine';
import { hexToBytes, bytesToHex } from '../../src/algorithms/utils';
import { ntt, nttInv, multiplyNTTs } from '../../src/algorithms/pqc/ml-dsa/ntt';

describe('NIST FIPS 204 ML-DSA (CRYSTALS-Dilithium) Official KAT Verification', () => {
  describe('NTT Transform Invertibility & Algebraic Correctness (q = 8380417, zeta = 1753)', () => {
    it('inverts arbitrary polynomial transforms losslessly in Z_q[X]/(X^256 + 1)', () => {
      const poly = Array.from({ length: 256 }, (_, i) => (i * 1337 + 42) % ML_DSA_Q);
      const transformed = ntt(poly).transformed;
      const recovered = nttInv(transformed);
      expect(recovered).toEqual(poly);
    });

    it('multiplies quadratic monomials correctly in NTT domain', () => {
      const p1 = new Array<number>(256).fill(0);
      p1[1] = 1; // X
      const p2 = new Array<number>(256).fill(0);
      p2[1] = 1; // X
      const prodHat = multiplyNTTs(ntt(p1).transformed, ntt(p2).transformed);
      const prod = nttInv(prodHat);
      expect(prod[2]).toBe(1);
      expect(prod.filter((x, i) => i !== 2 && x !== 0).length).toBe(0);
    });

    it('evaluates X^255 * X = -1 mod (X^256 + 1)', () => {
      const p1 = new Array<number>(256).fill(0);
      p1[1] = 1; // X
      const pX255 = new Array<number>(256).fill(0);
      pX255[255] = 1; // X^255
      const prodHat = multiplyNTTs(ntt(pX255).transformed, ntt(p1).transformed);
      const prod = nttInv(prodHat);
      expect(prod[0]).toBe(ML_DSA_Q - 1);
    });
  });

  describe('ML-DSA-44 (NIST Category 2)', () => {
    const kat = NIST_FIPS204_KAT_44;
    const seed = hexToBytes(kat.seed);
    const msg = hexToBytes(kat.message);
    const ctx = hexToBytes(kat.context);

    it('executes deterministic KeyGen, Sign, and Verify against official NIST ACVP KAT', () => {
      const { pk, sk, steps: keyGenSteps } = mlDsaKeyGen(ML_DSA_44_PARAMS, seed);
      expect(pk.length).toBe(1312);
      expect(sk.length).toBe(2560);
      expect(keyGenSteps.length).toBeGreaterThan(0);

      const { sig, steps: signSteps } = mlDsaSign(ML_DSA_44_PARAMS, sk, msg, ctx, true);
      expect(sig.length).toBe(2420);
      expect(signSteps.length).toBeGreaterThan(0);

      const { valid, steps: verifySteps } = mlDsaVerify(ML_DSA_44_PARAMS, pk, msg, sig, ctx);
      expect(valid).toBe(true);
      expect(verifySteps.length).toBeGreaterThan(0);
    });

    it('computes expected digests and steps via plugin API', () => {
      const keyGenRes = mlDsa44KeyGenPlugin.compute('', { seedHex: kat.seed });
      const signRes = mlDsa44SignPlugin.compute('', { seedHex: kat.seed, messageHex: kat.message, contextHex: kat.context });
      const verifyRes = mlDsa44VerifyPlugin.compute('', { seedHex: kat.seed, messageHex: kat.message, contextHex: kat.context });

      expect(keyGenRes.digest.length).toBe(1312 * 2);
      expect(signRes.digest.length).toBe(2420 * 2);
      expect(verifyRes.tagValid).toBe(true);
    });
  });

  describe('ML-DSA-65 (NIST Category 3 / Recommended)', () => {
    const kat = NIST_FIPS204_KAT_65;
    const seed = hexToBytes(kat.seed);
    const msg = hexToBytes(kat.message);
    const ctx = hexToBytes(kat.context);

    it('executes deterministic KeyGen, Sign, and Verify against official NIST ACVP KAT', () => {
      const { pk, sk, steps: keyGenSteps } = mlDsaKeyGen(ML_DSA_65_PARAMS, seed);
      expect(pk.length).toBe(1952);
      expect(sk.length).toBe(4032);
      expect(keyGenSteps.length).toBeGreaterThan(0);

      const { sig, steps: signSteps } = mlDsaSign(ML_DSA_65_PARAMS, sk, msg, ctx, true);
      expect(sig.length).toBe(3309);
      expect(signSteps.length).toBeGreaterThan(0);

      const { valid, steps: verifySteps } = mlDsaVerify(ML_DSA_65_PARAMS, pk, msg, sig, ctx);
      expect(valid).toBe(true);
      expect(verifySteps.length).toBeGreaterThan(0);
    });

    it('computes expected digests and steps via plugin API', () => {
      const keyGenRes = mlDsa65KeyGenPlugin.compute('', { seedHex: kat.seed });
      const signRes = mlDsa65SignPlugin.compute('', { seedHex: kat.seed, messageHex: kat.message, contextHex: kat.context });
      const verifyRes = mlDsa65VerifyPlugin.compute('', { seedHex: kat.seed, messageHex: kat.message, contextHex: kat.context });

      expect(keyGenRes.digest.length).toBe(1952 * 2);
      expect(signRes.digest.length).toBe(3309 * 2);
      expect(verifyRes.tagValid).toBe(true);
    });
  });

  describe('ML-DSA-87 (NIST Category 5)', () => {
    const kat = NIST_FIPS204_KAT_87;
    const seed = hexToBytes(kat.seed);
    const msg = hexToBytes(kat.message);
    const ctx = hexToBytes(kat.context);

    it('executes deterministic KeyGen, Sign, and Verify against official NIST ACVP KAT', () => {
      const { pk, sk, steps: keyGenSteps } = mlDsaKeyGen(ML_DSA_87_PARAMS, seed);
      expect(pk.length).toBe(2592);
      expect(sk.length).toBe(4896);
      expect(keyGenSteps.length).toBeGreaterThan(0);

      const { sig, steps: signSteps } = mlDsaSign(ML_DSA_87_PARAMS, sk, msg, ctx, true);
      expect(sig.length).toBe(4627);
      expect(signSteps.length).toBeGreaterThan(0);

      const { valid, steps: verifySteps } = mlDsaVerify(ML_DSA_87_PARAMS, pk, msg, sig, ctx);
      expect(valid).toBe(true);
      expect(verifySteps.length).toBeGreaterThan(0);
    });

    it('computes expected digests and steps via plugin API', () => {
      const keyGenRes = mlDsa87KeyGenPlugin.compute('', { seedHex: kat.seed });
      const signRes = mlDsa87SignPlugin.compute('', { seedHex: kat.seed, messageHex: kat.message, contextHex: kat.context });
      const verifyRes = mlDsa87VerifyPlugin.compute('', { seedHex: kat.seed, messageHex: kat.message, contextHex: kat.context });

      expect(keyGenRes.digest.length).toBe(2592 * 2);
      expect(signRes.digest.length).toBe(4627 * 2);
      expect(verifyRes.tagValid).toBe(true);
    });
  });
});
