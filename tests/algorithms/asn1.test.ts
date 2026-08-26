import { describe, it, expect } from 'vitest';
import { parseAsn1, decodeOid, decodeInteger, decodeTime } from '../../src/algorithms/tools/format-parsing/asn1';
import { asn1Plugin } from '../../src/algorithms/tools/format-parsing/asn1-plugin';
import { parsePem } from '../../src/algorithms/tools/format-parsing/pem';
import { PRESETS } from '../../src/algorithms/tools/format-parsing/presets';

describe('ASN.1 DER Parser & OID Engine', () => {
  it('correctly decodes standard OID byte arrays', () => {
    // 1.2.840.113549.1.1.1 (rsaEncryption): 06 09 2A 86 48 86 F7 0D 01 01 01
    const rsaOidBytes = new Uint8Array([0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01]);
    expect(decodeOid(rsaOidBytes)).toBe('1.2.840.113549.1.1.1');
  });

  it('correctly decodes BigInt integers', () => {
    const intBytes = new Uint8Array([0x01, 0x00, 0x01]); // 65537
    const decoded = decodeInteger(intBytes);
    expect(decoded.bigint).toBe(65537n);
    expect(decoded.decimalStr).toBe('65537');
  });

  it('correctly decodes UTCTime timestamps', () => {
    const timeBytes = new TextEncoder().encode('260101000000Z');
    const iso = decodeTime(timeBytes, true);
    expect(iso).toBe('2026-01-01T00:00:00Z');
  });

  it('recursively decomposes certificate DER into structured TLV tree', () => {
    const pem = parsePem(PRESETS[1].content);
    const root = parseAsn1(pem.derBytes, 0);
    expect(root.tagName).toBe('SEQUENCE');
    expect(root.children).toBeDefined();
    expect(root.children!.length).toBeGreaterThanOrEqual(3);
  });

  it('runs asn1Plugin computation and returns structured AST steps', () => {
    const res = asn1Plugin.compute(PRESETS[1].content);
    expect(res.steps.length).toBe(3);
    expect(res.digest).toBeTruthy();
  });
});
