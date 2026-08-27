import { describe, it, expect } from 'vitest';
import { computeChiSquareTest, computeChiSquarePValue } from '../../src/algorithms/tools/entropy-csprng/chi-square';
import { chiSquarePlugin } from '../../src/algorithms/tools/entropy-csprng/chi-square-plugin';
import { ENTROPY_PRESETS } from '../../src/algorithms/tools/entropy-csprng/presets';

describe('Chi-Square Distribution Test', () => {
  it('correctly fails zero stream as highly non-random', () => {
    const zeroStream = new Uint8Array(1024).fill(0x00);
    const res = computeChiSquareTest(zeroStream);
    expect(res.byteLength).toBe(1024);
    expect(res.degreesOfFreedom).toBe(255);
    // For 1024 zeroes: chi2 = (1024-4)^2/4 + 255 * (0-4)^2/4 = 260100 + 1020 = 261120
    expect(res.chiSquareStat).toBe(261120);
    expect(res.pValue).toBe(0.0);
    expect(res.verdict).toBe('non-uniform');
    expect(res.verdictMessage).toContain('FAIL');
  });

  it('correctly classifies uniform permutation as too-flat / artificial', () => {
    const uniformBytes = new Uint8Array(1024);
    for (let c = 0; c < 4; c++) {
      for (let b = 0; b < 256; b++) {
        uniformBytes[c * 256 + b] = b;
      }
    }
    const res = computeChiSquareTest(uniformBytes);
    expect(res.chiSquareStat).toBe(0);
    expect(res.pValue).toBe(1.0);
    expect(res.verdict).toBe('too-flat');
    expect(res.verdictMessage).toContain('ARTIFICIAL');
  });

  it('accurately computes p-values matching authoritative Chi-Square reference tables (nu=255)', () => {
    // Median reference point: chi2 = 254.33 -> exact p = 0.500064
    expect(computeChiSquarePValue(254.33, 255)).toBeCloseTo(0.50006, 4);

    // Mean reference point: chi2 = 255.00 -> exact p = 0.488222
    expect(computeChiSquarePValue(255.00, 255)).toBeCloseTo(0.48822, 4);

    // Moderate positive deviation (CSPRNG audit sample): chi2 = 274.00 -> exact p = 0.197482
    expect(computeChiSquarePValue(274.00, 255)).toBeCloseTo(0.19744, 4);

    // NIST SP 800-22 alpha=0.01 boundary: chi2 = 310.65 -> exact p = 0.009802
    expect(computeChiSquarePValue(310.65, 255)).toBeCloseTo(0.00981, 4);
  });

  it('runs chiSquarePlugin computation generating telemetry step and digest', () => {
    const res = chiSquarePlugin.compute(ENTROPY_PRESETS[3].content); // Ciphertext stream
    expect(res.steps.length).toBe(1);
    expect(res.digest).toBeTruthy();
    expect(res.steps[0].visualizationType).toBe('entropy-analysis');
  });
});
