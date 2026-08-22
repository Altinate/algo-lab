/**
 * BIP-39 (Bitcoin Improvement Proposal 39)
 * Mnemonic Code for Generating Deterministic Keys & Master Seeds
 */

import type { AlgorithmPlugin, ComputationResult } from '../../types';
import { computeBip39 } from './engine';

export * from './engine';
export * from './wordlist';

export function runBip39(input: string, options?: Record<string, unknown>): ComputationResult {
  let entropyInput: string | undefined = undefined;
  let passphrase = (options?.passphrase as string) || '';
  let wordCount = typeof options?.wordCount === 'number' ? options.wordCount : 12;

  const trimmed = input.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.entropy !== undefined) entropyInput = parsed.entropy;
      if (parsed.passphrase !== undefined) passphrase = parsed.passphrase;
      if (parsed.wordCount !== undefined) wordCount = Number(parsed.wordCount);
    } catch {}
  } else if (/^(0x)?[0-9a-fA-F]{32,64}$/.test(trimmed)) {
    entropyInput = trimmed;
  }

  return computeBip39(entropyInput, passphrase, wordCount);
}

export const bip39Plugin: AlgorithmPlugin = {
  info: {
    name: 'BIP-39',
    family: 'Wallet / Mnemonic Generation',
    category: 'tools',
    digestSize: 512,
    blockSize: 1024,
    description: 'Bitcoin Improvement Proposal 39: Generates human-readable mnemonic recovery phrases from cryptographic entropy and derives 512-bit binary master seeds via PBKDF2-HMAC-SHA512.',
    useCases: [
      'Cryptocurrency HD wallet recovery (Bitcoin, Ethereum, Solana)',
      'Hardware wallet backup phrases (Ledger, Trezor, Keystone)',
      'BIP-32 / BIP-44 hierarchical deterministic root key generation',
    ],
    security: 'secure',
    year: 2013,
    designers: ['Marek Palatinus (Slush)', 'Pavol Rusnak (Stick)', 'Aaron Voisine', 'Sean Bowe'],
  },
  compute(input: string, options?: Record<string, unknown>): ComputationResult {
    return runBip39(input, options);
  },
};
