/**
 * International Morse Code (ITU-R M.1677-1) Encoding & Decoding Engine & Plugins
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { stringToBytes, bytesToHex } from '../../utils';

export const MORSE_TABLE: Record<string, string> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  _: '..--.-',
  '"': '.-..-.',
  $: '...-..-',
  '@': '.--.-.',
};

export const REVERSE_MORSE_TABLE: Record<string, string> = {};
for (const [char, code] of Object.entries(MORSE_TABLE)) {
  REVERSE_MORSE_TABLE[code] = char;
}

export interface MorseElement {
  symbol: '.' | '-' | 'gap' | 'word-gap';
  label: string;
  durationUnits: number; // dot=1, dash=3, inter-elem=1, letter-gap=3, word-gap=7
}

export interface MorseStepData {
  encodingType: 'Morse';
  operation: 'encode' | 'decode';
  char: string;
  morsePattern: string;
  elements: MorseElement[];
  accumulatedOutput: string;
  charIndex: number;
  totalChars: number;
}

export function encodeMorse(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const upper = input.toUpperCase().trim();
  const totalChars = upper.length || 1;

  steps.push({
    id: 'morse-encode-init',
    title: 'Morse Code Stream Analysis',
    phase: 'INITIALIZATION',
    description: `Ingested ${upper.length} character(s). Initialized ITU-R M.1677-1 International Morse lookup table.`,
    visualizationType: 'binary-transform',
    data: {
      input: upper,
      bytes: upper.length,
      hex: bytesToHex(stringToBytes(upper)),
    },
  });

  const words = upper.split(/\s+/);
  const encodedWords: string[] = [];
  let stepIdx = 0;
  let accumulated = '';

  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    const encodedLetters: string[] = [];

    for (let c = 0; c < word.length; c++) {
      stepIdx++;
      const ch = word[c];
      const code = MORSE_TABLE[ch] || '?';
      encodedLetters.push(code);

      const elements: MorseElement[] = [];
      for (const symbol of code) {
        if (symbol === '.') {
          elements.push({ symbol: '.', label: 'DIT (1 unit)', durationUnits: 1 });
        } else if (symbol === '-') {
          elements.push({ symbol: '-', label: 'DAH (3 units)', durationUnits: 3 });
        }
      }

      accumulated = (encodedWords.length > 0 ? encodedWords.join(' / ') + ' / ' : '') + encodedLetters.join(' ');

      steps.push({
        id: `morse-encode-char-${stepIdx}`,
        title: `Char ${stepIdx}/${totalChars}: '${ch}' → "${code}"`,
        phase: 'SIGNAL MODULATION',
        description: `Mapped character '${ch}' to Morse signal sequence "${code}" (${elements.map((e) => e.label).join(', ')}).`,
        visualizationType: 'binary-transform',
        data: {
          morse: {
            encodingType: 'Morse',
            operation: 'encode',
            char: ch,
            morsePattern: code,
            elements,
            accumulatedOutput: accumulated,
            charIndex: stepIdx,
            totalChars,
          } as MorseStepData,
        },
      });
    }

    encodedWords.push(encodedLetters.join(' '));
  }

  const finalDigest = encodedWords.join(' / ');

  steps.push({
    id: 'morse-encode-complete',
    title: 'Morse Code Transmission Ready',
    phase: 'COMPLETE',
    description: `Encoded text into ${finalDigest.length}-token Morse sequence: "${finalDigest}".`,
    visualizationType: 'binary-transform',
    data: {
      bytes: finalDigest.length,
      hex: bytesToHex(stringToBytes(finalDigest)),
      input: upper,
      output: finalDigest,
    },
  });

  return { digest: finalDigest, steps };
}

export function decodeMorse(input: string): ComputationResult {
  const steps: ComputationStep[] = [];
  const clean = input.trim();

  steps.push({
    id: 'morse-decode-init',
    title: 'Morse Signal Parsing',
    phase: 'INITIALIZATION',
    description: `Ingested Morse signal string. Parsing tokens separated by spaces (letters) and slashes (words).`,
    visualizationType: 'binary-transform',
    data: {
      input: clean,
      bytes: clean.length,
      hex: bytesToHex(stringToBytes(clean)),
    },
  });

  const wordTokens = clean.split(/\s*\/\s*/);
  const decodedWords: string[] = [];
  let tokenIdx = 0;
  let accumulated = '';

  for (let w = 0; w < wordTokens.length; w++) {
    const letterTokens = wordTokens[w].trim().split(/\s+/);
    const decodedLetters: string[] = [];

    for (let l = 0; l < letterTokens.length; l++) {
      tokenIdx++;
      const tok = letterTokens[l];
      if (!tok) continue;

      const ch = REVERSE_MORSE_TABLE[tok] || '?';
      decodedLetters.push(ch);

      accumulated = decodedWords.join(' ') + (decodedWords.length > 0 ? ' ' : '') + decodedLetters.join('');

      const elements: MorseElement[] = [];
      for (const symbol of tok) {
        if (symbol === '.') {
          elements.push({ symbol: '.', label: 'DIT (1 unit)', durationUnits: 1 });
        } else if (symbol === '-') {
          elements.push({ symbol: '-', label: 'DAH (3 units)', durationUnits: 3 });
        }
      }

      steps.push({
        id: `morse-decode-token-${tokenIdx}`,
        title: `Token: "${tok}" → '${ch}'`,
        phase: 'SIGNAL DEMODULATION',
        description: `Demodulated Morse signal pattern "${tok}" into character '${ch}'.`,
        visualizationType: 'binary-transform',
        data: {
          morse: {
            encodingType: 'Morse',
            operation: 'decode',
            char: ch,
            morsePattern: tok,
            elements,
            accumulatedOutput: accumulated,
            charIndex: tokenIdx,
            totalChars: letterTokens.length,
          } as MorseStepData,
        },
      });
    }

    decodedWords.push(decodedLetters.join(''));
  }

  const finalDigest = decodedWords.join(' ');

  steps.push({
    id: 'morse-decode-complete',
    title: 'Morse Demodulation Complete',
    phase: 'COMPLETE',
    description: `Demodulated Morse sequence into plaintext: "${finalDigest}".`,
    visualizationType: 'binary-transform',
    data: {
      bytes: finalDigest.length,
      hex: bytesToHex(stringToBytes(finalDigest)),
      input: clean,
      output: finalDigest,
    },
  });

  return { digest: finalDigest, steps };
}

export const morseEncodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Morse Code (Encode)',
    family: 'Signal/Historical Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 0,
    description: 'ITU-R M.1677-1 International Morse Code telegraphy acoustic/visual pulse encoding.',
    useCases: ['Aviation and maritime distress (SOS)', 'Amateur radio (CW mode)', 'Assistive technology signaling'],
    security: 'non-cryptographic',
    year: 1844,
    designers: ['Samuel Morse', 'Alfred Vail'],
    direction: 'encrypt',
  },
  compute(input: string): ComputationResult {
    return encodeMorse(input);
  },
};

export const morseDecodePlugin: AlgorithmPlugin = {
  info: {
    name: 'Morse Code (Decode)',
    family: 'Signal/Historical Encoding',
    category: 'encoding',
    digestSize: 0,
    blockSize: 0,
    description: 'ITU-R M.1677-1 Morse telegraphy dot-dash sequence demodulation into text.',
    useCases: ['Telegraph signal demodulation', 'Radio transmission decoding', 'Historical communication parsing'],
    security: 'non-cryptographic',
    year: 1844,
    designers: ['Samuel Morse', 'Alfred Vail'],
    direction: 'decrypt',
  },
  compute(input: string): ComputationResult {
    return decodeMorse(input);
  },
};
