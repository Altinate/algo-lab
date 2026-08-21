/**
 * Algorithm Registry
 *
 * Central registry for all algorithm plugins. To add a new algorithm:
 * 1. Create the plugin in src/algorithms/<name>/index.ts
 * 2. Import and add it to the list below
 */

import type { AlgorithmPlugin } from './types';

// Built-in algorithm plugins
import md5Plugin from './md5';
import sha1Plugin from './sha1';
import { sha224Plugin } from './sha224';
import { sha256Plugin } from './sha256';
import sha384Plugin from './sha384';
import sha512Plugin from './sha512';
import sha3_256Plugin from './sha3-256';
import sha3_512Plugin from './sha3-512';
import keccakPlugin from './keccak';
import blake2bPlugin from './blake2b';
import blake2sPlugin from './blake2s';
import blake3Plugin from './blake3';
import crc32Plugin from './crc32';

const registry = new Map<string, AlgorithmPlugin>();

function register(plugin: AlgorithmPlugin) {
  if (plugin && plugin.info && plugin.info.name) {
    registry.set(plugin.info.name, plugin);
  }
}

// Register all 13 algorithms
[
  md5Plugin,
  sha1Plugin,
  sha224Plugin,
  sha256Plugin,
  sha384Plugin,
  sha512Plugin,
  sha3_256Plugin,
  sha3_512Plugin,
  keccakPlugin,
  blake2bPlugin,
  blake2sPlugin,
  blake3Plugin,
  crc32Plugin,
].forEach(register);

/** Get an algorithm plugin by name */
export function getAlgorithm(name: string): AlgorithmPlugin | undefined {
  return registry.get(name);
}

/** List all registered algorithm plugins */
export function listAlgorithms(): AlgorithmPlugin[] {
  return Array.from(registry.values());
}

/** Get algorithms grouped by family */
export function getAlgorithmsByFamily(): Map<string, AlgorithmPlugin[]> {
  const families = new Map<string, AlgorithmPlugin[]>();
  const familyOrder = ['MD5', 'SHA-1', 'SHA-2', 'SHA-3', 'BLAKE', 'CRC'];

  for (const family of familyOrder) {
    families.set(family, []);
  }

  for (const plugin of registry.values()) {
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
