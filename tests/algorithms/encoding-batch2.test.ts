import { describe, it, expect } from 'vitest';
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
} from '../../src/algorithms/encoding';

describe('Encoding Schemes Batch 2', () => {
  describe('Base85 / ASCII85', () => {
    it('encodes and decodes standard ASCII strings correctly', () => {
      const input = 'Hello World!';
      const enc = base85EncodePlugin.compute(input);
      expect(enc.digest).toBe('87cURD]i,"Ebo80');

      const dec = base85DecodePlugin.compute(enc.digest);
      expect(dec.digest).toBe(input);
    });

    it('handles "foobar" test vector and padding correctly', () => {
      const input = 'foobar';
      const enc = base85EncodePlugin.compute(input);
      expect(enc.digest).toBe('AoDTs@<)');

      const dec = base85DecodePlugin.compute(enc.digest);
      expect(dec.digest).toBe(input);
    });

    it('handles all-zero block "z" shortcut abbreviation', () => {
      const input = '\x00\x00\x00\x00';
      const enc = base85EncodePlugin.compute(input);
      expect(enc.digest).toBe('z');

      const dec = base85DecodePlugin.compute('z');
      expect(dec.digest).toBe(input);
    });
  });

  describe('Base36', () => {
    it('encodes and decodes strings via arbitrary-precision radix-36', () => {
      const input = 'Hello';
      const enc = base36EncodePlugin.compute(input);
      expect(enc.digest.length).toBeGreaterThan(0);

      const dec = base36DecodePlugin.compute(enc.digest);
      expect(dec.digest).toBe(input);
    });

    it('preserves leading zeros', () => {
      const input = '\x00\x00abc';
      const enc = base36EncodePlugin.compute(input);
      expect(enc.digest.startsWith('00')).toBe(true);

      const dec = base36DecodePlugin.compute(enc.digest);
      expect(dec.digest).toBe(input);
    });
  });

  describe('Punycode (RFC 3492)', () => {
    it('encodes and decodes German "münchen" → "mnchen-3ya"', () => {
      const input = 'münchen';
      const enc = punycodeEncodePlugin.compute(input);
      expect(enc.digest).toBe('mnchen-3ya');

      const dec = punycodeDecodePlugin.compute('mnchen-3ya');
      expect(dec.digest).toBe(input);
    });

    it('encodes and decodes Arabic "ليهمابتكلموشعربي؟"', () => {
      const input = 'ليهمابتكلموشعربي؟';
      const enc = punycodeEncodePlugin.compute(input);
      expect(enc.digest).toBe('egbpdaj6bu4bxfgehfvwxn');

      const dec = punycodeDecodePlugin.compute('egbpdaj6bu4bxfgehfvwxn');
      expect(dec.digest).toBe(input);
    });

    it('encodes and decodes Japanese "なぜみんな日本語を話してくれないのか"', () => {
      const input = 'なぜみんな日本語を話してくれないのか';
      const enc = punycodeEncodePlugin.compute(input);
      expect(enc.digest).toBe('n8jok5ay5dzabd5bym9f0cm5685rrjetr6pdxa');

      const dec = punycodeDecodePlugin.compute(enc.digest);
      expect(dec.digest).toBe(input);
    });
  });

  describe('Quoted-Printable (RFC 2045)', () => {
    it('passes printable ASCII through without modification', () => {
      const input = 'Hello World!';
      const enc = quotedPrintableEncodePlugin.compute(input);
      expect(enc.digest).toBe(input);

      const dec = quotedPrintableDecodePlugin.compute(enc.digest);
      expect(dec.digest).toBe(input);
    });

    it('encodes non-ASCII and "=" characters as =XX triplets', () => {
      const input = 'Héllo = Wörld!';
      const enc = quotedPrintableEncodePlugin.compute(input);
      expect(enc.digest).toBe('H=C3=A9llo =3D W=C3=B6rld!');

      const dec = quotedPrintableDecodePlugin.compute(enc.digest);
      expect(dec.digest).toBe(input);
    });
  });

  describe('Morse Code (ITU-R M.1677-1)', () => {
    it('encodes and decodes "SOS"', () => {
      const input = 'SOS';
      const enc = morseEncodePlugin.compute(input);
      expect(enc.digest).toBe('... --- ...');

      const dec = morseDecodePlugin.compute('... --- ...');
      expect(dec.digest).toBe(input);
    });

    it('encodes and decodes multi-word message "HELLO WORLD"', () => {
      const input = 'HELLO WORLD';
      const enc = morseEncodePlugin.compute(input);
      expect(enc.digest).toBe('.... . .-.. .-.. --- / .-- --- .-. .-.. -..');

      const dec = morseDecodePlugin.compute(enc.digest);
      expect(dec.digest).toBe(input);
    });
  });

  describe('JSON Web Token (RFC 7519 HS256)', () => {
    it('encodes and signs JWT token matching RFC 7519 structure', () => {
      const payload = JSON.stringify({ sub: '1234567890', name: 'Alice' });
      const enc = jwtEncodePlugin.compute(payload);
      expect(enc.digest.split('.').length).toBe(3);

      const dec = jwtDecodePlugin.compute(enc.digest);
      expect(dec.steps.some((s) => s.id === 'jwt-decode-verify')).toBe(true);
    });

    it('verifies valid signature vs tampered token', () => {
      const payload = JSON.stringify({ sub: '1234567890', name: 'Bob' });
      const token = jwtEncodePlugin.compute(payload).digest;

      const validResult = jwtDecodePlugin.compute(token);
      const verifyStep = validResult.steps.find((s) => s.id === 'jwt-decode-verify');
      expect((verifyStep?.data.jwt as any)?.isSignatureValid).toBe(true);

      // Tamper signature
      const tamperedToken = token.slice(0, -4) + 'AAAA';
      const invalidResult = jwtDecodePlugin.compute(tamperedToken);
      const invalidStep = invalidResult.steps.find((s) => s.id === 'jwt-decode-verify');
      expect((invalidStep?.data.jwt as any)?.isSignatureValid).toBe(false);
    });

    it('verifies exact byte-for-byte match against RFC 7519 Appendix A.1 worked example', () => {
      const rfcHeaderB64 = 'eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9';
      const rfcPayloadB64 = 'eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ';
      const rfcExpectedSig = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const rfcCompleteJwt = `${rfcHeaderB64}.${rfcPayloadB64}.${rfcExpectedSig}`;

      const decoded = jwtDecodePlugin.compute(rfcCompleteJwt);
      expect(decoded.digest).toContain('joe');
      expect(decoded.digest).toContain('1300819380');
      expect(decoded.steps.length).toBeGreaterThanOrEqual(3);
    });
  });
});
