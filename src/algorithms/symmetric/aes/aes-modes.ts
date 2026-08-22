/**
 * AES Modes of Operation (NIST SP 800-38A & NIST SP 800-38D)
 * Implements ECB, CBC, CTR, and GCM with complete step-by-step telemetry.
 */

import {
  AesKeySize,
  expandKey,
  encryptBlockWithTelemetry,
  decryptBlockWithTelemetry,
  stateToMatrix,
} from './aes-core';
import { bytesToHex, hexToBytes, formatHexByte } from '../../utils';
import type { ComputationStep, ComputationResult } from '../../types';

export type AesMode = 'ECB' | 'CBC' | 'CTR' | 'GCM';
export type AesDirection = 'encrypt' | 'decrypt';

export interface AesModeOptions {
  keyHex?: string;
  ivHex?: string;
  aadHex?: string;
  tagHex?: string;
}

/** GHASH multiplication in GF(2^128) modulo x^128 + x^7 + x^2 + x + 1 (NIST SP 800-38D) */
export function ghashMultiply(x: Uint8Array, y: Uint8Array): Uint8Array {
  // Representation of R = 0xe1000000000000000000000000000000
  let v = new Uint8Array(y);
  let z = new Uint8Array(16);

  for (let i = 0; i < 128; i++) {
    const byteIdx = Math.floor(i / 8);
    const bitIdx = 7 - (i % 8);
    const bit = (x[byteIdx] >> bitIdx) & 1;

    if (bit === 1) {
      for (let j = 0; j < 16; j++) {
        z[j] ^= v[j];
      }
    }

    // Check if lowest bit of v is 1
    const lsb = v[15] & 1;

    // Right shift v by 1 bit
    for (let j = 15; j > 0; j--) {
      v[j] = (v[j] >> 1) | ((v[j - 1] & 1) << 7);
    }
    v[0] = v[0] >> 1;

    if (lsb === 1) {
      v[0] ^= 0xe1;
    }
  }

  return z;
}

/** GHASH function: Processes 16-byte blocks with hash subkey H */
export function ghash(h: Uint8Array, data: Uint8Array): Uint8Array {
  let y = new Uint8Array(16);
  const blockCount = Math.ceil(data.length / 16);

  for (let i = 0; i < blockCount; i++) {
    const block = new Uint8Array(16);
    const slice = data.subarray(i * 16, Math.min((i + 1) * 16, data.length));
    block.set(slice);

    for (let j = 0; j < 16; j++) {
      y[j] ^= block[j];
    }
    y = ghashMultiply(y, h);
  }

  return y;
}

/** Increment 32-bit big-endian counter in the last 4 bytes of a 16-byte block */
export function increment32(block: Uint8Array): Uint8Array {
  const out = new Uint8Array(block);
  for (let i = 15; i >= 12; i--) {
    out[i] = (out[i] + 1) & 0xff;
    if (out[i] !== 0) break;
  }
  return out;
}

