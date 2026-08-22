/**
 * DES & Triple-DES (3DES / TDEA) Modes of Operation (NIST FIPS 46-3, NIST SP 800-67)
 * Implements ECB and CBC modes with step telemetry.
 */

import {
  generateDesSubkeys,
  encryptDesBlockWithTelemetry,
  decryptDesBlockWithTelemetry,
} from './des-core';
import { bytesToHex, hexToBytes } from '../../utils';
import type { ComputationStep, ComputationResult } from '../../types';

export type DesMode = 'ECB' | 'CBC';
export type DesDirection = 'encrypt' | 'decrypt';

export interface DesOptions {
  keyHex?: string;
  ivHex?: string;
}

/** Execute Single DES */
export function executeDes(
  input: string,
  mode: DesMode,
  direction: DesDirection,
  options?: DesOptions,
): ComputationResult {
  const steps: ComputationStep[] = [];

  // Default 64-bit DES key (NIST FIPS 46-3 test vector)
  const defaultKey = '133457799bbcdff1';
  const keyHex = (options?.keyHex || defaultKey).replace(/\s+/g, '');
  const keyBytes = hexToBytes(keyHex.padEnd(16, '0').slice(0, 16));

  const defaultIv = '0123456789abcdef';
  const ivHex = (options?.ivHex || defaultIv).replace(/\s+/g, '');
  const ivBytes = hexToBytes(ivHex.padEnd(16, '0').slice(0, 16));

  // Parse input
  let inputBytes: Uint8Array;
  const isHex = /^[0-9a-fA-F\s]+$/.test(input.trim()) && input.trim().length % 2 === 0 && input.trim().length > 0;
  if (isHex && (direction === 'decrypt' || input.length >= 16)) {
    inputBytes = hexToBytes(input.replace(/\s+/g, ''));
  } else {
    inputBytes = new TextEncoder().encode(input);
  }

  if (inputBytes.length === 0) {
    inputBytes = new Uint8Array(8);
  }

  // Generate 16 subkeys
  const subkeys = generateDesSubkeys(keyBytes);

  steps.push({
    id: 'des-key-schedule-summary',
    title: 'DES Key Schedule Expansion (16 Subkeys)',
    phase: 'Key Expansion',
    description: `64-bit key ${bytesToHex(keyBytes)} permuted through PC-1 into $C_0, D_0$, shifted through 16 rounds, and transformed via PC-2 into 16 48-bit subkeys.`,
    data: {
      keyHex: bytesToHex(keyBytes),
      subkeys: subkeys.map((k, idx) => ({
        round: idx + 1,
        hex: (k & 0xffffffffffffn).toString(16).padStart(12, '0'),
      })),
    },
    visualizationType: 'round-computation',
  });

  const paddedLen = Math.max(8, Math.ceil(inputBytes.length / 8) * 8);
  const data = new Uint8Array(paddedLen);
  data.set(inputBytes);

  const blockCount = paddedLen / 8;
  const outBytes = new Uint8Array(paddedLen);

  if (mode === 'ECB') {
    for (let b = 0; b < blockCount; b++) {
      const block = data.subarray(b * 8, (b + 1) * 8);
      if (direction === 'encrypt') {
        const res = encryptDesBlockWithTelemetry(block, subkeys, b, blockCount);
        outBytes.set(res.ciphertext, b * 8);
        steps.push(...res.steps);
      } else {
        const res = decryptDesBlockWithTelemetry(block, subkeys, b, blockCount);
        outBytes.set(res.plaintext, b * 8);
        steps.push(...res.steps);
      }
    }
  } else {
    // CBC Mode
    let prevCipherBlock = ivBytes.subarray(0, 8);

    if (direction === 'encrypt') {
      for (let b = 0; b < blockCount; b++) {
        const plainBlock = data.subarray(b * 8, (b + 1) * 8);
        const xorBlock = new Uint8Array(8);
        for (let i = 0; i < 8; i++) {
          xorBlock[i] = plainBlock[i] ^ prevCipherBlock[i];
        }

        steps.push({
          id: `des-cbc-xor-block-${b}`,
          title: `[Block ${b + 1}/${blockCount}] CBC Input XOR with ${b === 0 ? 'IV' : 'Previous Ciphertext'}`,
          phase: blockCount > 1 ? `Block ${b + 1}: Chaining` : 'CBC Chaining',
          description: `Plaintext Block ${b + 1} XORed with ${b === 0 ? 'Initialization Vector (IV)' : `Ciphertext Block ${b}`}.`,
          data: {
            blockIndex: b,
            totalBlocks: blockCount,
            plainHex: bytesToHex(plainBlock),
            chainHex: bytesToHex(prevCipherBlock),
            xorHex: bytesToHex(xorBlock),
          },
          visualizationType: 'round-computation',
        });

        const res = encryptDesBlockWithTelemetry(xorBlock, subkeys, b, blockCount);
        outBytes.set(res.ciphertext, b * 8);
        prevCipherBlock = res.ciphertext;
        steps.push(...res.steps);
      }
    } else {
      // Decrypt
      for (let b = 0; b < blockCount; b++) {
        const cipherBlock = data.subarray(b * 8, (b + 1) * 8);
        const res = decryptDesBlockWithTelemetry(cipherBlock, subkeys, b, blockCount);
        steps.push(...res.steps);

        const plainBlock = new Uint8Array(8);
        for (let i = 0; i < 8; i++) {
          plainBlock[i] = res.plaintext[i] ^ prevCipherBlock[i];
        }
        outBytes.set(plainBlock, b * 8);

        steps.push({
          id: `des-cbc-dec-xor-block-${b}`,
          title: `[Block ${b + 1}/${blockCount}] CBC Output XOR with ${b === 0 ? 'IV' : 'Previous Ciphertext'}`,
          phase: blockCount > 1 ? `Block ${b + 1}: Unchaining` : 'CBC Unchaining',
          description: `Decrypted block XORed with ${b === 0 ? 'IV' : `Ciphertext Block ${b}`} to recover Plaintext Block ${b + 1}.`,
          data: {
            blockIndex: b,
            totalBlocks: blockCount,
            decryptedHex: bytesToHex(res.plaintext),
            chainHex: bytesToHex(prevCipherBlock),
            plainHex: bytesToHex(plainBlock),
          },
          visualizationType: 'round-computation',
        });

        prevCipherBlock = cipherBlock;
      }
    }
  }

  return { digest: bytesToHex(outBytes), steps };
}

