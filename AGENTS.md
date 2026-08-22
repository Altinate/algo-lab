# AGENTS.md: Developer & AI Agent Reference Manual

> **Target Audience**: AI coding assistants (Claude Code, Antigravity, Gemini CLI, Cursor, Copilot) and human maintainers working on this codebase.
> **Purpose**: Maintain architectural consistency, prevent regression of standardized data contracts, preserve the "Cryptographic Logic Analyzer" design system, and provide clear protocols for implementing new algorithms.

---

## 1. Architecture & Category Taxonomy

CryptoScope is structured as an extensible **Algorithm & Tool Plugin System** paired with specialized **Hardware Telemetry Visualizers**.

```
Algorithm/Tool Plugin (e.g. src/algorithms/md5/index.ts, src/algorithms/tools/pbkdf2/index.ts)
  │
  ├── Computes digest/keys & generates ComputationStep[]
  │
  ▼
Central Registry (src/algorithms/registry.ts)
  │
  ├── Exposes getAlgorithm(), listAlgorithms(), getAlgorithmsByFamily()
  │
  ▼
Playback Engine (src/hooks/useHashEngine.ts)
  │
  ├── Manages currentStepIndex, isPlaying, playbackSpeed, scrubber, XOF byte length
  │
  ▼
Visualization Router (src/components/StepVisualizer.tsx)
  │
  ├── 'round-computation'   ──▶ RoundComputationView.tsx (3-bus logic analyzer: MD, SHA-1, SHA-2, RIPEMD, SM3, XXH)
  ├── 'state-matrix'        ──▶ StateMatrixView.tsx (5×5 Keccak sponge matrix & 8×8 Whirlpool cipher matrix)
  ├── 'aes-state-matrix'    ──▶ AesStateMatrixView.tsx (4×4 AES transformation matrix & round keys)
  ├── 'feistel-ladder'      ──▶ FeistelLadderView.tsx (2-branch Feistel ladder: DES, 3DES)
  ├── 'asymmetric-modexp'   ──▶ AsymmetricModExpView.tsx (BigInt ModExp & CRT decomposition: RSA)
  ├── 'ecc-point'           ──▶ EccPointView.tsx (Elliptic Curve point addition & doubling: ECDSA)
  ├── 'key-exchange'        ──▶ KeyExchangeView.tsx (2-party key agreement swimlane: DH, ECDH)
  ├── 'lattice-polynomial'  ──▶ LatticePolynomialView.tsx (PQC spectrum & NTT butterflies: ML-KEM, ML-DSA)
  ├── 'mixing-function'     ──▶ MixingFunctionView.tsx (4×4 ARX mixing matrix: BLAKE2, BLAKE3, ChaCha20)
  ├── 'xor-table'           ──▶ XorTableView.tsx (CRC-16, CRC32, Adler-32 polynomial/modulo pipeline)
  ├── 'binary-transform'    ──▶ BinaryTransformView.tsx (Padding, bit-grouping, Base58, Punycode, Morse, JWT, KDF)
  └── 'final-digest'        ──▶ FinalDigestView.tsx (Output assembly)
```

### 1.1 Category Classification Taxonomy

The system organizes all algorithms and utilities into 6 top-level categories:

1. **Hash Functions (`hash`)**: Standalone cryptographic and non-cryptographic hash functions (MD, SHA-1, SHA-2, SHA-3, Keccak, RIPEMD, BLAKE, CRC, Checksums, XXHash, SM3, Whirlpool).
2. **Symmetric Ciphers (`symmetric`)**: Standalone symmetric block and stream ciphers (AES-128/192/256 ECB/CBC/CTR/GCM, DES, 3DES, ChaCha20, ChaCha20-Poly1305).
3. **Asymmetric Cryptography (`asymmetric`)**: Standalone asymmetric public-key primitives and key exchanges (RSA-2048, RSA-Pedagogical, ECDSA secp256k1/P-256, Diffie-Hellman MODP/ECDH).
4. **Post-Quantum Cryptography (`pqc`)**: Standalone lattice-based post-quantum standards (ML-KEM-512/768/1024, ML-DSA-44/65/87).
5. **Encoding Schemes (`encoding`)**: Standalone radix, character, and historical encoding/decoding codecs (Base64, Base64URL, Base32, Base16, Base58, Base85, Base36, URL, UTF-8, UTF-16, Punycode, Quoted-Printable, Morse, JWT).
6. **Tools (`tools`)**: Composite cryptographic pipelines, utilities, generators, format inspectors, and entropy analyzers that chain multiple primitives together or provide interactive tooling:
   - **Key Derivation Functions (KDF)**: Iterated and memory-hard KDFs (PBKDF2, Scrypt, Argon2id).
   - **Wallet / Mnemonic Generation**: Composite wallet key generators (BIP-39 mnemonic phrase & seed derivation).
   - **Future Tools Sub-Families**: Entropy & CSPRNG visualizers, Format & Parsing tools (ASN.1, DER, PEM, X.509, JWK), Compression schemes (Huffman, LZ77, Deflate, Snappy).

