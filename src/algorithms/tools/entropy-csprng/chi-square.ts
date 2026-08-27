/**
 * Chi-Square Goodness-of-Fit Test for Byte Uniformity
 * Standard statistical hypothesis test for evaluating randomness
 * Framed per NIST SP 800-22 & Dieharder test suites.
 */

import { parseInputToBytes } from './shannon';

export type ChiSquareVerdict = 'uniform' | 'suspect' | 'non-uniform' | 'too-flat';

export interface ChiSquareResult {
  byteLength: number;
  degreesOfFreedom: number; // 255 for 256 byte bins
  chiSquareStat: number;
  expectedFrequency: number; // N / 256
  pValue: number;
  verdict: ChiSquareVerdict;
  verdictMessage: string;
  observedFrequencies: number[]; // 256 counts
  significantOutliers: Array<{
    byteVal: number;
    hex: string;
    char: string;
    observed: number;
    expected: number;
    deviation: number;
  }>;
}

/**
 * Standard Normal CDF approximation using erf
 */
function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/**
 * Error function approximation (Abramowitz & Stegun formula 7.1.26)
 */
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

/**
 * Computes the right-tail p-value for Chi-Square distribution using Wilson-Hilferty transformation
 * Highly accurate for nu = 255 (degrees of freedom > 30).
 */
export function computeChiSquarePValue(chiSquare: number, nu: number): number {
  if (chiSquare <= 0) return 1.0;
  if (nu <= 0) return 0.0;

  // Wilson-Hilferty approximation for large degrees of freedom
  const term1 = Math.pow(chiSquare / nu, 1 / 3);
  const term2 = 1 - (2 / (9 * nu));
  const denom = Math.sqrt(2 / (9 * nu));

  const z = (term1 - term2) / denom;
  const p = 1.0 - normalCdf(z);

  return Math.max(0.0, Math.min(1.0, p));
}

export function computeChiSquareTest(input: string | Uint8Array): ChiSquareResult {
  const bytes = typeof input === 'string' ? parseInputToBytes(input) : input;
  const N = bytes.length;
  const nu = 255; // 256 bins - 1

  if (N === 0) {
    return {
      byteLength: 0,
      degreesOfFreedom: nu,
      chiSquareStat: 0,
      expectedFrequency: 0,
      pValue: 1.0,
      verdict: 'too-flat',
      verdictMessage: 'No data input to evaluate.',
      observedFrequencies: new Array(256).fill(0),
      significantOutliers: [],
    };
  }

  const counts = new Array(256).fill(0);
  for (let i = 0; i < N; i++) {
    counts[bytes[i]]++;
  }

  const expected = N / 256;
  let chi2 = 0;
  const outliers: ChiSquareResult['significantOutliers'] = [];

  const stdDev = Math.sqrt(expected > 0 ? expected * (1 - 1 / 256) : 1);

  for (let b = 0; b < 256; b++) {
    const obs = counts[b];
    const diff = obs - expected;
    if (expected > 0) {
      chi2 += (diff * diff) / expected;
    }

    // Flag symbols deviating by more than 2.5 standard deviations
    if (Math.abs(diff) > 2.5 * stdDev && Math.abs(diff) >= 3) {
      const charRepr = b >= 32 && b <= 126 ? String.fromCharCode(b) : `\\x${b.toString(16).padStart(2, '0').toUpperCase()}`;
      outliers.push({
        byteVal: b,
        hex: '0x' + b.toString(16).padStart(2, '0').toUpperCase(),
        char: charRepr,
        observed: obs,
        expected: Number(expected.toFixed(2)),
        deviation: Number(diff.toFixed(2)),
      });
    }
  }

  // Sort outliers by largest absolute deviation
  outliers.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

  const pValue = computeChiSquarePValue(chi2, nu);

  let verdict: ChiSquareVerdict;
  let verdictMessage: string;

  if (pValue >= 0.01 && pValue <= 0.99) {
    verdict = 'uniform';
    verdictMessage = 'PASS — Consistent with Uniform Distribution (NIST SP 800-22 criterion met)';
  } else if ((pValue >= 0.001 && pValue < 0.01) || (pValue > 0.99 && pValue <= 0.999)) {
    verdict = 'suspect';
    verdictMessage = 'SUSPECT — Marginal distribution (mild statistical anomaly detected)';
  } else if (pValue < 0.001) {
    verdict = 'non-uniform';
    verdictMessage = 'FAIL — Highly Non-Random (Severe deviation from uniform randomness)';
  } else {
    // pValue > 0.999
    verdict = 'too-flat';
    verdictMessage = 'ARTIFICIAL — Too Uniform (Distribution is unnaturally flat; consistent with permutation or counter rather than true stochastic randomness)';
  }

  return {
    byteLength: N,
    degreesOfFreedom: nu,
    chiSquareStat: Number(chi2.toFixed(4)),
    expectedFrequency: Number(expected.toFixed(2)),
    pValue: Number(pValue.toFixed(6)),
    verdict,
    verdictMessage,
    observedFrequencies: counts,
    significantOutliers: outliers.slice(0, 10),
  };
}
