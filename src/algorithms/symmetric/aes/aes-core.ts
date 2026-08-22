/**
 * AES Core Engine (NIST FIPS 197)
 * Implements Key Expansion, SubBytes, ShiftRows, MixColumns, AddRoundKey and their inverses.
 */

import { S_BOX, INV_S_BOX, RCON, gmul } from './constants';
import { formatHexByte, formatBinary } from '../../utils';
import type { ComputationStep } from '../../types';

export type AesKeySize = 128 | 192 | 256;

export interface AesRoundTelemetry {
  roundIndex: number;
  totalRounds: number;
  phase: string;
  subStep: string;
  description: string;
  stateMatrix: string[][];       // 4x4 array of 2-digit hex strings (column-major in AES convention)
  prevStateMatrix?: string[][];  // 4x4 array before this operation
  roundKeyMatrix?: string[][];   // 4x4 array of current round key
  operationName?: string;
  highlightIndices?: [number, number][]; // [row, col] to highlight
  expandedKeyWordIndex?: number;
}

/** Converts 16-byte Uint8Array state to 4x4 hex string matrix (AES column-major: state[row + 4*col]) */
export function stateToMatrix(state: Uint8Array): string[][] {
  const matrix: string[][] = [
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
  ];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      matrix[r][c] = formatHexByte(state[r + 4 * c]);
    }
  }
  return matrix;
}

/** Clone a 4x4 matrix */
export function cloneMatrix(m: string[][]): string[][] {
  return m.map((row) => [...row]);
}

/** Expand AES Cipher Key (16, 24, or 32 bytes) into (Nr + 1) 16-byte Round Keys */
export function expandKey(keyBytes: Uint8Array, keySize: AesKeySize): Uint8Array[] {
  const Nk = keySize / 32; // 4, 6, or 8 words (32-bit each)
  const Nr = Nk + 6;       // 10, 12, or 14 rounds
  const totalWords = 4 * (Nr + 1); // 44, 52, or 60 words

  const w: Uint32Array = new Uint32Array(totalWords);

  // First Nk words are the original key
  for (let i = 0; i < Nk; i++) {
    w[i] =
      ((keyBytes[4 * i] & 0xff) << 24) |
      ((keyBytes[4 * i + 1] & 0xff) << 16) |
      ((keyBytes[4 * i + 2] & 0xff) << 8) |
      (keyBytes[4 * i + 3] & 0xff);
  }

  // Generate remaining words
  for (let i = Nk; i < totalWords; i++) {
    let temp = w[i - 1];
    if (i % Nk === 0) {
      // RotWord: cyclic left shift by 8 bits
      temp = ((temp << 8) | (temp >>> 24)) >>> 0;
      // SubWord: apply S-box to each of the 4 bytes
      const b0 = S_BOX[(temp >>> 24) & 0xff];
      const b1 = S_BOX[(temp >>> 16) & 0xff];
      const b2 = S_BOX[(temp >>> 8) & 0xff];
      const b3 = S_BOX[temp & 0xff];
      temp = (((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0) ^ (RCON[i / Nk] << 24);
    } else if (Nk > 6 && i % Nk === 4) {
      // For 256-bit keys, an additional SubWord is applied at word 4
      const b0 = S_BOX[(temp >>> 24) & 0xff];
      const b1 = S_BOX[(temp >>> 16) & 0xff];
      const b2 = S_BOX[(temp >>> 8) & 0xff];
      const b3 = S_BOX[temp & 0xff];
      temp = ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0;
    }
    w[i] = (w[i - Nk] ^ temp) >>> 0;
  }

  // Group into (Nr + 1) round keys of 16 bytes each
  const roundKeys: Uint8Array[] = [];
  for (let r = 0; r <= Nr; r++) {
    const rk = new Uint8Array(16);
    for (let c = 0; c < 4; c++) {
      const word = w[4 * r + c];
      rk[4 * c] = (word >>> 24) & 0xff;
      rk[4 * c + 1] = (word >>> 16) & 0xff;
      rk[4 * c + 2] = (word >>> 8) & 0xff;
      rk[4 * c + 3] = word & 0xff;
    }
    roundKeys.push(rk);
  }

  return roundKeys;
}

/** Perform SubBytes transformation */
export function subBytes(state: Uint8Array): Uint8Array {
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    out[i] = S_BOX[state[i]];
  }
  return out;
}

/** Perform InvSubBytes transformation */
export function invSubBytes(state: Uint8Array): Uint8Array {
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    out[i] = INV_S_BOX[state[i]];
  }
  return out;
}

