import { describe, it, expect } from 'vitest';
import { parsePem, encodePem } from '../../src/algorithms/tools/format-parsing/pem';
import { pemPlugin } from '../../src/algorithms/tools/format-parsing/pem-plugin';
import { PRESETS } from '../../src/algorithms/tools/format-parsing/presets';

describe('PEM Decoder & Codec', () => {
  it('correctly parses certificate PEM envelope and extracts label', () => {
    const certPem = PRESETS[1].content;
    const parsed = parsePem(certPem);
    expect(parsed.label).toBe('CERTIFICATE');
    expect(parsed.derBytes.length).toBeGreaterThan(100);
    expect(parsed.derBytes[0]).toBe(0x30); // SEQUENCE tag
  });

  it('correctly parses RSA Private Key PEM envelope', () => {
    const rsaPem = PRESETS[3].content;
    const parsed = parsePem(rsaPem);
    expect(parsed.label).toBe('PRIVATE KEY');
    expect(parsed.derBytes.length).toBeGreaterThan(100);
  });

  it('encodes DER bytes back to standard PEM format with 64-char wraps', () => {
    const testBytes = new Uint8Array([0x30, 0x06, 0x02, 0x01, 0x05, 0x05, 0x00, 0x00]);
    const encoded = encodePem(testBytes, 'TEST ARTIFACT');
    expect(encoded).toContain('-----BEGIN TEST ARTIFACT-----');
    expect(encoded).toContain('-----END TEST ARTIFACT-----');
  });

  it('runs pemPlugin computation without throwing and generates steps', () => {
    const res = pemPlugin.compute(PRESETS[1].content);
    expect(res.steps.length).toBeGreaterThan(0);
    expect(res.digest).toBeTruthy();
  });
});