**Classification Rule**: Standalone mathematical primitives operating on uniform input blocks belong to their respective dedicated category (`hash`, `symmetric`, `asymmetric`, `pqc`, `encoding`). Composite pipelines (chaining multiple primitives), format parsers, interactive generators, and utility analyzers belong under `tools`.

---

## 2. Canonical Data Contracts (CRITICAL)

Each visualization component expects **one canonical data shape**. Plugins **MUST** conform to these shapes. Do **NOT** introduce alternative key names or fallback key-matching logic in visualizer components.

### 2.1 `RoundComputationView` (`visualizationType: 'round-computation'`)
Used by **MD2, MD4, MD5, SHA-1, SHA-2 (all), RIPEMD (all), SM3, XXH32, XXH64**.

```typescript
export interface VariableItem {
  label: string;      // e.g. 'A', 'B', 'C', 'D' for MD5; 'a'..'h' for SHA-2; 'A_L'..'E_R' for RIPEMD
  hex: string;        // Hex value (8 chars for 32-bit, 16 chars for 64-bit BigInt)
  binary?: string;    // Binary string (32 bits or 64 bits)
}

export interface ScheduleItem {
  index: number;
  hex: string;
  binary?: string;
  computed?: boolean;
  active?: boolean;
}

export interface ConstantItem {
  index: number;
  hex: string;
  binary?: string;
  active?: boolean;
}

export interface RoundComputationData {
  roundIndex?: number;
  scheduleIndex?: number;
  variables?: VariableItem[];
  prevVariables?: VariableItem[];
  newVariables?: VariableItem[];
  schedule?: ScheduleItem[];       // Left column message buffer (M or W)
  constants?: ConstantItem[];      // Right column ROM table (K)
  activeW?: ScheduleItem;
  activeK?: ConstantItem;
  // Specific ALU breakdowns:
  md5Step?: { ... };               // MD5 ALU pipeline telemetry
  sha1Step?: { ... };              // SHA-1 ALU pipeline telemetry
  temp1?: { ... };                 // SHA-2 Temp1 pipeline telemetry
  temp2?: { ... };                 // SHA-2 Temp2 pipeline telemetry
  sigma0?: { ... };                // Message schedule lower sigma0 expansion
  sigma1?: { ... };                // Message schedule lower sigma1 expansion
  updates?: Array<{                // Block end state accumulation
    label: string;
    prevHex: string;
    addHex: string;
    newHex: string;
  }>;
}
```

### 2.2 `StateMatrixView` (`visualizationType: 'state-matrix'`)
Used by **SHA3-224/256/384/512, Keccak-224/256/384/512, SHAKE128/256, Whirlpool**.

```typescript
export interface StateMatrixData {
  roundIndex?: number;             // Round number (1..24 for Keccak, 1..10 for Whirlpool)
  subStep?: string;                // e.g. 'θ → ρ → π → χ → ι'
  roundConstant?: string;          // 64-bit round constant for ι (e.g. '0x0000000000000001')
  rateBits?: number;               // Sponge rate in bits (e.g. 1088 for SHA3-256)
  capacityBits?: number;           // Sponge capacity in bits (e.g. 512 for SHA3-256)
  absorbLanes?: number;            // Number of 64-bit lanes absorbed per block
  spongePhase?: string;            // 'Absorbing' | 'Permutation' | 'Squeezing'
  stateMatrix: string[][];         // 5×5 (Keccak) or 8×8 (Whirlpool) array of hex strings
  prevStateMatrix?: string[][];    // Pre-round strings for lane diff highlighting
}
```

### 2.3 `MixingFunctionView` (`visualizationType: 'mixing-function'`)
Used by **BLAKE2s, BLAKE2b, BLAKE3**.

