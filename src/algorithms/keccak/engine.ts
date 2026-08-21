import { stringToBytes, bytesToHex, uint64ToHex } from '../utils';
import { ComputationStep, ComputationResult } from '../types';

const RC = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
];

const RHO = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14]
];

export interface KeccakConfig {
  rate: number;      // in bits
  capacity: number;  // in bits
  outputLen: number; // in bits
  domainSep: number; // 0x01 for Keccak, 0x06 for SHA3
}

function rotl64(value: bigint, shift: number): bigint {
  if (shift === 0) return value;
  const s = BigInt(shift);
  return ((value << s) | (value >> (64n - s))) & 0xFFFFFFFFFFFFFFFFn;
}

function getLane(bytes: Uint8Array, offset: number): bigint {
  // Little-endian
  let lane = 0n;
  for (let i = 0; i < 8; i++) {
    if (offset + i < bytes.length) {
      lane |= BigInt(bytes[offset + i]) << BigInt(i * 8);
    }
  }
  return lane;
}

function setLane(lane: bigint): Uint8Array {
  const bytes = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    bytes[i] = Number((lane >> BigInt(i * 8)) & 0xFFn);
  }
  return bytes;
}

export function computeKeccakFamily(input: string, config: KeccakConfig): ComputationResult {
  const steps: ComputationStep[] = [];
  const inputBytes = stringToBytes(input);
  const rateInBytes = config.rate / 8;
  
  // Padding
  let padLen = rateInBytes - (inputBytes.length % rateInBytes);
  const paddedBytes = new Uint8Array(inputBytes.length + padLen);
  paddedBytes.set(inputBytes);
  paddedBytes[inputBytes.length] = config.domainSep;
  paddedBytes[paddedBytes.length - 1] |= 0x80;
  
  steps.push({
    id: 'padding',
    title: 'Message Padding (Sponge)',
    phase: 'Preprocessing',
    description: `Append domain separation bits and pad to a multiple of the rate (${config.rate} bits).`,
    data: {
      rateBits: config.rate,
      capacityBits: config.capacity,
      paddedHex: bytesToHex(paddedBytes)
    },
    visualizationType: 'binary-transform'
  });

  // State is 5x5 array of 64-bit lanes (initialized to 0)
  const A: bigint[][] = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 0n));

  const formatState = (state: bigint[][]) => {
    return state.map(row => row.map(lane => uint64ToHex(lane)));
  };

  const numBlocks = paddedBytes.length / rateInBytes;
  
  for (let blockIdx = 0; blockIdx < numBlocks; blockIdx++) {
    const offset = blockIdx * rateInBytes;
    
    // Absorb
    for (let x = 0; x < config.rate / 64; x++) {
      const laneX = x % 5;
      const laneY = Math.floor(x / 5);
      A[laneX][laneY] ^= getLane(paddedBytes, offset + x * 8);
    }
    
    steps.push({
      id: `absorb-${blockIdx}`,
      title: 'Absorb Block',
      phase: `Block ${blockIdx + 1} / ${numBlocks}`,
      description: `XOR the message block into the state.`,
      data: {
        stateMatrix: formatState(A)
      },
      visualizationType: 'state-matrix'
    });
    
    // Keccak-f[1600] Permutation
    for (let round = 0; round < 24; round++) {
      // Theta
      const C = new Array(5).fill(0n);
      const D = new Array(5).fill(0n);
      for (let x = 0; x < 5; x++) {
        C[x] = A[x][0] ^ A[x][1] ^ A[x][2] ^ A[x][3] ^ A[x][4];
      }
      for (let x = 0; x < 5; x++) {
        D[x] = C[(x + 4) % 5] ^ rotl64(C[(x + 1) % 5], 1);
      }
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          A[x][y] ^= D[x];
        }
      }
      
      // Rho and Pi
      const B: bigint[][] = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 0n));
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          B[y][(2 * x + 3 * y) % 5] = rotl64(A[x][y], RHO[x][y]);
        }
      }
      
      // Chi
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          A[x][y] = (B[x][y] ^ ((~B[(x + 1) % 5][y]) & B[(x + 2) % 5][y])) & 0xFFFFFFFFFFFFFFFFn;
        }
      }
      
      // Iota
      A[0][0] ^= RC[round];
      
      steps.push({
        id: `keccak-f-block-${blockIdx}-round-${round}`,
        title: `Keccak-f Round ${round}`,
        phase: `Block ${blockIdx + 1} / ${numBlocks}`,
        description: `Apply θ, ρ, π, χ, and ι operations.`,
        data: {
          round,
          stateMatrix: formatState(A)
        },
        visualizationType: 'state-matrix'
      });
    }
  }

  // Squeeze
  const outputBytes = new Uint8Array(config.outputLen / 8);
  let squeezed = 0;
  
  while (squeezed < outputBytes.length) {
    for (let x = 0; x < config.rate / 64; x++) {
      const laneX = x % 5;
      const laneY = Math.floor(x / 5);
      const laneBytes = setLane(A[laneX][laneY]);
      for (let i = 0; i < 8 && squeezed < outputBytes.length; i++) {
        outputBytes[squeezed++] = laneBytes[i];
      }
    }
  }
  
  const finalDigest = bytesToHex(outputBytes);
  
  steps.push({
    id: 'final-digest',
    title: 'Final Digest',
    phase: 'Output',
    description: `Squeeze out the first ${config.outputLen} bits for the final digest.`,
    data: {
      digest: finalDigest
    },
    visualizationType: 'final-digest'
  });
  
  return { digest: finalDigest, steps };
}
