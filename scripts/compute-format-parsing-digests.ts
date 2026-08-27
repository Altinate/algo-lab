import { parseX509Certificate } from '../src/algorithms/tools/format-parsing/x509';
import { parsePem } from '../src/algorithms/tools/format-parsing/pem';
import { parseAsn1 } from '../src/algorithms/tools/format-parsing/asn1';
import { parseJwk, computeJwkThumbprint } from '../src/algorithms/tools/format-parsing/jwk';
import { PRESETS } from '../src/algorithms/tools/format-parsing/presets';
import { X509Certificate } from 'crypto';
import fs from 'fs';

console.log('=== CRYPTOSCOPE AUTHORITATIVE FORMAT & PARSING TOOLS AUDIT ===\n');

// ---------------------------------------------------------------------------
// 1. REAL-WORLD X.509 CERTIFICATE 1: Let\'s Encrypt ISRG Root X1 (Official)
// ---------------------------------------------------------------------------
console.log('--- 1. Real Certificate #1: Let\'s Encrypt ISRG Root X1 (Official Root CA) ---');
console.log('Source: https://letsencrypt.org/certs/isrgrootx1.pem (RSA 4096 / SHA-256)');
const isrgPem = PRESETS[0].content;
const isrgOur = parseX509Certificate(isrgPem);
const isrgNode = new X509Certificate(isrgPem);

console.log('[Subject DN]');
console.log('  Our Parser  :', isrgOur.subject.dn);
console.log('  Node crypto :', isrgNode.subject.replace(/\n/g, ', '));
console.log('  Match       :', isrgOur.subject.dn === isrgNode.subject.replace(/\n/g, ', '));

console.log('[Issuer DN]');
console.log('  Our Parser  :', isrgOur.issuer.dn);
console.log('  Node crypto :', isrgNode.issuer.replace(/\n/g, ', '));
console.log('  Match       :', isrgOur.issuer.dn === isrgNode.issuer.replace(/\n/g, ', '));

console.log('[Validity Window]');
console.log('  Our Not Before :', isrgOur.validity.notBeforeIso);
console.log('  Node Valid From:', isrgNode.validFrom);
console.log('  Our Not After  :', isrgOur.validity.notAfterIso);
console.log('  Node Valid To  :', isrgNode.validTo);

console.log('[Serial Number]');
console.log('  Our Serial Hex :', isrgOur.serialNumberHex);
console.log('  Node Serial    :', isrgNode.serialNumber);

console.log('[Key Info & Self-Signature]');
console.log('  Algorithm      :', isrgOur.signatureAlgorithmName);
console.log('  Key Type & Size:', isrgOur.subjectPublicKeyInfo.keyType, isrgOur.subjectPublicKeyInfo.keySizeBits, 'bits');
console.log('  Is CA          :', isrgOur.isCa);
console.log('  Is Self-Signed :', isrgOur.isSelfSigned);
console.log('  Signature Auth :', isrgOur.signatureVerificationMessage);
console.log('  Signature Valid:', isrgOur.signatureVerified);