/** Perform ShiftRows transformation */
export function shiftRows(state: Uint8Array): Uint8Array {
  const out = new Uint8Array(16);
  // Row 0: no shift
  out[0] = state[0];
  out[4] = state[4];
  out[8] = state[8];
  out[12] = state[12];
  // Row 1: shift left by 1
  out[1] = state[5];
  out[5] = state[9];
  out[9] = state[13];
  out[13] = state[1];
  // Row 2: shift left by 2
  out[2] = state[10];
  out[6] = state[14];
  out[10] = state[2];
  out[14] = state[6];
  // Row 3: shift left by 3
  out[3] = state[15];
  out[7] = state[3];
  out[11] = state[7];
  out[15] = state[11];
  return out;
}

/** Perform InvShiftRows transformation */
export function invShiftRows(state: Uint8Array): Uint8Array {
  const out = new Uint8Array(16);
  // Row 0: no shift
  out[0] = state[0];
  out[4] = state[4];
  out[8] = state[8];
  out[12] = state[12];
  // Row 1: shift right by 1
  out[1] = state[13];
  out[5] = state[1];
  out[9] = state[5];
  out[13] = state[9];
  // Row 2: shift right by 2
  out[2] = state[10];
  out[6] = state[14];
  out[10] = state[2];
  out[14] = state[6];
  // Row 3: shift right by 3
  out[3] = state[7];
  out[7] = state[11];
  out[11] = state[15];
  out[15] = state[3];
  return out;
}

/** Perform MixColumns transformation */
export function mixColumns(state: Uint8Array): Uint8Array {
  const out = new Uint8Array(16);
  for (let c = 0; c < 4; c++) {
    const s0 = state[4 * c];
    const s1 = state[4 * c + 1];
    const s2 = state[4 * c + 2];
    const s3 = state[4 * c + 3];

    out[4 * c] = gmul(0x02, s0) ^ gmul(0x03, s1) ^ s2 ^ s3;
    out[4 * c + 1] = s0 ^ gmul(0x02, s1) ^ gmul(0x03, s2) ^ s3;
    out[4 * c + 2] = s0 ^ s1 ^ gmul(0x02, s2) ^ gmul(0x03, s3);
    out[4 * c + 3] = gmul(0x03, s0) ^ s1 ^ s2 ^ gmul(0x02, s3);
  }
  return out;
}

/** Perform InvMixColumns transformation */
export function invMixColumns(state: Uint8Array): Uint8Array {
  const out = new Uint8Array(16);
  for (let c = 0; c < 4; c++) {
    const s0 = state[4 * c];
    const s1 = state[4 * c + 1];
    const s2 = state[4 * c + 2];
    const s3 = state[4 * c + 3];

    out[4 * c] = gmul(0x0e, s0) ^ gmul(0x0b, s1) ^ gmul(0x0d, s2) ^ gmul(0x09, s3);
    out[4 * c + 1] = gmul(0x09, s0) ^ gmul(0x0e, s1) ^ gmul(0x0b, s2) ^ gmul(0x0d, s3);
    out[4 * c + 2] = gmul(0x0d, s0) ^ gmul(0x09, s1) ^ gmul(0x0e, s2) ^ gmul(0x0b, s3);
    out[4 * c + 3] = gmul(0x0b, s0) ^ gmul(0x0d, s1) ^ gmul(0x09, s2) ^ gmul(0x0e, s3);
  }
  return out;
}

/** Perform AddRoundKey transformation */
export function addRoundKey(state: Uint8Array, roundKey: Uint8Array): Uint8Array {
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    out[i] = state[i] ^ roundKey[i];
  }
  return out;
}

