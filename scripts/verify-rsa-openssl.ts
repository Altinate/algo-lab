import crypto from 'crypto';
import { NIST_RSA_2048 } from '../src/algorithms/asymmetric/rsa/constants';
import { rsa2048Sign, rsa2048Verify, rsa2048Decrypt, rsa2048Encrypt } from '../src/algorithms/asymmetric/rsa';
import { hexToString } from '../src/algorithms/utils';

console.log('=== NIST CAVP / PKCS#1 v2.2 & OPENSSL INDEPENDENT CROSS-VERIFICATION ===');

const message = 'CryptoScope Secure Audit Document';
const msgBuf = Buffer.from(message, 'utf8');

const jwk = {
  kty: 'RSA',
  n: Buffer.from(NIST_RSA_2048.n.toString(16).padStart(512, '0'), 'hex').toString('base64url'),
  e: Buffer.from('010001', 'hex').toString('base64url'),
  d: Buffer.from(NIST_RSA_2048.d.toString(16).padStart(512, '0'), 'hex').toString('base64url'),
  p: Buffer.from(NIST_RSA_2048.p.toString(16).padStart(256, '0'), 'hex').toString('base64url'),
  q: Buffer.from(NIST_RSA_2048.q.toString(16).padStart(256, '0'), 'hex').toString('base64url'),
  dp: Buffer.from(NIST_RSA_2048.dP.toString(16).padStart(256, '0'), 'hex').toString('base64url'),
  dq: Buffer.from(NIST_RSA_2048.dQ.toString(16).padStart(256, '0'), 'hex').toString('base64url'),
  qi: Buffer.from(NIST_RSA_2048.qInv.toString(16).padStart(256, '0'), 'hex').toString('base64url'),
};

const nodePrivKey = crypto.createPrivateKey({ key: jwk as any, format: 'jwk' });
const nodePubKey = crypto.createPublicKey({ key: jwk as any, format: 'jwk' });

// 1. Independent Signature Comparison
const openSslSig = crypto.sign('sha256', msgBuf, {
  key: nodePrivKey,
  padding: crypto.constants.RSA_PKCS1_PADDING,
});
const cryptoScopeSig = rsa2048Sign.compute(message);

console.log('OpenSSL SHA-256 PKCS#1 v1.5 Signature (2048 bits):');
console.log(openSslSig.toString('hex'));
console.log('CryptoScope Generated Signature (2048 bits):');
console.log(cryptoScopeSig.digest);
console.log('Bit-for-Bit Deterministic Signature Match:', openSslSig.toString('hex') === cryptoScopeSig.digest);

// 2. OpenSSL -> CryptoScope Cross-Verification
const csVerifyNode = rsa2048Verify.compute(message, { signatureHex: openSslSig.toString('hex') });
console.log('CryptoScope Verifies OpenSSL Signature:', csVerifyNode.tagValid, '| Status:', csVerifyNode.digest);

// 3. CryptoScope -> OpenSSL Cross-Verification
const nodeVerifyCs = crypto.verify(
  'sha256',
  msgBuf,
  { key: nodePubKey, padding: crypto.constants.RSA_PKCS1_PADDING },
  Buffer.from(cryptoScopeSig.digest, 'hex')
);
console.log('OpenSSL Verifies CryptoScope Signature:', nodeVerifyCs);

// 4. OpenSSL PKCS#1 v1.5 Encryption -> CryptoScope CRT Decryption
const openSslCipher = crypto.publicEncrypt({ key: nodePubKey, padding: crypto.constants.RSA_PKCS1_PADDING }, msgBuf);
const csDecrypted = rsa2048Decrypt.compute(openSslCipher.toString('hex'));
console.log('CryptoScope CRT Decrypted OpenSSL Ciphertext:', hexToString(csDecrypted.digest));
console.log('Plaintext Authentically Recovered:', hexToString(csDecrypted.digest) === message);
