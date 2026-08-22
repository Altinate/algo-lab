/**
 * ChaCha20 Stream Cipher Core Block Function (IETF RFC 8439 Section 2.3 & 2.4)
 */

import { CHACHA20_CONSTANTS, QR_ROTATIONS } from './constants';
import { rotl32, add32, uint32ToHex } from '../../utils';
import type { ComputationStep } from '../../types';

export interface GCallDetail {
  label: string;
  stepType: 'column' | 'diagonal';
  indices: [number, number, number, number];
  inputs: {
    va: string;
    vb: string;
    vc: string;
    vd: string;
  };
  outputs: {
    va: string;
    vb: string;
    vc: string;
    vd: string;
  };
  rotations: number[];
}

/** Execute ChaCha20 Quarter-Round QR(a, b, c, d) */
export function quarterRound(
  state: Uint32Array,
  a: number,
  b: number,
  c: number,
  d: number,
): GCallDetail {
  const inA = state[a];
  const inB = state[b];
  const inC = state[c];
  const inD = state[d];

  state[a] = add32(state[a], state[b]);
  state[d] = rotl32(state[d] ^ state[a], 16);

  state[c] = add32(state[c], state[d]);
  state[b] = rotl32(state[b] ^ state[c], 12);

  state[a] = add32(state[a], state[b]);
  state[d] = rotl32(state[d] ^ state[a], 8);

  state[c] = add32(state[c], state[d]);
  state[b] = rotl32(state[b] ^ state[c], 7);

  return {
    label: `QR(${a}, ${b}, ${c}, ${d})`,
    stepType: a === 0 && b === 4 ? 'column' : 'diagonal',
    indices: [a, b, c, d],
    inputs: {
      va: uint32ToHex(inA),
      vb: uint32ToHex(inB),
      vc: uint32ToHex(inC),
      vd: uint32ToHex(inD),
    },
    outputs: {
      va: uint32ToHex(state[a]),
      vb: uint32ToHex(state[b]),
      vc: uint32ToHex(state[c]),
      vd: uint32ToHex(state[d]),
    },
    rotations: [...QR_ROTATIONS],
  };
}

/** Initialize 16-word ChaCha20 state matrix from Key (32B), Counter (4B), and Nonce (12B) */
export function initChaChaState(
  keyBytes: Uint8Array,
  counter: number,
  nonceBytes: Uint8Array,
): Uint32Array {
  const state = new Uint32Array(16);

  // Constants (words 0..3)
  state[0] = CHACHA20_CONSTANTS[0];
  state[1] = CHACHA20_CONSTANTS[1];
  state[2] = CHACHA20_CONSTANTS[2];
  state[3] = CHACHA20_CONSTANTS[3];

  // Key (words 4..11, little-endian)
  for (let i = 0; i < 8; i++) {
    state[4 + i] =
      (keyBytes[4 * i] & 0xff) |
      ((keyBytes[4 * i + 1] & 0xff) << 8) |
      ((keyBytes[4 * i + 2] & 0xff) << 16) |
      ((keyBytes[4 * i + 3] & 0xff) << 24);
  }

  // Counter (word 12)
  state[12] = counter >>> 0;

  // Nonce (words 13..15, little-endian)
  for (let i = 0; i < 3; i++) {
    state[13 + i] =
      (nonceBytes[4 * i] & 0xff) |
      ((nonceBytes[4 * i + 1] & 0xff) << 8) |
      ((nonceBytes[4 * i + 2] & 0xff) << 16) |
      ((nonceBytes[4 * i + 3] & 0xff) << 24);
  }

  return state;
}

