/**
 * CSPRNG Live Generator Plugin
 */

import type { AlgorithmPlugin, AlgorithmInfo, ComputationResult, ComputationStep } from '../../types';
import { generateCsprngBytes } from './csprng';
import { computeShannonEntropy } from './shannon';
import { computeChiSquareTest } from './chi-square';
import { hexToBytes } from '../../utils';

const info: AlgorithmInfo = {
  name: 'CSPRNG Live Generator',
  family: 'Entropy & CSPRNG Tools',
  category: 'tools',
  digestSize: 256,
  blockSize: 8,
  description: 'Live Cryptographically Secure Pseudo-Random Number Generator using crypto.getRandomValues() with real-time 2D bit raster matrix and statistical telemetry.',
  useCases: ['Cryptographic Key Generation', 'Nonces & Initialization Vectors', 'Salt Generation', 'Entropy Visualization'],
  security: 'secure',
  year: 1998,
  designers: ['W3C Web Cryptography Working Group', 'NIST'],
};

export const csprngPlugin: AlgorithmPlugin = {
  info,
  compute(input: string): ComputationResult {
    let byteLength = 256;
    const clean = input.trim();

    // Check if input requests a specific byte length (e.g. "16", "32", "64", "1024")
    if (/^\d+$/.test(clean) && parseInt(clean, 10) > 0) {
      byteLength = Math.min(4096, parseInt(clean, 10));
    }

    let genRes;
    // If input is an explicit existing hex string (length >= 32 and all hex), analyze it
    if (/^[0-9a-fA-F]+$/.test(clean) && clean.length >= 32 && clean.length % 2 === 0 && !/^\d+$/.test(clean)) {
      try {
        const bytes = hexToBytes(clean);
        const bitRaster: number[] = [];
        const maxBits = Math.min(bytes.length * 8, 4096);
        for (let i = 0; i < bytes.length && bitRaster.length < maxBits; i++) {
          const b = bytes[i];
          for (let bitIdx = 7; bitIdx >= 0 && bitRaster.length < maxBits; bitIdx--) {
            bitRaster.push((b >> bitIdx) & 1);
          }
        }
        genRes = {
          byteLength: bytes.length,
          hex: clean,
          bytes,
          bitRaster,
          shannon: computeShannonEntropy(bytes),
          chiSquare: computeChiSquareTest(bytes),
          isCryptographic: true,
          entropySource: 'User Provided Stream / CSPRNG Trace',
        };
      } catch {
        genRes = generateCsprngBytes(byteLength);
      }
    } else {
      genRes = generateCsprngBytes(byteLength);
    }

    const steps: ComputationStep[] = [];

    steps.push({
      id: 'csprng-generation',
      title: 'CSPRNG Live Stream Generation',
      phase: 'Entropy Generation',
      description: `Generated ${genRes.byteLength} bytes (${genRes.byteLength * 8} bits) of cryptographic randomness via ${genRes.entropySource}.`,
      visualizationType: 'entropy-analysis',
      data: {
        toolType: 'csprng',
        byteLength: genRes.byteLength,
        uniqueBytes: genRes.shannon.uniqueBytes,
        shannonEntropy: genRes.shannon.shannonEntropy,
        maxEntropy: genRes.shannon.maxEntropy,
        entropyRatioPercent: genRes.shannon.entropyRatioPercent,
        chiSquareStat: genRes.chiSquare.chiSquareStat,
        degreesOfFreedom: genRes.chiSquare.degreesOfFreedom,
        pValue: genRes.chiSquare.pValue,
        verdict: genRes.chiSquare.verdict,
        verdictMessage: genRes.chiSquare.verdictMessage,
        csprngHex: genRes.hex,
        bitRaster: genRes.bitRaster,
        histogramBins: genRes.chiSquare.observedFrequencies,
        entropySource: genRes.entropySource,
      },
    });

    return {
      digest: `${genRes.byteLength} Bytes CSPRNG (H=${genRes.shannon.shannonEntropy.toFixed(3)}, p=${genRes.chiSquare.pValue.toFixed(3)})`,
      steps,
    };
  },
};

export default csprngPlugin;
