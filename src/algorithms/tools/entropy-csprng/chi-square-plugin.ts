/**
 * Chi-Square Goodness-of-Fit Test Plugin
 */

import type { AlgorithmPlugin, AlgorithmInfo, ComputationResult, ComputationStep } from '../../types';
import { computeChiSquareTest } from './chi-square';

const info: AlgorithmInfo = {
  name: 'Chi-Square Distribution Test',
  family: 'Entropy & CSPRNG Tools',
  category: 'tools',
  digestSize: 64,
  blockSize: 8,
  description: 'Performs Pearson Chi-Square goodness-of-fit test against uniform byte distribution with p-value and NIST SP 800-22 randomness evaluation verdict.',
  useCases: ['Randomness Quality Testing', 'Statistical Hypothesis Testing', 'Dieharder Suite Benchmark', 'RNG Validation'],
  security: 'secure',
  year: 1900,
  designers: ['Karl Pearson', 'NIST (SP 800-22)'],
};

export const chiSquarePlugin: AlgorithmPlugin = {
  info,
  compute(input: string): ComputationResult {
    const res = computeChiSquareTest(input);
    const steps: ComputationStep[] = [];

    steps.push({
      id: 'chi-square-analysis',
      title: 'Chi-Square Goodness-of-Fit Randomness Test',
      phase: 'Statistical Hypothesis Test',
      description: `Chi-Square Statistic: ${res.chiSquareStat.toFixed(2)} (df=255, p=${res.pValue.toFixed(6)}). Verdict: ${res.verdictMessage}`,
      visualizationType: 'entropy-analysis',
      data: {
        toolType: 'chi-square',
        byteLength: res.byteLength,
        degreesOfFreedom: res.degreesOfFreedom,
        chiSquareStat: res.chiSquareStat,
        expectedFrequency: res.expectedFrequency,
        pValue: res.pValue,
        verdict: res.verdict,
        verdictMessage: res.verdictMessage,
        histogramBins: res.observedFrequencies,
        significantOutliers: res.significantOutliers,
      },
    });

    return {
      digest: `χ² = ${res.chiSquareStat.toFixed(2)} (p = ${res.pValue.toFixed(4)}, ${res.verdict.toUpperCase()})`,
      steps,
    };
  },
};

export default chiSquarePlugin;
