/**
 * RFC 7517 JSON Web Key (JWK) & RFC 7638 JWK Thumbprint Engine
 */

import { base64UrlToBytes, bytesToBase64Url, bytesToHex, hexToBytes, stringToBytes } from '../../utils';
import sha256Plugin from '../../sha256';
import { parsePem, encodePem } from './pem';
import { parseAsn1 } from './asn1';

export interface JwkKeyObject {
  kty: 'RSA' | 'EC' | 'oct' | string;
  use?: 'sig' | 'enc' | string;
  alg?: string;
  kid?: string;
  // RSA Members
  n?: string;
  e?: string;
  d?: string;
  p?: string;
  q?: string;
  dp?: string;
  dq?: string;
  qi?: string;
  // EC Members
  crv?: 'P-256' | 'P-384' | 'P-521' | 'secp256k1' | string;
  x?: string;
  y?: string;
  // Octet (Symmetric) Members
  k?: string;
  [key: string]: any;
}

export interface JwkDetails {
  jwk: JwkKeyObject;
  keyType: 'RSA' | 'EC' | 'oct' | 'UNKNOWN';
  isPrivate: boolean;
  keyBitLength: number;
  thumbprintSha256: string;
  thumbprintBase64Url: string;
  canonicalJson: string;
  pemExport?: string;
  decodedParameters: Record<string, string>;
}

/** Computes RFC 7638 SHA-256 JWK Thumbprint */
export function computeJwkThumbprint(jwk: JwkKeyObject): { thumbprintHex: string; thumbprintB64Url: string; canonicalJson: string } {
  let canonicalObj: Record<string, string> = {};

  if (jwk.kty === 'RSA') {
    if (!jwk.e || !jwk.n) throw new Error('Invalid RSA JWK: Missing "e" or "n"');
    canonicalObj = { e: jwk.e, kty: 'RSA', n: jwk.n };
  } else if (jwk.kty === 'EC') {
    if (!jwk.crv || !jwk.x || !jwk.y) throw new Error('Invalid EC JWK: Missing "crv", "x", or "y"');
    canonicalObj = { crv: jwk.crv, kty: 'EC', x: jwk.x, y: jwk.y };
  } else if (jwk.kty === 'oct') {
    if (!jwk.k) throw new Error('Invalid oct JWK: Missing "k"');
    canonicalObj = { k: jwk.k, kty: 'oct' };
  } else {
    canonicalObj = { kty: jwk.kty };
  }

  // Exact JSON string without whitespace
  const canonicalJson = JSON.stringify(canonicalObj);
  const hashRes = sha256Plugin.compute(canonicalJson);
  const thumbprintHex = hashRes.digest;
  const thumbprintBytes = hexToBytes(thumbprintHex);
  const thumbprintB64Url = bytesToBase64Url(thumbprintBytes);

  return { thumbprintHex, thumbprintB64Url, canonicalJson };
}

