import {
  mlKem512KeyGenPlugin,
  mlKem512EncapsulatePlugin,
  mlKem512DecapsulatePlugin,
  mlKem768KeyGenPlugin,
  mlKem768EncapsulatePlugin,
  mlKem768DecapsulatePlugin,
  mlKem1024KeyGenPlugin,
  mlKem1024EncapsulatePlugin,
  mlKem1024DecapsulatePlugin,
} from '../src/algorithms/pqc/ml-kem';

console.log('=== NIST FIPS 203 ML-KEM (CRYSTALS-KYBER) VERIFICATION ===\n');

// 1. ML-KEM-512 (NIST Category 1)
const keyGen512 = mlKem512KeyGenPlugin.compute('');
const encaps512 = mlKem512EncapsulatePlugin.compute('');
const decaps512 = mlKem512DecapsulatePlugin.compute('');
console.log('ML-KEM-512 Encapsulation Key (ek, 800 bytes):');
console.log(keyGen512.digest.slice(0, 64) + '...');
console.log('ML-KEM-512 Post-Quantum Shared Key (K, 32 bytes):');
console.log(encaps512.digest);
console.log('ML-KEM-512 Decapsulation Recovered Key (K\'):');
console.log(decaps512.digest);
console.log('ML-KEM-512 Round-Trip Match (K == K\'):', encaps512.digest === decaps512.digest, '\n');

// 2. ML-KEM-768 (NIST Category 3 / Recommended)
const keyGen768 = mlKem768KeyGenPlugin.compute('');
const encaps768 = mlKem768EncapsulatePlugin.compute('');
const decaps768 = mlKem768DecapsulatePlugin.compute('');
console.log('ML-KEM-768 Encapsulation Key (ek, 1184 bytes):');
console.log(keyGen768.digest.slice(0, 64) + '...');
console.log('ML-KEM-768 Post-Quantum Shared Key (K, 32 bytes):');
console.log(encaps768.digest);
console.log('ML-KEM-768 Decapsulation Recovered Key (K\'):');
console.log(decaps768.digest);
console.log('ML-KEM-768 Round-Trip Match (K == K\'):', encaps768.digest === decaps768.digest, '\n');

// 3. ML-KEM-1024 (NIST Category 5)
const keyGen1024 = mlKem1024KeyGenPlugin.compute('');
const encaps1024 = mlKem1024EncapsulatePlugin.compute('');
const decaps1024 = mlKem1024DecapsulatePlugin.compute('');
console.log('ML-KEM-1024 Encapsulation Key (ek, 1568 bytes):');
console.log(keyGen1024.digest.slice(0, 64) + '...');
console.log('ML-KEM-1024 Post-Quantum Shared Key (K, 32 bytes):');
console.log(encaps1024.digest);
console.log('ML-KEM-1024 Decapsulation Recovered Key (K\'):');
console.log(decaps1024.digest);
console.log('ML-KEM-1024 Round-Trip Match (K == K\'):', encaps1024.digest === decaps1024.digest, '\n');
