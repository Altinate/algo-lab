/**
 * Encoding Verification Script
 * Validates RFC 4648, RFC 3986, Bitcoin Base58, and Unicode UTF-8/UTF-16
 */

import {
  base64EncodePlugin,
  base64DecodePlugin,
  base64UrlEncodePlugin,
  base64UrlDecodePlugin,
  base32EncodePlugin,
  base32DecodePlugin,
  base16EncodePlugin,
  base16DecodePlugin,
  base58EncodePlugin,
  base58DecodePlugin,
  urlEncodePlugin,
  urlDecodePlugin,
  utf8EncodePlugin,
  utf8DecodePlugin,
  utf16EncodePlugin,
  utf16DecodePlugin,
} from '../src/algorithms/encoding';

console.log('=============================================================================');
console.log('       CRYPTO-SCOPE ENCODING VERIFICATION: RFC 4648 / RFC 3986 / UNICODE     ');
console.log('=============================================================================\n');

console.log('--- [1/2] POSITIONAL / RADIX ENCODING FAMILY ---');

// Base64
console.log('• Base64 (Standard RFC 4648):');
const b64Input = 'Hello, CryptoScope!';
const b64Enc = base64EncodePlugin.compute(b64Input);
const b64Dec = base64DecodePlugin.compute(b64Enc.digest);
console.log(`  - Input:        "${b64Input}"`);
console.log(`  - Encoded:      "${b64Enc.digest}" (${b64Enc.steps.length} steps)`);
console.log(`  - Decoded:      "${b64Dec.digest}" (${b64Dec.steps.length} steps)`);
console.log(`  - Round-Trip:   ${b64Dec.digest === b64Input}`);

// Base64URL
console.log('\n• Base64URL (URL-Safe RFC 4648 §5):');
const b64UrlInput = 'Subject?>~_123';
const b64UrlEnc = base64UrlEncodePlugin.compute(b64UrlInput);
const b64UrlDec = base64UrlDecodePlugin.compute(b64UrlEnc.digest);
console.log(`  - Input:        "${b64UrlInput}"`);
console.log(`  - Encoded:      "${b64UrlEnc.digest}" (${b64UrlEnc.steps.length} steps)`);
console.log(`  - Decoded:      "${b64UrlDec.digest}" (${b64UrlDec.steps.length} steps)`);
console.log(`  - URL Safe:     ${!b64UrlEnc.digest.includes('+') && !b64UrlEnc.digest.includes('/') && !b64UrlEnc.digest.includes('=')}`);
console.log(`  - Round-Trip:   ${b64UrlDec.digest === b64UrlInput}`);

// Base32
console.log('\n• Base32 (RFC 4648 A-Z, 2-7):');
const b32Input = 'foobar';
const b32Enc = base32EncodePlugin.compute(b32Input);
const b32Dec = base32DecodePlugin.compute(b32Enc.digest);
console.log(`  - Input:        "${b32Input}"`);
console.log(`  - Encoded:      "${b32Enc.digest}" (${b32Enc.steps.length} steps) [Expected: "MZXW6YTBOI======"]`);
console.log(`  - Decoded:      "${b32Dec.digest}" (${b32Dec.steps.length} steps)`);
console.log(`  - RFC Match:    ${b32Enc.digest === 'MZXW6YTBOI======'}`);
console.log(`  - Round-Trip:   ${b32Dec.digest === b32Input}`);

// Base16
console.log('\n• Base16 / Hexadecimal:');
const b16Input = 'foobar';
const b16Enc = base16EncodePlugin.compute(b16Input);
const b16Dec = base16DecodePlugin.compute(b16Enc.digest);
console.log(`  - Input:        "${b16Input}"`);
console.log(`  - Encoded:      "${b16Enc.digest}" (${b16Enc.steps.length} steps) [Expected: "666F6F626172"]`);
console.log(`  - Decoded:      "${b16Dec.digest}" (${b16Dec.steps.length} steps)`);
console.log(`  - RFC Match:    ${b16Enc.digest === '666F6F626172'}`);
console.log(`  - Round-Trip:   ${b16Dec.digest === b16Input}`);

// Base58
console.log('\n• Base58 (Bitcoin Reference Standard):');
const b58Input = 'Hello World';
const b58Enc = base58EncodePlugin.compute(b58Input);
const b58Dec = base58DecodePlugin.compute(b58Enc.digest);
console.log(`  - Input:        "${b58Input}"`);
console.log(`  - Encoded:      "${b58Enc.digest}" (${b58Enc.steps.length} steps) [Expected: "JxF12TrwUP45BMd"]`);
console.log(`  - Decoded:      "${b58Dec.digest}" (${b58Dec.steps.length} steps)`);
console.log(`  - Bitcoin Match:${b58Enc.digest === 'JxF12TrwUP45BMd'}`);
console.log(`  - Round-Trip:   ${b58Dec.digest === b58Input}`);

console.log('\n--- [2/2] TEXT / CHARACTER ENCODING FAMILY ---');

// URL Percent-Encoding
console.log('• URL / Percent-Encoding (RFC 3986):');
const urlInput = 'https://example.com/api?q=crypto scope&tag=pqc#top';
const urlEnc = urlEncodePlugin.compute(urlInput);
const urlDec = urlDecodePlugin.compute(urlEnc.digest);
console.log(`  - Input:        "${urlInput}"`);
console.log(`  - Encoded:      "${urlEnc.digest}" (${urlEnc.steps.length} steps)`);
console.log(`  - Decoded:      "${urlDec.digest}" (${urlDec.steps.length} steps)`);
console.log(`  - Round-Trip:   ${urlDec.digest === urlInput}`);

// UTF-8
console.log('\n• Unicode UTF-8 Variable-Length Encoding:');
const utf8Input = 'Aé€🚀';
const utf8Enc = utf8EncodePlugin.compute(utf8Input);
const utf8Dec = utf8DecodePlugin.compute(utf8Enc.digest);
console.log(`  - Input:        "${utf8Input}" (ASCII + 2-Byte + 3-Byte + 4-Byte Emoji)`);
console.log(`  - Encoded Hex:  "0x${utf8Enc.digest.toUpperCase()}" (${utf8Enc.steps.length} steps) [Expected: "0x41C3A9E282ACF09F9A80"]`);
console.log(`  - Decoded:      "${utf8Dec.digest}" (${utf8Dec.steps.length} steps)`);
console.log(`  - Hex Match:    ${utf8Enc.digest.toUpperCase() === '41C3A9E282ACF09F9A80'}`);
console.log(`  - Round-Trip:   ${utf8Dec.digest === utf8Input}`);

// UTF-16
console.log('\n• Unicode UTF-16 Surrogate Pair Encoding:');
const utf16Input = '🚀';
const utf16Enc = utf16EncodePlugin.compute(utf16Input);
const utf16Dec = utf16DecodePlugin.compute(utf16Enc.digest);
console.log(`  - Input:        "${utf16Input}" (U+1F680 Astral Plane Rocket)`);
console.log(`  - Encoded Hex:  "0x${utf16Enc.digest.toUpperCase()}" (${utf16Enc.steps.length} steps) [High: D83D, Low: DE80]`);
console.log(`  - Decoded:      "${utf16Dec.digest}" (${utf16Dec.steps.length} steps)`);
console.log(`  - Surrogate Match: ${utf16Enc.digest.toUpperCase() === 'D83DDE80'}`);
console.log(`  - Round-Trip:   ${utf16Dec.digest === utf16Input}`);
