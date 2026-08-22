/**
 * DES Core Feistel Engine (NIST FIPS 46-3)
 * Implements Key Schedule, Initial/Final Permutations, and 16-round Feistel Network with step telemetry.
 */

import {
  IP,
  IP_INV,
  E_TABLE,
  P_TABLE,
  PC1,
  PC2,
  ROUND_SHIFTS,
  S_BOXES,
} from './constants';
import { uint32ToHex, uint64ToHex, formatHexByte, byteToBinary } from '../../utils';
import type { ComputationStep } from '../../types';

export interface DesRoundTelemetry {
  roundIndex: number;            // 1..16
  totalRounds: number;           // 16
  phase: string;
  prevLHex: string;              // 32-bit hex
  prevRHex: string;              // 32-bit hex
  newLHex: string;               // 32-bit hex
  newRHex: string;               // 32-bit hex
  subkeyHex: string;             // 48-bit hex (12 chars)
  eExpansionHex: string;         // 48-bit hex
  sboxInHex: string;             // 48-bit hex (E ⊕ K)
  sboxOutputs: number[];         // 8 4-bit nibbles
  fOutputHex: string;            // 32-bit hex (after P-permutation)
  blockIndex?: number;
  totalBlocks?: number;
}

/** Permute bits of a BigInt based on a permutation table */
export function permuteBits(src: bigint, srcLen: number, table: number[]): bigint {
  let out = 0n;
  for (let i = 0; i < table.length; i++) {
    const bitPos = BigInt(srcLen - 1 - table[i]);
    const bit = (src >> bitPos) & 1n;
    out = (out << 1n) | bit;
  }
  return out;
}

/** Convert 8-byte Uint8Array to 64-bit BigInt */
export function bytesToBigInt64(bytes: Uint8Array): bigint {
  let val = 0n;
  for (let i = 0; i < 8; i++) {
    val = (val << 8n) | BigInt(bytes[i] & 0xff);
  }
  return val;
}

/** Convert 64-bit BigInt to 8-byte Uint8Array */
export function bigInt64ToBytes(val: bigint): Uint8Array {
  const bytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    bytes[i] = Number((val >> BigInt((7 - i) * 8)) & 0xffn);
  }
  return bytes;
}

/** Generate 16 48-bit subkeys from 64-bit key (56 effective bits) */
export function generateDesSubkeys(keyBytes: Uint8Array): bigint[] {
  const key64 = bytesToBigInt64(keyBytes);
  // PC-1: 64 -> 56 bits
  const key56 = permuteBits(key64, 64, PC1);

  let c = Number((key56 >> 28n) & 0x0fffffffn); // Left 28 bits
  let d = Number(key56 & 0x0fffffffn);         // Right 28 bits

  const subkeys: bigint[] = [];

  for (let r = 0; r < 16; r++) {
    const shift = ROUND_SHIFTS[r];
    // Circular left shift of 28-bit halves
    c = ((c << shift) | (c >>> (28 - shift))) & 0x0fffffff;
    d = ((d << shift) | (d >>> (28 - shift))) & 0x0fffffff;

    const cd56 = (BigInt(c) << 28n) | BigInt(d);
    // PC-2: 56 -> 48 bits
    const k48 = permuteBits(cd56, 56, PC2);
    subkeys.push(k48);
  }

  return subkeys;
}

/** Feistel F-Function: F(R, K_i) */
export function feistelFunction(
  r32: number,
  k48: bigint,
): {
  fOut: number;
  e48: bigint;
  sboxIn48: bigint;
  sboxOutputs: number[];
} {
  // 1. E-Expansion: 32 -> 48 bits
  const e48 = permuteBits(BigInt(r32 >>> 0), 32, E_TABLE);

  // 2. XOR with Subkey K_i
  const sboxIn48 = e48 ^ k48;

  // 3. S-Box substitutions (8 boxes, each taking 6 bits -> 4 bits)
  let sboxCombined = 0;
  const sboxOutputs: number[] = [];

  for (let i = 0; i < 8; i++) {
    // Extract 6 bits for S-box i (from MSB to LSB)
    const shift = BigInt((7 - i) * 6);
    const sixBits = Number((sboxIn48 >> shift) & 0x3fn);

    // Outer bits (1 and 6) define the row (0..3)
    const row = ((sixBits & 0x20) >> 4) | (sixBits & 0x01);
    // Inner bits (2, 3, 4, 5) define the column (0..15)
    const col = (sixBits >> 1) & 0x0f;

    const sVal = S_BOXES[i][row * 16 + col];
    sboxOutputs.push(sVal);
    sboxCombined = (sboxCombined << 4) | sVal;
  }

  // 4. P-Permutation: 32 -> 32 bits
  const fOut = Number(permuteBits(BigInt(sboxCombined >>> 0), 32, P_TABLE));

  return { fOut, e48, sboxIn48, sboxOutputs };
}

