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

export type VisualizationType =
  | 'binary-transform'    // Show binary/hex before→after (padding, chunking)
  | 'round-computation'   // Show working variables + round function
  | 'state-matrix'        // Show state as a matrix (SHA-3 / Keccak)
  | 'xor-table'           // Show XOR/polynomial operations (CRC32, Adler32)
  | 'merkle-tree'         // Show tree structure (BLAKE3)
  | 'mixing-function'     // Show G mixing rounds (BLAKE2, BLAKE3)
  | 'final-digest'        // Show final concatenation → hex output
  | 'generic';            // Fallback: render data as labeled key-value pairs

/** Metadata about an algorithm displayed in the UI */
export interface AlgorithmInfo {
  /** Display name (e.g., "SHA-256") */
  name: string;

  /** Algorithm family for grouping in selector (e.g., "SHA-2", "SHA-3", "BLAKE", "RIPEMD", "Checksum", "Non-Crypto", "Legacy") */
  family: string;

  /** Output digest size in bits */
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

  /** Year of publication */
  year: number;

  /** Designer(s) */
  designers: string[];

  /** Whether the algorithm is an extendable-output function with variable length (e.g. SHAKE) */
  isXOF?: boolean;
}

/** The interface every algorithm plugin must implement */
export interface AlgorithmPlugin {
  /** Algorithm metadata */
  info: AlgorithmInfo;

  /**
   * Compute the hash of the input and return ALL intermediate steps.
   *
   * @param input - The raw input string (UTF-8)
   * @param options - Optional computation options (e.g., variable output length for XOFs)
   * @returns An object with the final hex digest and ordered step array
   */
  compute(input: string, options?: Record<string, unknown>): ComputationResult;
}

export interface ComputationResult {
  /** Final hash as hex string */
  digest: string;
  /** Ordered array of all visualization steps */
  steps: ComputationStep[];
}
