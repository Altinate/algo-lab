/**
 * PEM (Privacy-Enhanced Mail) Framing & Base64 Armour Codec (RFC 1421 / RFC 7468)
 */

import { base64ToBytes, bytesToBase64, bytesToHex, hexToBytes } from '../../utils';

export interface PemBlock {
  label: string;
  headers: Record<string, string>;
  derBytes: Uint8Array;
  derHex: string;
  byteLength: number;
  sha256Fingerprint: string;
  rawPem: string;
  isHexInput?: boolean;
}

/**
 * Parses PEM text into structured DER blocks
 */
export function parsePem(input: string): PemBlock {
  const trimmed = input.trim();

  // Support direct hex DER input
  const cleanHex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
  if (/^[0-9a-fA-F\s]+$/.test(cleanHex) && cleanHex.replace(/\s+/g, '').length % 2 === 0 && cleanHex.replace(/\s+/g, '').startsWith('30')) {
    const rawBytes = hexToBytes(cleanHex.replace(/\s+/g, ''));
    return {
      label: 'RAW DER SEQUENCE',
      headers: {},
      derBytes: rawBytes,
      derHex: bytesToHex(rawBytes),
      byteLength: rawBytes.length,
      sha256Fingerprint: '',
      rawPem: encodePem(rawBytes, 'CERTIFICATE'),
      isHexInput: true,
    };
  }

  const beginRegex = /-----BEGIN\s+([A-Z0-9_\-\s]+)-----/;
  const endRegex = /-----END\s+([A-Z0-9_\-\s]+)-----/;

  const beginMatch = trimmed.match(beginRegex);
  if (!beginMatch) {
    // If no PEM framing, attempt pure base64 decode if valid
    const cleanB64 = trimmed.replace(/[\r\n\s]/g, '');
    if (/^[A-Za-z0-9+/=]+$/.test(cleanB64)) {
      try {
        const rawBytes = base64ToBytes(cleanB64);
        return {
          label: 'RAW BASE64 DECODED',
          headers: {},
          derBytes: rawBytes,
          derHex: bytesToHex(rawBytes),
          byteLength: rawBytes.length,
          sha256Fingerprint: '',
          rawPem: encodePem(rawBytes, 'CERTIFICATE'),
        };
      } catch {}
    }
    throw new Error('Invalid PEM format: Missing "-----BEGIN <LABEL>-----" envelope');
  }

  const label = beginMatch[1].trim();
  const beginIdx = beginMatch.index! + beginMatch[0].length;
  const endMatch = trimmed.slice(beginIdx).match(endRegex);

  if (!endMatch) {
    throw new Error(`Invalid PEM format: Missing matching "-----END ${label}-----" footer`);
  }

  const body = trimmed.slice(beginIdx, beginIdx + endMatch.index!).trim();
  const lines = body.split(/\r?\n/);
  const headers: Record<string, string> = {};
  const base64Lines: string[] = [];

  let inHeaders = true;
  for (const line of lines) {
    const lineTrim = line.trim();
    if (!lineTrim) {
      inHeaders = false;
      continue;
    }
    if (inHeaders && lineTrim.includes(':')) {
      const [key, ...rest] = lineTrim.split(':');
      headers[key.trim()] = rest.join(':').trim();
    } else {
      inHeaders = false;
      base64Lines.push(lineTrim);
    }
  }

  const base64Str = base64Lines.join('');
  const derBytes = base64ToBytes(base64Str);
  const derHex = bytesToHex(derBytes);

  return {
    label,
    headers,
    derBytes,
    derHex,
    byteLength: derBytes.length,
    sha256Fingerprint: '',
    rawPem: trimmed,
  };
}

/**
 * Encodes DER bytes to PEM text format with standard 64-char line breaks
 */
export function encodePem(bytes: Uint8Array, label: string): string {
  const b64 = bytesToBase64(bytes);
  const chunks: string[] = [];
  for (let i = 0; i < b64.length; i += 64) {
    chunks.push(b64.slice(i, i + 64));
  }
  return `-----BEGIN ${label}-----\n${chunks.join('\n')}\n-----END ${label}-----`;
}