/** Encrypt a single 16-byte block with full step telemetry generation */
export function encryptBlockWithTelemetry(
  blockBytes: Uint8Array,
  roundKeys: Uint8Array[],
  blockIndex = 0,
  totalBlocks = 1,
): { ciphertext: Uint8Array; steps: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  const Nr = roundKeys.length - 1; // 10, 12, or 14

  let state = new Uint8Array(blockBytes);
  const blockPrefix = totalBlocks > 1 ? `[Block ${blockIndex + 1}/${totalBlocks}] ` : '';

  // Initial State Step
  let prevStateMatrix = stateToMatrix(state);
  steps.push({
    id: `aes-enc-block-${blockIndex}-init`,
    title: `${blockPrefix}Initial State Matrix`,
    phase: 'State Loading',
    description: `Plaintext loaded into $4 \\times 4$ column-major byte matrix ($16$ bytes).`,
    data: {
      roundIndex: 0,
      totalRounds: Nr,
      phase: 'Initialization',
      subStep: 'Plaintext Loading',
      stateMatrix: prevStateMatrix,
      blockIndex,
      totalBlocks,
    },
    visualizationType: 'aes-state-matrix',
  });

  // Round 0: Initial AddRoundKey
  let prevMatrix = cloneMatrix(prevStateMatrix);
  state = addRoundKey(state, roundKeys[0]);
  let currentMatrix = stateToMatrix(state);
  let rkMatrix = stateToMatrix(roundKeys[0]);

  steps.push({
    id: `aes-enc-block-${blockIndex}-round-0`,
    title: `${blockPrefix}Round 0: AddRoundKey`,
    phase: 'Round 0',
    description: `Initial Whitening: State matrix XORed with Round Key 0 ($W[0..3]$).`,
    data: {
      roundIndex: 0,
      totalRounds: Nr,
      phase: 'Initial Whitening',
      subStep: 'AddRoundKey(W[0..3])',
      prevStateMatrix: prevMatrix,
      stateMatrix: currentMatrix,
      roundKeyMatrix: rkMatrix,
      operationName: 'AddRoundKey',
    },
    visualizationType: 'aes-state-matrix',
  });

  // Main Rounds: 1 to Nr - 1
  for (let r = 1; r < Nr; r++) {
    // 1. SubBytes
    prevMatrix = cloneMatrix(currentMatrix);
    state = subBytes(state);
    currentMatrix = stateToMatrix(state);
    steps.push({
      id: `aes-enc-block-${blockIndex}-round-${r}-subbytes`,
      title: `${blockPrefix}Round ${r}: SubBytes`,
      phase: `Round ${r}/${Nr}`,
      description: `Non-linear byte substitution using the AES S-box over $GF(2^8)$.`,
      data: {
        roundIndex: r,
        totalRounds: Nr,
        phase: `Round ${r}`,
        subStep: 'SubBytes',
        prevStateMatrix: prevMatrix,
        stateMatrix: currentMatrix,
        operationName: 'SubBytes',
      },
      visualizationType: 'aes-state-matrix',
    });

    // 2. ShiftRows
    prevMatrix = cloneMatrix(currentMatrix);
    state = shiftRows(state);
    currentMatrix = stateToMatrix(state);
    steps.push({
      id: `aes-enc-block-${blockIndex}-round-${r}-shiftrows`,
      title: `${blockPrefix}Round ${r}: ShiftRows`,
      phase: `Round ${r}/${Nr}`,
      description: `Cyclic row permutations: Row 0 shifted 0B, Row 1 shifted 1B, Row 2 shifted 2B, Row 3 shifted 3B left.`,
      data: {
        roundIndex: r,
        totalRounds: Nr,
        phase: `Round ${r}`,
        subStep: 'ShiftRows',
        prevStateMatrix: prevMatrix,
        stateMatrix: currentMatrix,
        operationName: 'ShiftRows',
      },
      visualizationType: 'aes-state-matrix',
    });

    // 3. MixColumns
    prevMatrix = cloneMatrix(currentMatrix);
    state = mixColumns(state);
    currentMatrix = stateToMatrix(state);
    steps.push({
      id: `aes-enc-block-${blockIndex}-round-${r}-mixcolumns`,
      title: `${blockPrefix}Round ${r}: MixColumns`,
      phase: `Round ${r}/${Nr}`,
      description: `Diffusion stage: Matrix multiplication of each column in $GF(2^8)$ modulo $x^4 + 1$.`,
      data: {
        roundIndex: r,
        totalRounds: Nr,
        phase: `Round ${r}`,
        subStep: 'MixColumns',
        prevStateMatrix: prevMatrix,
        stateMatrix: currentMatrix,
        operationName: 'MixColumns',
      },
      visualizationType: 'aes-state-matrix',
    });

    // 4. AddRoundKey
    prevMatrix = cloneMatrix(currentMatrix);
    state = addRoundKey(state, roundKeys[r]);
    currentMatrix = stateToMatrix(state);
    rkMatrix = stateToMatrix(roundKeys[r]);
    steps.push({
      id: `aes-enc-block-${blockIndex}-round-${r}-addroundkey`,
      title: `${blockPrefix}Round ${r}: AddRoundKey`,
      phase: `Round ${r}/${Nr}`,
      description: `Key mixing: State matrix XORed with Round Key ${r} ($W[${4 * r}..${4 * r + 3}]$).`,
      data: {
        roundIndex: r,
        totalRounds: Nr,
        phase: `Round ${r}`,
        subStep: `AddRoundKey(W[${4 * r}..${4 * r + 3}])`,
        prevStateMatrix: prevMatrix,
        stateMatrix: currentMatrix,
        roundKeyMatrix: rkMatrix,
        operationName: 'AddRoundKey',
      },
      visualizationType: 'aes-state-matrix',
    });
  }

  // Final Round: Nr (SubBytes -> ShiftRows -> AddRoundKey, NO MixColumns)
  prevMatrix = cloneMatrix(currentMatrix);
  state = subBytes(state);
  currentMatrix = stateToMatrix(state);
  steps.push({
    id: `aes-enc-block-${blockIndex}-round-${Nr}-subbytes`,
    title: `${blockPrefix}Final Round ${Nr}: SubBytes`,
    phase: `Final Round ${Nr}`,
    description: `Final non-linear S-box byte substitution.`,
    data: {
      roundIndex: Nr,
      totalRounds: Nr,
      phase: `Final Round ${Nr}`,
      subStep: 'SubBytes',
      prevStateMatrix: prevMatrix,
      stateMatrix: currentMatrix,
      operationName: 'SubBytes',
    },
    visualizationType: 'aes-state-matrix',
  });

  prevMatrix = cloneMatrix(currentMatrix);
  state = shiftRows(state);
  currentMatrix = stateToMatrix(state);
  steps.push({
    id: `aes-enc-block-${blockIndex}-round-${Nr}-shiftrows`,
    title: `${blockPrefix}Final Round ${Nr}: ShiftRows`,
    phase: `Final Round ${Nr}`,
    description: `Final cyclic row permutations.`,
    data: {
      roundIndex: Nr,
      totalRounds: Nr,
      phase: `Final Round ${Nr}`,
      subStep: 'ShiftRows',
      prevStateMatrix: prevMatrix,
      stateMatrix: currentMatrix,
      operationName: 'ShiftRows',
    },
    visualizationType: 'aes-state-matrix',
  });

  prevMatrix = cloneMatrix(currentMatrix);
  state = addRoundKey(state, roundKeys[Nr]);
  currentMatrix = stateToMatrix(state);
  rkMatrix = stateToMatrix(roundKeys[Nr]);
  steps.push({
    id: `aes-enc-block-${blockIndex}-round-${Nr}-addroundkey`,
    title: `${blockPrefix}Final Round ${Nr}: AddRoundKey (Ciphertext Out)`,
    phase: `Final Round ${Nr}`,
    description: `Final Round Key XOR: Yields final 16-byte Ciphertext block.`,
    data: {
      roundIndex: Nr,
      totalRounds: Nr,
      phase: `Final Round ${Nr}`,
      subStep: `AddRoundKey(W[${4 * Nr}..${4 * Nr + 3}])`,
      prevStateMatrix: prevMatrix,
      stateMatrix: currentMatrix,
      roundKeyMatrix: rkMatrix,
      operationName: 'AddRoundKey',
    },
    visualizationType: 'aes-state-matrix',
  });

  return { ciphertext: state, steps };
}

