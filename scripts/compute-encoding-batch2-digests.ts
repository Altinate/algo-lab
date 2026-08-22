/**
 * Encoding Batch 2 Verification Script
 * Validates Base85, Base36, Punycode, Quoted-Printable, Morse Code, and JWT HS256
 */

import {
  base85EncodePlugin,
  base85DecodePlugin,
  base36EncodePlugin,
  base36DecodePlugin,
  punycodeEncodePlugin,
  punycodeDecodePlugin,
  quotedPrintableEncodePlugin,
  quotedPrintableDecodePlugin,
  morseEncodePlugin,
  morseDecodePlugin,
  jwtEncodePlugin,
  jwtDecodePlugin,
} from '../src/algorithms/encoding';

console.log('=============================================================================');
console.log('    CRYPTO-SCOPE ENCODING BATCH 2 VERIFICATION (6 SCHEMES / 12 PLUGINS)      ');
console.log('=============================================================================\n');

console.log('--- [1/4] RADIX / BINARY-TO-TEXT ENCODING FAMILY ---');

// Base85 / ASCII85
console.log('• Base85 / ASCII85 (Adobe Standard & RFC 1924):');
const b85Input = 'Hello World!';
const b85Enc = base85EncodePlugin.compute(b85Input);
const b85Dec = base85DecodePlugin.compute(b85Enc.digest);
console.log(`  - Input:        "${b85Input}"`);
console.log(`  - Encoded:      "${b85Enc.digest}" (${b85Enc.steps.length} steps) [Expected: "87cURD]i,\\"Ebo80"]`);
console.log(`  - Decoded:      "${b85Dec.digest}" (${b85Dec.steps.length} steps)`);
console.log(`  - Standard:     ${b85Enc.digest === '87cURD]i,"Ebo80'}`);
console.log(`  - Round-Trip:   ${b85Dec.digest === b85Input}`);

const b85Zero = '\x00\x00\x00\x00';
const b85ZeroEnc = base85EncodePlugin.compute(b85Zero);
console.log(`  - Zero Block:   "${b85ZeroEnc.digest}" [Expected 'z' shortcut: ${b85ZeroEnc.digest === 'z'}]`);

// Base36
console.log('\n• Base36 (Alphanumeric 0-9, a-z):');
const b36Input = 'Hello World';
const b36Enc = base36EncodePlugin.compute(b36Input);
const b36Dec = base36DecodePlugin.compute(b36Enc.digest);
console.log(`  - Input:        "${b36Input}"`);
console.log(`  - Encoded:      "${b36Enc.digest}" (${b36Enc.steps.length} steps)`);
console.log(`  - Decoded:      "${b36Dec.digest}" (${b36Dec.steps.length} steps)`);
console.log(`  - Round-Trip:   ${b36Dec.digest === b36Input}`);

console.log('\n--- [2/4] TEXT / DOMAIN ENCODING FAMILY ---');

// Punycode (RFC 3492)
console.log('• Punycode (RFC 3492 Bootstring IDNA):');
const puny1 = 'münchen';
const puny1Enc = punycodeEncodePlugin.compute(puny1);
const puny1Dec = punycodeDecodePlugin.compute(puny1Enc.digest);
console.log(`  - German:       "${puny1}" → "${puny1Enc.digest}" (${puny1Enc.steps.length} steps) [Expected: "mnchen-3ya", Match: ${puny1Enc.digest === 'mnchen-3ya'}]`);
console.log(`  - Decoded:      "${puny1Dec.digest}" [Match: ${puny1Dec.digest === puny1}]`);

const puny2 = 'ليهمابتكلموشعربي؟';
const puny2Enc = punycodeEncodePlugin.compute(puny2);
const puny2Dec = punycodeDecodePlugin.compute(puny2Enc.digest);
console.log(`  - Arabic:       "${puny2}" → "${puny2Enc.digest}" (${puny2Enc.steps.length} steps) [Expected: "egbpdaj6bu4bxfgehfvwxn", Match: ${puny2Enc.digest === 'egbpdaj6bu4bxfgehfvwxn'}]`);
console.log(`  - Decoded:      "${puny2Dec.digest}" [Match: ${puny2Dec.digest === puny2}]`);

// Quoted-Printable (RFC 2045)
console.log('\n• Quoted-Printable (RFC 2045 MIME):');
const qpInput = 'Héllo = Wörld!';
const qpEnc = quotedPrintableEncodePlugin.compute(qpInput);
const qpDec = quotedPrintableDecodePlugin.compute(qpEnc.digest);
console.log(`  - Input:        "${qpInput}"`);
console.log(`  - Encoded:      "${qpEnc.digest}" (${qpEnc.steps.length} steps) [Expected: "H=C3=A9llo =3D W=C3=B6rld!"]`);
console.log(`  - Decoded:      "${qpDec.digest}" (${qpDec.steps.length} steps)`);
console.log(`  - MIME Match:   ${qpEnc.digest === 'H=C3=A9llo =3D W=C3=B6rld!'}`);
console.log(`  - Round-Trip:   ${qpDec.digest === qpInput}`);

console.log('\n--- [3/4] SIGNAL / HISTORICAL ENCODING FAMILY ---');

// Morse Code (ITU-R M.1677-1)
console.log('• Morse Code (ITU-R M.1677-1 International Morse):');
const morseInput = 'HELLO WORLD';
const morseEnc = morseEncodePlugin.compute(morseInput);
const morseDec = morseDecodePlugin.compute(morseEnc.digest);
console.log(`  - Input:        "${morseInput}"`);
console.log(`  - Encoded:      "${morseEnc.digest}" (${morseEnc.steps.length} steps)`);
console.log(`  - Decoded:      "${morseDec.digest}" (${morseDec.steps.length} steps)`);
console.log(`  - ITU Match:    ${morseEnc.digest === '.... . .-.. .-.. --- / .-- --- .-. .-.. -..'}`);
console.log(`  - Round-Trip:   ${morseDec.digest === morseInput}`);

console.log('\n--- [4/4] STRUCTURED TOKEN FAMILY ---');

// JWT (RFC 7519 HS256)
console.log('• JWT (RFC 7519 HS256 Structured Token):');
const jwtPayload = JSON.stringify({ sub: '1234567890', name: 'Alice', admin: true });
const jwtEnc = jwtEncodePlugin.compute(jwtPayload);
const jwtDec = jwtDecodePlugin.compute(jwtEnc.digest);
const verifyStep = jwtDec.steps.find((s) => s.id === 'jwt-decode-verify');
console.log(`  - Input Payload: ${jwtPayload}`);
console.log(`  - Generated JWT: "${jwtEnc.digest}" (${jwtEnc.steps.length} steps)`);
console.log(`  - Segments:      Header.${jwtEnc.digest.split('.')[0]} | Payload.${jwtEnc.digest.split('.')[1]} | Sig.${jwtEnc.digest.split('.')[2]}`);
console.log(`  - Signature Auth: Valid Match = ${verifyStep?.data.jwt.isSignatureValid === true}`);
