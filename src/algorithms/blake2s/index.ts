import { AlgorithmPlugin, AlgorithmInfo, ComputationStep } from '../types';
import { stringToBytes, bytesToHex } from '../utils';
import { SIGMA, IV32, G32Detail, formatState32 } from '../blake2/engine';

const INFO: AlgorithmInfo = {
  name: 'BLAKE2s',
  family: 'BLAKE',
  digestSize: 256,
  blockSize: 512,
  security: 'secure',
  year: 2012,
  designers: ['Jean-Philippe Aumasson', 'Samuel Neves', "Zooko Wilcox-O'Hearn", 'Christian Winnerlein'],
  description: 'BLAKE2s is optimized for 32-bit platforms and produces a 256-bit digest.',
  useCases: ['Digital signatures', 'Data integrity', 'Password hashing (via Argon2)'],
};

export class Blake2sPlugin implements AlgorithmPlugin {
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

    // Initialize state
    const h = [...IV32];
    h[0] ^= 0x01010020; // Parameter block: digest_len=32, key_len=0, fanout=1, depth=1

    steps.push({
      id: 'init',
      title: 'Initialize State',
      phase: 'Initialization',
      description: 'Initialize state vector h[0..7] with 32-bit IV and parameter block (256-bit digest, no key).',
      data: {
        state: formatState32(h.concat(IV32)),
      },
      visualizationType: 'mixing-function',
    });

    const numBlocks = Math.max(1, Math.ceil(message.length / 64));
    let t0 = 0;

    for (let i = 0; i < numBlocks; i++) {
      const isLastBlock = (i === numBlocks - 1);
      const start = i * 64;
      const end = isLastBlock ? message.length : start + 64;
      const blockBytes = new Uint8Array(64);
      blockBytes.set(message.slice(start, end));

      t0 += (end - start);

      const m = new Array(16).fill(0);
      for (let j = 0; j < 16; j++) {
        m[j] = (blockBytes[j * 4] | 
               (blockBytes[j * 4 + 1] << 8) | 
               (blockBytes[j * 4 + 2] << 16) | 
               (blockBytes[j * 4 + 3] << 24)) >>> 0;
      }

      steps.push({
        id: `block-${i}-prep`,
        title: `Message Block Setup (Block ${i + 1} of ${numBlocks})`,
        phase: 'Pre-processing',
        description: `Read 64-byte block (padded with 0s if last block). Byte counter t0 = ${t0}.`,
        data: {
          words: m.map((w, idx) => ({
            index: idx,
            hex: formatState32([w])[0],
          })),
          t0,
          isLastBlock,
        },
        visualizationType: 'binary-transform',
      });

      // Initialize local working state v
      const v = new Array(16);
      for (let j = 0; j < 8; j++) v[j] = h[j];
      for (let j = 0; j < 8; j++) v[j + 8] = IV32[j];

      v[12] ^= t0;
      v[13] ^= 0;
      if (isLastBlock) {
        v[14] ^= 0xFFFFFFFF;
      }

      steps.push({
        id: `block-${i}-v-init`,
        title: `Initialize Work State v (Block ${i + 1})`,
        phase: 'Initialization',
        description: 'Initialize 16-word (4×4) work state v from current chaining values h, IV, byte counter, and finalization flags.',
        data: {
          state: formatState32(v),
        },
        visualizationType: 'mixing-function',
      });

      // 10 rounds of mixing
      for (let r = 0; r < 10; r++) {
        const s = SIGMA[r % 10];
        const prevState = [...v];
        const gCalls = [];

        // Column step
        gCalls.push(G32Detail(v, 0, 4, 8, 12, m[s[0]], m[s[1]], s[0], s[1], 'column'));
        gCalls.push(G32Detail(v, 1, 5, 9, 13, m[s[2]], m[s[3]], s[2], s[3], 'column'));
        gCalls.push(G32Detail(v, 2, 6, 10, 14, m[s[4]], m[s[5]], s[4], s[5], 'column'));
        gCalls.push(G32Detail(v, 3, 7, 11, 15, m[s[6]], m[s[7]], s[6], s[7], 'column'));

        // Diagonal step
        gCalls.push(G32Detail(v, 0, 5, 10, 15, m[s[8]], m[s[9]], s[8], s[9], 'diagonal'));
        gCalls.push(G32Detail(v, 1, 6, 11, 12, m[s[10]], m[s[11]], s[10], s[11], 'diagonal'));
        gCalls.push(G32Detail(v, 2, 7, 8, 13, m[s[12]], m[s[13]], s[12], s[13], 'diagonal'));
        gCalls.push(G32Detail(v, 3, 4, 9, 14, m[s[14]], m[s[15]], s[14], s[15], 'diagonal'));

        steps.push({
          id: `block-${i}-round-${r}`,
          title: `BLAKE2s Round ${r + 1} of 10`,
          phase: 'Compression',
          description: `Round ${r + 1}: Apply G mixing functions to columns and diagonals using permutation SIGMA[${r % 10}].`,
          data: {
            roundIndex: r + 1,
            mixType: 'Columns & Diagonals',
            prevState: formatState32(prevState),
            state: formatState32(v),
            gCalls,
            m: formatState32(m),
            sigmaIndex: r % 10,
            sigma: s,
          },
          visualizationType: 'mixing-function',
        });
      }

      // Finalize block by XORing v into h
      for (let j = 0; j < 8; j++) {
        h[j] = (h[j] ^ v[j] ^ v[j + 8]) >>> 0;
      }

      steps.push({
        id: `block-${i}-finalize`,
        title: `Block ${i + 1} Finalization`,
        phase: 'Compression',
        description: 'XOR upper and lower halves of work state v back into chaining values h: h[i] = h[i] ⊕ v[i] ⊕ v[i+8].',
        data: {
          state: formatState32(h.concat(h)),
        },
        visualizationType: 'mixing-function',
      });
    }

    // Convert h to little-endian hex string
    let digest = '';
    for (let i = 0; i < 8; i++) {
      const w = h[i];
      for (let j = 0; j < 4; j++) {
        digest += ((w >>> (j * 8)) & 0xFF).toString(16).padStart(2, '0');
      }
    }

    steps.push({
      id: 'final-digest',
      title: 'Final Digest Assembly',
      phase: 'Finalization',
      description: 'Format chaining values h[0..7] as 32 little-endian bytes to produce the 256-bit BLAKE2s digest.',
      data: {
        hashValues: h.map((w, idx) => ({
          label: `h[${idx}]`,
          hex: formatState32([w])[0],
        })),
        digest,
      },
      visualizationType: 'final-digest',
    });

    return { digest, steps };
  }
}

export default new Blake2sPlugin();
