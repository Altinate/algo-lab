import {
  desEcbEncrypt,
  desEcbDecrypt,
  desCbcEncrypt,
  des3EcbEncrypt,
  des3CbcEncrypt,
} from '../src/algorithms/symmetric/des';
import {
  chacha20Encrypt,
  chacha20Poly1305Encrypt,
} from '../src/algorithms/symmetric/chacha20-poly1305';

console.log('=== NIST FIPS 46-3, NIST SP 800-67, and RFC 8439 DIRECT COMPUTATION ===');

// DES (NIST FIPS 46-3)
const desKey = '133457799bbcdff1';
const desPlain = '0123456789abcdef';
const desEnc = desEcbEncrypt.compute(desPlain, { keyHex: desKey });
console.log('DES-ECB Encrypt (FIPS 46-3):', desEnc.digest);

const desDec = desEcbDecrypt.compute(desEnc.digest, { keyHex: desKey });
console.log('DES-ECB Decrypt (FIPS 46-3):', desDec.digest);

// 3DES (NIST SP 800-67)
const des3Key = '0123456789abcdef23456789abcdef01456789abcdef0123';
const des3Plain = '5468652071756963';
const des3Enc = des3EcbEncrypt.compute(des3Plain, { keyHex: des3Key });
console.log('3DES-ECB Encrypt (SP 800-67):', des3Enc.digest);

// ChaCha20 (RFC 8439 Section 2.4.2)
const chachaKey = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
const chachaNonce = '000000000000004a00000000';
const chachaPlain = "Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.";
const chachaRes = chacha20Encrypt.compute(chachaPlain, { keyHex: chachaKey, ivHex: chachaNonce });
console.log('ChaCha20 Cipher (RFC 8439):', chachaRes.digest.slice(0, 64) + '...');

// ChaCha20-Poly1305 (RFC 8439 Section 2.8.2)
const chachaPolyKey = '808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f';
const chachaPolyNonce = '070000004041424344454647';
const chachaPolyAad = '50515253c0c1c2c3c4c5c6c7';
const chachaPolyRes = chacha20Poly1305Encrypt.compute(chachaPlain, {
  keyHex: chachaPolyKey,
  ivHex: chachaPolyNonce,
  aadHex: chachaPolyAad,
});
console.log('ChaCha20-Poly1305 Cipher (RFC 8439):', chachaPolyRes.digest.slice(0, 64) + '...');
console.log('ChaCha20-Poly1305 Tag (RFC 8439):', chachaPolyRes.tagHex);
