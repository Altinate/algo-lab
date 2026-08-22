/**
 * DES and 3DES Plugins Registration (NIST FIPS 46-3, NIST SP 800-67)
 */

import type { AlgorithmPlugin, AlgorithmInfo } from '../../types';
import { executeDes, execute3Des, DesMode, DesDirection } from './des-modes';

function createDesPlugin(mode: DesMode, direction: DesDirection): AlgorithmPlugin {
  const name = `DES-${mode} (${direction === 'encrypt' ? 'Encrypt' : 'Decrypt'})`;
  const info: AlgorithmInfo = {
    name,
    family: 'DES',
    category: 'symmetric',
    digestSize: 56, // 56 effective bits
    blockSize: 64,
    description: `Data Encryption Standard (DES) in ${mode} ${direction === 'encrypt' ? 'Encryption' : 'Decryption'} mode (NIST FIPS 46-3). Uses 16-round Feistel Network with 56-bit key.`,
    useCases: ['Legacy Banking (Deprecated)', 'Historical Cryptanalysis Study'],
    security: 'broken',
    securityNote: 'DES 56-bit key space can be broken via brute-force in hours (EFF Deep Crack / cloud compute). Use AES instead.',
    year: 1977,
    designers: ['IBM', 'NSA'],
    keySize: 64, // 64 bits (56 effective)
    cipherMode: mode,
    direction,
    requiresIV: mode === 'CBC',
  };

  return {
    info,
    compute: (input: string, options?: Record<string, unknown>) => {
      return executeDes(input, mode, direction, options as any);
    },
  };
}

function create3DesPlugin(mode: DesMode, direction: DesDirection): AlgorithmPlugin {
  const name = `3DES-${mode} (${direction === 'encrypt' ? 'Encrypt' : 'Decrypt'})`;
  const info: AlgorithmInfo = {
    name,
    family: '3DES',
    category: 'symmetric',
    digestSize: 168, // 168 effective bits (3 x 56)
    blockSize: 64,
    description: `Triple-DES (TDEA / 3DES) in EDE (Encrypt-Decrypt-Encrypt) ${mode} ${direction === 'encrypt' ? 'Encryption' : 'Decryption'} mode (NIST SP 800-67 Rev 2).`,
    useCases: ['EMV Payment Cards (Legacy)', 'Financial PIN Blocks (ANSI X9.52)', 'TLS 1.2 Legacy'],
    security: 'weakened',
    securityNote: '3DES 64-bit block size suffers from birthday collisions (Sweet32 attack). Deprecated by NIST after 2023.',
    year: 1999,
    designers: ['IBM', 'ANSI X9'],
    keySize: 192, // 3 x 64-bit keys
    cipherMode: mode,
    direction,
    requiresIV: mode === 'CBC',
  };

  return {
    info,
    compute: (input: string, options?: Record<string, unknown>) => {
      return execute3Des(input, mode, direction, options as any);
    },
  };
}

// Single DES
export const desEcbEncrypt = createDesPlugin('ECB', 'encrypt');
export const desEcbDecrypt = createDesPlugin('ECB', 'decrypt');
export const desCbcEncrypt = createDesPlugin('CBC', 'encrypt');
export const desCbcDecrypt = createDesPlugin('CBC', 'decrypt');

// Triple DES
export const des3EcbEncrypt = create3DesPlugin('ECB', 'encrypt');
export const des3EcbDecrypt = create3DesPlugin('ECB', 'decrypt');
export const des3CbcEncrypt = create3DesPlugin('CBC', 'encrypt');
export const des3CbcDecrypt = create3DesPlugin('CBC', 'decrypt');

export const desPlugins: AlgorithmPlugin[] = [
  desEcbEncrypt,
  desEcbDecrypt,
  desCbcEncrypt,
  desCbcDecrypt,
  des3EcbEncrypt,
  des3EcbDecrypt,
  des3CbcEncrypt,
  des3CbcDecrypt,
];
