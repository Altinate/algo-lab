/**
 * JWK Formatter & Parser Plugin (RFC 7517 / RFC 7638)
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { parseJwk, pemToJwk, type JwkDetails } from './jwk';
import { PRESETS } from './presets';

export const jwkPlugin: AlgorithmPlugin = {
  info: {
    name: 'JWK Formatter & Parser',
    family: 'Format & Parsing Tools',
    category: 'tools',
    digestSize: 256,
    blockSize: 512,
    description: 'RFC 7517 JSON Web Key (JWK) formatter and bidirectional parser. Computes RFC 7638 SHA-256 JWK Thumbprints (kid), inspects RSA/EC/Octet parameters, and converts between PEM and JWK.',
    useCases: [
      'Formatting cryptographic keys for OpenID Connect (OIDC) and OAuth 2.0 (jwks.json)',
      'Computing RFC 7638 deterministic key thumbprints for key identifiers',
      'Converting between traditional PEM key files and modern JSON Web Key structures',
    ],
    security: 'secure',
    year: 2015,
    designers: ['M. Jones (Microsoft, IETF RFC 7517, RFC 7638)'],
  },
  compute(input: string): ComputationResult {
    const rawInput = input.trim() || PRESETS[4].content;
    const steps: ComputationStep[] = [];

    let jwkDetails: JwkDetails;

    try {
      if (rawInput.startsWith('-----BEGIN')) {
        // PEM to JWK Conversion
        const jwkObj = pemToJwk(rawInput);
        jwkDetails = parseJwk(JSON.stringify(jwkObj));
      } else {
        // Pure JWK Parsing
        jwkDetails = parseJwk(rawInput);
      }
    } catch (err: any) {
      return {
        digest: 'JWK_PARSE_ERROR',
        steps: [
          {
            id: 'jwk-error',
            title: 'JWK Parsing Error',
            phase: 'PARSING_FAULT',
            description: `Failed to decode JSON Web Key: ${err.message}`,
            visualizationType: 'asn1-structure',
            data: { error: err.message },
          },
        ],
      };
    }

    // Step 1: JWK Key Type & Envelope
    steps.push({
      id: 'jwk-envelope',
      title: `JSON Web Key: ${jwkDetails.keyType} (${jwkDetails.keyBitLength} bits, ${jwkDetails.isPrivate ? 'Private' : 'Public'})`,
      phase: 'KEY ENVELOPE',
      description: `Identified ${jwkDetails.keyType} key (Algorithm: ${jwkDetails.jwk.alg || 'Unspecified'}, Use: ${jwkDetails.jwk.use || 'General'}).\nKey ID (kid): "${jwkDetails.jwk.kid || 'Omitted'}".`,
      visualizationType: 'asn1-structure',
      data: {
        jwkData: {
          toolType: 'JWK_FORMATTER',
          jwkDetails,
          phaseName: 'Envelope Ingestion',
          progressPercent: 33,
        },
      },
    });

    // Step 2: Base64URL Decoded Parameters
    steps.push({
      id: 'jwk-parameters',
      title: `Decoded ${jwkDetails.keyType} Key Parameters (${Object.keys(jwkDetails.decodedParameters).length} Fields)`,
      phase: 'PARAMETER DECOMPOSITION',
      description: `Decoded Base64URL big-endian integers and curve coordinates into raw hexadecimal buffers.\n${Object.entries(
        jwkDetails.decodedParameters
      )
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${v.slice(0, 32)}...`)
        .join('\n')}`,
      visualizationType: 'asn1-structure',
      data: {
        jwkData: {
          toolType: 'JWK_FORMATTER',
          jwkDetails,
          phaseName: 'Parameter Extraction',
          progressPercent: 66,
        },
      },
    });

    // Step 3: RFC 7638 Thumbprint
    steps.push({
      id: 'jwk-thumbprint',
      title: `RFC 7638 Thumbprint: ${jwkDetails.thumbprintBase64Url}`,
      phase: 'THUMBPRINT COMPUTATION',
      description: `Constructed RFC 7638 Canonical JSON: ${jwkDetails.canonicalJson}\nComputed SHA-256 Thumbprint: 0x${jwkDetails.thumbprintSha256}\nBase64URL Thumbprint: "${jwkDetails.thumbprintBase64Url}".`,
      visualizationType: 'asn1-structure',
      data: {
        jwkData: {
          toolType: 'JWK_FORMATTER',
          jwkDetails,
          phaseName: 'Thumbprint Complete',
          progressPercent: 100,
        },
      },
    });

    return {
      digest: jwkDetails.thumbprintSha256,
      steps,
    };
  },
};