/** Parses JWK JSON into structured key parameters */
export function parseJwk(input: string): JwkDetails {
  const trimmed = input.trim();
  let parsed: JwkKeyObject;

  try {
    const rawObj = JSON.parse(trimmed);
    if (Array.isArray(rawObj.keys) && rawObj.keys.length > 0) {
      parsed = rawObj.keys[0];
    } else {
      parsed = rawObj;
    }
  } catch (err: any) {
    throw new Error(`Invalid JSON syntax for JWK: ${err.message}`);
  }

  if (!parsed.kty) {
    throw new Error('Invalid JWK: Missing required "kty" parameter');
  }

  const { thumbprintHex, thumbprintB64Url, canonicalJson } = computeJwkThumbprint(parsed);

  const decodedParams: Record<string, string> = {};
  let keyBitLength = 0;
  let isPrivate = false;
  let pemExport: string | undefined;

  if (parsed.kty === 'RSA') {
    if (parsed.n) {
      const nBytes = base64UrlToBytes(parsed.n);
      keyBitLength = nBytes.length * 8;
      decodedParams['Modulus (n)'] = `0x${bytesToHex(nBytes)} (${keyBitLength} bits)`;
    }
    if (parsed.e) {
      const eBytes = base64UrlToBytes(parsed.e);
      let eVal = 0;
      for (let i = 0; i < eBytes.length; i++) eVal = (eVal << 8) | eBytes[i];
      decodedParams['Public Exponent (e)'] = `${eVal} (0x${bytesToHex(eBytes)})`;
    }
    if (parsed.d) {
      isPrivate = true;
      const dBytes = base64UrlToBytes(parsed.d);
      decodedParams['Private Exponent (d)'] = `0x${bytesToHex(dBytes)}`;
    }
    if (parsed.p) decodedParams['Prime 1 (p)'] = `0x${bytesToHex(base64UrlToBytes(parsed.p))}`;
    if (parsed.q) decodedParams['Prime 2 (q)'] = `0x${bytesToHex(base64UrlToBytes(parsed.q))}`;
    if (parsed.dp) decodedParams['Exponent d mod (p-1)'] = `0x${bytesToHex(base64UrlToBytes(parsed.dp))}`;
    if (parsed.dq) decodedParams['Exponent d mod (q-1)'] = `0x${bytesToHex(base64UrlToBytes(parsed.dq))}`;
    if (parsed.qi) decodedParams['CRT Coefficient (qInv)'] = `0x${bytesToHex(base64UrlToBytes(parsed.qi))}`;
  } else if (parsed.kty === 'EC') {
    decodedParams['Curve (crv)'] = parsed.crv || 'P-256';
    if (parsed.x) {
      const xBytes = base64UrlToBytes(parsed.x);
      keyBitLength = xBytes.length * 8;
      decodedParams['Public Point X'] = `0x${bytesToHex(xBytes)}`;
    }
    if (parsed.y) {
      decodedParams['Public Point Y'] = `0x${bytesToHex(base64UrlToBytes(parsed.y))}`;
    }
    if (parsed.d) {
      isPrivate = true;
      decodedParams['Private Key (d)'] = `0x${bytesToHex(base64UrlToBytes(parsed.d))}`;
    }
  } else if (parsed.kty === 'oct') {
    if (parsed.k) {
      const kBytes = base64UrlToBytes(parsed.k);
      keyBitLength = kBytes.length * 8;
      decodedParams['Symmetric Key (k)'] = `0x${bytesToHex(kBytes)} (${keyBitLength} bits)`;
    }
  }

  return {
    jwk: parsed,
    keyType: parsed.kty as any,
    isPrivate,
    keyBitLength,
    thumbprintSha256: thumbprintHex,
    thumbprintBase64Url: thumbprintB64Url,
    canonicalJson,
    pemExport,
    decodedParameters: decodedParams,
  };
}

/** Converts PEM RSA/EC key to JWK */
export function pemToJwk(pemStr: string): JwkKeyObject {
  const pem = parsePem(pemStr);
  const asn1 = parseAsn1(pem.derBytes, 0);

  if (pem.label.includes('RSA PRIVATE KEY')) {
    // PKCS#1 RSA Private Key
    if (asn1.children && asn1.children.length >= 9) {
      const nBytes = asn1.children[1].rawBytes.slice(asn1.children[1].headerLength);
      const eBytes = asn1.children[2].rawBytes.slice(asn1.children[2].headerLength);
      const dBytes = asn1.children[3].rawBytes.slice(asn1.children[3].headerLength);
      const pBytes = asn1.children[4].rawBytes.slice(asn1.children[4].headerLength);
      const qBytes = asn1.children[5].rawBytes.slice(asn1.children[5].headerLength);
      const dpBytes = asn1.children[6].rawBytes.slice(asn1.children[6].headerLength);
      const dqBytes = asn1.children[7].rawBytes.slice(asn1.children[7].headerLength);
      const qiBytes = asn1.children[8].rawBytes.slice(asn1.children[8].headerLength);

      const clean = (b: Uint8Array) => (b[0] === 0 ? b.slice(1) : b);

      return {
        kty: 'RSA',
        n: bytesToBase64Url(clean(nBytes)),
        e: bytesToBase64Url(clean(eBytes)),
        d: bytesToBase64Url(clean(dBytes)),
        p: bytesToBase64Url(clean(pBytes)),
        q: bytesToBase64Url(clean(qBytes)),
        dp: bytesToBase64Url(clean(dpBytes)),
        dq: bytesToBase64Url(clean(dqBytes)),
        qi: bytesToBase64Url(clean(qiBytes)),
        alg: 'RS256',
        use: 'sig',
      };
    }
  }

  // Default fallback for SPKI public key
  if (asn1.children && asn1.children.length >= 2) {
    const bitString = asn1.children[1];
    const rawKey = bitString.rawBytes.slice(bitString.headerLength + 1);
    const innerAsn = parseAsn1(rawKey, 0);
    if (innerAsn.children && innerAsn.children.length >= 2) {
      const nBytes = innerAsn.children[0].rawBytes.slice(innerAsn.children[0].headerLength);
      const eBytes = innerAsn.children[1].rawBytes.slice(innerAsn.children[1].headerLength);
      const clean = (b: Uint8Array) => (b[0] === 0 ? b.slice(1) : b);
      return {
        kty: 'RSA',
        n: bytesToBase64Url(clean(nBytes)),
        e: bytesToBase64Url(clean(eBytes)),
        alg: 'RS256',
        use: 'sig',
      };
    }
  }

  throw new Error('Unsupported PEM format for automatic JWK conversion');
}
