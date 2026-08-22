/**
 * ChaCha20 and Poly1305 Constants (IETF RFC 8439)
 */

// ChaCha20 Constants: "expand 32-byte k" in little-endian 32-bit words
export const CHACHA20_CONSTANTS: number[] = [
  0x61707865, // "expa"
  0x3320646e, // "nd 3"
  0x79622d32, // "2-by"
  0x6b206574, // "te k"
];

// Quarter-Round Rotations
export const QR_ROTATIONS = [16, 12, 8, 7] as const;

// Poly1305 Modulus: 2^130 - 5
export const POLY1305_PRIME: bigint = (1n << 130n) - 5n;
