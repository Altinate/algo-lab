import { AlgorithmPlugin, AlgorithmInfo, ComputationStep } from '../types';
import { stringToBytes, bytesToHex } from '../utils';
import { SIGMA, IV64, G64Detail, formatState64 } from '../blake2/engine';

const INFO: AlgorithmInfo = {
  name: 'BLAKE2b',
  family: 'BLAKE',
  digestSize: 512,
  blockSize: 1024,
  security: 'secure',
  year: 2012,
  designers: ['Jean-Philippe Aumasson', 'Samuel Neves', "Zooko Wilcox-O'Hearn", 'Christian Winnerlein'],
  description: 'BLAKE2b is optimized for 64-bit platforms and produces a 512-bit digest.',
  useCases: ['Password hashing (Argon2)', 'Cryptographic checksums', 'Cryptocurrency'],
};

export class Blake2bPlugin implements AlgorithmPlugin {
  info = INFO;

  compute(input: string) {
    const steps: ComputationStep[] = [];
    const message = stringToBytes(input);

    steps.push({
      id: 'input-encoding',
      title: 'Input Encoding',
      phase: 'Pre-processing',
      description: `Convert string to UTF-8 bytes. Total: ${message.length} bytes (${message.length * 8} bits).`,
      data: {
        input: input || '(empty string)',
        bytes: Array.from(message),
        hex: bytesToHex(message),
        bitLength: message.length * 8,
      },
      visualizationType: 'binary-transform',
    });

    // Initialize state with parameter block: digest_len=64, key_len=0, fanout=1, depth=1
    const h = [...IV64];
    h[0] ^= 0x01010040n;

    steps.push({
      id: 'init',
      title: 'Initialize State',
      phase: 'Initialization',
      description: 'Initialize state vector h[0..7] with 64-bit IV and parameter block (512-bit digest, no key).',
      data: {
        state: formatState64(h.concat(IV64)),
      },
      visualizationType: 'mixing-function',
    });

    const numBlocks = Math.max(1, Math.ceil(message.length / 128));
    let t0 = 0n;

    for (let i = 0; i < numBlocks; i++) {
      const isLastBlock = (i === numBlocks - 1);
      const start = i * 128;
      const end = isLastBlock ? message.length : start + 128;
      const blockBytes = new Uint8Array(128);
      blockBytes.set(message.slice(start, end));

      t0 += BigInt(end - start);

      const m = new Array<bigint>(16).fill(0n);
      const view = new DataView(blockBytes.buffer, blockBytes.byteOffset, blockBytes.byteLength);
      for (let j = 0; j < 16; j++) {
        m[j] = view.getBigUint64(j * 8, true);
      }

      steps.push({
        id: `block-${i}-prep`,
        title: `Message Block Setup (Block ${i + 1} of ${numBlocks})`,
        phase: 'Pre-processing',
        description: `Read 128-byte block (padded with 0s if last block). Byte counter t0 = ${t0.toString()}.`,
        data: {
          words: m.map((w, idx) => ({
            index: idx,
            hex: formatState64([w])[0],
          })),
          t0: t0.toString(),
          isLastBlock,
        },
        visualizationType: 'binary-transform',
      });

      // Initialize local working state v
      const v = new Array<bigint>(16);
      for (let j = 0; j < 8; j++) v[j] = h[j];
      for (let j = 0; j < 8; j++) v[j + 8] = IV64[j];

      v[12] ^= t0;
      v[13] ^= 0n;
      if (isLastBlock) {
        v[14] ^= 0xFFFFFFFFFFFFFFFFn;
      }

      steps.push({
        id: `block-${i}-v-init`,
        title: `Initialize Work State v (Block ${i + 1})`,
        phase: 'Initialization',
        description: 'Initialize 16 64-bit word (4×4) work state v from chaining values h, IV, byte counter, and finalization flags.',
        data: {
          state: formatState64(v),
        },
        visualizationType: 'mixing-function',
      });

      // 12 rounds of mixing
      for (let r = 0; r < 12; r++) {
        const s = SIGMA[r % 10];
        const prevState = [...v];
        const gCalls = [];

        // Column step
        gCalls.push(G64Detail(v, 0, 4, 8, 12, m[s[0]], m[s[1]], s[0], s[1], 'column'));
        gCalls.push(G64Detail(v, 1, 5, 9, 13, m[s[2]], m[s[3]], s[2], s[3], 'column'));
        gCalls.push(G64Detail(v, 2, 6, 10, 14, m[s[4]], m[s[5]], s[4], s[5], 'column'));
        gCalls.push(G64Detail(v, 3, 7, 11, 15, m[s[6]], m[s[7]], s[6], s[7], 'column'));

        // Diagonal step
        gCalls.push(G64Detail(v, 0, 5, 10, 15, m[s[8]], m[s[9]], s[8], s[9], 'diagonal'));
        gCalls.push(G64Detail(v, 1, 6, 11, 12, m[s[10]], m[s[11]], s[10], s[11], 'diagonal'));
        gCalls.push(G64Detail(v, 2, 7, 8, 13, m[s[12]], m[s[13]], s[12], s[13], 'diagonal'));
        gCalls.push(G64Detail(v, 3, 4, 9, 14, m[s[14]], m[s[15]], s[14], s[15], 'diagonal'));

        steps.push({
          id: `block-${i}-round-${r}`,
          title: `BLAKE2b Round ${r + 1} of 12`,
          phase: 'Compression',
          description: `Round ${r + 1}: Apply G mixing functions to columns and diagonals using permutation SIGMA[${r % 10}].`,
          data: {
            roundIndex: r + 1,
            mixType: 'Columns & Diagonals',
            prevState: formatState64(prevState),
            state: formatState64(v),
            gCalls,
            m: formatState64(m),
            sigmaIndex: r % 10,
            sigma: s,
          },
          visualizationType: 'mixing-function',
        });
      }

      // Finalize block by XORing v into h
      for (let j = 0; j < 8; j++) {
        h[j] = (h[j] ^ v[j] ^ v[j + 8]) & 0xFFFFFFFFFFFFFFFFn;
      }

      steps.push({
        id: `block-${i}-finalize`,
        title: `Block ${i + 1} Finalization`,
        phase: 'Compression',
        description: 'XOR upper and lower halves of work state v back into chaining values h: h[i] = h[i] ⊕ v[i] ⊕ v[i+8].',
        data: {
          state: formatState64(h.concat(h)),
        },
        visualizationType: 'mixing-function',
      });
    }

    // Convert h to little-endian hex string
    let digest = '';
    for (let i = 0; i < 8; i++) {
      const w = h[i];
      for (let j = 0; j < 8; j++) {
        digest += Number((w >> BigInt(j * 8)) & 0xFFn).toString(16).padStart(2, '0');
      }
    }

    steps.push({
      id: 'final-digest',
      title: 'Final Digest Assembly',
      phase: 'Finalization',
      description: 'Format chaining values h[0..7] as 64 little-endian bytes to produce the 512-bit BLAKE2b digest.',
      data: {
        hashValues: h.map((w, idx) => ({
          label: `h[${idx}]`,
          hex: formatState64([w])[0],
        })),
        digest,
      },
      visualizationType: 'final-digest',
    });

    return { digest, steps };
  }
}

export default new Blake2bPlugin();
