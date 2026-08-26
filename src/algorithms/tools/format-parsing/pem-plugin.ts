/**
 * PEM Decoder Plugin (RFC 1421 / RFC 7468)
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { parsePem } from './pem';
import sha256Plugin from '../../sha256';
import { PRESETS } from './presets';

export const pemPlugin: AlgorithmPlugin = {
  info: {
    name: 'PEM Decoder',
    family: 'Format & Parsing Tools',
    category: 'tools',
    digestSize: 256,
    blockSize: 512,
    description: 'RFC 1421 / RFC 7468 Privacy-Enhanced Mail (PEM) text decoder. Parses -----BEGIN/END----- envelopes, detects artifact labels, strips ASCII armor, and outputs raw DER bytes.',
    useCases: [
      'Decoding X.509 certificates, public keys, private keys, and CSRs',
      'Converting ASCII-armored Base64 into binary DER payloads',
      'Extracting PKCS#1, PKCS#8, and SEC1 key wrappers',
    ],
    security: 'secure',
    year: 1993,
    designers: ['John Linn', 'IETF (RFC 1421, RFC 7468)'],
  },
  compute(input: string): ComputationResult {
    const rawInput = input.trim() || PRESETS[0].content;
    const steps: ComputationStep[] = [];

    let pem;
    try {
      pem = parsePem(rawInput);
    } catch (err: any) {
      return {
        digest: 'PARSE_ERROR',
        steps: [
          {
            id: 'pem-error',
            title: 'PEM Parsing Error',
            phase: 'PARSING_FAULT',
            description: `Failed to decode PEM format: ${err.message}`,
            visualizationType: 'binary-transform',
            data: { error: err.message, rawInput },
          },
        ],
      };
    }

    const sha256 = sha256Plugin.compute(pem.derHex, { inputEncoding: 'hex' }).digest;
    pem.sha256Fingerprint = sha256;

    // Step 1: Envelope & Label Detection
    steps.push({
      id: 'pem-envelope',
      title: `Envelope Detection: ${pem.label}`,
      phase: 'PEM ENVELOPE',
      description: `Identified PEM envelope label "${pem.label}". Detected ${Object.keys(pem.headers).length} header fields.`,
      visualizationType: 'binary-transform',
      data: {
        pemData: {
          toolType: 'PEM_DECODER',
          label: pem.label,
          headers: pem.headers,
          byteLength: pem.byteLength,
          sha256Fingerprint: sha256,
          derHex: pem.derHex,
          phaseName: 'Envelope Analysis',
          progressPercent: 33,
        },
      },
    });

    // Step 2: Base64 Decoding & DER Stream
    steps.push({
      id: 'pem-der-extraction',
      title: `Base64 Decoding → DER Binary Stream (${pem.byteLength} bytes)`,
      phase: 'DER EXTRACTION',
      description: `Decoded ASCII-armored Base64 into ${pem.byteLength} raw binary DER bytes.\nLeading DER Tag: 0x${pem.derHex.slice(0, 2).toUpperCase()} (${pem.derHex.slice(0, 2) === '30' ? 'SEQUENCE' : 'ASN.1 Type'}).`,
      visualizationType: 'binary-transform',
      data: {
        pemData: {
          toolType: 'PEM_DECODER',
          label: pem.label,
          headers: pem.headers,
          byteLength: pem.byteLength,
          sha256Fingerprint: sha256,
          derHex: pem.derHex,
          phaseName: 'DER Byte Extraction',
          progressPercent: 66,
        },
      },
    });

    // Step 3: Complete Cryptographic Summary
    steps.push({
      id: 'pem-summary',
      title: 'PEM Artifact Decoded & Fingerprinted',
      phase: 'DECODE COMPLETE',
      description: `Successfully decoded "${pem.label}" (${pem.byteLength} bytes).\nSHA-256 Fingerprint: 0x${sha256}.`,
      visualizationType: 'binary-transform',
      data: {
        pemData: {
          toolType: 'PEM_DECODER',
          label: pem.label,
          headers: pem.headers,
          byteLength: pem.byteLength,
          sha256Fingerprint: sha256,
          derHex: pem.derHex,
          phaseName: 'Complete',
          progressPercent: 100,
        },
      },
    });

    return {
      digest: sha256,
      steps,
    };
  },
};
