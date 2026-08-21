import { AlgorithmPlugin, AlgorithmInfo, ComputationStep } from '../types';
import { stringToBytes, bytesToHex, uint32ToHex } from '../utils';
import { SHA1_INIT, SHA1_K } from './constants';
import { Ch, Parity, Maj, leftRotate32 } from './operations';

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
  designers: ['NSA (National Security Agency)']
};

export class SHA1Plugin implements AlgorithmPlugin {
  info = sha1Info;

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
    
    // Big-endian length
    const lenView = new DataView(buffer.buffer);
    const bitsLower = bitLength >>> 0;
    const bitsUpper = Math.floor(bitLength / 4294967296);
    lenView.setUint32(totalLength - 8, bitsUpper, false);
    lenView.setUint32(totalLength - 4, bitsLower, false);

    steps.push({
      id: 'padding',
      title: 'Message Padding',
      phase: 'Preprocessing',
      description: 'Pad message to multiple of 512 bits with a 1 bit, zeros, and big-endian length.',
      data: { originalBytes: Array.from(bytes), paddedBytes: Array.from(buffer) },
      visualizationType: 'binary-transform'
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
      phase: 'Preprocessing',
      description: 'Initialize the 5 working variables',
      data: { H0: uint32ToHex(H0), H1: uint32ToHex(H1), H2: uint32ToHex(H2), H3: uint32ToHex(H3), H4: uint32ToHex(H4) },
      visualizationType: 'generic'
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
      
      steps.push({
        id: `block-${i}-schedule`,
        title: `Message Schedule Block ${i}`,
        phase: 'Compression',
        description: `Expand 16 words into 80 words`,
        data: { W: Array.from(W).map(uint32ToHex) },
        visualizationType: 'generic'
      });

      let a = H0;
      let b = H1;
      let c = H2;
      let d = H3;
      let e = H4;
      
      for (let t = 0; t < 80; t++) {
        let f, k;
        if (t < 20) {
          f = Ch(b, c, d);
          k = SHA1_K[0];
        } else if (t < 40) {
          f = Parity(b, c, d);
          k = SHA1_K[1];
        } else if (t < 60) {
          f = Maj(b, c, d);
          k = SHA1_K[2];
        } else {
          f = Parity(b, c, d);
          k = SHA1_K[3];
        }
        
        const temp = (leftRotate32(a, 5) + f + e + k + W[t]) >>> 0;
        e = d;
        d = c;
        c = leftRotate32(b, 30);
        b = a;
        a = temp;

        steps.push({
          id: `block-${i}-round-${t}`,
          title: `Round ${t + 1}`,
          phase: 'Compression',
          description: `SHA-1 round computation`,
          data: {
            a: uint32ToHex(a),
            b: uint32ToHex(b),
            c: uint32ToHex(c),
            d: uint32ToHex(d),
            e: uint32ToHex(e),
            f: uint32ToHex(f >>> 0),
            k: uint32ToHex(k),
            w: uint32ToHex(W[t])
          },
          visualizationType: 'round-computation'
        });
      }

      H0 = (H0 + a) >>> 0;
      H1 = (H1 + b) >>> 0;
      H2 = (H2 + c) >>> 0;
      H3 = (H3 + d) >>> 0;
      H4 = (H4 + e) >>> 0;
      
      steps.push({
        id: `block-${i}-end`,
        title: `Update Hash ${i}`,
        phase: 'Compression',
        description: `Add compressed block to state`,
        data: { H0: uint32ToHex(H0), H1: uint32ToHex(H1), H2: uint32ToHex(H2), H3: uint32ToHex(H3), H4: uint32ToHex(H4) },
        visualizationType: 'generic'
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
      title: 'Final Digest',
      phase: 'Finalization',
      description: 'Concatenate state variables as big-endian bytes to form the final digest',
      data: { digest },
      visualizationType: 'final-digest'
    });

    return { digest, steps };
  }
}

export default new SHA1Plugin();
