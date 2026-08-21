import { AlgorithmPlugin, AlgorithmInfo, ComputationStep, ComputationResult } from '../types';
import {
  stringToBytes,
  bytesToHex,
  uint32ToHex,
  uint32ToBinary,
  rotl32,
  add32,
} from '../utils';

export const sm3Info: AlgorithmInfo = {
  name: 'SM3',
  family: 'Chinese National Standard',
  digestSize: 256,
  blockSize: 512,
  description: 'SM3 (GB/T 32918.2-2016 / ISO/IEC 10118-3:2018) is a 256-bit cryptographic hash function standardized by the Chinese State Cryptography Administration (SCA), similar in architecture to SHA-256 with distinct non-linear permutations (P0, P1) and dual message schedules.',
  useCases: ['Chinese national cryptographic standards (Commercial Cryptography)', 'TLS 1.3 Chinese cipher suites', 'Digital certificates (SM2/SM3/SM4)'],
  security: 'secure',
  year: 2010,
  designers: ['Xiaoyun Wang', 'State Cryptography Administration of China'],
};

// Permutations
function P0(X: number): number {
  return (X ^ rotl32(X, 9) ^ rotl32(X, 17)) >>> 0;
}

function P1(X: number): number {
  return (X ^ rotl32(X, 15) ^ rotl32(X, 23)) >>> 0;
}

// Non-linear boolean functions
function FF(j: number, X: number, Y: number, Z: number): number {
  if (j < 16) {
    return (X ^ Y ^ Z) >>> 0;
  }
  return ((X & Y) | (X & Z) | (Y & Z)) >>> 0;
}

function GG(j: number, X: number, Y: number, Z: number): number {
  if (j < 16) {
    return (X ^ Y ^ Z) >>> 0;
  }
  return ((X & Y) | (~X & Z)) >>> 0;
}

const SM3_IV = [
  0x7380166f, 0x4914b2b9, 0x172442d7, 0xda8a0600,
  0xa96f30bc, 0x163138aa, 0xe38dee4d, 0xb0fb0e4e
];

export class SM3Plugin implements AlgorithmPlugin {
  info = sm3Info;

