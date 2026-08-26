/**
 * ASN.1 DER Structure Inspector Plugin (ITU-T X.680 / X.690)
 */

import type { AlgorithmPlugin, ComputationResult, ComputationStep } from '../../types';
import { parseAsn1, type Asn1Node } from './asn1';
import { parsePem } from './pem';
import { bytesToHex } from '../../utils';
import sha256Plugin from '../../sha256';
import { PRESETS } from './presets';

function countNodes(node: Asn1Node): { totalNodes: number; maxDepth: number; tagCounts: Record<string, number> } {
  let totalNodes = 1;
  let maxDepth = 1;
  const tagCounts: Record<string, number> = { [node.tagName]: 1 };

  if (node.children) {
    for (const child of node.children) {
      const cStats = countNodes(child);
      totalNodes += cStats.totalNodes;
      maxDepth = Math.max(maxDepth, 1 + cStats.maxDepth);
      for (const [tag, count] of Object.entries(cStats.tagCounts)) {
        tagCounts[tag] = (tagCounts[tag] || 0) + count;
      }
    }
  }
  return { totalNodes, maxDepth, tagCounts };
}

export const asn1Plugin: AlgorithmPlugin = {
  info: {
    name: 'ASN.1 / DER Inspector',
    family: 'Format & Parsing Tools',
    category: 'tools',
    digestSize: 256,
    blockSize: 512,
    description: 'ITU-T X.690 ASN.1 DER (Distinguished Encoding Rules) structural inspector. Recursively decomposes raw binary bytes into Tag-Length-Value (TLV) tree nodes, resolves OIDs, and maps universal types.',
    useCases: [
      'Deconstructing binary X.509 certificates and CRLs',
      'Inspecting PKCS#1 / PKCS#8 / SPKI public and private key trees',
      'Auditing Cryptographic Message Syntax (CMS / PKCS#7) envelopes',
    ],
    security: 'secure',
    year: 1988,
    designers: ['ITU-T / ISO / IEC (X.680, X.690)'],
  },
  compute(input: string): ComputationResult {
    const rawInput = input.trim() || PRESETS[0].content;
    const steps: ComputationStep[] = [];

    let derBytes: Uint8Array;
    let pemLabel = 'RAW DER';

    try {
      const pem = parsePem(rawInput);
      derBytes = pem.derBytes;
      pemLabel = pem.label;
    } catch {
      // Try treating rawInput as hex string
      const cleanHex = rawInput.replace(/\s+/g, '');
      if (/^[0-9a-fA-F]+$/.test(cleanHex) && cleanHex.length % 2 === 0) {
        const bytes = new Uint8Array(cleanHex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
        }
        derBytes = bytes;
      } else {
        return {
          digest: 'ASN1_PARSE_ERROR',
          steps: [
            {
              id: 'asn1-error',
              title: 'ASN.1 Parsing Error',
              phase: 'PARSING_FAULT',
              description: 'Failed to decode input into DER bytes: Invalid PEM envelope or hex stream.',
              visualizationType: 'asn1-structure',
              data: { error: 'Invalid PEM envelope or hex stream' },
            },
          ],
        };
      }
    }

    let rootNode: Asn1Node;
    try {
      rootNode = parseAsn1(derBytes, 0);
    } catch (err: any) {
      return {
        digest: 'ASN1_TLV_ERROR',
        steps: [
          {
            id: 'asn1-error',
            title: 'ASN.1 TLV Decoding Fault',
            phase: 'TLV_FAULT',
            description: `Encountered malformed TLV sequence: ${err.message}`,
            visualizationType: 'asn1-structure',
            data: { error: err.message },
          },
        ],
      };
    }

    const { totalNodes, maxDepth, tagCounts } = countNodes(rootNode);
    const sha256 = sha256Plugin.compute(bytesToHex(derBytes), { inputEncoding: 'hex' }).digest;

    // Step 1: Root Node & Envelope Header
    steps.push({
      id: 'asn1-root',
      title: `Root TLV Node: ${rootNode.tagName} (${rootNode.totalLength} bytes)`,
      phase: 'ROOT ENVELOPE',
      description: `Decoded top-level ASN.1 structure: Tag 0x${rootNode.tag.toString(16).padStart(2, '0').toUpperCase()} (${rootNode.tagName}), Class: ${rootNode.tagClass}, Length: ${rootNode.length} bytes (Header: ${rootNode.headerLength} bytes).`,
      visualizationType: 'asn1-structure',
      data: {
        asn1Data: {
          toolType: 'ASN1_INSPECTOR',
          label: pemLabel,
          rootNode,
          totalNodes,
          maxDepth,
          tagCounts,
          totalBytes: derBytes.length,
          sha256Fingerprint: sha256,
          activeNodeId: rootNode.id,
          phaseName: 'Root Tag Ingestion',
          progressPercent: 33,
        },
      },
    });

    // Step 2: Primary Children Breakdown
    steps.push({
      id: 'asn1-children',
      title: `Structural Decomposition: ${rootNode.children?.length || 0} Sub-Elements`,
      phase: 'TLV DECOMPOSITION',
      description: `Parsed ${rootNode.children?.length || 0} immediate child nodes under root ${rootNode.tagName}. Total hierarchical AST tree contains ${totalNodes} nodes across ${maxDepth} levels.`,
      visualizationType: 'asn1-structure',
      data: {
        asn1Data: {
          toolType: 'ASN1_INSPECTOR',
          label: pemLabel,
          rootNode,
          totalNodes,
          maxDepth,
          tagCounts,
          totalBytes: derBytes.length,
          sha256Fingerprint: sha256,
          phaseName: 'Hierarchical TLV Unfolding',
          progressPercent: 66,
        },
      },
    });

    // Step 3: Complete Navigable AST Tree
    steps.push({
      id: 'asn1-ast-complete',
      title: `ASN.1 Tree Fully Resolved (${totalNodes} Nodes, Depth ${maxDepth})`,
      phase: 'INSPECTION COMPLETE',
      description: `Complete ASN.1 DER tree decoded. All universal types, OIDs, integers, and context-specific tags are ready for interactive exploration.`,
      visualizationType: 'asn1-structure',
      data: {
        asn1Data: {
          toolType: 'ASN1_INSPECTOR',
          label: pemLabel,
          rootNode,
          totalNodes,
          maxDepth,
          tagCounts,
          totalBytes: derBytes.length,
          sha256Fingerprint: sha256,
          phaseName: 'AST Ready',
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
