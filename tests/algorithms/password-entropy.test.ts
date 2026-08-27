import { describe, it, expect } from 'vitest';
import { computePasswordEntropy } from '../../src/algorithms/tools/entropy-csprng/password';
import { passwordPlugin } from '../../src/algorithms/tools/entropy-csprng/password-plugin';

describe('Password Entropy & Strength Estimator', () => {
  it('correctly calculates entropy for lowercase-only 8-character password', () => {
    // Pool = 26 (lowercase a-z). H = 8 * log2(26) = 8 * 4.7004397 = 37.60 bits
    const res = computePasswordEntropy('abcdefgh');
    expect(res.passwordLength).toBe(8);
    expect(res.poolSize).toBe(26);
    expect(res.poolComposition.hasLower).toBe(true);
    expect(res.poolComposition.hasUpper).toBe(false);
    expect(res.poolComposition.hasDigits).toBe(false);
    expect(res.shannonEntropyBits).toBe(37.60);
    expect(res.strengthCategory).toBe('moderate');
  });

  it('correctly calculates entropy for alphanumeric + symbols password', () => {
    // "Tr0ub4dor&3": length 11, lowercase (26) + uppercase (26) + digits (10) + symbols (33) = 95
    // H = 11 * log2(95) = 11 * 6.5698556 = 72.27 bits
    const res = computePasswordEntropy('Tr0ub4dor&3');
    expect(res.passwordLength).toBe(11);
    expect(res.poolSize).toBe(95);
    expect(res.shannonEntropyBits).toBe(72.27);
    expect(res.strengthCategory).toBe('strong');
    expect(res.crackTimes.offlineSingleGpu).not.toContain('Instant');
  });

  it('correctly calculates high entropy for long passphrase', () => {
    // "correct horse battery staple": length 28, lowercase (26) + space (symbols 33) = 59
    // H = 28 * log2(59) = 28 * 5.882643 = 164.71 bits
    const res = computePasswordEntropy('correct horse battery staple');
    expect(res.passwordLength).toBe(28);
    expect(res.shannonEntropyBits).toBeGreaterThan(100);
    expect(res.strengthCategory).toBe('cryptographic');
  });

  it('runs passwordPlugin computation generating telemetry step and digest', () => {
    const res = passwordPlugin.compute('eK9#mQ2$vL8*zP4!wR7^tY1@bN5&');
    expect(res.steps.length).toBe(1);
    expect(res.digest).toBeTruthy();
    expect(res.steps[0].visualizationType).toBe('entropy-analysis');
  });
});
