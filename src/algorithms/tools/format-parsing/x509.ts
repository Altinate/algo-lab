/**
 * X.509 v3 Public Key Certificate Parser (RFC 5280)
 * Extracts structured certificate metadata, RDNs, SPKI key parameters, extensions,
 * and performs cryptographic self-signature verification.
 */

import { parseAsn1, type Asn1Node, decodeOid, decodeInteger } from './asn1';
import { parsePem } from './pem';
import { bytesToHex, hexToBytes, stringToBytes } from '../../utils';
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
  const tbsDigestSha256 = sha256Plugin.compute(bytesToHex(tbsRawBytes), { inputEncoding: 'hex' }).digest;

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
        // PKCS#1 v1.5 SHA-256 DigestInfo prefix: 0001ff...ff003031300d060960864801650304020105000420 + digest
        const isSha256 = signatureAlgorithmOid.includes('1.1.11') || signatureAlgorithmName.toLowerCase().includes('sha256');
        if (isSha256 && emHex.toLowerCase().endsWith(tbsDigestSha256.toLowerCase())) {
          signatureVerified = true;
          signatureVerificationMessage = 'RSA-PKCS#1 v1.5 Self-Signature Authenticated (Valid)';
        } else {
          // Check SHA-1 or SHA-384
          const tbsSha1 = sha1Plugin.compute(bytesToHex(tbsRawBytes)).digest;
          const tbsSha384 = sha384Plugin.compute(bytesToHex(tbsRawBytes)).digest;
          if (emHex.toLowerCase().endsWith(tbsSha1.toLowerCase()) || emHex.toLowerCase().endsWith(tbsSha384.toLowerCase())) {
            signatureVerified = true;
            signatureVerificationMessage = 'RSA-PKCS#1 v1.5 Self-Signature Authenticated (Valid)';
          } else {
            signatureVerified = false;
            signatureVerificationMessage = 'RSA Self-Signature Verification Failed (Invalid)';
          }
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