/** Decrypt a single 16-byte block with full step telemetry generation */
export function decryptBlockWithTelemetry(
  cipherBlockBytes: Uint8Array,
  roundKeys: Uint8Array[],
  blockIndex = 0,
  totalBlocks = 1,
): { plaintext: Uint8Array; steps: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  const Nr = roundKeys.length - 1; // 10, 12, or 14

  let state = new Uint8Array(cipherBlockBytes);
  const blockPrefix = totalBlocks > 1 ? `[Block ${blockIndex + 1}/${totalBlocks}] ` : '';

  // Initial State Step
  let prevStateMatrix = stateToMatrix(state);
  steps.push({
    id: `aes-dec-block-${blockIndex}-init`,
    title: `${blockPrefix}Initial Ciphertext Matrix`,
    phase: 'State Loading',
    description: `Ciphertext block loaded into $4 \\times 4$ byte matrix ($16$ bytes).`,
    data: {
      roundIndex: Nr,
      totalRounds: Nr,
      phase: 'Initialization',
      subStep: 'Ciphertext Loading',
      stateMatrix: prevStateMatrix,
      blockIndex,
      totalBlocks,
    },
    visualizationType: 'aes-state-matrix',
  });

  // Round 0 (Decryption): AddRoundKey with Final Round Key Nr
  let prevMatrix = cloneMatrix(prevStateMatrix);
  state = addRoundKey(state, roundKeys[Nr]);
  let currentMatrix = stateToMatrix(state);
  let rkMatrix = stateToMatrix(roundKeys[Nr]);

  steps.push({
    id: `aes-dec-block-${blockIndex}-round-0`,
    title: `${blockPrefix}Inv-Round 0: AddRoundKey(W[${4 * Nr}..${4 * Nr + 3}])`,
    phase: 'Round 0',
    description: `Initial Decryption Whitening: State XORed with Round Key ${Nr}.`,
    data: {
      roundIndex: Nr,
      totalRounds: Nr,
      phase: 'Initial Whitening',
      subStep: `AddRoundKey(W[${4 * Nr}..${4 * Nr + 3}])`,
      prevStateMatrix: prevMatrix,
      stateMatrix: currentMatrix,
      roundKeyMatrix: rkMatrix,
      operationName: 'AddRoundKey',
    },
    visualizationType: 'aes-state-matrix',
  });

  // Main Inversion Rounds: Nr - 1 down to 1
  for (let r = Nr - 1; r >= 1; r--) {
    // 1. InvShiftRows
    prevMatrix = cloneMatrix(currentMatrix);
    state = invShiftRows(state);
    currentMatrix = stateToMatrix(state);
    steps.push({
      id: `aes-dec-block-${blockIndex}-round-${r}-invshiftrows`,
      title: `${blockPrefix}Inv-Round ${Nr - r}: InvShiftRows`,
      phase: `Inv-Round ${Nr - r}/${Nr}`,
      description: `Inverse cyclic row permutations: Row 1 shifted 1B, Row 2 shifted 2B, Row 3 shifted 3B right.`,
      data: {
        roundIndex: r,
        totalRounds: Nr,
        phase: `Inv-Round ${Nr - r}`,
        subStep: 'InvShiftRows',
        prevStateMatrix: prevMatrix,
        stateMatrix: currentMatrix,
        operationName: 'InvShiftRows',
      },
      visualizationType: 'aes-state-matrix',
    });

    // 2. InvSubBytes
    prevMatrix = cloneMatrix(currentMatrix);
    state = invSubBytes(state);
    currentMatrix = stateToMatrix(state);
    steps.push({
      id: `aes-dec-block-${blockIndex}-round-${r}-invsubbytes`,
      title: `${blockPrefix}Inv-Round ${Nr - r}: InvSubBytes`,
      phase: `Inv-Round ${Nr - r}/${Nr}`,
      description: `Inverse S-box byte substitution lookup.`,
      data: {
        roundIndex: r,
        totalRounds: Nr,
        phase: `Inv-Round ${Nr - r}`,
        subStep: 'InvSubBytes',
        prevStateMatrix: prevMatrix,
        stateMatrix: currentMatrix,
        operationName: 'InvSubBytes',
      },
      visualizationType: 'aes-state-matrix',
    });

    // 3. AddRoundKey
    prevMatrix = cloneMatrix(currentMatrix);
    state = addRoundKey(state, roundKeys[r]);
    currentMatrix = stateToMatrix(state);
    rkMatrix = stateToMatrix(roundKeys[r]);
    steps.push({
      id: `aes-dec-block-${blockIndex}-round-${r}-addroundkey`,
      title: `${blockPrefix}Inv-Round ${Nr - r}: AddRoundKey(W[${4 * r}..${4 * r + 3}])`,
      phase: `Inv-Round ${Nr - r}/${Nr}`,
      description: `Round key mixing with Round Key ${r}.`,
      data: {
        roundIndex: r,
        totalRounds: Nr,
        phase: `Inv-Round ${Nr - r}`,
        subStep: `AddRoundKey(W[${4 * r}..${4 * r + 3}])`,
        prevStateMatrix: prevMatrix,
        stateMatrix: currentMatrix,
        roundKeyMatrix: rkMatrix,
        operationName: 'AddRoundKey',
      },
      visualizationType: 'aes-state-matrix',
    });

    // 4. InvMixColumns
    prevMatrix = cloneMatrix(currentMatrix);
    state = invMixColumns(state);
    currentMatrix = stateToMatrix(state);
    steps.push({
      id: `aes-dec-block-${blockIndex}-round-${r}-invmixcolumns`,
      title: `${blockPrefix}Inv-Round ${Nr - r}: InvMixColumns`,
      phase: `Inv-Round ${Nr - r}/${Nr}`,
      description: `Inverse column diffusion matrix multiplication in $GF(2^8)$.`,
      data: {
        roundIndex: r,
        totalRounds: Nr,
        phase: `Inv-Round ${Nr - r}`,
        subStep: 'InvMixColumns',
        prevStateMatrix: prevMatrix,
        stateMatrix: currentMatrix,
        operationName: 'InvMixColumns',
      },
      visualizationType: 'aes-state-matrix',
    });
  }

  // Final Inversion Round (Round 0): InvShiftRows -> InvSubBytes -> AddRoundKey(W[0..3])
  prevMatrix = cloneMatrix(currentMatrix);
  state = invShiftRows(state);
  currentMatrix = stateToMatrix(state);
  steps.push({
    id: `aes-dec-block-${blockIndex}-final-invshiftrows`,
    title: `${blockPrefix}Final Inv-Round ${Nr}: InvShiftRows`,
    phase: `Final Inv-Round ${Nr}`,
    description: `Final inverse row permutations.`,
    data: {
      roundIndex: 0,
      totalRounds: Nr,
      phase: `Final Inv-Round ${Nr}`,
      subStep: 'InvShiftRows',
      prevStateMatrix: prevMatrix,
      stateMatrix: currentMatrix,
      operationName: 'InvShiftRows',
    },
    visualizationType: 'aes-state-matrix',
  });

  prevMatrix = cloneMatrix(currentMatrix);
  state = invSubBytes(state);
  currentMatrix = stateToMatrix(state);
  steps.push({
    id: `aes-dec-block-${blockIndex}-final-invsubbytes`,
    title: `${blockPrefix}Final Inv-Round ${Nr}: InvSubBytes`,
    phase: `Final Inv-Round ${Nr}`,
    description: `Final inverse S-box substitution.`,
    data: {
      roundIndex: 0,
      totalRounds: Nr,
      phase: `Final Inv-Round ${Nr}`,
      subStep: 'InvSubBytes',
      prevStateMatrix: prevMatrix,
      stateMatrix: currentMatrix,
      operationName: 'InvSubBytes',
    },
    visualizationType: 'aes-state-matrix',
  });

  prevMatrix = cloneMatrix(currentMatrix);
  state = addRoundKey(state, roundKeys[0]);
  currentMatrix = stateToMatrix(state);
  rkMatrix = stateToMatrix(roundKeys[0]);
  steps.push({
    id: `aes-dec-block-${blockIndex}-final-addroundkey`,
    title: `${blockPrefix}Final Inv-Round ${Nr}: AddRoundKey (Plaintext Recovered)`,
    phase: `Final Inv-Round ${Nr}`,
    description: `Final Round Key 0 XOR: Plaintext block recovered.`,
    data: {
      roundIndex: 0,
      totalRounds: Nr,
      phase: `Final Inv-Round ${Nr}`,
      subStep: 'AddRoundKey(W[0..3])',
      prevStateMatrix: prevMatrix,
      stateMatrix: currentMatrix,
      roundKeyMatrix: rkMatrix,
      operationName: 'AddRoundKey',
    },
    visualizationType: 'aes-state-matrix',
  });

  return { plaintext: state, steps };
}
