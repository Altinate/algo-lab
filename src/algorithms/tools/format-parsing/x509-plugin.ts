/**
 * X.509 Certificate Inspector Plugin (RFC 5280)
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { parseX509Certificate, type X509CertificateDetails } from './x509';
import { PRESETS } from './presets';

export const x509Plugin: AlgorithmPlugin = {
  info: {
    name: 'X.509 Certificate Inspector',
    family: 'Format & Parsing Tools',
    category: 'tools',
    digestSize: 256,
    blockSize: 512,
    description: 'RFC 5280 X.509 v3 Public Key Certificate Inspector. Extracts TBS fields, serial numbers, issuer/subject RDNs, validity windows, SPKI public key parameters, and X.509v3 extensions (SAN, BasicConstraints, KeyUsage).',
    useCases: [
      'Inspecting TLS/SSL server certificates and certificate authority (CA) hierarchies',
      'Auditing Subject Alternative Names (SANs) and domain authorization scope',
      'Validating mathematical self-signatures (Root CAs & self-signed test certs)',
      'Checking validity expiration timelines and public key cryptographic strength',
    ],
    security: 'secure',
    year: 2008,
    designers: ['D. Cooper', 'S. Santesson', 'S. Farrell', 'S. Boeyen', 'R. Housley', 'W. Polk (IETF RFC 5280)'],
  },
  compute(input: string): ComputationResult {
    const rawInput = input.trim() || PRESETS[0].content;
    const steps: ComputationStep[] = [];

    let cert: X509CertificateDetails;
    try {
      cert = parseX509Certificate(rawInput);
    } catch (err: any) {
      return {
        digest: 'X509_PARSE_ERROR',
        steps: [
          {
            id: 'x509-error',
            title: 'X.509 Certificate Parse Fault',
            phase: 'PARSING_FAULT',
            description: `Failed to decode X.509 certificate: ${err.message}`,
            visualizationType: 'asn1-structure',
            data: { error: err.message },
          },
        ],
      };
    }

    // Step 1: Certificate Header & Serial Number
    steps.push({
      id: 'x509-header',
      title: `Certificate Envelope: ${cert.versionName} (Serial: 0x${cert.serialNumberHex.slice(0, 14)}...)`,
      phase: 'CERTIFICATE HEADER',
      description: `Decoded ${cert.versionName} Certificate with Serial Number ${cert.serialNumberHex}.\nSignature Algorithm: ${cert.signatureAlgorithmName}.`,
      visualizationType: 'asn1-structure',
      data: {
        x509Data: {
          toolType: 'X509_INSPECTOR',
          cert,
          activeSection: 'header',
          phaseName: 'Certificate Metadata',
          progressPercent: 20,
        },
      },
    });

    // Step 2: Distinguished Names (Issuer & Subject)
    steps.push({
      id: 'x509-identities',
      title: `Identity Matrix: Subject "${cert.subject.commonName || cert.subject.dn}"`,
      phase: 'IDENTITY MATRIX',
      description: `Subject DN: "${cert.subject.dn}"\nIssuer DN: "${cert.issuer.dn}"\nSelf-Issued Root CA: ${cert.isSelfSigned ? 'YES' : 'NO'}.`,
      visualizationType: 'asn1-structure',
      data: {
        x509Data: {
          toolType: 'X509_INSPECTOR',
          cert,
          activeSection: 'identities',
          phaseName: 'Distinguished Names',
          progressPercent: 40,
        },
      },
    });

    // Step 3: Validity Window & Expiration Timeline
    steps.push({
      id: 'x509-validity',
      title: `Validity Window: ${cert.validity.status} (${cert.validity.daysRemaining} days left)`,
      phase: 'VALIDITY TIMELINE',
      description: `Not Before: ${cert.validity.notBeforeIso}\nNot After: ${cert.validity.notAfterIso}\nTotal Lifespan: ${cert.validity.daysValid} days. Current Status: ${cert.validity.status}.`,
      visualizationType: 'asn1-structure',
      data: {
        x509Data: {
          toolType: 'X509_INSPECTOR',
          cert,
          activeSection: 'validity',
          phaseName: 'Validity Timeline',
          progressPercent: 60,
        },
      },
    });

    // Step 4: Subject Public Key Info (SPKI)
    steps.push({
      id: 'x509-spki',
      title: `Public Key: ${cert.subjectPublicKeyInfo.keyType} (${cert.subjectPublicKeyInfo.keySizeBits} bits)`,
      phase: 'PUBLIC KEY (SPKI)',
      description: `Algorithm: ${cert.subjectPublicKeyInfo.algorithmName} (${cert.subjectPublicKeyInfo.keySizeBits} bits).\n${
        cert.subjectPublicKeyInfo.rsaParameters
          ? `RSA Modulus (n): 0x${cert.subjectPublicKeyInfo.rsaParameters.modulusHex.slice(0, 32)}... (e=${cert.subjectPublicKeyInfo.rsaParameters.exponent})`
          : cert.subjectPublicKeyInfo.ecParameters
          ? `Curve: ${cert.subjectPublicKeyInfo.ecParameters.curveName}\nPublic Point: 0x${cert.subjectPublicKeyInfo.ecParameters.publicKeyHex.slice(0, 32)}...`
          : 'Public Key Raw Bytes Extracted'
      }`,
      visualizationType: 'asn1-structure',
      data: {
        x509Data: {
          toolType: 'X509_INSPECTOR',
          cert,
          activeSection: 'spki',
          phaseName: 'Public Key Extraction',
          progressPercent: 80,
        },
      },
    });

    // Step 5: Extensions & Cryptographic Signature Verification
    steps.push({
      id: 'x509-extensions-signature',
      title: `Extensions (${cert.extensions.length}) & Signature Verification`,
      phase: 'EXTENSIONS & SIGNATURE',
      description: `Parsed ${cert.extensions.length} X.509v3 extensions (${cert.sanDnsNames.length} SAN DNS names, CA=${cert.isCa}).\nCryptographic Signature Check: ${cert.signatureVerificationMessage}.`,
      visualizationType: 'asn1-structure',
      data: {
        x509Data: {
          toolType: 'X509_INSPECTOR',
          cert,
          activeSection: 'extensions',
          phaseName: 'Extensions & Signature Complete',
          progressPercent: 100,
        },
      },
    });

    return {
      digest: cert.tbsDigestSha256,
      steps,
    };
  },
};
