/**
 * Algorithm Registry
 * Central registry for all algorithm plugins.
 */

import type { AlgorithmPlugin } from './types';

// Legacy MD Family
import md2Plugin from './md2';
import md4Plugin from './md4';
import md5Plugin from './md5';

// SHA-1
import sha1Plugin from './sha1';

// SHA-2 Family
import { sha224Plugin } from './sha224';
import { sha256Plugin } from './sha256';
import sha384Plugin from './sha384';
import sha512Plugin from './sha512';
import sha512_224Plugin from './sha512-224';
import sha512_256Plugin from './sha512-256';

// SHA-3 / Keccak Family
import sha3_224Plugin from './sha3-224';
import sha3_256Plugin from './sha3-256';
import sha3_384Plugin from './sha3-384';
import sha3_512Plugin from './sha3-512';
import keccakPlugin from './keccak';
import keccak224Plugin from './keccak-224';
import keccak384Plugin from './keccak-384';
import keccak512Plugin from './keccak-512';
import shake128Plugin from './shake128';
import shake256Plugin from './shake256';

// RIPEMD Family
import ripemd128Plugin from './ripemd128';
import ripemd160Plugin from './ripemd160';
import ripemd256Plugin from './ripemd256';
import ripemd320Plugin from './ripemd320';

// BLAKE Family
import blake2sPlugin from './blake2s';
import blake2bPlugin from './blake2b';
import blake3Plugin from './blake3';

// CRC & Checksum Family
import crc16Plugin from './crc16';
import crc32Plugin from './crc32';
import adler32Plugin from './adler32';

// Non-Cryptographic (XXHash)
import xxh32Plugin from './xxhash/xxh32';
import xxh64Plugin from './xxhash/xxh64';

// National Standards
import sm3Plugin from './sm3';

// Cipher-Based Hash
import whirlpoolPlugin from './whirlpool';

// Symmetric Ciphers (AES 128/192/256 ECB/CBC/CTR/GCM, DES, 3DES, ChaCha20-Poly1305)
import { aesPlugins } from './symmetric/aes';
import { desPlugins } from './symmetric/des';
import { chachaPlugins } from './symmetric/chacha20-poly1305';

// Asymmetric Cryptography (RSA, ECDSA, DH)
import { rsaPlugins } from './asymmetric/rsa';
import { ecdsaPlugins } from './asymmetric/ecdsa';
import { dhPlugins } from './asymmetric/dh';

// Post-Quantum Cryptography (ML-KEM, ML-DSA)
import { mlKemPlugins } from './pqc/ml-kem';
import { mlDsaPlugins } from './pqc/ml-dsa';

// Encoding Algorithms (Base64, Base32, Base16, Base58, URL, UTF-8, UTF-16)
import { encodingPlugins } from './encoding';

import type { AlgorithmCategory } from './types';

const registry = new Map<string, AlgorithmPlugin>();

function register(plugin: AlgorithmPlugin) {
  if (plugin && plugin.info && plugin.info.name) {
    registry.set(plugin.info.name, plugin);
  }
}

// Register all Hash algorithms (34 algorithms across 11 families)
[
  // Legacy MD
  md2Plugin,
  md4Plugin,
  md5Plugin,

  // SHA-1
  sha1Plugin,

  // SHA-2
  sha224Plugin,
  sha256Plugin,
  sha384Plugin,
  sha512Plugin,
  sha512_224Plugin,
  sha512_256Plugin,

  // SHA-3 & Keccak
  sha3_224Plugin,
  sha3_256Plugin,
  sha3_384Plugin,
  sha3_512Plugin,
  keccak224Plugin,
  keccakPlugin, // Keccak-256
  keccak384Plugin,
  keccak512Plugin,
  shake128Plugin,
  shake256Plugin,

  // RIPEMD
  ripemd128Plugin,
  ripemd160Plugin,
  ripemd256Plugin,
  ripemd320Plugin,

  // BLAKE
  blake2sPlugin,
  blake2bPlugin,
  blake3Plugin,

  // Checksums & CRC
  crc16Plugin,
  crc32Plugin,
  adler32Plugin,

  // Non-Cryptographic
  xxh32Plugin,
  xxh64Plugin,

  // National Standards
  sm3Plugin,

  // Cipher-Based
  whirlpoolPlugin,
].forEach(register);

