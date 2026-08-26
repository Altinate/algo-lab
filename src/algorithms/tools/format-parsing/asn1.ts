/**
 * ASN.1 DER (Distinguished Encoding Rules) Recursive Parser & OID Registry
 * Conforms to ITU-T X.680 / X.690 specifications.
 */

export interface Asn1Node {
  id: string;
  tag: number;
  tagClass: 'UNIVERSAL' | 'APPLICATION' | 'CONTEXT_SPECIFIC' | 'PRIVATE';
  isConstructed: boolean;
  tagName: string;
  offset: number;
  headerLength: number;
  length: number;
  totalLength: number;
  rawHeaderHex: string;
  rawBytes: Uint8Array;
  rawValueHex: string;
  decodedValue?: string | number | bigint | boolean | null;
  oidName?: string;
  children?: Asn1Node[];
  error?: string;
}

export const OID_MAP: Record<string, { name: string; description?: string }> = {
  // Public Key & Key Exchange
  '1.2.840.113549.1.1.1': { name: 'rsaEncryption', description: 'RSA Public/Private Key' },
  '1.2.840.10045.2.1': { name: 'ecPublicKey', description: 'Elliptic Curve Public Key' },
  '1.2.840.10040.4.1': { name: 'dsa', description: 'Digital Signature Algorithm' },
  '1.2.840.10046.2.1': { name: 'dhpublicnumber', description: 'Diffie-Hellman Key Agreement' },
  '1.3.101.112': { name: 'Ed25519', description: 'Edwards-curve Digital Signature Algorithm 25519' },
  '1.3.101.113': { name: 'Ed448', description: 'Edwards-curve Digital Signature Algorithm 448' },
  '1.3.101.110': { name: 'X25519', description: 'Curve25519 ECDH' },
  '1.3.101.111': { name: 'X448', description: 'Curve448 ECDH' },

  // Elliptic Curves
  '1.2.840.10045.3.1.7': { name: 'prime256v1', description: 'NIST P-256 / secp256r1 (256-bit)' },
  '1.3.132.0.10': { name: 'secp256k1', description: 'Koblitz Curve (Bitcoin / Ethereum)' },
  '1.3.132.0.34': { name: 'secp384r1', description: 'NIST P-384 (384-bit)' },
  '1.3.132.0.35': { name: 'secp521r1', description: 'NIST P-521 (521-bit)' },

  // Signature Algorithms
  '1.2.840.113549.1.1.4': { name: 'md5WithRSAEncryption', description: 'MD5 with RSA Encryption' },
  '1.2.840.113549.1.1.5': { name: 'sha1WithRSAEncryption', description: 'SHA-1 with RSA Encryption' },
  '1.2.840.113549.1.1.11': { name: 'sha256WithRSAEncryption', description: 'SHA-256 with RSA Encryption (PKCS #1 v1.5)' },
  '1.2.840.113549.1.1.12': { name: 'sha384WithRSAEncryption', description: 'SHA-384 with RSA Encryption (PKCS #1 v1.5)' },
  '1.2.840.113549.1.1.13': { name: 'sha512WithRSAEncryption', description: 'SHA-512 with RSA Encryption (PKCS #1 v1.5)' },
  '1.2.840.113549.1.1.14': { name: 'sha224WithRSAEncryption', description: 'SHA-224 with RSA Encryption (PKCS #1 v1.5)' },
  '1.2.840.113549.1.1.10': { name: 'rsassa-pss', description: 'RSA Probabilistic Signature Scheme (PSS)' },
  '1.2.840.10045.4.1': { name: 'ecdsa-with-SHA1', description: 'ECDSA with SHA-1' },
  '1.2.840.10045.4.3.2': { name: 'ecdsa-with-SHA256', description: 'ECDSA with SHA-256' },
  '1.2.840.10045.4.3.3': { name: 'ecdsa-with-SHA384', description: 'ECDSA with SHA-384' },
  '1.2.840.10045.4.3.4': { name: 'ecdsa-with-SHA512', description: 'ECDSA with SHA-512' },
  '1.2.840.10040.4.3': { name: 'dsaWithSHA1', description: 'DSA with SHA-1' },

  // Digests & Hashes
  '1.2.840.113549.2.5': { name: 'md5', description: 'MD5 Message-Digest Algorithm' },
  '1.3.14.3.2.26': { name: 'sha1', description: 'SHA-1 Secure Hash Algorithm' },
  '2.16.840.1.101.3.4.2.1': { name: 'sha256', description: 'SHA-256 Secure Hash Algorithm' },
  '2.16.840.1.101.3.4.2.2': { name: 'sha384', description: 'SHA-384 Secure Hash Algorithm' },
  '2.16.840.1.101.3.4.2.3': { name: 'sha512', description: 'SHA-512 Secure Hash Algorithm' },
  '2.16.840.1.101.3.4.2.4': { name: 'sha224', description: 'SHA-224 Secure Hash Algorithm' },
  '2.16.840.1.101.3.4.2.7': { name: 'sha3-224', description: 'SHA3-224' },
  '2.16.840.1.101.3.4.2.8': { name: 'sha3-256', description: 'SHA3-256' },
  '2.16.840.1.101.3.4.2.9': { name: 'sha3-384', description: 'SHA3-384' },
  '2.16.840.1.101.3.4.2.10': { name: 'sha3-512', description: 'SHA3-512' },

  // X.500 Relative Distinguished Name (RDN) Attributes
  '2.5.4.3': { name: 'commonName', description: 'Common Name (CN)' },
  '2.5.4.6': { name: 'countryName', description: 'Country Code (C)' },
  '2.5.4.7': { name: 'localityName', description: 'Locality / City (L)' },
  '2.5.4.8': { name: 'stateOrProvinceName', description: 'State / Province (ST)' },
  '2.5.4.10': { name: 'organizationName', description: 'Organization (O)' },
  '2.5.4.11': { name: 'organizationalUnitName', description: 'Organizational Unit (OU)' },
  '2.5.4.5': { name: 'serialNumber', description: 'Device/Entity Serial Number' },
  '2.5.4.4': { name: 'surname', description: 'Surname' },
  '2.5.4.42': { name: 'givenName', description: 'Given Name' },
  '2.5.4.12': { name: 'title', description: 'Title' },
  '1.2.840.113549.1.9.1': { name: 'emailAddress', description: 'Email Address' },

  // X.509 v3 Extensions (RFC 5280)
  '2.5.29.14': { name: 'subjectKeyIdentifier', description: 'Subject Key Identifier (SKI)' },
  '2.5.29.15': { name: 'keyUsage', description: 'Key Usage Constraints' },
  '2.5.29.17': { name: 'subjectAltName', description: 'Subject Alternative Name (SAN)' },
  '2.5.29.18': { name: 'issuerAltName', description: 'Issuer Alternative Name (IAN)' },
  '2.5.29.19': { name: 'basicConstraints', description: 'Basic Constraints (CA & PathLen)' },
  '2.5.29.31': { name: 'cRLDistributionPoints', description: 'CRL Distribution Points' },
  '2.5.29.32': { name: 'certificatePolicies', description: 'Certificate Policies' },
  '2.5.29.35': { name: 'authorityKeyIdentifier', description: 'Authority Key Identifier (AKI)' },
  '2.5.29.37': { name: 'extKeyUsage', description: 'Extended Key Usage (EKU)' },
  '1.3.6.1.5.5.7.1.1': { name: 'authorityInfoAccess', description: 'Authority Information Access (AIA)' },
  '1.3.6.1.4.1.11129.2.4.2': { name: 'signedCertificateTimestampList', description: 'Certificate Transparency (SCT)' },

  // Extended Key Usages
  '1.3.6.1.5.5.7.3.1': { name: 'serverAuth', description: 'TLS Web Server Authentication' },
  '1.3.6.1.5.5.7.3.2': { name: 'clientAuth', description: 'TLS Web Client Authentication' },
  '1.3.6.1.5.5.7.3.3': { name: 'codeSigning', description: 'Code Signing' },
  '1.3.6.1.5.5.7.3.4': { name: 'emailProtection', description: 'E-mail Protection (S/MIME)' },
  '1.3.6.1.5.5.7.3.8': { name: 'timeStamping', description: 'Trusted Timestamping' },
  '1.3.6.1.5.5.7.3.9': { name: 'ocspSigning', description: 'OCSP Signing' },
};

