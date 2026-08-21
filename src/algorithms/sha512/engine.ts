import { stringToBytes, bytesToHex, bytesToBinary, uint64ToHex, formatHexGroups, add64 } from '../utils';
import { ComputationStep, ComputationResult } from '../types';
import { K_512 } from './constants';
import { ch64, maj64, bigSigma0_64, bigSigma1_64, sigma0_64, sigma1_64 } from './operations';

export interface SHA512EngineConfig {
  initialHash: bigint[];
  is384?: boolean;
}

export function computeSHA512Family(input: string, config: SHA512EngineConfig): ComputationResult {
  const steps: ComputationStep[] = [];
  const inputBytes = stringToBytes(input);
  const bitLength = BigInt(inputBytes.length) * 8n;
  
  // 1. Padding
  // Calculate padding length: 1 byte for 0x80, zeros to reach 112 (mod 128), 16 bytes for length
  let paddingLen = 128 - ((inputBytes.length + 16) % 128);
  if (paddingLen === 128) paddingLen = 0; // if it was perfectly 112 mod 128, then (len+16)%128 == 0, paddingLen becomes 128, which is right as we need 1 byte 0x80 and 127 bytes zeroes. Actually: (inputBytes.length + 1) % 128 <= 112...
  
  // Let's do standard calculation:
  const l = inputBytes.length;
  let k = 112 - (l + 1) % 128;
  if (k < 0) k += 128;
  
  const totalLength = l + 1 + k + 16;
  const paddedBytes = new Uint8Array(totalLength);
  paddedBytes.set(inputBytes, 0);
  paddedBytes[l] = 0x80;
  
  const view = new DataView(paddedBytes.buffer, paddedBytes.byteOffset, paddedBytes.byteLength);
  // Length is 128-bit big-endian. Upper 64 bits are 0 for our use cases.
  view.setBigUint64(totalLength - 16, 0n, false);
  view.setBigUint64(totalLength - 8, bitLength, false);

  steps.push({
    id: 'padding',
    title: 'Message Padding',
    phase: 'Preprocessing',
    description: `Append 1 bit, followed by ${k * 8 + 7} zero bits, and finally a 128-bit length representation. Total length becomes ${totalLength * 8} bits (multiple of 1024).`,
    data: {
      originalLength: Number(bitLength),
      paddedHex: formatHexGroups(bytesToHex(paddedBytes), 32)
    },
    visualizationType: 'binary-transform'
  });

  // 2. Initialize hash values
  let H = [...config.initialHash];
  
  steps.push({
    id: 'init-hash',
    title: 'Initialize Hash Values',
    phase: 'Preprocessing',
    description: 'Set initial hash values H_0 to H_7.',
    data: {
      H: H.map(uint64ToHex)
    },
    visualizationType: 'generic'
  });

  // 3. Process blocks
  const numBlocks = totalLength / 128;
  
  for (let blockIdx = 0; blockIdx < numBlocks; blockIdx++) {
    const blockPhase = `Block ${blockIdx + 1} / ${numBlocks}`;
    const offset = blockIdx * 128;
    const W = new Array<bigint>(80).fill(0n);
    
    // Message schedule preparation
    for (let t = 0; t < 16; t++) {
      W[t] = view.getBigUint64(offset + t * 8, false);
    }
    for (let t = 16; t < 80; t++) {
      W[t] = add64(sigma1_64(W[t - 2]), W[t - 7], sigma0_64(W[t - 15]), W[t - 16]);
    }
    
    steps.push({
      id: `block-${blockIdx}-schedule`,
      title: 'Message Schedule',
      phase: blockPhase,
      description: 'Expand the 16-word message block into an 80-word message schedule (W_0..W_79).',
      data: {
        W: W.slice(0, 16).map(uint64ToHex) // Show first 16 words, full 80 might be too large
      },
      visualizationType: 'generic'
    });

    // Initialize working variables
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    
    for (let t = 0; t < 80; t++) {
      const T1 = add64(h, bigSigma1_64(e), ch64(e, f, g), K_512[t], W[t]);
      const T2 = add64(bigSigma0_64(a), maj64(a, b, c));
      
      h = g;
      g = f;
      f = e;
      e = add64(d, T1);
      d = c;
      c = b;
      b = a;
      a = add64(T1, T2);
      
      // Store every 10th round or critical ones to not overwhelm if needed, 
      // but requirements say "ALL intermediate steps". We will store all.
      steps.push({
        id: `block-${blockIdx}-round-${t}`,
        title: `Round ${t}`,
        phase: blockPhase,
        description: `Compression round ${t} updating working variables a-h.`,
        data: {
          t,
          a: uint64ToHex(a),
          b: uint64ToHex(b),
          c: uint64ToHex(c),
          d: uint64ToHex(d),
          e: uint64ToHex(e),
          f: uint64ToHex(f),
          g: uint64ToHex(g),
          h: uint64ToHex(h),
          W: uint64ToHex(W[t]),
          K: uint64ToHex(K_512[t]),
          T1: uint64ToHex(T1),
          T2: uint64ToHex(T2)
        },
        visualizationType: 'round-computation'
      });
    }

    // Add compressed chunk to current hash value
    H[0] = add64(H[0], a);
    H[1] = add64(H[1], b);
    H[2] = add64(H[2], c);
    H[3] = add64(H[3], d);
    H[4] = add64(H[4], e);
    H[5] = add64(H[5], f);
    H[6] = add64(H[6], g);
    H[7] = add64(H[7], h);
    
    steps.push({
      id: `block-${blockIdx}-update`,
      title: 'Intermediate Hash',
      phase: blockPhase,
      description: 'Add the compressed working variables to the current hash state.',
      data: {
        H: H.map(uint64ToHex)
      },
      visualizationType: 'generic'
    });
  }

  // 4. Final output
  let finalH = H;
  let finalDigest = '';
  
  if (config.is384) {
    finalH = H.slice(0, 6); // Truncate to 384 bits (6 words)
  }
  
  finalDigest = finalH.map(uint64ToHex).join('');

  steps.push({
    id: 'final-digest',
    title: 'Final Digest',
    phase: 'Output',
    description: config.is384 ? 'Concatenate the first 6 hash values (384 bits) for the final digest.' : 'Concatenate all 8 hash values (512 bits) for the final digest.',
    data: {
      H: finalH.map(uint64ToHex),
      digest: finalDigest
    },
    visualizationType: 'final-digest'
  });

  return { digest: finalDigest, steps };
}
