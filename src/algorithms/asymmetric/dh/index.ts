/**
 * Diffie-Hellman & ECDH Algorithm Plugins Registration (RFC 3526, NIST SP 800-56A)
 */

import type { AlgorithmPlugin, AlgorithmInfo } from '../../types';
import {
  DH_MODP_2048_PRIME,
  ECDH_SECP256K1_ALICE_PRIV,
  ECDH_SECP256K1_BOB_PRIV,
  ECDH_P256_ALICE_PRIV,
  ECDH_P256_BOB_PRIV,
} from './constants';
import { CURVE_SECP256K1, CURVE_NIST_P256 } from '../ecdsa/constants';
import { executeDhModp2048, executeEcdh } from './dh-engine';

export const diffieHellmanModp2048: AlgorithmPlugin = {
  info: {
    name: 'Diffie-Hellman-MODP-2048',
    family: 'Diffie-Hellman Key Exchange',
    category: 'asymmetric',
    digestSize: 2048,
    blockSize: 2048,
    description:
      'Classic Finite Field Diffie-Hellman Key Agreement using RFC 3526 2048-bit MODP Group 14 safe prime. Visualizes two-party (Alice & Bob) public key exchange and shared secret derivation ($S = g^{ab} \\bmod p$).',
    useCases: ['IKEv2 / IPsec VPN Key Exchange', 'TLS 1.2 DHE Cipher Suites', 'SSH-2 Key Exchange'],
    security: 'secure',
    year: 2003,
    designers: ['Whitfield Diffie', 'Martin Hellman', 'T. Kivinen (IETF)'],
    keySize: 2048,
    direction: 'encrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>) => {
    return executeDhModp2048(input, options as any);
  },
};

export const ecdhSecp256k1: AlgorithmPlugin = {
  info: {
    name: 'ECDH-secp256k1',
    family: 'Diffie-Hellman Key Exchange',
    category: 'asymmetric',
    digestSize: 256,
    blockSize: 256,
    description:
      'Elliptic Curve Diffie-Hellman (ECDH) on secp256k1 Koblitz curve (SECG SEC 1). Visualizes two-party scalar point multiplication and identical shared point derivation ($S = d_A \\cdot Q_B = d_B \\cdot Q_A$).',
    useCases: ['Web3 ECIES Encryption', 'Bitcoin Lightning Network Onion Routing', 'Nostr End-to-End Encryption'],
    security: 'secure',
    year: 2000,
    designers: ['SECG / Certicom'],
    keySize: 256,
    direction: 'encrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>) => {
    return executeEcdh(CURVE_SECP256K1, ECDH_SECP256K1_ALICE_PRIV, ECDH_SECP256K1_BOB_PRIV, input, options as any);
  },
};

export const ecdhP256: AlgorithmPlugin = {
  info: {
    name: 'ECDH-P256',
    family: 'Diffie-Hellman Key Exchange',
    category: 'asymmetric',
    digestSize: 256,
    blockSize: 256,
    description:
      'NIST FIPS SP 800-56A Rev 3 Elliptic Curve Diffie-Hellman (ECDH) on NIST P-256 (secp256r1). Visualizes two-party scalar point exchange and shared secret coordinate agreement.',
    useCases: ['TLS 1.3 Key Exchange (ECDHE-ECDSA/RSA)', 'FIDO2 / Passkeys Auth', 'Apple HomeKit End-to-End Encryption'],
    security: 'secure',
    year: 1999,
    designers: ['NSA', 'NIST'],
    keySize: 256,
    direction: 'encrypt',
  },
  compute: (input?: string, options?: Record<string, unknown>) => {
    return executeEcdh(CURVE_NIST_P256, ECDH_P256_ALICE_PRIV, ECDH_P256_BOB_PRIV, input, options as any);
  },
};

export const dhPlugins: AlgorithmPlugin[] = [
  diffieHellmanModp2048,
  ecdhSecp256k1,
  ecdhP256,
];
