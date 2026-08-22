/**
 * ChaCha20 and ChaCha20-Poly1305 Plugins Registration (IETF RFC 8439)
 */

import type { AlgorithmPlugin, AlgorithmInfo } from '../../types';
import {
  executeChaCha20Poly1305,
  executeChaCha20,
  ChaChaDirection,
} from './chacha20-poly1305';

function createChaCha20Poly1305Plugin(direction: ChaChaDirection): AlgorithmPlugin {
  const name = `ChaCha20-Poly1305 (${direction === 'encrypt' ? 'Encrypt' : 'Decrypt'})`;
  const info: AlgorithmInfo = {
    name,
    family: 'ChaCha20-Poly1305',
    category: 'symmetric',
    digestSize: 256,
    blockSize: 512, // 64 bytes = 512 bits
    description: `ChaCha20 stream cipher combined with Poly1305 authenticator in AEAD construction (IETF RFC 8439). Provides 256-bit security with authenticated encryption.`,
    useCases: ['TLS 1.3', 'WireGuard VPN', 'SSH', 'Mobile & IoT Cryptography'],
    security: 'secure',
    year: 2018,
    designers: ['Daniel J. Bernstein', 'Adam Langley'],
    keySize: 256,
    cipherMode: 'GCM', // AEAD
    direction,
    requiresIV: true,
    requiresAAD: true,
  };

  return {
    info,
    compute: (input: string, options?: Record<string, unknown>) => {
      return executeChaCha20Poly1305(input, direction, options as any);
    },
  };
}

function createChaCha20Plugin(direction: ChaChaDirection): AlgorithmPlugin {
  const name = `ChaCha20 (${direction === 'encrypt' ? 'Encrypt' : 'Decrypt'})`;
  const info: AlgorithmInfo = {
    name,
    family: 'ChaCha20-Poly1305',
    category: 'symmetric',
    digestSize: 256,
    blockSize: 512,
    description: `ChaCha20 20-round stream cipher (IETF RFC 8439 Section 2.4). ARX-based keystream generator operating on $4 \\times 4$ 32-bit state words.`,
    useCases: ['High-Performance Stream Encryption', 'Kernel Cryptography (Linux / BSD)'],
    security: 'secure',
    year: 2008,
    designers: ['Daniel J. Bernstein'],
    keySize: 256,
    cipherMode: 'CTR',
    direction,
    requiresIV: true,
  };

  return {
    info,
    compute: (input: string, options?: Record<string, unknown>) => {
      return executeChaCha20(input, direction, options as any);
    },
  };
}

export const chacha20Poly1305Encrypt = createChaCha20Poly1305Plugin('encrypt');
export const chacha20Poly1305Decrypt = createChaCha20Poly1305Plugin('decrypt');
export const chacha20Encrypt = createChaCha20Plugin('encrypt');
export const chacha20Decrypt = createChaCha20Plugin('decrypt');

export const chachaPlugins: AlgorithmPlugin[] = [
  chacha20Poly1305Encrypt,
  chacha20Poly1305Decrypt,
  chacha20Encrypt,
  chacha20Decrypt,
];
