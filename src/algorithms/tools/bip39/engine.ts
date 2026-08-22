/**
 * BIP-39 (Bitcoin Improvement Proposal 39)
 * Mnemonic code for generating deterministic keys.
 * Specification: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
 */

import { BIP39_ENGLISH_WORDLIST } from './wordlist';
import { bytesToHex, hexToBytes, stringToBytes, add64 } from '../../utils';
import { ComputationStep, ComputationResult } from '../../types';
import { K as K256, H_256 } from '../../sha256/constants';
import { sigma0, sigma1, bigSigma0, bigSigma1, ch, maj } from '../../sha256/operations';
import { K_512, H_512 } from '../../sha512/constants';
import { sigma0_64, sigma1_64, bigSigma0_64, bigSigma1_64, ch64, maj64 } from '../../sha512/operations';

export interface Bip39StepData {
  toolType: 'BIP-39';
  entropyBits: number;
  entropyHex: string;
  checksumBits: number;
  checksumHex: string;
  combinedBitstream: string;
  wordCount: number;
  words: Array<{
    index: number;
    wordIndex: number;
    word: string;
    bits11: string;
  }>;
  mnemonicPhrase: string;
  passphrase?: string;
  saltString: string;
  pbkdf2Iteration?: number;
  totalIterations: number;
  progressPercent: number;
  phaseName: string;
  uHexSnippet?: string;
  derivedSeedHex?: string;
  isSummary?: boolean;
}