// Register all Symmetric Ciphers (34 algorithms across 7 families)
aesPlugins.forEach(register);
desPlugins.forEach(register);
chachaPlugins.forEach(register);

// Register all Asymmetric Cryptography Plugins
rsaPlugins.forEach(register);
ecdsaPlugins.forEach(register);
dhPlugins.forEach(register);

// Register all Post-Quantum Cryptography Plugins
mlKemPlugins.forEach(register);
mlDsaPlugins.forEach(register);

// Register all Encoding Plugins (16 algorithms across 2 families)
encodingPlugins.forEach(register);

/** Get an algorithm plugin by name */
export function getAlgorithm(name: string): AlgorithmPlugin | undefined {
  return registry.get(name);
}

/** List all registered algorithm plugins, optionally filtered by category */
export function listAlgorithms(category?: AlgorithmCategory): AlgorithmPlugin[] {
  const all = Array.from(registry.values());
  if (!category) return all;
  return all.filter((p) => (p.info.category || 'hash') === category);
}

/** Get algorithms grouped by family for a specific category (default: 'hash') */
export function getAlgorithmsByFamily(category: AlgorithmCategory = 'hash'): Map<string, AlgorithmPlugin[]> {
  const families = new Map<string, AlgorithmPlugin[]>();
  
  const hashFamilyOrder = [
    'MD',
    'SHA-1',
    'SHA-2',
    'SHA-3',
    'RIPEMD',
    'BLAKE',
    'CRC',
    'Checksum',
    'XXHash',
    'Chinese National Standard',
    'Cipher-Based',
  ];

  const symmetricFamilyOrder = [
    'AES-128',
    'AES-192',
    'AES-256',
    'AES-GCM (AEAD)',
    'DES',
    '3DES',
    'ChaCha20-Poly1305',
  ];

  const asymmetricFamilyOrder = [
    'RSA Cryptosystem',
    'Elliptic Curve (ECDSA)',
    'Diffie-Hellman Key Exchange',
  ];

  const pqcFamilyOrder = [
    'ML-KEM (Kyber)',
    'ML-DSA (Dilithium)',
  ];

  const encodingFamilyOrder = [
    'Positional/Radix Encoding',
    'Text/Character Encoding',
    'Signal/Historical Encoding',
    'Structured Token',
  ];

  const toolsFamilyOrder = [
    'Key Derivation Functions (KDF)',
    'Wallet / Mnemonic Generation',
    'Entropy & CSPRNG Tools',
    'Format & Parsing Tools',
    'Data Compression',
  ];

  const familyOrder =
    category === 'symmetric'
      ? symmetricFamilyOrder
      : category === 'asymmetric'
      ? asymmetricFamilyOrder
      : category === 'pqc'
      ? pqcFamilyOrder
      : category === 'encoding'
      ? encodingFamilyOrder
      : category === 'tools'
      ? toolsFamilyOrder
      : hashFamilyOrder;

  for (const family of familyOrder) {
    families.set(family, []);
  }

  for (const plugin of registry.values()) {
    const pluginCategory = plugin.info.category || 'hash';
    if (pluginCategory !== category) continue;

    const family = plugin.info.family;
    if (!families.has(family)) {
      families.set(family, []);
    }
    families.get(family)!.push(plugin);
  }

  // Remove empty families
  for (const [family, plugins] of families) {
    if (plugins.length === 0) {
      families.delete(family);
    }
  }

  return families;
}

