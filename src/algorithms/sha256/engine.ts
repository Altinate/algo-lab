/**
 * SHA-256 / SHA-224 Shared Computation Engine
 *
 * This engine implements the full SHA-256 algorithm with step-by-step
 * intermediate state capture for visualization. SHA-224 reuses this
 * engine with different initial hash values and truncated output.
 *
 * Algorithm overview (FIPS 180-4):
 * 1. Pre-processing: Pad the message to a multiple of 512 bits
 * 2. Parse: Break padded message into 512-bit blocks
 * 3. For each block:
 *    a. Prepare message schedule W[0..63]
 *    b. Initialize working variables a..h from current hash
 *    c. Run 64 compression rounds
 *    d. Update hash values
 * 4. Produce final digest by concatenating hash values
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
import { sigma0, sigma1, bigSigma0, bigSigma1, ch, maj } from './operations';

export interface Sha256EngineConfig {
  /** Initial hash values H[0..7] */
  initialHash: readonly number[];
  /** Number of 32-bit words to include in the final digest (7 for SHA-224, 8 for SHA-256) */
  outputWords: number;
  /** Algorithm name for step descriptions */
  algorithmName: string;
}

/**
 * Run SHA-256/224 computation and return all intermediate steps.
 */
export function sha256Engine(
  input: string,
  config: Sha256EngineConfig,
): { digest: string; steps: ComputationStep[] } {
  const steps: ComputationStep[] = [];

  // ─── Step 1: Input Encoding ──────────────────────────────────────────
  const inputBytes = stringToBytes(input);
  const inputBinary = bytesToBinary(inputBytes);

  steps.push({
    id: 'input-encoding',
    title: 'Input Encoding',
    phase: 'Pre-processing',
    description: `Convert the input string "${input || '(empty)'}" to its binary representation using UTF-8 encoding. Each character becomes 8 bits (one byte).`,
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
  // Pad to a multiple of 512 bits:
  //   message + '1' + zeros + 64-bit big-endian length
  const msgBitLen = inputBytes.length * 8;
  // Calculate padding length
  // We need: (msgBytes + 1 + paddingZeroBytes + 8) % 64 === 0
  const msgBytes = inputBytes.length;
  let paddingZeroBytes = 64 - ((msgBytes + 1 + 8) % 64);
  if (paddingZeroBytes === 64) paddingZeroBytes = 0;
  const totalLen = msgBytes + 1 + paddingZeroBytes + 8;

  const paddedBytes = new Uint8Array(totalLen);
  paddedBytes.set(inputBytes);
  paddedBytes[msgBytes] = 0x80; // append '1' bit followed by 7 zero bits

  // Append 64-bit big-endian representation of original message length in bits
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
      words[i] = blockView.getUint32(i * 4, false); // big-endian
    }
    blocks.push(words);

    steps.push({
      id: `block-${b}`,
      title: `Message Block ${b + 1} of ${numBlocks}`,
      phase: 'Pre-processing',
      description: `Parse the padded message into ${numBlocks} block(s) of 512 bits (64 bytes). Each block is divided into 16 words of 32 bits each (big-endian byte order). This is block ${b + 1}.`,
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
    description: `Initialize the 8 working hash values H[0]..H[7] with the ${config.algorithmName} initial constants. These are the first 32 bits of the fractional parts of the square roots of the first 8 prime numbers.`,
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

    // W[0..15] = message block words
    for (let i = 0; i < 16; i++) {
      W[i] = block[i];
    }

    // W[16..63] computed from previous W values
    for (let i = 16; i < 64; i++) {
      const s0 = sigma0(W[i - 15]);
      const s1 = sigma1(W[i - 2]);
      W[i] = add32(W[i - 16], s0, W[i - 7], s1);

      // Only push steps for a subset to avoid overwhelming the user
      // Show first few, some middle, and last few of the expansion
      if (i <= 19 || i === 32 || i === 48 || i >= 61) {
        steps.push({
          id: `block-${b}-schedule-${i}`,
          title: `Message Schedule W[${i}]${blockLabel}`,
          phase: 'Message Schedule',
          description: `Expand the message schedule by computing W[${i}] from previous W values:\nW[${i}] = σ₁(W[${i - 2}]) + W[${i - 7}] + σ₀(W[${i - 15}]) + W[${i - 16}]\n\nσ₀ applies ROTR⁷, ROTR¹⁸, and SHR³ then XORs the results.\nσ₁ applies ROTR¹⁷, ROTR¹⁹, and SHR¹⁰ then XORs the results.`,
          data: {
            roundIndex: i,
            wMinus16: { label: `W[${i - 16}]`, hex: uint32ToHex(W[i - 16]) },
            wMinus15: { label: `W[${i - 15}]`, hex: uint32ToHex(W[i - 15]) },
            wMinus7: { label: `W[${i - 7}]`, hex: uint32ToHex(W[i - 7]) },
            wMinus2: { label: `W[${i - 2}]`, hex: uint32ToHex(W[i - 2]) },
            sigma0Value: { label: `σ₀(W[${i - 15}])`, hex: uint32ToHex(s0) },
            sigma1Value: { label: `σ₁(W[${i - 2}])`, hex: uint32ToHex(s1) },
            result: { label: `W[${i}]`, hex: uint32ToHex(W[i]) },
          },
          visualizationType: 'round-computation',
        });
      }
    }

    // Show complete schedule summary
    steps.push({
      id: `block-${b}-schedule-complete`,
      title: `Message Schedule Complete${blockLabel}`,
      phase: 'Message Schedule',
      description: `The message schedule W[0..63] is now fully expanded. W[0..15] came directly from the message block, and W[16..63] were computed using the σ₀ and σ₁ functions to create diffusion.`,
      data: {
        schedule: Array.from(W).map((w, i) => ({
          index: i,
          hex: uint32ToHex(w),
        })),
      },
      visualizationType: 'generic',
    });

    // ─── Initialize working variables ────────────────────────────────
    let a = H[0], b_ = H[1], c = H[2], d = H[3];
    let e = H[4], f = H[5], g = H[6], h = H[7];

    steps.push({
      id: `block-${b}-init-vars`,
      title: `Initialize Working Variables${blockLabel}`,
      phase: 'Compression',
      description: `Set the 8 working variables (a through h) to the current hash values H[0]..H[7]. These variables will be transformed through 64 compression rounds.`,
      data: {
        variables: [
          { label: 'a', hex: uint32ToHex(a) },
          { label: 'b', hex: uint32ToHex(b_) },
          { label: 'c', hex: uint32ToHex(c) },
          { label: 'd', hex: uint32ToHex(d) },
          { label: 'e', hex: uint32ToHex(e) },
          { label: 'f', hex: uint32ToHex(f) },
          { label: 'g', hex: uint32ToHex(g) },
          { label: 'h', hex: uint32ToHex(h) },
        ],
      },
      visualizationType: 'round-computation',
    });

    // ─── 64 Compression Rounds ───────────────────────────────────────
    for (let i = 0; i < 64; i++) {
      const S1 = bigSigma1(e);
      const chValue = ch(e, f, g);
      const T1 = add32(h, S1, chValue, K[i], W[i]);
      const S0 = bigSigma0(a);
      const majValue = maj(a, b_, c);
      const T2 = add32(S0, majValue);

      // Save previous values for visualization
      const prev = { a, b: b_, c, d, e, f, g, h };

      // Update working variables
      h = g;
      g = f;
      f = e;
      e = add32(d, T1);
      d = c;
      c = b_;
      b_ = a;
      a = add32(T1, T2);

      steps.push({
        id: `block-${b}-round-${i}`,
        title: `Compression Round ${i}${blockLabel}`,
        phase: 'Compression',
        description: `Round ${i}: Compute T1 and T2, then shift all working variables.\n\nT1 = h + Σ₁(e) + Ch(e,f,g) + K[${i}] + W[${i}]\nT2 = Σ₀(a) + Maj(a,b,c)\n\nCh (Choice): for each bit, if e=1 pick f, else pick g.\nMaj (Majority): for each bit, output the majority of a,b,c.\nΣ₀/Σ₁ (Big Sigma): rotation-based mixing functions.`,
        data: {
          roundIndex: i,
          // Inputs
          K: { label: `K[${i}]`, hex: uint32ToHex(K[i]) },
          W: { label: `W[${i}]`, hex: uint32ToHex(W[i]) },
          // Intermediate computations
          bigSigma1: { label: 'Σ₁(e)', hex: uint32ToHex(S1) },
          ch: { label: 'Ch(e,f,g)', hex: uint32ToHex(chValue) },
          T1: { label: 'T1', hex: uint32ToHex(T1) },
          bigSigma0: { label: 'Σ₀(a)', hex: uint32ToHex(S0) },
          maj: { label: 'Maj(a,b,c)', hex: uint32ToHex(majValue) },
          T2: { label: 'T2', hex: uint32ToHex(T2) },
          // Previous state
          prevVariables: [
            { label: 'a', hex: uint32ToHex(prev.a) },
            { label: 'b', hex: uint32ToHex(prev.b) },
            { label: 'c', hex: uint32ToHex(prev.c) },
            { label: 'd', hex: uint32ToHex(prev.d) },
            { label: 'e', hex: uint32ToHex(prev.e) },
            { label: 'f', hex: uint32ToHex(prev.f) },
            { label: 'g', hex: uint32ToHex(prev.g) },
            { label: 'h', hex: uint32ToHex(prev.h) },
          ],
          // New state
          newVariables: [
            { label: 'a', hex: uint32ToHex(a) },
            { label: 'b', hex: uint32ToHex(b_) },
            { label: 'c', hex: uint32ToHex(c) },
            { label: 'd', hex: uint32ToHex(d) },
            { label: 'e', hex: uint32ToHex(e) },
            { label: 'f', hex: uint32ToHex(f) },
            { label: 'g', hex: uint32ToHex(g) },
            { label: 'h', hex: uint32ToHex(h) },
          ],
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
      description: `Add the compressed working variables to the current hash values:\nH[i] = H[i] + letter[i] (mod 2³²)\n\nThis combines the result of 64 rounds of compression with the previous hash state.`,
      data: {
        updates: Array.from({ length: 8 }, (_, i) => ({
          label: `H[${i}]`,
          prevHex: uint32ToHex(prevH[i]),
          addHex: uint32ToHex([a, b_, c, d, e, f, g, h][i]),
          newHex: uint32ToHex(H[i]),
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
      })),
      digest,
      digestFormatted: formatHexGroups(digest),
    },
    visualizationType: 'final-digest',
  });

  return { digest, steps };
}