export function sha256Bytes(msg: Uint8Array): Uint8Array {
  let [h0, h1, h2, h3, h4, h5, h6, h7] = H_256;
  const msgBytes = msg.length;
  const msgBitLen = msgBytes * 8;
  let paddingZeroBytes = 64 - ((msgBytes + 1 + 8) % 64);
  if (paddingZeroBytes === 64) paddingZeroBytes = 0;
  const totalLen = msgBytes + 1 + paddingZeroBytes + 8;

  const padded = new Uint8Array(totalLen);
  padded.set(msg);
  padded[msgBytes] = 0x80;
  const dv = new DataView(padded.buffer, padded.byteOffset, totalLen);
  dv.setUint32(totalLen - 4, msgBitLen >>> 0, false);

  const w = new Uint32Array(64);

  for (let i = 0; i < totalLen; i += 64) {
    for (let t = 0; t < 16; t++) {
      w[t] = dv.getUint32(i + t * 4, false);
    }
    for (let t = 16; t < 64; t++) {
      w[t] = (w[t - 16] + sigma0(w[t - 15]) + w[t - 7] + sigma1(w[t - 2])) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3;
    let e = h4, f = h5, g = h6, h = h7;

    for (let t = 0; t < 64; t++) {
      const t1 = (h + bigSigma1(e) + ch(e, f, g) + K256[t] + w[t]) >>> 0;
      const t2 = (bigSigma0(a) + maj(a, b, c)) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const out = new Uint8Array(32);
  const outDv = new DataView(out.buffer, out.byteOffset, 32);
  outDv.setUint32(0, h0, false);
  outDv.setUint32(4, h1, false);
  outDv.setUint32(8, h2, false);
  outDv.setUint32(12, h3, false);
  outDv.setUint32(16, h4, false);
  outDv.setUint32(20, h5, false);
  outDv.setUint32(24, h6, false);
  outDv.setUint32(28, h7, false);
  return out;
}

export function sha512Bytes(msg: Uint8Array): Uint8Array {
  const H = [...H_512];
  const bitLength = BigInt(msg.length) * 8n;
  let k = 112 - ((msg.length + 1) % 128);
  if (k < 0) k += 128;

  const totalLength = msg.length + 1 + k + 16;
  const paddedBytes = new Uint8Array(totalLength);
  paddedBytes.set(msg, 0);
  paddedBytes[msg.length] = 0x80;

  const view = new DataView(paddedBytes.buffer, paddedBytes.byteOffset, paddedBytes.byteLength);
  view.setBigUint64(totalLength - 16, 0n, false);
  view.setBigUint64(totalLength - 8, bitLength, false);

  const numBlocks = totalLength / 128;

  for (let blockIdx = 0; blockIdx < numBlocks; blockIdx++) {
    const offset = blockIdx * 128;
    const W = new Array<bigint>(80).fill(0n);

    for (let t = 0; t < 16; t++) {
      W[t] = view.getBigUint64(offset + t * 8, false);
    }
    for (let t = 16; t < 80; t++) {
      W[t] = add64(sigma1_64(W[t - 2]), W[t - 7], sigma0_64(W[t - 15]), W[t - 16]);
    }

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
    }

    H[0] = add64(H[0], a);
    H[1] = add64(H[1], b);
    H[2] = add64(H[2], c);
    H[3] = add64(H[3], d);
    H[4] = add64(H[4], e);
    H[5] = add64(H[5], f);
    H[6] = add64(H[6], g);
    H[7] = add64(H[7], h);
  }

  const out = new Uint8Array(64);
  const outDv = new DataView(out.buffer, out.byteOffset, 64);
  for (let i = 0; i < 8; i++) {
    outDv.setBigUint64(i * 8, H[i], false);
  }
  return out;
}

export function hmacSha512Bytes(key: Uint8Array, msg: Uint8Array): Uint8Array {
  let k = key;
  if (k.length > 128) {
    k = sha512Bytes(k);
  }
  const keyPad = new Uint8Array(128);
  keyPad.set(k, 0);

  const iPad = new Uint8Array(128);
  const oPad = new Uint8Array(128);
  for (let i = 0; i < 128; i++) {
    iPad[i] = keyPad[i] ^ 0x36;
    oPad[i] = keyPad[i] ^ 0x5c;
  }

  const innerMsg = new Uint8Array(128 + msg.length);
  innerMsg.set(iPad, 0);
  innerMsg.set(msg, 128);
  const innerHash = sha512Bytes(innerMsg);

  const outerMsg = new Uint8Array(128 + 64);
  outerMsg.set(oPad, 0);
  outerMsg.set(innerHash, 128);
  return sha512Bytes(outerMsg);
}

/**
 * Convert entropy bytes to BIP-39 mnemonic phrase and 512-bit seed
 */
export function computeBip39(
  entropyInput?: string | Uint8Array,
  passphrase = '',
  wordCount = 12,
): ComputationResult {
  const steps: ComputationStep[] = [];

  let entropy: Uint8Array;
  if (!entropyInput) {
    // Generate default random entropy based on wordCount (12 -> 16 bytes, 24 -> 32 bytes)
    const byteLen = wordCount === 24 ? 32 : wordCount === 18 ? 24 : wordCount === 15 ? 20 : 16;
    entropy = new Uint8Array(byteLen);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(entropy);
    } else {
      for (let i = 0; i < byteLen; i++) entropy[i] = (Math.random() * 256) | 0;
    }
  } else if (typeof entropyInput === 'string') {
    const clean = entropyInput.trim().replace(/^0x/i, '');
    entropy = hexToBytes(clean);
  } else {
    entropy = entropyInput;
  }

  const entropyBits = entropy.length * 8;
  const entropyHex = bytesToHex(entropy);
  const checksumBits = entropyBits / 32;
  const expectedWords = (entropyBits + checksumBits) / 11;

  steps.push({
    id: 'bip39-entropy',
    title: `BIP-39 Entropy Acquisition (${entropyBits} Bits / ${entropy.length} Bytes)`,
    phase: 'ENTROPY GENERATION',
    description: `Acquired ${entropyBits}-bit initial cryptographic entropy buffer (${entropy.length} bytes).\nEntropy Hex: 0x${entropyHex}.\nTarget Word Count: ${expectedWords} English mnemonic words.`,
    visualizationType: 'binary-transform',
    data: {
      bip39: {
        toolType: 'BIP-39',
        entropyBits,
        entropyHex,
        checksumBits,
        checksumHex: '',
        combinedBitstream: '',
        wordCount: expectedWords,
        words: [],
        mnemonicPhrase: '',
        passphrase,
        saltString: `mnemonic${passphrase}`,
        totalIterations: 2048,
        progressPercent: 10,
        phaseName: 'Entropy Acquisition',
      } as Bip39StepData,
    },
  });

  // Checksum calculation via SHA-256
  const hash = sha256Bytes(entropy);
  const hashHex = bytesToHex(hash);
  const checksumHex = hashHex.slice(0, Math.ceil(checksumBits / 4));

  // Build binary string of entropy + checksum
  let bitstream = '';
  for (let i = 0; i < entropy.length; i++) {
    bitstream += entropy[i].toString(2).padStart(8, '0');
  }

  // Append checksum bits from SHA-256
  const hashBits = Array.from(hash).map((b) => b.toString(2).padStart(8, '0')).join('');
  const csBits = hashBits.slice(0, checksumBits);
  bitstream += csBits;

  steps.push({
    id: 'bip39-checksum',
    title: `SHA-256 Checksum Calculation (${checksumBits} Bits Append)`,
    phase: 'CHECKSUM COMPUTATION',
    description: `Computed SHA-256(ENT): 0x${hashHex}.\nExtracted leading ${checksumBits} bits (${csBits}) and appended to entropy.\nTotal Bitstream Length: ${bitstream.length} bits (${entropyBits} ENT + ${checksumBits} CS).`,
    visualizationType: 'binary-transform',
    data: {
      bip39: {
        toolType: 'BIP-39',
        entropyBits,
        entropyHex,
        checksumBits,
        checksumHex: `0x${checksumHex} (${csBits})`,
        combinedBitstream: bitstream,
        wordCount: expectedWords,
        words: [],
        mnemonicPhrase: '',
        passphrase,
        saltString: `mnemonic${passphrase}`,
        totalIterations: 2048,
        progressPercent: 20,
        phaseName: 'SHA-256 Checksum Appending',
      } as Bip39StepData,
    },
  });

  // Split into 11-bit chunks and look up words
  const words: Array<{ index: number; wordIndex: number; word: string; bits11: string }> = [];
  const mnemonicWordsList: string[] = [];

  for (let i = 0; i < expectedWords; i++) {
    const chunk = bitstream.slice(i * 11, (i + 1) * 11);
    const wordIndex = parseInt(chunk, 2);
    const word = BIP39_ENGLISH_WORDLIST[wordIndex] || 'unknown';
    words.push({
      index: i + 1,
      wordIndex,
      word,
      bits11: chunk,
    });
    mnemonicWordsList.push(word);
  }

  const mnemonicPhrase = mnemonicWordsList.join(' ');

  steps.push({
    id: 'bip39-word-mapping',
    title: `11-Bit Radix Wordlist Mapping (${expectedWords} Words)`,
    phase: 'WORDLIST MAPPING',
    description: `Divided ${bitstream.length}-bit stream into ${expectedWords} slices of 11 bits (indices 0..2047).\nMapped each 11-bit index into the standard BIP-39 2048-word English dictionary.`,
    visualizationType: 'binary-transform',
    data: {
      bip39: {
        toolType: 'BIP-39',
        entropyBits,
        entropyHex,
        checksumBits,
        checksumHex: `0x${checksumHex}`,
        combinedBitstream: bitstream,
        wordCount: expectedWords,
        words,
        mnemonicPhrase,
        passphrase,
        saltString: `mnemonic${passphrase}`,
        totalIterations: 2048,
        progressPercent: 35,
        phaseName: '11-Bit Dictionary Mapping',
      } as Bip39StepData,
    },
  });

  steps.push({
    id: 'bip39-mnemonic-phrase',
    title: 'BIP-39 Mnemonic Phrase Assembly',
    phase: 'MNEMONIC ASSEMBLY',
    description: `Assembled standard ${expectedWords}-word human-readable recovery phrase:\n"${mnemonicPhrase}".`,
    visualizationType: 'binary-transform',
    data: {
      bip39: {
        toolType: 'BIP-39',
        entropyBits,
        entropyHex,
        checksumBits,
        checksumHex: `0x${checksumHex}`,
        combinedBitstream: bitstream,
        wordCount: expectedWords,
        words,
        mnemonicPhrase,
        passphrase,
        saltString: `mnemonic${passphrase}`,
        totalIterations: 2048,
        progressPercent: 45,
        phaseName: 'Mnemonic Phrase Verified',
      } as Bip39StepData,
    },
  });

  // Seed Derivation via PBKDF2-HMAC-SHA512 (2048 iterations)
  const passwordNorm = typeof mnemonicPhrase.normalize === 'function' ? mnemonicPhrase.normalize('NFKD') : mnemonicPhrase;
  const saltRaw = 'mnemonic' + passphrase;
  const saltNorm = typeof saltRaw.normalize === 'function' ? saltRaw.normalize('NFKD') : saltRaw;

  const passwordBytes = stringToBytes(passwordNorm);
  const saltBytes = stringToBytes(saltNorm);

  const saltI = new Uint8Array(saltBytes.length + 4);
  saltI.set(saltBytes, 0);
  new DataView(saltI.buffer).setUint32(saltBytes.length, 1, false);

  let uPrev = hmacSha512Bytes(passwordBytes, saltI);
  const T = new Uint8Array(64);
  T.set(uPrev);

  // Compute all 2048 iterations internally
  for (let c = 2; c <= 2048; c++) {
    uPrev = hmacSha512Bytes(passwordBytes, uPrev);
    for (let i = 0; i < 64; i++) {
      T[i] ^= uPrev[i];
    }

    if (c === 512 || c === 1024 || c === 1536) {
      const pct = Math.round(45 + (c / 2048) * 50);
      steps.push({
        id: `bip39-pbkdf2-iter-${c}`,
        title: `PBKDF2-HMAC-SHA512 Iteration Cycle #${c}/2048 (${((c / 2048) * 100).toFixed(0)}%)`,
        phase: `PBKDF2 CYCLE ${c}`,
        description: `Executed PBKDF2-HMAC-SHA512 stretch round #${c}.\nIntermediate PRF: 0x${bytesToHex(uPrev.subarray(0, 16))}...\nRunning Accumulator T₁: 0x${bytesToHex(T.subarray(0, 16))}...`,
        visualizationType: 'binary-transform',
        data: {
          bip39: {
            toolType: 'BIP-39',
            entropyBits,
            entropyHex,
            checksumBits,
            checksumHex: `0x${checksumHex}`,
            combinedBitstream: bitstream,
            wordCount: expectedWords,
            words,
            mnemonicPhrase,
            passphrase,
            saltString: saltNorm,
            pbkdf2Iteration: c,
            totalIterations: 2048,
            progressPercent: pct,
            phaseName: `PBKDF2 Stretch (${c}/2048)`,
            uHexSnippet: bytesToHex(uPrev.subarray(0, 16)),
            isSummary: true,
          } as Bip39StepData,
        },
      });
    }
  }

  const derivedSeedHex = bytesToHex(T);

  steps.push({
    id: 'bip39-seed-complete',
    title: 'BIP-39 512-Bit Binary Master Seed Derivation Complete',
    phase: 'SEED COMPLETE',
    description: `Derived 512-bit (64-byte) cryptographic master seed via 2,048 rounds of PBKDF2-HMAC-SHA512.\nMaster Seed: 0x${derivedSeedHex}.\nReady for BIP-32 / BIP-44 hierarchical deterministic (HD) wallet tree derivation.`,
    visualizationType: 'binary-transform',
    data: {
      bytes: 64,
      hex: derivedSeedHex,
      input: mnemonicPhrase,
      output: derivedSeedHex,
      bip39: {
        toolType: 'BIP-39',
        entropyBits,
        entropyHex,
        checksumBits,
        checksumHex: `0x${checksumHex}`,
        combinedBitstream: bitstream,
        wordCount: expectedWords,
        words,
        mnemonicPhrase,
        passphrase,
        saltString: saltNorm,
        pbkdf2Iteration: 2048,
        totalIterations: 2048,
        derivedSeedHex,
        progressPercent: 100,
        phaseName: '512-Bit Seed Derivation Complete',
      } as Bip39StepData,
    },
  });

  return { digest: derivedSeedHex, steps };
}
