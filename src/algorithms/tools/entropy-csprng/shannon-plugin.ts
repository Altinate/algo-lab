/**
 * Shannon Entropy Calculator Plugin
 */

import type { AlgorithmPlugin, AlgorithmInfo, ComputationResult, ComputationStep } from '../../types';
import { computeShannonEntropy } from './shannon';

const info: AlgorithmInfo = {
  name: 'Shannon Entropy Calculator',
  family: 'Entropy & CSPRNG Tools',
  category: 'tools',
  digestSize: 64,
  blockSize: 8,
  description: 'Calculates Shannon information entropy H = -Σ p(x) log2 p(x) in bits per byte/symbol, measuring uncertainty and data compression potential.',
  useCases: ['Randomness Evaluation', 'Compression Analysis', 'Ciphertext Diagnostics', 'Entropy Estimation'],
  security: 'secure',
  year: 1948,
  designers: ['Claude Shannon'],
};

export const shannonPlugin: AlgorithmPlugin = {
  info,
  compute(input: string): ComputationResult {
    const res = computeShannonEntropy(input);
    const steps: ComputationStep[] = [];

    steps.push({
      id: 'shannon-analysis',
      title: 'Shannon Information Entropy Analysis',
      phase: 'Instant Telemetry',
      description: `Computed Shannon Entropy: ${res.shannonEntropy.toFixed(4)} / 8.0000 bits/byte (${res.entropyRatioPercent}% density across ${res.byteLength} bytes).`,
      visualizationType: 'entropy-analysis',
      data: {
        toolType: 'shannon',
        byteLength: res.byteLength,
        uniqueBytes: res.uniqueBytes,
        shannonEntropy: res.shannonEntropy,
        maxEntropy: res.maxEntropy,
        entropyRatioPercent: res.entropyRatioPercent,
        totalBits: res.totalBits,
        theoreticalCompressionRatio: res.theoreticalCompressionRatio,
        topFrequencies: res.topFrequencies,
        histogramBins: res.byteHistogram,
      },
    });

    return {
      digest: `${res.shannonEntropy.toFixed(4)} bits/byte (${res.entropyRatioPercent}%)`,
      steps,
    };
  },
};

export default shannonPlugin;
