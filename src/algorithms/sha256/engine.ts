/**
 * SHA-256 / SHA-224 Shared Computation Engine
 *
 * This engine implements the full SHA-256 algorithm with step-by-step
 * intermediate state capture for visualization. SHA-224 reuses this
 * engine with different initial hash values and truncated output.
 */

import type { ComputationStep } from '../types';
import {
  stringToBytes,
  bytesToHex,
  bytesToBinary,
  uint32ToHex,
  uint32ToBinary,
  add32,
  formatHexGroups,
  formatBinaryGroups,
} from '../utils';
import { K } from './constants';
import {
  sigma0,
  sigma1,
  bigSigma0,
  bigSigma1,
  ch,
  maj,
  sigma0Breakdown,
  sigma1Breakdown,
  bigSigma0Breakdown,
  bigSigma1Breakdown,
  chBreakdown,
  majBreakdown,
} from './operations';

export interface Sha256EngineConfig {
  /** Initial hash values H[0..7] */
  initialHash: readonly number[];
  /** Number of 32-bit words to include in the final digest (7 for SHA-224, 8 for SHA-256) */
  outputWords: number;
  /** Algorithm name for step descriptions */
  algorithmName: string;
}

/** Helper to format 32-bit word for display */
function formatWord(w: number) {
  return {
    value: w >>> 0,
    hex: uint32ToHex(w),
    binary: uint32ToBinary(w),
  };
}

/**
 * Run SHA-256/224 computation and return all intermediate steps.
 */
