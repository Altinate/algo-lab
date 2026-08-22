/**
 * Standalone verification script for BIP-39 test vectors.
 * Directly runs BIP-39 mnemonic phrase and master seed generation against Trezor reference vectors.
 */

import { computeBip39 } from '../src/algorithms/tools/bip39/engine';

console.log('=============================================================================');
console.log('       CRYPTO-SCOPE BIP-39 MNEMONIC & SEED TEST VECTOR VERIFICATION          ');
console.log('=============================================================================');

// 1. Trezor Vector 1: 128-bit zeros
console.log('• BIP-39 Vector 1: 128-Bit Zero Entropy (12 words, Passphrase: "TREZOR")');
const res1 = computeBip39('00000000000000000000000000000000', 'TREZOR', 12);
const mnemonic1 = res1.steps.find((s) => s.id === 'bip39-mnemonic-phrase')?.data?.bip39?.mnemonicPhrase;
const expMnemonic1 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const expSeed1 = 'c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04';

console.log('  - Mnemonic:      "' + mnemonic1 + '"');
console.log('  - Expected Mnem: "' + expMnemonic1 + '"');
console.log('  - Mnemonic Match: ' + (mnemonic1 === expMnemonic1));
console.log('  - Master Seed:   "' + res1.digest + '" (' + res1.steps.length + ' steps)');
console.log('  - Expected Seed: "' + expSeed1 + '"');
console.log('  - Seed Match:     ' + (res1.digest === expSeed1));
console.log();

// 2. Trezor Vector 2: 128-bit 0x7f
console.log('• BIP-39 Vector 2: 128-Bit 0x7F Entropy (12 words, Passphrase: "TREZOR")');
const res2 = computeBip39('7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f', 'TREZOR', 12);
const mnemonic2 = res2.steps.find((s) => s.id === 'bip39-mnemonic-phrase')?.data?.bip39?.mnemonicPhrase;
const expMnemonic2 = 'legal winner thank year wave sausage worth useful legal winner thank yellow';
const expSeed2 = '2e8905819b8723fe2c1d161860e5ee1830318dbf49a83bd451cfb8440c28bd6fa457fe1296106559a3c80937a1c1069be3a3a5bd381ee6260e8d9739fce1f607';

console.log('  - Mnemonic:      "' + mnemonic2 + '"');
console.log('  - Expected Mnem: "' + expMnemonic2 + '"');
console.log('  - Mnemonic Match: ' + (mnemonic2 === expMnemonic2));
console.log('  - Master Seed:   "' + res2.digest + '" (' + res2.steps.length + ' steps)');
console.log('  - Expected Seed: "' + expSeed2 + '"');
console.log('  - Seed Match:     ' + (res2.digest === expSeed2));
console.log();

// 3. Trezor Vector 3: 256-bit 0xff
console.log('• BIP-39 Vector 3: 256-Bit 0xFF Entropy (24 words, Passphrase: "TREZOR")');
const res3 = computeBip39('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'TREZOR', 24);
const mnemonic3 = res3.steps.find((s) => s.id === 'bip39-mnemonic-phrase')?.data?.bip39?.mnemonicPhrase;
const expMnemonic3 = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo vote';
const expSeed3 = 'dd48c104698c30cfe2b6142103248622fb7bb0ff692eebb00089b32d22484e1613912f0a5b694407be899ffd31ed3992c456cdf60f5d4564b8ba3f05a69890ad';

console.log('  - Mnemonic:      "' + mnemonic3 + '"');
console.log('  - Expected Mnem: "' + expMnemonic3 + '"');
console.log('  - Mnemonic Match: ' + (mnemonic3 === expMnemonic3));
console.log('  - Master Seed:   "' + res3.digest + '" (' + res3.steps.length + ' steps)');
console.log('  - Expected Seed: "' + expSeed3 + '"');
console.log('  - Seed Match:     ' + (res3.digest === expSeed3));
console.log('=============================================================================');
