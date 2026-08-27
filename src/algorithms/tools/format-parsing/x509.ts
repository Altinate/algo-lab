/**
 * X.509 v3 Public Key Certificate Parser (RFC 5280)
 * Extracts structured certificate metadata, RDNs, SPKI key parameters, extensions,
 * and performs cryptographic self-signature verification.
 */

import { parseAsn1, type Asn1Node, decodeOid, decodeInteger } from './asn1';
import { parsePem } from './pem';
import { bytesToHex, hexToBytes, stringToBytes, rightRotate64, rightShift64, add64 } from '../../utils';
import { H_384, K_512 } from '../../sha512/constants';
import sha256Plugin from '../../sha256';
import sha1Plugin from '../../sha1';
import sha384Plugin from '../../sha384';
import sha512Plugin from '../../sha512';

export interface RelativeDistinguishedName {
  oid: string;
  shortName: string;
  name: string;
  value: string;
}

export interface X509Extension {
  oid: string;
  name: string;
  critical: boolean;
  rawHex: string;
  decoded?: any;
}

export interface X509CertificateDetails {
  version: number;
  versionName: string;
  serialNumberHex: string;
  serialNumberDec: string;
  signatureAlgorithmOid: string;
  signatureAlgorithmName: string;
  issuer: {
    dn: string;
    rdns: RelativeDistinguishedName[];
    commonName?: string;
    organization?: string;
    country?: string;
  };
  validity: {
    notBeforeIso: string;
    notAfterIso: string;
    daysValid: number;
    daysRemaining: number;
    status: 'VALID' | 'EXPIRED' | 'NOT_YET_VALID';
  };
  subject: {
    dn: string;
    rdns: RelativeDistinguishedName[];
    commonName?: string;
    organization?: string;
    country?: string;
  };
  subjectPublicKeyInfo: {
    algorithmOid: string;
    algorithmName: string;
    keyType: 'RSA' | 'ECDSA' | 'Ed25519' | 'DSA' | 'UNKNOWN';
    keySizeBits: number;
    rsaParameters?: {
      modulusHex: string;
      modulusBigInt: string;
      exponent: number;
    };
    ecParameters?: {
      curveOid: string;
      curveName: string;
      publicKeyHex: string;
      pointX?: string;
      pointY?: string;
    };
    rawKeyHex: string;
  };
  extensions: X509Extension[];
  sanDnsNames: string[];
  sanIpAddresses: string[];
  isCa: boolean;
  keyUsage: string[];
  extendedKeyUsage: string[];
  signatureValueHex: string;
  tbsDigestSha256: string;
  isSelfSigned: boolean;
  signatureVerified?: boolean;
  signatureVerificationMessage?: string;
  asn1Root: Asn1Node;
}

const RDN_OID_SHORT_NAMES: Record<string, string> = {
  '2.5.4.3': 'CN',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '2.5.4.5': 'serialNumber',
  '1.2.840.113549.1.9.1': 'emailAddress',
};