const UNIVERSAL_TAGS: Record<number, string> = {
  0x00: 'EOC (End-of-Contents)',
  0x01: 'BOOLEAN',
  0x02: 'INTEGER',
  0x03: 'BIT STRING',
  0x04: 'OCTET STRING',
  0x05: 'NULL',
  0x06: 'OBJECT IDENTIFIER',
  0x07: 'ObjectDescriptor',
  0x08: 'EXTERNAL',
  0x09: 'REAL',
  0x0a: 'ENUMERATED',
  0x0b: 'EMBEDDED PDV',
  0x0c: 'UTF8String',
  0x0d: 'RELATIVE-OID',
  0x10: 'SEQUENCE',
  0x11: 'SET',
  0x12: 'NumericString',
  0x13: 'PrintableString',
  0x14: 'TeletexString',
  0x15: 'VideotexString',
  0x16: 'IA5String',
  0x17: 'UTCTime',
  0x18: 'GeneralizedTime',
  0x19: 'GraphicString',
  0x1a: 'VisibleString',
  0x1b: 'GeneralString',
  0x1c: 'UniversalString',
  0x1d: 'CHARACTER STRING',
  0x1e: 'BMPString',
};

/** Decodes OID bytes to dot-separated string */
export function decodeOid(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';
  const first = bytes[0];
  const b1 = Math.floor(first / 40);
  const b2 = first % 40;
  const parts: number[] = [b1, b2];

  let current = 0;
  for (let i = 1; i < bytes.length; i++) {
    const byte = bytes[i];
    current = (current << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) {
      parts.push(current);
      current = 0;
    }
  }
  return parts.join('.');
}

