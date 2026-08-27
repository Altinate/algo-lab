import { describe, it, expect } from 'vitest';
import { parseX509Certificate } from '../../src/algorithms/tools/format-parsing/x509';
import { x509Plugin } from '../../src/algorithms/tools/format-parsing/x509-plugin';
import { PRESETS } from '../../src/algorithms/tools/format-parsing/presets';

describe('X.509 Certificate Inspector', () => {
  it('correctly parses RFC 5280 test certificate', () => {
    const cert = parseX509Certificate(PRESETS[1].content);
    expect(cert.version).toBe(3);
    expect(cert.issuer.commonName).toBe('CryptoScope');
    expect(cert.subject.commonName).toBe('CryptoScope');
    expect(cert.subjectPublicKeyInfo.keyType).toBe('RSA');
    expect(cert.subjectPublicKeyInfo.rsaParameters?.exponent).toBe(65537);
  });

  it('correctly parses ECDSA P-256 certificate', () => {
    const cert = parseX509Certificate(PRESETS[2].content);
    expect(cert.version).toBe(3);
    expect(cert.subjectPublicKeyInfo.keyType).toBe('ECDSA');
    expect(cert.subjectPublicKeyInfo.ecParameters?.curveName).toContain('prime256v1');
  });

  it('correctly parses and cryptographically authenticates real Let\'s Encrypt ISRG Root X1', () => {
    const cert = parseX509Certificate(PRESETS[0].content);
    expect(cert.version).toBe(3);
    expect(cert.issuer.commonName).toBe('ISRG Root X1');
    expect(cert.issuer.organization).toBe('Internet Security Research Group');
    expect(cert.subject.commonName).toBe('ISRG Root X1');
    expect(cert.subject.organization).toBe('Internet Security Research Group');
    expect(cert.validity.notBeforeIso).toBe('2015-06-04T11:04:38Z');
    expect(cert.validity.notAfterIso).toBe('2035-06-04T11:04:38Z');
    expect(cert.subjectPublicKeyInfo.keyType).toBe('RSA');
    expect(cert.subjectPublicKeyInfo.keySizeBits).toBe(4096);
    expect(cert.isCa).toBe(true);
    expect(cert.isSelfSigned).toBe(true);
    expect(cert.signatureVerified).toBe(true);
    expect(cert.signatureVerificationMessage).toContain('RSA-PKCS#1 v1.5 / SHA-256 Self-Signature Authenticated (Valid)');
  });

  it('correctly runs x509Plugin computation generating 5 inspection steps', () => {
    const res = x509Plugin.compute(PRESETS[1].content);
    expect(res.steps.length).toBe(5);
    expect(res.digest).toBeTruthy();
    expect(res.steps[0].visualizationType).toBe('asn1-structure');
  });
});
