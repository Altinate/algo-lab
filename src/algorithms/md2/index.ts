import { AlgorithmPlugin, AlgorithmInfo, ComputationStep, ComputationResult } from '../types';
import { stringToBytes, bytesToHex, uint8ToHex } from '../utils';
import { S_PI } from './constants';

export const md2Info: AlgorithmInfo = {
  name: 'MD2',
  family: 'MD',
  digestSize: 128,
  blockSize: 128,
  description: 'MD2 (Message-Digest 2, RFC 1319) is a byte-oriented 128-bit hash algorithm optimized for 8-bit computers using an S-box substitution table (Pi table) and a 16-byte checksum.',
  useCases: ['Historical PKI', 'Legacy smart cards', 'Cryptographic history'],
  security: 'broken',
  securityNote: 'Vulnerable to preimage attacks with complexity 2^104 and collision attacks. Deprecated by IETF (RFC 6149).',
  year: 1989,
  designers: ['Ronald Rivest'],
};

export class MD2Plugin implements AlgorithmPlugin {
  info = md2Info;

  compute(input: string): ComputationResult {
    const steps: ComputationStep[] = [];
    const inputBytes = stringToBytes(input);

    // 1. Input encoding
    steps.push({
      id: 'input-encoding',
      title: 'Input Byte Stream',
      phase: 'Preprocessing',
      description: `Encode ASCII/UTF-8 string into byte array (${inputBytes.length} bytes).`,
      data: {
        input: input || '(empty string)',
        bytes: Array.from(inputBytes),
        hex: bytesToHex(inputBytes),
        length: inputBytes.length,
      },
      visualizationType: 'binary-transform',
    });

    // 2. Padding: Append i bytes with value i so length is multiple of 16
    let padLen = 16 - (inputBytes.length % 16);
    if (padLen === 0) padLen = 16;
    const padded = new Uint8Array(inputBytes.length + padLen);
    padded.set(inputBytes);
    padded.fill(padLen, inputBytes.length);

    steps.push({
      id: 'padding',
      title: 'PKCS Byte Padding',
      phase: 'Preprocessing',
      description: `Pad to a multiple of 16 bytes (128 bits). Appended ${padLen} byte(s) each with value 0x${padLen.toString(16).padStart(2, '0')}.`,
      data: {
        originalLength: inputBytes.length,
        padLength: padLen,
        padValue: padLen,
        paddedHex: bytesToHex(padded),
        totalBlocks: padded.length / 16,
      },
      visualizationType: 'binary-transform',
    });

    // 3. Compute 16-byte Checksum
    const C = new Uint8Array(16);
    let L = 0;
    for (let i = 0; i < padded.length; i++) {
      const c = padded[i];
      const j = i % 16;
      C[j] ^= S_PI[c ^ L];
      L = C[j];
    }

    // Append 16-byte checksum to message
    const messageWithChecksum = new Uint8Array(padded.length + 16);
    messageWithChecksum.set(padded);
    messageWithChecksum.set(C, padded.length);

    steps.push({
      id: 'checksum',
      title: '16-Byte Checksum Calculation',
      phase: 'Preprocessing',
      description: 'Compute 16-byte checksum C[0..15] using the 256-byte S-box (Pi table) and append to message.',
      data: {
        checksumHex: bytesToHex(C),
        totalBytesWithChecksum: messageWithChecksum.length,
      },
      visualizationType: 'binary-transform',
    });

    // 4. Process 16-byte blocks with 48-byte buffer X
    const X = new Uint8Array(48);
    const numBlocks = messageWithChecksum.length / 16;

    for (let blockIdx = 0; blockIdx < numBlocks; blockIdx++) {
      const M = messageWithChecksum.subarray(blockIdx * 16, blockIdx * 16 + 16);
      const prevX = new Uint8Array(X);

      // Copy M into X[16..31] and X[32..47]
      for (let j = 0; j < 16; j++) {
        X[16 + j] = M[j];
        X[32 + j] = M[j] ^ X[j];
      }

      let t = 0;
      for (let round = 0; round < 18; round++) {
        for (let k = 0; k < 48; k++) {
          t = X[k] ^ S_PI[t];
          X[k] = t;
        }
        t = (t + round) & 0xFF;
      }

      // Convert 48 bytes into 3 16-byte hex rows for telemetry
      const x0_15 = bytesToHex(X.subarray(0, 16));
      const x16_31 = bytesToHex(X.subarray(16, 32));
      const x32_47 = bytesToHex(X.subarray(32, 48));

      steps.push({
        id: `block-${blockIdx}`,
        title: `Block ${blockIdx + 1} of ${numBlocks} (18 S-Box Rounds)`,
        phase: 'Compression',
        description: `Process 16-byte block ${blockIdx + 1} through 18 rounds of 48-byte S-box permutations (X[k] = X[k] ⊕ S[t]).`,
        data: {
          blockIndex: blockIdx,
          blockHex: bytesToHex(M),
          prevDigestHex: bytesToHex(prevX.subarray(0, 16)),
          bufferState: {
            x0_15,
            x16_31,
            x32_47,
          },
          variables: [
            { label: 'X[0..15]', hex: x0_15 },
            { label: 'X[16..31]', hex: x16_31 },
            { label: 'X[32..47]', hex: x32_47 },
          ],
        },
        visualizationType: 'round-computation',
      });
    }

    // 5. Final digest is X[0..15]
    const digestBytes = X.subarray(0, 16);
    const finalDigest = bytesToHex(digestBytes);

    steps.push({
      id: 'final-digest',
      title: 'Final Digest Assembly',
      phase: 'Finalization',
      description: 'Extract first 16 bytes X[0..15] of the buffer as the 128-bit MD2 message digest.',
      data: {
        digest: finalDigest,
        hashValues: [
          { label: 'X[0..3]', hex: bytesToHex(digestBytes.subarray(0, 4)) },
          { label: 'X[4..7]', hex: bytesToHex(digestBytes.subarray(4, 8)) },
          { label: 'X[8..11]', hex: bytesToHex(digestBytes.subarray(8, 12)) },
          { label: 'X[12..15]', hex: bytesToHex(digestBytes.subarray(12, 16)) },
        ],
      },
      visualizationType: 'final-digest',
    });

    return { digest: finalDigest, steps };
  }
}

export default new MD2Plugin();
