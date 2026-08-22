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

  it('registers all 22 symmetric cipher algorithms (AES 128/192/256 ECB/CBC/CTR/GCM)', () => {
    const symAlgorithms = listAlgorithms('symmetric');
    expect(symAlgorithms.length).toBe(22);
    const names = symAlgorithms.map((a) => a.info.name);

    expect(names).toContain('AES-128-ECB (Encrypt)');
    expect(names).toContain('AES-128-ECB (Decrypt)');
    expect(names).toContain('AES-128-CBC (Encrypt)');
    expect(names).toContain('AES-128-CBC (Decrypt)');
    expect(names).toContain('AES-128-CTR (Encrypt)');
    expect(names).toContain('AES-128-CTR (Decrypt)');

    expect(names).toContain('AES-192-ECB (Encrypt)');
    expect(names).toContain('AES-192-ECB (Decrypt)');
    expect(names).toContain('AES-192-CBC (Encrypt)');
    expect(names).toContain('AES-192-CBC (Decrypt)');
    expect(names).toContain('AES-192-CTR (Encrypt)');
    expect(names).toContain('AES-192-CTR (Decrypt)');

    expect(names).toContain('AES-256-ECB (Encrypt)');
    expect(names).toContain('AES-256-ECB (Decrypt)');
    expect(names).toContain('AES-256-CBC (Encrypt)');
    expect(names).toContain('AES-256-CBC (Decrypt)');
    expect(names).toContain('AES-256-CTR (Encrypt)');
    expect(names).toContain('AES-256-CTR (Decrypt)');

    expect(names).toContain('AES-128-GCM (Encrypt)');
    expect(names).toContain('AES-128-GCM (Decrypt)');
    expect(names).toContain('AES-256-GCM (Encrypt)');
    expect(names).toContain('AES-256-GCM (Decrypt)');
  });

  it('can look up every algorithm by name across all categories', () => {
    const algorithms = listAlgorithms();
    expect(algorithms.length).toBe(56);
    for (const algo of algorithms) {
      const retrieved = getAlgorithm(algo.info.name);
      expect(retrieved).toBeDefined();
      expect(retrieved?.info.name).toBe(algo.info.name);
    }
  });

  it('groups algorithms by family correctly for hash and symmetric categories', () => {
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
