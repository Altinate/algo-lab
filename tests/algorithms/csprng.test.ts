import { describe, it, expect } from 'vitest';
import { generateCsprngBytes } from '../../src/algorithms/tools/entropy-csprng/csprng';
import { csprngPlugin } from '../../src/algorithms/tools/entropy-csprng/csprng-plugin';

describe('CSPRNG Live Generator', () => {
  it('generates cryptographic byte buffer of requested length', () => {
    const res = generateCsprngBytes(64);
    expect(res.byteLength).toBe(64);
    expect(res.bytes.length).toBe(64);
    expect(res.hex.length).toBe(128);
    expect(res.bitRaster.length).toBe(512); // 64 * 8
    expect(res.isCryptographic).toBe(true);
  });

  it('generates stream with high Shannon entropy (> 7.5 bits/byte for 1024 bytes)', () => {
    const res = generateCsprngBytes(1024);
    expect(res.shannon.shannonEntropy).toBeGreaterThan(7.5);
    expect(res.shannon.uniqueBytes).toBeGreaterThan(200);
  });

  it('runs csprngPlugin with custom length input', () => {
    const res = csprngPlugin.compute('32');
    expect(res.steps.length).toBe(1);
    expect(res.digest).toBeTruthy();
    expect(res.steps[0].visualizationType).toBe('entropy-analysis');
  });
});
