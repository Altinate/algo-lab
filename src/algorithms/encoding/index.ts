/**
 * Encoding Algorithms Aggregation
 */

import {
  base64EncodePlugin,
  base64DecodePlugin,
  base64UrlEncodePlugin,
  base64UrlDecodePlugin,
} from './base64';
import { base32EncodePlugin, base32DecodePlugin } from './base32';
import { base16EncodePlugin, base16DecodePlugin } from './base16';
import { base58EncodePlugin, base58DecodePlugin } from './base58';
import { base85EncodePlugin, base85DecodePlugin } from './base85';
import { base36EncodePlugin, base36DecodePlugin } from './base36';
import { urlEncodePlugin, urlDecodePlugin } from './url';
import {
  utf8EncodePlugin,
  utf8DecodePlugin,
  utf16EncodePlugin,
  utf16DecodePlugin,
} from './utf';
import { punycodeEncodePlugin, punycodeDecodePlugin } from './punycode';
import { quotedPrintableEncodePlugin, quotedPrintableDecodePlugin } from './quoted-printable';
import { morseEncodePlugin, morseDecodePlugin } from './morse';
import { jwtEncodePlugin, jwtDecodePlugin } from './jwt';

export const encodingPlugins = [
  // Positional/Radix Family
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
  base85EncodePlugin,
  base85DecodePlugin,
  base36EncodePlugin,
  base36DecodePlugin,

  // Text/Character Family
  urlEncodePlugin,
  urlDecodePlugin,
  utf8EncodePlugin,
  utf8DecodePlugin,
  utf16EncodePlugin,
  utf16DecodePlugin,
  punycodeEncodePlugin,
  punycodeDecodePlugin,
  quotedPrintableEncodePlugin,
  quotedPrintableDecodePlugin,

  // Signal/Historical Family
  morseEncodePlugin,
  morseDecodePlugin,

  // Structured Token Family
  jwtEncodePlugin,
  jwtDecodePlugin,
];

export {
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
  base85EncodePlugin,
  base85DecodePlugin,
  base36EncodePlugin,
  base36DecodePlugin,
  urlEncodePlugin,
  urlDecodePlugin,
  utf8EncodePlugin,
  utf8DecodePlugin,
  utf16EncodePlugin,
  utf16DecodePlugin,
  punycodeEncodePlugin,
  punycodeDecodePlugin,
  quotedPrintableEncodePlugin,
  quotedPrintableDecodePlugin,
  morseEncodePlugin,
  morseDecodePlugin,
  jwtEncodePlugin,
  jwtDecodePlugin,
};
