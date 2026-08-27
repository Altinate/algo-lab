/**
 * Password Strength & Entropy Estimator Plugin
 */

import type { AlgorithmPlugin, AlgorithmInfo, ComputationResult, ComputationStep } from '../../types';
import { computePasswordEntropy } from './password';

const info: AlgorithmInfo = {
  name: 'Password Strength & Entropy Estimator',
  family: 'Entropy & CSPRNG Tools',
  category: 'tools',
  digestSize: 64,
  blockSize: 8,
  description: 'Estimates theoretical password entropy (H = L × log2|R|) and brute-force search times across attack tiers with NIST SP 800-63B length vs composition guidance.',
  useCases: ['Credential Security Assessment', 'Passphrase Auditing', 'Entropy Benchmarking', 'Policy Compliance'],
  security: 'secure',
  year: 1999,
  designers: ['Information Theory Standard Model', 'NIST SP 800-63B'],
};

export const passwordPlugin: AlgorithmPlugin = {
  info,
  compute(input: string): ComputationResult {
    const res = computePasswordEntropy(input || 'correct horse battery staple');
    const steps: ComputationStep[] = [];

    steps.push({
      id: 'password-analysis',
      title: 'Password Entropy & Search-Space Estimation',
      phase: 'Security Evaluation',
      description: `Password Length: ${res.passwordLength} chars, Pool Size: ${res.poolSize}, Theoretical Entropy: ${res.shannonEntropyBits} bits. Rating: ${res.strengthCategory.toUpperCase()}`,
      visualizationType: 'entropy-analysis',
      data: {
        toolType: 'password',
        byteLength: res.passwordLength,
        passwordLength: res.passwordLength,
        poolSize: res.poolSize,
        shannonEntropy: res.shannonEntropyBits,
        poolComposition: res.poolComposition,
        searchSpaceSize: res.searchSpaceSize,
        crackTimes: res.crackTimes,
        strengthCategory: res.strengthCategory,
        strengthScore: res.strengthScore,
        summary: res.summary,
        nistGuidanceNotes: res.nistGuidanceNotes,
      },
    });

    return {
      digest: `${res.shannonEntropyBits.toFixed(1)} bits (${res.strengthCategory.toUpperCase()}) — ${res.crackTimes.offlineSingleGpu} (GPU)`,
      steps,
    };
  },
};

export default passwordPlugin;