// ---------------------------------------------------------------------------
// 2. REAL-WORLD X.509 CERTIFICATE 2: Google Trust Services Root R1 (Official)
// ---------------------------------------------------------------------------
console.log('\n--- 2. Real Certificate #2: Google Trust Services Root R1 (GTS Root R1) ---');
console.log('Source: https://pki.goog/repo/certs/gtsr1.pem (RSA 4096 / SHA-384)');
let gtsPem = '';
try {
  gtsPem = fs.readFileSync('/tmp/gts_root_r1.pem', 'utf8');
} catch {
  gtsPem = '';
}
if (gtsPem) {
  const gtsOur = parseX509Certificate(gtsPem);
  const gtsNode = new X509Certificate(gtsPem);

  console.log('[Subject DN]');
  console.log('  Our Parser  :', gtsOur.subject.dn);
  console.log('  Node crypto :', gtsNode.subject.replace(/\n/g, ', '));
  console.log('  Match       :', gtsOur.subject.dn === gtsNode.subject.replace(/\n/g, ', '));

  console.log('[Issuer DN]');
  console.log('  Our Parser  :', gtsOur.issuer.dn);
  console.log('  Node crypto :', gtsNode.issuer.replace(/\n/g, ', '));
  console.log('  Match       :', gtsOur.issuer.dn === gtsNode.issuer.replace(/\n/g, ', '));

  console.log('[Validity Window]');
  console.log('  Our Not Before :', gtsOur.validity.notBeforeIso);
  console.log('  Node Valid From:', gtsNode.validFrom);
  console.log('  Our Not After  :', gtsOur.validity.notAfterIso);
  console.log('  Node Valid To  :', gtsNode.validTo);

  console.log('[Serial Number]');
  console.log('  Our Serial Hex :', gtsOur.serialNumberHex);
  console.log('  Node Serial    :', gtsNode.serialNumber);

  console.log('[Key Info & Self-Signature]');
  console.log('  Algorithm      :', gtsOur.signatureAlgorithmName);
  console.log('  Key Type & Size:', gtsOur.subjectPublicKeyInfo.keyType, gtsOur.subjectPublicKeyInfo.keySizeBits, 'bits');
  console.log('  Is CA          :', gtsOur.isCa);
  console.log('  Is Self-Signed :', gtsOur.isSelfSigned);
  console.log('  Signature Auth :', gtsOur.signatureVerificationMessage);
  console.log('  Signature Valid:', gtsOur.signatureVerified);
}

// ---------------------------------------------------------------------------
// 3. REAL-WORLD X.509 CERTIFICATE 3: DigiCert Global Root G2 (Official)
// ---------------------------------------------------------------------------
console.log('\n--- 3. Real Certificate #3: DigiCert Global Root G2 (Official Root CA) ---');
console.log('Source: https://cacerts.digicert.com/DigiCertGlobalRootG2.crt.pem (RSA 2048 / SHA-256)');
let digiPem = '';
try {
  digiPem = fs.readFileSync('/tmp/digicert_root_g2.pem', 'utf8');
} catch {
  digiPem = '';
}
if (digiPem) {
  const digiOur = parseX509Certificate(digiPem);
  const digiNode = new X509Certificate(digiPem);

  console.log('[Subject DN]');
  console.log('  Our Parser  :', digiOur.subject.dn);
  console.log('  Node crypto :', digiNode.subject.replace(/\n/g, ', '));
  console.log('  Match       :', digiOur.subject.dn === digiNode.subject.replace(/\n/g, ', '));

  console.log('[Key Info & Self-Signature]');
  console.log('  Algorithm      :', digiOur.signatureAlgorithmName);
  console.log('  Key Type & Size:', digiOur.subjectPublicKeyInfo.keyType, digiOur.subjectPublicKeyInfo.keySizeBits, 'bits');
  console.log('  Is CA          :', digiOur.isCa);
  console.log('  Is Self-Signed :', digiOur.isSelfSigned);
  console.log('  Signature Auth :', digiOur.signatureVerificationMessage);
  console.log('  Signature Valid:', digiOur.signatureVerified);
}

// ---------------------------------------------------------------------------
// 4. RFC 7638 JWK THUMBPRINT AUDIT
// ---------------------------------------------------------------------------
console.log('\n--- 4. RFC 7638 JWK Thumbprint Audit ---');
const rfcSampleJwk = {
  kty: 'RSA',
  n: '0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw',
  e: 'AQAB',
  alg: 'RS256',
  kid: '2011-04-29',
};
const thumb = computeJwkThumbprint(rfcSampleJwk);
console.log('Computed RFC 7638 Canonical JSON:', thumb.canonicalJson);
console.log('Computed SHA-256 Thumbprint     :', thumb.thumbprintHex);
console.log('Computed Base64URL Thumbprint   :', thumb.thumbprintB64Url);
console.log('Expected Base64URL Thumbprint   : NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs');
console.log('Thumbprint Match                :', thumb.thumbprintB64Url === 'NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs' ? 'EXACT MATCH (100%)' : 'MISMATCH');

console.log('\n=== AUDIT COMPLETE ===');
