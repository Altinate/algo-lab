/**
 * RFC 3986 URI / Percent-Encoding Engine & Plugins
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { stringToBytes, bytesToString, bytesToHex } from '../../utils';

export interface CharacterTransformData {
  encodingType: 'URL' | 'UTF-8' | 'UTF-16';
  operation: 'encode' | 'decode';
  char: string;
  codePoint: string;
  codePointDecimal: number;
  unicodePlane?: string;
  template?: string;
  bitDistribution?: Array<{ label: string; bits: string }>;
  outputBytesHex: string;
  outputBytesBinary?: string;
  cumulativeOutput: string;
  isUnreserved?: boolean;
  charIndex: number;
  totalChars: number;
}

function isUnreserved(b: number): boolean {
  // A-Z (65..90), a-z (97..122), 0-9 (48..57), - (45), _ (95), . (46), ~ (126)
  return (
    (b >= 65 && b <= 90) ||
    (b >= 97 && b <= 122) ||
    (b >= 48 && b <= 57) ||
    b === 45 ||
    b === 95 ||
    b === 46 ||
    b === 126
  );
}

export function encodeUrl(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const chars = Array.from(input);
  const totalChars = chars.length || 1;

  steps.push({
    id: 'url-encode-init',
    title: 'URL Percent-Encoding Input Analysis',
    phase: 'INITIALIZATION',
    description: `Ingested ${chars.length} Unicode character(s). Scanning for RFC 3986 unreserved characters (A-Z, a-z, 0-9, -, _, ., ~) vs reserved/special characters requiring %XX hex octets.`,
    visualizationType: 'binary-transform',
    data: {
      input,
      bytes: chars.length,
      hex: bytesToHex(stringToBytes(input)),
    },
  });

  let output = '';

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const codePoint = ch.codePointAt(0) || 0;
    const utf8Bytes = stringToBytes(ch);
    const isUnres = utf8Bytes.length === 1 && isUnreserved(utf8Bytes[0]);

    let encodedUnit = '';
    if (isUnres) {
      encodedUnit = ch;
    } else {
      for (const b of utf8Bytes) {
        encodedUnit += '%' + b.toString(16).padStart(2, '0').toUpperCase();
      }
    }

    output += encodedUnit;

    steps.push({
      id: `url-encode-char-${i}`,
      title: `Char ${i + 1}/${totalChars}: '${ch}' (U+${codePoint.toString(16).padStart(4, '0').toUpperCase()}) → ${isUnres ? 'Pass-Through' : encodedUnit}`,
      phase: 'CHARACTER ENCODING',
      description: isUnres
        ? `Character '${ch}' is RFC 3986 unreserved → Passed through directly as '${ch}'.`
        : `Character '${ch}' (UTF-8 bytes [${Array.from(utf8Bytes).map((b) => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(', ')}]) is reserved/special → Percent-encoded as "${encodedUnit}".`,
      visualizationType: 'binary-transform',
      data: {
        characterTransform: {
          encodingType: 'URL',
          operation: 'encode',
          char: ch,
          codePoint: `U+${codePoint.toString(16).padStart(4, '0').toUpperCase()}`,
          codePointDecimal: codePoint,
          outputBytesHex: isUnres ? bytesToHex(utf8Bytes) : encodedUnit,
          cumulativeOutput: output,
          isUnreserved: isUnres,
          charIndex: i + 1,
          totalChars,
        } as CharacterTransformData,
      },
    });
  }

  steps.push({
    id: 'url-encode-complete',
    title: 'URL Percent-Encoding Complete',
    phase: 'COMPLETE',
    description: `Encoded ${chars.length} characters into ${output.length}-character URI component: "${output}".`,
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

export function decodeUrl(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const cleanInput = input.trim();

  steps.push({
    id: 'url-decode-init',
    title: 'URL Percent-Decoding Input Parsing',
    phase: 'INITIALIZATION',
    description: `Scanning ${cleanInput.length}-char URI string for '%XX' escape triplets.`,
    visualizationType: 'binary-transform',
    data: {
      input: cleanInput,
      hex: bytesToHex(stringToBytes(cleanInput)),
    },
  });

  const outBytes: number[] = [];
  let i = 0;
  let stepIndex = 0;

  while (i < cleanInput.length) {
    stepIndex++;
    if (cleanInput[i] === '%' && i + 2 < cleanInput.length) {
      const hexPair = cleanInput.slice(i + 1, i + 3);
      const byteVal = parseInt(hexPair, 16);
      if (!isNaN(byteVal)) {
        outBytes.push(byteVal);
        const ch = byteVal >= 32 && byteVal <= 126 ? String.fromCharCode(byteVal) : `\\x${hexPair.toUpperCase()}`;

        steps.push({
          id: `url-decode-step-${stepIndex}`,
          title: `Triplet: "%${hexPair.toUpperCase()}" → Byte 0x${hexPair.toUpperCase()} ('${ch}')`,
          phase: 'CHARACTER DECODING',
          description: `Decoded escape sequence "%${hexPair.toUpperCase()}" into byte 0x${hexPair.toUpperCase()} (${byteVal}) [Character: '${ch}'].`,
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
              charIndex: stepIndex,
              totalChars: cleanInput.length,
            } as CharacterTransformData,
          },
        });
        i += 3;
        continue;
      }
    }

    const ch = cleanInput[i];
    const b = cleanInput.charCodeAt(i);
    outBytes.push(b);

    steps.push({
      id: `url-decode-step-${stepIndex}`,
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
          charIndex: stepIndex,
          totalChars: cleanInput.length,
        } as CharacterTransformData,
      },
    });
    i++;
  }

  const decodedResult = bytesToString(new Uint8Array(outBytes));

  steps.push({
    id: 'url-decode-complete',
    title: 'URL Percent-Decoding Complete',
    phase: 'COMPLETE',
    description: `Decoded ${cleanInput.length} URI characters into ${outBytes.length} bytes: "${decodedResult}".`,
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

export const urlEncodePlugin: AlgorithmPlugin = {
  info: {
    name: 'URL / Percent-Encoding (Encode)',
    family: 'Text/Character Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 0,
    description: 'RFC 3986 Uniform Resource Identifier (URI) Percent-Encoding for special and reserved characters (%XX).',
    useCases: ['URL query strings', 'HTTP form POST payloads (application/x-www-form-urlencoded)', 'REST API parameter serialization'],
    security: 'non-cryptographic',
    year: 2005,
    designers: ['Berners-Lee, Fielding, Masinter (RFC 3986)'],
    direction: 'encrypt',
  },
  compute(input: string): ComputationResult {
    return encodeUrl(input);
  },
};

export const urlDecodePlugin: AlgorithmPlugin = {
  info: {
    name: 'URL / Percent-Encoding (Decode)',
    family: 'Text/Character Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 0,
    description: 'RFC 3986 URL percent-decoding (%XX → raw character).',
    useCases: ['Web server request routing', 'Query parameter parsing', 'Form data deserialization'],
    security: 'non-cryptographic',
    year: 2005,
    designers: ['Berners-Lee, Fielding, Masinter (RFC 3986)'],
    direction: 'decrypt',
  },
  compute(input: string): ComputationResult {
    return decodeUrl(input);
  },
};
