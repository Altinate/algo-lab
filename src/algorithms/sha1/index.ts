import { AlgorithmPlugin, AlgorithmInfo, ComputationStep } from '../types';
import { stringToBytes, bytesToHex, uint32ToHex, uint32ToBinary, leftRotate32 } from '../utils';
import { SHA1_INIT, SHA1_K } from './constants';
import { Ch, Parity, Maj } from './operations';

export const sha1Info: AlgorithmInfo = {
  name: 'SHA-1',
  family: 'SHA-1',
  digestSize: 160,
  blockSize: 512,
  description: 'SHA-1 (Secure Hash Algorithm 1) produces a 160-bit hash value.',
  useCases: ['Legacy applications', 'Git commit hashes', 'Checksums'],
  security: 'broken',
  securityNote: 'Collision attacks demonstrated (SHAttered, 2017). Deprecated for certificates and signatures.',
  year: 1995,
  designers: ['NSA (National Security Agency)'],
};

function formatWord32(w: number) {
  return {
    value: w >>> 0,
    hex: uint32ToHex(w),
    binary: uint32ToBinary(w),
  };
}

export class SHA1Plugin implements AlgorithmPlugin {
  info = sha1Info;

  compute(input: string) {
    const steps: ComputationStep[] = [];

    // Precompute full 80-round constants array
    const fullConstants = Array.from({ length: 80 }, (_, idx) => {
      let kVal = SHA1_K[0];
      if (idx >= 20 && idx < 40) kVal = SHA1_K[1];
      else if (idx >= 40 && idx < 60) kVal = SHA1_K[2];
      else if (idx >= 60) kVal = SHA1_K[3];

      return {
        index: idx,
        hex: uint32ToHex(kVal),
        binary: uint32ToBinary(kVal),
      };
    });

    const bytes = stringToBytes(input);
    const bitLength = bytes.length * 8;

    steps.push({
      id: 'input-encoding',
      title: 'Input Encoding',
      phase: 'Pre-processing',
      description: `Convert string to UTF-8 bytes. Total: ${bytes.length} bytes (${bitLength} bits).`,
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

    // Big-endian length
    const lenView = new DataView(buffer.buffer);
    const bitsLower = bitLength >>> 0;
    const bitsUpper = Math.floor(bitLength / 4294967296);
    lenView.setUint32(totalLength - 8, bitsUpper, false);
    lenView.setUint32(totalLength - 4, bitsLower, false);

    steps.push({
      id: 'padding',
      title: 'Message Padding',
      phase: 'Pre-processing',
      description: 'Pad message to a multiple of 512 bits with a 1 bit (0x80), zeros, and 64-bit big-endian length.',
      data: {
        originalBits: bitLength,
        paddingByte: '10000000 (0x80)',
        zeroPaddingBytes: paddingLength,
        lengthField: uint32ToHex(bitsUpper) + uint32ToHex(bitsLower),
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
        block[j] = lenView.getUint32(i + j * 4, false);
      }
      blocks.push(block);
    }

    let [H0, H1, H2, H3, H4] = SHA1_INIT;

    steps.push({
      id: 'init-state',
      title: 'Initialize State',
      phase: 'Pre-processing',
      description: 'Initialize the 5 32-bit state registers A, B, C, D, E with standard SHA-1 constants.',
      data: {
        variables: [
          { label: 'A', hex: uint32ToHex(H0), binary: uint32ToBinary(H0) },
          { label: 'B', hex: uint32ToHex(H1), binary: uint32ToBinary(H1) },
          { label: 'C', hex: uint32ToHex(H2), binary: uint32ToBinary(H2) },
          { label: 'D', hex: uint32ToHex(H3), binary: uint32ToBinary(H3) },
          { label: 'E', hex: uint32ToHex(H4), binary: uint32ToBinary(H4) },
        ],
        constants: fullConstants,
      },
      visualizationType: 'round-computation',
    });

    for (let i = 0; i < blocks.length; i++) {
      const M = blocks[i];
      const W = new Uint32Array(80);
      for (let t = 0; t < 16; t++) {
        W[t] = M[t];
      }
      for (let t = 16; t < 80; t++) {
        W[t] = leftRotate32(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
      }

      const fullSchedule = Array.from(W).map((word, idx) => ({
        index: idx,
        hex: uint32ToHex(word),
        binary: uint32ToBinary(word),
        computed: true,
      }));

      let a = H0;
      let b = H1;
      let c = H2;
      let d = H3;
      let e = H4;

      for (let t = 0; t < 80; t++) {
        let f = 0;
        let k = SHA1_K[0];
        let funcName: 'Ch' | 'Parity' | 'Maj' = 'Ch';
        let formula = '';

        if (t < 20) {
          f = Ch(b, c, d);
          k = SHA1_K[0];
          funcName = 'Ch';
          formula = 'Ch(B, C, D) = (B ∧ C) ⊕ (¬B ∧ D)';
        } else if (t < 40) {
          f = Parity(b, c, d);
          k = SHA1_K[1];
          funcName = 'Parity';
          formula = 'Parity(B, C, D) = B ⊕ C ⊕ D';
        } else if (t < 60) {
          f = Maj(b, c, d);
          k = SHA1_K[2];
          funcName = 'Maj';
          formula = 'Maj(B, C, D) = (B ∧ C) ⊕ (B ∧ D) ⊕ (C ∧ D)';
        } else {
          f = Parity(b, c, d);
          k = SHA1_K[3];
          funcName = 'Parity';
          formula = 'Parity(B, C, D) = B ⊕ C ⊕ D';
        }

        const prevA = a;
        const prevB = b;
        const prevC = c;
        const prevD = d;
        const prevE = e;

        const rot5A = leftRotate32(a, 5);
        const temp = (rot5A + f + e + k + W[t]) >>> 0;
        const rot30B = leftRotate32(b, 30);

        e = d;
        d = c;
        c = rot30B;
        b = a;
        a = temp;

        steps.push({
          id: `block-${i}-round-${t}`,
          title: `SHA-1 Round ${t + 1} of 80`,
          phase: 'Compression',
          description: `Round ${t + 1} (${funcName}-function):\n${formula}\n\nTemp = ROTL⁵(A) + ${funcName}(B,C,D) + E + K[${t}] + W[${t}] (mod 2³²)\nRegisters update: (A, B, C, D, E) ← (Temp, A, ROTL³⁰(B), C, D)`,
          data: {
            roundIndex: t,
            scheduleIndex: t,
            schedule: fullSchedule.map((item) => ({
              ...item,
              active: item.index === t,
            })),
            constants: fullConstants.map((item) => ({
              ...item,
              active: item.index === t,
            })),
            activeK: {
              index: t,
              hex: uint32ToHex(k),
              binary: uint32ToBinary(k),
              active: true,
            },
            activeW: {
              index: t,
              hex: uint32ToHex(W[t]),
              binary: uint32ToBinary(W[t]),
              active: true,
            },
            prevVariables: [
              { label: 'A', hex: uint32ToHex(prevA), binary: uint32ToBinary(prevA) },
              { label: 'B', hex: uint32ToHex(prevB), binary: uint32ToBinary(prevB) },
              { label: 'C', hex: uint32ToHex(prevC), binary: uint32ToBinary(prevC) },
              { label: 'D', hex: uint32ToHex(prevD), binary: uint32ToBinary(prevD) },
              { label: 'E', hex: uint32ToHex(prevE), binary: uint32ToBinary(prevE) },
            ],
            newVariables: [
              { label: 'A', hex: uint32ToHex(a), binary: uint32ToBinary(a) },
              { label: 'B', hex: uint32ToHex(b), binary: uint32ToBinary(b) },
              { label: 'C', hex: uint32ToHex(c), binary: uint32ToBinary(c) },
              { label: 'D', hex: uint32ToHex(d), binary: uint32ToBinary(d) },
              { label: 'E', hex: uint32ToHex(e), binary: uint32ToBinary(e) },
            ],
            sha1Step: {
              funcName,
              formula,
              t,
              a: formatWord32(prevA),
              b: formatWord32(prevB),
              c: formatWord32(prevC),
              d: formatWord32(prevD),
              e: formatWord32(prevE),
              rot5A: formatWord32(rot5A),
              fResult: formatWord32(f >>> 0),
              w: formatWord32(W[t]),
              k: formatWord32(k),
              temp: formatWord32(temp),
              rot30B: formatWord32(rot30B),
              newA: formatWord32(a),
            },
          },
          visualizationType: 'round-computation',
        });
      }

      const prevH0 = H0;
      const prevH1 = H1;
      const prevH2 = H2;
      const prevH3 = H3;
      const prevH4 = H4;

      H0 = (H0 + a) >>> 0;
      H1 = (H1 + b) >>> 0;
      H2 = (H2 + c) >>> 0;
      H3 = (H3 + d) >>> 0;
      H4 = (H4 + e) >>> 0;

      steps.push({
        id: `block-${i}-end`,
        title: `Block ${i + 1} State Accumulation`,
        phase: 'Compression',
        description: 'Add compressed block working variables to the cumulative state hash values (mod 2³²).',
        data: {
          schedule: fullSchedule,
          constants: fullConstants,
          variables: [
            { label: 'A', hex: uint32ToHex(H0), binary: uint32ToBinary(H0) },
            { label: 'B', hex: uint32ToHex(H1), binary: uint32ToBinary(H1) },
            { label: 'C', hex: uint32ToHex(H2), binary: uint32ToBinary(H2) },
            { label: 'D', hex: uint32ToHex(H3), binary: uint32ToBinary(H3) },
            { label: 'E', hex: uint32ToHex(H4), binary: uint32ToBinary(H4) },
          ],
          updates: [
            { label: 'REG.A', prevHex: uint32ToHex(prevH0), addHex: uint32ToHex(a), newHex: uint32ToHex(H0) },
            { label: 'REG.B', prevHex: uint32ToHex(prevH1), addHex: uint32ToHex(b), newHex: uint32ToHex(H1) },
            { label: 'REG.C', prevHex: uint32ToHex(prevH2), addHex: uint32ToHex(c), newHex: uint32ToHex(H2) },
            { label: 'REG.D', prevHex: uint32ToHex(prevH3), addHex: uint32ToHex(d), newHex: uint32ToHex(H3) },
            { label: 'REG.E', prevHex: uint32ToHex(prevH4), addHex: uint32ToHex(e), newHex: uint32ToHex(H4) },
          ],
        },
        visualizationType: 'round-computation',
      });
    }

    const digestBuf = new ArrayBuffer(20);
    const digestView = new DataView(digestBuf);
    digestView.setUint32(0, H0, false);
    digestView.setUint32(4, H1, false);
    digestView.setUint32(8, H2, false);
    digestView.setUint32(12, H3, false);
    digestView.setUint32(16, H4, false);
    const digestBytes = new Uint8Array(digestBuf);
    const digest = bytesToHex(digestBytes);

    steps.push({
      id: 'final-digest',
      title: 'Final Digest Assembly',
      phase: 'Finalization',
      description: 'Concatenate state variables A, B, C, D, E in big-endian byte order to produce the final 160-bit SHA-1 digest.',
      data: {
        hashValues: [
          { label: 'H0', hex: uint32ToHex(H0) },
          { label: 'H1', hex: uint32ToHex(H1) },
          { label: 'H2', hex: uint32ToHex(H2) },
          { label: 'H3', hex: uint32ToHex(H3) },
          { label: 'H4', hex: uint32ToHex(H4) },
        ],
        digest,
      },
      visualizationType: 'final-digest',
    });

    return { digest, steps };
  }
}

export default new SHA1Plugin();
