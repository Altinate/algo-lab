import { AlgorithmPlugin, AlgorithmInfo, ComputationStep, ComputationResult } from '../types';
import { stringToBytes, bytesToHex, uint64ToHex, rotr64 } from '../utils';
import { CX, RC } from './constants';

export const whirlpoolInfo: AlgorithmInfo = {
  name: 'Whirlpool',
  family: 'Cipher-Based',
  digestSize: 512,
  blockSize: 512,
  description: 'Whirlpool is a 512-bit cryptographic hash function designed by Vincent Rijmen (co-creator of AES) and Paulo Barreto, standardized in ISO/IEC 10118-3. It operates on an 8×8 matrix of bytes through 10 rounds of AES-like transformations (SubBytes, ShiftColumns, MixRows, AddRoundKey) inside a Miyaguchi-Preneel compression structure.',
  useCases: ['ISO/IEC 10118-3 standard', 'High collision resistance', 'AES-derived hash structures'],
  security: 'secure',
  year: 2000,
  designers: ['Vincent Rijmen', 'Paulo S. L. M. Barreto'],
};

const MASK64 = 0xffffffffffffffffn;

function getTable(byteVal: number, shiftBytes: number): bigint {
  const entry = CX[byteVal];
  return rotr64(entry, shiftBytes * 8);
}

export class WhirlpoolPlugin implements AlgorithmPlugin {
  info = whirlpoolInfo;

  compute(input: string): ComputationResult {
    const steps: ComputationStep[] = [];
    const inputBytes = stringToBytes(input);
    const bitLen = BigInt(inputBytes.length) * 8n;

    // 1. Input Encoding
    steps.push({
      id: 'input-encoding',
      title: 'Input Byte Stream',
      phase: 'Preprocessing',
      description: `Input string converted into UTF-8 bytes (${inputBytes.length} bytes / ${Number(bitLen)} bits).`,
      data: {
        input: input || '(empty string)',
        bytes: Array.from(inputBytes),
        hex: bytesToHex(inputBytes),
        bitLength: Number(bitLen),
      },
      visualizationType: 'binary-transform',
    });

    // 2. Padding (Multiple of 512 bits / 64 bytes with 256-bit length suffix)
    const len = inputBytes.length;
    let padLen = 32 - ((len + 1) % 64);
    if (padLen < 0) padLen += 64;

    const totalLen = len + 1 + padLen + 32;
    const padded = new Uint8Array(totalLen);
    padded.set(inputBytes, 0);
    padded[len] = 0x80;

    // 256-bit length suffix in big-endian
    for (let i = 0; i < 8; i++) {
      padded[totalLen - 1 - i] = Number((bitLen >> BigInt(i * 8)) & 0xffn);
    }

    steps.push({
      id: 'padding',
      title: 'Message Padding (512-Bit Multiple & 256-Bit Length)',
      phase: 'Preprocessing',
      description: `Append 0x80, ${padLen} zero bytes, and 256-bit big-endian bit length (${Number(bitLen)} bits).`,
      data: {
        originalBits: Number(bitLen),
        zeroPaddingBytes: padLen,
        paddedHex: bytesToHex(padded),
        totalBits: totalLen * 8,
        totalBlocks: totalLen / 64,
      },
      visualizationType: 'binary-transform',
    });

    // 3. State Initialization (64 bytes / 8 64-bit quadwords)
    const H = new Uint8Array(64);

    steps.push({
      id: 'init-state',
      title: 'Initialize 512-Bit State Matrix',
      phase: 'Preprocessing',
      description: 'Initialize 8×8 byte state matrix to all zeros.',
      data: {
        stateMatrix: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => '00')),
      },
      visualizationType: 'state-matrix',
    });

    // 4. Process Blocks
    const numBlocks = totalLen / 64;
    const S_bytes = new Uint8Array(64);
    const K_bytes = new Uint8Array(64);
    const L = new BigUint64Array(8);

    for (let b = 0; b < numBlocks; b++) {
      const blockOffset = b * 64;
      const block = padded.subarray(blockOffset, blockOffset + 64);

      for (let i = 0; i < 64; i++) {
        K_bytes[i] = H[i];
        S_bytes[i] = H[i] ^ block[i];
      }

      for (let r = 0; r < 10; r++) {
        // Key schedule step
        for (let i = 0; i < 8; i++) {
          let v = i === 0 ? RC[r] : 0n;
          for (let j = 0; j < 8; j++) {
            const byteIdx = ((i - j + 8) & 7) * 8 + j;
            v ^= getTable(K_bytes[byteIdx], j);
          }
          L[i] = v;
        }

        // Store L into K_bytes in big-endian
        for (let i = 0; i < 8; i++) {
          const w = L[i];
          for (let j = 0; j < 8; j++) {
            K_bytes[i * 8 + j] = Number((w >> BigInt((7 - j) * 8)) & 0xffn);
          }
        }

        // State round step
        for (let i = 0; i < 8; i++) {
          let v = L[i]; // XOR with round key word
          for (let j = 0; j < 8; j++) {
            const byteIdx = ((i - j + 8) & 7) * 8 + j;
            v ^= getTable(S_bytes[byteIdx], j);
          }
          L[i] = v;
        }

        // Store L into S_bytes in big-endian
        for (let i = 0; i < 8; i++) {
          const w = L[i];
          for (let j = 0; j < 8; j++) {
            S_bytes[i * 8 + j] = Number((w >> BigInt((7 - j) * 8)) & 0xffn);
          }
        }

        // Emit state matrix view
        const matrixHex = Array.from({ length: 8 }, (_, rowIdx) =>
          Array.from({ length: 8 }, (_, colIdx) =>
            S_bytes[rowIdx * 8 + colIdx].toString(16).padStart(2, '0')
          )
        );

        steps.push({
          id: `block-${b}-round-${r}`,
          title: `Whirlpool Round ${r + 1} of 10`,
          phase: 'Compression',
          description: `Round ${r + 1} Transformation with Round Constant 0x${RC[r].toString(16).padStart(16, '0')}`,
          data: {
            roundIndex: r + 1,
            roundConstant: `0x${RC[r].toString(16).padStart(16, '0')}`,
            stateMatrix: matrixHex,
          },
          visualizationType: 'state-matrix',
        });
      }

      // Miyaguchi-Preneel feedforward
      for (let i = 0; i < 64; i++) {
        H[i] ^= S_bytes[i] ^ block[i];
      }
    }

    const finalDigest = bytesToHex(H);

    steps.push({
      id: 'final-digest',
      title: 'Final Digest Assembly',
      phase: 'Finalization',
      description: 'Output the 512-bit (64-byte) Whirlpool digest.',
      data: {
        digest: finalDigest,
      },
      visualizationType: 'final-digest',
    });

    return { digest: finalDigest, steps };
  }
}

export default new WhirlpoolPlugin();
