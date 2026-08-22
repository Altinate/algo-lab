/**
 * AES Plugins Registration (NIST FIPS 197, NIST SP 800-38A, NIST SP 800-38D)
 * Registers individual Encrypt and Decrypt plugins for AES-128, AES-192, AES-256 in ECB, CBC, CTR, and GCM modes.
 */

import type { AlgorithmPlugin, AlgorithmInfo } from '../../types';
import { executeAes, AesMode, AesDirection } from './aes-modes';
import type { AesKeySize } from './aes-core';

function createAesPlugin(
  keySize: AesKeySize,
  mode: AesMode,
  direction: AesDirection,
): AlgorithmPlugin {
  const isGcm = mode === 'GCM';
  const name = `AES-${keySize}-${mode} (${direction === 'encrypt' ? 'Encrypt' : 'Decrypt'})`;
  const family = isGcm ? 'AES-GCM (AEAD)' : `AES-${keySize}`;

  const info: AlgorithmInfo = {
    name,
    family,
    category: 'symmetric',
    digestSize: keySize,
    blockSize: 128,
    description: `Advanced Encryption Standard (AES) with ${keySize}-bit key in ${mode} (${
      mode === 'ECB'
        ? 'Electronic Codebook'
        : mode === 'CBC'
        ? 'Cipher Block Chaining'
        : mode === 'CTR'
        ? 'Counter Mode'
        : 'Galois/Counter Mode Authenticated Encryption'
    }) ${direction === 'encrypt' ? 'Encryption' : 'Decryption'} mode (NIST ${
      isGcm ? 'SP 800-38D' : mode === 'ECB' ? 'FIPS 197 / SP 800-38A' : 'SP 800-38A'
    }).`,
    useCases: [
      isGcm ? 'TLS 1.3' : 'Disk Encryption',
      'IPsec VPN',
      'WPA3 WiFi',
      'Secure Storage',
    ],
    security: mode === 'ECB' ? 'weakened' : 'secure',
    securityNote:
      mode === 'ECB'
        ? 'ECB mode preserves plaintext patterns (e.g. ECB Penguin). Use CBC, CTR, or GCM in real-world protocols.'
        : undefined,
    year: isGcm ? 2007 : 2001,
    designers: ['Vincent Rijmen', 'Joan Daemen'],
    keySize,
    cipherMode: mode,
    direction,
    requiresIV: mode !== 'ECB',
    requiresAAD: isGcm,
  };

  return {
    info,
    compute: (input: string, options?: Record<string, unknown>) => {
      return executeAes(input, keySize, mode, direction, options as any);
    },
  };
}

// AES-128
export const aes128EcbEncrypt = createAesPlugin(128, 'ECB', 'encrypt');
export const aes128EcbDecrypt = createAesPlugin(128, 'ECB', 'decrypt');
export const aes128CbcEncrypt = createAesPlugin(128, 'CBC', 'encrypt');
export const aes128CbcDecrypt = createAesPlugin(128, 'CBC', 'decrypt');
export const aes128CtrEncrypt = createAesPlugin(128, 'CTR', 'encrypt');
export const aes128CtrDecrypt = createAesPlugin(128, 'CTR', 'decrypt');

// AES-192
export const aes192EcbEncrypt = createAesPlugin(192, 'ECB', 'encrypt');
export const aes192EcbDecrypt = createAesPlugin(192, 'ECB', 'decrypt');
export const aes192CbcEncrypt = createAesPlugin(192, 'CBC', 'encrypt');
export const aes192CbcDecrypt = createAesPlugin(192, 'CBC', 'decrypt');
export const aes192CtrEncrypt = createAesPlugin(192, 'CTR', 'encrypt');
export const aes192CtrDecrypt = createAesPlugin(192, 'CTR', 'decrypt');

// AES-256
export const aes256EcbEncrypt = createAesPlugin(256, 'ECB', 'encrypt');
export const aes256EcbDecrypt = createAesPlugin(256, 'ECB', 'decrypt');
export const aes256CbcEncrypt = createAesPlugin(256, 'CBC', 'encrypt');
export const aes256CbcDecrypt = createAesPlugin(256, 'CBC', 'decrypt');
export const aes256CtrEncrypt = createAesPlugin(256, 'CTR', 'encrypt');
export const aes256CtrDecrypt = createAesPlugin(256, 'CTR', 'decrypt');

// AES-GCM (AEAD)
export const aes128GcmEncrypt = createAesPlugin(128, 'GCM', 'encrypt');
export const aes128GcmDecrypt = createAesPlugin(128, 'GCM', 'decrypt');
export const aes256GcmEncrypt = createAesPlugin(256, 'GCM', 'encrypt');
export const aes256GcmDecrypt = createAesPlugin(256, 'GCM', 'decrypt');

export const aesPlugins: AlgorithmPlugin[] = [
  aes128EcbEncrypt,
  aes128EcbDecrypt,
  aes128CbcEncrypt,
  aes128CbcDecrypt,
  aes128CtrEncrypt,
  aes128CtrDecrypt,

  aes192EcbEncrypt,
  aes192EcbDecrypt,
  aes192CbcEncrypt,
  aes192CbcDecrypt,
  aes192CtrEncrypt,
  aes192CtrDecrypt,

  aes256EcbEncrypt,
  aes256EcbDecrypt,
  aes256CbcEncrypt,
  aes256CbcDecrypt,
  aes256CtrEncrypt,
  aes256CtrDecrypt,

  aes128GcmEncrypt,
  aes128GcmDecrypt,
  aes256GcmEncrypt,
  aes256GcmDecrypt,
];
