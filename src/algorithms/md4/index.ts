import { AlgorithmPlugin, AlgorithmInfo, ComputationStep, ComputationResult } from '../types';
import {
  stringToBytes,
  bytesToHex,
  uint32ToHex,
  uint32ToBinary,
  rotl32,
  add32,
} from '../utils';

export const md4Info: AlgorithmInfo = {
  name: 'MD4',
  family: 'MD',
  digestSize: 128,
  blockSize: 512,
  description: 'MD4 (Message-Digest 4, RFC 1320) is a 128-bit cryptographic hash designed by Ron Rivest in 1990. It introduced the 3-round ARX construction that influenced MD5, SHA-1, and SHA-2.',
  useCases: ['NTLM password hashing (Windows legacy)', 'Historical protocol compatibility'],
  security: 'broken',
  securityNote: 'Vulnerable to practical collision attacks with complexity under 2^2. Completely broken cryptographically.',
  year: 1990,
  designers: ['Ronald Rivest'],
};

// Bitwise non-linear functions
function F(x: number, y: number, z: number): number {
  return ((x & y) | (~x & z)) >>> 0;
}
function G(x: number, y: number, z: number): number {
  return ((x & y) | (x & z) | (y & z)) >>> 0;
}
function H(x: number, y: number, z: number): number {
  return (x ^ y ^ z) >>> 0;
}

// Step definitions for 48 steps (3 rounds of 16)
interface MD4StepDef {
  round: number;
  kIndex: number;
  shift: number;
  constant: number;
  funcName: string;
}

const MD4_STEPS: MD4StepDef[] = [];

// Round 1
const S1 = [3, 7, 11, 19];
for (let i = 0; i < 16; i++) {
  MD4_STEPS.push({
    round: 1,
    kIndex: i,
    shift: S1[i % 4],
    constant: 0,
    funcName: 'F(B,C,D) = (B∧C)∨(¬B∧D)',
  });
}

// Round 2
const S2 = [3, 5, 9, 13];
const K2 = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15];
for (let i = 0; i < 16; i++) {
  MD4_STEPS.push({
    round: 2,
    kIndex: K2[i],
    shift: S2[i % 4],
    constant: 0x5a827999,
    funcName: 'G(B,C,D) = (B∧C)∨(B∧D)∨(C∧D)',
  });
}

// Round 3
const S3 = [3, 9, 11, 15];
const K3 = [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15];
for (let i = 0; i < 16; i++) {
  MD4_STEPS.push({
    round: 3,
    kIndex: K3[i],
    shift: S3[i % 4],
    constant: 0x6ed9eba1,
    funcName: 'H(B,C,D) = B⊕C⊕D',
  });
}

export class MD4Plugin implements AlgorithmPlugin {
  info = md4Info;

