import { describe, it, expect } from 'vitest';
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
} from '../../src/algorithms/encoding';

describe('Encoding Algorithms Test Suite', () => {
  describe('RFC 4648 Base64 & Base64URL', () => {
    const rfc4648Vectors = [
      { plain: '', b64: '', b32: '', b16: '' },
      { plain: 'f', b64: 'Zg==', b32: 'MY======', b16: '66' },
      { plain: 'fo', b64: 'Zm8=', b32: 'MZXQ====', b16: '666F' },
      { plain: 'foo', b64: 'Zm9v', b32: 'MZXW6===', b16: '666F6F' },
      { plain: 'foob', b64: 'Zm9vYg==', b32: 'MZXW6YQ=', b16: '666F6F62' },
      { plain: 'fooba', b64: 'Zm9vYmE=', b32: 'MZXW6YTB', b16: '666F6F6261' },
      { plain: 'foobar', b64: 'Zm9vYmFy', b32: 'MZXW6YTBOI======', b16: '666F6F626172' },
    ];

    it('encodes official RFC 4648 Base64 test vectors', () => {
      for (const vec of rfc4648Vectors) {
        const { digest, steps } = base64EncodePlugin.compute(vec.plain);
        expect(digest).toBe(vec.b64);
        expect(steps.length).toBeGreaterThan(0);
      }
    });

    it('decodes official RFC 4648 Base64 test vectors', () => {
      for (const vec of rfc4648Vectors) {
        if (vec.b64 === '') continue;
        const { digest } = base64DecodePlugin.compute(vec.b64);
        expect(digest).toBe(vec.plain);
      }
    });

    it('handles Base64URL with (-) and (_) and round-trips cleanly', () => {
      const input = 'Subject?>~_123';
      const { digest: enc } = base64UrlEncodePlugin.compute(input);
      expect(enc).not.toContain('+');
      expect(enc).not.toContain('/');
      expect(enc).not.toContain('=');

      const { digest: dec } = base64UrlDecodePlugin.compute(enc);
      expect(dec).toBe(input);
    });
  });

  describe('RFC 4648 Base32', () => {
    it('encodes official RFC 4648 Base32 test vectors', () => {
      const vectors = [
        { plain: 'f', b32: 'MY======' },
        { plain: 'fo', b32: 'MZXQ====' },
        { plain: 'foo', b32: 'MZXW6===' },
        { plain: 'foob', b32: 'MZXW6YQ=' },
        { plain: 'fooba', b32: 'MZXW6YTB' },
        { plain: 'foobar', b32: 'MZXW6YTBOI======' },
      ];

      for (const vec of vectors) {
        const { digest, steps } = base32EncodePlugin.compute(vec.plain);
        expect(digest).toBe(vec.b32);
        expect(steps.length).toBeGreaterThan(0);
      }
    });

    it('decodes official RFC 4648 Base32 test vectors', () => {
      const vectors = [
        { plain: 'f', b32: 'MY======' },
        { plain: 'fo', b32: 'MZXQ====' },
        { plain: 'foo', b32: 'MZXW6===' },
        { plain: 'foob', b32: 'MZXW6YQ=' },
        { plain: 'fooba', b32: 'MZXW6YTB' },
        { plain: 'foobar', b32: 'MZXW6YTBOI======' },
      ];

      for (const vec of vectors) {
        const { digest } = base32DecodePlugin.compute(vec.b32);
        expect(digest).toBe(vec.plain);
      }
    });
  });

  describe('RFC 4648 Base16 / Hexadecimal', () => {
    it('encodes official RFC 4648 Base16 test vectors', () => {
      const vectors = [
        { plain: 'f', b16: '66' },
        { plain: 'fo', b16: '666F' },
        { plain: 'foo', b16: '666F6F' },
        { plain: 'foob', b16: '666F6F62' },
        { plain: 'fooba', b16: '666F6F6261' },
        { plain: 'foobar', b16: '666F6F626172' },
      ];

      for (const vec of vectors) {
        const { digest, steps } = base16EncodePlugin.compute(vec.plain);
        expect(digest).toBe(vec.b16);
        expect(steps.length).toBeGreaterThan(0);
      }
    });

    it('decodes official RFC 4648 Base16 test vectors', () => {
      const vectors = [
        { plain: 'f', b16: '66' },
        { plain: 'fo', b16: '666F' },
        { plain: 'foo', b16: '666F6F' },
        { plain: 'foob', b16: '666F6F62' },
        { plain: 'fooba', b16: '666F6F6261' },
        { plain: 'foobar', b16: '666F6F626172' },
      ];

      for (const vec of vectors) {
        const { digest } = base16DecodePlugin.compute(vec.b16);
        expect(digest).toBe(vec.plain);
      }
    });
  });

  describe('Base58 (Bitcoin Reference Standard)', () => {
    it('encodes Bitcoin Base58 test vectors correctly', () => {
      const vectors = [
        { plain: 'Hello World', b58: 'JxF12TrwUP45BMd' },
        { plain: 'The quick brown fox jumps over the lazy dog', b58: '7DdiPPYtxLjCD3wA1po2rvZHTDYjkZYiEtazrfiwJcwnKCizhGFhBGHeRdx' },
        { plain: '1234567890', b58: '3mJr7AoUCHxNqd' },
      ];

      for (const vec of vectors) {
        const { digest, steps } = base58EncodePlugin.compute(vec.plain);
        expect(digest).toBe(vec.b58);
        expect(steps.length).toBeGreaterThan(0);
      }
    });

    it('decodes Base58 back to original text cleanly', () => {
      const vectors = [
        { plain: 'Hello World', b58: 'JxF12TrwUP45BMd' },
        { plain: 'The quick brown fox jumps over the lazy dog', b58: '7DdiPPYtxLjCD3wA1po2rvZHTDYjkZYiEtazrfiwJcwnKCizhGFhBGHeRdx' },
      ];

      for (const vec of vectors) {
        const { digest } = base58DecodePlugin.compute(vec.b58);
        expect(digest).toBe(vec.plain);
      }
    });
  });

  describe('RFC 3986 URL / Percent-Encoding', () => {
    it('encodes unreserved characters as pass-through and reserved as %XX', () => {
      const { digest: res1 } = urlEncodePlugin.compute('Hello World!');
      expect(res1).toBe('Hello%20World%21');

      const { digest: res2 } = urlEncodePlugin.compute('https://example.com/api?q=crypto&tag=1#top');
      expect(res2).toBe('https%3A%2F%2Fexample.com%2Fapi%3Fq%3Dcrypto%26tag%3D1%23top');
    });

    it('decodes percent-encoded URIs back to plain text', () => {
      const { digest } = urlDecodePlugin.compute('Hello%20World%21');
      expect(digest).toBe('Hello World!');
    });
  });

  describe('UTF-8 & UTF-16 Unicode Encodings', () => {
    it('encodes multi-byte Unicode code points into UTF-8 hex sequences', () => {
      // 'A' -> 0x41 (1 byte)
      // 'é' -> 0xC3 0xA9 (2 bytes)
      // '€' -> 0xE2 0x82 0xAC (3 bytes)
      // '🚀' (U+1F680) -> 0xF0 0x9F 0x9A 0x80 (4 bytes)
      const { digest: utf8Hex } = utf8EncodePlugin.compute('Aé€🚀');
      expect(utf8Hex.toLowerCase()).toBe('41c3a9e282acf09f9a80');

      const { digest: decoded } = utf8DecodePlugin.compute('41c3a9e282acf09f9a80');
      expect(decoded).toBe('Aé€🚀');
    });

    it('encodes astral plane characters into UTF-16 surrogate pairs', () => {
      // '🚀' (U+1F680) -> High Surrogate D83D, Low Surrogate DE80
      const { digest: utf16Hex } = utf16EncodePlugin.compute('🚀');
      expect(utf16Hex.toUpperCase()).toBe('D83DDE80');

      const { digest: decoded } = utf16DecodePlugin.compute('D83DDE80');
      expect(decoded).toBe('🚀');
    });
  });
});
