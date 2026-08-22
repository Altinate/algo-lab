/**
 * RFC 4648 Base16 / Hexadecimal Encoding/Decoding Engine & Plugins
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { stringToBytes, bytesToString, bytesToHex, hexToBytes } from '../../utils';
import type { BitGroupingData } from '../base64';

const BASE16_ALPHABET = '0123456789ABCDEF';

export function encodeBase16(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const bytes = stringToBytes(input);
  const totalChunks = bytes.length || 1;

  steps.push({
    id: 'base16-encode-init',
    title: 'Base16 (Hex) Input Ingestion & Stream Analysis',
    phase: 'INITIALIZATION',
    description: `Ingested ${bytes.length} bytes (${bytes.length * 8} bits). Partitioned into ${bytes.length} 1-byte (8-bit) chunk${bytes.length === 1 ? '' : 's'} for 4-bit nibble decomposition.`,
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
      id: 'base16-encode-chunk-0',
      title: 'Base16 Empty Stream Encoding',
      phase: 'BIT REGROUPING',
      description: 'Empty input stream produces 0 nibbles and empty hex string.',
      visualizationType: 'binary-transform',
      data: {
        bitGrouping: {
          encodingType: 'Base16 (Hex)',
          operation: 'encode',
          chunkIndex: 0,
          totalChunks: 0,
          inputChunkText: '(empty)',
          inputChunkHex: '0x00',
          rawBitstream: '(empty)',
          groupBits: 4,
          groups: [],
          outputBuffer: '',
          alphabet: BASE16_ALPHABET,
        } as BitGroupingData,
      },
    });
  }

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    const highNibble = (b >> 4) & 0x0f;
    const lowNibble = b & 0x0f;

    const highChar = BASE16_ALPHABET[highNibble];
    const lowChar = BASE16_ALPHABET[lowNibble];
    output += highChar + lowChar;

    const rawBits = b.toString(2).padStart(8, '0');
    const chText = b >= 32 && b <= 126 ? String.fromCharCode(b) : `\\x${b.toString(16).padStart(2, '0')}`;

    const groups = [
      { bits: rawBits.slice(0, 4), index: highNibble, char: highChar },
      { bits: rawBits.slice(4, 8), index: lowNibble, char: lowChar },
    ];

    steps.push({
      id: `base16-encode-byte-${i}`,
      title: `Byte ${i + 1}/${totalChunks}: "${chText}" (0x${b.toString(16).padStart(2, '0').toUpperCase()}) → 2×4-bit Nibbles`,
      phase: 'BIT REGROUPING',
      description: `Byte ${i + 1} (${b}): Upper nibble 0b${rawBits.slice(0, 4)} (${highNibble}) → '${highChar}', Lower nibble 0b${rawBits.slice(4, 8)} (${lowNibble}) → '${lowChar}'.`,
      visualizationType: 'binary-transform',
      data: {
        bitGrouping: {
          encodingType: 'Base16 (Hex)',
          operation: 'encode',
          chunkIndex: i + 1,
          totalChunks,
          inputChunkText: chText,
          inputChunkHex: `0x${b.toString(16).padStart(2, '0').toUpperCase()}`,
          rawBitstream: rawBits,
          groupBits: 4,
          groups,
          outputBuffer: output,
          alphabet: BASE16_ALPHABET,
        } as BitGroupingData,
      },
    });
  }

  steps.push({
    id: 'base16-encode-complete',
    title: 'Base16 (Hex) Encoding Complete',
    phase: 'COMPLETE',
    description: `Encoded ${bytes.length} bytes into ${output.length}-character hexadecimal string: "${output}".`,
    visualizationType: 'binary-transform',
    data: {
      bytes: output.length,
      hex: output,
      input,
      output,
    },
  });

  return { digest: output, steps };
}

export function decodeBase16(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const cleanInput = input.trim().replace(/\s+/g, '').toUpperCase();
  const totalPairs = Math.floor(cleanInput.length / 2);

  steps.push({
    id: 'base16-decode-init',
    title: 'Base16 (Hex) Input Parsing & Validation',
    phase: 'INITIALIZATION',
    description: `Parsed ${cleanInput.length}-char hex string into ${totalPairs} 2-char nibble pair${totalPairs === 1 ? '' : 's'}.`,
    visualizationType: 'binary-transform',
    data: {
      input: cleanInput,
      hex: cleanInput,
      bitLength: cleanInput.length * 4,
    },
  });

  const outBytes: number[] = [];

  for (let i = 0; i < cleanInput.length; i += 2) {
    const pairIndex = Math.floor(i / 2);
    const pair = cleanInput.slice(i, Math.min(i + 2, cleanInput.length));
    const highVal = BASE16_ALPHABET.indexOf(pair[0]);
    const lowVal = pair.length > 1 ? BASE16_ALPHABET.indexOf(pair[1]) : 0;

    const byteVal = (highVal << 4) | (lowVal >= 0 ? lowVal : 0);
    outBytes.push(byteVal);

    const chText = byteVal >= 32 && byteVal <= 126 ? String.fromCharCode(byteVal) : `\\x${byteVal.toString(16).padStart(2, '0')}`;
    const rawBits = (highVal >= 0 ? highVal : 0).toString(2).padStart(4, '0') + (lowVal >= 0 ? lowVal : 0).toString(2).padStart(4, '0');

    const groups = [
      { bits: (highVal >= 0 ? highVal : 0).toString(2).padStart(4, '0'), index: highVal, char: pair[0] },
      { bits: (lowVal >= 0 ? lowVal : 0).toString(2).padStart(4, '0'), index: lowVal, char: pair[1] || '0' },
    ];

    steps.push({
      id: `base16-decode-pair-${pairIndex}`,
      title: `Pair ${pairIndex + 1}/${totalPairs}: "${pair}" → 1 Byte (${byteVal} / "${chText}")`,
      phase: 'BIT REGROUPING',
      description: `Pair ${pairIndex + 1}: Nibbles '${pair[0]}' (${highVal}) and '${pair[1] || '0'}' (${lowVal}) combined into byte 0x${pair} (${byteVal}).`,
      visualizationType: 'binary-transform',
      data: {
        bitGrouping: {
          encodingType: 'Base16 (Hex)',
          operation: 'decode',
          chunkIndex: pairIndex + 1,
          totalChunks: totalPairs,
          inputChunkText: pair,
          inputChunkHex: `0x${pair}`,
          rawBitstream: rawBits,
          groupBits: 4,
          groups,
          outputBuffer: bytesToString(new Uint8Array(outBytes)),
          alphabet: BASE16_ALPHABET,
        } as BitGroupingData,
      },
    });
  }

  const decodedResult = bytesToString(new Uint8Array(outBytes));

  steps.push({
    id: 'base16-decode-complete',
    title: 'Base16 (Hex) Decoding Complete',
    phase: 'COMPLETE',
    description: `Decoded ${cleanInput.length} hex digits into ${outBytes.length} bytes: "${decodedResult}".`,
    visualizationType: 'binary-transform',
    data: {
      bytes: outBytes.length,
      hex: cleanInput,
      input: cleanInput,
      output: decodedResult,
    },
  });

  return { digest: decodedResult, steps };
}

export const base16EncodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Base16 / Hex (Encode)',
    family: 'Positional/Radix Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 8,
    description: 'RFC 4648 Base16 hexadecimal byte-to-nibble encoding (0-9, A-F).',
    useCases: ['Hex dump inspection', 'Cryptographic key/hash display', 'Memory address debugging', 'Protocol payload formatting'],
    security: 'non-cryptographic',
    year: 2006,
    designers: ['Josefsson (RFC 4648)'],
    direction: 'encrypt',
  },
  compute(input: string): ComputationResult {
    return encodeBase16(input);
  },
};

export const base16DecodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Base16 / Hex (Decode)',
    family: 'Positional/Radix Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 8,
    description: 'RFC 4648 Base16 hexadecimal decoding into original binary/text payload.',
    useCases: ['Hex string parsing', 'Raw byte reconstruction', 'Cryptographic digest input'],
    security: 'non-cryptographic',
    year: 2006,
    designers: ['Josefsson (RFC 4648)'],
    direction: 'decrypt',
  },
  compute(input: string): ComputationResult {
    return decodeBase16(input);
  },
};
