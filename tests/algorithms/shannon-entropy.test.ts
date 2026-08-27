import { describe, it, expect } from 'vitest';
import { computeShannonEntropy } from '../../src/algorithms/tools/entropy-csprng/shannon';
import { shannonPlugin } from '../../src/algorithms/tools/entropy-csprng/shannon-plugin';
import { ENTROPY_PRESETS } from '../../src/algorithms/tools/entropy-csprng/presets';

describe('Shannon Entropy Calculator', () => {
  it('correctly computes 0.0 entropy for zero/constant stream', () => {
    const zeroStream = new Uint8Array(1024).fill(0x00);
    const res = computeShannonEntropy(zeroStream);
    expect(res.byteLength).toBe(1024);
    expect(res.uniqueBytes).toBe(1);
    expect(res.shannonEntropy).toBe(0.0);
    expect(res.entropyRatioPercent).toBe(0.0);
    expect(res.theoreticalCompressionRatio).toBe(100.0);
  });

  it('correctly computes 8.0 maximal entropy for uniform permutation', () => {
    // 4 copies of all 256 byte values = 1024 bytes with exact 1/256 probability each
    const uniformBytes = new Uint8Array(1024);
    for (let c = 0; c < 4; c++) {
      for (let b = 0; b < 256; b++) {
        uniformBytes[c * 256 + b] = b;
      }
    }
    const res = computeShannonEntropy(uniformBytes);
    expect(res.byteLength).toBe(1024);
    expect(res.uniqueBytes).toBe(256);
    expect(res.shannonEntropy).toBe(8.0);
    expect(res.entropyRatioPercent).toBe(100.0);
    expect(res.theoreticalCompressionRatio).toBe(0.0);
  });

  it('correctly computes expected entropy range (~4.0 - 4.7 bits/byte) for English prose', () => {
    const prose = ENTROPY_PRESETS[0].content;
    const res = computeShannonEntropy(prose);
    expect(res.shannonEntropy).toBeGreaterThan(3.8);
    expect(res.shannonEntropy).toBeLessThan(4.8);
    expect(res.topFrequencies.length).toBeGreaterThan(0);
    // Space should be among the top symbols in natural English text
    const topSymbols = res.topFrequencies.map(f => f.char);
    expect(topSymbols).toContain(' ');
  });

  it('runs shannonPlugin computation generating telemetry step and digest', () => {
    const res = shannonPlugin.compute(ENTROPY_PRESETS[0].content);
    expect(res.steps.length).toBe(1);
    expect(res.digest).toBeTruthy();
    expect(res.steps[0].visualizationType).toBe('entropy-analysis');
  });
});
