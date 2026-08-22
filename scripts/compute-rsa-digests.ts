import {
  rsa2048Encrypt,
  rsa2048Decrypt,
  rsa2048Sign,
  rsa2048Verify,
  rsaPedagogicalEncrypt,
  rsaPedagogicalDecrypt,
} from '../src/algorithms/asymmetric/rsa';
import { hexToString } from '../src/algorithms/utils';

console.log('=== NIST SP 800-56B & PKCS#1 v2.2 RSA DIRECT COMPUTATION ===');

const message = 'CryptoScope Asymmetric Verification';

// 1. RSA-2048 Encryption
const enc = rsa2048Encrypt.compute(message);
console.log('RSA-2048 Encrypt (2048 bits):', enc.digest.slice(0, 64) + '...');

// 2. RSA-2048 Decryption (CRT)
const dec = rsa2048Decrypt.compute(enc.digest);
console.log('RSA-2048 Decrypt (Recovered Text):', hexToString(dec.digest));

// 3. RSA-2048 Signature
const sign = rsa2048Sign.compute(message);
console.log('RSA-2048 Sign (2048 bits):', sign.digest.slice(0, 64) + '...');

// 4. RSA-2048 Verification
const verify = rsa2048Verify.compute(message, { signatureHex: sign.digest });
console.log('RSA-2048 Verify (Valid):', verify.tagValid, '| Status:', verify.digest);

// 5. RSA-Pedagogical (32-bit: m=65, c=65^17 mod 3233 = 2790, m=2790^2753 mod 3233 = 65)
const pedEnc = rsaPedagogicalEncrypt.compute('65');
console.log('RSA-Pedagogical Encrypt (m=65 -> c):', parseInt(pedEnc.digest, 16));

const pedDec = rsaPedagogicalDecrypt.compute(pedEnc.digest);
console.log('RSA-Pedagogical Decrypt (c=2790 -> m):', parseInt(pedDec.digest, 16));
