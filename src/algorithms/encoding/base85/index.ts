/**
 * Base85 / ASCII85 (Adobe Standard) Encoding & Decoding Engine & Plugins
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { stringToBytes, bytesToString, bytesToHex } from '../../utils';
import type { RadixDivisionData } from '../base58';

export function encodeBase85(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const bytes = stringToBytes(input);
  const totalChunks = Math.ceil(bytes.length / 4) || 1;

  steps.push({
    id: 'base85-encode-init',
    title: 'Base85 / ASCII85 Input Stream Ingestion',
    phase: 'INITIALIZATION',
    description: `Ingested ${bytes.length} byte(s) (${bytes.length * 8} bits). Partitioned into ${totalChunks} 4-byte (32-bit) chunk${totalChunks === 1 ? '' : 's'} for radix-85 5-character polynomial evaluation.`,
    visualizationType: 'binary-transform',
    data: {
      input,
      hex: bytesToHex(bytes),
      bitLength: bytes.length * 8,
    },
  });

  let output = '';

  if (bytes.length === 0) {
    return { digest: '', steps };
  }

  for (let i = 0; i < bytes.length; i += 4) {
    const chunkIndex = Math.floor(i / 4);
    const chunk = bytes.slice(i, Math.min(i + 4, bytes.length));
    const pad = 4 - chunk.length;

    let n = 0;
    for (let j = 0; j < 4; j++) {
      n = (n * 256) + (j < chunk.length ? chunk[j] : 0);
    }

    if (pad === 0 && n === 0) {
      output += 'z';
      steps.push({
        id: `base85-encode-chunk-${chunkIndex}`,
        title: `Chunk ${chunkIndex + 1}/${totalChunks}: All-Zero Block → 'z' Shortcut`,
        phase: 'RADIX CONVERSION',
        description: `Chunk ${chunkIndex + 1} is 0x00000000 (all zeros). Applying Adobe ASCII85 'z' abbreviation rule.`,
        visualizationType: 'binary-transform',
        data: {
          radixDivision: {
            encodingType: 'ASCII85',
            operation: 'encode',
            dividendStr: '0x00000000 (0)',
            divisor: 85,
            quotientStr: '0',
            remainder: 0,
            mappedChar: 'z',
            leadingZerosCount: 0,
            leadingZerosChars: '',
            digitStack: ['z'],
            outputBuffer: output,
            alphabet: 'ASCII 33 (!) .. 117 (u) + "z"',
            iteration: chunkIndex + 1,
            totalIterations: totalChunks,
          } as RadixDivisionData,
        },
      });
      continue;
    }

    const digits: number[] = [];
    let temp = n;
    for (let j = 0; j < 5; j++) {
      digits.push(temp % 85);
      temp = Math.floor(temp / 85);
    }
    digits.reverse();

    const fullChars = digits.map((d) => String.fromCharCode(33 + d)).join('');
    const chunkChars = pad > 0 ? fullChars.slice(0, 5 - pad) : fullChars;
    output += chunkChars;

    const chunkHex = bytesToHex(chunk);

    steps.push({
      id: `base85-encode-chunk-${chunkIndex}`,
      title: `Chunk ${chunkIndex + 1}/${totalChunks}: 0x${n.toString(16).padStart(8, '0').toUpperCase()} (${n}) → "${chunkChars}"`,
      phase: 'RADIX CONVERSION',
      description: `Chunk ${chunkIndex + 1} (${chunk.length} bytes [${chunkHex}]) = ${n} → 5 base-85 digits [${digits.join(', ')}] → ASCII "${chunkChars}"${pad > 0 ? ` (trimmed ${pad} padding char(s))` : ''}.`,
      visualizationType: 'binary-transform',
      data: {
        radixDivision: {
          encodingType: 'ASCII85',
          operation: 'encode',
          dividendStr: `${n} (0x${n.toString(16).padStart(8, '0').toUpperCase()})`,
          divisor: 85,
          quotientStr: Math.floor(n / 85).toString(),
          remainder: digits[4],
          mappedChar: chunkChars,
          leadingZerosCount: pad,
          leadingZerosChars: pad > 0 ? `+${pad} padding zero(s)` : '',
          digitStack: digits.map((d) => String.fromCharCode(33 + d)),
          outputBuffer: output,
          alphabet: 'ASCII 33 (!) .. 117 (u)',
          iteration: chunkIndex + 1,
          totalIterations: totalChunks,
        } as RadixDivisionData,
      },
    });
  }

  steps.push({
    id: 'base85-encode-complete',
    title: 'Base85 / ASCII85 Encoding Complete',
    phase: 'COMPLETE',
    description: `Encoded ${bytes.length} bytes into ${output.length}-character ASCII85 stream: "${output}".`,
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

export function decodeBase85(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const clean = input.replace(/\s+/g, '');

  steps.push({
    id: 'base85-decode-init',
    title: 'Base85 / ASCII85 Stream Ingestion',
    phase: 'INITIALIZATION',
    description: `Ingested ${clean.length} ASCII85 character(s). Scanning for 5-character radix-85 blocks and 'z' zero shortcuts.`,
    visualizationType: 'binary-transform',
    data: {
      input: clean,
      bytes: clean.length,
      hex: bytesToHex(stringToBytes(clean)),
    },
  });

  const outBytes: number[] = [];
  let i = 0;
  let blockIdx = 0;

  while (i < clean.length) {
    blockIdx++;
    if (clean[i] === 'z') {
      outBytes.push(0, 0, 0, 0);
      steps.push({
        id: `base85-decode-block-${blockIdx}`,
        title: `Block ${blockIdx}: 'z' → 4 Zero Bytes (0x00000000)`,
        phase: 'RADIX CONVERSION',
        description: `Expanded 'z' zero abbreviation into 4 zero bytes [0x00, 0x00, 0x00, 0x00].`,
        visualizationType: 'binary-transform',
        data: {
          radixDivision: {
            encodingType: 'ASCII85',
            operation: 'decode',
            dividendStr: '0x00000000',
            divisor: 85,
            quotientStr: '0',
            remainder: 0,
            mappedChar: 'z',
            leadingZerosCount: 4,
            leadingZerosChars: '0x00 0x00 0x00 0x00',
            digitStack: ['0', '0', '0', '0'],
            outputBuffer: bytesToString(new Uint8Array(outBytes)),
            alphabet: 'ASCII 33 (!) .. 117 (u)',
            iteration: blockIdx,
            totalIterations: Math.ceil(clean.length / 5),
          } as RadixDivisionData,
        },
      });
      i++;
      continue;
    }

    const chunk = clean.slice(i, i + 5);
    const pad = 5 - chunk.length;

    let n = 0;
    const codes: number[] = [];
    for (let j = 0; j < 5; j++) {
      const code = j < chunk.length ? chunk.charCodeAt(j) - 33 : 84;
      codes.push(code);
      n = n * 85 + (code >= 0 && code <= 84 ? code : 0);
    }

    const chunkBytes = [
      (n >>> 24) & 255,
      (n >>> 16) & 255,
      (n >>> 8) & 255,
      n & 255,
    ];

    const decodedBlockBytes = pad > 0 ? chunkBytes.slice(0, 4 - pad) : chunkBytes;
    outBytes.push(...decodedBlockBytes);

    const blockHex = bytesToHex(new Uint8Array(decodedBlockBytes));
    const blockText = decodedBlockBytes
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : `\\x${b.toString(16).padStart(2, '0')}`))
      .join('');

    steps.push({
      id: `base85-decode-block-${blockIdx}`,
      title: `Block ${blockIdx}: "${chunk}" → ${decodedBlockBytes.length} Byte(s) (0x${blockHex})`,
      phase: 'RADIX CONVERSION',
      description: `Evaluated polynomial ∑ (c - 33) × 85^(4-j) = ${n} (0x${n.toString(16).padStart(8, '0').toUpperCase()}) → Decoded ${decodedBlockBytes.length} byte(s) [${blockHex}] ("${blockText}").`,
      visualizationType: 'binary-transform',
      data: {
        radixDivision: {
          encodingType: 'ASCII85',
          operation: 'decode',
          dividendStr: `${n} (0x${n.toString(16).padStart(8, '0').toUpperCase()})`,
          divisor: 85,
          quotientStr: Math.floor(n / 85).toString(),
          remainder: codes[codes.length - 1],
          mappedChar: chunk,
          leadingZerosCount: decodedBlockBytes.length,
          leadingZerosChars: `Decoded ${decodedBlockBytes.length} byte(s)`,
          digitStack: Array.from(chunk),
          outputBuffer: bytesToString(new Uint8Array(outBytes)),
          alphabet: 'ASCII 33 (!) .. 117 (u)',
          iteration: blockIdx,
          totalIterations: Math.ceil(clean.length / 5),
        } as RadixDivisionData,
      },
    });

    i += chunk.length;
  }

  const decodedResult = bytesToString(new Uint8Array(outBytes));

  steps.push({
    id: 'base85-decode-complete',
    title: 'Base85 / ASCII85 Decoding Complete',
    phase: 'COMPLETE',
    description: `Decoded ${clean.length} ASCII85 characters into ${outBytes.length} bytes: "${decodedResult}".`,
    visualizationType: 'binary-transform',
    data: {
      bytes: outBytes.length,
      hex: bytesToHex(new Uint8Array(outBytes)),
      input: clean,
      output: decodedResult,
    },
  });

  return { digest: decodedResult, steps };
}

export const base85EncodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Base85 / ASCII85 (Encode)',
    family: 'Positional/Radix Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 32,
    description: 'Adobe standard ASCII85 / Base85 5-char per 4-byte radix-85 encoding with "z" zero shortcut.',
    useCases: ['PDF and PostScript document streams', 'Git binary patch files', 'IPv6 address compact notation (RFC 1924)'],
    security: 'non-cryptographic',
    year: 1990,
    designers: ['Paul E. Rutter (ASCII85) / Adobe Systems'],
    direction: 'encrypt',
  },
  compute(input: string): ComputationResult {
    return encodeBase85(input);
  },
};

export const base85DecodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Base85 / ASCII85 (Decode)',
    family: 'Positional/Radix Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 32,
    description: 'Adobe standard ASCII85 / Base85 decoding back to original binary/text payload.',
    useCases: ['PDF stream extraction', 'Git patch deserialization', 'Compact stream decoding'],
    security: 'non-cryptographic',
    year: 1990,
    designers: ['Paul E. Rutter (ASCII85) / Adobe Systems'],
    direction: 'decrypt',
  },
  compute(input: string): ComputationResult {
    return decodeBase85(input);
  },
};
