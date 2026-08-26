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

  it('correctly runs x509Plugin computation generating 5 inspection steps', () => {
    const res = x509Plugin.compute(PRESETS[1].content);
    expect(res.steps.length).toBe(5);
    expect(res.digest).toBeTruthy();
    expect(res.steps[0].visualizationType).toBe('asn1-structure');
  });
});
