/**
 * RSA Algorithm Plugins Registration (NIST SP 800-56B, PKCS#1 v2.2)
 */

import type { AlgorithmPlugin, AlgorithmInfo } from '../../types';
import { NIST_RSA_2048, PEDAGOGICAL_RSA_32 } from './constants';
import { executeRsa, RsaOperation } from './rsa-engine';

function createRsa2048Plugin(operation: RsaOperation): AlgorithmPlugin {
  const opLabel =
    operation === 'encrypt'
      ? 'Encrypt'
      : operation === 'decrypt'
      ? 'Decrypt'
      : operation === 'sign'
      ? 'Sign'
      : 'Verify';

  const name = `RSA-2048 (${opLabel})`;
  const info: AlgorithmInfo = {
    name,
    family: 'RSA Cryptosystem',
    category: 'asymmetric',
    digestSize: 2048,
    blockSize: 2048,
    description: `RSA-2048 asymmetric public-key cryptosystem ${opLabel} operation (NIST SP 800-56B Rev 2 / PKCS#1 v2.2). Features Chinese Remainder Theorem (CRT) acceleration.`,
    useCases: ['TLS 1.2 / 1.3 Key Exchange & Auth', 'HTTPS Certificates (X.509)', 'Digital Code Signing'],
    security: 'secure',
    year: 1977,
    designers: ['Ron Rivest', 'Adi Shamir', 'Leonard Adleman'],
    keySize: 2048,
    direction: operation === 'encrypt' || operation === 'sign' ? 'encrypt' : 'decrypt',
  };

  return {
    info,
    compute: (input: string, options?: Record<string, unknown>) => {
      return executeRsa(input, NIST_RSA_2048, operation, options as any);
    },
  };
}

function createRsaPedagogicalPlugin(operation: RsaOperation): AlgorithmPlugin {
  const opLabel =
    operation === 'encrypt'
      ? 'Encrypt'
      : operation === 'decrypt'
      ? 'Decrypt'
      : operation === 'sign'
      ? 'Sign'
      : 'Verify';

  const name = `RSA-Pedagogical (${opLabel})`;
  const info: AlgorithmInfo = {
    name,
    family: 'RSA Cryptosystem',
    category: 'asymmetric',
    digestSize: 32,
    blockSize: 32,
    description: `Small-parameter RSA (p=61, q=53, N=3233, e=17, d=2753) with unrolled Square-and-Multiply bit ladders and Extended Euclidean division stepping for education.`,
    useCases: ['Cryptographic Teaching', 'Bit-by-Bit ModExp Inspection'],
    security: 'broken',
    securityNote: 'Toy 32-bit parameters are strictly educational. For secure applications, use RSA-2048 or higher.',
    year: 1977,
    designers: ['Rivest', 'Shamir', 'Adleman'],
    keySize: 32,
    direction: operation === 'encrypt' || operation === 'sign' ? 'encrypt' : 'decrypt',
  };

  return {
    info,
    compute: (input: string, options?: Record<string, unknown>) => {
      return executeRsa(input, PEDAGOGICAL_RSA_32, operation, options as any);
    },
  };
}

// RSA-2048 Plugins
export const rsa2048Encrypt = createRsa2048Plugin('encrypt');
export const rsa2048Decrypt = createRsa2048Plugin('decrypt');
export const rsa2048Sign = createRsa2048Plugin('sign');
export const rsa2048Verify = createRsa2048Plugin('verify');

// RSA-Pedagogical Plugins
export const rsaPedagogicalEncrypt = createRsaPedagogicalPlugin('encrypt');
export const rsaPedagogicalDecrypt = createRsaPedagogicalPlugin('decrypt');
export const rsaPedagogicalSign = createRsaPedagogicalPlugin('sign');
export const rsaPedagogicalVerify = createRsaPedagogicalPlugin('verify');

export const rsaPlugins: AlgorithmPlugin[] = [
  rsa2048Encrypt,
  rsa2048Decrypt,
  rsa2048Sign,
  rsa2048Verify,
  rsaPedagogicalEncrypt,
  rsaPedagogicalDecrypt,
  rsaPedagogicalSign,
  rsaPedagogicalVerify,
];
