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
import { urlEncodePlugin, urlDecodePlugin } from './url';
import {
  utf8EncodePlugin,
  utf8DecodePlugin,
  utf16EncodePlugin,
  utf16DecodePlugin,
} from './utf';

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

  // Text/Character Family
  urlEncodePlugin,
  urlDecodePlugin,
  utf8EncodePlugin,
  utf8DecodePlugin,
  utf16EncodePlugin,
  utf16DecodePlugin,
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
  urlEncodePlugin,
  urlDecodePlugin,
  utf8EncodePlugin,
  utf8DecodePlugin,
  utf16EncodePlugin,
  utf16DecodePlugin,
};
