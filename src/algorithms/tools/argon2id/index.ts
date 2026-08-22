/**
 * RFC 9106 Argon2id Password-Based Memory-Hard Key Derivation Function
 * Hybrid mode combining data-independent memory access (Argon2i) with
 * data-dependent memory access (Argon2d) and variable-length BLAKE2b (H').
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { stringToBytes, bytesToHex, hexToBytes } from '../../utils';

export interface Argon2idStepData {
  toolType: 'Argon2id';
  password: string;
  salt: string;
  secretKey?: string;
  associatedData?: string;
  m: number; // Memory size in KiB
  t: number; // Number of passes
  p: number; // Number of lanes
  tagLength: number; // Output length T in bytes
  version: number; // 19 (0x13)
  totalBlocks: number; // m (1KB blocks)
  totalComputedBlocks: number; // m * t blocks computed across full matrix
  currentPass?: number;
  currentSlice?: number;
  currentLane?: number;
  currentColumn?: number;
  addressingMode?: 'DATA_INDEPENDENT (Argon2i)' | 'DATA_DEPENDENT (Argon2d)';
  refLane?: number;
  refColumn?: number;
  h0Hex?: string;
  activeBlockHexSnippet?: string;
  finalBlockHexSnippet?: string;
  derivedTagHex?: string;
  progressPercent: number;
  phaseName: string;
  isSummary?: boolean;
}

const IV64 = [
  0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn,
  0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
  0x510e527fade682d1n, 0x9b05688c2b3e6c1fn,
  0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n,
];

const SIGMA = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
  [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
  [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
  [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
  [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
  [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
  [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
  [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
  [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
];

function rotr64(x: bigint, n: number): bigint {
  const nBig = BigInt(n);
  return ((x >> nBig) | (x << (64n - nBig))) & 0xFFFFFFFFFFFFFFFFn;
}

export function blake2bRaw(outLen: number, key: Uint8Array, msg: Uint8Array): Uint8Array {
  const h = new BigUint64Array(IV64);
  h[0] ^= BigInt(0x01010000 | (key.length << 8) | outLen);

  const block = new Uint8Array(128);
  let blockLen = 0;
  let t = 0n;

  function compress(isLast: boolean) {
    const v = new BigUint64Array(16);
    for (let i = 0; i < 8; i++) v[i] = h[i];
    for (let i = 0; i < 8; i++) v[i + 8] = IV64[i];

    v[12] ^= (t & 0xFFFFFFFFFFFFFFFFn);
    v[13] ^= ((t >> 64n) & 0xFFFFFFFFFFFFFFFFn);
    if (isLast) {
      v[14] ^= 0xFFFFFFFFFFFFFFFFn;
    }

    const m = new BigUint64Array(16);
    const dv = new DataView(block.buffer, block.byteOffset, 128);
    for (let i = 0; i < 16; i++) {
      m[i] = dv.getBigUint64(i * 8, true);
    }

    function G(a: number, b: number, c: number, d: number, x: bigint, y: bigint) {
      v[a] = (v[a] + v[b] + x) & 0xFFFFFFFFFFFFFFFFn;
      v[d] = rotr64(v[d] ^ v[a], 32);
      v[c] = (v[c] + v[d]) & 0xFFFFFFFFFFFFFFFFn;
      v[b] = rotr64(v[b] ^ v[c], 24);
      v[a] = (v[a] + v[b] + y) & 0xFFFFFFFFFFFFFFFFn;
      v[d] = rotr64(v[d] ^ v[a], 16);
      v[c] = (v[c] + v[d]) & 0xFFFFFFFFFFFFFFFFn;
      v[b] = rotr64(v[b] ^ v[c], 63);
    }

    for (let r = 0; r < 12; r++) {
      const s = SIGMA[r % 10];
      G(0, 4, 8, 12, m[s[0]], m[s[1]]);
      G(1, 5, 9, 13, m[s[2]], m[s[3]]);
      G(2, 6, 10, 14, m[s[4]], m[s[5]]);
      G(3, 7, 11, 15, m[s[6]], m[s[7]]);

      G(0, 5, 10, 15, m[s[8]], m[s[9]]);
      G(1, 6, 11, 12, m[s[10]], m[s[11]]);
      G(2, 7, 8, 13, m[s[12]], m[s[13]]);
      G(3, 4, 9, 14, m[s[14]], m[s[15]]);
    }

    for (let i = 0; i < 8; i++) {
      h[i] = (h[i] ^ v[i] ^ v[i + 8]) & 0xFFFFFFFFFFFFFFFFn;
    }
  }

  if (key.length > 0) {
    block.set(key);
    blockLen = 128;
    t += 128n;
    compress(false);
    block.fill(0);
    blockLen = 0;
  }

  let offset = 0;
  while (offset < msg.length) {
    const left = msg.length - offset;
    if (blockLen === 128) {
      t += 128n;
      compress(false);
      block.fill(0);
      blockLen = 0;
    }
    const take = Math.min(left, 128 - blockLen);
    block.set(msg.subarray(offset, offset + take), blockLen);
    blockLen += take;
    offset += take;
  }

  t += BigInt(blockLen);
  compress(true);

  const out = new Uint8Array(outLen);
  for (let i = 0; i < Math.min(8, Math.ceil(outLen / 8)); i++) {
    const w = h[i];
    for (let j = 0; j < 8 && (i * 8 + j) < outLen; j++) {
      out[i * 8 + j] = Number((w >> BigInt(j * 8)) & 0xFFn);
    }
  }
  return out;
}

export function Hprime(A: Uint8Array, tau: number): Uint8Array {
  const emptyKey = new Uint8Array(0);
  const tauBytes = new Uint8Array(4);
  new DataView(tauBytes.buffer).setUint32(0, tau, true);

  if (tau <= 64) {
    const msg = new Uint8Array(4 + A.length);
    msg.set(tauBytes, 0);
    msg.set(A, 4);
    return blake2bRaw(tau, emptyKey, msg);
  }

  const r = Math.ceil(tau / 32) - 2;
  const out = new Uint8Array(tau);

  const msg1 = new Uint8Array(4 + A.length);
  msg1.set(tauBytes, 0);
  msg1.set(A, 4);
  let V = blake2bRaw(64, emptyKey, msg1);
  out.set(V.subarray(0, 32), 0);

  for (let i = 2; i <= r; i++) {
    V = blake2bRaw(64, emptyKey, V);
    out.set(V.subarray(0, 32), (i - 1) * 32);
  }

  const lastLen = tau - 32 * r;
  const V_last = blake2bRaw(lastLen, emptyKey, V);
  out.set(V_last, r * 32);
  return out;
}

function f_G(v: BigUint64Array, a: number, b: number, c: number, d: number): void {
  const M = 0xFFFFFFFFn;
  const mul = (x: bigint, y: bigint) => (2n * (x & M) * (y & M)) & 0xFFFFFFFFFFFFFFFFn;

  v[a] = (v[a] + v[b] + mul(v[a], v[b])) & 0xFFFFFFFFFFFFFFFFn;
  v[d] = rotr64(v[d] ^ v[a], 32);
  v[c] = (v[c] + v[d] + mul(v[c], v[d])) & 0xFFFFFFFFFFFFFFFFn;
  v[b] = rotr64(v[b] ^ v[c], 24);
  v[a] = (v[a] + v[b] + mul(v[a], v[b])) & 0xFFFFFFFFFFFFFFFFn;
  v[d] = rotr64(v[d] ^ v[a], 16);
  v[c] = (v[c] + v[d] + mul(v[c], v[d])) & 0xFFFFFFFFFFFFFFFFn;
  v[b] = rotr64(v[b] ^ v[c], 63);
}

function P_round(
  v: BigUint64Array,
  i0: number, i1: number, i2: number, i3: number,
  i4: number, i5: number, i6: number, i7: number,
  i8: number, i9: number, i10: number, i11: number,
  i12: number, i13: number, i14: number, i15: number
): void {
  f_G(v, i0, i4, i8, i12);
  f_G(v, i1, i5, i9, i13);
  f_G(v, i2, i6, i10, i14);
  f_G(v, i3, i7, i11, i15);

  f_G(v, i0, i5, i10, i15);
  f_G(v, i1, i6, i11, i12);
  f_G(v, i2, i7, i8, i13);
  f_G(v, i3, i4, i9, i14);
}

export function blockCompression(X: BigUint64Array, Y: BigUint64Array, out: BigUint64Array): void {
  const R = new BigUint64Array(128);
  for (let i = 0; i < 128; i++) {
    R[i] = X[i] ^ Y[i];
  }
  const Q = new BigUint64Array(R);

  // Row round: 8 rows of 16 words
  for (let row = 0; row < 8; row++) {
    const o = row * 16;
    P_round(Q, o+0, o+1, o+2, o+3, o+4, o+5, o+6, o+7, o+8, o+9, o+10, o+11, o+12, o+13, o+14, o+15);
  }

  // Column round: 8 columns of 16 words
  for (let col = 0; col < 8; col++) {
    P_round(
      Q,
      2*col, 2*col+1,
      2*col+16, 2*col+17,
      2*col+32, 2*col+33,
      2*col+48, 2*col+49,
      2*col+64, 2*col+65,
      2*col+80, 2*col+81,
      2*col+96, 2*col+97,
      2*col+112, 2*col+113
    );
  }

  for (let i = 0; i < 128; i++) {
    out[i] = R[i] ^ Q[i];
  }
}

function blockToHexSnippet(b: BigUint64Array, wordsCount = 4): string {
  const u8 = new Uint8Array(b.buffer, b.byteOffset, wordsCount * 8);
  return bytesToHex(u8);
}

export function argon2Core(
  type: 'argon2d' | 'argon2i' | 'argon2id',
  passwordInput: string | Uint8Array,
  saltInput: string | Uint8Array,
  p = 1,
  tagLength = 32,
  m = 64, // KiB
  t = 2, // passes
  secretKeyInput: string | Uint8Array = new Uint8Array(0),
  associatedDataInput: string | Uint8Array = new Uint8Array(0),
): ComputationResult {
  const steps: ComputationStep[] = [];

  const P = typeof passwordInput === 'string'
    ? (passwordInput.startsWith('0x') ? hexToBytes(passwordInput.slice(2)) : stringToBytes(passwordInput))
    : passwordInput;
  const S = typeof saltInput === 'string'
    ? (saltInput.startsWith('0x') ? hexToBytes(saltInput.slice(2)) : stringToBytes(saltInput))
    : saltInput;
  const K = typeof secretKeyInput === 'string' ? (secretKeyInput.startsWith('0x') ? hexToBytes(secretKeyInput.slice(2)) : stringToBytes(secretKeyInput)) : secretKeyInput;
  const X_data = typeof associatedDataInput === 'string' ? (associatedDataInput.startsWith('0x') ? hexToBytes(associatedDataInput.slice(2)) : stringToBytes(associatedDataInput)) : associatedDataInput;

  const passwordStr = typeof passwordInput === 'string' ? passwordInput : bytesToHex(passwordInput);
  const saltStr = typeof saltInput === 'string' ? saltInput : bytesToHex(saltInput);
  const secretKeyStr = K.length > 0 ? bytesToHex(K) : undefined;
  const associatedDataStr = X_data.length > 0 ? bytesToHex(X_data) : undefined;

  const safeP = Math.max(1, Math.floor(p));
  const safeT = Math.max(1, Math.floor(t));
  const safeTagLength = Math.max(4, Math.floor(tagLength));
  const safeM = Math.max(8 * safeP, Math.floor(m));

  const v = 0x13; // Version 19
  const y = type === 'argon2d' ? 0 : type === 'argon2i' ? 1 : 2;

  const B_count = 4 * safeP * Math.floor(safeM / (4 * safeP));
  const q = Math.floor(B_count / safeP);
  const s_L = Math.floor(q / 4);
  const totalComputedBlocks = B_count * safeT;

  steps.push({
    id: 'argon2id-init',
    title: 'Argon2id Initialization & Memory Allocation',
    phase: 'INITIALIZATION',
    description: `Configured Argon2id v${v}: Memory=${m} KiB (${B_count} 1KB blocks), Passes=${t}, Parallelism=${p} lane${p > 1 ? 's' : ''}, TagLength=${tagLength} bytes.\nTotal Matrix Evaluation: ${totalComputedBlocks} 1KB blocks (${(B_count * 1024 / 1024).toFixed(0)} KiB matrix size).`,
    visualizationType: 'binary-transform',
    data: {
      argon2id: {
        toolType: 'Argon2id',
        password: passwordStr,
        salt: saltStr,
        secretKey: secretKeyStr,
        associatedData: associatedDataStr,
        m,
        t,
        p,
        tagLength,
        version: v,
        totalBlocks: B_count,
        totalComputedBlocks,
        progressPercent: 0,
        phaseName: 'Parameter Initialization',
      } as Argon2idStepData,
    },
  });

  // Compute H0
  const h0Input = new Uint8Array(40 + P.length + S.length + K.length + X_data.length);
  const dv = new DataView(h0Input.buffer);
  let pos = 0;
  dv.setUint32(pos, safeP, true); pos += 4;
  dv.setUint32(pos, safeTagLength, true); pos += 4;
  dv.setUint32(pos, safeM, true); pos += 4;
  dv.setUint32(pos, safeT, true); pos += 4;
  dv.setUint32(pos, v, true); pos += 4;
  dv.setUint32(pos, y, true); pos += 4;
  dv.setUint32(pos, P.length, true); pos += 4;
  h0Input.set(P, pos); pos += P.length;
  dv.setUint32(pos, S.length, true); pos += 4;
  h0Input.set(S, pos); pos += S.length;
  dv.setUint32(pos, K.length, true); pos += 4;
  h0Input.set(K, pos); pos += K.length;
  dv.setUint32(pos, X_data.length, true); pos += 4;
  h0Input.set(X_data, pos); pos += X_data.length;

  const H0 = blake2bRaw(64, new Uint8Array(0), h0Input);
  const h0Hex = bytesToHex(H0);

  steps.push({
    id: 'argon2id-h0',
    title: 'Initial Parameter Hashing (H₀ 64-Byte Digest)',
    phase: 'PRE-HASHING H0',
    description: `Computed 64-byte initial digest H₀ via BLAKE2b over parameter block (p, T, m, t, v, y, P, S, K, X).\nH₀: 0x${h0Hex}.`,
    visualizationType: 'binary-transform',
    data: {
      argon2id: {
        toolType: 'Argon2id',
        password: passwordStr,
        salt: saltStr,
        secretKey: secretKeyStr,
        associatedData: associatedDataStr,
        m: safeM,
        t: safeT,
        p: safeP,
        tagLength: safeTagLength,
        version: v,
        totalBlocks: B_count,
        totalComputedBlocks,
        h0Hex,
        progressPercent: 10,
        phaseName: 'Initial BLAKE2b Hash H₀',
      } as Argon2idStepData,
    },
  });

  // Allocate matrix
  const B: BigUint64Array[][] = [];
  for (let l = 0; l < safeP; l++) {
    const lane: BigUint64Array[] = [];
    for (let c = 0; c < q; c++) {
      lane.push(new BigUint64Array(128));
    }
    B.push(lane);
  }

  // Genesis blocks: B[l][0] and B[l][1]
  for (let l = 0; l < safeP; l++) {
    for (let j = 0; j < 2; j++) {
      const inBuf = new Uint8Array(72);
      inBuf.set(H0, 0);
      const inDv = new DataView(inBuf.buffer);
      inDv.setUint32(64, j, true);
      inDv.setUint32(68, l, true);
      const bBytes = Hprime(inBuf, 1024);
      const bDv = new DataView(bBytes.buffer, bBytes.byteOffset, 1024);
      for (let w = 0; w < 128; w++) {
        B[l][j][w] = bDv.getBigUint64(w * 8, true);
      }
    }
  }

  steps.push({
    id: 'argon2id-genesis',
    title: 'Genesis Blocks Initialization (B[l][0], B[l][1])',
    phase: 'GENESIS BLOCKS',
    description: `Generated 2 genesis blocks (1024 bytes each) per lane using variable-length H'(H₀ || j || l, 1024).\nGenesis Block B[0][0]: 0x${blockToHexSnippet(B[0][0])}...`,
    visualizationType: 'binary-transform',
    data: {
      argon2id: {
        toolType: 'Argon2id',
        password: passwordStr,
        salt: saltStr,
        m,
        t,
        p,
        tagLength,
        version: v,
        totalBlocks: B_count,
        totalComputedBlocks,
        h0Hex,
        activeBlockHexSnippet: blockToHexSnippet(B[0][0]),
        progressPercent: 20,
        phaseName: 'Genesis Block Expansion',
      } as Argon2idStepData,
    },
  });

  const tmpOut = new BigUint64Array(128);
  const zeroBlock = new BigUint64Array(128);
  const inputZ = new BigUint64Array(128);
  const addressBlock = new BigUint64Array(128);

  // Compute full memory matrix across all passes, slices, lanes, and columns
  for (let pass = 0; pass < safeT; pass++) {
    for (let slice = 0; slice < 4; slice++) {
      let sampleSnippet = '';
      let sampleAddressing: 'DATA_INDEPENDENT (Argon2i)' | 'DATA_DEPENDENT (Argon2d)' = 'DATA_INDEPENDENT (Argon2i)';
      let sampleRefLane = 0;
      let sampleRefCol = 0;

      for (let l = 0; l < safeP; l++) {
        for (let idx = 0; idx < s_L; idx++) {
          const col = slice * s_L + idx;
          if (pass === 0 && col < 2) continue;

          let J1 = 0n;
          let J2 = 0n;

          const isDataIndependent = (type === 'argon2i') || (type === 'argon2id' && pass === 0 && slice < 2);
          const currentAddressing: 'DATA_INDEPENDENT (Argon2i)' | 'DATA_DEPENDENT (Argon2d)' = isDataIndependent
            ? 'DATA_INDEPENDENT (Argon2i)'
            : 'DATA_DEPENDENT (Argon2d)';

          if (isDataIndependent) {
            if (idx % 128 === 0) {
              inputZ[0] = BigInt(pass);
              inputZ[1] = BigInt(l);
              inputZ[2] = BigInt(slice);
              inputZ[3] = BigInt(B_count);
              inputZ[4] = BigInt(safeT);
              inputZ[5] = BigInt(y);
              inputZ[6] = BigInt(Math.floor(idx / 128) + 1);
              for (let k = 7; k < 128; k++) inputZ[k] = 0n;

              blockCompression(zeroBlock, inputZ, tmpOut);
              blockCompression(zeroBlock, tmpOut, addressBlock);
            }
            const addrVal = addressBlock[idx % 128];
            J1 = addrVal & 0xFFFFFFFFn;
            J2 = (addrVal >> 32n) & 0xFFFFFFFFn;
          } else {
            const prevCol = (col - 1 + q) % q;
            const prevBlock = B[l][prevCol];
            J1 = prevBlock[0] & 0xFFFFFFFFn;
            J2 = (prevBlock[0] >> 32n) & 0xFFFFFFFFn;
          }

          // Reference lane
          let refLane = l;
          if (pass === 0 && slice === 0) {
            refLane = l;
          } else {
            refLane = Number(J2 % BigInt(safeP));
          }

          // Reference index calculation
          let W_size = 0;
          let startPos = 0;

          if (pass === 0) {
            if (slice === 0) {
              W_size = idx - 1;
              startPos = 0;
            } else {
              if (refLane === l) {
                W_size = slice * s_L + idx - 1;
              } else {
                W_size = slice * s_L - (idx === 0 ? 1 : 0);
              }
              startPos = 0;
            }
          } else {
            if (refLane === l) {
              W_size = q - s_L + idx - 1;
              startPos = (slice + 1) * s_L % q;
            } else {
              W_size = q - s_L - (idx === 0 ? 1 : 0);
              startPos = (slice + 1) * s_L % q;
            }
          }

          const x_val = (J1 * J1) >> 32n;
          const y_val = (BigInt(W_size) * x_val) >> 32n;
          const zz = BigInt(W_size) - 1n - y_val;
          const refCol = Number((BigInt(startPos) + zz) % BigInt(q));

          const prevCol = (col - 1 + q) % q;
          const prevBlock = B[l][prevCol];
          const refBlock = B[refLane][refCol];

          blockCompression(prevBlock, refBlock, tmpOut);

          if (pass === 0) {
            for (let w = 0; w < 128; w++) {
              B[l][col][w] = tmpOut[w];
            }
          } else {
            for (let w = 0; w < 128; w++) {
              B[l][col][w] ^= tmpOut[w];
            }
          }

          sampleSnippet = blockToHexSnippet(B[l][col]);
          sampleAddressing = currentAddressing;
          sampleRefLane = refLane;
          sampleRefCol = refCol;
        }
      }

      // Record telemetry step for this slice/pass
      const currentGlobalSlice = pass * 4 + slice + 1;
      const totalGlobalSlices = safeT * 4;
      const pct = Math.round(20 + (currentGlobalSlice / totalGlobalSlices) * 70);

      steps.push({
        id: `argon2id-pass-${pass}-slice-${slice}`,
        title: `Pass ${pass + 1}/${safeT}, Slice ${slice + 1}/4 (${sampleAddressing.split(' ')[0]})`,
        phase: `PASS ${pass + 1} SLICE ${slice + 1}`,
        description: `Executed Segment: Slice ${slice + 1}/4 in Pass ${pass + 1}. Mode: ${sampleAddressing}.\nComputed ${safeP * s_L} 1KB blocks using G(X, Y) 8×8 BLAKE2b matrix compression.\nSample Block State: 0x${sampleSnippet}... Ref: B[Lane ${sampleRefLane}][Col ${sampleRefCol}].`,
        visualizationType: 'binary-transform',
        data: {
          argon2id: {
            toolType: 'Argon2id',
            password: passwordStr,
            salt: saltStr,
            m: safeM,
            t: safeT,
            p: safeP,
            tagLength: safeTagLength,
            version: v,
            totalBlocks: B_count,
            totalComputedBlocks,
            currentPass: pass + 1,
            currentSlice: slice + 1,
            addressingMode: sampleAddressing,
            refLane: sampleRefLane,
            refColumn: sampleRefCol,
            activeBlockHexSnippet: sampleSnippet,
            progressPercent: pct,
            phaseName: `Pass ${pass + 1} Slice ${slice + 1} (${sampleAddressing.split(' ')[0]})`,
            isSummary: true,
          } as Argon2idStepData,
        },
      });
    }
  }

  // Final block XOR folding
  const finalBlock = new BigUint64Array(128);
  for (let l = 0; l < safeP; l++) {
    for (let w = 0; w < 128; w++) {
      finalBlock[w] ^= B[l][q - 1][w];
    }
  }

  const finalBytes = new Uint8Array(1024);
  const fDv = new DataView(finalBytes.buffer);
  for (let w = 0; w < 128; w++) {
    fDv.setBigUint64(w * 8, finalBlock[w], true);
  }

  const finalBlockSnippet = blockToHexSnippet(finalBlock);

  steps.push({
    id: 'argon2id-final-fold',
    title: 'Multi-Lane Block XOR Folding',
    phase: 'LANE FOLDING',
    description: `Combined final column blocks across all ${safeP} lanes: B_final = ⨁ B[l][${q - 1}].\nFinal 1024-Byte Block Snippet: 0x${finalBlockSnippet}...`,
    visualizationType: 'binary-transform',
    data: {
      argon2id: {
        toolType: 'Argon2id',
        password: passwordStr,
        salt: saltStr,
        m: safeM,
        t: safeT,
        p: safeP,
        tagLength: safeTagLength,
        version: v,
        totalBlocks: B_count,
        totalComputedBlocks,
        finalBlockHexSnippet: finalBlockSnippet,
        progressPercent: 95,
        phaseName: 'Lane XOR Folding',
      } as Argon2idStepData,
    },
  });

  // Final tag extraction
  const tag = Hprime(finalBytes, tagLength);
  const tagHex = bytesToHex(tag);

  steps.push({
    id: 'argon2id-complete',
    title: 'Argon2id Tag Extraction Complete',
    phase: 'COMPLETE',
    description: `Extracted final ${tagLength}-byte (${tagLength * 8}-bit) cryptographic tag via H'(B_final, ${tagLength}).\nDerived Tag: 0x${tagHex}.`,
    visualizationType: 'binary-transform',
    data: {
      bytes: tagLength,
      hex: tagHex,
      input: passwordStr,
      output: tagHex,
      argon2id: {
        toolType: 'Argon2id',
        password: passwordStr,
        salt: saltStr,
        secretKey: secretKeyStr,
        associatedData: associatedDataStr,
        m,
        t,
        p,
        tagLength,
        version: v,
        totalBlocks: B_count,
        totalComputedBlocks,
        finalBlockHexSnippet: finalBlockSnippet,
        derivedTagHex: tagHex,
        progressPercent: 100,
        phaseName: 'Derived Tag Complete',
      } as Argon2idStepData,
    },
  });

  return { digest: tagHex, steps };
}

export function computeArgon2id(input: string, options?: Record<string, unknown>): ComputationResult {
  let password: string | Uint8Array = input || 'password';
  let salt: string | Uint8Array = (options?.salt as string) || 'somesalt';
  let p = typeof options?.p === 'number' ? options.p : 1;
  let tagLength = typeof options?.tagLength === 'number' ? options.tagLength : 32;
  let m = typeof options?.m === 'number' ? options.m : 64; // 64 KiB default for interactive responsiveness
  let t = typeof options?.t === 'number' ? options.t : 2;
  let secretKey: string | Uint8Array = (options?.secretKey as string) || new Uint8Array(0);
  let associatedData: string | Uint8Array = (options?.associatedData as string) || new Uint8Array(0);

  if (input.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(input);
      if (parsed.password !== undefined) password = parsed.password;
      if (parsed.salt !== undefined) salt = parsed.salt;
      if (parsed.p !== undefined) p = Number(parsed.p);
      if (parsed.tagLength !== undefined) tagLength = Number(parsed.tagLength);
      if (parsed.m !== undefined) m = Number(parsed.m);
      if (parsed.t !== undefined) t = Number(parsed.t);
      if (parsed.secretKey !== undefined) secretKey = parsed.secretKey;
      if (parsed.associatedData !== undefined) associatedData = parsed.associatedData;
    } catch {}
  }

  return argon2Core('argon2id', password, salt, p, tagLength, m, t, secretKey, associatedData);
}

export const argon2idPlugin: AlgorithmPlugin = {
  info: {
    name: 'Argon2id',
    family: 'Key Derivation Functions (KDF)',
    category: 'tools',
    digestSize: 256,
    blockSize: 1024,
    description: 'RFC 9106 Password Hashing Standard Winner (PHC), combining Argon2i data-independent addressing with Argon2d GPU/ASIC-resistant memory access.',
    useCases: [
      'Modern password hashing (RFC 9106, OWASP recommendation)',
      '1Password, Bitwarden, KeePassXC master key derivation',
      'Quantum-resistant, side-channel & ASIC-resistant key derivation',
    ],
    security: 'secure',
    year: 2015,
    designers: ['Alex Biryukov', 'Daniel Dinu', 'Dmitry Khovratovich (University of Luxembourg, IETF RFC 9106)'],
  },
  compute(input: string, options?: Record<string, unknown>): ComputationResult {
    return computeArgon2id(input, options);
  },
};