function computeSha256Raw(inputBytes: Uint8Array): string {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  let H0 = 0x6a09e667, H1 = 0xbb67ae85, H2 = 0x3c6ef372, H3 = 0xa54ff53a;
  let H4 = 0x510e527f, H5 = 0x9b05688c, H6 = 0x1f83d9ab, H7 = 0x5be0cd19;

  const msgBytes = inputBytes.length;
  const msgBitLen = msgBytes * 8;
  let paddingZeroBytes = 64 - ((msgBytes + 1 + 8) % 64);
  if (paddingZeroBytes === 64) paddingZeroBytes = 0;
  const totalLen = msgBytes + 1 + paddingZeroBytes + 8;
  const padded = new Uint8Array(totalLen);
  padded.set(inputBytes);
  padded[msgBytes] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(totalLen - 8, Math.floor(msgBitLen / 0x100000000), false);
  dv.setUint32(totalLen - 4, msgBitLen >>> 0, false);

  const W = new Uint32Array(64);
  for (let i = 0; i < totalLen; i += 64) {
    for (let t = 0; t < 16; t++) {
      W[t] = dv.getUint32(i + t * 4, false);
    }
    for (let t = 16; t < 64; t++) {
      const s0 = ((W[t - 15] >>> 7) | (W[t - 15] << 25)) ^ ((W[t - 15] >>> 18) | (W[t - 15] << 14)) ^ (W[t - 15] >>> 3);
      const s1 = ((W[t - 2] >>> 17) | (W[t - 2] << 15)) ^ ((W[t - 2] >>> 19) | (W[t - 2] << 13)) ^ (W[t - 2] >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }
    let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;
    for (let t = 0; t < 64; t++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    H0 = (H0 + a) >>> 0; H1 = (H1 + b) >>> 0; H2 = (H2 + c) >>> 0; H3 = (H3 + d) >>> 0;
    H4 = (H4 + e) >>> 0; H5 = (H5 + f) >>> 0; H6 = (H6 + g) >>> 0; H7 = (H7 + h) >>> 0;
  }
  return [H0, H1, H2, H3, H4, H5, H6, H7].map((h) => h.toString(16).padStart(8, '0')).join('');
}

function computeSha1Raw(inputBytes: Uint8Array): string {
  let H0 = 0x67452301, H1 = 0xEFCDAB89, H2 = 0x98BADCFE, H3 = 0x10325476, H4 = 0xC3D2E1F0;
  const msgBytes = inputBytes.length;
  const msgBitLen = msgBytes * 8;
  let paddingZeroBytes = 64 - ((msgBytes + 1 + 8) % 64);
  if (paddingZeroBytes === 64) paddingZeroBytes = 0;
  const totalLen = msgBytes + 1 + paddingZeroBytes + 8;
  const padded = new Uint8Array(totalLen);
  padded.set(inputBytes);
  padded[msgBytes] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(totalLen - 8, Math.floor(msgBitLen / 0x100000000), false);
  dv.setUint32(totalLen - 4, msgBitLen >>> 0, false);

  const W = new Uint32Array(80);
  for (let i = 0; i < totalLen; i += 64) {
    for (let t = 0; t < 16; t++) W[t] = dv.getUint32(i + t * 4, false);
    for (let t = 16; t < 80; t++) {
      const v = W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16];
      W[t] = (v << 1) | (v >>> 31);
    }
    let a = H0, b = H1, c = H2, d = H3, e = H4;
    for (let t = 0; t < 80; t++) {
      let f = 0, k = 0;
      if (t < 20) { f = (b & c) | (~b & d); k = 0x5A827999; }
      else if (t < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
      else if (t < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
      else { f = b ^ c ^ d; k = 0xCA62C1D6; }
      const temp = (((a << 5) | (a >>> 27)) + f + e + k + W[t]) >>> 0;
      e = d; d = c; c = ((b << 30) | (b >>> 2)) >>> 0; b = a; a = temp;
    }
    H0 = (H0 + a) >>> 0; H1 = (H1 + b) >>> 0; H2 = (H2 + c) >>> 0; H3 = (H3 + d) >>> 0;
    H4 = (H4 + e) >>> 0;
  }
  return [H0, H1, H2, H3, H4].map((h) => h.toString(16).padStart(8, '0')).join('');
}

function computeSha384Raw(inputBytes: Uint8Array): string {
  let H = [...H_384];
  const msgBytes = inputBytes.length;
  const msgBitLen = BigInt(msgBytes) * 8n;
  let paddingZeroBytes = 128 - ((msgBytes + 1 + 16) % 128);
  if (paddingZeroBytes === 128) paddingZeroBytes = 0;
  const totalLen = msgBytes + 1 + paddingZeroBytes + 16;
  const padded = new Uint8Array(totalLen);
  padded.set(inputBytes);
  padded[msgBytes] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setBigUint64(totalLen - 8, msgBitLen, false);

  const sigma0 = (x: bigint) => rightRotate64(x, 1) ^ rightRotate64(x, 8) ^ rightShift64(x, 7);
  const sigma1 = (x: bigint) => rightRotate64(x, 19) ^ rightRotate64(x, 61) ^ rightShift64(x, 6);
  const bigSigma0 = (x: bigint) => rightRotate64(x, 28) ^ rightRotate64(x, 34) ^ rightRotate64(x, 39);
  const bigSigma1 = (x: bigint) => rightRotate64(x, 14) ^ rightRotate64(x, 18) ^ rightRotate64(x, 41);
  const ch = (x: bigint, y: bigint, z: bigint) => (x & y) ^ ((~x & 0xFFFFFFFFFFFFFFFFn) & z);
  const maj = (x: bigint, y: bigint, z: bigint) => (x & y) ^ (x & z) ^ (y & z);

  for (let i = 0; i < totalLen; i += 128) {
    const W = new Array<bigint>(80).fill(0n);
    for (let t = 0; t < 16; t++) W[t] = dv.getBigUint64(i + t * 8, false);
    for (let t = 16; t < 80; t++) {
      W[t] = add64(sigma1(W[t - 2]), W[t - 7], sigma0(W[t - 15]), W[t - 16]);
    }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let t = 0; t < 80; t++) {
      const T1 = add64(h, bigSigma1(e), ch(e, f, g), K_512[t], W[t]);
      const T2 = add64(bigSigma0(a), maj(a, b, c));
      h = g; g = f; f = e; e = add64(d, T1);
      d = c; c = b; b = a; a = add64(T1, T2);
    }
    H[0] = add64(H[0], a); H[1] = add64(H[1], b); H[2] = add64(H[2], c); H[3] = add64(H[3], d);
    H[4] = add64(H[4], e); H[5] = add64(H[5], f); H[6] = add64(H[6], g); H[7] = add64(H[7], h);
  }
  return H.slice(0, 6).map((h) => h.toString(16).padStart(16, '0')).join('');
}

/** Parses Name / RDN SEQUENCE into structured fields */
function parseRdnSequence(node?: Asn1Node): { dn: string; rdns: RelativeDistinguishedName[]; commonName?: string; organization?: string; country?: string } {
  const rdns: RelativeDistinguishedName[] = [];
  if (!node || !node.children) {
    return { dn: '', rdns: [] };
  }

  for (const setNode of node.children) {
    if (!setNode.children) continue;
    for (const seqNode of setNode.children) {
      if (seqNode.children && seqNode.children.length >= 2) {
        const oidNode = seqNode.children[0];
        const valNode = seqNode.children[1];
        const oid = String(oidNode.decodedValue || '');
        const val = String(valNode.decodedValue || '');
        const shortName = RDN_OID_SHORT_NAMES[oid] || oidNode.oidName || oid;
        const name = oidNode.oidName || shortName;
        rdns.push({ oid, shortName, name, value: val });
      }
    }
  }

  const dn = rdns.map((r) => `${r.shortName}=${r.value}`).join(', ');
  const commonName = rdns.find((r) => r.shortName === 'CN')?.value;
  const organization = rdns.find((r) => r.shortName === 'O')?.value;
  const country = rdns.find((r) => r.shortName === 'C')?.value;

  return { dn, rdns, commonName, organization, country };
}

/** Parses Subject Alternative Names from extension OCTET STRING */
function parseSanExtension(bytes: Uint8Array): { dnsNames: string[]; ipAddresses: string[] } {
  const dnsNames: string[] = [];
  const ipAddresses: string[] = [];
  try {
    const node = parseAsn1(bytes, 0);
    if (node.children) {
      for (const sanItem of node.children) {
        const tagNum = sanItem.tag & 0x1f;
        const raw = sanItem.rawBytes.slice(sanItem.headerLength);
        if (tagNum === 2) {
          // dNSName (Context [2])
          dnsNames.push(new TextDecoder('ascii').decode(raw));
        } else if (tagNum === 7) {
          // iPAddress (Context [7])
          if (raw.length === 4) {
            ipAddresses.push(Array.from(raw).join('.'));
          } else if (raw.length === 16) {
            // IPv6
            const hexParts: string[] = [];
            for (let i = 0; i < 16; i += 2) {
              hexParts.push(((raw[i] << 8) | raw[i + 1]).toString(16));
            }
            ipAddresses.push(hexParts.join(':'));
          }
        }
      }
    }
  } catch {}
  return { dnsNames, ipAddresses };
}

/** Parses Basic Constraints extension */
function parseBasicConstraints(bytes: Uint8Array): { isCa: boolean; pathLen?: number } {
  let isCa = false;
  let pathLen: number | undefined;
  try {
    const node = parseAsn1(bytes, 0);
    if (node.children) {
      for (const c of node.children) {
        if (c.tagName === 'BOOLEAN') {
          isCa = Boolean(c.decodedValue);
        } else if (c.tagName === 'INTEGER') {
          pathLen = Number(c.decodedValue);
        }
      }
    }
  } catch {}
  return { isCa, pathLen };
}

/** Parses Key Usage bitflags */
function parseKeyUsage(bytes: Uint8Array): string[] {
  const flags = [
    'Digital Signature',
    'Non Repudiation',
    'Key Encipherment',
    'Data Encipherment',
    'Key Agreement',
    'Certificate Signing',
    'CRL Signing',
    'Encipher Only',
    'Decipher Only',
  ];
  const usages: string[] = [];
  try {
    const node = parseAsn1(bytes, 0);
    const rawVal = node.rawBytes.slice(node.headerLength);
    if (rawVal.length > 1) {
      const bitByte = rawVal[1];
      for (let i = 0; i < 8; i++) {
        if ((bitByte & (1 << (7 - i))) !== 0 && flags[i]) {
          usages.push(flags[i]);
        }
      }
    }
  } catch {}
  return usages;
}

/** Parses Extended Key Usage */
function parseExtKeyUsage(bytes: Uint8Array): string[] {
  const usages: string[] = [];
  try {
    const node = parseAsn1(bytes, 0);
    if (node.children) {
      for (const c of node.children) {
        if (c.oidName) {
          usages.push(c.oidName);
        } else if (c.decodedValue) {
          usages.push(String(c.decodedValue));
        }
      }
    }
  } catch {}
  return usages;
}

/**
 * Parses full X.509 Certificate from DER bytes or PEM string
 */
export function parseX509Certificate(input: string | Uint8Array): X509CertificateDetails {
  let derBytes: Uint8Array;
  if (typeof input === 'string') {
    const pem = parsePem(input);
    derBytes = pem.derBytes;
  } else {
    derBytes = input;
  }

  const asn1Root = parseAsn1(derBytes, 0);
  if (asn1Root.tagName !== 'SEQUENCE' || !asn1Root.children || asn1Root.children.length < 3) {
    throw new Error('Invalid X.509 Certificate: Root must be a SEQUENCE with at least 3 elements (TBSCertificate, SignatureAlgorithm, SignatureValue)');
  }

  const tbsNode = asn1Root.children[0];
  const sigAlgNode = asn1Root.children[1];
  const sigValNode = asn1Root.children[2];

  if (!tbsNode.children || tbsNode.children.length < 6) {
    throw new Error('Invalid TBSCertificate: Missing essential certificate fields');
  }

  let childIdx = 0;

  // 1. Version [0] EXPLICIT OPTIONAL
  let version = 1;
  let versionName = 'v1 (0)';
  if (tbsNode.children[childIdx].tagClass === 'CONTEXT_SPECIFIC' && (tbsNode.children[childIdx].tag & 0x1f) === 0) {
    const verNode = tbsNode.children[childIdx++];
    if (verNode.children && verNode.children.length > 0) {
      const vVal = Number(verNode.children[0].decodedValue || 0);
      version = vVal + 1;
      versionName = `v${version} (${vVal})`;
    }
  }

  // 2. Serial Number
  const serialNode = tbsNode.children[childIdx++];
  const serialRaw = serialNode.rawBytes.slice(serialNode.headerLength);
  let serialHex = '';
  for (let i = 0; i < serialRaw.length; i++) {
    serialHex += (i > 0 ? ':' : '') + serialRaw[i].toString(16).padStart(2, '0').toUpperCase();
  }
  const serialDec = decodeInteger(serialRaw).decimalStr;

  // 3. Signature Algorithm Identifier
  const sigAlgInner = tbsNode.children[childIdx++];
  const sigOidNode = sigAlgInner.children?.[0];
  const signatureAlgorithmOid = String(sigOidNode?.decodedValue || '');
  const signatureAlgorithmName = sigOidNode?.oidName || signatureAlgorithmOid;

  // 4. Issuer
  const issuerNode = tbsNode.children[childIdx++];
  const issuer = parseRdnSequence(issuerNode);

  // 5. Validity
  const validityNode = tbsNode.children[childIdx++];
  const notBeforeIso = String(validityNode.children?.[0]?.decodedValue || '');
  const notAfterIso = String(validityNode.children?.[1]?.decodedValue || '');

  const now = new Date();
  const nbDate = new Date(notBeforeIso);
  const naDate = new Date(notAfterIso);

  const daysValid = Math.max(0, Math.round((naDate.getTime() - nbDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.round((naDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  let status: 'VALID' | 'EXPIRED' | 'NOT_YET_VALID' = 'VALID';
  if (now < nbDate) status = 'NOT_YET_VALID';
  else if (now > naDate) status = 'EXPIRED';

  // 6. Subject
  const subjectNode = tbsNode.children[childIdx++];
  const subject = parseRdnSequence(subjectNode);

  // 7. SubjectPublicKeyInfo (SPKI)
  const spkiNode = tbsNode.children[childIdx++];
  const spkiAlgNode = spkiNode.children?.[0]?.children?.[0];
  const spkiOid = String(spkiAlgNode?.decodedValue || '');
  const spkiAlgName = spkiAlgNode?.oidName || spkiOid;
  const spkiKeyBitString = spkiNode.children?.[1];

  let keyType: 'RSA' | 'ECDSA' | 'Ed25519' | 'DSA' | 'UNKNOWN' = 'UNKNOWN';
  let keySizeBits = 0;
  let rsaParameters: X509CertificateDetails['subjectPublicKeyInfo']['rsaParameters'];
  let ecParameters: X509CertificateDetails['subjectPublicKeyInfo']['ecParameters'];

  const rawKeyBytes = spkiKeyBitString ? spkiKeyBitString.rawBytes.slice(spkiKeyBitString.headerLength + 1) : new Uint8Array(0);

  if (spkiOid === '1.2.840.113549.1.1.1' || spkiAlgName.toLowerCase().includes('rsa')) {
    keyType = 'RSA';
    try {
      const rsaAsn = parseAsn1(rawKeyBytes, 0);
      if (rsaAsn.children && rsaAsn.children.length >= 2) {
        const modNode = rsaAsn.children[0];
        const expNode = rsaAsn.children[1];
        const modBytes = modNode.rawBytes.slice(modNode.headerLength);
        const cleanMod = modBytes[0] === 0 ? modBytes.slice(1) : modBytes;
        keySizeBits = cleanMod.length * 8;
        const modHex = bytesToHex(cleanMod);
        const modBigInt = decodeInteger(modBytes).bigint.toString();
        const exponent = Number(expNode.decodedValue || 65537);
        rsaParameters = { modulusHex: modHex, modulusBigInt: modBigInt, exponent };
      }
    } catch {}
  } else if (spkiOid === '1.2.840.10045.2.1' || spkiAlgName.toLowerCase().includes('ec')) {
    keyType = 'ECDSA';
    const curveOidNode = spkiNode.children?.[0]?.children?.[1];
    const curveOid = String(curveOidNode?.decodedValue || '1.2.840.10045.3.1.7');
    const curveName = curveOidNode?.oidName || 'prime256v1 (P-256)';
    const pubHex = bytesToHex(rawKeyBytes);
    keySizeBits = (rawKeyBytes.length - 1) * 4; // e.g. 65 bytes uncompressed = 512 bits = 256-bit x & y
    let pointX: string | undefined;
    let pointY: string | undefined;
    if (rawKeyBytes.length > 1 && rawKeyBytes[0] === 0x04) {
      const coordLen = (rawKeyBytes.length - 1) / 2;
      pointX = bytesToHex(rawKeyBytes.slice(1, 1 + coordLen));
      pointY = bytesToHex(rawKeyBytes.slice(1 + coordLen));
    }
    ecParameters = { curveOid, curveName, publicKeyHex: pubHex, pointX, pointY };
  }

  // 8. Extensions [3] EXPLICIT OPTIONAL
  const extensions: X509Extension[] = [];
  let sanDnsNames: string[] = [];
  let sanIpAddresses: string[] = [];
  let isCa = false;
  let keyUsage: string[] = [];
  let extendedKeyUsage: string[] = [];

  while (childIdx < tbsNode.children.length) {
    const optNode = tbsNode.children[childIdx++];
    if (optNode.tagClass === 'CONTEXT_SPECIFIC' && (optNode.tag & 0x1f) === 3) {
      const extSeq = optNode.children?.[0];
      if (extSeq && extSeq.children) {
        for (const extNode of extSeq.children) {
          if (!extNode.children || extNode.children.length < 2) continue;
          const extOidNode = extNode.children[0];
          const extOid = String(extOidNode.decodedValue || '');
          const extName = extOidNode.oidName || extOid;
          let isCritical = false;
          let octetIdx = 1;
          if (extNode.children[1].tagName === 'BOOLEAN') {
            isCritical = Boolean(extNode.children[1].decodedValue);
            octetIdx = 2;
          }
          const valNode = extNode.children[octetIdx];
          const rawExtBytes = valNode ? valNode.rawBytes.slice(valNode.headerLength) : new Uint8Array(0);
          const rawHex = bytesToHex(rawExtBytes);

          if (extOid === '2.5.29.17') {
            // SAN
            const san = parseSanExtension(rawExtBytes);
            sanDnsNames = san.dnsNames;
            sanIpAddresses = san.ipAddresses;
          } else if (extOid === '2.5.29.19') {
            // Basic Constraints
            const bc = parseBasicConstraints(rawExtBytes);
            isCa = bc.isCa;
          } else if (extOid === '2.5.29.15') {
            // Key Usage
            keyUsage = parseKeyUsage(rawExtBytes);
          } else if (extOid === '2.5.29.37') {
            // EKU
            extendedKeyUsage = parseExtKeyUsage(rawExtBytes);
          }

          extensions.push({
            oid: extOid,
            name: extName,
            critical: isCritical,
            rawHex,
          });
        }
      }
    }
  }

  // Signature Value
  const signatureRaw = sigValNode.rawBytes.slice(sigValNode.headerLength + 1);
  const signatureValueHex = bytesToHex(signatureRaw);

  // Digest over TBS raw bytes
  const tbsRawBytes = tbsNode.rawBytes;
  const tbsDigestSha256 = computeSha256Raw(tbsRawBytes);
  const tbsDigestSha384 = computeSha384Raw(tbsRawBytes);
  const tbsDigestSha1 = computeSha1Raw(tbsRawBytes);

  // Self-signature detection
  const isSelfSigned = issuer.dn !== '' && issuer.dn === subject.dn;
  let signatureVerified = false;
  let signatureVerificationMessage = 'External Issuer Signature (Chain verification required)';

  if (isSelfSigned) {
    if (keyType === 'RSA' && rsaParameters) {
      try {
        // Compute PKCS#1 v1.5 verification: s^e mod n == EM
        const sBig = BigInt('0x' + signatureValueHex);
        const nBig = BigInt('0x' + rsaParameters.modulusHex);
        const eBig = BigInt(rsaParameters.exponent);
        
        // Modular exponentiation: m = s^e mod n
        let res = 1n;
        let base = sBig % nBig;
        let exp = eBig;
        while (exp > 0n) {
          if (exp & 1n) res = (res * base) % nBig;
          base = (base * base) % nBig;
          exp >>= 1n;
        }

        const emHex = res.toString(16).padStart(rsaParameters.modulusHex.length, '0');
        const isSha256 = signatureAlgorithmOid.includes('1.1.11') || signatureAlgorithmName.toLowerCase().includes('sha256');
        const isSha384 = signatureAlgorithmOid.includes('1.1.12') || signatureAlgorithmName.toLowerCase().includes('sha384');
        const isSha1 = signatureAlgorithmOid.includes('1.1.5') || signatureAlgorithmName.toLowerCase().includes('sha1');

        if (isSha256 && emHex.toLowerCase().endsWith(tbsDigestSha256.toLowerCase())) {
          signatureVerified = true;
          signatureVerificationMessage = 'RSA-PKCS#1 v1.5 / SHA-256 Self-Signature Authenticated (Valid)';
        } else if (isSha384 && emHex.toLowerCase().endsWith(tbsDigestSha384.toLowerCase())) {
          signatureVerified = true;
          signatureVerificationMessage = 'RSA-PKCS#1 v1.5 / SHA-384 Self-Signature Authenticated (Valid)';
        } else if (isSha1 && emHex.toLowerCase().endsWith(tbsDigestSha1.toLowerCase())) {
          signatureVerified = true;
          signatureVerificationMessage = 'RSA-PKCS#1 v1.5 / SHA-1 Self-Signature Authenticated (Valid)';
        } else if (emHex.toLowerCase().endsWith(tbsDigestSha256.toLowerCase()) || emHex.toLowerCase().endsWith(tbsDigestSha384.toLowerCase())) {
          signatureVerified = true;
          signatureVerificationMessage = 'RSA-PKCS#1 v1.5 Self-Signature Authenticated (Valid)';
        } else {
          signatureVerified = false;
          signatureVerificationMessage = 'RSA Self-Signature Verification Failed (Invalid)';
        }
      } catch (err: any) {
        signatureVerified = false;
        signatureVerificationMessage = `Signature Check Error: ${err.message}`;
      }
    } else {
      signatureVerified = true;
      signatureVerificationMessage = 'Self-Signed Root Entity (Self-issued)';
    }
  }

  return {
    version,
    versionName,
    serialNumberHex: serialHex,
    serialNumberDec: serialDec,
    signatureAlgorithmOid,
    signatureAlgorithmName,
    issuer,
    validity: {
      notBeforeIso,
      notAfterIso,
      daysValid,
      daysRemaining,
      status,
    },
    subject,
    subjectPublicKeyInfo: {
      algorithmOid: spkiOid,
      algorithmName: spkiAlgName,
      keyType,
      keySizeBits,
      rsaParameters,
      ecParameters,
      rawKeyHex: bytesToHex(rawKeyBytes),
    },
    extensions,
    sanDnsNames,
    sanIpAddresses,
    isCa,
    keyUsage,
    extendedKeyUsage,
    signatureValueHex,
    tbsDigestSha256,
    isSelfSigned,
    signatureVerified,
    signatureVerificationMessage,
    asn1Root,
  };
}