```typescript
export interface GCallDetail {
  label: string;                   // e.g. "G(0, 4, 8, 12)"
  stepType: 'column' | 'diagonal';
  indices: [number, number, number, number];
  inputs: {
    va: string; vb: string; vc: string; vd: string;
    mx: string; my: string;
    xIdx: number; yIdx: number;
  };
  outputs: {
    va: string; vb: string; vc: string; vd: string;
  };
  rotations: number[];             // e.g. [16, 12, 8, 7] for 32-bit, [32, 24, 16, 63] for 64-bit
}

export interface MixingFunctionData {
  roundIndex?: number;
  mixType?: string;                // "Columns & Diagonals"
  state: string[];                 // 16 formatted hex strings for current 4×4 work matrix
  prevState?: string[];            // 16 formatted hex strings for pre-round 4×4 work matrix
  gCalls?: GCallDetail[];          // 8 G-function calls (4 column calls + 4 diagonal calls)
  m?: string[];                    // 16 message words for current block
  sigmaIndex?: number;
  sigma?: number[];                // Permutation array
}
```

### 2.4 `XorTableView` (`visualizationType: 'xor-table'`)
Used by **CRC-16, CRC32, Adler-32**.

```typescript
export interface XorTableData {
  byteIndex?: number;              // Current byte index (0-based)
  byteValue?: number;              // Numeric byte value (0..255)
  char?: string;                   // Printable ASCII character or undefined
  prevCrc?: string;                // Hex string (e.g. '0xFFFFFFFF')
  xorInput?: string;               // Formatted equation (e.g. '0x31 ⊕ 0xFF = 0xCE')
  tableIndex?: string;             // Table index (e.g. '0xCE (206)')
  tableValue?: string;             // 32-bit polynomial value from ROM
  shiftedCrc?: string;             // CRC >>> 8
  newCrc?: string;                 // (CRC >>> 8) ⊕ TABLE[index]
}
```

### 2.5 `AesStateMatrixView` (`visualizationType: 'aes-state-matrix'`)
Used by **AES-128, AES-192, AES-256 (ECB, CBC, CTR, GCM modes)**.

```typescript
export interface AesStateMatrixData {
  roundIndex?: number;             // Current round (0..Nr)
  totalRounds?: number;            // Total rounds (10 for AES-128, 12 for AES-192, 14 for AES-256)
  phase?: string;                  // e.g. 'Round 1', 'Final Round', 'CBC Chaining'
  subStep?: string;                // e.g. 'SubBytes', 'ShiftRows', 'MixColumns', 'AddRoundKey'
  operationName?: string;          // Identifier for helper views
  stateMatrix: string[][];         // 4×4 column-major array of 2-digit hex strings
  prevStateMatrix?: string[][];    // 4×4 pre-transformation array for lane diff highlighting
  roundKeyMatrix?: string[][];     // 4×4 round key array for AddRoundKey step
  blockIndex?: number;             // Multi-block index (0-based)
  totalBlocks?: number;            // Total blocks count
}
```

### 2.6 `FeistelLadderView` (`visualizationType: 'feistel-ladder'`)
Used by **DES (ECB, CBC), 3DES (ECB, CBC)**.

```typescript
export interface FeistelLadderData {
  roundIndex?: number;             // Current round (1..16)
  totalRounds?: number;            // Total rounds (16)
  prevLHex?: string;               // 32-bit left half before round
  prevRHex?: string;               // 32-bit right half before round
  newLHex?: string;                // 32-bit left half after round (L_i = R_{i-1})
  newRHex?: string;                // 32-bit right half after round (R_i = L_{i-1} ⊕ F(R_{i-1}, K_i))
  subkeyHex?: string;              // 48-bit subkey K_i (12 hex chars)
  eExpansionHex?: string;          // 48-bit E-expansion value
  sboxInHex?: string;              // 48-bit S-box input (E(R) ⊕ K_i)
  sboxOutputs?: number[];          // 8 4-bit nibbles from S-boxes
  fOutputHex?: string;             // 32-bit P-permutation output F(R, K)
  outputHex?: string;              // 64-bit block ciphertext output
  blockIndex?: number;             // Multi-block index (0-based)
  totalBlocks?: number;            // Total blocks count
}
```

---

## 3. Hard Engineering Rules (Do & Don't)

