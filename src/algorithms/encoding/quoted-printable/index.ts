/**
 * RFC 2045 Quoted-Printable Encoding & Decoding Engine & Plugins
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { stringToBytes, bytesToString, bytesToHex } from '../../utils';
import type { CharacterTransformData } from '../url';

export function encodeQuotedPrintable(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const chars = Array.from(input);
  const totalChars = chars.length || 1;

  steps.push({
    id: 'qp-encode-init',
    title: 'Quoted-Printable Input Analysis',
    phase: 'INITIALIZATION',
    description: `Ingested ${chars.length} character(s). Scanning for RFC 2045 printable ASCII (33..126 excluding '=') vs non-printable/8-bit bytes requiring '=XX' triplets.`,
    visualizationType: 'binary-transform',
    data: {
      input,
      bytes: chars.length,
      hex: bytesToHex(stringToBytes(input)),
    },
  });

  let output = '';
  let lineLen = 0;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const cp = ch.codePointAt(0) || 0;
    const utf8Bytes = stringToBytes(ch);

    // ASCII printable 33..126 except '=' (61), plus space (32) and tab (9)
    const isPrintableAscii =
      utf8Bytes.length === 1 &&
      ((utf8Bytes[0] >= 33 && utf8Bytes[0] <= 126 && utf8Bytes[0] !== 61) ||
        utf8Bytes[0] === 32 ||
        utf8Bytes[0] === 9);

    let encodedUnit = '';
    if (isPrintableAscii) {
      encodedUnit = ch;
    } else {
      for (const b of utf8Bytes) {
        encodedUnit += '=' + b.toString(16).padStart(2, '0').toUpperCase();
      }
    }

    // Soft line break check (76 chars max per line)
    if (lineLen + encodedUnit.length > 75) {
      output += '=\r\n';
      lineLen = 0;
    }

    output += encodedUnit;
    lineLen += encodedUnit.length;

    steps.push({
      id: `qp-encode-char-${i}`,
      title: `Char ${i + 1}/${totalChars}: '${ch}' (U+${cp.toString(16).padStart(4, '0').toUpperCase()}) → ${isPrintableAscii ? `'${ch}'` : encodedUnit}`,
      phase: 'CHARACTER ENCODING',
      description: isPrintableAscii
        ? `Printable ASCII character '${ch}' passed through directly.`
        : `Character '${ch}' [UTF-8 0x${bytesToHex(utf8Bytes).toUpperCase()}] encoded as Quoted-Printable triplet "${encodedUnit}".`,
      visualizationType: 'binary-transform',
      data: {
        characterTransform: {
          encodingType: 'URL', // Reuses character transform view
          operation: 'encode',
          char: ch,
          codePoint: `U+${cp.toString(16).padStart(4, '0').toUpperCase()}`,
          codePointDecimal: cp,
          outputBytesHex: isPrintableAscii ? bytesToHex(utf8Bytes) : encodedUnit,
          cumulativeOutput: output,
          isUnreserved: isPrintableAscii,
          charIndex: i + 1,
          totalChars,
        } as CharacterTransformData,
      },
    });
  }

  steps.push({
    id: 'qp-encode-complete',
    title: 'Quoted-Printable Encoding Complete',
    phase: 'COMPLETE',
    description: `Encoded ${chars.length} characters into ${output.length}-character Quoted-Printable text: "${output}".`,
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

export function decodeQuotedPrintable(input: string): ComputationResult {
  const steps: ComputationStep[] = [];

  // Remove soft line breaks: '=\r\n' or '=\n'
  const normalized = input.replace(/=\r?\n/g, '');

  steps.push({
    id: 'qp-decode-init',
    title: 'Quoted-Printable Input Normalization',
    phase: 'INITIALIZATION',
    description: `Stripped soft line breaks. Scanning ${normalized.length} characters for '=XX' hex triplets.`,
    visualizationType: 'binary-transform',
    data: {
      input: normalized,
      bytes: normalized.length,
      hex: bytesToHex(stringToBytes(normalized)),
    },
  });

  const outBytes: number[] = [];
  let i = 0;
  let stepIdx = 0;

  while (i < normalized.length) {
    stepIdx++;
    if (normalized[i] === '=' && i + 2 < normalized.length) {
      const hexPair = normalized.slice(i + 1, i + 3);
      const byteVal = parseInt(hexPair, 16);
      if (!isNaN(byteVal)) {
        outBytes.push(byteVal);
        const ch = byteVal >= 32 && byteVal <= 126 ? String.fromCharCode(byteVal) : `\\x${hexPair.toUpperCase()}`;

        steps.push({
          id: `qp-decode-step-${stepIdx}`,
          title: `Triplet: "=${hexPair.toUpperCase()}" → Byte 0x${hexPair.toUpperCase()} ('${ch}')`,
          phase: 'CHARACTER DECODING',
          description: `Decoded "=XX" triplet "=${hexPair.toUpperCase()}" into byte 0x${hexPair.toUpperCase()} (${byteVal}) [Character: '${ch}'].`,
          visualizationType: 'binary-transform',
          data: {
            characterTransform: {
              encodingType: 'URL',
              operation: 'decode',
              char: ch,
              codePoint: `0x${hexPair.toUpperCase()}`,
              codePointDecimal: byteVal,
              outputBytesHex: hexPair.toUpperCase(),
              cumulativeOutput: bytesToString(new Uint8Array(outBytes)),
              charIndex: stepIdx,
              totalChars: normalized.length,
            } as CharacterTransformData,
          },
        });

        i += 3;
        continue;
      }
    }

    const ch = normalized[i];
    const b = normalized.charCodeAt(i);
    outBytes.push(b);

    steps.push({
      id: `qp-decode-step-${stepIdx}`,
      title: `Literal: '${ch}' (0x${b.toString(16).padStart(2, '0').toUpperCase()})`,
      phase: 'CHARACTER DECODING',
      description: `Passed through literal unencoded character '${ch}'.`,
      visualizationType: 'binary-transform',
      data: {
        characterTransform: {
          encodingType: 'URL',
          operation: 'decode',
          char: ch,
          codePoint: `U+${b.toString(16).padStart(4, '0').toUpperCase()}`,
          codePointDecimal: b,
          outputBytesHex: b.toString(16).padStart(2, '0').toUpperCase(),
          cumulativeOutput: bytesToString(new Uint8Array(outBytes)),
          isUnreserved: true,
          charIndex: stepIdx,
          totalChars: normalized.length,
        } as CharacterTransformData,
      },
    });

    i++;
  }

  const decodedResult = bytesToString(new Uint8Array(outBytes));

  steps.push({
    id: 'qp-decode-complete',
    title: 'Quoted-Printable Decoding Complete',
    phase: 'COMPLETE',
    description: `Decoded Quoted-Printable stream into ${outBytes.length} bytes: "${decodedResult}".`,
    visualizationType: 'binary-transform',
    data: {
      bytes: outBytes.length,
      hex: bytesToHex(new Uint8Array(outBytes)),
      input,
      output: decodedResult,
    },
  });

  return { digest: decodedResult, steps };
}

export const quotedPrintableEncodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Quoted-Printable (Encode)',
    family: 'Text/Character Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 0,
    description: 'RFC 2045 MIME Quoted-Printable 7-bit email transport encoding (=XX hex triplets).',
    useCases: ['MIME email body encoding', 'Non-ASCII email headers', '7-bit clean text transmission'],
    security: 'non-cryptographic',
    year: 1996,
    designers: ['Freed & Borenstein (RFC 2045)'],
    direction: 'encrypt',
  },
  compute(input: string): ComputationResult {
    return encodeQuotedPrintable(input);
  },
};

export const quotedPrintableDecodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Quoted-Printable (Decode)',
    family: 'Text/Character Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 0,
    description: 'RFC 2045 MIME Quoted-Printable decoding from =XX triplets back into native text/bytes.',
    useCases: ['Email message body parsing', 'MIME attachment extraction', 'Legacy email protocol interop'],
    security: 'non-cryptographic',
    year: 1996,
    designers: ['Freed & Borenstein (RFC 2045)'],
    direction: 'decrypt',
  },
  compute(input: string): ComputationResult {
    return decodeQuotedPrintable(input);
  },
};