  compute(input: string): ComputationResult {
    const steps: ComputationStep[] = [];
    const inputBytes = stringToBytes(input);
    const bitLength = BigInt(inputBytes.length) * 8n;

    // 1. Input encoding
    steps.push({
      id: 'input-encoding',
      title: 'Input Encoding',
      phase: 'Preprocessing',
      description: `Encode input into UTF-8 bytes (${inputBytes.length} bytes / ${Number(bitLength)} bits).`,
      data: {
        input: input || '(empty string)',
        bytes: Array.from(inputBytes),
        hex: bytesToHex(inputBytes),
        bitLength: Number(bitLength),
      },
      visualizationType: 'binary-transform',
    });

    // 2. Padding (Multiple of 512 bits / 64 bytes)
    const l = inputBytes.length;
    let k = 56 - ((l + 1) % 64);
    if (k < 0) k += 64;

    const totalLength = l + 1 + k + 8;
    const paddedBytes = new Uint8Array(totalLength);
    paddedBytes.set(inputBytes, 0);
    paddedBytes[l] = 0x80;

    const view = new DataView(paddedBytes.buffer, paddedBytes.byteOffset, paddedBytes.byteLength);
    view.setBigUint64(totalLength - 8, bitLength, false); // Big-endian

    steps.push({
      id: 'padding',
      title: 'Message Padding (Big-Endian)',
      phase: 'Preprocessing',
      description: `Pad to 512-bit multiple. Append 0x80, ${k} zero bytes, and 64-bit big-endian length.`,
      data: {
        originalBits: Number(bitLength),
        zeroPaddingBytes: k,
        lengthField: uint32ToHex(view.getUint32(totalLength - 8, false)) + uint32ToHex(view.getUint32(totalLength - 4, false)),
        paddedHex: bytesToHex(paddedBytes),
        totalBits: totalLength * 8,
        totalBlocks: totalLength / 64,
      },
      visualizationType: 'binary-transform',
    });

    // 3. State initialization
    let V = [...SM3_IV];

    steps.push({
      id: 'init-state',
      title: 'Initialize SM3 32-Bit State Registers',
      phase: 'Preprocessing',
      description: 'Initialize registers A..H with standard SM3 initial constants.',
      data: {
        variables: [
          { label: 'A', hex: uint32ToHex(V[0]), binary: uint32ToBinary(V[0]) },
          { label: 'B', hex: uint32ToHex(V[1]), binary: uint32ToBinary(V[1]) },
          { label: 'C', hex: uint32ToHex(V[2]), binary: uint32ToBinary(V[2]) },
          { label: 'D', hex: uint32ToHex(V[3]), binary: uint32ToBinary(V[3]) },
          { label: 'E', hex: uint32ToHex(V[4]), binary: uint32ToBinary(V[4]) },
          { label: 'F', hex: uint32ToHex(V[5]), binary: uint32ToBinary(V[5]) },
          { label: 'G', hex: uint32ToHex(V[6]), binary: uint32ToBinary(V[6]) },
          { label: 'H', hex: uint32ToHex(V[7]), binary: uint32ToBinary(V[7]) },
        ],
      },
      visualizationType: 'round-computation',
    });

    // 4. Process blocks
    const numBlocks = totalLength / 64;

    for (let blockIdx = 0; blockIdx < numBlocks; blockIdx++) {
      const offset = blockIdx * 64;
      const W = new Array<number>(68);
      const WPrime = new Array<number>(64);

      // Load initial 16 words
      for (let t = 0; t < 16; t++) {
        W[t] = view.getUint32(offset + t * 4, false);
      }

      // Expand to 68 words
      for (let j = 16; j < 68; j++) {
        const tmp = (W[j - 16] ^ W[j - 9] ^ rotl32(W[j - 3], 15)) >>> 0;
        W[j] = (P1(tmp) ^ rotl32(W[j - 13], 7) ^ W[j - 6]) >>> 0;
      }

      // Generate W' (64 words)
      for (let j = 0; j < 64; j++) {
        WPrime[j] = (W[j] ^ W[j + 4]) >>> 0;
      }

      const fullSchedule = W.slice(0, 64).map((w, idx) => ({
        index: idx,
        hex: uint32ToHex(w),
        binary: uint32ToBinary(w),
        computed: true,
      }));

      let A = V[0], B = V[1], C = V[2], D = V[3];
      let E = V[4], F = V[5], G = V[6], H = V[7];

      for (let j = 0; j < 64; j++) {
        const Tj = j < 16 ? 0x79cc4519 : 0x7a879d8a;
        const rotA = rotl32(A, 12);
        const rotT = rotl32(Tj, j % 32);
        const SS1 = rotl32(add32(rotA, E, rotT), 7);
        const SS2 = (SS1 ^ rotA) >>> 0;

        const TT1 = add32(FF(j, A, B, C), D, SS2, WPrime[j]);
        const TT2 = add32(GG(j, E, F, G), H, SS1, W[j]);

        const prevA = A, prevB = B, prevC = C, prevD = D;
        const prevE = E, prevF = F, prevG = G, prevH = H;

        D = C;
        C = rotl32(B, 9);
        B = A;
        A = TT1;

        H = G;
        G = rotl32(F, 19);
        F = E;
        E = P0(TT2);

        if (j % 16 === 15 || j === 0) {
          steps.push({
            id: `block-${blockIdx}-round-${j}`,
            title: `SM3 Round ${j + 1} of 64`,
            phase: 'Compression',
            description: `Round ${j + 1} Pipeline:\nSS1 = (((A <<< 12) + E + (T_j <<< ${j % 32})) <<< 7)\nTT1 = FF(A,B,C) + D + SS2 + W'[${j}]\nTT2 = GG(E,F,G) + H + SS1 + W[${j}]\nWriteback: A ← TT1, E ← P0(TT2)`,
            data: {
              roundIndex: j,
              scheduleIndex: j,
              schedule: fullSchedule.map((item) => ({
                ...item,
                active: item.index === j,
              })),
              prevVariables: [
                { label: 'A', hex: uint32ToHex(prevA), binary: uint32ToBinary(prevA) },
                { label: 'B', hex: uint32ToHex(prevB), binary: uint32ToBinary(prevB) },
                { label: 'C', hex: uint32ToHex(prevC), binary: uint32ToBinary(prevC) },
                { label: 'D', hex: uint32ToHex(prevD), binary: uint32ToBinary(prevD) },
                { label: 'E', hex: uint32ToHex(prevE), binary: uint32ToBinary(prevE) },
                { label: 'F', hex: uint32ToHex(prevF), binary: uint32ToBinary(prevF) },
                { label: 'G', hex: uint32ToHex(prevG), binary: uint32ToBinary(prevG) },
                { label: 'H', hex: uint32ToHex(prevH), binary: uint32ToBinary(prevH) },
              ],
              newVariables: [
                { label: 'A', hex: uint32ToHex(A), binary: uint32ToBinary(A) },
                { label: 'B', hex: uint32ToHex(B), binary: uint32ToBinary(B) },
                { label: 'C', hex: uint32ToHex(C), binary: uint32ToBinary(C) },
                { label: 'D', hex: uint32ToHex(D), binary: uint32ToBinary(D) },
                { label: 'E', hex: uint32ToHex(E), binary: uint32ToBinary(E) },
                { label: 'F', hex: uint32ToHex(F), binary: uint32ToBinary(F) },
                { label: 'G', hex: uint32ToHex(G), binary: uint32ToBinary(G) },
                { label: 'H', hex: uint32ToHex(H), binary: uint32ToBinary(H) },
              ],
            },
            visualizationType: 'round-computation',
          });
        }
      }

      // XOR accumulation with block
      V[0] = (V[0] ^ A) >>> 0;
      V[1] = (V[1] ^ B) >>> 0;
      V[2] = (V[2] ^ C) >>> 0;
      V[3] = (V[3] ^ D) >>> 0;
      V[4] = (V[4] ^ E) >>> 0;
      V[5] = (V[5] ^ F) >>> 0;
      V[6] = (V[6] ^ G) >>> 0;
      V[7] = (V[7] ^ H) >>> 0;
    }

    const finalDigest = V.map((v) => uint32ToHex(v)).join('');

    steps.push({
      id: 'final-digest',
      title: 'Final Digest Assembly',
      phase: 'Finalization',
      description: 'Concatenate 8 32-bit registers A..H in big-endian order to produce the 256-bit SM3 digest.',
      data: {
        digest: finalDigest,
        hashValues: V.map((v, idx) => ({
          label: String.fromCharCode(65 + idx),
          hex: uint32ToHex(v),
        })),
      },
      visualizationType: 'final-digest',
    });

    return { digest: finalDigest, steps };
  }
}

export default new SM3Plugin();