/** Execute AES in specified Mode and Direction with full step telemetry */
export function executeAes(
  input: string,
  keySize: AesKeySize,
  mode: AesMode,
  direction: AesDirection,
  options?: AesModeOptions,
): ComputationResult {
  const steps: ComputationStep[] = [];

  // 1. Parse Key
  const defaultKeys: Record<AesKeySize, string> = {
    128: '2b7e151628aed2a6abf7158809cf4f3c',
    192: '8e73b0f7da0e6452c810f32b809079e562f8ead2522c6b7b',
    256: '603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4',
  };
  const keyHex = (options?.keyHex || defaultKeys[keySize]).replace(/\s+/g, '');
  const keyBytes = hexToBytes(keyHex.padEnd((keySize / 8) * 2, '0').slice(0, (keySize / 8) * 2));

  // 2. Parse IV
  const defaultIv = '000102030405060708090a0b0c0d0e0f';
  const ivHex = (options?.ivHex || defaultIv).replace(/\s+/g, '');
  const ivBytes = hexToBytes(ivHex);

  // 3. Parse Input Bytes (Handle Hex or ASCII)
  let inputBytes: Uint8Array;
  const isHexInput = /^[0-9a-fA-F\s]+$/.test(input.trim()) && input.trim().length % 2 === 0 && input.trim().length > 0;
  if (isHexInput && (direction === 'decrypt' || input.length >= 32)) {
    inputBytes = hexToBytes(input.replace(/\s+/g, ''));
  } else {
    // UTF-8 string input
    inputBytes = new TextEncoder().encode(input);
  }

  // Ensure minimum 16 bytes for block modes (ECB, CBC) if input is empty
  if (inputBytes.length === 0 && (mode === 'ECB' || mode === 'CBC')) {
    inputBytes = new Uint8Array(16);
  }

  // 4. Expand Key Schedule
  const roundKeys = expandKey(keyBytes, keySize);
  const Nr = roundKeys.length - 1;

  steps.push({
    id: 'aes-key-expansion-summary',
    title: `Key Schedule Expansion (${keySize}-bit Key)`,
    phase: 'Key Expansion',
    description: `Expanded ${keyBytes.length}-byte Cipher Key into ${Nr + 1} Round Keys ($W[0..${4 * Nr + 3}]$) via RotWord, SubWord, and Rcon.`,
    data: {
      keyHex: bytesToHex(keyBytes),
      keySize,
      roundKeys: roundKeys.map((rk, idx) => ({
        round: idx,
        hex: bytesToHex(rk),
        matrix: stateToMatrix(rk),
      })),
      totalRounds: Nr,
    },
    visualizationType: 'round-computation',
  });

  // 5. Execute Mode
  if (mode === 'ECB') {
    return executeEcb(inputBytes, roundKeys, direction, steps);
  } else if (mode === 'CBC') {
    return executeCbc(inputBytes, roundKeys, ivBytes, direction, steps);
  } else if (mode === 'CTR') {
    return executeCtr(inputBytes, roundKeys, ivBytes, direction, steps);
  } else {
    // GCM Mode
    const aadHex = (options?.aadHex || '').replace(/\s+/g, '');
    const aadBytes = hexToBytes(aadHex);
    const tagHex = options?.tagHex || '';
    return executeGcm(inputBytes, roundKeys, ivBytes, aadBytes, direction, tagHex, steps);
  }
}

/** Execute ECB Mode */
function executeEcb(
  inputBytes: Uint8Array,
  roundKeys: Uint8Array[],
  direction: AesDirection,
  steps: ComputationStep[],
): ComputationResult {
  // Pad to 16-byte boundary for ECB
  const paddedLen = Math.max(16, Math.ceil(inputBytes.length / 16) * 16);
  const data = new Uint8Array(paddedLen);
  data.set(inputBytes);

  const blockCount = paddedLen / 16;
  const outBytes = new Uint8Array(paddedLen);

  for (let b = 0; b < blockCount; b++) {
    const block = data.subarray(b * 16, (b + 1) * 16);
    if (direction === 'encrypt') {
      const res = encryptBlockWithTelemetry(block, roundKeys, b, blockCount);
      outBytes.set(res.ciphertext, b * 16);
      steps.push(...res.steps);
    } else {
      const res = decryptBlockWithTelemetry(block, roundKeys, b, blockCount);
      outBytes.set(res.plaintext, b * 16);
      steps.push(...res.steps);
    }
  }

  const outputHex = bytesToHex(outBytes);
  return { digest: outputHex, steps };
}

