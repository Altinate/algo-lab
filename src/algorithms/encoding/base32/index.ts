/**
 * RFC 4648 Base32 Encoding/Decoding Engine & Plugins
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { stringToBytes, bytesToString, bytesToHex } from '../../utils';
import type { BitGroupingData } from '../base64';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function encodeBase32(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const bytes = stringToBytes(input);
  const totalChunks = Math.ceil(bytes.length / 5) || 1;

  steps.push({
    id: 'base32-encode-init',
    title: 'Base32 Input Ingestion & Stream Analysis',
    phase: 'INITIALIZATION',
    description: `Ingested ${bytes.length} bytes (${bytes.length * 8} bits). Partitioned into ${totalChunks} 5-byte (40-bit) chunk${totalChunks === 1 ? '' : 's'} for 5-bit quintet regrouping.`,
    visualizationType: 'binary-transform',
    data: {
      input,
      hex: bytesToHex(bytes),
      binary: Array.from(bytes).map((b) => b.toString(2).padStart(8, '0')).join(' '),
      bitLength: bytes.length * 8,
    },
  });

  let output = '';

  if (bytes.length === 0) {
    steps.push({
      id: 'base32-encode-chunk-0',
      title: 'Base32 Empty Stream Encoding',
      phase: 'BIT REGROUPING',
      description: 'Empty input stream produces 0 quintets and empty output string.',
      visualizationType: 'binary-transform',
      data: {
        bitGrouping: {
          encodingType: 'Base32',
          operation: 'encode',
          chunkIndex: 0,
          totalChunks: 0,
          inputChunkText: '(empty)',
          inputChunkHex: '0x00',
          rawBitstream: '(empty)',
          groupBits: 5,
          groups: [],
          outputBuffer: '',
          alphabet: BASE32_ALPHABET,
          padChars: '',
        } as BitGroupingData,
      },
    });
  }

  for (let i = 0; i < bytes.length; i += 5) {
    const chunkIndex = Math.floor(i / 5);
    const chunkBytes = bytes.slice(i, Math.min(i + 5, bytes.length));
    const chunkHex = bytesToHex(chunkBytes);
    const chunkText = Array.from(chunkBytes)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : `\\x${b.toString(16).padStart(2, '0')}`))
      .join('');

    // 40-bit BigInt buffer
    let buf = 0n;
    for (let j = 0; j < 5; j++) {
      const b = j < chunkBytes.length ? BigInt(chunkBytes[j]) : 0n;
      buf = (buf << 8n) | b;
    }

    const quintets: number[] = [];
    for (let k = 7; k >= 0; k--) {
      const q = Number((buf >> BigInt(k * 5)) & 31n);
      quintets.push(q);
    }

    // Determine how many characters are real vs padding
    // 1 byte -> 2 chars + 6 '='
    // 2 bytes -> 4 chars + 4 '='
    // 3 bytes -> 5 chars + 3 '='
    // 4 bytes -> 7 chars + 1 '='
    // 5 bytes -> 8 chars
    const charCount =
      chunkBytes.length === 1 ? 2 :
      chunkBytes.length === 2 ? 4 :
      chunkBytes.length === 3 ? 5 :
      chunkBytes.length === 4 ? 7 : 8;

    let chunkOutput = '';
    const groups = [];
    const rawBits = Array.from(chunkBytes)
      .map((b) => b.toString(2).padStart(8, '0'))
      .join('')
      .padEnd(40, '0');

    for (let qIdx = 0; qIdx < 8; qIdx++) {
      const isPad = qIdx >= charCount;
      const ch = isPad ? '=' : BASE32_ALPHABET[quintets[qIdx]];
      chunkOutput += ch;
      groups.push({
        bits: rawBits.slice(qIdx * 5, (qIdx + 1) * 5),
        index: quintets[qIdx],
        char: ch,
        isPadding: isPad,
      });
    }

    output += chunkOutput;

    steps.push({
      id: `base32-encode-chunk-${chunkIndex}`,
      title: `Chunk ${chunkIndex + 1}/${totalChunks}: 40-bit → 8×5-bit Quintets`,
      phase: 'BIT REGROUPING',
      description: `Chunk ${chunkIndex + 1}: ${chunkBytes.length} byte(s) [${chunkHex}] → 5-bit indices [${quintets.slice(0, charCount).join(', ')}] mapped to "${chunkOutput}".`,
      visualizationType: 'binary-transform',
      data: {
        bitGrouping: {
          encodingType: 'Base32',
          operation: 'encode',
          chunkIndex: chunkIndex + 1,
          totalChunks,
          inputChunkText: chunkText,
          inputChunkHex: chunkHex,
          rawBitstream: rawBits,
          groupBits: 5,
          groups,
          outputBuffer: output,
          alphabet: BASE32_ALPHABET,
          padChars: '='.repeat(8 - charCount),
        } as BitGroupingData,
      },
    });
  }

  steps.push({
    id: 'base32-encode-complete',
    title: 'Base32 Encoding Complete',
    phase: 'COMPLETE',
    description: `Encoded ${bytes.length} bytes into ${output.length}-character Base32 string: "${output}".`,
    visualizationType: 'binary-transform',
    data: {
      bytes: output.length,
      hex: bytesToHex(stringToBytes(output)),
      input,
      output,
    },
  });

  return { digest: output, steps };
}

export function decodeBase32(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const cleanInput = input.trim().toUpperCase();
  const unpadded = cleanInput.replace(/=+$/, '');
  const totalBlocks = Math.ceil(unpadded.length / 8) || 1;

  steps.push({
    id: 'base32-decode-init',
    title: 'Base32 Input Parsing & Validation',
    phase: 'INITIALIZATION',
    description: `Parsed ${cleanInput.length}-char Base32 string (${unpadded.length} unpadded). Partitioned into ${totalBlocks} 8-char (40-bit) decoding block${totalBlocks === 1 ? '' : 's'}.`,
    visualizationType: 'binary-transform',
    data: {
      input: cleanInput,
      hex: bytesToHex(stringToBytes(cleanInput)),
      bitLength: cleanInput.length * 5,
    },
  });

  const outBytes: number[] = [];

  for (let i = 0; i < unpadded.length; i += 8) {
    const blockIndex = Math.floor(i / 8);
    const chars = unpadded.slice(i, Math.min(i + 8, unpadded.length));
    const indices = Array.from(chars).map((c) => BASE32_ALPHABET.indexOf(c));

    let buf = 0n;
    for (let j = 0; j < 8; j++) {
      const val = j < indices.length && indices[j] >= 0 ? BigInt(indices[j]) : 0n;
      buf = (buf << 5n) | val;
    }

    const numBytes =
      chars.length === 2 ? 1 :
      chars.length === 4 ? 2 :
      chars.length === 5 ? 3 :
      chars.length === 7 ? 4 :
      chars.length === 8 ? 5 : Math.floor((chars.length * 5) / 8);

    const blockBytes: number[] = [];
    for (let bIdx = 0; bIdx < numBytes; bIdx++) {
      const b = Number((buf >> BigInt((4 - bIdx) * 8)) & 255n);
      blockBytes.push(b);
    }

    outBytes.push(...blockBytes);

    const blockHex = bytesToHex(new Uint8Array(blockBytes));
    const blockText = blockBytes
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : `\\x${b.toString(16).padStart(2, '0')}`))
      .join('');

    const rawBits = indices
      .filter((idx) => idx >= 0)
      .map((idx) => idx.toString(2).padStart(5, '0'))
      .join('');

    const groups = Array.from(chars).map((c, idx) => ({
      bits: (indices[idx] >= 0 ? indices[idx] : 0).toString(2).padStart(5, '0'),
      index: indices[idx],
      char: c,
    }));

    steps.push({
      id: `base32-decode-block-${blockIndex}`,
      title: `Block ${blockIndex + 1}/${totalBlocks}: 8×5-bit Quintets → 5×8-bit Octets`,
      phase: 'BIT REGROUPING',
      description: `Block ${blockIndex + 1}: Chars "${chars}" [indices ${indices.join(', ')}] → 40-bit stream → ${blockBytes.length} decoded byte(s) [${blockHex}] ("${blockText}").`,
      visualizationType: 'binary-transform',
      data: {
        bitGrouping: {
          encodingType: 'Base32',
          operation: 'decode',
          chunkIndex: blockIndex + 1,
          totalChunks: totalBlocks,
          inputChunkText: chars,
          inputChunkHex: blockHex,
          rawBitstream: rawBits,
          groupBits: 5,
          groups,
          outputBuffer: bytesToString(new Uint8Array(outBytes)),
          alphabet: BASE32_ALPHABET,
        } as BitGroupingData,
      },
    });
  }

  const decodedResult = bytesToString(new Uint8Array(outBytes));

  steps.push({
    id: 'base32-decode-complete',
    title: 'Base32 Decoding Complete',
    phase: 'COMPLETE',
    description: `Decoded ${cleanInput.length} Base32 characters into ${outBytes.length} bytes: "${decodedResult}".`,
    visualizationType: 'binary-transform',
    data: {
      bytes: outBytes.length,
      hex: bytesToHex(new Uint8Array(outBytes)),
      input: cleanInput,
      output: decodedResult,
    },
  });

  return { digest: decodedResult, steps };
}

export const base32EncodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Base32 (Encode)',
    family: 'Positional/Radix Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 40,
    description: 'RFC 4648 Base32 5-bit positional encoding using (A-Z, 2-7) alphabet and (=) padding.',
    useCases: ['TOTP / 2FA secrets (Google Authenticator)', 'Human-entered serial keys', 'DNSSEC records', 'Tor Onion v3 addresses'],
    security: 'non-cryptographic',
    year: 2006,
    designers: ['Josefsson (RFC 4648)'],
    direction: 'encrypt',
  },
  compute(input: string): ComputationResult {
    return encodeBase32(input);
  },
};

export const base32DecodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Base32 (Decode)',
    family: 'Positional/Radix Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 40,
    description: 'RFC 4648 Base32 decoding into original binary/text payload.',
    useCases: ['2FA secret import', 'Tor address parsing', 'Activation key verification'],
    security: 'non-cryptographic',
    year: 2006,
    designers: ['Josefsson (RFC 4648)'],
    direction: 'decrypt',
  },
  compute(input: string): ComputationResult {
    return decodeBase32(input);
  },
};
