# AGENTS.md: Developer & AI Agent Reference Manual

> **Target Audience**: AI coding assistants (Claude Code, Antigravity, Gemini CLI, Cursor, Copilot) and human maintainers working on this codebase.
> **Purpose**: Maintain architectural consistency, prevent regression of standardized data contracts, preserve the "Cryptographic Logic Analyzer" design system, and provide clear protocols for implementing new algorithms.

---

## 1. Architecture Overview

CryptoScope is structured as an extensible **Algorithm Plugin System** paired with specialized **Hardware Telemetry Visualizers**.

```
Algorithm Plugin (e.g. src/algorithms/md5/index.ts)
  │
  ├── Computes digest & generates ComputationStep[]
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
Visualization Router (src/components/visualizations/StepVisualization.tsx)
  │
  ├── 'round-computation' ──▶ RoundComputationView.tsx (3-bus logic analyzer: MD, SHA-1, SHA-2, RIPEMD, SM3, XXH)
  ├── 'state-matrix'      ──▶ StateMatrixView.tsx (5×5 Keccak sponge matrix & 8×8 Whirlpool cipher matrix)
  ├── 'mixing-function'   ──▶ MixingFunctionView.tsx (4×4 ARX mixing matrix: BLAKE2, BLAKE3)
  ├── 'xor-table'         ──▶ XorTableView.tsx (CRC-16, CRC32, Adler-32 polynomial/modulo pipeline)
  ├── 'binary-transform'  ──▶ BinaryTransformView.tsx (Padding & byte inspection)
  └── 'final-digest'      ──▶ FinalDigestView.tsx (Output assembly)
```

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

---

## 3. Hard Engineering Rules (Do & Don't)

### ✅ DO:
1. **Emit Canonical Payloads**: When adding or editing an algorithm plugin, ensure its step payloads conform strictly to the interfaces above.
2. **Verify Official Test Vectors**: Every algorithm change MUST pass its official standard test vectors (NIST FIPS 180-4, NIST FIPS 202, RFC 1319, RFC 1320, RFC 1321, RFC 7693, ISO/IEC 10118-3, GB/T 32918.2-2016). Run `npm run test:run`.
3. **Run Full Regression Suite**: Whenever modifying shared components (`RoundComputationView`, `MixingFunctionView`, `StateMatrixView`, `XorTableView`, `GenericStepView`), run the ENTIRE test suite (`npm run test:run`) to ensure zero regressions across all 34 algorithms.
4. **Use 64-Bit BigInt Arithmetic for 64-Bit Algorithms**: JavaScript `number` loses precision above $2^{53} - 1$. Always use `bigint` with `0xFFFFFFFFFFFFFFFFn` bitmask for SHA-512, SHA-384, BLAKE2b, XXH64, Whirlpool, and Keccak/SHA-3.
5. **Adhere to the Hardware Instrument Design System**:
   - Backgrounds: Obsidian substrate `#090c10`, `#0c1017`, `#0e131b`.
   - Borders: Hairline 1px borders with `#1f2937` or `#374151`.
   - Radii: Micro-geometry `rounded-[2px]` or `rounded-none`. Never use soft `rounded-lg` or `rounded-full` pills.
   - Typography: Monospace (`font-mono`) with `tabular-nums` forced on all numerals and formulas.
   - Chromatic 95/5 Discipline: 95% dark substrate, 5% phosphor signals (`#e5a93b` amber, `#38bdf8` cyan, `#34d399` emerald, `#c084fc` purple). Controlled text-shadow max 3px radius (e.g. `.phosphor-amber`).

### ❌ DO NOT:
1. **DO NOT Add Fallback Key Matching to Components**: Do not write `data.crcBefore || data.prevCrc` or `data.v || data.stateMatrix` in visualizers. Fix the plugin to emit the canonical key instead.
2. **DO NOT Assume SHA-256 Word Sizes Everywhere**: Never hardcode 32-bit shifts or 8-register counts in shared visualizers without supporting dynamic word sizes (32-bit vs 64-bit) and register counts (4 for MD5, 5 for SHA-1, 8 for SHA-2, 10 for RIPEMD).
3. **DO NOT Expand Multi-Block Merkle-Trees in BLAKE3 (Yet)**: BLAKE3 is intentionally scoped to single-chunk/single-block inputs ($\le 64$ bytes). Multi-chunk Merkle tree visualization is an explicitly deferred feature. If input exceeds 64 bytes, report the single-block evaluation cleanly in the UI.
4. **DO NOT Add External Web Links ("REF" buttons)**: This application is a self-contained offline instrument. External URLs and outbound links in the DOM are forbidden.
5. **DO NOT Introduce AI-Slop Glows or Soft Shadows**: Avoid large blurred radial gradients, heavy drop shadows, or generic SaaS card elevations.

---

## 4. Testing & Verification Checklist

Before considering any task complete in this repository, verify all 4 criteria:

1. **Test Suite Passes**:
   ```bash
   npm run test:run
   ```
   Must output: `Test Files 35 passed (35), Tests 130 passed (130)`.
2. **Production Build Clean**:
   ```bash
   npm run build
   ```
   Must compile with 0 TypeScript errors and 0 Vite warnings.
3. **No Blank UI Fallbacks**:
   Inspect playback in browser (`http://localhost:5173`) to confirm every step has populated data.
4. **Zero Shared Component Regression**:
   Verify SHA-256, MD5, and SHA-512 render identically after any visualizer changes.
