/**
 * ChaCha20-Poly1305 AEAD Construction (IETF RFC 8439 Section 2.8)
 */

import { initChaChaState, chacha20BlockWithTelemetry } from './chacha20-core';
import { poly1305Mac } from './poly1305';
import { bytesToHex, hexToBytes } from '../../utils';
import type { ComputationStep, ComputationResult } from '../../types';

export type ChaChaDirection = 'encrypt' | 'decrypt';

export interface ChaChaOptions {
  keyHex?: string;
  ivHex?: string; // 12-byte Nonce (or 96-bit)
  aadHex?: string;
  tagHex?: string;
}

/** Execute ChaCha20-Poly1305 AEAD */
export function executeChaCha20Poly1305(
  input: string,
  direction: ChaChaDirection,
  options?: ChaChaOptions,
): ComputationResult {
  const steps: ComputationStep[] = [];

  // Default RFC 8439 Section 2.8.2 Test Vector Key (256-bit)
  const defaultKey = '808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f';
  const keyHex = (options?.keyHex || defaultKey).replace(/\s+/g, '');
  const keyBytes = hexToBytes(keyHex.padEnd(64, '0').slice(0, 64));

  // Default Nonce (96-bit / 12 bytes)
  const defaultNonce = '070000004041424344454647';
  const nonceHex = (options?.ivHex || defaultNonce).replace(/\s+/g, '');
  const nonceBytes = hexToBytes(nonceHex.padEnd(24, '0').slice(0, 24));

  const aadHex = (options?.aadHex || '50515253c0c1c2c3c4c5c6c7').replace(/\s+/g, '');
  const aadBytes = hexToBytes(aadHex);

  // Parse input
  let inputBytes: Uint8Array;
  const isHex = /^[0-9a-fA-F\s]+$/.test(input.trim()) && input.trim().length % 2 === 0 && input.trim().length > 0;
  if (isHex && (direction === 'decrypt' || input.length >= 32)) {
    inputBytes = hexToBytes(input.replace(/\s+/g, ''));
  } else {
    inputBytes = new TextEncoder().encode(input);
  }

  // 1. Generate Poly1305 One-Time Key from Block 0 (Counter = 0)
  const block0State = initChaChaState(keyBytes, 0, nonceBytes);
  const block0Res = chacha20BlockWithTelemetry(block0State, 0, 1);
  const polyKey = block0Res.keystreamBytes.subarray(0, 32);

  steps.push({
    id: 'chacha20-poly-key-gen',
    title: 'Poly1305 One-Time Key Derivation (Block 0)',
    phase: 'Key Setup',
    description: `Generated 256-bit Poly1305 key $K = (r, s)$ from ChaCha20 Block 0 keystream: ${bytesToHex(polyKey)}.`,
    data: {
      keyHex: bytesToHex(polyKey),
      rHex: bytesToHex(polyKey.subarray(0, 16)),
      sHex: bytesToHex(polyKey.subarray(16, 32)),
    },
    visualizationType: 'round-computation',
  });

  // 2. Encrypt/Decrypt payload using ChaCha20 keystream starting at Block Counter = 1
  const blockCount = Math.ceil(inputBytes.length / 64);
  const outBytes = new Uint8Array(inputBytes.length);

  for (let b = 0; b < (inputBytes.length === 0 ? 0 : blockCount); b++) {
    const chunkLen = Math.min(64, inputBytes.length - b * 64);
    const inChunk = inputBytes.subarray(b * 64, b * 64 + chunkLen);

    const counter = b + 1;
    const blockState = initChaChaState(keyBytes, counter, nonceBytes);
    const res = chacha20BlockWithTelemetry(blockState, b, Math.max(1, blockCount));
    steps.push(...res.steps);

    for (let i = 0; i < chunkLen; i++) {
      outBytes[b * 64 + i] = inChunk[i] ^ res.keystreamBytes[i];
    }
  }

  // 3. Poly1305 MAC Calculation
  const ciphertextBytes = direction === 'encrypt' ? outBytes : inputBytes;

  const aadPadLen = (16 - (aadBytes.length % 16)) % 16;
  const cPadLen = (16 - (ciphertextBytes.length % 16)) % 16;

  const macBuffer = new Uint8Array(aadBytes.length + aadPadLen + ciphertextBytes.length + cPadLen + 16);
  let offset = 0;

  macBuffer.set(aadBytes, offset);
  offset += aadBytes.length + aadPadLen;

  macBuffer.set(ciphertextBytes, offset);
  offset += ciphertextBytes.length + cPadLen;

  // Append 64-bit lengths (in bytes, little-endian)
  const aadLen64 = BigInt(aadBytes.length);
  const cLen64 = BigInt(ciphertextBytes.length);

  for (let i = 0; i < 8; i++) {
    macBuffer[offset + i] = Number((aadLen64 >> BigInt(i * 8)) & 0xffn);
    macBuffer[offset + 8 + i] = Number((cLen64 >> BigInt(i * 8)) & 0xffn);
  }

  const { tagHex } = poly1305Mac(polyKey, macBuffer);

  let tagValid: boolean | undefined = undefined;
  if (direction === 'decrypt' && options?.tagHex) {
    tagValid = options.tagHex.toLowerCase() === tagHex.toLowerCase();
  }

  steps.push({
    id: 'chacha20-poly-tag-computation',
    title: 'Poly1305 Authentication Tag Computation',
    phase: 'Authentication Tag',
    description: `Evaluated polynomial modulo $2^{130}-5$ over $AAD \\parallel \\text{pad} \\parallel C \\parallel \\text{pad} \\parallel \\text{lengths}$. Auth Tag: ${tagHex}.${
      tagValid !== undefined ? ` Tag Verification: ${tagValid ? 'MATCH (AUTHENTIC)' : 'MISMATCH (FORGERY DETECTED)'}` : ''
    }`,
    data: {
      aadHex: bytesToHex(aadBytes),
      ciphertextHex: bytesToHex(ciphertextBytes),
      tagHex,
      tagValid,
    },
    visualizationType: 'round-computation',
  });

  return { digest: bytesToHex(outBytes), tagHex, tagValid, steps };
}

