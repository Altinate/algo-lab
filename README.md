# Cryptographic Logic Analyzer & Hash Visualizer

An interactive, bit-level cryptographic hash visualizer and logic analyzer built with React 19, TypeScript, and Tailwind CSS v4. Step through the internal rounds, registers, bitwise barrel shifters, and lookup tables of 13 standard cryptographic and checksum algorithms.

Inspired by [dmarman/sha256algorithm](https://github.com/dmarman/sha256algorithm), this project generalizes the concept into an extensible, high-density hardware instrument capable of visualizing Merkle-Damgård, Sponge, ARX/HAIFA, and Polynomial hash families.

<!-- SCREENSHOT_PLACEHOLDER: Add an application demo GIF or screenshot here (e.g. docs/preview.png) -->
> _**Screenshot / Demo GIF Placeholder** (Add application recording here)_

---

## 🎯 Why This Exists

Cryptographic hash algorithms are often treated as black boxes that magically turn arbitrary text into fixed-length hex digests. Understanding *how* they achieve collision resistance, avalanche effect, and one-way security requires inspecting what happens at each bitwise clock cycle:

- How message schedules ($W_t / M_g$) are expanded
- How non-linear logic gates ($\text{Ch}, \text{Maj}, F, G, H, I$) diffuse entropy
- How barrel shifters and modular addition disperse bit positions
- How sponge state matrices ($A[x,y]$) absorb and permute data across $\theta, \rho, \pi, \chi, \iota$ stages
- How CRC polynomial division XORs bitstreams against Galois field tables

This tool turns abstract cryptographic specifications (NIST FIPS 180-4, NIST FIPS 202, RFC 1321, RFC 7693) into an interactive, step-by-step logic analyzer.

---

## ✨ Features

- **13 Implemented Algorithms across 6 Families**:
  - **MD5**: 128-bit Message-Digest Algorithm (RFC 1321, 64 steps, $F/G/H/I$ gates)
  - **SHA-1**: 160-bit Secure Hash Algorithm 1 (FIPS 180-1, 80 rounds, $Ch/\text{Parity}/Maj$ gates)
  - **SHA-2 Family**:
    - `SHA-224` (32-bit words, 64 rounds)
    - `SHA-256` (32-bit words, 64 rounds, full ALU breakdown)
    - `SHA-384` (64-bit BigInt words, 80 rounds)
    - `SHA-512` (64-bit BigInt words, 80 rounds, 512-bit register bank)
  - **SHA-3 / Keccak Family**:
    - `SHA3-256` (1088-bit rate, 24-round Keccak-f[1600] permutation)
    - `SHA3-512` (576-bit rate, 24-round Keccak-f[1600] permutation)
    - `Keccak-256` (Ethereum standard, `0x01` domain separation)
  - **BLAKE Family**:
    - `BLAKE2s` (32-bit words, 10 rounds, $4 \times 4$ matrix, column/diagonal $G$-mixing)
    - `BLAKE2b` (64-bit words, 12 rounds, $4 \times 4$ matrix, column/diagonal $G$-mixing)
    - `BLAKE3` (32-bit words, 7 rounds, tree/chunk compression model)
  - **CRC Family**:
    - `CRC32` (Ethernet / ZIP polynomial `0xEDB88320`, 256-entry lookup ROM)

- **Dedicated Hardware Telemetry Visualizers**:
  - **3-Bus Logic Analyzer (`RoundComputationView`)**: Persistent 3-column instrument with Message Buffer ($W$), Hardware ALU + Dynamic Register Bank ($A..H$), and Firmware ROM Constants Table ($K$).
  - **$5 \times 5$ State Matrix Inspector (`StateMatrixView`)**: Fluid 1600-bit Keccak state matrix with 64-bit hex lane display, smart middle-truncation on compact viewports, and sponge phase tracking.
  - **$4 \times 4$ ARX Mixing Matrix (`MixingFunctionView`)**: 16-word work state with column and diagonal $G$-mixing operation cards and $\Sigma$ message permutation telemetry.
  - **Polynomial Stream Engine (`XorTableView`)**: 5-step FCS-32 register transformation pipeline with an active 256-entry polynomial ROM table.

- **Playback & Debugger Controls**:
  - Step Forward / Step Back / Play / Pause
  - Phase Jump (Pre-processing $\rightarrow$ Compression / Permutation $\rightarrow$ Finalization)
  - Scrub bar with interactive step counter
  - Variable playback speed slider (0.25× to 10×)
  - Monospace Hex / Binary Octet toggles

- **Collapsible Ergonomic UI**:
  - Accordion algorithm family groupings
  - Global full-sidebar collapse toggle for maximum analyzer workspace

---

## 🛠️ Tech Stack

- **Framework**: React 19
- **Language**: TypeScript 5.8
- **Bundler / Dev Server**: Vite 6
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest 3

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/<your-username>/hash-visualizer.git
cd hash-visualizer

# Install dependencies
npm install

# Start local development server
npm run dev
```
Open `http://localhost:5173` in your browser.

### Scripts
```bash
# Run development server
npm run dev

# Run full test suite with Vitest
npm run test:run

# Build production bundle
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```text
├── src/
│   ├── algorithms/              # Algorithm plugins & math engines
│   │   ├── md5/                 # MD5 (RFC 1321)
│   │   ├── sha1/                # SHA-1 (FIPS 180-1)
│   │   ├── sha256/              # SHA-224 & SHA-256 (FIPS 180-4)
│   │   ├── sha512/              # SHA-384 & SHA-512 (64-bit engine)
│   │   ├── keccak/              # Keccak-256, SHA3-256, SHA3-512 (FIPS 202)
│   │   ├── blake2/              # BLAKE2s & BLAKE2b (RFC 7693)
│   │   ├── blake3/              # BLAKE3 single-chunk engine
│   │   ├── crc32/               # CRC32 polynomial lookup
│   │   ├── registry.ts          # Central algorithm registry
│   │   ├── types.ts             # Plugin interfaces & step definitions
│   │   └── utils.ts             # Bitwise math & binary formatting helpers
│   ├── components/
│   │   ├── visualizations/      # Hardware telemetry renderers
│   │   │   ├── RoundComputationView.tsx # 3-bus analyzer (MD5, SHA-1, SHA-2)
│   │   │   ├── StateMatrixView.tsx      # 5x5 Keccak state matrix
│   │   │   ├── MixingFunctionView.tsx   # 4x4 BLAKE mixing matrix
│   │   │   ├── XorTableView.tsx         # CRC32 polynomial pipeline
│   │   │   └── ...
│   │   ├── layout/              # Header, sidebar, controls, status bar
│   │   └── controls/            # Playback buttons, speed slider, scrub bar
│   ├── hooks/                   # Step playback & state hooks
│   ├── App.tsx                  # Main workspace container
│   ├── App.css                  # Hardware instrument design tokens
│   └── main.tsx
├── tests/                       # Vitest official test vector suites
│   ├── algorithms/              # 13 algorithm test suites
│   └── registry.test.ts
├── AGENTS.md                    # AI agent guidelines & canonical contracts
└── README.md
```

*(For detailed architectural specifications and data contracts, see [AGENTS.md](AGENTS.md).)*

---

## 🧩 Adding a New Algorithm

All algorithms are implemented as modular plugins implementing the `AlgorithmPlugin` interface:

1. Create directory `src/algorithms/<name>/` with constants, operations, and `index.ts`.
2. Implement `compute(input: string): ComputationResult` emitting structured `ComputationStep[]`.
3. Choose the appropriate visualization type (`round-computation`, `state-matrix`, `mixing-function`, or `xor-table`) and emit its canonical data shape.
4. Register the plugin in `src/algorithms/registry.ts`.
5. Add official test vectors in `tests/algorithms/<name>.test.ts` and verify with `npm run test:run`.

See [AGENTS.md](AGENTS.md) for full step-by-step developer guidelines and canonical data shapes.

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE) *(confirm license before distribution)*.

---

## 🙏 Credits & Acknowledgments

- Inspired by [dmarman/sha256algorithm](https://github.com/dmarman/sha256algorithm) by Daniel Marman.
- Standard reference specifications: NIST FIPS 180-4 (SHA-1/SHA-2), NIST FIPS 202 (SHA-3/Keccak), RFC 1321 (MD5), RFC 7693 (BLAKE2), and the BLAKE3 team.
