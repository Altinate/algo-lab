import {
  stringToBytes,
  bytesToHex,
  bytesToBinary,
  uint64ToHex,
  uint64ToBinary,
  formatHexGroups,
  formatBinaryGroups,
  add64,
} from '../utils';
import { ComputationStep, ComputationResult } from '../types';
import { K_512 } from './constants';
import {
  ch64,
  maj64,
  bigSigma0_64,
  bigSigma1_64,
  sigma0_64,
  sigma1_64,
  sigma0Breakdown64,
  sigma1Breakdown64,
  bigSigma0Breakdown64,
  bigSigma1Breakdown64,
  chBreakdown64,
  majBreakdown64,
} from './operations';

export interface SHA512EngineConfig {
  initialHash: bigint[];
  outputWords?: number; // 6 for SHA-384, 8 for SHA-512
  is384?: boolean;
}

function formatWord64(w: bigint) {
  return {
    value: w.toString(),
    hex: uint64ToHex(w),
    binary: uint64ToBinary(w),
  };
}

export function computeSHA512Family(input: string, config: SHA512EngineConfig): ComputationResult {
  const steps: ComputationStep[] = [];
  const algoName = config.is384 ? 'SHA-384' : 'SHA-512';
  const outWords = config.outputWords ?? (config.is384 ? 6 : 8);

  const fullConstants = K_512.map((kVal, idx) => ({
    index: idx,
    hex: uint64ToHex(kVal),
    binary: uint64ToBinary(kVal),
  }));

  const inputBytes = stringToBytes(input);
  const bitLength = BigInt(inputBytes.length) * 8n;

  // 1. Input Encoding
  steps.push({
    id: 'input-encoding',
    title: 'Input Encoding',
    phase: 'Pre-processing',
    description: `Convert the input string to UTF-8 bytes. Total: ${inputBytes.length} bytes (${Number(bitLength)} bits).`,
    data: {
      input: input || '(empty string)',
      bytes: Array.from(inputBytes),
      hex: bytesToHex(inputBytes),
      bitLength: Number(bitLength),
    },
    visualizationType: 'binary-transform',
  });

  // 2. Padding (Multiple of 1024 bits / 128 bytes)
  const l = inputBytes.length;
  let k = 112 - ((l + 1) % 128);
  if (k < 0) k += 128;

  const totalLength = l + 1 + k + 16;
  const paddedBytes = new Uint8Array(totalLength);
  paddedBytes.set(inputBytes, 0);
  paddedBytes[l] = 0x80;

  const view = new DataView(paddedBytes.buffer, paddedBytes.byteOffset, paddedBytes.byteLength);
  view.setBigUint64(totalLength - 16, 0n, false);
  view.setBigUint64(totalLength - 8, bitLength, false);

  steps.push({
    id: 'padding',
    title: 'Message Padding',
    phase: 'Pre-processing',
    description: `Pad the message to a multiple of 1024 bits (128 bytes). Append a '1' bit (0x80), ${k} zero bytes, and the original 128-bit big-endian length (${Number(bitLength)} bits). Total: ${totalLength * 8} bits (${totalLength / 128} block(s)).`,
    data: {
      originalBits: Number(bitLength),
      paddingByte: '10000000 (0x80)',
      zeroPaddingBytes: k,
      lengthField: '0000000000000000' + uint64ToHex(bitLength),
      paddedHex: bytesToHex(paddedBytes),
      totalBits: totalLength * 8,
      totalBlocks: totalLength / 128,
    },
    visualizationType: 'binary-transform',
  });

  // 3. Initialize hash values
  let H = [...config.initialHash];

  steps.push({
    id: 'init-hash',
    title: 'Initialize 64-Bit State Registers',
    phase: 'Pre-processing',
    description: `Initialize the 8 64-bit state registers A..H with ${algoName} IV constants.`,
    data: {
      variables: [
        { label: 'A', hex: uint64ToHex(H[0]), binary: uint64ToBinary(H[0]) },
        { label: 'B', hex: uint64ToHex(H[1]), binary: uint64ToBinary(H[1]) },
        { label: 'C', hex: uint64ToHex(H[2]), binary: uint64ToBinary(H[2]) },
        { label: 'D', hex: uint64ToHex(H[3]), binary: uint64ToBinary(H[3]) },
        { label: 'E', hex: uint64ToHex(H[4]), binary: uint64ToBinary(H[4]) },
        { label: 'F', hex: uint64ToHex(H[5]), binary: uint64ToBinary(H[5]) },
        { label: 'G', hex: uint64ToHex(H[6]), binary: uint64ToBinary(H[6]) },
        { label: 'H', hex: uint64ToHex(H[7]), binary: uint64ToBinary(H[7]) },
      ],
      constants: fullConstants,
    },
    visualizationType: 'round-computation',
  });

  // 4. Process blocks
  const numBlocks = totalLength / 128;

  for (let blockIdx = 0; blockIdx < numBlocks; blockIdx++) {
    const blockPhase = `Block ${blockIdx + 1} / ${numBlocks}`;
    const offset = blockIdx * 128;
    const W = new Array<bigint>(80).fill(0n);

    // Initial 16 64-bit words
    for (let t = 0; t < 16; t++) {
      W[t] = view.getBigUint64(offset + t * 8, false);
    }
    // Expand to 80 words
    for (let t = 16; t < 80; t++) {
      W[t] = add64(sigma1_64(W[t - 2]), W[t - 7], sigma0_64(W[t - 15]), W[t - 16]);
    }

    const fullSchedule = W.map((word, idx) => ({
      index: idx,
      hex: uint64ToHex(word),
      binary: uint64ToBinary(word),
      computed: true,
    }));

    // Working variables
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];

    for (let t = 0; t < 80; t++) {
      const s0Detail = bigSigma0Breakdown64(a);
      const s1Detail = bigSigma1Breakdown64(e);
      const chDetail = chBreakdown64(e, f, g);
      const majDetail = majBreakdown64(a, b, c);

      const T1 = add64(h, s1Detail.result, chDetail.result, K_512[t], W[t]);
      const T2 = add64(s0Detail.result, majDetail.result);

      const prevA = a, prevB = b, prevC = c, prevD = d;
      const prevE = e, prevF = f, prevG = g, prevH = h;

      h = g;
      g = f;
      f = e;
      e = add64(d, T1);
      d = c;
      c = b;
      b = a;
      a = add64(T1, T2);

      steps.push({
        id: `block-${blockIdx}-round-${t}`,
        title: `${algoName} Round ${t + 1} of 80`,
        phase: 'Compression',
        description: `Round ${t + 1} (64-Bit FIPS 180-4 Pipeline):\nT1 = h + Σ₁(e) + Ch(e,f,g) + K[${t}] + W[${t}] (mod 2⁶⁴)\nT2 = Σ₀(a) + Maj(a,b,c) (mod 2⁶⁴)\nWriteback: a ← T1 + T2, e ← d + T1`,
        data: {
          roundIndex: t,
          scheduleIndex: t,
          schedule: fullSchedule.map((item) => ({
            ...item,
            active: item.index === t,
          })),
          constants: fullConstants.map((item) => ({
            ...item,
            active: item.index === t,
          })),
          activeK: {
            index: t,
            hex: uint64ToHex(K_512[t]),
            binary: uint64ToBinary(K_512[t]),
            active: true,
          },
          activeW: {
            index: t,
            hex: uint64ToHex(W[t]),
            binary: uint64ToBinary(W[t]),
            active: true,
          },
          prevVariables: [
            { label: 'a', hex: uint64ToHex(prevA), binary: uint64ToBinary(prevA) },
            { label: 'b', hex: uint64ToHex(prevB), binary: uint64ToBinary(prevB) },
            { label: 'c', hex: uint64ToHex(prevC), binary: uint64ToBinary(prevC) },
            { label: 'd', hex: uint64ToHex(prevD), binary: uint64ToBinary(prevD) },
            { label: 'e', hex: uint64ToHex(prevE), binary: uint64ToBinary(prevE) },
            { label: 'f', hex: uint64ToHex(prevF), binary: uint64ToBinary(prevF) },
            { label: 'g', hex: uint64ToHex(prevG), binary: uint64ToBinary(prevG) },
            { label: 'h', hex: uint64ToHex(prevH), binary: uint64ToBinary(prevH) },
          ],
          newVariables: [
            { label: 'a', hex: uint64ToHex(a), binary: uint64ToBinary(a) },
            { label: 'b', hex: uint64ToHex(b), binary: uint64ToBinary(b) },
            { label: 'c', hex: uint64ToHex(c), binary: uint64ToBinary(c) },
            { label: 'd', hex: uint64ToHex(d), binary: uint64ToBinary(d) },
            { label: 'e', hex: uint64ToHex(e), binary: uint64ToBinary(e) },
            { label: 'f', hex: uint64ToHex(f), binary: uint64ToBinary(f) },
            { label: 'g', hex: uint64ToHex(g), binary: uint64ToBinary(g) },
            { label: 'h', hex: uint64ToHex(h), binary: uint64ToBinary(h) },
          ],
          temp1: {
            h: formatWord64(prevH),
            sigma1: {
              input: formatWord64(prevE),
              rot14: formatWord64(s1Detail.rot14),
              rot18: formatWord64(s1Detail.rot18),
              rot41: formatWord64(s1Detail.rot41),
              result: formatWord64(s1Detail.result),
            },
            ch: {
              eAndF: formatWord64(chDetail.xAndY),
              notEAndG: formatWord64(chDetail.notXAndZ),
              result: formatWord64(chDetail.result),
            },
            k: formatWord64(K_512[t]),
            w: formatWord64(W[t]),
            result: formatWord64(T1),
          },
          temp2: {
            sigma0: {
              input: formatWord64(prevA),
              rot28: formatWord64(s0Detail.rot28),
              rot34: formatWord64(s0Detail.rot34),
              rot39: formatWord64(s0Detail.rot39),
              result: formatWord64(s0Detail.result),
            },
            maj: {
              aAndB: formatWord64(majDetail.xAndY),
              aAndC: formatWord64(majDetail.xAndZ),
              bAndC: formatWord64(majDetail.yAndZ),
              result: formatWord64(majDetail.result),
            },
            result: formatWord64(T2),
          },
        },
        visualizationType: 'round-computation',
      });
    }

    // Accumulate block
    const prevH0 = H[0], prevH1 = H[1], prevH2 = H[2], prevH3 = H[3];
    const prevH4 = H[4], prevH5 = H[5], prevH6 = H[6], prevH7 = H[7];

    H[0] = add64(H[0], a);
    H[1] = add64(H[1], b);
    H[2] = add64(H[2], c);
    H[3] = add64(H[3], d);
    H[4] = add64(H[4], e);
    H[5] = add64(H[5], f);
    H[6] = add64(H[6], g);
    H[7] = add64(H[7], h);

    steps.push({
      id: `block-${blockIdx}-update`,
      title: `Block ${blockIdx + 1} State Accumulation`,
      phase: 'Compression',
      description: 'Add compressed block working variables to the cumulative state hash values (mod 2⁶⁴).',
      data: {
        schedule: fullSchedule,
        constants: fullConstants,
        variables: [
          { label: 'A', hex: uint64ToHex(H[0]), binary: uint64ToBinary(H[0]) },
          { label: 'B', hex: uint64ToHex(H[1]), binary: uint64ToBinary(H[1]) },
          { label: 'C', hex: uint64ToHex(H[2]), binary: uint64ToBinary(H[2]) },
          { label: 'D', hex: uint64ToHex(H[3]), binary: uint64ToBinary(H[3]) },
          { label: 'E', hex: uint64ToHex(H[4]), binary: uint64ToBinary(H[4]) },
          { label: 'F', hex: uint64ToHex(H[5]), binary: uint64ToBinary(H[5]) },
          { label: 'G', hex: uint64ToHex(H[6]), binary: uint64ToBinary(H[6]) },
          { label: 'H', hex: uint64ToHex(H[7]), binary: uint64ToBinary(H[7]) },
        ],
        updates: [
          { label: 'REG.A', prevHex: uint64ToHex(prevH0), addHex: uint64ToHex(a), newHex: uint64ToHex(H[0]) },
          { label: 'REG.B', prevHex: uint64ToHex(prevH1), addHex: uint64ToHex(b), newHex: uint64ToHex(H[1]) },
          { label: 'REG.C', prevHex: uint64ToHex(prevH2), addHex: uint64ToHex(c), newHex: uint64ToHex(H[2]) },
          { label: 'REG.D', prevHex: uint64ToHex(prevH3), addHex: uint64ToHex(d), newHex: uint64ToHex(H[3]) },
          { label: 'REG.E', prevHex: uint64ToHex(prevH4), addHex: uint64ToHex(e), newHex: uint64ToHex(H[4]) },
          { label: 'REG.F', prevHex: uint64ToHex(prevH5), addHex: uint64ToHex(f), newHex: uint64ToHex(H[5]) },
          { label: 'REG.G', prevHex: uint64ToHex(prevH6), addHex: uint64ToHex(g), newHex: uint64ToHex(H[6]) },
          { label: 'REG.H', prevHex: uint64ToHex(prevH7), addHex: uint64ToHex(h), newHex: uint64ToHex(H[7]) },
        ],
      },
      visualizationType: 'round-computation',
    });
  }

  // 5. Final Output
  const finalH = H.slice(0, outWords);
  const finalDigest = finalH.map(uint64ToHex).join('');

  steps.push({
    id: 'final-digest',
    title: 'Final Digest Assembly',
    phase: 'Finalization',
    description: config.is384
      ? 'Concatenate the first 6 64-bit hash values A..F (384 bits) in big-endian byte order for the final digest.'
      : 'Concatenate all 8 64-bit hash values A..H (512 bits) in big-endian byte order for the final digest.',
    data: {
      hashValues: finalH.map((hVal, idx) => ({
        label: String.fromCharCode(65 + idx),
        hex: uint64ToHex(hVal),
      })),
      digest: finalDigest,
    },
    visualizationType: 'final-digest',
  });

  return { digest: finalDigest, steps };
}
