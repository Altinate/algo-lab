import crypto from 'crypto';
import {
  diffieHellmanModp2048,
  ecdhSecp256k1,
  ecdhP256,
} from '../src/algorithms/asymmetric/dh';
import {
  DH_MODP_2048_PRIME,
  DH_ALICE_PRIVATE,
  DH_BOB_PRIVATE,
  ECDH_SECP256K1_ALICE_PRIV,
  ECDH_SECP256K1_BOB_PRIV,
  ECDH_P256_ALICE_PRIV,
  ECDH_P256_BOB_PRIV,
} from '../src/algorithms/asymmetric/dh/constants';

console.log('=== RFC 3526 & NIST SP 800-56A KEY EXCHANGE DIRECT COMPUTATION ===');

// 1. Classic Finite Field DH (RFC 3526 MODP Group 14 - 2048-bit)
const dhRes = diffieHellmanModp2048.compute();
console.log('DH-MODP-2048 Shared Secret (2048 bits):');
console.log(dhRes.digest.slice(0, 64) + '...');
console.log('DH-MODP-2048 Match Verified (Sa === Sb):', dhRes.tagValid);

// OpenSSL MODP Group 14 Cross-Verification
const primeBuf = Buffer.from(DH_MODP_2048_PRIME.toString(16).padStart(512, '0'), 'hex');
const genBuf = Buffer.from('02', 'hex');
const dhAlice = crypto.createDiffieHellman(primeBuf, genBuf);
const dhBob = crypto.createDiffieHellman(primeBuf, genBuf);
dhAlice.setPrivateKey(Buffer.from(DH_ALICE_PRIVATE.toString(16).padStart(512, '0'), 'hex'));
dhBob.setPrivateKey(Buffer.from(DH_BOB_PRIVATE.toString(16).padStart(512, '0'), 'hex'));
dhAlice.generateKeys();
dhBob.generateKeys();

const openSslDhSecret = dhAlice.computeSecret(dhBob.getPublicKey()).toString('hex');
console.log('OpenSSL MODP-14 Secret Match:', dhRes.digest === openSslDhSecret);

// 2. ECDH-secp256k1 (SECG SEC 1)
const ecdhSecpRes = ecdhSecp256k1.compute();
console.log('ECDH-secp256k1 Shared Coordinate (256 bits):');
console.log(ecdhSecpRes.digest);
console.log('ECDH-secp256k1 Match Verified (Sa === Sb):', ecdhSecpRes.tagValid);

// OpenSSL secp256k1 Cross-Verification
const ecdhAlice = crypto.createECDH('secp256k1');
const ecdhBob = crypto.createECDH('secp256k1');
ecdhAlice.setPrivateKey(Buffer.from(ECDH_SECP256K1_ALICE_PRIV.toString(16).padStart(64, '0'), 'hex'));
ecdhBob.setPrivateKey(Buffer.from(ECDH_SECP256K1_BOB_PRIV.toString(16).padStart(64, '0'), 'hex'));
const openSslSecpSecret = ecdhAlice.computeSecret(ecdhBob.getPublicKey()).toString('hex');
console.log('OpenSSL secp256k1 Secret Match:', ecdhSecpRes.digest === openSslSecpSecret);

// 3. ECDH-P256 (NIST SP 800-56A)
const ecdhP256Res = ecdhP256.compute();
console.log('ECDH-P256 Shared Coordinate (256 bits):');
console.log(ecdhP256Res.digest);
console.log('ECDH-P256 Match Verified (Sa === Sb):', ecdhP256Res.tagValid);

// OpenSSL prime256v1 Cross-Verification
const p256Alice = crypto.createECDH('prime256v1');
const p256Bob = crypto.createECDH('prime256v1');
p256Alice.setPrivateKey(Buffer.from(ECDH_P256_ALICE_PRIV.toString(16).padStart(64, '0'), 'hex'));
p256Bob.setPrivateKey(Buffer.from(ECDH_P256_BOB_PRIV.toString(16).padStart(64, '0'), 'hex'));
const openSslP256Secret = p256Alice.computeSecret(p256Bob.getPublicKey()).toString('hex');
console.log('OpenSSL P-256 Secret Match:', ecdhP256Res.digest === openSslP256Secret);
