import { parseX509Certificate } from '../src/algorithms/tools/format-parsing/x509';
import { parsePem } from '../src/algorithms/tools/format-parsing/pem';
import { parseAsn1 } from '../src/algorithms/tools/format-parsing/asn1';
import { parseJwk, computeJwkThumbprint } from '../src/algorithms/tools/format-parsing/jwk';
import { PRESETS } from '../src/algorithms/tools/format-parsing/presets';
import { X509Certificate } from 'crypto';

console.log('=== CRYPTOSCOPE FORMAT & PARSING TOOLS AUDIT ===\n');

// 1. PEM Parser Audit
console.log('--- 1. PEM Parser Audit ---');
for (const p of PRESETS) {
  if (p.content.startsWith('-----BEGIN')) {
    const pem = parsePem(p.content);
    console.log(`[PEM] ${p.name} -> Label: "${pem.label}", DER Bytes: ${pem.byteLength}B, First Tag: 0x${pem.derBytes[0].toString(16)}`);
  }
}

// 2. X.509 Certificate Audit & Node.js Crypto Cross-Check
console.log('\n--- 2. X.509 Certificate Audit & Node.js Cross-Check ---');
const rfcCertStr = PRESETS[1].content;
const ourCert = parseX509Certificate(rfcCertStr);
const nodeCert = new X509Certificate(rfcCertStr);

console.log('Our Subject DN:', ourCert.subject.dn);
console.log('Node Subject DN:', nodeCert.subject);
console.log('Our Issuer DN:', ourCert.issuer.dn);
console.log('Node Issuer DN:', nodeCert.issuer);
console.log('Our Valid From:', ourCert.validity.notBeforeIso);
console.log('Node Valid From:', nodeCert.validFrom);
console.log('Our Valid To:', ourCert.validity.notAfterIso);
console.log('Node Valid To:', nodeCert.validTo);
console.log('Our Serial Number:', ourCert.serialNumberHex);
console.log('Node Serial Number:', nodeCert.serialNumber);
console.log('Our Key Type:', ourCert.subjectPublicKeyInfo.keyType, ourCert.subjectPublicKeyInfo.keySizeBits, 'bits');
console.log('SANs Extracted:', ourCert.sanDnsNames);

// 3. JWK RFC 7638 Thumbprint Audit
console.log('\n--- 3. RFC 7638 JWK Thumbprint Audit ---');
const rfcSampleJwk = {
  kty: 'RSA',
  n: '0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw',
  e: 'AQAB',
  alg: 'RS256',
  kid: '2011-04-29',
};
const thumb = computeJwkThumbprint(rfcSampleJwk);
console.log('Computed RFC 7638 Canonical JSON:', thumb.canonicalJson);
console.log('Computed SHA-256 Thumbprint:', thumb.thumbprintHex);
console.log('Computed Base64URL Thumbprint:', thumb.thumbprintB64Url);
console.log('RFC 7638 Expected Thumbprint: NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs');
console.log('Thumbprint Match:', thumb.thumbprintB64Url === 'NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs' ? 'EXACT MATCH (100%)' : 'MISMATCH');

console.log('\n=== AUDIT COMPLETE ===');
