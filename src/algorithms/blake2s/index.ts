import { AlgorithmPlugin, AlgorithmInfo, ComputationStep } from '../types';
import { stringToBytes, uint32ToHex } from '../utils';
import { SIGMA, IV32, G32, formatState32 } from '../blake2/engine';

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
    
    // Initialize state
    const h = [...IV32];
    h[0] ^= 0x01010020; // Parameter block: digest_len=32, key_len=0, fanout=1, depth=1
    
    steps.push({
      id: 'init',
      title: 'Initialize State',
      phase: 'Initialization',
      description: 'Initialize the state h with IV and parameter block (digest length 32, no key).',
      data: { h: formatState32(h) },
      visualizationType: 'generic'
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
        title: `Prepare Block ${i}`,
        phase: 'Preprocessing',
        description: `Read 64-byte block (padded with 0s if last block). Counter t0 = ${t0}.`,
        data: { m: formatState32(m), t0, isLastBlock },
        visualizationType: 'generic'
      });

      // Initialize local working state v
      const v = new Array(16);
      for (let j = 0; j < 8; j++) v[j] = h[j];
      for (let j = 0; j < 8; j++) v[j + 8] = IV32[j];
      
      v[12] ^= t0;
      v[13] ^= 0; // t1 = 0 since we only handle small inputs
      if (isLastBlock) {
        v[14] ^= 0xFFFFFFFF; // f0 = ~0
      }

      steps.push({
        id: `block-${i}-v-init`,
        title: `Initialize Work Vector (Block ${i})`,
        phase: 'Compression',
        description: 'Initialize 16-word work vector v from h, IV, counter, and flags.',
        data: { v: formatState32(v) },
        visualizationType: 'state-matrix'
      });

      // 10 rounds of mixing
      for (let r = 0; r < 10; r++) {
        const s = SIGMA[r % 10];
        
        // Column step
        G32(v, 0, 4, 8, 12, m[s[0]], m[s[1]]);
        G32(v, 1, 5, 9, 13, m[s[2]], m[s[3]]);
        G32(v, 2, 6, 10, 14, m[s[4]], m[s[5]]);
        G32(v, 3, 7, 11, 15, m[s[6]], m[s[7]]);
        
        // Diagonal step
        G32(v, 0, 5, 10, 15, m[s[8]], m[s[9]]);
        G32(v, 1, 6, 11, 12, m[s[10]], m[s[11]]);
        G32(v, 2, 7, 8, 13, m[s[12]], m[s[13]]);
        G32(v, 3, 4, 9, 14, m[s[14]], m[s[15]]);

        steps.push({
          id: `block-${i}-round-${r}`,
          title: `Round ${r + 1} (Block ${i})`,
          phase: 'Compression',
          description: `Apply G function to columns and diagonals using permutation SIGMA[${r % 10}].`,
          data: { v: formatState32(v) },
          visualizationType: 'mixing-function'
        });
      }

      // Finalize block by XORing v into h
      for (let j = 0; j < 8; j++) {
        h[j] = (h[j] ^ v[j] ^ v[j + 8]) >>> 0;
      }
      
      steps.push({
        id: `block-${i}-finalize`,
        title: `Finalize Block ${i}`,
        phase: 'Compression',
        description: 'XOR upper and lower halves of v back into h.',
        data: { h: formatState32(h) },
        visualizationType: 'generic'
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
      id: 'final',
      title: 'Final Digest',
      phase: 'Finalization',
      description: 'Convert h to little-endian bytes and then to hex string.',
      data: { digest },
      visualizationType: 'final-digest'
    });

    return { digest, steps };
  }
}

export default new Blake2sPlugin();
