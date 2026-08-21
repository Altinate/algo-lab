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
   * Examples:
   *   - SHA-256 padding step: { binary: "01101000...", paddedBinary: "01101000...1...0...length" }
   *   - SHA-256 round step: { a,b,c,d,e,f,g,h values, T1, T2, W[i], K[i] }
   *   - MD5 round step: { A,B,C,D values, F, g, round function result }
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
  | 'xor-table'           // Show XOR/polynomial operations (CRC32)
  | 'merkle-tree'         // Show tree structure (BLAKE3)
  | 'mixing-function'     // Show G mixing rounds (BLAKE2)
  | 'final-digest'        // Show final concatenation → hex output
  | 'generic';            // Fallback: render data as labeled key-value pairs

/** Metadata about an algorithm displayed in the UI */
export interface AlgorithmInfo {
  /** Display name (e.g., "SHA-256") */
  name: string;

  /** Algorithm family for grouping in selector (e.g., "SHA-2", "SHA-3", "BLAKE") */
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
}

/** The interface every algorithm plugin must implement */
export interface AlgorithmPlugin {
  /** Algorithm metadata */
  info: AlgorithmInfo;

  /**
   * Compute the hash of the input and return ALL intermediate steps.
   * This is NOT a streaming API — it computes everything upfront
   * and returns the full step list for playback.
   *
   * @param input - The raw input string (UTF-8)
   * @returns An object with the final hex digest and ordered step array
   */
  compute(input: string): ComputationResult;
}

export interface ComputationResult {
  /** Final hash as hex string */
  digest: string;
  /** Ordered array of all visualization steps */
  steps: ComputationStep[];
}
