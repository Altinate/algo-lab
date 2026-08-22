/**
 * UTF-8 and UTF-16 Unicode Encoding/Decoding Engine & Plugins
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { stringToBytes, bytesToString, bytesToHex, hexToBytes } from '../../utils';
import type { CharacterTransformData } from '../url';

export function encodeUtf8(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const chars = Array.from(input);
  const totalChars = chars.length || 1;

  steps.push({
    id: 'utf8-encode-init',
    title: 'UTF-8 Unicode Code Point Ingestion',
    phase: 'INITIALIZATION',
    description: `Ingested ${chars.length} Unicode code point(s). Evaluating UTF-8 byte allocation rules (1-byte: U+0000..U+007F, 2-byte: U+0080..U+07FF, 3-byte: U+0800..U+FFFF, 4-byte: U+10000..U+10FFFF).`,
    visualizationType: 'binary-transform',
    data: {
      input,
      bytes: chars.length,
      hex: bytesToHex(stringToBytes(input)),
    },
  });

  const allBytes: number[] = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const cp = ch.codePointAt(0) || 0;
    const cpBits = cp.toString(2);

    let template = '';
    let byteLen = 1;
    const charBytes: number[] = [];
    const bitDistribution: Array<{ label: string; bits: string }> = [];

    if (cp <= 0x7f) {
      byteLen = 1;
      template = '0xxxxxxx';
      charBytes.push(cp);
      bitDistribution.push({ label: 'Byte 1 [0xxxxxxx]', bits: cp.toString(2).padStart(8, '0') });
    } else if (cp <= 0x7ff) {
      byteLen = 2;
      template = '110xxxxx 10xxxxxx';
      const b1 = 0xc0 | (cp >> 6);
      const b2 = 0x80 | (cp & 0x3f);
      charBytes.push(b1, b2);
      bitDistribution.push({ label: 'Header [110xxxxx]', bits: b1.toString(2).padStart(8, '0') });
      bitDistribution.push({ label: 'Cont.  [10xxxxxx]', bits: b2.toString(2).padStart(8, '0') });
    } else if (cp <= 0xffff) {
      byteLen = 3;
      template = '1110xxxx 10xxxxxx 10xxxxxx';
      const b1 = 0xe0 | (cp >> 12);
      const b2 = 0x80 | ((cp >> 6) & 0x3f);
      const b3 = 0x80 | (cp & 0x3f);
      charBytes.push(b1, b2, b3);
      bitDistribution.push({ label: 'Header [1110xxxx]', bits: b1.toString(2).padStart(8, '0') });
      bitDistribution.push({ label: 'Cont. 1[10xxxxxx]', bits: b2.toString(2).padStart(8, '0') });
      bitDistribution.push({ label: 'Cont. 2[10xxxxxx]', bits: b3.toString(2).padStart(8, '0') });
    } else {
      byteLen = 4;
      template = '11110xxx 10xxxxxx 10xxxxxx 10xxxxxx';
      const b1 = 0xf0 | (cp >> 18);
      const b2 = 0x80 | ((cp >> 12) & 0x3f);
      const b3 = 0x80 | ((cp >> 6) & 0x3f);
      const b4 = 0x80 | (cp & 0x3f);
      charBytes.push(b1, b2, b3, b4);
      bitDistribution.push({ label: 'Header [11110xxx]', bits: b1.toString(2).padStart(8, '0') });
      bitDistribution.push({ label: 'Cont. 1[10xxxxxx]', bits: b2.toString(2).padStart(8, '0') });
      bitDistribution.push({ label: 'Cont. 2[10xxxxxx]', bits: b3.toString(2).padStart(8, '0') });
      bitDistribution.push({ label: 'Cont. 3[10xxxxxx]', bits: b4.toString(2).padStart(8, '0') });
    }

    allBytes.push(...charBytes);
    const hexRep = Array.from(charBytes).map((b) => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

    steps.push({
      id: `utf8-encode-char-${i}`,
      title: `Char ${i + 1}/${totalChars}: '${ch}' (U+${cp.toString(16).padStart(4, '0').toUpperCase()}) → ${byteLen} Byte(s)`,
      phase: 'CODEPOINT ENCODING',
      description: `Code point U+${cp.toString(16).padStart(4, '0').toUpperCase()} (${cp} in binary 0b${cpBits}) maps to ${byteLen}-byte UTF-8 template (${template}) → [${hexRep}].`,
      visualizationType: 'binary-transform',
      data: {
        characterTransform: {
          encodingType: 'UTF-8',
          operation: 'encode',
          char: ch,
          codePoint: `U+${cp.toString(16).padStart(4, '0').toUpperCase()}`,
          codePointDecimal: cp,
          unicodePlane: cp <= 0xffff ? 'Basic Multilingual Plane (BMP)' : 'Supplementary Plane (SMP)',
          template,
          bitDistribution,
          outputBytesHex: bytesToHex(new Uint8Array(charBytes)),
          outputBytesBinary: charBytes.map((b) => b.toString(2).padStart(8, '0')).join(' '),
          cumulativeOutput: bytesToHex(new Uint8Array(allBytes)),
          charIndex: i + 1,
          totalChars,
        } as CharacterTransformData,
      },
    });
  }

  const finalHex = bytesToHex(new Uint8Array(allBytes));

  steps.push({
    id: 'utf8-encode-complete',
    title: 'UTF-8 Encoding Complete',
    phase: 'COMPLETE',
    description: `Encoded ${chars.length} Unicode character(s) into ${allBytes.length} UTF-8 byte(s): 0x${finalHex}.`,
    visualizationType: 'binary-transform',
    data: {
      bytes: allBytes.length,
      hex: finalHex,
      input,
      output: finalHex,
    },
  });

  return { digest: finalHex, steps };
}

export function decodeUtf8(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const cleanHex = input.trim().replace(/^0x/i, '').replace(/[\s,]+/g, '');
  const bytes = hexToBytes(cleanHex);

  steps.push({
    id: 'utf8-decode-init',
    title: 'UTF-8 Byte Stream Parsing',
    phase: 'INITIALIZATION',
    description: `Parsed ${bytes.length} byte(s) from hex stream. Scanning leading bits for UTF-8 sequence boundaries.`,
    visualizationType: 'binary-transform',
    data: {
      input,
      hex: cleanHex,
      bytes: bytes.length,
    },
  });

  const chars: string[] = [];
  let i = 0;
  let charIdx = 0;

  while (i < bytes.length) {
    charIdx++;
    const b0 = bytes[i];
    let cp = 0;
    let seqLen = 1;
    let template = '';

    if ((b0 & 0x80) === 0) {
      // 1-byte ASCII (0xxxxxxx)
      seqLen = 1;
      cp = b0;
      template = '1-Byte ASCII (0xxxxxxx)';
    } else if ((b0 & 0xe0) === 0xc0) {
      // 2-byte (110xxxxx 10xxxxxx)
      seqLen = 2;
      const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
      cp = ((b0 & 0x1f) << 6) | (b1 & 0x3f);
      template = '2-Byte Sequence (110xxxxx 10xxxxxx)';
    } else if ((b0 & 0xf0) === 0xe0) {
      // 3-byte (1110xxxx 10xxxxxx 10xxxxxx)
      seqLen = 3;
      const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
      cp = ((b0 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f);
      template = '3-Byte Sequence (1110xxxx 10xxxxxx 10xxxxxx)';
    } else if ((b0 & 0xf8) === 0xf0) {
      // 4-byte (11110xxx 10xxxxxx 10xxxxxx 10xxxxxx)
      seqLen = 4;
      const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
      const b3 = i + 3 < bytes.length ? bytes[i + 3] : 0;
      cp = ((b0 & 0x07) << 18) | ((b1 & 0x3f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
      template = '4-Byte Sequence (11110xxx 10xxxxxx 10xxxxxx 10xxxxxx)';
    }

    let ch = '\uFFFD';
    try {
      if (cp >= 0 && cp <= 0x10ffff && !(cp >= 0xd800 && cp <= 0xdfff)) {
        ch = String.fromCodePoint(cp);
      }
    } catch {
      ch = '\uFFFD';
    }
    chars.push(ch);

    const seqBytes = bytes.slice(i, i + seqLen);
    const seqHex = bytesToHex(seqBytes);

    steps.push({
      id: `utf8-decode-seq-${charIdx}`,
      title: `Sequence ${charIdx}: 0x${seqHex} → U+${cp.toString(16).padStart(4, '0').toUpperCase()} ('${ch}')`,
      phase: 'BYTE STREAM DECODING',
      description: `Matched ${template} [0x${seqHex}] → Reconstructed Unicode code point U+${cp.toString(16).padStart(4, '0').toUpperCase()} ('${ch}').`,
      visualizationType: 'binary-transform',
      data: {
        characterTransform: {
          encodingType: 'UTF-8',
          operation: 'decode',
          char: ch,
          codePoint: `U+${cp.toString(16).padStart(4, '0').toUpperCase()}`,
          codePointDecimal: cp,
          template,
          outputBytesHex: seqHex,
          cumulativeOutput: chars.join(''),
          charIndex: charIdx,
          totalChars: bytes.length,
        } as CharacterTransformData,
      },
    });

    i += seqLen;
  }

  const decodedText = chars.join('');

  steps.push({
    id: 'utf8-decode-complete',
    title: 'UTF-8 Decoding Complete',
    phase: 'COMPLETE',
    description: `Decoded ${bytes.length} bytes into ${chars.length} Unicode character(s): "${decodedText}".`,
    visualizationType: 'binary-transform',
    data: {
      bytes: bytes.length,
      hex: cleanHex,
      input,
      output: decodedText,
    },
  });

  return { digest: decodedText, steps };
}

export function encodeUtf16(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const chars = Array.from(input);
  const totalChars = chars.length || 1;

  steps.push({
    id: 'utf16-encode-init',
    title: 'UTF-16 Unicode Code Point Ingestion',
    phase: 'INITIALIZATION',
    description: `Ingested ${chars.length} Unicode code point(s). Evaluating BMP (U+0000..U+FFFF) single 16-bit code units vs Supplementary Plane (U+10000..U+10FFFF) surrogate pairs (0xD800..0xDBFF, 0xDC00..0xDFFF).`,
    visualizationType: 'binary-transform',
    data: {
      input,
      bytes: chars.length,
    },
  });

  const outBytesBE: number[] = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const cp = ch.codePointAt(0) || 0;
    const isBMP = cp <= 0xffff;

    let w1 = 0;
    let w2 = 0;
    const charUnits: number[] = [];

    if (isBMP) {
      w1 = cp;
      charUnits.push(w1);
      outBytesBE.push((w1 >> 8) & 0xff, w1 & 0xff);
    } else {
      const uPrime = cp - 0x10000;
      w1 = 0xd800 + (uPrime >> 10);
      w2 = 0xdc00 + (uPrime & 0x3ff);
      charUnits.push(w1, w2);
      outBytesBE.push((w1 >> 8) & 0xff, w1 & 0xff, (w2 >> 8) & 0xff, w2 & 0xff);
    }

    const hexUnits = charUnits.map((u) => '0x' + u.toString(16).padStart(4, '0').toUpperCase()).join(' ');

    steps.push({
      id: `utf16-encode-char-${i}`,
      title: `Char ${i + 1}/${totalChars}: '${ch}' (U+${cp.toString(16).padStart(4, '0').toUpperCase()}) → ${isBMP ? '1×16-bit Unit' : 'Surrogate Pair (2×16-bit)'}`,
      phase: 'CODEPOINT ENCODING',
      description: isBMP
        ? `Code point U+${cp.toString(16).padStart(4, '0').toUpperCase()} in BMP → Single 16-bit unit [${hexUnits}].`
        : `Code point U+${cp.toString(16).padStart(4, '0').toUpperCase()} in Supplementary Plane → High Surrogate 0x${w1.toString(16).toUpperCase()}, Low Surrogate 0x${w2.toString(16).toUpperCase()} [${hexUnits}].`,
      visualizationType: 'binary-transform',
      data: {
        characterTransform: {
          encodingType: 'UTF-16',
          operation: 'encode',
          char: ch,
          codePoint: `U+${cp.toString(16).padStart(4, '0').toUpperCase()}`,
          codePointDecimal: cp,
          unicodePlane: isBMP ? 'Basic Multilingual Plane (BMP)' : 'Supplementary Plane (Surrogate Pair)',
          outputBytesHex: bytesToHex(new Uint8Array(outBytesBE.slice(-charUnits.length * 2))),
          cumulativeOutput: bytesToHex(new Uint8Array(outBytesBE)),
          charIndex: i + 1,
          totalChars,
        } as CharacterTransformData,
      },
    });
  }

  const finalHex = bytesToHex(new Uint8Array(outBytesBE));

  steps.push({
    id: 'utf16-encode-complete',
    title: 'UTF-16 (Big-Endian) Encoding Complete',
    phase: 'COMPLETE',
    description: `Encoded ${chars.length} Unicode character(s) into ${outBytesBE.length} UTF-16BE bytes: 0x${finalHex}.`,
    visualizationType: 'binary-transform',
    data: {
      bytes: outBytesBE.length,
      hex: finalHex,
      input,
      output: finalHex,
    },
  });

  return { digest: finalHex, steps };
}

export function decodeUtf16(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const cleanHex = input.trim().replace(/^0x/i, '').replace(/[\s,]+/g, '');
  const bytes = hexToBytes(cleanHex);

  steps.push({
    id: 'utf16-decode-init',
    title: 'UTF-16 Byte Stream Parsing',
    phase: 'INITIALIZATION',
    description: `Parsed ${bytes.length} byte(s) (${Math.floor(bytes.length / 2)} 16-bit code units). Scanning for surrogate pairs.`,
    visualizationType: 'binary-transform',
    data: {
      input,
      hex: cleanHex,
      bytes: bytes.length,
    },
  });

  const chars: string[] = [];
  let i = 0;
  let charIdx = 0;

  while (i < bytes.length) {
    charIdx++;
    const w1 = (bytes[i] << 8) | (i + 1 < bytes.length ? bytes[i + 1] : 0);

    // Check for high surrogate (0xD800..0xDBFF)
    if (w1 >= 0xd800 && w1 <= 0xdbff && i + 3 < bytes.length) {
      const w2 = (bytes[i + 2] << 8) | bytes[i + 3];
      if (w2 >= 0xdc00 && w2 <= 0xdfff) {
        const cp = 0x10000 + ((w1 - 0xd800) << 10) + (w2 - 0xdc00);
        let ch = '\uFFFD';
        try {
          if (cp >= 0 && cp <= 0x10ffff) ch = String.fromCodePoint(cp);
        } catch {
          ch = '\uFFFD';
        }
        chars.push(ch);

        steps.push({
          id: `utf16-decode-unit-${charIdx}`,
          title: `Surrogate Pair: [0x${w1.toString(16).toUpperCase()}, 0x${w2.toString(16).toUpperCase()}] → U+${cp.toString(16).toUpperCase()} ('${ch}')`,
          phase: 'CODEPOINT DECODING',
          description: `Combined High Surrogate 0x${w1.toString(16).toUpperCase()} and Low Surrogate 0x${w2.toString(16).toUpperCase()} → Code Point U+${cp.toString(16).toUpperCase()} ('${ch}').`,
          visualizationType: 'binary-transform',
          data: {
            characterTransform: {
              encodingType: 'UTF-16',
              operation: 'decode',
              char: ch,
              codePoint: `U+${cp.toString(16).padStart(4, '0').toUpperCase()}`,
              codePointDecimal: cp,
              unicodePlane: 'Supplementary Plane (Surrogate Pair)',
              outputBytesHex: bytesToHex(bytes.slice(i, i + 4)),
              cumulativeOutput: chars.join(''),
              charIndex: charIdx,
              totalChars: Math.floor(bytes.length / 2),
            } as CharacterTransformData,
          },
        });
        i += 4;
        continue;
      }
    }

    const ch = String.fromCodePoint(w1);
    chars.push(ch);

    steps.push({
      id: `utf16-decode-unit-${charIdx}`,
      title: `Unit: 0x${w1.toString(16).padStart(4, '0').toUpperCase()} → U+${w1.toString(16).padStart(4, '0').toUpperCase()} ('${ch}')`,
      phase: 'CODEPOINT DECODING',
      description: `BMP code unit 0x${w1.toString(16).padStart(4, '0').toUpperCase()} → '${ch}'.`,
      visualizationType: 'binary-transform',
      data: {
        characterTransform: {
          encodingType: 'UTF-16',
          operation: 'decode',
          char: ch,
          codePoint: `U+${w1.toString(16).padStart(4, '0').toUpperCase()}`,
          codePointDecimal: w1,
          unicodePlane: 'Basic Multilingual Plane (BMP)',
          outputBytesHex: bytesToHex(bytes.slice(i, i + 2)),
          cumulativeOutput: chars.join(''),
          charIndex: charIdx,
          totalChars: Math.floor(bytes.length / 2),
        } as CharacterTransformData,
      },
    });
    i += 2;
  }

  const decodedText = chars.join('');

  steps.push({
    id: 'utf16-decode-complete',
    title: 'UTF-16 Decoding Complete',
    phase: 'COMPLETE',
    description: `Decoded ${bytes.length} bytes into ${chars.length} Unicode character(s): "${decodedText}".`,
    visualizationType: 'binary-transform',
    data: {
      bytes: bytes.length,
      hex: cleanHex,
      input,
      output: decodedText,
    },
  });

  return { digest: decodedText, steps };
}

export const utf8EncodePlugin: AlgorithmPlugin = {
  info: {
    name: 'UTF-8 (Encode)',
    family: 'Text/Character Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 8,
    description: 'Unicode UTF-8 variable-length (1 to 4 bytes) character encoding standard with continuation byte headers.',
    useCases: ['Web standards (HTML/JSON/JS)', 'Operating system text representation (Linux/macOS)', 'File formats and network protocols'],
    security: 'non-cryptographic',
    year: 1993,
    designers: ['Ken Thompson', 'Rob Pike'],
    direction: 'encrypt',
  },
  compute(input: string): ComputationResult {
    return encodeUtf8(input);
  },
};

export const utf8DecodePlugin: AlgorithmPlugin = {
  info: {
    name: 'UTF-8 (Decode)',
    family: 'Text/Character Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 8,
    description: 'Unicode UTF-8 byte stream decoding into Unicode code points and glyphs.',
    useCases: ['Byte stream parsing', 'Text rendering', 'Internationalization'],
    security: 'non-cryptographic',
    year: 1993,
    designers: ['Ken Thompson', 'Rob Pike'],
    direction: 'decrypt',
  },
  compute(input: string): ComputationResult {
    return decodeUtf8(input);
  },
};

export const utf16EncodePlugin: AlgorithmPlugin = {
  info: {
    name: 'UTF-16 (Encode)',
    family: 'Text/Character Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 16,
    description: 'Unicode UTF-16 encoding with 16-bit code units and surrogate pairs (0xD800..0xDFFF) for astral planes.',
    useCases: ['JavaScript internal string representation (DOM/V8)', 'Windows Win32 Wide APIs', 'Java String runtime'],
    security: 'non-cryptographic',
    year: 1996,
    designers: ['Unicode Consortium'],
    direction: 'encrypt',
  },
  compute(input: string): ComputationResult {
    return encodeUtf16(input);
  },
};

export const utf16DecodePlugin: AlgorithmPlugin = {
  info: {
    name: 'UTF-16 (Decode)',
    family: 'Text/Character Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 16,
    description: 'Unicode UTF-16 decoding from 16-bit code units and surrogate pairs into Unicode text.',
    useCases: ['Windows API bridge', 'Java JVM serialization', 'Astral plane character recovery'],
    security: 'non-cryptographic',
    year: 1996,
    designers: ['Unicode Consortium'],
    direction: 'decrypt',
  },
  compute(input: string): ComputationResult {
    return decodeUtf16(input);
  },
};
