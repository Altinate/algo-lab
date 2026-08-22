import { describe, it, expect } from 'vitest';
import { listAlgorithms, getAlgorithm, getAlgorithmsByFamily } from '../src/algorithms/registry';

describe('Algorithm Registry', () => {
  it('registers all 34 built-in hash algorithms', () => {
    const hashAlgorithms = listAlgorithms('hash');
    expect(hashAlgorithms.length).toBe(34);
    const names = hashAlgorithms.map((a) => a.info.name);

    // Legacy MD
    expect(names).toContain('MD2');
    expect(names).toContain('MD4');
    expect(names).toContain('MD5');

    // SHA-1
    expect(names).toContain('SHA-1');

    // SHA-2
    expect(names).toContain('SHA-224');
    expect(names).toContain('SHA-256');
    expect(names).toContain('SHA-384');
    expect(names).toContain('SHA-512');
    expect(names).toContain('SHA-512/224');
    expect(names).toContain('SHA-512/256');

    // SHA-3 / Keccak
    expect(names).toContain('SHA3-224');
    expect(names).toContain('SHA3-256');
    expect(names).toContain('SHA3-384');
    expect(names).toContain('SHA3-512');
    expect(names).toContain('Keccak-224');
    expect(names).toContain('Keccak-256');
    expect(names).toContain('Keccak-384');
    expect(names).toContain('Keccak-512');
    expect(names).toContain('SHAKE128');
    expect(names).toContain('SHAKE256');

    // RIPEMD
    expect(names).toContain('RIPEMD-128');
    expect(names).toContain('RIPEMD-160');
    expect(names).toContain('RIPEMD-256');
    expect(names).toContain('RIPEMD-320');

    // BLAKE
    expect(names).toContain('BLAKE2s');
    expect(names).toContain('BLAKE2b');
    expect(names).toContain('BLAKE3');

    // CRC & Checksums
    expect(names).toContain('CRC-16');
    expect(names).toContain('CRC32');
    expect(names).toContain('Adler-32');

    // Non-Cryptographic
    expect(names).toContain('XXH32');
    expect(names).toContain('XXH64');

    // National Standards
    expect(names).toContain('SM3');

    // Cipher-Based
    expect(names).toContain('Whirlpool');
  });

  it('registers all 34 symmetric cipher algorithms (AES, DES, 3DES, ChaCha20-Poly1305)', () => {
    const symAlgorithms = listAlgorithms('symmetric');
    expect(symAlgorithms.length).toBe(34);
    const names = symAlgorithms.map((a) => a.info.name);

    // AES-128
    expect(names).toContain('AES-128-ECB (Encrypt)');
    expect(names).toContain('AES-128-ECB (Decrypt)');
    expect(names).toContain('AES-128-CBC (Encrypt)');
    expect(names).toContain('AES-128-CBC (Decrypt)');
    expect(names).toContain('AES-128-CTR (Encrypt)');
    expect(names).toContain('AES-128-CTR (Decrypt)');

    // AES-192
    expect(names).toContain('AES-192-ECB (Encrypt)');
    expect(names).toContain('AES-192-ECB (Decrypt)');
    expect(names).toContain('AES-192-CBC (Encrypt)');
    expect(names).toContain('AES-192-CBC (Decrypt)');
    expect(names).toContain('AES-192-CTR (Encrypt)');
    expect(names).toContain('AES-192-CTR (Decrypt)');

    // AES-256
    expect(names).toContain('AES-256-ECB (Encrypt)');
    expect(names).toContain('AES-256-ECB (Decrypt)');
    expect(names).toContain('AES-256-CBC (Encrypt)');
    expect(names).toContain('AES-256-CBC (Decrypt)');
    expect(names).toContain('AES-256-CTR (Encrypt)');
    expect(names).toContain('AES-256-CTR (Decrypt)');

    // AES-GCM
    expect(names).toContain('AES-128-GCM (Encrypt)');
    expect(names).toContain('AES-128-GCM (Decrypt)');
    expect(names).toContain('AES-256-GCM (Encrypt)');
    expect(names).toContain('AES-256-GCM (Decrypt)');

    // DES
    expect(names).toContain('DES-ECB (Encrypt)');
    expect(names).toContain('DES-ECB (Decrypt)');
    expect(names).toContain('DES-CBC (Encrypt)');
    expect(names).toContain('DES-CBC (Decrypt)');

    // 3DES
    expect(names).toContain('3DES-ECB (Encrypt)');
    expect(names).toContain('3DES-ECB (Decrypt)');
    expect(names).toContain('3DES-CBC (Encrypt)');
    expect(names).toContain('3DES-CBC (Decrypt)');

    // ChaCha20 & ChaCha20-Poly1305
    expect(names).toContain('ChaCha20 (Encrypt)');
    expect(names).toContain('ChaCha20 (Decrypt)');
    expect(names).toContain('ChaCha20-Poly1305 (Encrypt)');
    expect(names).toContain('ChaCha20-Poly1305 (Decrypt)');
  });

  it('registers all 8 asymmetric algorithms (RSA-2048 and RSA-Pedagogical)', () => {
    const asymAlgorithms = listAlgorithms('asymmetric');
    expect(asymAlgorithms.length).toBe(8);
    const names = asymAlgorithms.map((a) => a.info.name);

    expect(names).toContain('RSA-2048 (Encrypt)');
    expect(names).toContain('RSA-2048 (Decrypt)');
    expect(names).toContain('RSA-2048 (Sign)');
    expect(names).toContain('RSA-2048 (Verify)');
    expect(names).toContain('RSA-Pedagogical (Encrypt)');
    expect(names).toContain('RSA-Pedagogical (Decrypt)');
    expect(names).toContain('RSA-Pedagogical (Sign)');
    expect(names).toContain('RSA-Pedagogical (Verify)');
  });

  it('can look up every algorithm by name across all categories', () => {
    const algorithms = listAlgorithms();
    expect(algorithms.length).toBe(76);
    for (const algo of algorithms) {
      const retrieved = getAlgorithm(algo.info.name);
      expect(retrieved).toBeDefined();
      expect(retrieved?.info.name).toBe(algo.info.name);
    }
  });

  it('groups algorithms by family correctly for hash, symmetric, and asymmetric categories', () => {
    const hashFamilies = getAlgorithmsByFamily('hash');
    expect(hashFamilies.has('MD')).toBe(true);
    expect(hashFamilies.has('SHA-1')).toBe(true);
    expect(hashFamilies.has('SHA-2')).toBe(true);
    expect(hashFamilies.has('SHA-3')).toBe(true);
    expect(hashFamilies.has('RIPEMD')).toBe(true);
    expect(hashFamilies.has('BLAKE')).toBe(true);
    expect(hashFamilies.has('CRC')).toBe(true);
    expect(hashFamilies.has('Checksum')).toBe(true);
    expect(hashFamilies.has('XXHash')).toBe(true);
    expect(hashFamilies.has('Chinese National Standard')).toBe(true);
    expect(hashFamilies.has('Cipher-Based')).toBe(true);

    const symFamilies = getAlgorithmsByFamily('symmetric');
    expect(symFamilies.has('AES-128')).toBe(true);
    expect(symFamilies.has('AES-192')).toBe(true);
    expect(symFamilies.has('AES-256')).toBe(true);
    expect(symFamilies.has('AES-GCM (AEAD)')).toBe(true);
    expect(symFamilies.has('DES')).toBe(true);
    expect(symFamilies.has('3DES')).toBe(true);
    expect(symFamilies.has('ChaCha20-Poly1305')).toBe(true);

    const asymFamilies = getAlgorithmsByFamily('asymmetric');
    expect(asymFamilies.has('RSA Cryptosystem')).toBe(true);
  });

  it('computes hash/cipher and steps for all registered algorithms', () => {
    const algorithms = listAlgorithms();
    for (const algo of algorithms) {
      const result = algo.compute('3243f6a8885a308d313198a2e0370734');
      expect(result.digest !== undefined).toBe(true);
      expect(result.steps.length).toBeGreaterThan(0);
      for (const step of result.steps) {
        expect(step.id).toBeTruthy();
        expect(step.title).toBeTruthy();
        expect(step.phase).toBeTruthy();
        expect(step.description).toBeTruthy();
        expect(step.visualizationType).toBeTruthy();
      }
    }
  });
});
