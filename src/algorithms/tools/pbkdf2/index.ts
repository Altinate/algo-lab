/**
 * RFC 8018 / RFC 2898 PKCS #5 PBKDF2 (Password-Based Key Derivation Function 2)
 * Using HMAC-SHA256 Pseudorandom Function (PRF).
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { stringToBytes, bytesToHex, hexToBytes } from '../../utils';
import { hmacSha256 } from '../../encoding/jwt';

export interface Pbkdf2StepData {
  toolType: 'PBKDF2';
  password: string;
  salt: string;
  iterations: number;
  currentIteration?: number;
  blockIndex: number;
  totalBlocks: number;
  keyLength: number;
  uHex?: string;
  accumulatorHex?: string;
  derivedKeyHex?: string;
  progressPercent?: number;
  phaseName: string;
  isSummary?: boolean;
}

export function pbkdf2HmacSha256(
  passwordInput: string | Uint8Array,
  saltInput: string | Uint8Array,
  iterations = 4096,
  keyLength = 32,
): ComputationResult {
  const steps: ComputationStep[] = [];

  const passwordBytes = typeof passwordInput === 'string' ? stringToBytes(passwordInput) : passwordInput;
  const saltBytes = typeof saltInput === 'string' ? stringToBytes(saltInput) : saltInput;
  const passwordStr = typeof passwordInput === 'string' ? passwordInput : bytesToHex(passwordInput);
  const saltStr = typeof saltInput === 'string' ? saltInput : bytesToHex(saltInput);

  const hLen = 32; // SHA-256 output length in bytes
  const l = Math.ceil(keyLength / hLen); // Total blocks

  steps.push({
    id: 'pbkdf2-init',
    title: 'PBKDF2 Initialization (HMAC-SHA256)',
    phase: 'INITIALIZATION',
    description: `Configured PBKDF2: Password="${passwordStr}", Salt="${saltStr}" (${saltBytes.length}B), Iterations c=${iterations}, Target Key Length=${keyLength} bytes (${keyLength * 8} bits), Required Blocks l=${l}.`,
    visualizationType: 'binary-transform',
    data: {
      pbkdf2: {
        toolType: 'PBKDF2',
        password: passwordStr,
        salt: saltStr,
        iterations,
        blockIndex: 0,
        totalBlocks: l,
        keyLength,
        phaseName: 'Parameter Initialization',
      } as Pbkdf2StepData,
    },
  });

  const derivedKey = new Uint8Array(keyLength);

  for (let block = 1; block <= l; block++) {
    // Salt || INT_32_BE(block)
    const saltBlock = new Uint8Array(saltBytes.length + 4);
    saltBlock.set(saltBytes);
    const dv = new DataView(saltBlock.buffer);
    dv.setUint32(saltBytes.length, block, false);

    // U_1 = PRF(Password, Salt || INT_32_BE(block))
    let uPrev = hmacSha256(passwordBytes, saltBlock);
    const tAccumulator = new Uint8Array(uPrev);

    steps.push({
      id: `pbkdf2-block-${block}-u1`,
      title: `Block ${block}/${l} — Initial PRF Round (U₁)`,
      phase: `BLOCK ${block} ITERATION`,
      description: `Computed U₁ = HMAC-SHA256(Password, Salt ∥ INT_32_BE(${block})).\nU₁: 0x${bytesToHex(uPrev)}\nInitial Accumulator T_${block} = U₁.`,
      visualizationType: 'binary-transform',
      data: {
        pbkdf2: {
          toolType: 'PBKDF2',
          password: passwordStr,
          salt: saltStr,
          iterations,
          currentIteration: 1,
          blockIndex: block,
          totalBlocks: l,
          keyLength,
          uHex: bytesToHex(uPrev),
          accumulatorHex: bytesToHex(tAccumulator),
          progressPercent: Math.round((1 / iterations) * 100),
          phaseName: `Block ${block} — Round 1/${iterations}`,
        } as Pbkdf2StepData,
      },
    });

    if (iterations <= 16) {
      // Small iteration count: emit every single round
      for (let c = 2; c <= iterations; c++) {
        uPrev = hmacSha256(passwordBytes, uPrev);
        for (let j = 0; j < hLen; j++) {
          tAccumulator[j] ^= uPrev[j];
        }

        steps.push({
          id: `pbkdf2-block-${block}-round-${c}`,
          title: `Block ${block}/${l} — Round ${c}/${iterations} (U_${c})`,
          phase: `BLOCK ${block} ITERATION`,
          description: `U_${c} = HMAC-SHA256(Password, U_${c - 1}) → 0x${bytesToHex(uPrev)}\nXOR Accumulator T_${block} = T_${block} ⊕ U_${c} → 0x${bytesToHex(tAccumulator)}.`,
          visualizationType: 'binary-transform',
          data: {
            pbkdf2: {
              toolType: 'PBKDF2',
              password: passwordStr,
              salt: saltStr,
              iterations,
              currentIteration: c,
              blockIndex: block,
              totalBlocks: l,
              keyLength,
              uHex: bytesToHex(uPrev),
              accumulatorHex: bytesToHex(tAccumulator),
              progressPercent: Math.round((c / iterations) * 100),
              phaseName: `Block ${block} — Round ${c}/${iterations}`,
            } as Pbkdf2StepData,
          },
        });
      }
    } else {
      // High iteration count (e.g. 1000, 4096, 600000):
      // Emit early rounds (2, 3), milestone samples (25%, 50%, 75%), and final round (iterations).
      const milestones = new Set([
        2,
        3,
        Math.floor(iterations * 0.25),
        Math.floor(iterations * 0.5),
        Math.floor(iterations * 0.75),
        iterations,
      ]);

      for (let c = 2; c <= iterations; c++) {
        uPrev = hmacSha256(passwordBytes, uPrev);
        for (let j = 0; j < hLen; j++) {
          tAccumulator[j] ^= uPrev[j];
        }

        if (milestones.has(c)) {
          const pct = Math.round((c / iterations) * 100);
          steps.push({
            id: `pbkdf2-block-${block}-milestone-${c}`,
            title: `Block ${block}/${l} — Round ${c}/${iterations} (${pct}%)`,
            phase: `BLOCK ${block} ITERATION`,
            description: `Iterated HMAC round ${c}/${iterations} (${pct}% complete).\nU_${c}: 0x${bytesToHex(uPrev)}\nAccumulated T_${block}: 0x${bytesToHex(tAccumulator)}.`,
            visualizationType: 'binary-transform',
            data: {
              pbkdf2: {
                toolType: 'PBKDF2',
                password: passwordStr,
                salt: saltStr,
                iterations,
                currentIteration: c,
                blockIndex: block,
                totalBlocks: l,
                keyLength,
                uHex: bytesToHex(uPrev),
                accumulatorHex: bytesToHex(tAccumulator),
                progressPercent: pct,
                phaseName: `Block ${block} — Round ${c}/${iterations} (${pct}%)`,
                isSummary: true,
              } as Pbkdf2StepData,
            },
          });
        }
      }
    }

    // Copy block into derived key
    const offset = (block - 1) * hLen;
    const bytesToCopy = Math.min(hLen, keyLength - offset);
    derivedKey.set(tAccumulator.subarray(0, bytesToCopy), offset);
  }

  const finalKeyHex = bytesToHex(derivedKey);

  steps.push({
    id: 'pbkdf2-complete',
    title: 'PBKDF2 Key Derivation Complete',
    phase: 'COMPLETE',
    description: `Successfully derived ${keyLength}-byte (${keyLength * 8}-bit) cryptographic key across ${l} block(s) and ${iterations} iterations.\nDerived Key (DK): 0x${finalKeyHex}.`,
    visualizationType: 'binary-transform',
    data: {
      bytes: keyLength,
      hex: finalKeyHex,
      input: passwordStr,
      output: finalKeyHex,
      pbkdf2: {
        toolType: 'PBKDF2',
        password: passwordStr,
        salt: saltStr,
        iterations,
        currentIteration: iterations,
        blockIndex: l,
        totalBlocks: l,
        keyLength,
        derivedKeyHex: finalKeyHex,
        progressPercent: 100,
        phaseName: 'Derived Key Complete',
      } as Pbkdf2StepData,
    },
  });

  return { digest: finalKeyHex, steps };
}

export function computePbkdf2(input: string, options?: Record<string, unknown>): ComputationResult {
  let password = input || 'password';
  let salt = (options?.salt as string) || 'salt';
  let iterations = typeof options?.iterations === 'number' ? options.iterations : 4096;
  let keyLength = typeof options?.keyLength === 'number' ? options.keyLength : 32;

  if (input.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(input);
      if (parsed.password !== undefined) password = String(parsed.password);
      if (parsed.salt !== undefined) salt = String(parsed.salt);
      if (parsed.iterations !== undefined) iterations = Number(parsed.iterations);
      if (parsed.keyLength !== undefined) keyLength = Number(parsed.keyLength);
    } catch {}
  }

  return pbkdf2HmacSha256(password, salt, iterations, keyLength);
}

export const pbkdf2Plugin: AlgorithmPlugin = {
  info: {
    name: 'PBKDF2 (HMAC-SHA256)',
    family: 'Key Derivation Functions (KDF)',
    category: 'tools',
    digestSize: 256,
    blockSize: 512,
    description: 'RFC 8018 / RFC 2898 Password-Based Key Derivation Function 2 using HMAC-SHA256 PRF.',
    useCases: [
      'Password hashing and storage (OWASP recommended)',
      'Cryptographic master key generation from user passphrases',
      'WPA2 / WPA3 Wi-Fi 4-way handshake key derivation',
      'BIP-39 mnemonic seed generation (HMAC-SHA512)',
    ],
    security: 'secure',
    year: 2000,
    designers: ['Burt Kaliski (RSA Laboratories, RFC 2898 / RFC 8018)'],
  },
  compute(input: string, options?: Record<string, unknown>): ComputationResult {
    return computePbkdf2(input, options);
  },
};
