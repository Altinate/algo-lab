/**
 * Verification script for PBKDF2-HMAC-SHA256 (RFC 8018 / RFC 6070)
 */

import { pbkdf2HmacSha256 } from '../src/algorithms/tools/pbkdf2';

console.log('=============================================================================');
console.log('       CRYPTO-SCOPE PBKDF2 (RFC 8018 / RFC 6070) TEST VECTOR VERIFICATION   ');
console.log('=============================================================================');

// Vector 1: c=1
const v1 = pbkdf2HmacSha256('password', 'salt', 1, 32);
const exp1 = '120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b';
console.log('• Test Vector 1: Password="password", Salt="salt", c=1, dkLen=32');
console.log(`  - Output:   "${v1.digest}" (${v1.steps.length} steps)`);
console.log(`  - Expected: "${exp1}"`);
console.log(`  - Match:    ${v1.digest === exp1}`);

// Vector 2: c=2
const v2 = pbkdf2HmacSha256('password', 'salt', 2, 32);
const exp2 = 'ae4d0c95af6b46d32d0adff928f06dd02a303f8ef3c251dfd6e2d85a95474c43';
console.log('\n• Test Vector 2: Password="password", Salt="salt", c=2, dkLen=32');
console.log(`  - Output:   "${v2.digest}" (${v2.steps.length} steps)`);
console.log(`  - Expected: "${exp2}"`);
console.log(`  - Match:    ${v2.digest === exp2}`);

// Vector 3: c=4096
const v3 = pbkdf2HmacSha256('password', 'salt', 4096, 32);
const exp3 = 'c5e478d59288c841aa530db6845c4c8d962893a001ce4e11a4963873aa98134a';
console.log('\n• Test Vector 3: Password="password", Salt="salt", c=4096, dkLen=32');
console.log(`  - Output:   "${v3.digest}" (${v3.steps.length} steps)`);
console.log(`  - Expected: "${exp3}"`);
console.log(`  - Match:    ${v3.digest === exp3}`);

// Vector 4: Multi-block 40 bytes
const v4 = pbkdf2HmacSha256('passwordPASSWORDpassword', 'saltSALTsaltSALTsaltSALTsaltSALTsalt', 4096, 40);
const exp4 = '348c89dbcbd32b2f32d814b8116e84cf2b17347ebc1800181c4e2a1fb8dd53e1c635518c7dac47e9';
console.log('\n• Test Vector 4: Long Pass/Salt (Multi-block), c=4096, dkLen=40');
console.log(`  - Output:   "${v4.digest}" (${v4.steps.length} steps)`);
console.log(`  - Expected: "${exp4}"`);
console.log(`  - Match:    ${v4.digest === exp4}`);

// Vector 5: Null byte handling
const v5 = pbkdf2HmacSha256('pass\0word', 'sa\0lt', 4096, 16);
const exp5 = '89b69d0516f829893c696226650a8687';
console.log('\n• Test Vector 5: Embedded Null Bytes, c=4096, dkLen=16');
console.log(`  - Output:   "${v5.digest}" (${v5.steps.length} steps)`);
console.log(`  - Expected: "${exp5}"`);
console.log(`  - Match:    ${v5.digest === exp5}`);