/** Decodes BigInt or hex string from INTEGER bytes */
export function decodeInteger(bytes: Uint8Array): { hex: string; bigint: bigint; decimalStr: string } {
  if (bytes.length === 0) {
    return { hex: '00', bigint: 0n, decimalStr: '0' };
  }
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  // Check sign bit
  const isNegative = (bytes[0] & 0x80) !== 0;
  let val = 0n;
  if (!isNegative) {
    val = BigInt('0x' + hex);
  } else {
    // Two's complement for negative numbers
    val = -(BigInt('0x' + hex) ^ ((1n << (BigInt(bytes.length) * 8n)) - 1n) + 1n);
  }
  return { hex, bigint: val, decimalStr: val.toString(10) };
}

/** Decodes UTCTime / GeneralizedTime to ISO Date string */
export function decodeTime(bytes: Uint8Array, isUtcTime: boolean): string {
  const str = new TextDecoder('ascii').decode(bytes);
  try {
    if (isUtcTime) {
      // YYMMDDHHMMSSZ or YYMMDDHHMMZ
      let year = parseInt(str.substring(0, 2), 10);
      year += year >= 50 ? 1900 : 2000;
      const month = str.substring(2, 4);
      const day = str.substring(4, 6);
      const hour = str.substring(6, 8);
      const min = str.substring(8, 10);
      const sec = str.length >= 12 && str[10] !== 'Z' ? str.substring(10, 12) : '00';
      return `${year}-${month}-${day}T${hour}:${min}:${sec}Z`;
    } else {
      // YYYYMMDDHHMMSSZ
      const year = str.substring(0, 4);
      const month = str.substring(4, 6);
      const day = str.substring(6, 8);
      const hour = str.substring(8, 10);
      const min = str.substring(10, 12);
      const sec = str.length >= 14 && str[12] !== 'Z' ? str.substring(12, 14) : '00';
      return `${year}-${month}-${day}T${hour}:${min}:${sec}Z`;
    }
  } catch {
    return str;
  }
}

