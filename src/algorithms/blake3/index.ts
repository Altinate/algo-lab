import type { AlgorithmPlugin, AlgorithmInfo, ComputationStep } from '../types';
import { stringToBytes, uint32ToHex } from '../utils';
import { IV32, G32, formatState32 } from '../blake2/engine';

const INFO: AlgorithmInfo = {
  name: 'BLAKE3',
  family: 'BLAKE',
  digestSize: 256,
  blockSize: 512,
  security: 'secure',
  year: 2020,
  designers: ["Jack O'Connor", 'Jean-Philippe Aumasson', 'Samuel Neves', "Zooko Wilcox-O'Hearn"],
  description:
    'BLAKE3 is a cryptographic hash function that is much faster than MD5, SHA-1, SHA-2, SHA-3, and BLAKE2. It uses a 7-round compression function based on BLAKE2s and a tree structure for high parallelism.',
  useCases: ['High-throughput hashing', 'File integrity', 'Parallelized deduplication', 'Cryptographic commitments'],
};

// Flags for BLAKE3
const CHUNK_START = 1;
const CHUNK_END = 2;
const ROOT = 8;

const MSG_PERMUTATION = [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8];

export const blake3Plugin: AlgorithmPlugin = {
  info: INFO,

  compute(input: string) {
    const steps: ComputationStep[] = [];
    const allBytes = stringToBytes(input);

    // Limit to single block (64 bytes) for educational visualization as specified
    const isTruncated = allBytes.length > 64;
    const messageBytes = isTruncated ? allBytes.slice(0, 64) : allBytes;
    const blockLen = messageBytes.length;

    steps.push({
      id: 'input-encoding',
      title: 'Input Encoding',
      phase: 'Pre-processing',
      description: isTruncated
        ? `Input converted to ${allBytes.length} bytes (note: visualizer evaluates single-block 64-byte chunk). Input: "${input.slice(0, 40)}..."`
        : `Input string converted to ${blockLen} bytes using UTF-8 encoding.`,
      data: {
        inputLength: allBytes.length,
        evaluatedBytes: blockLen,
        truncated: isTruncated,
      },
      visualizationType: 'binary-transform',
    });

    // 16 words from 64-byte block (little-endian)
    const blockWords = new Array(16).fill(0);
    for (let i = 0; i < blockLen; i++) {
      blockWords[Math.floor(i / 4)] |= messageBytes[i] << ((i % 4) * 8);
    }
    for (let i = 0; i < 16; i++) {
      blockWords[i] = blockWords[i] >>> 0;
    }

    steps.push({
      id: 'block-prep',
      title: 'Message Block Setup (16 words)',
      phase: 'Pre-processing',
      description: `Format the ${blockLen} bytes into 16 32-bit little-endian words, zero-padded up to 64 bytes.`,
      data: {
        words: blockWords.map((w, idx) => ({
          index: idx,
          hex: uint32ToHex(w),
        })),
        blockLen,
      },
      visualizationType: 'binary-transform',
    });

    // Initialize 16-word work state v:
    // v[0..7] = IV (chaining value)
    // v[8..11] = IV[0..3]
    // v[12..13] = chunk_counter (0 for single block)
    // v[14] = block_len
    // v[15] = flags (CHUNK_START | CHUNK_END | ROOT = 11)
    const flags = CHUNK_START | CHUNK_END | ROOT;
    const v = [
      IV32[0], IV32[1], IV32[2], IV32[3],
      IV32[4], IV32[5], IV32[6], IV32[7],
      IV32[0], IV32[1], IV32[2], IV32[3],
      0, 0, blockLen, flags,
    ];

    steps.push({
      id: 'v-init',
      title: 'Initialize 16-Word State Vector',
      phase: 'Initialization',
      description:
        'Initialize state vector v[0..15]: v[0..7] from IV/CV, v[8..11] from IV[0..3], v[12..13] chunk counter (0), v[14] block length, v[15] flags (CHUNK_START | CHUNK_END | ROOT = 11).',
      data: {
        v: formatState32(v),
        flags: `0x${flags.toString(16).padStart(2, '0')} (CHUNK_START | CHUNK_END | ROOT)`,
        blockLen,
      },
      visualizationType: 'mixing-function',
    });

    let m = [...blockWords];

    // 7 Compression Rounds
    for (let r = 0; r < 7; r++) {
      const prevState = [...v];

      // Column step: 4 G calls
      G32(v, 0, 4, 8, 12, m[0], m[1]);
      G32(v, 1, 5, 9, 13, m[2], m[3]);
      G32(v, 2, 6, 10, 14, m[4], m[5]);
      G32(v, 3, 7, 11, 15, m[6], m[7]);

      // Diagonal step: 4 G calls
      G32(v, 0, 5, 10, 15, m[8], m[9]);
      G32(v, 1, 6, 11, 12, m[10], m[11]);
      G32(v, 2, 7, 8, 13, m[12], m[13]);
      G32(v, 3, 4, 9, 14, m[14], m[15]);

      steps.push({
        id: `round-${r}`,
        title: `Compression Round ${r + 1} of 7`,
        phase: 'Compression',
        description: `Round ${r + 1}: Apply G mixing functions to columns and diagonals, then permute message words using BLAKE3 schedule.`,
        data: {
          roundIndex: r + 1,
          prevState: formatState32(prevState),
          state: formatState32(v),
          mixType: 'Columns & Diagonals',
        },
        visualizationType: 'mixing-function',
      });

      // Permute message words for next round
      m = MSG_PERMUTATION.map((idx) => m[idx]);
    }

    // Finalize: out[i] = v[i] ^ v[i+8]
    const out = new Array(8);
    for (let i = 0; i < 8; i++) {
      out[i] = (v[i] ^ v[i + 8]) >>> 0;
    }

    steps.push({
      id: 'compress-finalize',
      title: 'Compress Finalization',
      phase: 'Finalization',
      description: 'Compute final 8 words by XORing upper and lower halves of state: out[i] = v[i] ⊕ v[i + 8].',
      data: {
        hashValues: out.map((w, idx) => ({
          label: `h[${idx}]`,
          hex: uint32ToHex(w),
        })),
      },
      visualizationType: 'round-computation',
    });

    // Format output as little-endian hex string
    let digest = '';
    for (let i = 0; i < 8; i++) {
      const w = out[i];
      for (let j = 0; j < 4; j++) {
        digest += ((w >>> (j * 8)) & 0xff).toString(16).padStart(2, '0');
      }
    }

    steps.push({
      id: 'final-digest',
      title: 'Final Hash Digest',
      phase: 'Output',
      description: `Format the 8 output words as 32 little-endian bytes in hexadecimal (256-bit digest):\n\n${digest}`,
      data: {
        digest,
        hashValues: out.map((w, idx) => ({
          label: `h[${idx}]`,
          hex: uint32ToHex(w),
        })),
      },
      visualizationType: 'final-digest',
    });

    return { digest, steps };
  },
};

export default blake3Plugin;