/** Encrypt a single 8-byte block using 16-round Feistel Network */
export function encryptDesBlockWithTelemetry(
  blockBytes: Uint8Array,
  subkeys: bigint[],
  blockIndex = 0,
  totalBlocks = 1,
): { ciphertext: Uint8Array; steps: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  const blockPrefix = totalBlocks > 1 ? `[Block ${blockIndex + 1}/${totalBlocks}] ` : '';

  const block64 = bytesToBigInt64(blockBytes);

  // Initial Permutation (IP)
  const ip64 = permuteBits(block64, 64, IP);
  let l = Number((ip64 >> 32n) & 0xffffffffn);
  let r = Number(ip64 & 0xffffffffn);

  steps.push({
    id: `des-enc-block-${blockIndex}-ip`,
    title: `${blockPrefix}Initial Permutation (IP)`,
    phase: totalBlocks > 1 ? `Block ${blockIndex + 1}: IP` : 'Initial Permutation',
    description: `64-bit input block loaded and permuted according to standard DES IP table. Split into L₀ (${uint32ToHex(l)}) and R₀ (${uint32ToHex(r)}).`,
    data: {
      roundIndex: 0,
      totalRounds: 16,
      prevLHex: uint32ToHex(l),
      prevRHex: uint32ToHex(r),
      newLHex: uint32ToHex(l),
      newRHex: uint32ToHex(r),
      blockIndex,
      totalBlocks,
    },
    visualizationType: 'feistel-ladder',
  });

  // 16 Feistel Rounds
  for (let round = 1; round <= 16; round++) {
    const k48 = subkeys[round - 1];
    const prevL = l;
    const prevR = r;

    const { fOut, e48, sboxIn48, sboxOutputs } = feistelFunction(prevR, k48);

    const nextL = prevR;
    const nextR = (prevL ^ fOut) >>> 0;

    steps.push({
      id: `des-enc-block-${blockIndex}-round-${round}`,
      title: `${blockPrefix}Feistel Round ${round}/16`,
      phase: totalBlocks > 1 ? `Block ${blockIndex + 1}: Round ${round}` : `Round ${round}/16`,
      description: `Round ${round}: L_${round} = R_${round - 1}, R_${round} = L_${round - 1} ⊕ F(R_${round - 1}, K_${round}).`,
      data: {
        roundIndex: round,
        totalRounds: 16,
        prevLHex: uint32ToHex(prevL),
        prevRHex: uint32ToHex(prevR),
        newLHex: uint32ToHex(nextL),
        newRHex: uint32ToHex(nextR),
        subkeyHex: (k48 & 0xffffffffffffn).toString(16).padStart(12, '0'),
        eExpansionHex: (e48 & 0xffffffffffffn).toString(16).padStart(12, '0'),
        sboxInHex: (sboxIn48 & 0xffffffffffffn).toString(16).padStart(12, '0'),
        sboxOutputs,
        fOutputHex: uint32ToHex(fOut),
        blockIndex,
        totalBlocks,
      },
      visualizationType: 'feistel-ladder',
    });

    l = nextL;
    r = nextR;
  }

  // Pre-output 32-bit swap (R16 || L16) + Final Permutation (IP_INV)
  const preOut64 = (BigInt(r) << 32n) | BigInt(l);
  const cipher64 = permuteBits(preOut64, 64, IP_INV);
  const cipherBytes = bigInt64ToBytes(cipher64);

  steps.push({
    id: `des-enc-block-${blockIndex}-fp`,
    title: `${blockPrefix}Final Permutation (IP⁻¹ / FP)`,
    phase: totalBlocks > 1 ? `Block ${blockIndex + 1}: FP` : 'Final Permutation',
    description: `Final 32-bit swap (R₁₆ ∥ L₁₆) permuted through IP⁻¹ to produce 64-bit ciphertext block.`,
    data: {
      roundIndex: 16,
      totalRounds: 16,
      prevLHex: uint32ToHex(l),
      prevRHex: uint32ToHex(r),
      outputHex: (cipher64 & 0xffffffffffffffffn).toString(16).padStart(16, '0'),
      blockIndex,
      totalBlocks,
    },
    visualizationType: 'feistel-ladder',
  });

  return { ciphertext: cipherBytes, steps };
}

/** Decrypt a single 8-byte block using 16-round Feistel Network (reversed subkeys) */
export function decryptDesBlockWithTelemetry(
  cipherBlockBytes: Uint8Array,
  subkeys: bigint[],
  blockIndex = 0,
  totalBlocks = 1,
): { plaintext: Uint8Array; steps: ComputationStep[] } {
  const reversedSubkeys = [...subkeys].reverse();
  const res = encryptDesBlockWithTelemetry(cipherBlockBytes, reversedSubkeys, blockIndex, totalBlocks);
  return { plaintext: res.ciphertext, steps: res.steps };
}
