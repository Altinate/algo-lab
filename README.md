# CryptoScope: Interactive Cryptographic Logic Analyzer

An interactive, bit-level cryptographic hash visualizer and logic analyzer built with React 19, TypeScript, and Tailwind CSS v4. Step through the internal rounds, registers, bitwise barrel shifters, and lookup tables of 34 standard cryptographic, checksum, and non-cryptographic hash algorithms.

Inspired by [dmarman/sha256algorithm](https://github.com/dmarman/sha256algorithm), CryptoScope generalizes the concept into an extensible, high-density hardware instrument capable of visualizing Merkle-Damgård, Sponge/Keccak, Dual-Line RIPEMD, ARX/HAIFA, Miyaguchi-Preneel AES-like, and Polynomial hash families.

<!-- SCREENSHOT_PLACEHOLDER: Add an application demo GIF or screenshot here (e.g. docs/preview.png) -->
> _**Screenshot / Demo GIF Placeholder** (Add application recording here)_

---

## 🎯 Why This Exists

Cryptographic hash algorithms are often treated as black boxes that magically turn arbitrary text into fixed-length hex digests. Understanding *how* they achieve collision resistance, avalanche effect, and one-way security requires inspecting what happens at each bitwise clock cycle:

- How message schedules ($W_t / M_g$) are expanded
- How non-linear logic gates ($\text{Ch}, \text{Maj}, F, G, H, I, P_0, P_1$) diffuse entropy
- How barrel shifters and modular addition disperse bit positions
- How sponge state matrices ($A[x,y]$) absorb and permute data across $\theta, \rho, \pi, \chi, \iota$ stages
- How dual-line parallel architectures (RIPEMD) execute simultaneous left/right compression paths
- How AES-like cipher constructions (Whirlpool) apply $8 \times 8$ byte substitutions ($S$-box), column rotations, and MDS MixRows matrix multiplication
- How CRC and checksum polynomial division XORs bitstreams against Galois field tables

This tool turns abstract cryptographic specifications (NIST FIPS 180-4, NIST FIPS 202, RFC 1319, RFC 1320, RFC 1321, RFC 7693, ISO/IEC 10118-3, GB/T 32918.2-2016) into an interactive, step-by-step logic analyzer.

---

## ✨ Supported Algorithms (34 Algorithms across 11 Families)

- **Legacy MD Family** (RFC 1319, RFC 1320, RFC 1321):
  - `MD2` (128-bit checksum byte substitution & 18-round permutation)
  - `MD4` (128-bit 3-round ARX compression)
  - `MD5` (128-bit 4-round ARX compression with $F/G/H/I$ gates)

- **SHA-1 Family** (NIST FIPS 180-1):
  - `SHA-1` (160-bit 5-register bank, 80 rounds with dynamic $Ch/\text{Parity}/Maj$ logic gates)

- **SHA-2 Family** (NIST FIPS 180-4):
  - `SHA-224` (32-bit words, 64 rounds)
  - `SHA-256` (32-bit words, 64 rounds, full hardware ALU pipeline breakdown)
  - `SHA-384` (64-bit BigInt words, 80 rounds)
  - `SHA-512` (64-bit BigInt words, 80 rounds, 512-bit register bank)
  - `SHA-512/224` (Truncated 224-bit output with FIPS 180-4 initial constants)
  - `SHA-512/256` (Truncated 256-bit output with FIPS 180-4 initial constants)

- **SHA-3 & Keccak Family** (NIST FIPS 202 / Keccak team):
  - `SHA3-224` (1152-bit rate, 24-round Keccak-f[1600] permutation)
  - `SHA3-256` (1088-bit rate, 24-round Keccak-f[1600] permutation)
  - `SHA3-384` (832-bit rate, 24-round Keccak-f[1600] permutation)
  - `SHA3-512` (576-bit rate, 24-round Keccak-f[1600] permutation)
  - `Keccak-224`, `Keccak-256`, `Keccak-384`, `Keccak-512` (Original Keccak padding with `0x01` domain separation)
  - `SHAKE128` (Extendable Output Function / XOF with interactive output length controls)
  - `SHAKE256` (Extendable Output Function / XOF with interactive output length controls)

- **RIPEMD Family** (ISO/IEC 10118-3 / Hans Dobbertin, Antoon Bosselaers, Bart Preneel):
  - `RIPEMD-128` (128-bit dual parallel left/right execution lines)
  - `RIPEMD-160` (160-bit dual parallel lines, standard Bitcoin Base58Check address generator)
  - `RIPEMD-256` (256-bit dual parallel lines with inter-round register exchange)
  - `RIPEMD-320` (320-bit dual parallel lines with inter-round register exchange)

- **BLAKE Family** (RFC 7693 / BLAKE3 team):
  - `BLAKE2s` (32-bit words, 10 rounds, $4 \times 4$ matrix, column/diagonal $G$-mixing)
  - `BLAKE2b` (64-bit words, 12 rounds, $4 \times 4$ matrix, column/diagonal $G$-mixing)
  - `BLAKE3` (32-bit words, 7 rounds, tree/chunk compression model)

- **CRC & Checksum Family**:
  - `CRC-16` (CRC-16-IBM / ANSI, 256-entry polynomial table `0xA001`)
  - `CRC32` (Ethernet / ZIP polynomial `0xEDB88320`, 256-entry lookup ROM)
  - `Adler-32` (RFC 1950 zlib / PNG checksum with dual 16-bit modulo 65521 accumulators)

- **Non-Cryptographic Fast Hashes (XXHash)** (Yann Collet):
  - `XXH32` (32-bit RAM-speed hash with 4 parallel accumulators and prime multiplication)
  - `XXH64` (64-bit BigInt high-throughput hash with 4 parallel accumulators and avalanche finalizer)

- **National Standards**:
  - `SM3` (Chinese National Standard GB/T 32918.2-2016 / ISO/IEC 10118-3:2018 with $P_0, P_1$ non-linear permutations)

- **Cipher-Based Hash Structures**:
  - `Whirlpool` (ISO/IEC 10118-3 / Barreto-Rijmen 512-bit Miyaguchi-Preneel hash with 10-round AES-like $8 \times 8$ byte state transformations)

---

## 🔬 Dedicated Hardware Telemetry Visualizers

- **3-Bus Logic Analyzer (`RoundComputationView`)**:
  - Persistent 3-column instrument with Message Buffer ($W$), Hardware ALU + Dynamic Register Bank ($A..H$ or Left/Right dual registers), and Firmware ROM Constants Table ($K$).
- **$5 \times 5$ / $8 \times 8$ State Matrix Inspector (`StateMatrixView`)**:
  - Fluid 1600-bit Keccak state matrix and 512-bit Whirlpool matrix with 64-bit hex lane display, lane diff highlights, and sponge phase tracking.
- **$4 \times 4$ ARX Mixing Matrix (`MixingFunctionView`)**:
  - 16-word work state with column and diagonal $G$-mixing operation cards and $\Sigma$ message permutation telemetry.
- **Polynomial Stream Engine (`XorTableView`)**:
  - 5-step FCS-32 and CRC-16 register transformation pipeline with an active 256-entry polynomial ROM table.

---

## 🎛️ Playback & Debugger Controls

- **Interactive Transport**: Step Forward, Step Back, Play, Pause, Scrub bar with active step counter.
- **Phase Navigation**: Jump directly between Preprocessing $\rightarrow$ Compression / Permutation $\rightarrow$ Finalization.
- **Variable Playback Speed**: Smooth slider from 0.25× to 10×.
- **Radix Switching**: Monospace Hex / Binary Octet toggles across all registers and tables.
- **XOF Dynamic Output Length Bar**: Real-time byte length selector for SHAKE128 & SHAKE256 (16B, 32B, 64B, 128B, 256B presets + custom numeric input).
- **Collapsible Sidebar**: Grouped accordion families with global full-sidebar toggle for maximum telemetry workspace.

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
git clone https://github.com/<your-username>/cryptoscope.git
cd cryptoscope

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

# Run full Vitest test suite (35 test files, 130 tests)
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
│   ├── algorithms/              # 34 Algorithm plugins & math engines
│   │   ├── md2/                 # MD2 (RFC 1319)
│   │   ├── md4/                 # MD4 (RFC 1320)
│   │   ├── md5/                 # MD5 (RFC 1321)
│   │   ├── sha1/                # SHA-1 (FIPS 180-1)
│   │   ├── sha256/              # SHA-224 & SHA-256 (FIPS 180-4)
│   │   ├── sha512/              # SHA-384, SHA-512, SHA-512/224, SHA-512/256
│   │   ├── keccak/              # Keccak (224/256/384/512), SHA-3, SHAKE (128/256)
│   │   ├── ripemd/              # RIPEMD-128/160/256/320 dual-line engine
│   │   ├── blake2/              # BLAKE2s & BLAKE2b (RFC 7693)
│   │   ├── blake3/              # BLAKE3 single-chunk engine
│   │   ├── crc16/               # CRC-16-IBM lookup engine
│   │   ├── crc32/               # CRC32 polynomial lookup
│   │   ├── adler32/             # Adler-32 dual 16-bit checksum
│   │   ├── xxhash/              # XXH32 & XXH64 fast non-crypto engines
│   │   ├── sm3/                 # SM3 Chinese national standard
│   │   ├── whirlpool/           # Whirlpool 512-bit Miyaguchi-Preneel cipher hash
│   │   ├── registry.ts          # Central algorithm registry & family grouping
│   │   ├── types.ts             # Plugin interfaces & canonical step definitions
│   │   └── utils.ts             # Bitwise math & binary formatting helpers
│   ├── components/
│   │   ├── visualizations/      # Hardware telemetry renderers
│   │   │   ├── RoundComputationView.tsx # 3-bus analyzer (MD, SHA-1, SHA-2, RIPEMD, SM3, XXH)
│   │   │   ├── StateMatrixView.tsx      # 5x5 Keccak & 8x8 Whirlpool matrix
│   │   │   ├── MixingFunctionView.tsx   # 4x4 BLAKE mixing matrix
│   │   │   ├── XorTableView.tsx         # CRC-16, CRC32, Adler-32 polynomial pipeline
│   │   │   └── ...
│   │   ├── layout/              # Header, sidebar, controls, status bar
│   │   └── controls/            # Playback buttons, speed slider, scrub bar
│   ├── hooks/                   # Step playback & state hooks
│   ├── App.tsx                  # Main workspace container
│   ├── App.css                  # Hardware instrument design tokens
│   └── main.tsx
├── tests/                       # Vitest official test vector suites (35 files, 130 tests)
├── AGENTS.md                    # Developer & AI Agent Reference Manual
└── README.md
```

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Credits & Acknowledgments

- Inspired by [dmarman/sha256algorithm](https://github.com/dmarman/sha256algorithm) by Daniel Marman.
- Standard reference specifications: NIST FIPS 180-4 (SHA-1/SHA-2), NIST FIPS 202 (SHA-3/Keccak), RFC 1319 (MD2), RFC 1320 (MD4), RFC 1321 (MD5), RFC 7693 (BLAKE2), ISO/IEC 10118-3 (RIPEMD, Whirlpool, SM3), GB/T 32918.2-2016 (SM3), and RFC 1950 (Adler-32).