/** Execute Triple DES (3DES / TDEA in EDE Configuration) */
export function execute3Des(
  input: string,
  mode: DesMode,
  direction: DesDirection,
  options?: DesOptions,
): ComputationResult {
  const steps: ComputationStep[] = [];

  // Default 192-bit 3DES key (3 x 64-bit keys: K1, K2, K3)
  const default3DesKey = '0123456789abcdef23456789abcdef01456789abcdef0123';
  const keyHex = (options?.keyHex || default3DesKey).replace(/\s+/g, '');
  const cleanKeyHex = keyHex.padEnd(48, '0').slice(0, 48);

  const k1Bytes = hexToBytes(cleanKeyHex.slice(0, 16));
  const k2Bytes = hexToBytes(cleanKeyHex.slice(16, 32));
  const k3Bytes = hexToBytes(cleanKeyHex.slice(32, 48));

  const subkeys1 = generateDesSubkeys(k1Bytes);
  const subkeys2 = generateDesSubkeys(k2Bytes);
  const subkeys3 = generateDesSubkeys(k3Bytes);

  const defaultIv = '1234567890abcdef';
  const ivHex = (options?.ivHex || defaultIv).replace(/\s+/g, '');
  const ivBytes = hexToBytes(ivHex.padEnd(16, '0').slice(0, 16));

  let inputBytes: Uint8Array;
  const isHex = /^[0-9a-fA-F\s]+$/.test(input.trim()) && input.trim().length % 2 === 0 && input.trim().length > 0;
  if (isHex && (direction === 'decrypt' || input.length >= 16)) {
    inputBytes = hexToBytes(input.replace(/\s+/g, ''));
  } else {
    inputBytes = new TextEncoder().encode(input);
  }

  if (inputBytes.length === 0) {
    inputBytes = new Uint8Array(8);
  }

  steps.push({
    id: '3des-key-expansion-summary',
    title: 'Triple-DES (3DES EDE) Key Schedule Expansion',
    phase: 'Key Expansion',
    description: `Expanded 3 Keys (K₁: ${bytesToHex(k1Bytes)}, K₂: ${bytesToHex(k2Bytes)}, K₃: ${bytesToHex(k3Bytes)}) into 3 sets of 16 subkeys for EDE pipeline.`,
    data: {
      k1Hex: bytesToHex(k1Bytes),
      k2Hex: bytesToHex(k2Bytes),
      k3Hex: bytesToHex(k3Bytes),
    },
    visualizationType: 'round-computation',
  });

  const paddedLen = Math.max(8, Math.ceil(inputBytes.length / 8) * 8);
  const data = new Uint8Array(paddedLen);
  data.set(inputBytes);

  const blockCount = paddedLen / 8;
  const outBytes = new Uint8Array(paddedLen);

  if (mode === 'ECB') {
    for (let b = 0; b < blockCount; b++) {
      const block = data.subarray(b * 8, (b + 1) * 8);

      if (direction === 'encrypt') {
        // Encrypt: E_K1 -> D_K2 -> E_K3
        const step1 = encryptDesBlockWithTelemetry(block, subkeys1, b, blockCount);
        steps.push(...step1.steps);

        const step2 = decryptDesBlockWithTelemetry(step1.ciphertext, subkeys2, b, blockCount);
        steps.push(...step2.steps);

        const step3 = encryptDesBlockWithTelemetry(step2.plaintext, subkeys3, b, blockCount);
        steps.push(...step3.steps);

        outBytes.set(step3.ciphertext, b * 8);
      } else {
        // Decrypt: D_K3 -> E_K2 -> D_K1
        const step1 = decryptDesBlockWithTelemetry(block, subkeys3, b, blockCount);
        steps.push(...step1.steps);

        const step2 = encryptDesBlockWithTelemetry(step1.plaintext, subkeys2, b, blockCount);
        steps.push(...step2.steps);

        const step3 = decryptDesBlockWithTelemetry(step2.ciphertext, subkeys1, b, blockCount);
        steps.push(...step3.steps);

        outBytes.set(step3.plaintext, b * 8);
      }
    }
  } else {
    // 3DES CBC Mode
    let prevCipherBlock = ivBytes.subarray(0, 8);

    if (direction === 'encrypt') {
      for (let b = 0; b < blockCount; b++) {
        const plainBlock = data.subarray(b * 8, (b + 1) * 8);
        const xorBlock = new Uint8Array(8);
        for (let i = 0; i < 8; i++) {
          xorBlock[i] = plainBlock[i] ^ prevCipherBlock[i];
        }

        steps.push({
          id: `3des-cbc-xor-block-${b}`,
          title: `[Block ${b + 1}/${blockCount}] 3DES CBC Input XOR with ${b === 0 ? 'IV' : 'Previous Ciphertext'}`,
          phase: blockCount > 1 ? `Block ${b + 1}: Chaining` : 'CBC Chaining',
          description: `Plaintext Block ${b + 1} XORed with ${b === 0 ? 'IV' : `Ciphertext Block ${b}`}.`,
          data: {
            blockIndex: b,
            totalBlocks: blockCount,
            plainHex: bytesToHex(plainBlock),
            chainHex: bytesToHex(prevCipherBlock),
            xorHex: bytesToHex(xorBlock),
          },
          visualizationType: 'round-computation',
        });

        // E_K1 -> D_K2 -> E_K3
        const step1 = encryptDesBlockWithTelemetry(xorBlock, subkeys1, b, blockCount);
        steps.push(...step1.steps);

        const step2 = decryptDesBlockWithTelemetry(step1.ciphertext, subkeys2, b, blockCount);
        steps.push(...step2.steps);

        const step3 = encryptDesBlockWithTelemetry(step2.plaintext, subkeys3, b, blockCount);
        steps.push(...step3.steps);

        outBytes.set(step3.ciphertext, b * 8);
        prevCipherBlock = step3.ciphertext;
      }
    } else {
      // 3DES CBC Decrypt
      for (let b = 0; b < blockCount; b++) {
        const cipherBlock = data.subarray(b * 8, (b + 1) * 8);

        // D_K3 -> E_K2 -> D_K1
        const step1 = decryptDesBlockWithTelemetry(cipherBlock, subkeys3, b, blockCount);
        steps.push(...step1.steps);

        const step2 = encryptDesBlockWithTelemetry(step1.plaintext, subkeys2, b, blockCount);
        steps.push(...step2.steps);

        const step3 = decryptDesBlockWithTelemetry(step2.ciphertext, subkeys1, b, blockCount);
        steps.push(...step3.steps);

        const plainBlock = new Uint8Array(8);
        for (let i = 0; i < 8; i++) {
          plainBlock[i] = step3.plaintext[i] ^ prevCipherBlock[i];
        }
        outBytes.set(plainBlock, b * 8);

        steps.push({
          id: `3des-cbc-dec-xor-block-${b}`,
          title: `[Block ${b + 1}/${blockCount}] 3DES CBC Output XOR with ${b === 0 ? 'IV' : 'Previous Ciphertext'}`,
          phase: blockCount > 1 ? `Block ${b + 1}: Unchaining` : 'CBC Unchaining',
          description: `Decrypted block XORed with ${b === 0 ? 'IV' : `Ciphertext Block ${b}`} to recover Plaintext Block ${b + 1}.`,
          data: {
            blockIndex: b,
            totalBlocks: blockCount,
            decryptedHex: bytesToHex(step3.plaintext),
            chainHex: bytesToHex(prevCipherBlock),
            plainHex: bytesToHex(plainBlock),
          },
          visualizationType: 'round-computation',
        });

        prevCipherBlock = cipherBlock;
      }
    }
  }

  return { digest: bytesToHex(outBytes), steps };
}
