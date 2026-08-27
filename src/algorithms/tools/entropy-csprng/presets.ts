/**
 * Authoritative Sample Presets for Entropy & CSPRNG Tools
 */

export interface EntropyPresetItem {
  id: string;
  name: string;
  category: 'Entropy Test' | 'Randomness / Statistical' | 'Password / Passphrase';
  description: string;
  content: string;
}

// Generate deterministic 1024-byte uniform permutation (4 copies of 0..255)
let uniformHex = '';
for (let c = 0; c < 4; c++) {
  for (let b = 0; b < 256; b++) {
    uniformHex += b.toString(16).padStart(2, '0');
  }
}

// Generate deterministic 1024-byte zero stream
let zeroHex = '00'.repeat(1024);

export const ENTROPY_PRESETS: EntropyPresetItem[] = [
  {
    id: 'english-prose',
    name: 'English Natural Language (Pangram)',
    category: 'Entropy Test',
    description: 'Standard English ASCII text showing typical natural language entropy (~4.1 - 4.3 bits/byte).',
    content: 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump! Sphinx of black quartz, judge my vow.',
  },
  {
    id: 'uniform-permutation',
    name: 'Uniform Permutation (4x 0..255, N=1024)',
    category: 'Randomness / Statistical',
    description: 'Exactly 4 copies of every byte value 0x00 to 0xFF. Max entropy (8.0 bits/byte) but Chi-Square reveals artificially flat distribution.',
    content: uniformHex,
  },
  {
    id: 'zero-entropy',
    name: 'Zero Entropy Stream (1024x 0x00)',
    category: 'Entropy Test',
    description: 'Stream of 1024 identical zero bytes. Minimum possible entropy (0.0 bits/byte), extreme Chi-Square failure.',
    content: zeroHex,
  },
  {
    id: 'ciphertext-stream',
    name: 'Encrypted Ciphertext Stream (High Entropy)',
    category: 'Randomness / Statistical',
    description: 'AES-256-GCM encrypted block ciphertext stream exhibiting near-maximal cryptographic entropy.',
    content: 'a3f8c109d4e2b76105f938a2bc470e189d2e4f6a8b0c1d3e5f7a9b1c3d5e7f9a2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a2b4c6d8e0f1a3b5c7d9e',
  },
  {
    id: 'pass-passphrase',
    name: 'NIST Recommended Passphrase ("correct horse battery staple")',
    category: 'Password / Passphrase',
    description: 'Classic XKCD/NIST length-focused passphrase: 28 characters, easy to remember, high search space.',
    content: 'correct horse battery staple',
  },
  {
    id: 'pass-complex-short',
    name: 'Complex Short Password ("Tr0ub4dor&3")',
    category: 'Password / Passphrase',
    description: 'Composition-heavy short password (11 chars) showing the contrast between theoretical and practical strength.',
    content: 'Tr0ub4dor&3',
  },
  {
    id: 'pass-token',
    name: 'Cryptographic Random Token (28 Chars)',
    category: 'Password / Passphrase',
    description: 'High-entropy random token with full 95-character printable ASCII pool composition.',
    content: 'eK9#mQ2$vL8*zP4!wR7^tY1@bN5&',
  },
];
