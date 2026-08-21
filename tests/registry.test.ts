import { describe, it, expect } from 'vitest';
import { listAlgorithms, getAlgorithm, getAlgorithmsByFamily } from '../src/algorithms/registry';

describe('Algorithm Registry', () => {
  it('registers all 13 built-in algorithms', () => {
    const algorithms = listAlgorithms();
    expect(algorithms.length).toBe(13);
    const names = algorithms.map((a) => a.info.name);
    expect(names).toContain('MD5');
    expect(names).toContain('SHA-1');
    expect(names).toContain('SHA-224');
    expect(names).toContain('SHA-256');
    expect(names).toContain('SHA-384');
    expect(names).toContain('SHA-512');
    expect(names).toContain('SHA3-256');
    expect(names).toContain('SHA3-512');
    expect(names).toContain('Keccak-256');
    expect(names).toContain('BLAKE2s');
    expect(names).toContain('BLAKE2b');
    expect(names).toContain('BLAKE3');
    expect(names).toContain('CRC32');
  });

  it('can look up every algorithm by name', () => {
    const algorithms = listAlgorithms();
    for (const algo of algorithms) {
      const retrieved = getAlgorithm(algo.info.name);
      expect(retrieved).toBeDefined();
      expect(retrieved?.info.name).toBe(algo.info.name);
    }
  });

  it('groups algorithms by family correctly', () => {
    const byFamily = getAlgorithmsByFamily();
    expect(byFamily.has('SHA-2')).toBe(true);
    expect(byFamily.get('SHA-2')?.map((a) => a.info.name)).toEqual([
      'SHA-224',
      'SHA-256',
      'SHA-384',
      'SHA-512',
    ]);
    expect(byFamily.has('SHA-3')).toBe(true);
    expect(byFamily.get('SHA-3')?.map((a) => a.info.name)).toEqual([
      'SHA3-256',
      'SHA3-512',
      'Keccak-256',
    ]);
    expect(byFamily.has('BLAKE')).toBe(true);
    expect(byFamily.get('BLAKE')?.map((a) => a.info.name)).toEqual([
      'BLAKE2b',
      'BLAKE2s',
      'BLAKE3',
    ]);
    expect(byFamily.has('MD5')).toBe(true);
    expect(byFamily.has('SHA-1')).toBe(true);
    expect(byFamily.has('CRC')).toBe(true);
  });

  it('computes hash and steps for all registered algorithms with "abc"', () => {
    const algorithms = listAlgorithms();
    for (const algo of algorithms) {
      const result = algo.compute('abc');
      expect(result.digest).toBeTruthy();
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
