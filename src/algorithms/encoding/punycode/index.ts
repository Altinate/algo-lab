/**
 * RFC 3492 Punycode (IDNA) Encoding & Decoding Engine & Plugins
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { stringToBytes, bytesToHex } from '../../utils';

const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const DELIMITER = '-';

export interface PunycodeStepData {
  encodingType: 'Punycode';
  operation: 'encode' | 'decode';
  activeChar?: string;
  activeCodePoint?: number;
  bias: number;
  delta: number;
  n: number;
  basicString: string;
  nonBasicChars: string[];
  accumulatedOutput: string;
  phaseName: string;
}

function adapt(delta: number, numpoints: number, firsttime: boolean): number {
  delta = firsttime ? Math.floor(delta / DAMP) : Math.floor(delta / 2);
  delta += Math.floor(delta / numpoints);
  let k = 0;
  while (delta > Math.floor(((BASE - TMIN) * TMAX) / 2)) {
    delta = Math.floor(delta / (BASE - TMIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - TMIN + 1) * delta) / (delta + SKEW));
}

function encodeDigit(d: number): string {
  return d < 26 ? String.fromCharCode(d + 97) : String.fromCharCode(d - 26 + 48);
}

function decodeDigit(cp: number): number {
  if (cp >= 48 && cp <= 57) return cp - 48 + 26;
  if (cp >= 65 && cp <= 90) return cp - 65;
  if (cp >= 97 && cp <= 122) return cp - 97;
  return -1;
}

export function encodePunycode(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const codePoints = Array.from(input).map((c) => c.codePointAt(0)!);

  let n = INITIAL_N;
  let delta = 0;
  let bias = INITIAL_BIAS;
  let output = '';

  const basicChars: string[] = [];
  const nonBasicChars: string[] = [];

  for (const cp of codePoints) {
    if (cp < 128) {
      const ch = String.fromCharCode(cp);
      basicChars.push(ch);
      output += ch;
    } else {
      nonBasicChars.push(String.fromCodePoint(cp));
    }
  }

  const b = output.length;
  let h = b;

  steps.push({
    id: 'punycode-encode-init',
    title: 'Punycode Input Parsing & Basic Code Point Extraction',
    phase: 'INITIALIZATION',
    description: `Extracted ${b} basic ASCII code point(s) ("${output || '(none)'}") and ${nonBasicChars.length} non-ASCII code point(s) [${nonBasicChars.join(', ')}].`,
    visualizationType: 'binary-transform',
    data: {
      input,
      hex: bytesToHex(stringToBytes(input)),
      punycode: {
        encodingType: 'Punycode',
        operation: 'encode',
        bias,
        delta,
        n,
        basicString: output,
        nonBasicChars,
        accumulatedOutput: output,
        phaseName: 'Basic ASCII Extraction',
      } as PunycodeStepData,
    },
  });

  if (b > 0 && nonBasicChars.length > 0) {
    output += DELIMITER;
  }

  let stepCount = 0;

  while (h < codePoints.length) {
    stepCount++;
    let m = Infinity;
    for (const cp of codePoints) {
      if (cp >= n && cp < m) {
        m = cp;
      }
    }

    delta += (m - n) * (h + 1);
    n = m;

    for (const cp of codePoints) {
      if (cp < n) {
        delta++;
      }
      if (cp === n) {
        let q = delta;
        let emitted = '';
        for (let k = BASE; ; k += BASE) {
          const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
          if (q < t) break;
          const dig = t + ((q - t) % (BASE - t));
          const ch = encodeDigit(dig);
          output += ch;
          emitted += ch;
          q = Math.floor((q - t) / (BASE - t));
        }
        const lastCh = encodeDigit(q);
        output += lastCh;
        emitted += lastCh;

        const currentCh = String.fromCodePoint(cp);
        bias = adapt(delta, h + 1, h === b);

        steps.push({
          id: `punycode-encode-step-${stepCount}`,
          title: `Encode Non-ASCII: '${currentCh}' (U+${cp.toString(16).padStart(4, '0').toUpperCase()}) → "${emitted}"`,
          phase: 'DELTA INSERTION',
          description: `Code point U+${cp.toString(16).toUpperCase()} ('${currentCh}'): Computed delta=${delta}, adapted bias=${bias}, emitted variable-length base-36 digits "${emitted}".`,
          visualizationType: 'binary-transform',
          data: {
            punycode: {
              encodingType: 'Punycode',
              operation: 'encode',
              activeChar: currentCh,
              activeCodePoint: cp,
              bias,
              delta,
              n,
              basicString: basicChars.join(''),
              nonBasicChars,
              accumulatedOutput: output,
              phaseName: `Delta Encoding (${currentCh})`,
            } as PunycodeStepData,
          },
        });

        delta = 0;
        h++;
      }
    }
    delta++;
    n++;
  }

  steps.push({
    id: 'punycode-encode-complete',
    title: 'Punycode Encoding Complete',
    phase: 'COMPLETE',
    description: `Encoded Unicode domain label "${input}" into ASCII Punycode string: "${output}".`,
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

export function decodePunycode(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const clean = input.trim().toLowerCase();

  let n = INITIAL_N;
  let i = 0;
  let bias = INITIAL_BIAS;
  const output: number[] = [];

  const delimIdx = clean.lastIndexOf(DELIMITER);
  let pos = 0;
  if (delimIdx > 0) {
    for (let j = 0; j < delimIdx; j++) {
      output.push(clean.charCodeAt(j));
    }
    pos = delimIdx + 1;
  }

  steps.push({
    id: 'punycode-decode-init',
    title: 'Punycode Input Parsing & Delimiter Detection',
    phase: 'INITIALIZATION',
    description: `Parsed Punycode string "${clean}". ${delimIdx > 0 ? `Found delimiter at index ${delimIdx} with ${delimIdx} basic ASCII character(s).` : 'No basic ASCII prefix.'}`,
    visualizationType: 'binary-transform',
    data: {
      input: clean,
      hex: bytesToHex(stringToBytes(clean)),
      punycode: {
        encodingType: 'Punycode',
        operation: 'decode',
        bias,
        delta: 0,
        n,
        basicString: String.fromCharCode(...output),
        nonBasicChars: [],
        accumulatedOutput: String.fromCharCode(...output),
        phaseName: 'Initial Basic Literal Setup',
      } as PunycodeStepData,
    },
  });

  let stepIdx = 0;

  while (pos < clean.length) {
    stepIdx++;
    const oldi = i;
    let w = 1;
    for (let k = BASE; ; k += BASE) {
      if (pos >= clean.length) break;
      const digit = decodeDigit(clean.charCodeAt(pos++));
      if (digit < 0) break;
      i += digit * w;
      const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
      if (digit < t) break;
      w *= (BASE - t);
    }
    bias = adapt(i - oldi, output.length + 1, oldi === 0);
    n += Math.floor(i / (output.length + 1));
    i %= (output.length + 1);

    let insertedChar = '\uFFFD';
    try {
      if (n >= 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff)) {
        insertedChar = String.fromCodePoint(n);
      }
    } catch {
      insertedChar = '\uFFFD';
    }
    output.splice(i, 0, n);

    steps.push({
      id: `punycode-decode-step-${stepIdx}`,
      title: `Decode & Insert: '${insertedChar}' (U+${n.toString(16).padStart(4, '0').toUpperCase()}) at pos ${i}`,
      phase: 'CODEPOINT INSERTION',
      description: `Reconstructed code point U+${n.toString(16).toUpperCase()} ('${insertedChar}'). Inserted at index ${i} in Unicode string. Updated bias=${bias}.`,
      visualizationType: 'binary-transform',
      data: {
        punycode: {
          encodingType: 'Punycode',
          operation: 'decode',
          activeChar: insertedChar,
          activeCodePoint: n,
          bias,
          delta: i - oldi,
          n,
          basicString: '',
          nonBasicChars: [insertedChar],
          accumulatedOutput: output
            .map((cp) => (cp >= 0 && cp <= 0x10ffff && !(cp >= 0xd800 && cp <= 0xdfff) ? String.fromCodePoint(cp) : '\uFFFD'))
            .join(''),
          phaseName: `Insertion Step #${stepIdx}`,
        } as PunycodeStepData,
      },
    });

    i++;
  }

  let decodedResult = '';
  try {
    decodedResult = output
      .map((cp) => (cp >= 0 && cp <= 0x10ffff && !(cp >= 0xd800 && cp <= 0xdfff) ? String.fromCodePoint(cp) : '\uFFFD'))
      .join('');
  } catch {
    decodedResult = '\uFFFD';
  }

  steps.push({
    id: 'punycode-decode-complete',
    title: 'Punycode Decoding Complete',
    phase: 'COMPLETE',
    description: `Decoded Punycode string "${clean}" into Unicode domain label: "${decodedResult}".`,
    visualizationType: 'binary-transform',
    data: {
      bytes: output.length,
      hex: bytesToHex(stringToBytes(decodedResult)),
      input: clean,
      output: decodedResult,
    },
  });

  return { digest: decodedResult, steps };
}

export const punycodeEncodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Punycode (Encode)',
    family: 'Text/Character Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 0,
    description: 'RFC 3492 Punycode Bootstring algorithm encoding Internationalized Domain Names (IDN) into ASCII.',
    useCases: ['Internationalized domain names (.xn-- TLDs)', 'DNS label serialization', 'Unicode URL resolution'],
    security: 'non-cryptographic',
    year: 2003,
    designers: ['Adam M. Costello (RFC 3492)'],
    direction: 'encrypt',
  },
  compute(input: string): ComputationResult {
    return encodePunycode(input);
  },
};

export const punycodeDecodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Punycode (Decode)',
    family: 'Text/Character Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 0,
    description: 'RFC 3492 Punycode decoding from ASCII domain labels back into native Unicode text.',
    useCases: ['Browser address bar display', 'DNS response resolution', 'IDN certificate validation'],
    security: 'non-cryptographic',
    year: 2003,
    designers: ['Adam M. Costello (RFC 3492)'],
    direction: 'decrypt',
  },
  compute(input: string): ComputationResult {
    return decodePunycode(input);
  },
};
