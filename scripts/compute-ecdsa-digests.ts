import crypto from 'crypto';
import {
  ecdsaSecp256k1Sign,
  ecdsaSecp256k1Verify,
  ecdsaP256Sign,
  ecdsaP256Verify,
} from '../src/algorithms/asymmetric/ecdsa';
import { NIST_P256_TEST_KEY, SECP256K1_TEST_KEY } from '../src/algorithms/asymmetric/ecdsa/constants';

console.log('=== SECG SEC 2 & NIST FIPS 186-5 ECDSA DIRECT COMPUTATION ===');

const message = 'CryptoScope ECDSA Transaction Audit Payload';
const msgBuf = Buffer.from(message, 'utf8');

// 1. ECDSA-secp256k1 (Bitcoin/Ethereum Curve)
const secpSign = ecdsaSecp256k1Sign.compute(message);
console.log('ECDSA-secp256k1 Signature (r || s, 64 bytes):');
console.log(secpSign.digest);

const secpVerify = ecdsaSecp256k1Verify.compute(message, { signatureHex: secpSign.digest });
console.log('ECDSA-secp256k1 Verify Valid:', secpVerify.tagValid, '| Status:', secpVerify.digest);

// 2. ECDSA-P256 (NIST FIPS 186-5 Curve)
const p256Sign = ecdsaP256Sign.compute(message);
console.log('ECDSA-P256 Signature (r || s, 64 bytes):');
console.log(p256Sign.digest);

const p256Verify = ecdsaP256Verify.compute(message, { signatureHex: p256Sign.digest });
console.log('ECDSA-P256 Verify Valid:', p256Verify.tagValid, '| Status:', p256Verify.digest);

// 3. OpenSSL P-256 Cross-Verification using PEM keys
const p256DerKey = crypto.createPrivateKey({
  key: {
    kty: 'EC',
    crv: 'P-256',
    d: Buffer.from(NIST_P256_TEST_KEY.d.toString(16).padStart(64, '0'), 'hex').toString('base64url'),
    x: Buffer.from(NIST_P256_TEST_KEY.Qx.toString(16).padStart(64, '0'), 'hex').toString('base64url'),
    y: Buffer.from(NIST_P256_TEST_KEY.Qy.toString(16).padStart(64, '0'), 'hex').toString('base64url'),
  },
  format: 'jwk',
});
const p256DerPubKey = crypto.createPublicKey(p256DerKey);

const openSslSig = crypto.sign('sha256', msgBuf, { key: p256DerKey, dsaEncoding: 'ieee-p1363' });
console.log('OpenSSL P-256 Signature (IEEE-P1363):', openSslSig.toString('hex').slice(0, 32) + '...');

const csVerifyOpenSsl = ecdsaP256Verify.compute(message, { signatureHex: openSslSig.toString('hex') });
console.log('CryptoScope Verifies OpenSSL P-256 Signature:', csVerifyOpenSsl.tagValid);

const openSslVerifyCs = crypto.verify(
  'sha256',
  msgBuf,
  { key: p256DerPubKey, dsaEncoding: 'ieee-p1363' },
  Buffer.from(p256Sign.digest, 'hex')
);
console.log('OpenSSL Verifies CryptoScope P-256 Signature:', openSslVerifyCs);