export function sha256Engine(
  input: string,
  config: Sha256EngineConfig,
): { digest: string; steps: ComputationStep[] } {
  const steps: ComputationStep[] = [];

  // Full constants table formatted for persistent 3-column view
  const fullConstants = K.map((kVal, idx) => ({
    index: idx,
    hex: uint32ToHex(kVal),
    binary: uint32ToBinary(kVal),
  }));

  // ─── Step 1: Input Encoding ──────────────────────────────────────────
  const inputBytes = stringToBytes(input);
  const inputBinary = bytesToBinary(inputBytes);

  steps.push({
    id: 'input-encoding',
    title: 'Input Encoding',
    phase: 'Pre-processing',
    description: `Convert the input string "${input || '(empty)'}" to its binary representation using UTF-8 encoding. Each character becomes 8 bits (one byte). Total: ${inputBytes.length} bytes (${inputBinary.length} bits).`,
    data: {
      input: input || '(empty string)',
      bytes: Array.from(inputBytes),
      binary: formatBinaryGroups(inputBinary),
      hex: bytesToHex(inputBytes),
      bitLength: inputBinary.length,
    },
    visualizationType: 'binary-transform',
  });

  // ─── Step 2: Padding ─────────────────────────────────────────────────
  const msgBitLen = inputBytes.length * 8;
  const msgBytes = inputBytes.length;
  let paddingZeroBytes = 64 - ((msgBytes + 1 + 8) % 64);
  if (paddingZeroBytes === 64) paddingZeroBytes = 0;
  const totalLen = msgBytes + 1 + paddingZeroBytes + 8;

  const paddedBytes = new Uint8Array(totalLen);
  paddedBytes.set(inputBytes);
  paddedBytes[msgBytes] = 0x80;

  const bitLenHi = Math.floor(msgBitLen / 0x100000000);
  const bitLenLo = msgBitLen >>> 0;
  const dv = new DataView(paddedBytes.buffer);
  dv.setUint32(totalLen - 8, bitLenHi, false);
  dv.setUint32(totalLen - 4, bitLenLo, false);

  const paddedBinary = bytesToBinary(paddedBytes);

  steps.push({
    id: 'padding',
    title: 'Message Padding',
    phase: 'Pre-processing',
    description: `Pad the message to a multiple of 512 bits (64 bytes). Append a '1' bit (0x80 byte), then ${paddingZeroBytes} zero bytes, then the original message length (${msgBitLen} bits) as a 64-bit big-endian integer. Total padded length: ${totalLen * 8} bits (${totalLen} bytes).`,
    data: {
      originalBits: msgBitLen,
      paddingByte: '10000000 (0x80)',
      zeroPaddingBytes: paddingZeroBytes,
      lengthField: uint32ToHex(bitLenHi) + uint32ToHex(bitLenLo),
      paddedBinary: formatBinaryGroups(paddedBinary),
      paddedHex: bytesToHex(paddedBytes),
      totalBits: totalLen * 8,
      totalBlocks: totalLen / 64,
    },
    visualizationType: 'binary-transform',
  });

  // ─── Step 3: Parse into 512-bit blocks ───────────────────────────────
  const numBlocks = totalLen / 64;
  const blocks: Uint32Array[] = [];

  for (let b = 0; b < numBlocks; b++) {
    const blockView = new DataView(paddedBytes.buffer, b * 64, 64);
    const words = new Uint32Array(16);
    for (let i = 0; i < 16; i++) {
      words[i] = blockView.getUint32(i * 4, false);
    }
    blocks.push(words);

    steps.push({
      id: `block-${b}`,
      title: `Message Block ${b + 1} of ${numBlocks}`,
      phase: 'Pre-processing',
      description: `Parse block ${b + 1} of ${numBlocks} (512 bits / 64 bytes). It is divided into 16 32-bit big-endian words (W[0]..W[15]).`,
      data: {
        blockIndex: b,
        words: Array.from(words).map((w, i) => ({
          index: i,
          hex: uint32ToHex(w),
          binary: uint32ToBinary(w),
        })),
      },
      visualizationType: 'binary-transform',
    });
  }

  // ─── Initialize hash values ──────────────────────────────────────────
  const H = config.initialHash.slice() as number[];

  steps.push({
    id: 'init-hash',
    title: 'Initial Hash Values',
    phase: 'Pre-processing',
    description: `Initialize the 8 working hash values H[0]..H[7] with the ${config.algorithmName} initial constants.`,
    data: {
      hashValues: H.map((h, i) => ({
        label: `H[${i}]`,
        hex: uint32ToHex(h),
        binary: uint32ToBinary(h),
      })),
    },
    visualizationType: 'generic',
  });

  // ─── Process each block ──────────────────────────────────────────────
  for (let b = 0; b < numBlocks; b++) {
    const block = blocks[b];
    const blockLabel = numBlocks > 1 ? ` (Block ${b + 1})` : '';

    // ─── Message Schedule W[0..63] ───────────────────────────────────
    const W = new Uint32Array(64);

    // Initial words W[0..15]
    for (let i = 0; i < 16; i++) {
      W[i] = block[i];
    }

    // Helper to get persistent schedule state up to index `computedUpTo`
    const getScheduleState = (computedUpTo: number, activeIdx?: number) => {
      return Array.from({ length: 64 }, (_, idx) => {
        const isComputed = idx <= computedUpTo;
        const val = isComputed ? W[idx] : 0;
        return {
          index: idx,
          hex: uint32ToHex(val),
          binary: uint32ToBinary(val),
          computed: isComputed,
          active: idx === activeIdx,
        };
      });
    };

    // W[16..63] Expansion with full step capturing
    for (let i = 16; i < 64; i++) {
      const s0Detail = sigma0Breakdown(W[i - 15]);
      const s1Detail = sigma1Breakdown(W[i - 2]);
      const s0 = s0Detail.result;
      const s1 = s1Detail.result;
      W[i] = add32(W[i - 16], s0, W[i - 7], s1);

      steps.push({
        id: `block-${b}-schedule-${i}`,
        title: `Expand Message Schedule: W[${i}]${blockLabel}`,
        phase: 'Message Schedule',
        description: `Compute W[${i}] = σ₁(W[${i - 2}]) + W[${i - 7}] + σ₀(W[${i - 15}]) + W[${i - 16}] (mod 2³²).\n\nσ₀ uses ROTR⁷ ⊕ ROTR¹⁸ ⊕ SHR³ on W[${i - 15}].\nσ₁ uses ROTR¹⁷ ⊕ ROTR¹⁹ ⊕ SHR¹⁰ on W[${i - 2}].`,
        data: {
          roundIndex: i,
          scheduleIndex: i,
          schedule: getScheduleState(i, i),
          constants: fullConstants,
          // Expansion operands
          wMinus16: formatWord(W[i - 16]),
          wMinus15: formatWord(W[i - 15]),
          wMinus7: formatWord(W[i - 7]),
          wMinus2: formatWord(W[i - 2]),
          // sigma0 breakdown
          sigma0: {
            input: formatWord(W[i - 15]),
            rot7: formatWord(s0Detail.rot7),
            rot18: formatWord(s0Detail.rot18),
            shr3: formatWord(s0Detail.shr3),
            result: formatWord(s0Detail.result),
          },
          // sigma1 breakdown
          sigma1: {
            input: formatWord(W[i - 2]),
            rot17: formatWord(s1Detail.rot17),
            rot19: formatWord(s1Detail.rot19),
            shr10: formatWord(s1Detail.shr10),
            result: formatWord(s1Detail.result),
          },
          result: formatWord(W[i]),
        },
        visualizationType: 'round-computation',
      });
    }

    // Complete schedule ready
    const fullSchedule = getScheduleState(63);

    // ─── Initialize working variables ────────────────────────────────
    let a = H[0], b_ = H[1], c = H[2], d = H[3];
    let e = H[4], f = H[5], g = H[6], h = H[7];

    const currentVars = () => [
      { label: 'a', ...formatWord(a) },
      { label: 'b', ...formatWord(b_) },
      { label: 'c', ...formatWord(c) },
      { label: 'd', ...formatWord(d) },
      { label: 'e', ...formatWord(e) },
      { label: 'f', ...formatWord(f) },
      { label: 'g', ...formatWord(g) },
      { label: 'h', ...formatWord(h) },
    ];

    steps.push({
      id: `block-${b}-init-vars`,
      title: `Initialize Working Variables${blockLabel}`,
      phase: 'Compression',
      description: `Set working variables (a through h) to current hash values H[0]..H[7].`,
      data: {
        variables: currentVars(),
        schedule: fullSchedule,
        constants: fullConstants,
      },
      visualizationType: 'round-computation',
    });

    // ─── 64 Compression Rounds ───────────────────────────────────────
    for (let i = 0; i < 64; i++) {
      const s1Detail = bigSigma1Breakdown(e);
      const chDetail = chBreakdown(e, f, g);
      const S1 = s1Detail.result;
      const chValue = chDetail.result;
      const T1 = add32(h, S1, chValue, K[i], W[i]);

      const s0Detail = bigSigma0Breakdown(a);
      const majDetail = majBreakdown(a, b_, c);
      const S0 = s0Detail.result;
      const majValue = majDetail.result;
      const T2 = add32(S0, majValue);

      const prev = { a, b: b_, c, d, e, f, g, h };
      const prevVariables = currentVars();

      // Update working variables
      h = g;
      g = f;
      f = e;
      e = add32(d, T1);
      d = c;
      c = b_;
      b_ = a;
      a = add32(T1, T2);

      const newVariables = currentVars();

      steps.push({
        id: `block-${b}-round-${i}`,
        title: `Compression Round ${i} of 64${blockLabel}`,
        phase: 'Compression',
        description: `Round ${i}: Compute Temp1 and Temp2 with bit-level non-linear functions (Σ₁, Ch, Σ₀, Maj), update a and e, and shift registers b..d and f..h.`,
        data: {
          roundIndex: i,
          schedule: fullSchedule.map((item) => ({
            ...item,
            active: item.index === i,
          })),
          constants: fullConstants.map((item) => ({
            ...item,
            active: item.index === i,
          })),
          activeK: { index: i, ...formatWord(K[i]) },
          activeW: { index: i, ...formatWord(W[i]) },
          prevVariables,
          newVariables,
          // Temp1 Details
          temp1: {
            h: formatWord(prev.h),
            sigma1: {
              input: formatWord(prev.e),
              rot6: formatWord(s1Detail.rot6),
              rot11: formatWord(s1Detail.rot11),
              rot25: formatWord(s1Detail.rot25),
              result: formatWord(S1),
            },
            ch: {
              e: formatWord(prev.e),
              f: formatWord(prev.f),
              g: formatWord(prev.g),
              eAndF: formatWord(chDetail.eAndF),
              notEAndG: formatWord(chDetail.notEAndG),
              result: formatWord(chValue),
            },
            k: formatWord(K[i]),
            w: formatWord(W[i]),
            result: formatWord(T1),
          },
          // Temp2 Details
          temp2: {
            sigma0: {
              input: formatWord(prev.a),
              rot2: formatWord(s0Detail.rot2),
              rot13: formatWord(s0Detail.rot13),
              rot22: formatWord(s0Detail.rot22),
              result: formatWord(S0),
            },
            maj: {
              a: formatWord(prev.a),
              b: formatWord(prev.b),
              c: formatWord(prev.c),
              aAndB: formatWord(majDetail.aAndB),
              aAndC: formatWord(majDetail.aAndC),
              bAndC: formatWord(majDetail.bAndC),
              result: formatWord(majValue),
            },
            result: formatWord(T2),
          },
          // Updates
          updatedA: { formula: 'T1 + T2', ...formatWord(a) },
          updatedE: { formula: 'd + T1', ...formatWord(e) },
        },
        visualizationType: 'round-computation',
      });
    }

    // ─── Update Hash Values ──────────────────────────────────────────
    const prevH = H.slice();
    H[0] = add32(H[0], a);
    H[1] = add32(H[1], b_);
    H[2] = add32(H[2], c);
    H[3] = add32(H[3], d);
    H[4] = add32(H[4], e);
    H[5] = add32(H[5], f);
    H[6] = add32(H[6], g);
    H[7] = add32(H[7], h);

    steps.push({
      id: `block-${b}-update-hash`,
      title: `Update Hash Values${blockLabel}`,
      phase: 'Compression',
      description: `Add compressed working variables into previous hash state: H[i] = H[i] + variable[i] (mod 2³²).`,
      data: {
        schedule: fullSchedule,
        constants: fullConstants,
        updates: Array.from({ length: 8 }, (_, i) => ({
          label: `H[${i}]`,
          prevHex: uint32ToHex(prevH[i]),
          prevBinary: uint32ToBinary(prevH[i]),
          addHex: uint32ToHex([a, b_, c, d, e, f, g, h][i]),
          addBinary: uint32ToBinary([a, b_, c, d, e, f, g, h][i]),
          newHex: uint32ToHex(H[i]),
          newBinary: uint32ToBinary(H[i]),
        })),
      },
      visualizationType: 'round-computation',
    });
  }

  // ─── Final Digest ──────────────────────────────────────────────────
  const digestWords = H.slice(0, config.outputWords);
  const digest = digestWords.map((h) => uint32ToHex(h)).join('');

  steps.push({
    id: 'final-digest',
    title: 'Final Hash Digest',
    phase: 'Output',
    description: `Concatenate ${config.outputWords === 8 ? 'all 8' : 'the first 7'} hash values H[0]..H[${config.outputWords - 1}] to produce the final ${config.outputWords * 32}-bit digest.\n\n${formatHexGroups(digest)}`,
    data: {
      hashValues: digestWords.map((h, i) => ({
        label: `H[${i}]`,
        hex: uint32ToHex(h),
        binary: uint32ToBinary(h),
      })),
      digest,
      digestFormatted: formatHexGroups(digest),
    },
    visualizationType: 'final-digest',
  });

  return { digest, steps };
}
