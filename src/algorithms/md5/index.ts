import { AlgorithmPlugin, AlgorithmInfo, ComputationStep } from '../types';
import { stringToBytes, bytesToHex, uint32ToHex } from '../utils';
import { MD5_INIT, MD5_K, MD5_S } from './constants';
import { F, G, H, I, leftRotate32 } from './operations';

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
  designers: ['Ronald Rivest']
};

export class MD5Plugin implements AlgorithmPlugin {
  info = md5Info;

  compute(input: string) {
    const steps: ComputationStep[] = [];
    
    steps.push({
      id: 'input-encoding',
      title: 'Input Encoding',
      phase: 'Preprocessing',
      description: 'Convert string to UTF-8 bytes',
      data: { input },
      visualizationType: 'generic'
    });

    const bytes = stringToBytes(input);
    const bitLength = bytes.length * 8;
    
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
      phase: 'Preprocessing',
      description: 'Pad message to multiple of 512 bits with a 1 bit, zeros, and little-endian length.',
      data: { originalBytes: Array.from(bytes), paddedBytes: Array.from(buffer) },
      visualizationType: 'binary-transform'
    });

    const words = new Uint32Array(buffer.buffer); // Uint32Array uses little-endian on standard systems
    // But to be completely platform independent:
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
      phase: 'Preprocessing',
      description: 'Initialize the 4 working variables',
      data: { A: uint32ToHex(A), B: uint32ToHex(B), C: uint32ToHex(C), D: uint32ToHex(D) },
      visualizationType: 'generic'
    });

    for (let i = 0; i < blocks.length; i++) {
      const M = blocks[i];
      let [a, b, c, d] = [A, B, C, D];
      
      steps.push({
        id: `block-${i}-start`,
        title: `Process Block ${i}`,
        phase: 'Compression',
        description: `Start processing block ${i}`,
        data: { M: M.map(uint32ToHex) },
        visualizationType: 'generic'
      });

      for (let j = 0; j < 64; j++) {
        let f, g;
        if (j < 16) {
          f = F(b, c, d);
          g = j;
        } else if (j < 32) {
          f = G(b, c, d);
          g = (5 * j + 1) % 16;
        } else if (j < 48) {
          f = H(b, c, d);
          g = (3 * j + 5) % 16;
        } else {
          f = I(b, c, d);
          g = (7 * j) % 16;
        }
        
        const temp = d;
        d = c;
        c = b;
        b = (b + leftRotate32((a + f + MD5_K[j] + M[g]) >>> 0, MD5_S[j])) >>> 0;
        a = temp;

        steps.push({
          id: `block-${i}-round-${j}`,
          title: `Round ${j + 1}`,
          phase: 'Compression',
          description: `MD5 round computation`,
          data: {
            a: uint32ToHex(a),
            b: uint32ToHex(b),
            c: uint32ToHex(c),
            d: uint32ToHex(d),
            f: uint32ToHex(f >>> 0),
            k: uint32ToHex(MD5_K[j]),
            m: uint32ToHex(M[g]),
            s: MD5_S[j]
          },
          visualizationType: 'round-computation'
        });
      }

      A = (A + a) >>> 0;
      B = (B + b) >>> 0;
      C = (C + c) >>> 0;
      D = (D + d) >>> 0;
      
      steps.push({
        id: `block-${i}-end`,
        title: `Update Hash ${i}`,
        phase: 'Compression',
        description: `Add compressed block to state`,
        data: { A: uint32ToHex(A), B: uint32ToHex(B), C: uint32ToHex(C), D: uint32ToHex(D) },
        visualizationType: 'generic'
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
      title: 'Final Digest',
      phase: 'Finalization',
      description: 'Concatenate state variables as little-endian bytes to form the final digest',
      data: { digest },
      visualizationType: 'final-digest'
    });

    return { digest, steps };
  }
}

export default new MD5Plugin();
