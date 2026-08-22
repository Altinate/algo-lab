/**
 * RFC 4648 Base64 & Base64URL Encoding/Decoding Engine & Plugins
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { stringToBytes, bytesToString, bytesToHex } from '../../utils';

const BASE64_STD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export interface BitGroupingData {
  encodingType: string;
  operation: 'encode' | 'decode';
  chunkIndex: number;
  totalChunks: number;
  inputChunkText: string;
  inputChunkHex: string;
  rawBitstream: string;
  groupBits: number;
  groups: Array<{
    bits: string;
    index: number;
    char: string;
    isPadding?: boolean;
  }>;
  outputBuffer: string;
  alphabet: string;
  padChars?: string;
}

export function encodeBase64(
  input: string,
  urlSafe: boolean = false
): ComputationResult {
  const alphabet = urlSafe ? BASE64_URL_ALPHABET : BASE64_STD_ALPHABET;
  const name = urlSafe ? 'Base64URL' : 'Base64';
  const steps: ComputationStep[] = [];
  const bytes = stringToBytes(input);
  const totalChunks = Math.ceil(bytes.length / 3) || 1;

  steps.push({
    id: 'base64-encode-init',
    title: `${name} Input Ingestion & Stream Analysis`,
    phase: 'INITIALIZATION',
    description: `Ingested ${bytes.length} bytes (${bytes.length * 8} bits) of input text. Split into ${totalChunks} 3-byte (24-bit) chunk${totalChunks === 1 ? '' : 's'} for 6-bit sextet regrouping.`,
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
      id: 'base64-encode-chunk-0',
      title: `${name} Empty Stream Encoding`,
      phase: 'BIT REGROUPING',
      description: `Empty input stream produces 0 sextets and empty output string.`,
      visualizationType: 'binary-transform',
      data: {
        bitGrouping: {
          encodingType: name,
          operation: 'encode',
          chunkIndex: 0,
          totalChunks: 0,
          inputChunkText: '(empty)',
          inputChunkHex: '0x00',
          rawBitstream: '(empty)',
          groupBits: 6,
          groups: [],
          outputBuffer: '',
          alphabet: alphabet.slice(0, 16) + '...',
          padChars: '',
        } as BitGroupingData,
      },
    });
  }

  for (let i = 0; i < bytes.length; i += 3) {
    const chunkIndex = Math.floor(i / 3);
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;

    const chunkBytes = bytes.slice(i, Math.min(i + 3, bytes.length));
    const chunkHex = bytesToHex(chunkBytes);
    const chunkText = Array.from(chunkBytes)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : `\\x${b.toString(16).padStart(2, '0')}`))
      .join('');

    // 24-bit buffer
    let buf = (b0 << 16);
    if (b1 !== undefined) buf |= (b1 << 8);
    if (b2 !== undefined) buf |= b2;

    const s0 = (buf >> 18) & 63;
    const s1 = (buf >> 12) & 63;
    const s2 = b1 !== undefined ? (buf >> 6) & 63 : undefined;
    const s3 = b2 !== undefined ? buf & 63 : undefined;

    const c0 = alphabet[s0];
    const c1 = alphabet[s1];
    const c2 = s2 !== undefined ? alphabet[s2] : urlSafe ? '' : '=';
    const c3 = s3 !== undefined ? alphabet[s3] : urlSafe ? '' : '=';

    output += c0 + c1 + c2 + c3;

    const rawBits = Array.from(chunkBytes)
      .map((b) => b.toString(2).padStart(8, '0'))
      .join('')
      .padEnd(24, '0');

    const groups = [
      { bits: rawBits.slice(0, 6), index: s0, char: c0 },
      { bits: rawBits.slice(6, 12), index: s1, char: c1 },
      { bits: rawBits.slice(12, 18), index: s2 ?? 0, char: c2, isPadding: s2 === undefined },
      { bits: rawBits.slice(18, 24), index: s3 ?? 0, char: c3, isPadding: s3 === undefined },
    ].filter((g) => g.char !== '');

    steps.push({
      id: `base64-encode-chunk-${chunkIndex}`,
      title: `Chunk ${chunkIndex + 1}/${totalChunks}: 24-bit → 4×6-bit Sextets`,
      phase: 'BIT REGROUPING',
      description: `Chunk ${chunkIndex + 1}: ${chunkBytes.length} byte(s) [${chunkHex}] → 6-bit indices [${s0}, ${s1}${s2 !== undefined ? `, ${s2}` : ', pad'}${s3 !== undefined ? `, ${s3}` : ', pad'}] mapped to "${c0}${c1}${c2}${c3}".`,
      visualizationType: 'binary-transform',
      data: {
        bitGrouping: {
          encodingType: name,
          operation: 'encode',
          chunkIndex: chunkIndex + 1,
          totalChunks,
          inputChunkText: chunkText,
          inputChunkHex: chunkHex,
          rawBitstream: rawBits,
          groupBits: 6,
          groups,
          outputBuffer: output,
          alphabet,
          padChars: (s2 === undefined ? '=' : '') + (s3 === undefined ? '=' : ''),
        } as BitGroupingData,
      },
    });
  }

  steps.push({
    id: 'base64-encode-complete',
    title: `${name} Encoding Complete`,
    phase: 'COMPLETE',
    description: `Encoded ${bytes.length} bytes into ${output.length}-character ${name} string: "${output}".`,
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

export function decodeBase64(
  input: string,
  urlSafe: boolean = false
): ComputationResult {
  const alphabet = urlSafe ? BASE64_URL_ALPHABET : BASE64_STD_ALPHABET;
  const name = urlSafe ? 'Base64URL' : 'Base64';
  const steps: ComputationStep[] = [];

  const cleanInput = input.trim();
  const unpadded = cleanInput.replace(/=+$/, '');
  const totalBlocks = Math.ceil(unpadded.length / 4) || 1;

  steps.push({
    id: 'base64-decode-init',
    title: `${name} Input Parsing & Validation`,
    phase: 'INITIALIZATION',
    description: `Parsed ${cleanInput.length}-char ${name} string (${unpadded.length} unpadded chars). Partitioned into ${totalBlocks} 4-char (24-bit) decoding block${totalBlocks === 1 ? '' : 's'}.`,
    visualizationType: 'binary-transform',
    data: {
      input: cleanInput,
      hex: bytesToHex(stringToBytes(cleanInput)),
      bitLength: cleanInput.length * 6,
    },
  });

  const outBytes: number[] = [];

  for (let i = 0; i < unpadded.length; i += 4) {
    const blockIndex = Math.floor(i / 4);
    const chars = unpadded.slice(i, Math.min(i + 4, unpadded.length));
    const indices = Array.from(chars).map((c) => alphabet.indexOf(c));

    let buf = 0;
    for (let j = 0; j < 4; j++) {
      buf = (buf << 6) | (indices[j] >= 0 ? indices[j] : 0);
    }

    const b0 = (buf >> 16) & 255;
    const b1 = (buf >> 8) & 255;
    const b2 = buf & 255;

    const blockBytes: number[] = [b0];
    if (chars.length >= 3) blockBytes.push(b1);
    if (chars.length >= 4) blockBytes.push(b2);

    outBytes.push(...blockBytes);

    const blockHex = bytesToHex(new Uint8Array(blockBytes));
    const blockText = blockBytes
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : `\\x${b.toString(16).padStart(2, '0')}`))
      .join('');

    const rawBits = indices
      .filter((idx) => idx >= 0)
      .map((idx) => idx.toString(2).padStart(6, '0'))
      .join('');

    const groups = Array.from(chars).map((c, idx) => ({
      bits: (indices[idx] >= 0 ? indices[idx] : 0).toString(2).padStart(6, '0'),
      index: indices[idx],
      char: c,
    }));

    steps.push({
      id: `base64-decode-block-${blockIndex}`,
      title: `Block ${blockIndex + 1}/${totalBlocks}: 4×6-bit Sextets → 3×8-bit Octets`,
      phase: 'BIT REGROUPING',
      description: `Block ${blockIndex + 1}: Chars "${chars}" [indices ${indices.join(', ')}] → 24-bit stream → ${blockBytes.length} decoded byte(s) [${blockHex}] ("${blockText}").`,
      visualizationType: 'binary-transform',
      data: {
        bitGrouping: {
          encodingType: name,
          operation: 'decode',
          chunkIndex: blockIndex + 1,
          totalChunks: totalBlocks,
          inputChunkText: chars,
          inputChunkHex: blockHex,
          rawBitstream: rawBits,
          groupBits: 6,
          groups,
          outputBuffer: bytesToString(new Uint8Array(outBytes)),
          alphabet,
        } as BitGroupingData,
      },
    });
  }

  const decodedResult = bytesToString(new Uint8Array(outBytes));

  steps.push({
    id: 'base64-decode-complete',
    title: `${name} Decoding Complete`,
    phase: 'COMPLETE',
    description: `Decoded ${cleanInput.length} ${name} characters into ${outBytes.length} bytes: "${decodedResult}".`,
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

export const base64EncodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Base64 (Encode)',
    family: 'Positional/Radix Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 24,
    description: 'RFC 4648 Base64 radix-64 positional encoding with standard (+, /) alphabet and (=) padding.',
    useCases: ['MIME email attachments', 'Data URIs', 'JSON binary payload transport', 'Cryptographic key serialization'],
    security: 'non-cryptographic',
    year: 2006,
    designers: ['Josefsson (RFC 4648)'],
    direction: 'encrypt',
  },
  compute(input: string): ComputationResult {
    return encodeBase64(input, false);
  },
};

export const base64DecodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Base64 (Decode)',
    family: 'Positional/Radix Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 24,
    description: 'RFC 4648 Base64 radix-64 decoding into original binary/text representation.',
    useCases: ['Payload unpacking', 'Certificate & key parsing', 'Data URI decoding'],
    security: 'non-cryptographic',
    year: 2006,
    designers: ['Josefsson (RFC 4648)'],
    direction: 'decrypt',
  },
  compute(input: string): ComputationResult {
    return decodeBase64(input, false);
  },
};

export const base64UrlEncodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Base64URL (Encode)',
    family: 'Positional/Radix Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 24,
    description: 'RFC 4648 §5 Base64 URL-safe encoding using (-, _) alphabet without URL escaping conflicts.',
    useCases: ['JSON Web Tokens (JWT)', 'OAuth2 tokens', 'URL query parameters', 'Filenames'],
    security: 'non-cryptographic',
    year: 2006,
    designers: ['Josefsson (RFC 4648)'],
    direction: 'encrypt',
  },
  compute(input: string): ComputationResult {
    return encodeBase64(input, true);
  },
};

export const base64UrlDecodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Base64URL (Decode)',
    family: 'Positional/Radix Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 24,
    description: 'RFC 4648 §5 Base64 URL-safe decoding back to original text/binary payload.',
    useCases: ['JWT payload verification', 'OAuth token parsing', 'URL parameter extraction'],
    security: 'non-cryptographic',
    year: 2006,
    designers: ['Josefsson (RFC 4648)'],
    direction: 'decrypt',
  },
  compute(input: string): ComputationResult {
    return decodeBase64(input, true);
  },
};