/** Execute CBC Mode */
function executeCbc(
  inputBytes: Uint8Array,
  roundKeys: Uint8Array[],
  ivBytes: Uint8Array,
  direction: AesDirection,
  steps: ComputationStep[],
): ComputationResult {
  const iv = new Uint8Array(16);
  iv.set(ivBytes.subarray(0, 16));

  const paddedLen = Math.max(16, Math.ceil(inputBytes.length / 16) * 16);
  const data = new Uint8Array(paddedLen);
  data.set(inputBytes);

  const blockCount = paddedLen / 16;
  const outBytes = new Uint8Array(paddedLen);

  if (direction === 'encrypt') {
    let prevCipherBlock = iv;

    for (let b = 0; b < blockCount; b++) {
      const plainBlock = data.subarray(b * 16, (b + 1) * 16);
      const xorBlock = new Uint8Array(16);
      for (let i = 0; i < 16; i++) {
        xorBlock[i] = plainBlock[i] ^ prevCipherBlock[i];
      }

      steps.push({
        id: `aes-cbc-xor-block-${b}`,
        title: `[Block ${b + 1}/${blockCount}] CBC Input XOR with ${b === 0 ? 'IV' : 'Previous Ciphertext'}`,
        phase: 'CBC Chaining',
        description: `Plaintext Block ${b + 1} XORed with ${b === 0 ? 'Initialization Vector (IV)' : `Ciphertext Block ${b}`}.`,
        data: {
          blockIndex: b,
          totalBlocks: blockCount,
          plainMatrix: stateToMatrix(plainBlock),
          chainMatrix: stateToMatrix(prevCipherBlock),
          stateMatrix: stateToMatrix(xorBlock),
        },
        visualizationType: 'aes-state-matrix',
      });

      const res = encryptBlockWithTelemetry(xorBlock, roundKeys, b, blockCount);
      outBytes.set(res.ciphertext, b * 16);
      prevCipherBlock = res.ciphertext;
      steps.push(...res.steps);
    }
  } else {
    // Decrypt
    let prevCipherBlock = iv;

    for (let b = 0; b < blockCount; b++) {
      const cipherBlock = data.subarray(b * 16, (b + 1) * 16);
      const res = decryptBlockWithTelemetry(cipherBlock, roundKeys, b, blockCount);
      steps.push(...res.steps);

      const plainBlock = new Uint8Array(16);
      for (let i = 0; i < 16; i++) {
        plainBlock[i] = res.plaintext[i] ^ prevCipherBlock[i];
      }
      outBytes.set(plainBlock, b * 16);

      steps.push({
        id: `aes-cbc-dec-xor-block-${b}`,
        title: `[Block ${b + 1}/${blockCount}] CBC Output XOR with ${b === 0 ? 'IV' : 'Previous Ciphertext'}`,
        phase: 'CBC Unchaining',
        description: `Decrypted state block XORed with ${b === 0 ? 'IV' : `Ciphertext Block ${b}`} to recover Plaintext Block ${b + 1}.`,
        data: {
          blockIndex: b,
          totalBlocks: blockCount,
          decryptedMatrix: stateToMatrix(res.plaintext),
          chainMatrix: stateToMatrix(prevCipherBlock),
          stateMatrix: stateToMatrix(plainBlock),
        },
        visualizationType: 'aes-state-matrix',
      });

      prevCipherBlock = cipherBlock;
    }
  }

  const outputHex = bytesToHex(outBytes);
  return { digest: outputHex, steps };
}

