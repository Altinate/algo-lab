/**
 * RFC 7914 Scrypt Password-Based Memory-Hard Key Derivation Function
 * Uses Salsa20/8 core permutation and SMix / ROMix pseudo-random memory access.
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { stringToBytes, bytesToHex, rotl32 } from '../../utils';
import { pbkdf2HmacSha256 } from '../pbkdf2';

export interface ScryptStepData {
  toolType: 'Scrypt';
  password: string;
  salt: string;
  N: number;
  r: number;
  p: number;
  dkLen: number;
  memoryFootprintBytes: number;
  phaseName: string;
  currentPhase: 'PBKDF2_PRE' | 'SMIX_FILL' | 'SMIX_LOOKUP' | 'PBKDF2_POST' | 'COMPLETE';
  progressPercent: number;
  blockIndex?: number;
  totalBlocks?: number;
  vIndex?: number;
  lookupIndex?: number;
  lookupTargetV?: number;
  xHexSnippet?: string;
  vjHexSnippet?: string;
  derivedKeyHex?: string;
  isSummary?: boolean;
}

export function salsa20_8_core(B: Uint32Array, out: Uint32Array): void {
  const x0 = B[0], x1 = B[1], x2 = B[2], x3 = B[3];
  const x4 = B[4], x5 = B[5], x6 = B[6], x7 = B[7];
  const x8 = B[8], x9 = B[9], x10 = B[10], x11 = B[11];
  const x12 = B[12], x13 = B[13], x14 = B[14], x15 = B[15];

  let y0 = x0, y1 = x1, y2 = x2, y3 = x3;
  let y4 = x4, y5 = x5, y6 = x6, y7 = x7;
  let y8 = x8, y9 = x9, y10 = x10, y11 = x11;
  let y12 = x12, y13 = x13, y14 = x14, y15 = x15;

  for (let i = 8; i > 0; i -= 2) {
    y4 ^= rotl32((y0 + y12) | 0, 7);
    y8 ^= rotl32((y4 + y0) | 0, 9);
    y12 ^= rotl32((y8 + y4) | 0, 13);
    y0 ^= rotl32((y12 + y8) | 0, 18);

    y9 ^= rotl32((y5 + y1) | 0, 7);
    y13 ^= rotl32((y9 + y5) | 0, 9);
    y1 ^= rotl32((y13 + y9) | 0, 13);
    y5 ^= rotl32((y1 + y13) | 0, 18);

    y14 ^= rotl32((y10 + y6) | 0, 7);
    y2 ^= rotl32((y14 + y10) | 0, 9);
    y6 ^= rotl32((y2 + y14) | 0, 13);
    y10 ^= rotl32((y6 + y2) | 0, 18);

    y3 ^= rotl32((y15 + y11) | 0, 7);
    y7 ^= rotl32((y3 + y15) | 0, 9);
    y11 ^= rotl32((y7 + y3) | 0, 13);
    y15 ^= rotl32((y11 + y7) | 0, 18);

    y1 ^= rotl32((y0 + y3) | 0, 7);
    y2 ^= rotl32((y1 + y0) | 0, 9);
    y3 ^= rotl32((y2 + y1) | 0, 13);
    y0 ^= rotl32((y3 + y2) | 0, 18);

    y6 ^= rotl32((y5 + y4) | 0, 7);
    y7 ^= rotl32((y6 + y5) | 0, 9);
    y4 ^= rotl32((y7 + y6) | 0, 13);
    y5 ^= rotl32((y4 + y7) | 0, 18);

    y11 ^= rotl32((y10 + y9) | 0, 7);
    y8 ^= rotl32((y11 + y10) | 0, 9);
    y9 ^= rotl32((y8 + y11) | 0, 13);
    y10 ^= rotl32((y9 + y8) | 0, 18);

    y12 ^= rotl32((y15 + y14) | 0, 7);
    y13 ^= rotl32((y12 + y15) | 0, 9);
    y14 ^= rotl32((y13 + y12) | 0, 13);
    y15 ^= rotl32((y14 + y13) | 0, 18);
  }

  out[0] = (y0 + x0) >>> 0;
  out[1] = (y1 + x1) >>> 0;
  out[2] = (y2 + x2) >>> 0;
  out[3] = (y3 + x3) >>> 0;
  out[4] = (y4 + x4) >>> 0;
  out[5] = (y5 + x5) >>> 0;
  out[6] = (y6 + x6) >>> 0;
  out[7] = (y7 + x7) >>> 0;
  out[8] = (y8 + x8) >>> 0;
  out[9] = (y9 + x9) >>> 0;
  out[10] = (y10 + x10) >>> 0;
  out[11] = (y11 + x11) >>> 0;
  out[12] = (y12 + x12) >>> 0;
  out[13] = (y13 + x13) >>> 0;
  out[14] = (y14 + x14) >>> 0;
  out[15] = (y15 + x15) >>> 0;
}

export function scryptBlockMix(
  B: Uint8Array,
  r: number,
  out: Uint8Array,
  X: Uint8Array,
  Y: Uint8Array,
  blockIn: Uint32Array,
): void {
  const chunkCount = 2 * r;
  X.set(B.subarray((chunkCount - 1) * 64, chunkCount * 64));
  const xView = new DataView(X.buffer, X.byteOffset, 64);

  for (let i = 0; i < chunkCount; i++) {
    const bOffset = i * 64;
    for (let k = 0; k < 64; k++) {
      X[k] ^= B[bOffset + k];
    }
    for (let k = 0; k < 16; k++) {
      blockIn[k] = xView.getUint32(k * 4, true);
    }
    salsa20_8_core(blockIn, blockIn);
    for (let k = 0; k < 16; k++) {
      xView.setUint32(k * 4, blockIn[k], true);
    }
    Y.set(X, i * 64);
  }

  for (let i = 0; i < r; i++) {
    out.set(Y.subarray(2 * i * 64, (2 * i + 1) * 64), i * 64);
    out.set(Y.subarray((2 * i + 1) * 64, (2 * i + 2) * 64), (r + i) * 64);
  }
}

export function integerify(B: Uint8Array, r: number, N: number): number {
  const offset = (2 * r - 1) * 64;
  const dv = new DataView(B.buffer, B.byteOffset + offset, 8);
  const lo = dv.getUint32(0, true);
  const hi = dv.getUint32(4, true);
  const val = (BigInt(hi) << 32n) | BigInt(lo);
  return Number(val % BigInt(N));
}

export function scryptCore(
  passwordInput: string | Uint8Array,
  saltInput: string | Uint8Array,
  N = 1024,
  r = 8,
  p = 1,
  dkLen = 64,
): ComputationResult {
  const steps: ComputationStep[] = [];

  const passwordBytes = typeof passwordInput === 'string' ? stringToBytes(passwordInput) : passwordInput;
  const saltBytes = typeof saltInput === 'string' ? stringToBytes(saltInput) : saltInput;
  const passwordStr = typeof passwordInput === 'string' ? passwordInput : bytesToHex(passwordInput);
  const saltStr = typeof saltInput === 'string' ? saltInput : bytesToHex(saltInput);

  const memoryFootprint = 128 * N * r; // RAM footprint per instance in bytes

  steps.push({
    id: 'scrypt-init',
    title: 'Scrypt Initialization & Memory Sizing',
    phase: 'INITIALIZATION',
    description: `Configured Scrypt: N=${N} (CPU/Memory cost), r=${r} (block size factor), p=${p} (parallelism), dkLen=${dkLen} bytes.\nTotal RAM requirement: ${(memoryFootprint / 1024).toFixed(1)} KiB (${memoryFootprint.toLocaleString()} bytes).`,
    visualizationType: 'binary-transform',
    data: {
      scrypt: {
        toolType: 'Scrypt',
        password: passwordStr,
        salt: saltStr,
        N,
        r,
        p,
        dkLen,
        memoryFootprintBytes: memoryFootprint,
        currentPhase: 'PBKDF2_PRE',
        progressPercent: 0,
        phaseName: 'Parameter Initialization',
      } as ScryptStepData,
    },
  });

  // Phase 1: PBKDF2 Pre-Expansion (B = PBKDF2(P, S, 1, 128 * r * p))
  const p1Len = 128 * r * p;
  const pbkdf2Pre = pbkdf2HmacSha256(passwordBytes, saltBytes, 1, p1Len);
  const B = new Uint8Array(p1Len);
  for (let i = 0; i < p1Len; i++) {
    B[i] = parseInt(pbkdf2Pre.digest.slice(i * 2, i * 2 + 2), 16);
  }

  steps.push({
    id: 'scrypt-pbkdf2-pre',
    title: 'Phase 1: PBKDF2 Pre-Expansion',
    phase: 'PBKDF2 PRE-EXPANSION',
    description: `Derived initial ${p1Len}-byte (${p} block${p > 1 ? 's' : ''} of ${128 * r}B) buffer B from password and salt using PBKDF2-HMAC-SHA256(c=1).\nB[0..32]: 0x${bytesToHex(B.subarray(0, Math.min(32, p1Len)))}...`,
    visualizationType: 'binary-transform',
    data: {
      scrypt: {
        toolType: 'Scrypt',
        password: passwordStr,
        salt: saltStr,
        N,
        r,
        p,
        dkLen,
        memoryFootprintBytes: memoryFootprint,
        currentPhase: 'PBKDF2_PRE',
        progressPercent: 10,
        xHexSnippet: bytesToHex(B.subarray(0, Math.min(32, p1Len))),
        phaseName: 'Phase 1: Initial PBKDF2 Expansion',
      } as ScryptStepData,
    },
  });

  // Phase 2: SMix ROMix for each of p blocks
  const blockSize = 128 * r;
  const Bprime = new Uint8Array(p1Len);

  const tmpOut = new Uint8Array(blockSize);
  const tmpX = new Uint8Array(64);
  const tmpY = new Uint8Array(blockSize);
  const tmpBlockIn = new Uint32Array(16);

  for (let lane = 0; lane < p; lane++) {
    const bSlice = B.subarray(lane * blockSize, (lane + 1) * blockSize);
    const V = new Uint8Array(N * blockSize);
    let X = new Uint8Array(bSlice);

    steps.push({
      id: `scrypt-smix-fill-start-lane-${lane}`,
      title: `Phase 2: SMix V-Array Allocation & Fill (Lane ${lane + 1}/${p})`,
      phase: 'SMIX ARRAY FILL',
      description: `Initialized ROMix memory buffer V with ${N} blocks of ${blockSize} bytes each. V[0] loaded with initial block B_${lane}.`,
      visualizationType: 'binary-transform',
      data: {
        scrypt: {
          toolType: 'Scrypt',
          password: passwordStr,
          salt: saltStr,
          N,
          r,
          p,
          dkLen,
          memoryFootprintBytes: memoryFootprint,
          currentPhase: 'SMIX_FILL',
          progressPercent: 15,
          blockIndex: lane + 1,
          totalBlocks: p,
          vIndex: 0,
          xHexSnippet: bytesToHex(X.subarray(0, Math.min(32, blockSize))),
          phaseName: 'Phase 2: V-Array Sequential Fill Start',
        } as ScryptStepData,
      },
    });

    // Milestone sampling set for V-array fill
    const fillMilestones = new Set([
      Math.floor(N * 0.25),
      Math.floor(N * 0.5),
      Math.floor(N * 0.75),
      N - 1,
    ]);

    // Perform ALL N sequential BlockMix fills in full
    for (let i = 0; i < N; i++) {
      V.set(X, i * blockSize);
      scryptBlockMix(X, r, tmpOut, tmpX, tmpY, tmpBlockIn);
      X.set(tmpOut);

      if (fillMilestones.has(i)) {
        const pct = Math.round(15 + ((i + 1) / N) * 35);
        steps.push({
          id: `scrypt-smix-fill-milestone-${lane}-${i}`,
          title: `SMix V-Array Fill: Block ${i + 1}/${N} (${Math.round(((i + 1) / N) * 100)}%)`,
          phase: 'SMIX ARRAY FILL',
          description: `Sequentially populated V[${i}] via Salsa20/8 BlockMix (${i + 1}/${N} blocks computed in full).\nX State: 0x${bytesToHex(X.subarray(0, Math.min(32, blockSize)))}...`,
          visualizationType: 'binary-transform',
          data: {
            scrypt: {
              toolType: 'Scrypt',
              password: passwordStr,
              salt: saltStr,
              N,
              r,
              p,
              dkLen,
              memoryFootprintBytes: memoryFootprint,
              currentPhase: 'SMIX_FILL',
              progressPercent: pct,
              blockIndex: lane + 1,
              totalBlocks: p,
              vIndex: i,
              xHexSnippet: bytesToHex(X.subarray(0, Math.min(32, blockSize))),
              phaseName: `V-Array Fill (${Math.round(((i + 1) / N) * 100)}%)`,
              isSummary: true,
            } as ScryptStepData,
          },
        });
      }
    }

    // Milestone sampling set for Random-Access Lookups
    const lookupMilestones = new Set([
      0,
      Math.floor(N * 0.25),
      Math.floor(N * 0.5),
      Math.floor(N * 0.75),
      N - 1,
    ]);

    // Perform ALL N pseudo-random memory lookups and BlockMix steps in full
    for (let i = 0; i < N; i++) {
      const j = integerify(X, r, N);
      const vOffset = j * blockSize;
      for (let k = 0; k < blockSize; k++) {
        X[k] ^= V[vOffset + k];
      }
      scryptBlockMix(X, r, tmpOut, tmpX, tmpY, tmpBlockIn);
      X.set(tmpOut);

      if (lookupMilestones.has(i)) {
        const pct = Math.round(50 + ((i + 1) / N) * 35);
        steps.push({
          id: `scrypt-smix-lookup-milestone-${lane}-${i}`,
          title: `SMix Random Read #${i + 1}/${N} → V[${j}] (${Math.round(((i + 1) / N) * 100)}%)`,
          phase: 'SMIX RANDOM LOOKUP',
          description: `Random memory jump #${i + 1}: Integerify(X) mod ${N} → fetched V[${j}].\nApplied X = BlockMix(X ⊕ V[${j}]).\nX State: 0x${bytesToHex(X.subarray(0, Math.min(32, blockSize)))}...`,
          visualizationType: 'binary-transform',
          data: {
            scrypt: {
              toolType: 'Scrypt',
              password: passwordStr,
              salt: saltStr,
              N,
              r,
              p,
              dkLen,
              memoryFootprintBytes: memoryFootprint,
              currentPhase: 'SMIX_LOOKUP',
              progressPercent: pct,
              blockIndex: lane + 1,
              totalBlocks: p,
              lookupIndex: i + 1,
              lookupTargetV: j,
              xHexSnippet: bytesToHex(X.subarray(0, Math.min(32, blockSize))),
              vjHexSnippet: bytesToHex(V.subarray(vOffset, vOffset + Math.min(32, blockSize))),
              phaseName: `Random Lookup #${i + 1} (V[${j}])`,
              isSummary: true,
            } as ScryptStepData,
          },
        });
      }
    }

    Bprime.set(X, lane * blockSize);
  }

  // Phase 3: Final PBKDF2 Post-Compression (DK = PBKDF2(P, B', 1, dkLen))
  const pbkdf2Post = pbkdf2HmacSha256(passwordBytes, Bprime, 1, dkLen);
  const finalKeyHex = pbkdf2Post.digest;

  steps.push({
    id: 'scrypt-pbkdf2-post',
    title: 'Phase 3: Final PBKDF2 Post-Compression',
    phase: 'PBKDF2 POST-COMPRESSION',
    description: `Compressed memory-hard buffer B' (${p1Len} bytes) into final ${dkLen}-byte derived key using PBKDF2-HMAC-SHA256(c=1).\nDerived Key (DK): 0x${finalKeyHex}.`,
    visualizationType: 'binary-transform',
    data: {
      scrypt: {
        toolType: 'Scrypt',
        password: passwordStr,
        salt: saltStr,
        N,
        r,
        p,
        dkLen,
        memoryFootprintBytes: memoryFootprint,
        currentPhase: 'PBKDF2_POST',
        progressPercent: 95,
        derivedKeyHex: finalKeyHex,
        phaseName: 'Phase 3: PBKDF2 Post-Compression',
      } as ScryptStepData,
    },
  });

  steps.push({
    id: 'scrypt-complete',
    title: 'Scrypt Key Derivation Complete',
    phase: 'COMPLETE',
    description: `Successfully derived ${dkLen}-byte (${dkLen * 8}-bit) cryptographic key using Scrypt(N=${N}, r=${r}, p=${p}).\nDerived Key (DK): 0x${finalKeyHex}.`,
    visualizationType: 'binary-transform',
    data: {
      bytes: dkLen,
      hex: finalKeyHex,
      input: passwordStr,
      output: finalKeyHex,
      scrypt: {
        toolType: 'Scrypt',
        password: passwordStr,
        salt: saltStr,
        N,
        r,
        p,
        dkLen,
        memoryFootprintBytes: memoryFootprint,
        currentPhase: 'COMPLETE',
        progressPercent: 100,
        derivedKeyHex: finalKeyHex,
        phaseName: 'Derived Key Complete',
      } as ScryptStepData,
    },
  });

  return { digest: finalKeyHex, steps };
}

export function computeScrypt(input: string, options?: Record<string, unknown>): ComputationResult {
  let password = input || 'password';
  let salt = (options?.salt as string) || 'NaCl';
  let N = typeof options?.N === 'number' ? options.N : 1024;
  let r = typeof options?.r === 'number' ? options.r : 8;
  let p = typeof options?.p === 'number' ? options.p : 1;
  let dkLen = typeof options?.dkLen === 'number' ? options.dkLen : 64;

  if (input.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(input);
      if (parsed.password !== undefined) password = String(parsed.password);
      if (parsed.salt !== undefined) salt = String(parsed.salt);
      if (parsed.N !== undefined) N = Number(parsed.N);
      if (parsed.r !== undefined) r = Number(parsed.r);
      if (parsed.p !== undefined) p = Number(parsed.p);
      if (parsed.dkLen !== undefined) dkLen = Number(parsed.dkLen);
    } catch {}
  }

  return scryptCore(password, salt, N, r, p, dkLen);
}

export const scryptPlugin: AlgorithmPlugin = {
  info: {
    name: 'Scrypt',
    family: 'Key Derivation Functions (KDF)',
    category: 'tools',
    digestSize: 512,
    blockSize: 1024,
    description: 'RFC 7914 Memory-Hard Password-Based Key Derivation Function using Salsa20/8 and ROMix algorithm.',
    useCases: [
      'Litecoin (LTC) & Dogecoin (DOGE) proof-of-work consensus hashing',
      'Ethereum keystore file encryption (EIP-2335)',
      'Hardware ASIC/GPU-resistant password hashing and master key derivation',
    ],
    security: 'secure',
    year: 2009,
    designers: ['Colin Percival (Tarsnap, IETF RFC 7914)'],
  },
  compute(input: string, options?: Record<string, unknown>): ComputationResult {
    return computeScrypt(input, options);
  },
};