/** Execute Standalone ChaCha20 Stream Cipher */
export function executeChaCha20(
  input: string,
  direction: ChaChaDirection,
  options?: ChaChaOptions,
): ComputationResult {
  const steps: ComputationStep[] = [];

  const defaultKey = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
  const keyHex = (options?.keyHex || defaultKey).replace(/\s+/g, '');
  const keyBytes = hexToBytes(keyHex.padEnd(64, '0').slice(0, 64));

  const defaultNonce = '000000000000004a00000000';
  const nonceHex = (options?.ivHex || defaultNonce).replace(/\s+/g, '');
  const nonceBytes = hexToBytes(nonceHex.padEnd(24, '0').slice(0, 24));

  let inputBytes: Uint8Array;
  const isHex = /^[0-9a-fA-F\s]+$/.test(input.trim()) && input.trim().length % 2 === 0 && input.trim().length > 0;
  if (isHex && (direction === 'decrypt' || input.length >= 32)) {
    inputBytes = hexToBytes(input.replace(/\s+/g, ''));
  } else {
    inputBytes = new TextEncoder().encode(input);
  }

  const blockCount = Math.max(1, Math.ceil(inputBytes.length / 64));
  const outBytes = new Uint8Array(inputBytes.length);

  for (let b = 0; b < blockCount; b++) {
    const chunkLen = Math.min(64, inputBytes.length - b * 64);
    const inChunk = inputBytes.subarray(b * 64, b * 64 + chunkLen);

    const counter = b + 1;
    const blockState = initChaChaState(keyBytes, counter, nonceBytes);
    const res = chacha20BlockWithTelemetry(blockState, b, blockCount);
    steps.push(...res.steps);

    for (let i = 0; i < chunkLen; i++) {
      outBytes[b * 64 + i] = inChunk[i] ^ res.keystreamBytes[i];
    }
  }

  return { digest: bytesToHex(outBytes), steps };
}