/** Generate 64-byte ChaCha20 block with step telemetry */
export function chacha20BlockWithTelemetry(
  initState: Uint32Array,
  blockIndex = 0,
  totalBlocks = 1,
): { keystreamBytes: Uint8Array; steps: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  const blockPrefix = totalBlocks > 1 ? `[Block ${blockIndex + 1}/${totalBlocks}] ` : '';

  const workingState = new Uint32Array(initState);

  steps.push({
    id: `chacha20-block-${blockIndex}-init`,
    title: `${blockPrefix}Initial State Loading (4×4 Matrix)`,
    phase: totalBlocks > 1 ? `Block ${blockIndex + 1}: Init` : 'State Loading',
    description: `Loaded Constants (0..3), 256-bit Key (4..11), Block Counter (12: ${initState[12]}), and 96-bit Nonce (13..15) into $4 \\times 4$ ARX state matrix.`,
    data: {
      roundIndex: 0,
      state: Array.from(workingState).map(uint32ToHex),
    },
    visualizationType: 'mixing-function',
  });

  // 20 Rounds (10 double-rounds = 10 column passes + 10 diagonal passes)
  for (let r = 1; r <= 10; r++) {
    const prevColumnState = Array.from(workingState).map(uint32ToHex);

    // 1. Column Round
    const colCalls: GCallDetail[] = [
      quarterRound(workingState, 0, 4, 8, 12),
      quarterRound(workingState, 1, 5, 9, 13),
      quarterRound(workingState, 2, 6, 10, 14),
      quarterRound(workingState, 3, 7, 11, 15),
    ];

    steps.push({
      id: `chacha20-block-${blockIndex}-round-${2 * r - 1}-col`,
      title: `${blockPrefix}Round ${2 * r - 1}/20: Column Quarter-Rounds`,
      phase: totalBlocks > 1 ? `Block ${blockIndex + 1}: Round ${2 * r - 1}` : `Round ${2 * r - 1}/20`,
      description: `Column mixing across 4 parallel lanes: QR(0,4,8,12), QR(1,5,9,13), QR(2,6,10,14), QR(3,7,11,15).`,
      data: {
        roundIndex: 2 * r - 1,
        mixType: 'Column Rounds',
        prevState: prevColumnState,
        state: Array.from(workingState).map(uint32ToHex),
        gCalls: colCalls,
      },
      visualizationType: 'mixing-function',
    });

    const prevDiagState = Array.from(workingState).map(uint32ToHex);

    // 2. Diagonal Round
    const diagCalls: GCallDetail[] = [
      quarterRound(workingState, 0, 5, 10, 15),
      quarterRound(workingState, 1, 6, 11, 12),
      quarterRound(workingState, 2, 7, 8, 13),
      quarterRound(workingState, 3, 4, 9, 14),
    ];

    steps.push({
      id: `chacha20-block-${blockIndex}-round-${2 * r}-diag`,
      title: `${blockPrefix}Round ${2 * r}/20: Diagonal Quarter-Rounds`,
      phase: totalBlocks > 1 ? `Block ${blockIndex + 1}: Round ${2 * r}` : `Round ${2 * r}/20`,
      description: `Diagonal mixing across 4 diagonal lanes: QR(0,5,10,15), QR(1,6,11,12), QR(2,7,8,13), QR(3,4,9,14).`,
      data: {
        roundIndex: 2 * r,
        mixType: 'Diagonal Rounds',
        prevState: prevDiagState,
        state: Array.from(workingState).map(uint32ToHex),
        gCalls: diagCalls,
      },
      visualizationType: 'mixing-function',
    });
  }

  // Final State Addition: state[i] = workingState[i] + initState[i] (mod 2^32)
  const prevAddState = Array.from(workingState).map(uint32ToHex);
  const outWords = new Uint32Array(16);
  for (let i = 0; i < 16; i++) {
    outWords[i] = add32(workingState[i], initState[i]);
  }

  // Convert 16 words to 64 bytes (little-endian)
  const keystream = new Uint8Array(64);
  for (let i = 0; i < 16; i++) {
    keystream[4 * i] = outWords[i] & 0xff;
    keystream[4 * i + 1] = (outWords[i] >>> 8) & 0xff;
    keystream[4 * i + 2] = (outWords[i] >>> 16) & 0xff;
    keystream[4 * i + 3] = (outWords[i] >>> 24) & 0xff;
  }

  steps.push({
    id: `chacha20-block-${blockIndex}-final-add`,
    title: `${blockPrefix}Final State Addition & Keystream Output`,
    phase: totalBlocks > 1 ? `Block ${blockIndex + 1}: Output` : 'Keystream Output',
    description: `Original state added to permuted state modulo $2^{32}$ ($S_i + S_{0,i}$) producing 64-byte keystream block.`,
    data: {
      roundIndex: 20,
      mixType: 'State Addition',
      prevState: prevAddState,
      state: Array.from(outWords).map(uint32ToHex),
    },
    visualizationType: 'mixing-function',
  });

  return { keystreamBytes: keystream, steps };
}
