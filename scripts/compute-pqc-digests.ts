import {
  ML_KEM_512_PARAMS,
  ML_KEM_768_PARAMS,
  ML_KEM_1024_PARAMS,
  NIST_FIPS203_KAT_512,
  NIST_FIPS203_KAT_768,
  NIST_FIPS203_KAT_1024,
} from '../src/algorithms/pqc/ml-kem/constants';
import { mlKemKeyGen, mlKemEncaps, mlKemDecaps } from '../src/algorithms/pqc/ml-kem/ml-kem-engine';
import { hexToBytes, bytesToHex } from '../src/algorithms/utils';

console.log('=== NIST FIPS 203 (ML-KEM / CRYSTALS-KYBER) OFFICIAL KAT VERIFICATION ===\n');

// 1. ML-KEM-512 (NIST Category 1)
const seedD512 = hexToBytes(NIST_FIPS203_KAT_512.d);
const seedZ512 = hexToBytes(NIST_FIPS203_KAT_512.z);
const seedM512 = hexToBytes(NIST_FIPS203_KAT_512.m);

const keyGen512 = mlKemKeyGen(ML_KEM_512_PARAMS, seedD512, seedZ512);
const encaps512 = mlKemEncaps(ML_KEM_512_PARAMS, keyGen512.ek, seedM512);
const decaps512 = mlKemDecaps(ML_KEM_512_PARAMS, keyGen512.dk, encaps512.c);

console.log('--- ML-KEM-512 ---');
console.log('Seed d: ' + NIST_FIPS203_KAT_512.d);
console.log('Seed z: ' + NIST_FIPS203_KAT_512.z);
console.log('Seed m: ' + NIST_FIPS203_KAT_512.m);
console.log('Computed KeyGen ek (800 bytes): ' + bytesToHex(keyGen512.ek).slice(0, 48) + '...' + bytesToHex(keyGen512.ek).slice(-16));
console.log('Computed Ciphertext c (768 bytes): ' + bytesToHex(encaps512.c).slice(0, 48) + '...' + bytesToHex(encaps512.c).slice(-16));
console.log('Computed Shared Secret K: ' + bytesToHex(encaps512.sharedKey));
console.log('Official Expected KAT K:  ' + NIST_FIPS203_KAT_512.expectedK);
console.log('Decaps Recovered Secret K\': ' + bytesToHex(decaps512.sharedKey));
console.log('KAT Vector Exact Match (K == Expected KAT): ' + (bytesToHex(encaps512.sharedKey) === NIST_FIPS203_KAT_512.expectedK));
console.log('Round-Trip Match (K == K\'):                ' + (bytesToHex(encaps512.sharedKey) === bytesToHex(decaps512.sharedKey)) + '\n');

// 2. ML-KEM-768 (NIST Category 3 / Recommended)
const seedD768 = hexToBytes(NIST_FIPS203_KAT_768.d);
const seedZ768 = hexToBytes(NIST_FIPS203_KAT_768.z);
const seedM768 = hexToBytes(NIST_FIPS203_KAT_768.m);

const keyGen768 = mlKemKeyGen(ML_KEM_768_PARAMS, seedD768, seedZ768);
const encaps768 = mlKemEncaps(ML_KEM_768_PARAMS, keyGen768.ek, seedM768);
const decaps768 = mlKemDecaps(ML_KEM_768_PARAMS, keyGen768.dk, encaps768.c);

console.log('--- ML-KEM-768 (Recommended) ---');
console.log('Seed d: ' + NIST_FIPS203_KAT_768.d);
console.log('Seed z: ' + NIST_FIPS203_KAT_768.z);
console.log('Seed m: ' + NIST_FIPS203_KAT_768.m);
console.log('Computed KeyGen ek (1184 bytes): ' + bytesToHex(keyGen768.ek).slice(0, 48) + '...' + bytesToHex(keyGen768.ek).slice(-16));
console.log('Computed Ciphertext c (1088 bytes): ' + bytesToHex(encaps768.c).slice(0, 48) + '...' + bytesToHex(encaps768.c).slice(-16));
console.log('Computed Shared Secret K: ' + bytesToHex(encaps768.sharedKey));
console.log('Official Expected KAT K:  ' + NIST_FIPS203_KAT_768.expectedK);
console.log('Decaps Recovered Secret K\': ' + bytesToHex(decaps768.sharedKey));
console.log('KAT Vector Exact Match (K == Expected KAT): ' + (bytesToHex(encaps768.sharedKey) === NIST_FIPS203_KAT_768.expectedK));
console.log('Round-Trip Match (K == K\'):                ' + (bytesToHex(encaps768.sharedKey) === bytesToHex(decaps768.sharedKey)) + '\n');

// 3. ML-KEM-1024 (NIST Category 5)
const seedD1024 = hexToBytes(NIST_FIPS203_KAT_1024.d);
const seedZ1024 = hexToBytes(NIST_FIPS203_KAT_1024.z);
const seedM1024 = hexToBytes(NIST_FIPS203_KAT_1024.m);

const keyGen1024 = mlKemKeyGen(ML_KEM_1024_PARAMS, seedD1024, seedZ1024);
const encaps1024 = mlKemEncaps(ML_KEM_1024_PARAMS, keyGen1024.ek, seedM1024);
const decaps1024 = mlKemDecaps(ML_KEM_1024_PARAMS, keyGen1024.dk, encaps1024.c);

console.log('--- ML-KEM-1024 ---');
console.log('Seed d: ' + NIST_FIPS203_KAT_1024.d);
console.log('Seed z: ' + NIST_FIPS203_KAT_1024.z);
console.log('Seed m: ' + NIST_FIPS203_KAT_1024.m);
console.log('Computed KeyGen ek (1568 bytes): ' + bytesToHex(keyGen1024.ek).slice(0, 48) + '...' + bytesToHex(keyGen1024.ek).slice(-16));
console.log('Computed Ciphertext c (1568 bytes): ' + bytesToHex(encaps1024.c).slice(0, 48) + '...' + bytesToHex(encaps1024.c).slice(-16));
console.log('Computed Shared Secret K: ' + bytesToHex(encaps1024.sharedKey));
console.log('Official Expected KAT K:  ' + NIST_FIPS203_KAT_1024.expectedK);
console.log('Decaps Recovered Secret K\': ' + bytesToHex(decaps1024.sharedKey));
console.log('KAT Vector Exact Match (K == Expected KAT): ' + (bytesToHex(encaps1024.sharedKey) === NIST_FIPS203_KAT_1024.expectedK));
console.log('Round-Trip Match (K == K\'):                ' + (bytesToHex(encaps1024.sharedKey) === bytesToHex(decaps1024.sharedKey)) + '\n');