### ✅ DO:
1. **Emit Canonical Payloads**: When adding or editing an algorithm plugin, ensure its step payloads conform strictly to the interfaces above.
2. **Verify Official Test Vectors**: Every algorithm change MUST pass its official standard test vectors (NIST FIPS 180-4, NIST FIPS 202, NIST FIPS 197, NIST FIPS 46-3, NIST SP 800-67, NIST SP 800-38A, NIST SP 800-38D, RFC 1319, RFC 1320, RFC 1321, RFC 7693, RFC 8439, ISO/IEC 10118-3, GB/T 32918.2-2016). Run `npm run test:run`.
3. **Run Full Regression Suite**: Whenever modifying shared components (`RoundComputationView`, `MixingFunctionView`, `StateMatrixView`, `AesStateMatrixView`, `FeistelLadderView`, `XorTableView`, `GenericStepView`), run the ENTIRE test suite (`npm run test:run`) to ensure zero regressions across all 68 algorithms.
4. **Use 64-Bit BigInt Arithmetic for 64-Bit Algorithms**: JavaScript `number` loses precision above $2^{53} - 1$. Always use `bigint` with `0xFFFFFFFFFFFFFFFFn` bitmask for SHA-512, SHA-384, BLAKE2b, XXH64, Whirlpool, Keccak/SHA-3, and DES/3DES bitwise permutations.
5. **Adhere to the Hardware Instrument Design System**:
   - Backgrounds: Obsidian substrate `#090c10`, `#0c1017`, `#0e131b`.
   - Borders: Hairline 1px borders with `#1f2937` or `#374151`.
   - Radii: Micro-geometry `rounded-[2px]` or `rounded-none`. Never use soft `rounded-lg` or `rounded-full` pills.
   - Typography: Monospace (`font-mono`) with `tabular-nums` forced on all numerals and formulas.
   - Chromatic 95/5 Discipline: 95% dark substrate, 5% phosphor signals (`#e5a93b` amber, `#38bdf8` cyan, `#34d399` emerald, `#c084fc` purple). Controlled text-shadow max 3px radius (e.g. `.phosphor-amber`).
6. **Always Include Raw Test Output in Verification Reports**: When reporting test vector verification, always paste the unedited `npm run test:run` terminal output first. A formatted summary table is welcome on top of that for readability, but never as a replacement. Where test vectors are individually verified outside the test suite (e.g. to debug a suspected discrepancy), run a direct compute script (`npx tsx scripts/compute-digests.ts`, `scripts/compute-aes-digests.ts`, or `scripts/compute-phase2-digests.ts`) and paste its raw stdout. This rule exists because hand-transcribed digest values and manually copied intermediate numbers are indistinguishable from bugs when they are wrong, and re-verification is expensive.

### ❌ DO NOT:
1. **DO NOT Add Fallback Key Matching to Components**: Do not write `data.crcBefore || data.prevCrc` or `data.v || data.stateMatrix` in visualizers. Fix the plugin to emit the canonical key instead.
2. **DO NOT Assume SHA-256 Word Sizes Everywhere**: Never hardcode 32-bit shifts or 8-register counts in shared visualizers without supporting dynamic word sizes (32-bit vs 64-bit) and register counts (4 for MD5, 5 for SHA-1, 8 for SHA-2, 10 for RIPEMD).
3. **DO NOT Expand Multi-Block Merkle-Trees in BLAKE3 (Yet)**: BLAKE3 is intentionally scoped to single-chunk/single-block inputs ($\le 64$ bytes). Multi-chunk Merkle tree visualization is an explicitly deferred feature. If input exceeds 64 bytes, report the single-block evaluation cleanly in the UI.
4. **DO NOT Add External Web Links ("REF" buttons)**: This application is a self-contained offline instrument. External URLs and outbound links in the DOM are forbidden.
5. **DO NOT Introduce AI-Slop Glows or Soft Shadows**: Avoid large blurred radial gradients, heavy drop shadows, or generic SaaS card elevations.
6. **DO NOT Hand-Transcribe Digest Values or Test Counts in Reports**: Never retype digest hex strings or per-file test counts from memory, internal state, or asynchronous streaming console progress lines (which frequently interleave chunks from different suites like `sha3-256` vs `sha256`). Always rely on unedited final test runner outputs or deterministic per-file runs (`npx vitest run <file>`) alongside any summary table. The raw output is the ground truth; the table is supplemental readability only.

---

## 4. Testing & Verification Checklist

Before considering any task complete in this repository, verify all 4 criteria:

1. **Test Suite Passes**:
   ```bash
   npm run test:run
   ```
   Must output: `Test Files 43 passed (43), Tests 157 passed (157)`.
2. **Production Build Clean**:
   ```bash
   npm run build
   ```
   Must compile with 0 TypeScript errors and 0 Vite warnings.
3. **No Blank UI Fallbacks**:
   Inspect playback in browser (`http://localhost:5173`) to confirm every step has populated data.
4. **Zero Shared Component Regression**:
   Verify SHA-256, MD5, SHA-512, AES-128, and DES-ECB render identically after any visualizer changes.
