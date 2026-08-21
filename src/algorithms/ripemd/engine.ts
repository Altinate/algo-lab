import {
  stringToBytes,
  bytesToHex,
  uint32ToHex,
  uint32ToBinary,
  rotl32,
  add32,
} from '../utils';
import { ComputationStep, ComputationResult } from '../types';

export type RIPEMDVariant = 'RIPEMD-128' | 'RIPEMD-160' | 'RIPEMD-256' | 'RIPEMD-320';

export interface RIPEMDConfig {
  variant: RIPEMDVariant;
}

// Logic functions
function F1(x: number, y: number, z: number): number { return (x ^ y ^ z) >>> 0; }
function F2(x: number, y: number, z: number): number { return ((x & y) | (~x & z)) >>> 0; }
function F3(x: number, y: number, z: number): number { return ((x | ~y) ^ z) >>> 0; }
function F4(x: number, y: number, z: number): number { return ((x & z) | (y & ~z)) >>> 0; }
function F5(x: number, y: number, z: number): number { return (x ^ (y | ~z)) >>> 0; }

function toLittleEndianHex(val: number): string {
  const b0 = (val & 0xff).toString(16).padStart(2, '0');
  const b1 = ((val >>> 8) & 0xff).toString(16).padStart(2, '0');
  const b2 = ((val >>> 16) & 0xff).toString(16).padStart(2, '0');
  const b3 = ((val >>> 24) & 0xff).toString(16).padStart(2, '0');
  return b0 + b1 + b2 + b3;
}

function formatWord32(w: number) {
  return {
    value: w >>> 0,
    hex: uint32ToHex(w),
    binary: uint32ToBinary(w),
  };
}

