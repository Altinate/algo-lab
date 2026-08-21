# AGENTS.md: Developer & AI Agent Reference Manual

> **Target Audience**: AI coding assistants (Claude Code, Antigravity, Gemini CLI, Cursor, Copilot) and human maintainers working on this codebase.
> **Purpose**: Maintain architectural consistency, prevent regression of standardized data contracts, preserve the "Cryptographic Logic Analyzer" design system, and provide clear protocols for implementing new algorithms.

---

## 1. Architecture Overview

This project is structured as an extensible **Algorithm Plugin System** paired with specialized **Hardware Telemetry Visualizers**.

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
  ├── Manages currentStepIndex, isPlaying, playbackSpeed, scrubber
  │
  ▼
Visualization Router (src/components/visualizations/StepVisualization.tsx)
  │
  ├── 'round-computation' ──▶ RoundComputationView.tsx (3-bus logic analyzer)
  ├── 'state-matrix'      ──▶ StateMatrixView.tsx (5×5 Keccak sponge matrix)
  ├── 'mixing-function'   ──▶ MixingFunctionView.tsx (4×4 ARX mixing matrix)
  ├── 'xor-table'         ──▶ XorTableView.tsx (CRC32 polynomial pipeline)
  ├── 'binary-transform'  ──▶ BinaryTransformView.tsx (Padding & byte inspection)
  └── 'final-digest'      ──▶ FinalDigestView.tsx (Output assembly)
