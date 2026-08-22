import {
  ML_KEM_512_PARAMS,
  ML_KEM_768_PARAMS,
  ML_KEM_1024_PARAMS,
  NIST_FIPS203_KAT_512,
  NIST_FIPS203_KAT_768,
  NIST_FIPS203_KAT_1024,
} from '../src/algorithms/pqc/ml-kem/constants';
import { mlKemKeyGen, mlKemEncaps, mlKemDecaps } from '../src/algorithms/pqc/ml-kem/ml-kem-engine';
import {
  ML_DSA_44_PARAMS,
  ML_DSA_65_PARAMS,
  ML_DSA_87_PARAMS,
  NIST_FIPS204_KAT_44,
  NIST_FIPS204_KAT_65,
  NIST_FIPS204_KAT_87,
} from '../src/algorithms/pqc/ml-dsa/constants';
import { mlDsaKeyGen, mlDsaSign, mlDsaVerify } from '../src/algorithms/pqc/ml-dsa/ml-dsa-engine';
import { hexToBytes, bytesToHex } from '../src/algorithms/utils';

console.log('=============================================================================');
console.log('  CRYPTO-SCOPE PQC VERIFICATION: NIST FIPS 203 (ML-KEM) & FIPS 204 (ML-DSA)  ');
console.log('=============================================================================\n');

// -----------------------------------------------------------------------------
// Part 1: NIST FIPS 203 ML-KEM (CRYSTALS-Kyber)
// -----------------------------------------------------------------------------
console.log('--- [1/2] NIST FIPS 203 ML-KEM (CRYSTALS-KYBER) OFFICIAL KAT VERIFICATION ---');

for (const [name, params, kat] of [
  ['ML-KEM-512', ML_KEM_512_PARAMS, NIST_FIPS203_KAT_512],
  ['ML-KEM-768', ML_KEM_768_PARAMS, NIST_FIPS203_KAT_768],
  ['ML-KEM-1024', ML_KEM_1024_PARAMS, NIST_FIPS203_KAT_1024],
] as const) {
  const seedD = hexToBytes(kat.d);
  const seedZ = hexToBytes(kat.z);
  const seedM = hexToBytes(kat.m);

  const { ek, dk } = mlKemKeyGen(params, seedD, seedZ);
  const { c, sharedKey } = mlKemEncaps(params, ek, seedM);
  const { sharedKey: decapsK } = mlKemDecaps(params, dk, c);

  const kHex = bytesToHex(sharedKey);
  const decapsKHex = bytesToHex(decapsK);
  const katMatch = kHex === kat.expectedK;
  const roundTripMatch = kHex === decapsKHex;

  console.log(`\n• ${name}:`);
  console.log(`  - KeyGen ek (${ek.length} B):  ${bytesToHex(ek).slice(0, 36)}...${bytesToHex(ek).slice(-12)}`);
  console.log(`  - Ciphertext c (${c.length} B): ${bytesToHex(c).slice(0, 36)}...${bytesToHex(c).slice(-12)}`);
  console.log(`  - Shared Secret K:    ${kHex}`);
  console.log(`  - Expected KAT K:     ${kat.expectedK}`);
  console.log(`  - Decaps Recovered K':${decapsKHex}`);
  console.log(`  - External KAT Match: ${katMatch}`);
  console.log(`  - Round-Trip Match:   ${roundTripMatch}`);
}

// -----------------------------------------------------------------------------
// Part 2: NIST FIPS 204 ML-DSA (CRYSTALS-Dilithium)
// -----------------------------------------------------------------------------
console.log('\n\n--- [2/2] NIST FIPS 204 ML-DSA (CRYSTALS-DILITHIUM) OFFICIAL KAT VERIFICATION ---');

for (const [name, params, kat] of [
  ['ML-DSA-44', ML_DSA_44_PARAMS, NIST_FIPS204_KAT_44],
  ['ML-DSA-65', ML_DSA_65_PARAMS, NIST_FIPS204_KAT_65],
  ['ML-DSA-87', ML_DSA_87_PARAMS, NIST_FIPS204_KAT_87],
] as const) {
  const seed = hexToBytes(kat.seed);
  const msg = hexToBytes(kat.message);
  const ctx = hexToBytes(kat.context);

  const { pk, sk } = mlDsaKeyGen(params, seed);
  const { sig, steps } = mlDsaSign(params, sk, msg, ctx, true);
  const { valid } = mlDsaVerify(params, pk, msg, sig, ctx);

  const pkHex = bytesToHex(pk);
  const skHex = bytesToHex(sk);
  const sigHex = bytesToHex(sig);

  const rejStep = steps.find((s) => s.id === 'mldsa-sign-loop');
  const attempts = (rejStep?.data as any)?.normStats?.attempts || 1;

  console.log(`\n• ${name}:`);
  console.log(`  - Public Key pk (${pk.length} B):  ${pkHex.slice(0, 36)}...${pkHex.slice(-12)}`);
  console.log(`  - Secret Key sk (${sk.length} B):  ${skHex.slice(0, 36)}...${skHex.slice(-12)}`);
  console.log(`  - Signature σ (${sig.length} B):   ${sigHex.slice(0, 36)}...${sigHex.slice(-12)}`);
  console.log(`  - Rejection Loop Iterations: ${attempts}`);
  console.log(`  - Verification Status:       ${valid ? 'PASS (VALID)' : 'FAIL (INVALID)'}`);
}