export function computeRIPEMDFamily(input: string, config: RIPEMDConfig): ComputationResult {
  const steps: ComputationStep[] = [];
  const variant = config.variant;
  const is160or320 = variant === 'RIPEMD-160' || variant === 'RIPEMD-320';

  const inputBytes = stringToBytes(input);
  const bitLength = BigInt(inputBytes.length) * 8n;

  // 1. Input Encoding
  steps.push({
    id: 'input-encoding',
    title: 'Input Byte Stream',
    phase: 'Preprocessing',
    description: `Convert input string to UTF-8 bytes (${inputBytes.length} bytes / ${Number(bitLength)} bits).`,
    data: {
      input: input || '(empty string)',
      bytes: Array.from(inputBytes),
      hex: bytesToHex(inputBytes),
      bitLength: Number(bitLength),
    },
    visualizationType: 'binary-transform',
  });

  // 2. Padding
  const l = inputBytes.length;
  let k = 56 - ((l + 1) % 64);
  if (k < 0) k += 64;

  const totalLength = l + 1 + k + 8;
  const paddedBytes = new Uint8Array(totalLength);
  paddedBytes.set(inputBytes, 0);
  paddedBytes[l] = 0x80;

  const view = new DataView(paddedBytes.buffer, paddedBytes.byteOffset, paddedBytes.byteLength);
  view.setBigUint64(totalLength - 8, bitLength, true); // Little-endian

  steps.push({
    id: 'padding',
    title: 'Message Padding (Little-Endian)',
    phase: 'Preprocessing',
    description: `Pad to 512-bit boundary (64 bytes). Append 0x80, ${k} zero bytes, and 64-bit little-endian bit length (${Number(bitLength)} bits).`,
    data: {
      originalBits: Number(bitLength),
      zeroPaddingBytes: k,
      lengthField: toLittleEndianHex(Number(bitLength & 0xffffffffn)) + toLittleEndianHex(Number((bitLength >> 32n) & 0xffffffffn)),
      paddedHex: bytesToHex(paddedBytes),
      totalBits: totalLength * 8,
      totalBlocks: totalLength / 64,
    },
    visualizationType: 'binary-transform',
  });

  // 3. Initial State Buffers
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476;
  let h4 = is160or320 ? 0xc3d2e1f0 : 0;

  let h0_r = variant === 'RIPEMD-256' ? 0x76543210 : variant === 'RIPEMD-320' ? 0x76543210 : h0;
  let h1_r = variant === 'RIPEMD-256' ? 0xfedcba98 : variant === 'RIPEMD-320' ? 0xfedcba98 : h1;
  let h2_r = variant === 'RIPEMD-256' ? 0x89abcdef : variant === 'RIPEMD-320' ? 0x89abcdef : h2;
  let h3_r = variant === 'RIPEMD-256' ? 0x01234567 : variant === 'RIPEMD-320' ? 0x01234567 : h3;
  let h4_r = variant === 'RIPEMD-320' ? 0x3c2d1e0f : is160or320 ? h4 : 0;

  const initialVars = is160or320
    ? [
        { label: 'A_L', hex: uint32ToHex(h0), binary: uint32ToBinary(h0) },
        { label: 'B_L', hex: uint32ToHex(h1), binary: uint32ToBinary(h1) },
        { label: 'C_L', hex: uint32ToHex(h2), binary: uint32ToBinary(h2) },
        { label: 'D_L', hex: uint32ToHex(h3), binary: uint32ToBinary(h3) },
        { label: 'E_L', hex: uint32ToHex(h4), binary: uint32ToBinary(h4) },
        { label: 'A_R', hex: uint32ToHex(h0_r), binary: uint32ToBinary(h0_r) },
        { label: 'B_R', hex: uint32ToHex(h1_r), binary: uint32ToBinary(h1_r) },
        { label: 'C_R', hex: uint32ToHex(h2_r), binary: uint32ToBinary(h2_r) },
        { label: 'D_R', hex: uint32ToHex(h3_r), binary: uint32ToBinary(h3_r) },
        { label: 'E_R', hex: uint32ToHex(h4_r), binary: uint32ToBinary(h4_r) },
      ]
    : [
        { label: 'A_L', hex: uint32ToHex(h0), binary: uint32ToBinary(h0) },
        { label: 'B_L', hex: uint32ToHex(h1), binary: uint32ToBinary(h1) },
        { label: 'C_L', hex: uint32ToHex(h2), binary: uint32ToBinary(h2) },
        { label: 'D_L', hex: uint32ToHex(h3), binary: uint32ToBinary(h3) },
        { label: 'A_R', hex: uint32ToHex(h0_r), binary: uint32ToBinary(h0_r) },
        { label: 'B_R', hex: uint32ToHex(h1_r), binary: uint32ToBinary(h1_r) },
        { label: 'C_R', hex: uint32ToHex(h2_r), binary: uint32ToBinary(h2_r) },
        { label: 'D_R', hex: uint32ToHex(h3_r), binary: uint32ToBinary(h3_r) },
      ];

  steps.push({
    id: 'init-state',
    title: 'Initialize Dual Parallel State Registers',
    phase: 'Preprocessing',
    description: `Initialize Left and Right parallel register banks with standard ${variant} initial state vectors.`,
    data: {
      variables: initialVars,
    },
    visualizationType: 'round-computation',
  });

  // 4. Process Blocks
  const numBlocks = totalLength / 64;

  for (let blockIdx = 0; blockIdx < numBlocks; blockIdx++) {
    const offset = blockIdx * 64;
    const X = new Array<number>(16);
    for (let j = 0; j < 16; j++) {
      X[j] = view.getUint32(offset + j * 4, true); // Little-endian
    }

    const fullSchedule = X.map((w, idx) => ({
      index: idx,
      hex: uint32ToHex(w),
      binary: uint32ToBinary(w),
      computed: true,
    }));

    if (is160or320) {
      let aa = h0, bb = h1, cc = h2, dd = h3, ee = h4;
      let aaa = h0_r, bbb = h1_r, ccc = h2_r, ddd = h3_r, eee = h4_r;

      const RL = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
        3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
        1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
        4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
      ];
      const RR = [
        5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
        6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
        15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
        8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
        12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
      ];
      const SL = [
        11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
        7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
        11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
        11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
        9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
      ];
      const SR = [
        8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
        9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
        9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
        15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
        8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
      ];
      const KL = [0, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e];
      const KR = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0];

      const funcNamesL = ['f1', 'f2', 'f3', 'f4', 'f5'];
      const formulasL = [
        'f₁(B,C,D) = B ⊕ C ⊕ D',
        'f₂(B,C,D) = (B ∧ C) ∨ (¬B ∧ D)',
        'f₃(B,C,D) = (B ∨ ¬C) ⊕ D',
        'f₄(B,C,D) = (B ∧ D) ∨ (C ∧ ¬D)',
        'f₅(B,C,D) = B ⊕ (C ∨ ¬D)'
      ];
      const funcNamesR = ['f5', 'f4', 'f3', 'f2', 'f1'];
      const formulasR = [
        'f₅(B\',C\',D\') = B\' ⊕ (C\' ∨ ¬D\')',
        'f₄(B\',C\',D\') = (B\' ∧ D\') ∨ (C\' ∧ ¬D\')',
        'f₃(B\',C\',D\') = (B\' ∨ ¬C\') ⊕ D\'',
        'f₂(B\',C\',D\') = (B\' ∧ C\') ∨ (¬B\' ∧ D\')',
        'f₁(B\',C\',D\') = B\' ⊕ C\' ⊕ D\''
      ];

      for (let i = 0; i < 80; i++) {
        const round = Math.floor(i / 16);
        let fl = 0, fr = 0;
        if (round === 0) { fl = F1(bb, cc, dd); fr = F5(bbb, ccc, ddd); }
        else if (round === 1) { fl = F2(bb, cc, dd); fr = F4(bbb, ccc, ddd); }
        else if (round === 2) { fl = F3(bb, cc, dd); fr = F3(bbb, ccc, ddd); }
        else if (round === 3) { fl = F4(bb, cc, dd); fr = F2(bbb, ccc, ddd); }
        else { fl = F5(bb, cc, dd); fr = F1(bbb, ccc, ddd); }

        const prevA_L = aa, prevB_L = bb, prevC_L = cc, prevD_L = dd, prevE_L = ee;
        const prevA_R = aaa, prevB_R = bbb, prevC_R = ccc, prevD_R = ddd, prevE_R = eee;

        const tl = add32(rotl32(add32(aa, fl, X[RL[i]], KL[round]), SL[i]), ee);
        aa = ee; ee = dd; dd = rotl32(cc, 10); cc = bb; bb = tl;

        const tr = add32(rotl32(add32(aaa, fr, X[RR[i]], KR[round]), SR[i]), eee);
        aaa = eee; eee = ddd; ddd = rotl32(ccc, 10); ccc = bbb; bbb = tr;

        if (variant === 'RIPEMD-320' && i % 16 === 15) {
          if (round === 0) { const t = bb; bb = bbb; bbb = t; }
          else if (round === 1) { const t = dd; dd = ddd; ddd = t; }
          else if (round === 2) { const t = aa; aa = aaa; aaa = t; }
          else if (round === 3) { const t = cc; cc = ccc; ccc = t; }
          else if (round === 4) { const t = ee; ee = eee; eee = t; }
        }

        steps.push({
          id: `block-${blockIdx}-step-${i}`,
          title: `${variant} Round ${round + 1} Step ${(i % 16) + 1} of 16 (Dual Parallel Lines)`,
          phase: 'Compression',
          description: `Parallel Step ${(i % 16) + 1}:\n• Left Line: T_L = (A_L + ${funcNamesL[round]}(B_L,C_L,D_L) + X[${RL[i]}] + 0x${uint32ToHex(KL[round])}) <<< ${SL[i]} + E_L\n• Right Line: T_R = (A_R + ${funcNamesR[round]}(B_R,C_R,D_R) + X[${RR[i]}] + 0x${uint32ToHex(KR[round])}) <<< ${SR[i]} + E_R`,
          data: {
            roundIndex: i,
            scheduleIndex: RL[i],
            schedule: fullSchedule.map((item) => ({
              ...item,
              active: item.index === RL[i] || item.index === RR[i],
            })),
            prevVariables: [
              { label: 'A_L', hex: uint32ToHex(prevA_L), binary: uint32ToBinary(prevA_L) },
              { label: 'B_L', hex: uint32ToHex(prevB_L), binary: uint32ToBinary(prevB_L) },
              { label: 'C_L', hex: uint32ToHex(prevC_L), binary: uint32ToBinary(prevC_L) },
              { label: 'D_L', hex: uint32ToHex(prevD_L), binary: uint32ToBinary(prevD_L) },
              { label: 'E_L', hex: uint32ToHex(prevE_L), binary: uint32ToBinary(prevE_L) },
              { label: 'A_R', hex: uint32ToHex(prevA_R), binary: uint32ToBinary(prevA_R) },
              { label: 'B_R', hex: uint32ToHex(prevB_R), binary: uint32ToBinary(prevB_R) },
              { label: 'C_R', hex: uint32ToHex(prevC_R), binary: uint32ToBinary(prevC_R) },
              { label: 'D_R', hex: uint32ToHex(prevD_R), binary: uint32ToBinary(prevD_R) },
              { label: 'E_R', hex: uint32ToHex(prevE_R), binary: uint32ToBinary(prevE_R) },
            ],
            newVariables: [
              { label: 'A_L', hex: uint32ToHex(aa), binary: uint32ToBinary(aa) },
              { label: 'B_L', hex: uint32ToHex(bb), binary: uint32ToBinary(bb) },
              { label: 'C_L', hex: uint32ToHex(cc), binary: uint32ToBinary(cc) },
              { label: 'D_L', hex: uint32ToHex(dd), binary: uint32ToBinary(dd) },
              { label: 'E_L', hex: uint32ToHex(ee), binary: uint32ToBinary(ee) },
              { label: 'A_R', hex: uint32ToHex(aaa), binary: uint32ToBinary(aaa) },
              { label: 'B_R', hex: uint32ToHex(bbb), binary: uint32ToBinary(bbb) },
              { label: 'C_R', hex: uint32ToHex(ccc), binary: uint32ToBinary(ccc) },
              { label: 'D_R', hex: uint32ToHex(ddd), binary: uint32ToBinary(ddd) },
              { label: 'E_R', hex: uint32ToHex(eee), binary: uint32ToBinary(eee) },
            ],
            ripemdStep: {
              leftLine: {
                funcName: funcNamesL[round],
                formula: formulasL[round],
                xIndex: RL[i],
                shift: SL[i],
                kHex: uint32ToHex(KL[round]),
                a: formatWord32(prevA_L),
                b: formatWord32(prevB_L),
                c: formatWord32(prevC_L),
                d: formatWord32(prevD_L),
                e: formatWord32(prevE_L),
                xVal: formatWord32(X[RL[i]]),
                fResult: formatWord32(fl),
                tResult: formatWord32(tl),
                rotC: formatWord32(rotl32(prevC_L, 10)),
              },
              rightLine: {
                funcName: funcNamesR[round],
                formula: formulasR[round],
                xIndex: RR[i],
                shift: SR[i],
                kHex: uint32ToHex(KR[round]),
                a: formatWord32(prevA_R),
                b: formatWord32(prevB_R),
                c: formatWord32(prevC_R),
                d: formatWord32(prevD_R),
                e: formatWord32(prevE_R),
                xVal: formatWord32(X[RR[i]]),
                fResult: formatWord32(fr),
                tResult: formatWord32(tr),
                rotC: formatWord32(rotl32(prevC_R, 10)),
              },
            },
          },
          visualizationType: 'round-computation',
        });
      }

      if (variant === 'RIPEMD-160') {
        const T = add32(h1, cc, ddd);
        h1 = add32(h2, dd, eee);
        h2 = add32(h3, ee, aaa);
        h3 = add32(h4, aa, bbb);
        h4 = add32(h0, bb, ccc);
        h0 = T;
      } else {
        h0 = add32(h0, aa);
        h1 = add32(h1, bb);
        h2 = add32(h2, cc);
        h3 = add32(h3, dd);
        h4 = add32(h4, ee);
        h0_r = add32(h0_r, aaa);
        h1_r = add32(h1_r, bbb);
        h2_r = add32(h2_r, ccc);
        h3_r = add32(h3_r, ddd);
        h4_r = add32(h4_r, eee);
      }
    } else {
      // 128 or 256
      let aa = h0, bb = h1, cc = h2, dd = h3;
      let aaa = h0_r, bbb = h1_r, ccc = h2_r, ddd = h3_r;

      const RL = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
        3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
        1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2
      ];
      const RR = [
        5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
        6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
        15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
        8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14
      ];
      const SL = [
        11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
        7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
        11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
        11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12
      ];
      const SR = [
        8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
        9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
        9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
        15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8
      ];
      const KL = [0, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc];
      const KR = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0];

      const funcNamesL = ['f1', 'f2', 'f3', 'f4'];
      const formulasL = [
        'f₁(B,C,D) = B ⊕ C ⊕ D',
        'f₂(B,C,D) = (B ∧ C) ∨ (¬B ∧ D)',
        'f₃(B,C,D) = (B ∨ ¬C) ⊕ D',
        'f₄(B,C,D) = (B ∧ D) ∨ (C ∧ ¬D)'
      ];
      const funcNamesR = ['f4', 'f3', 'f2', 'f1'];
      const formulasR = [
        'f₄(B\',C\',D\') = (B\' ∧ D\') ∨ (C\' ∧ ¬D\')',
        'f₃(B\',C\',D\') = (B\' ∨ ¬C\') ⊕ D\'',
        'f₂(B\',C\',D\') = (B\' ∧ C\') ∨ (¬B\' ∧ D\')',
        'f₁(B\',C\',D\') = B\' ⊕ C\' ⊕ D\''
      ];

      for (let i = 0; i < 64; i++) {
        const round = Math.floor(i / 16);
        let fl = 0, fr = 0;
        if (round === 0) { fl = F1(bb, cc, dd); fr = F4(bbb, ccc, ddd); }
        else if (round === 1) { fl = F2(bb, cc, dd); fr = F3(bbb, ccc, ddd); }
        else if (round === 2) { fl = F3(bb, cc, dd); fr = F2(bbb, ccc, ddd); }
        else { fl = F4(bb, cc, dd); fr = F1(bbb, ccc, ddd); }

        const prevA_L = aa, prevB_L = bb, prevC_L = cc, prevD_L = dd;
        const prevA_R = aaa, prevB_R = bbb, prevC_R = ccc, prevD_R = ddd;

        const tl = rotl32(add32(aa, fl, X[RL[i]], KL[round]), SL[i]);
        aa = dd; dd = cc; cc = bb; bb = tl;

        const tr = rotl32(add32(aaa, fr, X[RR[i]], KR[round]), SR[i]);
        aaa = ddd; ddd = ccc; ccc = bbb; bbb = tr;

        if (variant === 'RIPEMD-256' && i % 16 === 15) {
          if (round === 0) { const t = aa; aa = aaa; aaa = t; }
          else if (round === 1) { const t = bb; bb = bbb; bbb = t; }
          else if (round === 2) { const t = cc; cc = ccc; ccc = t; }
          else if (round === 3) { const t = dd; dd = ddd; ddd = t; }
        }

        steps.push({
          id: `block-${blockIdx}-step-${i}`,
          title: `${variant} Round ${round + 1} Step ${(i % 16) + 1} of 16 (Dual Parallel Lines)`,
          phase: 'Compression',
          description: `Parallel Step ${(i % 16) + 1}:\n• Left Line: T_L = (A_L + ${funcNamesL[round]}(B_L,C_L,D_L) + X[${RL[i]}] + 0x${uint32ToHex(KL[round])}) <<< ${SL[i]}\n• Right Line: T_R = (A_R + ${funcNamesR[round]}(B_R,C_R,D_R) + X[${RR[i]}] + 0x${uint32ToHex(KR[round])}) <<< ${SR[i]}`,
          data: {
            roundIndex: i,
            scheduleIndex: RL[i],
            schedule: fullSchedule.map((item) => ({
              ...item,
              active: item.index === RL[i] || item.index === RR[i],
            })),
            prevVariables: [
              { label: 'A_L', hex: uint32ToHex(prevA_L), binary: uint32ToBinary(prevA_L) },
              { label: 'B_L', hex: uint32ToHex(prevB_L), binary: uint32ToBinary(prevB_L) },
              { label: 'C_L', hex: uint32ToHex(prevC_L), binary: uint32ToBinary(prevC_L) },
              { label: 'D_L', hex: uint32ToHex(prevD_L), binary: uint32ToBinary(prevD_L) },
              { label: 'A_R', hex: uint32ToHex(prevA_R), binary: uint32ToBinary(prevA_R) },
              { label: 'B_R', hex: uint32ToHex(prevB_R), binary: uint32ToBinary(prevB_R) },
              { label: 'C_R', hex: uint32ToHex(prevC_R), binary: uint32ToBinary(prevC_R) },
              { label: 'D_R', hex: uint32ToHex(prevD_R), binary: uint32ToBinary(prevD_R) },
            ],
            newVariables: [
              { label: 'A_L', hex: uint32ToHex(aa), binary: uint32ToBinary(aa) },
              { label: 'B_L', hex: uint32ToHex(bb), binary: uint32ToBinary(bb) },
              { label: 'C_L', hex: uint32ToHex(cc), binary: uint32ToBinary(cc) },
              { label: 'D_L', hex: uint32ToHex(dd), binary: uint32ToBinary(dd) },
              { label: 'A_R', hex: uint32ToHex(aaa), binary: uint32ToBinary(aaa) },
              { label: 'B_R', hex: uint32ToHex(bbb), binary: uint32ToBinary(bbb) },
              { label: 'C_R', hex: uint32ToHex(ccc), binary: uint32ToBinary(ccc) },
              { label: 'D_R', hex: uint32ToHex(ddd), binary: uint32ToBinary(ddd) },
            ],
            ripemdStep: {
              leftLine: {
                funcName: funcNamesL[round],
                formula: formulasL[round],
                xIndex: RL[i],
                shift: SL[i],
                kHex: uint32ToHex(KL[round]),
                a: formatWord32(prevA_L),
                b: formatWord32(prevB_L),
                c: formatWord32(prevC_L),
                d: formatWord32(prevD_L),
                xVal: formatWord32(X[RL[i]]),
                fResult: formatWord32(fl),
                tResult: formatWord32(tl),
              },
              rightLine: {
                funcName: funcNamesR[round],
                formula: formulasR[round],
                xIndex: RR[i],
                shift: SR[i],
                kHex: uint32ToHex(KR[round]),
                a: formatWord32(prevA_R),
                b: formatWord32(prevB_R),
                c: formatWord32(prevC_R),
                d: formatWord32(prevD_R),
                xVal: formatWord32(X[RR[i]]),
                fResult: formatWord32(fr),
                tResult: formatWord32(tr),
              },
            },
          },
          visualizationType: 'round-computation',
        });
      }

      if (variant === 'RIPEMD-128') {
        const T = add32(h1, cc, ddd);
        h1 = add32(h2, dd, aaa);
        h2 = add32(h3, aa, bbb);
        h3 = add32(h0, bb, ccc);
        h0 = T;
      } else {
        h0 = add32(h0, aa);
        h1 = add32(h1, bb);
        h2 = add32(h2, cc);
        h3 = add32(h3, dd);
        h0_r = add32(h0_r, aaa);
        h1_r = add32(h1_r, bbb);
        h2_r = add32(h2_r, ccc);
        h3_r = add32(h3_r, ddd);
      }
    }
  }

  // 5. Final Digest
  let finalDigest = '';
  if (variant === 'RIPEMD-128') {
    finalDigest = toLittleEndianHex(h0) + toLittleEndianHex(h1) + toLittleEndianHex(h2) + toLittleEndianHex(h3);
  } else if (variant === 'RIPEMD-160') {
    finalDigest = toLittleEndianHex(h0) + toLittleEndianHex(h1) + toLittleEndianHex(h2) + toLittleEndianHex(h3) + toLittleEndianHex(h4);
  } else if (variant === 'RIPEMD-256') {
    finalDigest = toLittleEndianHex(h0) + toLittleEndianHex(h1) + toLittleEndianHex(h2) + toLittleEndianHex(h3) +
                  toLittleEndianHex(h0_r) + toLittleEndianHex(h1_r) + toLittleEndianHex(h2_r) + toLittleEndianHex(h3_r);
  } else if (variant === 'RIPEMD-320') {
    finalDigest = toLittleEndianHex(h0) + toLittleEndianHex(h1) + toLittleEndianHex(h2) + toLittleEndianHex(h3) + toLittleEndianHex(h4) +
                  toLittleEndianHex(h0_r) + toLittleEndianHex(h1_r) + toLittleEndianHex(h2_r) + toLittleEndianHex(h3_r) + toLittleEndianHex(h4_r);
  }

  steps.push({
    id: 'final-digest',
    title: 'Final Digest Assembly',
    phase: 'Finalization',
    description: `Concatenate little-endian words to assemble the ${variant} digest.`,
    data: {
      digest: finalDigest,
    },
    visualizationType: 'final-digest',
  });

  return { digest: finalDigest, steps };
}