```

---

## 2. Canonical Data Contracts (CRITICAL)

Each visualization component expects **one canonical data shape**. Plugins **MUST** conform to these shapes. Do **NOT** introduce alternative key names or fallback key-matching logic in visualizer components.

### 2.1 `RoundComputationView` (`visualizationType: 'round-computation'`)
Used by **MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512**.

```typescript
export interface VariableItem {
  label: string;      // e.g. 'A', 'B', 'C', 'D' for MD5; 'a'..'h' for SHA-2
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
Used by **SHA3-256, SHA3-512, Keccak-256**.

```typescript
export interface StateMatrixData {
  roundIndex?: number;             // Round number (1..24)
  subStep?: string;                // e.g. 'θ → ρ → π → χ → ι'
  roundConstant?: string;          // 64-bit round constant for ι (e.g. '0x0000000000000001')
  rateBits?: number;               // Sponge rate in bits (e.g. 1088 for SHA3-256)
  capacityBits?: number;           // Sponge capacity in bits (e.g. 512 for SHA3-256)
  absorbLanes?: number;            // Number of 64-bit lanes absorbed per block
  spongePhase?: string;            // 'Absorbing' | 'Permutation' | 'Squeezing'
  stateMatrix: string[][];         // 5×5 array of 16-hex-char strings: A[y][x]
  prevStateMatrix?: string[][];    // 5×5 array of pre-round strings for lane diff highlighting
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
Used by **CRC32**.

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
2. **Verify Official Test Vectors**: Every algorithm change MUST pass its official standard test vectors (NIST FIPS 180-4, NIST FIPS 202, RFC 1321, RFC 7693, BLAKE3 reference). Run `npm run test:run`.
3. **Run Full Regression Suite**: Whenever modifying shared components (`RoundComputationView`, `MixingFunctionView`, `StateMatrixView`, `XorTableView`, `GenericStepView`), run the ENTIRE test suite (`npm run test:run`) to ensure zero regressions across all 13 algorithms.
4. **Use 64-Bit BigInt Arithmetic for 64-Bit Algorithms**: JavaScript `number` loses precision above $2^{53} - 1$. Always use `bigint` with `0xFFFFFFFFFFFFFFFFn` bitmask for SHA-512, SHA-384, BLAKE2b, and Keccak/SHA-3.
5. **Adhere to the Hardware Instrument Design System**:
   - Backgrounds: Obsidian substrate `#090c10`, `#0c1017`, `#0e131b`.
   - Borders: Hairline 1px borders with `#1f2937` or `#374151`.
   - Radii: Micro-geometry `rounded-[2px]` or `rounded-none`. Never use soft `rounded-lg` or `rounded-full` pills.
   - Typography: Monospace (`font-mono`) with `tabular-nums` forced on all numerals and formulas.
   - Chromatic 95/5 Discipline: 95% dark substrate, 5% phosphor signals (`#e5a93b` amber, `#38bdf8` cyan, `#34d399` emerald, `#c084fc` purple). Controlled text-shadow max 3px radius (e.g. `.phosphor-amber`).

### ❌ DO NOT:
1. **DO NOT Add Fallback Key Matching to Components**: Do not write `data.crcBefore || data.prevCrc` or `data.v || data.stateMatrix` in visualizers. Fix the plugin to emit the canonical key instead.
2. **DO NOT Assume SHA-256 Word Sizes Everywhere**: Never hardcode 32-bit shifts or 8-register counts in shared visualizers without supporting dynamic word sizes (32-bit vs 64-bit) and register counts (4 for MD5, 5 for SHA-1, 8 for SHA-2).
3. **DO NOT Expand Multi-Block Merkle-Trees in BLAKE3 (Yet)**: BLAKE3 is intentionally scoped to single-chunk/single-block inputs ($\le 64$ bytes). Multi-chunk Merkle tree visualization is an explicitly deferred feature. If input exceeds 64 bytes, report the single-block evaluation cleanly in the UI.
4. **DO NOT Add External Web Links ("REF" buttons)**: This application is a self-contained offline instrument. External URLs and outbound links in the DOM are forbidden.
5. **DO NOT Introduce AI-Slop Glows or Soft Shadows**: Avoid large blurred radial gradients, heavy drop shadows, or generic SaaS card elevations.

---

## 4. Step-by-Step Guide: Adding a New Algorithm

Follow this exact protocol when adding a 14th algorithm (e.g., RIPEMD-160, Whirlpool, SM3):

### Step 1: Create Algorithm Directory
Create `src/algorithms/<algo-name>/`:
- `constants.ts`: Initial state vectors, round constants, rotation amounts.
- `operations.ts`: Bitwise functions, barrel shifts, non-linear logic gates.
- `index.ts`: The plugin class implementing `AlgorithmPlugin`.

### Step 2: Implement `AlgorithmPlugin`
```typescript
import { AlgorithmPlugin, AlgorithmInfo, ComputationStep, ComputationResult } from '../types';

export const myAlgoInfo: AlgorithmInfo = {
  name: 'MyAlgo',
  family: 'MyFamily',
  digestSize: 256,
  blockSize: 512,
  description: '...',
  useCases: ['...'],
  security: 'secure',
  year: 2024,
  designers: ['...'],
};

export class MyAlgoPlugin implements AlgorithmPlugin {
  info = myAlgoInfo;

  compute(input: string): ComputationResult {
    const steps: ComputationStep[] = [];
    // 1. Input encoding step (visualizationType: 'binary-transform')
    // 2. Padding step (visualizationType: 'binary-transform')
    // 3. State initialization (visualizationType: matching engine)
    // 4. Compression / Permutation rounds emitting canonical payload
    // 5. Final digest assembly (visualizationType: 'final-digest')
    return { digest, steps };
  }
}

export default new MyAlgoPlugin();
```

### Step 3: Choose Visualization Type & Conform to Canonical Payload
- For Merkle-Damgård / ARX round steps $\rightarrow$ `visualizationType: 'round-computation'`
- For 5×5 sponge permutations $\rightarrow$ `visualizationType: 'state-matrix'`
- For 4×4 ARX mixing $\rightarrow$ `visualizationType: 'mixing-function'`
- For polynomial division $\rightarrow$ `visualizationType: 'xor-table'`

### Step 4: Register in Algorithm Registry
In `src/algorithms/registry.ts`:
1. Import `myAlgoPlugin` from `./<algo-name>`.
2. Add to the registration list.
3. Ensure its family is included in `familyOrder`.

### Step 5: Add Test Vectors
Create `tests/algorithms/<algo-name>.test.ts`:
- Test empty string `""` against official test vectors.
- Test short strings (`"abc"`, `"message digest"`).
- Test long / multi-block strings.
- Verify `steps.length > 0` and step metadata.

### Step 6: Verify Full Regression & Build
```bash
# Run Vitest test suite
npm run test:run

# Verify TypeScript build
npm run build
```

---

## 5. Testing & Verification Checklist

Before considering any task complete in this repository, verify all 4 criteria:

1. **Test Suite Passes**:
   ```bash
   npm run test:run
   ```
   Must output: `Test Files 14 passed (14), Tests 53 passed (53)`.
2. **Production Build Clean**:
   ```bash
   npm run build
   ```
   Must compile with 0 TypeScript errors and 0 Vite warnings.
3. **No Blank UI Fallbacks**:
   Inspect playback in browser (`http://localhost:5173`) to confirm every step has populated data.
4. **Zero Shared Component Regression**:
   Verify SHA-256, MD5, and SHA-512 render identically after any visualizer changes.
