import { AlgorithmPlugin, AlgorithmInfo, ComputationStep } from '../types';
import { stringToBytes, bytesToHex, uint32ToHex, uint32ToBinary, leftRotate32 } from '../utils';
import { MD5_INIT, MD5_K, MD5_S } from './constants';
import { F, G, H, I } from './operations';

export const md5Info: AlgorithmInfo = {
  name: 'MD5',
  family: 'MD5',
  digestSize: 128,
  blockSize: 512,
  description: 'MD5 (Message-Digest Algorithm) is a widely used hash function producing a 128-bit hash value.',
  useCases: ['Checksums', 'Non-cryptographic hashing'],
  security: 'broken',
  securityNote: 'Vulnerable to collision attacks (Wang et al., 2004). Do not use for security purposes.',
  year: 1992,
  designers: ['Ronald Rivest'],
};

function formatWord32(w: number) {
  return {
    value: w >>> 0,
    hex: uint32ToHex(w),
    binary: uint32ToBinary(w),
  };
}

export class MD5Plugin implements AlgorithmPlugin {
  info = md5Info;

  compute(input: string) {
    const steps: ComputationStep[] = [];

    const fullConstants = Array.from(MD5_K).map((kVal, idx) => ({
      index: idx,
      hex: uint32ToHex(kVal),
      binary: uint32ToBinary(kVal),
    }));

    const bytes = stringToBytes(input);
    const bitLength = bytes.length * 8;

    steps.push({
      id: 'input-encoding',
      title: 'Input Encoding',
      phase: 'Pre-processing',
      description: `Convert input string to UTF-8 bytes. Total: ${bytes.length} bytes (${bitLength} bits).`,
      data: {
        input: input || '(empty string)',
        bytes: Array.from(bytes),
        hex: bytesToHex(bytes),
        bitLength,
      },
      visualizationType: 'binary-transform',
    });

    // Padding
    const paddingLength = (56 - ((bytes.length + 1) % 64) + 64) % 64;
    const totalLength = bytes.length + 1 + paddingLength + 8;

    const buffer = new Uint8Array(totalLength);
    buffer.set(bytes);
    buffer[bytes.length] = 0x80;

    // Little-endian length
    const lenView = new DataView(buffer.buffer);
    const bitsLower = bitLength >>> 0;
    const bitsUpper = Math.floor(bitLength / 4294967296);
    lenView.setUint32(totalLength - 8, bitsLower, true);
    lenView.setUint32(totalLength - 4, bitsUpper, true);

    steps.push({
      id: 'padding',
      title: 'Message Padding',
      phase: 'Pre-processing',
      description: 'Pad message to a multiple of 512 bits with a 1 bit (0x80), zero fill, and 64-bit little-endian length.',
      data: {
        originalBits: bitLength,
        paddingByte: '10000000 (0x80)',
        zeroPaddingBytes: paddingLength,
        lengthField: uint32ToHex(bitsLower) + uint32ToHex(bitsUpper),
        paddedHex: bytesToHex(buffer),
        totalBits: totalLength * 8,
        totalBlocks: totalLength / 64,
      },
      visualizationType: 'binary-transform',
    });

    const blocks: number[][] = [];
    for (let i = 0; i < buffer.length; i += 64) {
      const block = new Array(16);
      for (let j = 0; j < 16; j++) {
        block[j] = lenView.getUint32(i + j * 4, true);
      }
      blocks.push(block);
    }

    let [A, B, C, D] = MD5_INIT;

    steps.push({
      id: 'init-state',
      title: 'Initialize State',
      phase: 'Pre-processing',
      description: 'Initialize the 4 32-bit state registers A, B, C, D with standard MD5 constants.',
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

    for (let i = 0; i < blocks.length; i++) {
      const M = blocks[i];
      const blockSchedule = M.map((word, idx) => ({
        index: idx,
        hex: uint32ToHex(word),
        binary: uint32ToBinary(word),
        computed: true,
      }));

      let [a, b, c, d] = [A, B, C, D];

      for (let j = 0; j < 64; j++) {
        let f = 0;
        let g = 0;
        let funcName: 'F' | 'G' | 'H' | 'I' = 'F';
        let formula = '';

        if (j < 16) {
          f = F(b, c, d);
          g = j;
          funcName = 'F';
          formula = 'F(B, C, D) = (B ∧ C) ∨ (¬B ∧ D)';
        } else if (j < 32) {
          f = G(b, c, d);
          g = (5 * j + 1) % 16;
          funcName = 'G';
          formula = 'G(B, C, D) = (B ∧ D) ∨ (C ∧ ¬D)';
        } else if (j < 48) {
          f = H(b, c, d);
          g = (3 * j + 5) % 16;
          funcName = 'H';
          formula = 'H(B, C, D) = B ⊕ C ⊕ D';
        } else {
          f = I(b, c, d);
          g = (7 * j) % 16;
          funcName = 'I';
          formula = 'I(B, C, D) = C ⊕ (B ∨ ¬D)';
        }

        const prevA = a;
        const prevB = b;
        const prevC = c;
        const prevD = d;

        const sum1 = (a + f + MD5_K[j] + M[g]) >>> 0;
        const rot = leftRotate32(sum1, MD5_S[j]);
        const newBVal = (b + rot) >>> 0;

        const tempD = d;
        d = c;
        c = b;
        b = newBVal;
        a = tempD;

        steps.push({
          id: `block-${i}-round-${j}`,
          title: `MD5 Round ${j + 1} of 64`,
          phase: 'Compression',
          description: `Round ${j + 1} (${funcName}-function):\n${formula}\n\nTemp = (A + ${funcName} + M[${g}] + K[${j}]) mod 2³²\nB' = B + ROTL(${MD5_S[j]}, Temp)\nRegisters rotate: (A, B, C, D) ← (D, B', B, C)`,
          data: {
            roundIndex: j,
            scheduleIndex: g,
            schedule: blockSchedule.map((item) => ({
              ...item,
              active: item.index === g,
            })),
            constants: fullConstants.map((item) => ({
              ...item,
              active: item.index === j,
            })),
            activeK: {
              index: j,
              hex: uint32ToHex(MD5_K[j]),
              binary: uint32ToBinary(MD5_K[j]),
              active: true,
            },
            activeW: {
              index: g,
              hex: uint32ToHex(M[g]),
              binary: uint32ToBinary(M[g]),
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
              funcName,
              formula,
              shift: MD5_S[j],
              mIndex: g,
              kIndex: j,
              a: formatWord32(prevA),
              b: formatWord32(prevB),
              c: formatWord32(prevC),
              d: formatWord32(prevD),
              fResult: formatWord32(f >>> 0),
              m: formatWord32(M[g]),
              k: formatWord32(MD5_K[j]),
              sum: formatWord32(sum1),
              rotResult: formatWord32(rot),
              newB: formatWord32(newBVal),
            },
          },
          visualizationType: 'round-computation',
        });
      }

      const prevTotalA = A;
      const prevTotalB = B;
      const prevTotalC = C;
      const prevTotalD = D;

      A = (A + a) >>> 0;
      B = (B + b) >>> 0;
      C = (C + c) >>> 0;
      D = (D + d) >>> 0;

      steps.push({
        id: `block-${i}-end`,
        title: `Block ${i + 1} State Accumulation`,
        phase: 'Compression',
        description: 'Add compressed block working variables to the cumulative state hash values (mod 2³²).',
        data: {
          schedule: blockSchedule,
          constants: fullConstants,
          variables: [
            { label: 'A', hex: uint32ToHex(A), binary: uint32ToBinary(A) },
            { label: 'B', hex: uint32ToHex(B), binary: uint32ToBinary(B) },
            { label: 'C', hex: uint32ToHex(C), binary: uint32ToBinary(C) },
            { label: 'D', hex: uint32ToHex(D), binary: uint32ToBinary(D) },
          ],
          updates: [
            { label: 'REG.A', prevHex: uint32ToHex(prevTotalA), addHex: uint32ToHex(a), newHex: uint32ToHex(A) },
            { label: 'REG.B', prevHex: uint32ToHex(prevTotalB), addHex: uint32ToHex(b), newHex: uint32ToHex(B) },
            { label: 'REG.C', prevHex: uint32ToHex(prevTotalC), addHex: uint32ToHex(c), newHex: uint32ToHex(C) },
            { label: 'REG.D', prevHex: uint32ToHex(prevTotalD), addHex: uint32ToHex(d), newHex: uint32ToHex(D) },
          ],
        },
        visualizationType: 'round-computation',
      });
    }

    const digestBuf = new ArrayBuffer(16);
    const digestView = new DataView(digestBuf);
    digestView.setUint32(0, A, true);
    digestView.setUint32(4, B, true);
    digestView.setUint32(8, C, true);
    digestView.setUint32(12, D, true);
    const digestBytes = new Uint8Array(digestBuf);
    const digest = bytesToHex(digestBytes);

    steps.push({
      id: 'final-digest',
      title: 'Final Digest Assembly',
      phase: 'Finalization',
      description: 'Concatenate state variables A, B, C, D in little-endian byte order to produce the final 128-bit MD5 digest.',
      data: {
        hashValues: [
          { label: 'A (LE)', hex: uint32ToHex(A) },
          { label: 'B (LE)', hex: uint32ToHex(B) },
          { label: 'C (LE)', hex: uint32ToHex(C) },
          { label: 'D (LE)', hex: uint32ToHex(D) },
        ],
        digest,
      },
      visualizationType: 'final-digest',
    });

    return { digest, steps };
  }
}

export default new MD5Plugin();