/** Recursively parses ASN.1 DER byte buffer */
export function parseAsn1(bytes: Uint8Array, offset = 0, pathPrefix = 'node'): Asn1Node {
  if (offset >= bytes.length) {
    throw new Error(`ASN.1 Offset ${offset} exceeds buffer length ${bytes.length}`);
  }

  const startOffset = offset;
  const tagByte = bytes[offset++];

  const tagClassNum = (tagByte >> 6) & 0x03;
  const tagClass =
    tagClassNum === 0
      ? 'UNIVERSAL'
      : tagClassNum === 1
      ? 'APPLICATION'
      : tagClassNum === 2
      ? 'CONTEXT_SPECIFIC'
      : 'PRIVATE';

  const isConstructed = (tagByte & 0x20) !== 0;
  let tagNumber = tagByte & 0x1f;

  if (tagNumber === 0x1f) {
    // Multi-byte tag encoding
    tagNumber = 0;
    let b: number;
    do {
      if (offset >= bytes.length) throw new Error('Truncated multi-byte tag');
      b = bytes[offset++];
      tagNumber = (tagNumber << 7) | (b & 0x7f);
    } while ((b & 0x80) !== 0);
  }

  let tagName = '';
  if (tagClass === 'UNIVERSAL') {
    tagName = UNIVERSAL_TAGS[tagNumber] || `UNIVERSAL_${tagNumber}`;
  } else if (tagClass === 'CONTEXT_SPECIFIC') {
    tagName = `[${tagNumber}]`;
  } else {
    tagName = `${tagClass}_${tagNumber}`;
  }

  // Parse Length
  if (offset >= bytes.length) throw new Error('Truncated length byte');
  const lengthByte = bytes[offset++];
  let length = 0;

  if ((lengthByte & 0x80) === 0) {
    // Short form (0..127)
    length = lengthByte;
  } else {
    // Long form
    const numOctets = lengthByte & 0x7f;
    if (numOctets === 0) {
      // Indefinite length (not allowed in strict DER, but handle gracefully)
      length = bytes.length - offset;
    } else {
      if (offset + numOctets > bytes.length) {
        throw new Error(`Truncated multi-byte length at offset ${offset}`);
      }
      length = 0;
      for (let i = 0; i < numOctets; i++) {
        length = (length << 8) | bytes[offset++];
      }
    }
  }

  const headerLength = offset - startOffset;
  const rawHeaderBytes = bytes.slice(startOffset, offset);
  let rawHeaderHex = '';
  for (let i = 0; i < rawHeaderBytes.length; i++) {
    rawHeaderHex += rawHeaderBytes[i].toString(16).padStart(2, '0');
  }

  const valueEnd = Math.min(offset + length, bytes.length);
  const rawValueBytes = bytes.slice(offset, valueEnd);
  let rawValueHex = '';
  for (let i = 0; i < rawValueBytes.length; i++) {
    rawValueHex += rawValueBytes[i].toString(16).padStart(2, '0');
  }

  const totalLength = headerLength + length;
  const rawNodeBytes = bytes.slice(startOffset, startOffset + totalLength);

  const node: Asn1Node = {
    id: `${pathPrefix}-${startOffset}`,
    tag: tagByte,
    tagClass,
    isConstructed,
    tagName,
    offset: startOffset,
    headerLength,
    length,
    totalLength,
    rawHeaderHex,
    rawBytes: rawNodeBytes,
    rawValueHex,
  };

  // Decode primitive values or recurse constructed structures
  if (isConstructed || tagClass === 'CONTEXT_SPECIFIC' || tagByte === 0x30 || tagByte === 0x31) {
    const children: Asn1Node[] = [];
    let childOffset = offset;
    let childIdx = 0;
    while (childOffset < valueEnd) {
      try {
        const child = parseAsn1(bytes, childOffset, `${node.id}-${childIdx++}`);
        children.push(child);
        childOffset += child.totalLength;
      } catch (err: any) {
        // If child parsing fails (e.g. primitive treated as context-specific), store error and break
        node.error = err.message;
        break;
      }
    }
    if (children.length > 0) {
      node.children = children;
    }
  }

  if (!node.children) {
    // Primitive Decoding
    if (tagClass === 'UNIVERSAL') {
      switch (tagNumber) {
        case 0x01: // BOOLEAN
          node.decodedValue = rawValueBytes.length > 0 && rawValueBytes[0] !== 0;
          break;
        case 0x02: // INTEGER
          const intDec = decodeInteger(rawValueBytes);
          node.decodedValue = intDec.bigint.toString();
          break;
        case 0x03: // BIT STRING
          const unusedBits = rawValueBytes.length > 0 ? rawValueBytes[0] : 0;
          node.decodedValue = `(${unusedBits} unused bits) 0x${rawValueHex.slice(2)}`;
          break;
        case 0x04: // OCTET STRING
          node.decodedValue = `0x${rawValueHex}`;
          // Check if OCTET STRING contains encapsulated ASN.1
          if (rawValueBytes.length > 2 && (rawValueBytes[0] === 0x30 || rawValueBytes[0] === 0x02)) {
            try {
              const enc = parseAsn1(rawValueBytes, 0, `${node.id}-enc`);
              node.children = [enc];
            } catch {}
          }
          break;
        case 0x05: // NULL
          node.decodedValue = 'NULL';
          break;
        case 0x06: // OBJECT IDENTIFIER
          const oidStr = decodeOid(rawValueBytes);
          node.decodedValue = oidStr;
          const matchedOid = OID_MAP[oidStr];
          if (matchedOid) {
            node.oidName = matchedOid.name;
          }
          break;
        case 0x0c: // UTF8String
        case 0x13: // PrintableString
        case 0x14: // TeletexString
        case 0x16: // IA5String
        case 0x1a: // VisibleString
        case 0x1b: // GeneralString
        case 0x1e: // BMPString
          try {
            node.decodedValue = new TextDecoder(tagNumber === 0x1e ? 'utf-16be' : 'utf-8').decode(rawValueBytes);
          } catch {
            node.decodedValue = `0x${rawValueHex}`;
          }
          break;
        case 0x17: // UTCTime
          node.decodedValue = decodeTime(rawValueBytes, true);
          break;
        case 0x18: // GeneralizedTime
          node.decodedValue = decodeTime(rawValueBytes, false);
          break;
        default:
          node.decodedValue = `0x${rawValueHex}`;
      }
    } else {
      node.decodedValue = `0x${rawValueHex}`;
    }
  }

  return node;
}