/** Execute CTR Mode */
function executeCtr(
  inputBytes: Uint8Array,
  roundKeys: Uint8Array[],
  ivBytes: Uint8Array,
  direction: AesDirection,
  steps: ComputationStep[],
): ComputationResult {
  const initialCounter = new Uint8Array(16);
  initialCounter.set(ivBytes.subarray(0, 16));

  const blockCount = Math.max(1, Math.ceil(inputBytes.length / 16));
  const outBytes = new Uint8Array(inputBytes.length);

  let currentCounter = new Uint8Array(initialCounter);

  for (let b = 0; b < blockCount; b++) {
    const chunkLen = Math.min(16, inputBytes.length - b * 16);
    const inChunk = inputBytes.subarray(b * 16, b * 16 + chunkLen);

    // Encrypt Counter block to generate keystream block
    steps.push({
      id: `aes-ctr-counter-${b}`,
      title: `[Block ${b + 1}/${blockCount}] CTR Counter Block #${b + 1}`,
      phase: 'Counter Setup',
      description: `Counter value loaded for Block ${b + 1}: ${bytesToHex(currentCounter)}.`,
      data: {
        blockIndex: b,
        totalBlocks: blockCount,
        stateMatrix: stateToMatrix(currentCounter),
      },
      visualizationType: 'aes-state-matrix',
    });

    const res = encryptBlockWithTelemetry(currentCounter, roundKeys, b, blockCount);
    steps.push(...res.steps);

    // Keystream XOR with input
    const outChunk = new Uint8Array(chunkLen);
    for (let i = 0; i < chunkLen; i++) {
      outChunk[i] = inChunk[i] ^ res.ciphertext[i];
    }
    outBytes.set(outChunk, b * 16);

    steps.push({
      id: `aes-ctr-xor-${b}`,
      title: `[Block ${b + 1}/${blockCount}] CTR Keystream XOR (${direction === 'encrypt' ? 'Plaintext → Ciphertext' : 'Ciphertext → Plaintext'})`,
      phase: 'Keystream XOR',
      description: `${direction === 'encrypt' ? 'Plaintext' : 'Ciphertext'} chunk XORed with AES Keystream block.`,
      data: {
        blockIndex: b,
        totalBlocks: blockCount,
        inputHex: bytesToHex(inChunk),
        keystreamHex: bytesToHex(res.ciphertext.subarray(0, chunkLen)),
        outputHex: bytesToHex(outChunk),
      },
      visualizationType: 'round-computation',
    });

    currentCounter = increment32(currentCounter);
  }

  const outputHex = bytesToHex(outBytes);
  return { digest: outputHex, steps };
}

