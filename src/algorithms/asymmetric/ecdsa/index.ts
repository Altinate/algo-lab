/**
 * ECDSA Algorithm Plugins Registration (SECG SEC 2, NIST FIPS 186-5)
 */

import type { AlgorithmPlugin, AlgorithmInfo } from '../../types';
import { SECP256K1_TEST_KEY, NIST_P256_TEST_KEY, EccKeyPair } from './constants';
import { executeEcdsa, EcdsaOperation } from './ecdsa-engine';

function createEcdsaPlugin(
  curveKey: EccKeyPair,
  curveLabel: string,
  operation: EcdsaOperation,
): AlgorithmPlugin {
  const opLabel = operation === 'sign' ? 'Sign' : 'Verify';
  const name = `ECDSA-${curveLabel} (${opLabel})`;

  const info: AlgorithmInfo = {
    name,
    family: 'Elliptic Curve (ECDSA)',
    category: 'asymmetric',
    digestSize: 256,
    blockSize: 256,
    description: `Elliptic Curve Digital Signature Algorithm (${curveLabel}) ${opLabel} operation (NIST FIPS 186-5 / SECG SEC 2). Uses affine point addition and scalar point multiplication.`,
    useCases:
      curveLabel === 'secp256k1'
        ? ['Bitcoin & Ethereum Transaction Signatures', 'Cosmos & Polkadot Wallets']
        : ['TLS 1.3 Handshake ECDSA Auth', 'Apple Secure Enclave & FIDO2 WebAuthn'],
    security: 'secure',
    year: curveLabel === 'secp256k1' ? 2000 : 1999,
    designers: ['SECG / Certicom (secp256k1)', 'NSA / NIST (P-256)'],
    keySize: 256,
    direction: operation === 'sign' ? 'encrypt' : 'decrypt',
  };

  return {
    info,
    compute: (input: string, options?: Record<string, unknown>) => {
      return executeEcdsa(input, curveKey, operation, options as any);
    },
  };
}

export const ecdsaSecp256k1Sign = createEcdsaPlugin(SECP256K1_TEST_KEY, 'secp256k1', 'sign');
export const ecdsaSecp256k1Verify = createEcdsaPlugin(SECP256K1_TEST_KEY, 'secp256k1', 'verify');
export const ecdsaP256Sign = createEcdsaPlugin(NIST_P256_TEST_KEY, 'P256', 'sign');
export const ecdsaP256Verify = createEcdsaPlugin(NIST_P256_TEST_KEY, 'P256', 'verify');

export const ecdsaPlugins: AlgorithmPlugin[] = [
  ecdsaSecp256k1Sign,
  ecdsaSecp256k1Verify,
  ecdsaP256Sign,
  ecdsaP256Verify,
];
