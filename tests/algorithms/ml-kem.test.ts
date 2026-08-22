import { describe, it, expect } from 'vitest';
import {
  mlKem512KeyGenPlugin,
  mlKem512EncapsulatePlugin,
  mlKem512DecapsulatePlugin,
  mlKem768KeyGenPlugin,
  mlKem768EncapsulatePlugin,
  mlKem768DecapsulatePlugin,
  mlKem1024KeyGenPlugin,
  mlKem1024EncapsulatePlugin,
  mlKem1024DecapsulatePlugin,
} from '../../src/algorithms/pqc/ml-kem';
import {
  NIST_FIPS203_KAT_512,
  NIST_FIPS203_KAT_768,
  NIST_FIPS203_KAT_1024,
  ML_KEM_512_PARAMS,
  ML_KEM_768_PARAMS,
  ML_KEM_1024_PARAMS,
} from '../../src/algorithms/pqc/ml-kem/constants';
import { mlKemKeyGen, mlKemEncaps, mlKemDecaps } from '../../src/algorithms/pqc/ml-kem/ml-kem-engine';
import { hexToBytes, bytesToHex } from '../../src/algorithms/utils';
import { ntt, nttInv, multiplyNTTs } from '../../src/algorithms/pqc/ml-kem/ntt';

describe('NIST FIPS 203 ML-KEM (CRYSTALS-Kyber) Official KAT Verification', () => {
  describe('NTT Transform Invertibility & Algebraic Correctness', () => {
    it('inverts arbitrary polynomial transforms losslessly', () => {
      const poly = Array.from({ length: 256 }, (_, i) => (i * 37 + 19) % 3329);
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
  });

  describe('ML-KEM-512 (NIST Category 1)', () => {
    const kat = NIST_FIPS203_KAT_512;
    const seedD = hexToBytes(kat.d);
    const seedZ = hexToBytes(kat.z);
    const seedM = hexToBytes(kat.m);

    it('matches official NIST FIPS 203 KAT key encapsulation and decapsulation', () => {
      const { ek, dk, steps: keyGenSteps } = mlKemKeyGen(ML_KEM_512_PARAMS, seedD, seedZ);
      expect(ek.length).toBe(800);
      expect(dk.length).toBe(1632);
      expect(keyGenSteps.length).toBeGreaterThan(0);

      const { c, sharedKey, steps: encapsSteps } = mlKemEncaps(ML_KEM_512_PARAMS, ek, seedM);
      expect(c.length).toBe(768);
      expect(sharedKey.length).toBe(32);
      expect(encapsSteps.length).toBeGreaterThan(0);

      // Verify against fixed expected KAT secret K:
      expect(bytesToHex(sharedKey)).toBe(kat.expectedK);

      // Verify decapsulation recovers the exact KAT secret:
      const { sharedKey: recoveredKey, steps: decapsSteps } = mlKemDecaps(ML_KEM_512_PARAMS, dk, c);
      expect(bytesToHex(recoveredKey)).toBe(kat.expectedK);
      expect(decapsSteps.length).toBeGreaterThan(0);
    });

    it('computes expected digests via plugin API', () => {
      const keyGenRes = mlKem512KeyGenPlugin.compute('', { seedDHex: kat.d, seedZHex: kat.z });
      const encapsRes = mlKem512EncapsulatePlugin.compute('', { seedDHex: kat.d, seedZHex: kat.z, seedMHex: kat.m });
      const decapsRes = mlKem512DecapsulatePlugin.compute('', { seedDHex: kat.d, seedZHex: kat.z, seedMHex: kat.m });

      expect(keyGenRes.digest.length).toBe(1600); // 800 bytes hex
      expect(encapsRes.digest).toBe(kat.expectedK);
      expect(decapsRes.digest).toBe(kat.expectedK);
      expect(decapsRes.tagValid).toBe(true);
    });
  });

  describe('ML-KEM-768 (NIST Category 3 / Recommended)', () => {
    const kat = NIST_FIPS203_KAT_768;
    const seedD = hexToBytes(kat.d);
    const seedZ = hexToBytes(kat.z);
    const seedM = hexToBytes(kat.m);

    it('matches official NIST FIPS 203 KAT key encapsulation and decapsulation', () => {
      const { ek, dk, steps: keyGenSteps } = mlKemKeyGen(ML_KEM_768_PARAMS, seedD, seedZ);
      expect(ek.length).toBe(1184);
      expect(dk.length).toBe(2400);
      expect(keyGenSteps.length).toBeGreaterThan(0);

      const { c, sharedKey, steps: encapsSteps } = mlKemEncaps(ML_KEM_768_PARAMS, ek, seedM);
      expect(c.length).toBe(1088);
      expect(sharedKey.length).toBe(32);
      expect(encapsSteps.length).toBeGreaterThan(0);

      // Verify against fixed expected KAT secret K:
      expect(bytesToHex(sharedKey)).toBe(kat.expectedK);

      // Verify decapsulation recovers the exact KAT secret:
      const { sharedKey: recoveredKey, steps: decapsSteps } = mlKemDecaps(ML_KEM_768_PARAMS, dk, c);
      expect(bytesToHex(recoveredKey)).toBe(kat.expectedK);
      expect(decapsSteps.length).toBeGreaterThan(0);
    });

    it('computes expected digests via plugin API', () => {
      const keyGenRes = mlKem768KeyGenPlugin.compute('', { seedDHex: kat.d, seedZHex: kat.z });
      const encapsRes = mlKem768EncapsulatePlugin.compute('', { seedDHex: kat.d, seedZHex: kat.z, seedMHex: kat.m });
      const decapsRes = mlKem768DecapsulatePlugin.compute('', { seedDHex: kat.d, seedZHex: kat.z, seedMHex: kat.m });

      expect(keyGenRes.digest.length).toBe(2368); // 1184 bytes hex
      expect(encapsRes.digest).toBe(kat.expectedK);
      expect(decapsRes.digest).toBe(kat.expectedK);
      expect(decapsRes.tagValid).toBe(true);
    });
  });

  describe('ML-KEM-1024 (NIST Category 5)', () => {
    const kat = NIST_FIPS203_KAT_1024;
    const seedD = hexToBytes(kat.d);
    const seedZ = hexToBytes(kat.z);
    const seedM = hexToBytes(kat.m);

    it('matches official NIST FIPS 203 KAT key encapsulation and decapsulation', () => {
      const { ek, dk, steps: keyGenSteps } = mlKemKeyGen(ML_KEM_1024_PARAMS, seedD, seedZ);
      expect(ek.length).toBe(1568);
      expect(dk.length).toBe(3168);
      expect(keyGenSteps.length).toBeGreaterThan(0);

      const { c, sharedKey, steps: encapsSteps } = mlKemEncaps(ML_KEM_1024_PARAMS, ek, seedM);
      expect(c.length).toBe(1568);
      expect(sharedKey.length).toBe(32);
      expect(encapsSteps.length).toBeGreaterThan(0);

      // Verify against fixed expected KAT secret K:
      expect(bytesToHex(sharedKey)).toBe(kat.expectedK);

      // Verify decapsulation recovers the exact KAT secret:
      const { sharedKey: recoveredKey, steps: decapsSteps } = mlKemDecaps(ML_KEM_1024_PARAMS, dk, c);
      expect(bytesToHex(recoveredKey)).toBe(kat.expectedK);
      expect(decapsSteps.length).toBeGreaterThan(0);
    });

    it('computes expected digests via plugin API', () => {
      const keyGenRes = mlKem1024KeyGenPlugin.compute('', { seedDHex: kat.d, seedZHex: kat.z });
      const encapsRes = mlKem1024EncapsulatePlugin.compute('', { seedDHex: kat.d, seedZHex: kat.z, seedMHex: kat.m });
      const decapsRes = mlKem1024DecapsulatePlugin.compute('', { seedDHex: kat.d, seedZHex: kat.z, seedMHex: kat.m });

      expect(keyGenRes.digest.length).toBe(3136); // 1568 bytes hex
      expect(encapsRes.digest).toBe(kat.expectedK);
      expect(decapsRes.digest).toBe(kat.expectedK);
      expect(decapsRes.tagValid).toBe(true);
    });
  });
});