  compute(input: string): ComputationResult {
    const steps: ComputationStep[] = [];
    const inputBytes = stringToBytes(input);
    const bitLength = BigInt(inputBytes.length) * 8n;

    // 1. Input encoding
    steps.push({
      id: 'input-encoding',
      title: 'Input Encoding',
      phase: 'Preprocessing',
      description: `Convert input string to UTF-8 bytes (${inputBytes.length} bytes / ${Number(bitLength)} bits).`,
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
    view.setBigUint64(totalLength - 8, bitLength, true); // Little-endian length

    steps.push({
      id: 'padding',
      title: 'Message Padding (Little-Endian)',
      phase: 'Preprocessing',
      description: `Pad message to 512 bits. Append 0x80, ${k} zero bytes, and 64-bit little-endian bit length (${Number(bitLength)} bits).`,
      data: {
        originalBits: Number(bitLength),
        zeroPaddingBytes: k,
        lengthField: uint32ToHex(view.getUint32(totalLength - 8, true)) + uint32ToHex(view.getUint32(totalLength - 4, true)),
        paddedHex: bytesToHex(paddedBytes),
        totalBits: totalLength * 8,
        totalBlocks: totalLength / 64,
      },
      visualizationType: 'binary-transform',
    });

    // 3. Initial state
    let A = 0x67452301;
    let B = 0xefcdab89;
    let C = 0x98badcfe;
    let D = 0x10325476;

    const fullConstants = MD4_STEPS.map((stepDef, idx) => ({
      index: idx,
      hex: uint32ToHex(stepDef.constant),
      binary: uint32ToBinary(stepDef.constant),
    }));

    steps.push({
      id: 'init-state',
      title: 'Initialize 32-Bit State Registers',
      phase: 'Preprocessing',
      description: 'Initialize registers A, B, C, D with standard MD4 IVs.',
      data: {
        variables: [
          { label: 'A', hex: uint32ToHex(A), binary: uint32ToBinary(A) },
          { label: 'B', hex: uint32ToHex(B), binary: uint32ToBinary(B) },
          { label: 'C', hex: uint32ToHex(C), binary: uint32ToBinary(C) },
          { label: 'D', hex: uint32ToHex(D), binary: uint32ToBinary(D) },
        ],
        constants: fullConstants,
      },
      visualizationType: 'round-computation',
    });

    // 4. Process 512-bit blocks
    const numBlocks = totalLength / 64;

    for (let blockIdx = 0; blockIdx < numBlocks; blockIdx++) {
      const offset = blockIdx * 64;
      const M = new Array<number>(16);
      for (let j = 0; j < 16; j++) {
        M[j] = view.getUint32(offset + j * 4, true); // Little-endian word
      }

      const fullSchedule = M.map((word, idx) => ({
        index: idx,
        hex: uint32ToHex(word),
        binary: uint32ToBinary(word),
        computed: true,
      }));

      let a = A, b = B, c = C, d = D;

      for (let stepIdx = 0; stepIdx < 48; stepIdx++) {
        const { round, kIndex, shift, constant, funcName } = MD4_STEPS[stepIdx];
        let fVal = 0;
        if (round === 1) fVal = F(b, c, d);
        else if (round === 2) fVal = G(b, c, d);
        else fVal = H(b, c, d);

        const sum = add32(a, fVal, M[kIndex], constant);
        const rotated = rotl32(sum, shift);

        const prevA = a, prevB = b, prevC = c, prevD = d;
        const newA = d;
        const newB = rotated;
        const newC = b;
        const newD = c;

        a = newA;
        b = newB;
        c = newC;
        d = newD;

        steps.push({
          id: `block-${blockIdx}-step-${stepIdx}`,
          title: `MD4 Round ${round} Step ${stepIdx + 1} of 48`,
          phase: 'Compression',
          description: `Round ${round} (Step ${stepIdx + 1}):\n${funcName}\nA = (A + Function(B,C,D) + M[${kIndex}] + 0x${uint32ToHex(constant)}) <<< ${shift}`,
          data: {
            roundIndex: stepIdx,
            scheduleIndex: kIndex,
            schedule: fullSchedule.map((item) => ({
              ...item,
              active: item.index === kIndex,
            })),
            constants: fullConstants.map((item) => ({
              ...item,
              active: item.index === stepIdx,
            })),
            activeW: {
              index: kIndex,
              hex: uint32ToHex(M[kIndex]),
              binary: uint32ToBinary(M[kIndex]),
              active: true,
            },
            activeK: {
              index: stepIdx,
              hex: uint32ToHex(constant),
              binary: uint32ToBinary(constant),
              active: true,
            },
            prevVariables: [
              { label: 'A', hex: uint32ToHex(prevA), binary: uint32ToBinary(prevA) },
              { label: 'B', hex: uint32ToHex(prevB), binary: uint32ToBinary(prevB) },
              { label: 'C', hex: uint32ToHex(prevC), binary: uint32ToBinary(prevC) },
              { label: 'D', hex: uint32ToHex(prevD), binary: uint32ToBinary(prevD) },
            ],
            newVariables: [
              { label: 'A', hex: uint32ToHex(a), binary: uint32ToBinary(a) },
              { label: 'B', hex: uint32ToHex(b), binary: uint32ToBinary(b) },
              { label: 'C', hex: uint32ToHex(c), binary: uint32ToBinary(c) },
              { label: 'D', hex: uint32ToHex(d), binary: uint32ToBinary(d) },
            ],
            md5Step: {
              fName: round === 1 ? 'F' : round === 2 ? 'G' : 'H',
              fVal: { hex: uint32ToHex(fVal), binary: uint32ToBinary(fVal) },
              sum: { hex: uint32ToHex(sum), binary: uint32ToBinary(sum) },
              shift,
              rotated: { hex: uint32ToHex(rotated), binary: uint32ToBinary(rotated) },
              kIndex,
              wVal: { hex: uint32ToHex(M[kIndex]), binary: uint32ToBinary(M[kIndex]) },
              tVal: { hex: uint32ToHex(constant), binary: uint32ToBinary(constant) },
              newB: { hex: uint32ToHex(b), binary: uint32ToBinary(b) },
            },
          },
          visualizationType: 'round-computation',
        });
      }

      // Accumulate
      const prevA = A, prevB = B, prevC = C, prevD = D;
      A = add32(A, a);
      B = add32(B, b);
      C = add32(C, c);
      D = add32(D, d);

      steps.push({
        id: `block-${blockIdx}-update`,
        title: `Block ${blockIdx + 1} State Accumulation`,
        phase: 'Compression',
        description: 'Add compressed working variables to state registers A, B, C, D (mod 2³²).',
        data: {
          schedule: fullSchedule,
          constants: fullConstants,
          variables: [
            { label: 'A', hex: uint32ToHex(A), binary: uint32ToBinary(A) },
            { label: 'B', hex: uint32ToHex(B), binary: uint32ToBinary(B) },
            { label: 'C', hex: uint32ToHex(C), binary: uint32ToBinary(C) },
            { label: 'D', hex: uint32ToHex(D), binary: uint32ToBinary(D) },
          ],
          updates: [
            { label: 'REG.A', prevHex: uint32ToHex(prevA), addHex: uint32ToHex(a), newHex: uint32ToHex(A) },
            { label: 'REG.B', prevHex: uint32ToHex(prevB), addHex: uint32ToHex(b), newHex: uint32ToHex(B) },
            { label: 'REG.C', prevHex: uint32ToHex(prevC), addHex: uint32ToHex(c), newHex: uint32ToHex(C) },
            { label: 'REG.D', prevHex: uint32ToHex(prevD), addHex: uint32ToHex(d), newHex: uint32ToHex(D) },
          ],
        },
        visualizationType: 'round-computation',
      });
    }

    // 5. Final digest (little-endian byte order)
    function wordToLittleEndianHex(val: number): string {
      const b0 = (val & 0xff).toString(16).padStart(2, '0');
      const b1 = ((val >>> 8) & 0xff).toString(16).padStart(2, '0');
      const b2 = ((val >>> 16) & 0xff).toString(16).padStart(2, '0');
      const b3 = ((val >>> 24) & 0xff).toString(16).padStart(2, '0');
      return b0 + b1 + b2 + b3;
    }

    const finalDigest =
      wordToLittleEndianHex(A) +
      wordToLittleEndianHex(B) +
      wordToLittleEndianHex(C) +
      wordToLittleEndianHex(D);

    steps.push({
      id: 'final-digest',
      title: 'Final Digest Assembly',
      phase: 'Finalization',
      description: 'Convert registers A, B, C, D to little-endian hex to assemble the 128-bit MD4 digest.',
      data: {
        hashValues: [
          { label: 'A (LE)', hex: wordToLittleEndianHex(A) },
          { label: 'B (LE)', hex: wordToLittleEndianHex(B) },
          { label: 'C (LE)', hex: wordToLittleEndianHex(C) },
          { label: 'D (LE)', hex: wordToLittleEndianHex(D) },
        ],
        digest: finalDigest,
      },
      visualizationType: 'final-digest',
    });

    return { digest: finalDigest, steps };
  }
}

export default new MD4Plugin();
