/**
 * Verification script for Scrypt (RFC 7914 Appendix A)
 */

import { scryptCore } from '../src/algorithms/tools/scrypt';

console.log('=============================================================================');
console.log('       CRYPTO-SCOPE SCRYPT (RFC 7914) TEST VECTOR VERIFICATION               ');
console.log('=============================================================================');

// Vector 1
const v1 = scryptCore('', '', 16, 1, 1, 64);
const exp1 = '77d6576238657b203b19ca42c18a0497f16b4844e3074ae8dfdffa3fede21442fcd0069ded0948f8326a753a0fc81f17e8d3e0fb2e0d3628cf35e20c38d18906';
console.log('• RFC 7914 Vector 1: P="", S="", N=16, r=1, p=1, dkLen=64');
console.log(`  - Output:   "${v1.digest}" (${v1.steps.length} steps)`);
console.log(`  - Expected: "${exp1}"`);
console.log(`  - Match:    ${v1.digest === exp1}`);

// Vector 2
const v2 = scryptCore('password', 'NaCl', 1024, 8, 16, 64);
const exp2 = 'fdbabe1c9d3472007856e7190d01e9fe7c6ad7cbc8237830e77376634b3731622eaf30d92e22a3886ff109279d9830dac727afb94a83ee6d8360cbdfa2cc0640';
console.log('\n• RFC 7914 Vector 2: P="password", S="NaCl", N=1024, r=8, p=16, dkLen=64');
console.log(`  - Output:   "${v2.digest}" (${v2.steps.length} steps)`);
console.log(`  - Expected: "${exp2}"`);
console.log(`  - Match:    ${v2.digest === exp2}`);

// Vector 3
const v3 = scryptCore('pleaseletmein', 'SodiumChloride', 16384, 8, 1, 64);
const exp3 = '7023bdcb3afd7348461c06cd81fd38ebfda8fbba904f8e3ea9b543f6545da1f2d5432955613f0fcf62d49705242a9af9e61e85dc0d651e40dfcf017b45575887';
console.log('\n• RFC 7914 Vector 3: P="pleaseletmein", S="SodiumChloride", N=16384, r=8, p=1, dkLen=64');
console.log(`  - Output:   "${v3.digest}" (${v3.steps.length} steps)`);
console.log(`  - Expected: "${exp3}"`);
console.log(`  - Match:    ${v3.digest === exp3}`);
