/**
 * RFC 7519 JSON Web Token (JWT) HS256 Encoding & Decoding Engine & Plugins
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { stringToBytes, bytesToString, bytesToHex, hexToBytes, add32 } from '../../utils';
import { encodeBase64, decodeBase64 } from '../base64';
import { K, H_256 } from '../../sha256/constants';
import { sigma0, sigma1, bigSigma0, bigSigma1, ch, maj } from '../../sha256/operations';

export interface JwtTokenData {
  encodingType: 'JWT';
  operation: 'encode' | 'decode';
  headerJson: string;
  headerB64: string;
  payloadJson: string;
  payloadB64: string;
  signatureB64: string;
  algorithm: string;
  secretKey: string;
  signingInput: string;
  computedSignatureB64?: string;
  isSignatureValid?: boolean;
}

export function rawSha256(inputBytes: Uint8Array): Uint8Array {
  const msgBitLen = inputBytes.length * 8;
  const msgBytes = inputBytes.length;
  let paddingZeroBytes = 64 - ((msgBytes + 1 + 8) % 64);
  if (paddingZeroBytes === 64) paddingZeroBytes = 0;
  const totalLen = msgBytes + 1 + paddingZeroBytes + 8;

  const paddedBytes = new Uint8Array(totalLen);
  paddedBytes.set(inputBytes);
  paddedBytes[msgBytes] = 0x80;

  const bitLenHi = Math.floor(msgBitLen / 0x100000000);
  const bitLenLo = msgBitLen >>> 0;
  const dv = new DataView(paddedBytes.buffer);
  dv.setUint32(totalLen - 8, bitLenHi, false);
  dv.setUint32(totalLen - 4, bitLenLo, false);

  const numBlocks = totalLen / 64;
  const H = H_256.slice();

  for (let b = 0; b < numBlocks; b++) {
    const blockView = new DataView(paddedBytes.buffer, b * 64, 64);
    const W = new Uint32Array(64);
    for (let i = 0; i < 16; i++) W[i] = blockView.getUint32(i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = sigma0(W[i - 15]);
      const s1 = sigma1(W[i - 2]);
      W[i] = add32(W[i - 16], s0, W[i - 7], s1);
    }

    let a = H[0], b_ = H[1], c = H[2], d = H[3];
    let e = H[4], f = H[5], g = H[6], h = H[7];

    for (let i = 0; i < 64; i++) {
      const S1 = bigSigma1(e);
      const chVal = ch(e, f, g);
      const T1 = add32(h, S1, chVal, K[i], W[i]);
      const S0 = bigSigma0(a);
      const majVal = maj(a, b_, c);
      const T2 = add32(S0, majVal);

      h = g;
      g = f;
      f = e;
      e = add32(d, T1);
      d = c;
      c = b_;
      b_ = a;
      a = add32(T1, T2);
    }

    H[0] = add32(H[0], a);
    H[1] = add32(H[1], b_);
    H[2] = add32(H[2], c);
    H[3] = add32(H[3], d);
    H[4] = add32(H[4], e);
    H[5] = add32(H[5], f);
    H[6] = add32(H[6], g);
    H[7] = add32(H[7], h);
  }

  const out = new Uint8Array(32);
  const outDv = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) {
    outDv.setUint32(i * 4, H[i], false);
  }
  return out;
}

export function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  let keyBlock = new Uint8Array(blockSize);

  if (key.length > blockSize) {
    keyBlock.set(rawSha256(key));
  } else {
    keyBlock.set(key);
  }

  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    ipad[i] = keyBlock[i] ^ 0x36;
    opad[i] = keyBlock[i] ^ 0x5c;
  }

  const innerMsg = new Uint8Array(blockSize + message.length);
  innerMsg.set(ipad);
  innerMsg.set(message, blockSize);
  const innerHash = rawSha256(innerMsg);

  const outerMsg = new Uint8Array(blockSize + 32);
  outerMsg.set(opad);
  outerMsg.set(innerHash, blockSize);
  return rawSha256(outerMsg);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;
    const buf = (b0 << 16) | ((b1 ?? 0) << 8) | (b2 ?? 0);
    out += alphabet[(buf >> 18) & 63];
    out += alphabet[(buf >> 12) & 63];
    if (b1 !== undefined) out += alphabet[(buf >> 6) & 63];
    if (b2 !== undefined) out += alphabet[buf & 63];
  }
  return out;
}

export function encodeJwt(input: string): ComputationResult {
  const steps: ComputationStep[] = [];

  let headerObj = { alg: 'HS256', typ: 'JWT' };
  let payloadObj: any = { sub: '1234567890', name: 'Alice', iat: 1516239022 };
  let secretKey = 'your-256-bit-secret';

  // Try parsing user input as structured JSON or raw payload string
  if (input.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(input);
      if (parsed.header && parsed.payload) {
        headerObj = parsed.header;
        payloadObj = parsed.payload;
        if (parsed.secret) secretKey = parsed.secret;
      } else {
        payloadObj = parsed;
      }
    } catch {
      payloadObj = { data: input };
    }
  } else if (input.trim().length > 0) {
    payloadObj = { data: input };
  }

  const headerJson = JSON.stringify(headerObj);
  const payloadJson = JSON.stringify(payloadObj);

  const headerB64 = encodeBase64(headerJson, true).digest;
  const payloadB64 = encodeBase64(payloadJson, true).digest;
  const signingInput = `${headerB64}.${payloadB64}`;

  steps.push({
    id: 'jwt-encode-segments',
    title: 'JWT Header & Payload Base64URL Serialization',
    phase: 'INITIALIZATION',
    description: `Serialized Header JSON (${headerJson.length} bytes) and Payload JSON (${payloadJson.length} bytes) into URL-safe Base64 strings.\nSigning input: "${signingInput}".`,
    visualizationType: 'binary-transform',
    data: {
      jwt: {
        encodingType: 'JWT',
        operation: 'encode',
        headerJson,
        headerB64,
        payloadJson,
        payloadB64,
        signatureB64: '',
        algorithm: headerObj.alg || 'HS256',
        secretKey,
        signingInput,
      } as JwtTokenData,
    },
  });

  const sigBytes = hmacSha256(stringToBytes(secretKey), stringToBytes(signingInput));
  const signatureB64 = bytesToBase64Url(sigBytes);
  const jwtToken = `${signingInput}.${signatureB64}`;

  steps.push({
    id: 'jwt-encode-signature',
    title: `HMAC-SHA256 Signature Generation (${headerObj.alg})`,
    phase: 'SIGNATURE GENERATION',
    description: `Computed HMAC-SHA256(key="${secretKey}", data="${signingInput}").\nOutput raw 256-bit MAC: 0x${bytesToHex(sigBytes)} → Base64URL: "${signatureB64}".`,
    visualizationType: 'binary-transform',
    data: {
      jwt: {
        encodingType: 'JWT',
        operation: 'encode',
        headerJson,
        headerB64,
        payloadJson,
        payloadB64,
        signatureB64,
        algorithm: headerObj.alg || 'HS256',
        secretKey,
        signingInput,
        computedSignatureB64: signatureB64,
        isSignatureValid: true,
      } as JwtTokenData,
    },
  });

  steps.push({
    id: 'jwt-encode-complete',
    title: 'JWT Token Assembled',
    phase: 'COMPLETE',
    description: `Constructed RFC 7519 JSON Web Token with 3 segments separated by dots.\nToken: "${jwtToken}".`,
    visualizationType: 'binary-transform',
    data: {
      bytes: jwtToken.length,
      hex: bytesToHex(stringToBytes(jwtToken)),
      input,
      output: jwtToken,
      jwt: {
        encodingType: 'JWT',
        operation: 'encode',
        headerJson,
        headerB64,
        payloadJson,
        payloadB64,
        signatureB64,
        algorithm: headerObj.alg || 'HS256',
        secretKey,
        signingInput,
        computedSignatureB64: signatureB64,
        isSignatureValid: true,
      } as JwtTokenData,
    },
  });

  return { digest: jwtToken, steps };
}

export function decodeJwt(input: string, secretKey = 'your-256-bit-secret'): ComputationResult {
  const steps: ComputationStep[] = [];
  const clean = input.trim();
  const parts = clean.split('.');

  const headerB64 = parts[0] || '';
  const payloadB64 = parts[1] || '';
  const signatureB64 = parts[2] || '';

  const headerJson = decodeBase64(headerB64, true).digest || '{}';
  const payloadJson = decodeBase64(payloadB64, true).digest || '{}';

  let alg = 'HS256';
  try {
    const parsed = JSON.parse(headerJson);
    if (parsed.alg) alg = parsed.alg;
  } catch {}

  const signingInput = `${headerB64}.${payloadB64}`;

  steps.push({
    id: 'jwt-decode-split',
    title: 'JWT Segment Extraction & JSON Parsing',
    phase: 'INITIALIZATION',
    description: `Split token into 3 parts: Header (${headerB64.length} chars), Payload (${payloadB64.length} chars), Signature (${signatureB64.length} chars).\nDecoded Header: ${headerJson}\nDecoded Payload: ${payloadJson}`,
    visualizationType: 'binary-transform',
    data: {
      jwt: {
        encodingType: 'JWT',
        operation: 'decode',
        headerJson,
        headerB64,
        payloadJson,
        payloadB64,
        signatureB64,
        algorithm: alg,
        secretKey,
        signingInput,
      } as JwtTokenData,
    },
  });

  const sigBytes = hmacSha256(stringToBytes(secretKey), stringToBytes(signingInput));
  const computedSignatureB64 = bytesToBase64Url(sigBytes);
  const isValid = signatureB64 === computedSignatureB64;

  steps.push({
    id: 'jwt-decode-verify',
    title: `Signature Verification (${alg}) — ${isValid ? 'VALID MATCH' : 'MISMATCH'}`,
    phase: 'SIGNATURE VERIFICATION',
    description: `Recomputed HMAC-SHA256(key="${secretKey}", data="${signingInput}") → "${computedSignatureB64}".\nToken Signature: "${signatureB64}" → Verification: ${isValid ? 'VERIFIED' : 'FAILED'}.`,
    visualizationType: 'binary-transform',
    data: {
      jwt: {
        encodingType: 'JWT',
        operation: 'decode',
        headerJson,
        headerB64,
        payloadJson,
        payloadB64,
        signatureB64,
        algorithm: alg,
        secretKey,
        signingInput,
        computedSignatureB64,
        isSignatureValid: isValid,
      } as JwtTokenData,
    },
  });

  let headerFormatted: any = {};
  let payloadFormatted: any = {};
  try {
    headerFormatted = JSON.parse(headerJson || '{}');
  } catch {
    headerFormatted = { raw: headerJson };
  }
  try {
    payloadFormatted = JSON.parse(payloadJson || '{}');
  } catch {
    payloadFormatted = { raw: payloadJson };
  }

  const decodedFormatted = JSON.stringify(
    {
      header: headerFormatted,
      payload: payloadFormatted,
      verified: isValid,
    },
    null,
    2,
  );

  steps.push({
    id: 'jwt-decode-complete',
    title: 'JWT Token Decoded',
    phase: 'COMPLETE',
    description: `Decoded payload: "${payloadJson}". Signature Status: ${isValid ? 'VALID' : 'INVALID'}.`,
    visualizationType: 'binary-transform',
    data: {
      bytes: clean.length,
      hex: bytesToHex(stringToBytes(clean)),
      input: clean,
      output: decodedFormatted,
      jwt: {
        encodingType: 'JWT',
        operation: 'decode',
        headerJson,
        headerB64,
        payloadJson,
        payloadB64,
        signatureB64,
        algorithm: alg,
        secretKey,
        signingInput,
        computedSignatureB64,
        isSignatureValid: isValid,
      } as JwtTokenData,
    },
  });

  return { digest: payloadJson, steps };
}

export const jwtEncodePlugin: AlgorithmPlugin = {
  info: {
    name: 'JWT (Encode)',
    family: 'Structured Token',
    category: 'encoding',
    digestSize: 0,
    blockSize: 0,
    description: 'RFC 7519 JSON Web Token (JWT) HS256 HMAC-signed token generation.',
    useCases: ['Stateless API authentication', 'OAuth 2.0 / OpenID Connect ID tokens', 'Distributed session tokens'],
    security: 'secure',
    year: 2015,
    designers: ['Jones, Bradley, Sakimura (IETF RFC 7519)'],
    direction: 'encrypt',
  },
  compute(input: string): ComputationResult {
    return encodeJwt(input);
  },
};

export const jwtDecodePlugin: AlgorithmPlugin = {
  info: {
    name: 'JWT (Decode)',
    family: 'Structured Token',
    category: 'encoding',
    digestSize: 0,
    blockSize: 0,
    description: 'RFC 7519 JSON Web Token (JWT) segment extraction and HS256 HMAC signature verification.',
    useCases: ['API gateway token verification', 'Claims inspection & RBAC policy evaluation', 'Session validation'],
    security: 'secure',
    year: 2015,
    designers: ['Jones, Bradley, Sakimura (IETF RFC 7519)'],
    direction: 'decrypt',
  },
  compute(input: string): ComputationResult {
    return decodeJwt(input);
  },
};