/** Execute GCM Mode (NIST SP 800-38D) */
function executeGcm(
  inputBytes: Uint8Array,
  roundKeys: Uint8Array[],
  ivBytes: Uint8Array,
  aadBytes: Uint8Array,
  direction: AesDirection,
  expectedTagHex: string,
  steps: ComputationStep[],
): ComputationResult {
  // 1. Derive Hash Subkey H = AES_K(0^128)
  const zeroBlock = new Uint8Array(16);
  const hRes = encryptBlockWithTelemetry(zeroBlock, roundKeys, 0, 1);
  const h = hRes.ciphertext;

  steps.push({
    id: 'aes-gcm-subkey-h',
    title: 'GCM Hash Subkey H Derivation',
    phase: 'GCM Setup',
    description: `Hash Subkey $H = \\text{AES}_K(0^{128}) = ${bytesToHex(h)}$ for GHASH polynomial multiplication over $GF(2^{128})$.`,
    data: {
      stateMatrix: stateToMatrix(h),
    },
    visualizationType: 'aes-state-matrix',
  });

  // 2. Derive J0 (Initial Counter Block)
  let j0 = new Uint8Array(16);
  if (ivBytes.length === 12) {
    j0.set(ivBytes);
    j0[15] = 1; // J0 = IV || 0^31 || 1
  } else {
    // For non-96-bit IVs, J0 = GHASH_H(IV || 0^(s+64) || len(IV)_64)
    const ivPaddedLen = Math.ceil(ivBytes.length / 16) * 16;
    const ghashInput = new Uint8Array(ivPaddedLen + 16);
    ghashInput.set(ivBytes);
    const ivBits = BigInt(ivBytes.length * 8);
    for (let i = 0; i < 8; i++) {
      ghashInput[ghashInput.length - 1 - i] = Number((ivBits >> BigInt(i * 8)) & 0xffn);
    }
    j0 = ghash(h, ghashInput);
  }

  steps.push({
    id: 'aes-gcm-j0-setup',
    title: 'GCM Pre-Counter J₀ Derivation',
    phase: 'GCM Setup',
    description: `Pre-Counter Block $J_0 = ${bytesToHex(j0)}$ derived from ${ivBytes.length}-byte IV.`,
    data: {
      stateMatrix: stateToMatrix(j0),
    },
    visualizationType: 'aes-state-matrix',
  });

  // 3. Encrypt J0 to get the Tag Mask: AES_K(J0)
  const j0Res = encryptBlockWithTelemetry(j0, roundKeys, 0, 1);
  const tagMask = j0Res.ciphertext;

  // 4. CTR Mode Processing for Plaintext / Ciphertext
  let currentCounter = increment32(j0);
  const blockCount = Math.ceil(inputBytes.length / 16);
  const outBytes = new Uint8Array(inputBytes.length);

  for (let b = 0; b < blockCount; b++) {
    const chunkLen = Math.min(16, inputBytes.length - b * 16);
    const inChunk = inputBytes.subarray(b * 16, b * 16 + chunkLen);

    const res = encryptBlockWithTelemetry(currentCounter, roundKeys, b, blockCount);
    steps.push(...res.steps);

    for (let i = 0; i < chunkLen; i++) {
      outBytes[b * 16 + i] = inChunk[i] ^ res.ciphertext[i];
    }
    currentCounter = increment32(currentCounter);
  }

  // 5. Compute GHASH over AAD and Ciphertext
  const ciphertextBytes = direction === 'encrypt' ? outBytes : inputBytes;

  const aadPaddedLen = Math.ceil(aadBytes.length / 16) * 16;
  const cPaddedLen = Math.ceil(ciphertextBytes.length / 16) * 16;
  const ghashBuffer = new Uint8Array(aadPaddedLen + cPaddedLen + 16);

  ghashBuffer.set(aadBytes, 0);
  ghashBuffer.set(ciphertextBytes, aadPaddedLen);

  // Append 64-bit length of AAD and 64-bit length of Ciphertext (in bits)
  const aadBits = BigInt(aadBytes.length * 8);
  const cBits = BigInt(ciphertextBytes.length * 8);

  for (let i = 0; i < 8; i++) {
    ghashBuffer[aadPaddedLen + cPaddedLen + 7 - i] = Number((aadBits >> BigInt(i * 8)) & 0xffn);
    ghashBuffer[aadPaddedLen + cPaddedLen + 15 - i] = Number((cBits >> BigInt(i * 8)) & 0xffn);
  }

  const s = ghash(h, ghashBuffer);

  // 6. Compute Auth Tag T = S ⊕ AES_K(J0)
  const tag = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    tag[i] = s[i] ^ tagMask[i];
  }
  const tagHex = bytesToHex(tag);

  let tagValid: boolean | undefined = undefined;
  if (direction === 'decrypt' && expectedTagHex) {
    tagValid = expectedTagHex.toLowerCase() === tagHex.toLowerCase();
  }

  steps.push({
    id: 'aes-gcm-tag-computation',
    title: 'GCM Authentication Tag Generation',
    phase: 'Authentication Tag',
    description: `Authentication Tag $T = \\text{GHASH}_H(AAD \\parallel C \\parallel \\text{lengths}) \\oplus \\text{AES}_K(J_0) = ${tagHex}$.${
      tagValid !== undefined ? ` Tag Verification: ${tagValid ? 'MATCH (AUTHENTIC)' : 'MISMATCH (FORGERY DETECTED)'}` : ''
    }`,
    data: {
      aadHex: bytesToHex(aadBytes),
      ciphertextHex: bytesToHex(ciphertextBytes),
      ghashHex: bytesToHex(s),
      tagMaskHex: bytesToHex(tagMask),
      tagHex,
      tagValid,
    },
    visualizationType: 'round-computation',
  });

  const outputHex = bytesToHex(outBytes);
  return { digest: outputHex, tagHex, tagValid, steps };
}
