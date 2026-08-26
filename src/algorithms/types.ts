/** Represents a single visualizable step in an algorithm's computation */
export interface ComputationStep {
  /** Unique step ID within this computation (e.g., "padding", "round-0", "round-63") */
  id: string;

  /** Human-readable step title (e.g., "Message Padding", "Round 12 Compression") */
  title: string;

  /** The phase/group this step belongs to (e.g., "Preprocessing", "Compression") */
  phase: string;

  /** Plain-language explanation of what this step does */
  description: string;

  /**
   * The intermediate state to visualize. Structure varies per algorithm.
   */
  data: Record<string, unknown>;

  /**
   * Rendering hint for the UI.
   * Tells StepVisualizer which layout/component to use.
   */
  visualizationType: VisualizationType;
}

export type AlgorithmCategory = 'hash' | 'symmetric' | 'asymmetric' | 'pqc' | 'encoding' | 'tools';

export type VisualizationType =
  | 'binary-transform'    // Show binary/hex before→after (padding, chunking)
  | 'round-computation'   // Show working variables + round function
  | 'state-matrix'        // Show state as a matrix (SHA-3 / Keccak, Whirlpool)
  | 'aes-state-matrix'    // Show AES 4x4 State matrix (SubBytes, ShiftRows, MixColumns, AddRoundKey)
  | 'feistel-ladder'      // Show 2-branch Feistel ladder (DES, 3DES)
  | 'asymmetric-modexp'   // Show BigInt ModExp & CRT decomposition (RSA)
  | 'ecc-point'           // Show Elliptic Curve point arithmetic & scalar multiplication (ECDSA)
  | 'key-exchange'        // Show 2-party key agreement protocol swimlane (DH, ECDH)
  | 'lattice-polynomial'  // Show Post-Quantum lattice polynomial spectrum & NTT butterflies (ML-KEM, ML-DSA)
  | 'xor-table'           // Show XOR/polynomial operations (CRC32, Adler32)
  | 'merkle-tree'         // Show tree structure (BLAKE3)
  | 'mixing-function'     // Show G mixing rounds (BLAKE2, BLAKE3, ChaCha20)
  | 'asn1-structure'      // Show ASN.1 DER hierarchical tree, X.509 certs, and JWK formatting
  | 'final-digest'        // Show final concatenation → hex output
  | 'generic';            // Fallback: render data as labeled key-value pairs

/** Metadata about an algorithm displayed in the UI */
export interface AlgorithmInfo {
  /** Display name (e.g., "SHA-256", "AES-128-CBC (Encrypt)") */
  name: string;

  /** Algorithm family for grouping in selector (e.g., "SHA-2", "AES-128", "AES-GCM (AEAD)") */
  family: string;

  /** Domain category (defaults to 'hash') */
  category?: AlgorithmCategory;

  /** Output digest size or block size in bits */
  digestSize: number;

  /** Internal block size in bits */
  blockSize: number;

  /** Brief description of the algorithm */
  description: string;

  /** Known use cases */
  useCases: string[];

  /** Security status */
  security: 'secure' | 'weakened' | 'broken' | 'non-cryptographic';

  /** Optional warning about known weaknesses */
  securityNote?: string;

  /** Year of publication / standard */
  year: number;

  /** Designer(s) */
  designers: string[];

  /** Whether the algorithm is an extendable-output function with variable length (e.g. SHAKE) */
  isXOF?: boolean;

  /** Symmetric Cipher specific metadata */
  keySize?: number; // in bits (128, 192, 256)
  cipherMode?: 'ECB' | 'CBC' | 'CTR' | 'GCM';
  direction?: 'encrypt' | 'decrypt';
  requiresIV?: boolean;
  requiresAAD?: boolean;
}

/** The interface every algorithm plugin must implement */
export interface AlgorithmPlugin {
  /** Algorithm metadata */
  info: AlgorithmInfo;

  /**
   * Compute the hash/cipher of the input and return ALL intermediate steps.
   *
   * @param input - The raw input string (UTF-8 or hex)
   * @param options - Optional computation options (XOF length, key, iv, aad, tag)
   * @returns An object with the final hex digest/ciphertext, optional auth tag, and ordered step array
   */
  compute(input: string, options?: Record<string, unknown>): ComputationResult;
}

export interface ComputationResult {
  /** Final hash or ciphertext/recovered-plaintext as hex string */
  digest: string;
  /** Optional AEAD authentication tag (e.g. GCM, Poly1305) */
  tagHex?: string;
  /** Optional AEAD tag verification flag */
  tagValid?: boolean;
  /** Ordered array of all visualization steps */
  steps: ComputationStep[];
}

