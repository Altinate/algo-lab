import {
  aes128EcbEncrypt,
  aes128EcbDecrypt,
  aes128CbcEncrypt,
  aes128CbcDecrypt,
  aes128CtrEncrypt,
  aes128CtrDecrypt,
  aes192EcbEncrypt,
  aes192CbcEncrypt,
  aes192CtrEncrypt,
  aes256EcbEncrypt,
  aes256CbcEncrypt,
  aes256CtrEncrypt,
  aes128GcmEncrypt,
  aes256GcmEncrypt,
} from '../src/algorithms/symmetric/aes';

const fipsKey128 = '2b7e151628aed2a6abf7158809cf4f3c';
const fipsPlain128 = '3243f6a8885a308d313198a2e0370734';

console.log('=== NIST FIPS 197 & SP 800-38A DIRECT COMPUTATION ===');
const ecb128Enc = aes128EcbEncrypt.compute(fipsPlain128, { keyHex: fipsKey128 });
console.log('AES-128-ECB Encrypt:', ecb128Enc.digest);

const ecb128Dec = aes128EcbDecrypt.compute(ecb128Enc.digest, { keyHex: fipsKey128 });
console.log('AES-128-ECB Decrypt:', ecb128Dec.digest);

const cbcIv = '000102030405060708090a0b0c0d0e0f';
const cbcPlain = '6bc1bee22e409f96e93d7e117393172a';
const cbc128Enc = aes128CbcEncrypt.compute(cbcPlain, { keyHex: fipsKey128, ivHex: cbcIv });
console.log('AES-128-CBC Encrypt:', cbc128Enc.digest);

const ctrIv = 'f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff';
const ctr128Enc = aes128CtrEncrypt.compute(cbcPlain, { keyHex: fipsKey128, ivHex: ctrIv });
console.log('AES-128-CTR Encrypt:', ctr128Enc.digest);

const key192 = '8e73b0f7da0e6452c810f32b809079e562f8ead2522c6b7b';
const ecb192Enc = aes192EcbEncrypt.compute(cbcPlain, { keyHex: key192 });
console.log('AES-192-ECB Encrypt:', ecb192Enc.digest);

const cbc192Enc = aes192CbcEncrypt.compute(cbcPlain, { keyHex: key192, ivHex: cbcIv });
console.log('AES-192-CBC Encrypt:', cbc192Enc.digest);

const key256 = '603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4';
const ecb256Enc = aes256EcbEncrypt.compute(cbcPlain, { keyHex: key256 });
console.log('AES-256-ECB Encrypt:', ecb256Enc.digest);

const cbc256Enc = aes256CbcEncrypt.compute(cbcPlain, { keyHex: key256, ivHex: cbcIv });
console.log('AES-256-CBC Encrypt:', cbc256Enc.digest);

const gcmKey = '00000000000000000000000000000000';
const gcmIv = '000000000000000000000000';
const gcmRes = aes128GcmEncrypt.compute('', { keyHex: gcmKey, ivHex: gcmIv });
console.log('AES-128-GCM Case 1 Tag:', gcmRes.tagHex);
