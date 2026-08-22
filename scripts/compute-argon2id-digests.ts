/**
 * Standalone verification script for Argon2 (RFC 9106) test vectors.
 * Directly runs Argon2id, Argon2d, and Argon2i against official RFC 9106 KAT vectors.
 */

import { argon2Core } from '../src/algorithms/tools/argon2id';

console.log('=============================================================================');
console.log('       CRYPTO-SCOPE ARGON2ID (RFC 9106) TEST VECTOR VERIFICATION             ');
console.log('=============================================================================');

const P = new Uint8Array(32).fill(1);
const S = new Uint8Array(16).fill(2);
const K = new Uint8Array(8).fill(3);
const X_data = new Uint8Array(12).fill(4);

// 1. RFC 9106 Section 5.3: Argon2id
console.log('• RFC 9106 Section 5.3: Argon2id (m=32 KiB, t=3, p=4 lanes, T=32 bytes)');
console.log('  Total Matrix Evaluation: m=32 blocks × t=3 passes = 96 1KB blocks across 4 lanes');
const res2id = argon2Core('argon2id', P, S, 4, 32, 32, 3, K, X_data);
const expected2id = '0d640df58d78766c08c037a34a8b53c9d01ef0452d75b65eb52520e96b01e659';
console.log('  - Output:   "' + res2id.digest + '" (' + res2id.steps.length + ' steps)');
console.log('  - Expected: "' + expected2id + '"');
console.log('  - Match:    ' + (res2id.digest === expected2id));
console.log();

// 2. RFC 9106 Section 5.1: Argon2d
console.log('• RFC 9106 Section 5.1: Argon2d (m=32 KiB, t=3, p=4 lanes, T=32 bytes)');
console.log('  Total Matrix Evaluation: m=32 blocks × t=3 passes = 96 1KB blocks across 4 lanes');
const res2d = argon2Core('argon2d', P, S, 4, 32, 32, 3, K, X_data);
const expected2d = '512b391b6f1162975371d30919734294f868e3be3984f3c1a13a4db9fabe4acb';
console.log('  - Output:   "' + res2d.digest + '" (' + res2d.steps.length + ' steps)');
console.log('  - Expected: "' + expected2d + '"');
console.log('  - Match:    ' + (res2d.digest === expected2d));
console.log();

// 3. RFC 9106 Section 5.2: Argon2i
console.log('• RFC 9106 Section 5.2: Argon2i (m=32 KiB, t=3, p=4 lanes, T=32 bytes)');
console.log('  Total Matrix Evaluation: m=32 blocks × t=3 passes = 96 1KB blocks across 4 lanes');
const res2i = argon2Core('argon2i', P, S, 4, 32, 32, 3, K, X_data);
const expected2i = 'c814d9d1dc7f37aa13f0d77f2494bda1c8de6b016dd388d29952a4c4672b6ce8';
console.log('  - Output:   "' + res2i.digest + '" (' + res2i.steps.length + ' steps)');
console.log('  - Expected: "' + expected2i + '"');
console.log('  - Match:    ' + (res2i.digest === expected2i));
console.log('=============================================================================');
