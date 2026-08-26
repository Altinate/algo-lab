import React, { useState } from 'react';
import type { ComputationStep } from '../../algorithms/types';
import type { Asn1Node } from '../../algorithms/tools/format-parsing/asn1';
import type { X509CertificateDetails } from '../../algorithms/tools/format-parsing/x509';
import type { JwkDetails } from '../../algorithms/tools/format-parsing/jwk';

interface FormatInspectorViewProps {
  step: ComputationStep;
}

/** Recursive ASN.1 Tree Node Component */
function Asn1TreeNode({
  node,
  depth = 0,
  selectedId,
  onSelect,
}: {
  node: Asn1Node;
  depth?: number;
  selectedId?: string;
  onSelect: (node: Asn1Node) => void;
}) {
  const [expanded, setExpanded] = useState<boolean>(depth < 3);
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isSelected = selectedId === node.id;

  const tagColor =
    node.tagClass === 'CONTEXT_SPECIFIC'
      ? 'text-[#c084fc] border-[#c084fc]/30 bg-[#1a1224]'
      : node.tagName === 'SEQUENCE' || node.tagName === 'SET'
      ? 'text-[#38bdf8] border-[#38bdf8]/30 bg-[#0f1d2e]'
      : node.tagName === 'OBJECT IDENTIFIER'
      ? 'text-[#34d399] border-[#34d399]/30 bg-[#0f1f17]'
      : node.tagName === 'INTEGER'
      ? 'text-[#e5a93b] border-[#e5a93b]/30 bg-[#1e170c]'
      : 'text-[#94a3b8] border-[#1f2937] bg-[#0c1017]';

  return (
    <div className="font-mono text-xs select-none">
      <div
        onClick={() => onSelect(node)}
        className={`flex items-center gap-1.5 py-1 px-1.5 rounded-[2px] cursor-pointer transition-colors border ${
          isSelected
            ? 'bg-[#152238] border-[#38bdf8]/60 text-white'
            : 'hover:bg-[#121620] border-transparent text-[#cbd5e1]'
        }`}
        style={{ paddingLeft: `${Math.max(6, depth * 16)}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="h-4 w-4 flex items-center justify-center text-[10px] text-[#64748b] hover:text-[#f8fafc] font-bold"
          >
            {expanded ? '▼' : '►'}
          </button>
        ) : (
          <span className="w-4 inline-block text-center text-[#475569] text-[9px]">•</span>
        )}

        <span className="text-[10px] text-[#64748b] tabular-nums">
          [{node.offset.toString(16).padStart(4, '0').toUpperCase()}]
        </span>

        <span className={`px-1 py-0.2 text-[9px] font-semibold border rounded-[2px] ${tagColor}`}>
          {node.tagName}
        </span>

        <span className="text-[10px] text-[#64748b] tabular-nums">
          ({node.length}B)
        </span>

        {node.oidName && (
          <span className="text-[11px] text-[#34d399] font-medium truncate max-w-xs">
            {node.oidName}
          </span>
        )}

        {node.decodedValue !== undefined && node.tagName !== 'OBJECT IDENTIFIER' && !hasChildren && (
          <span className="text-[11px] text-[#e5a93b] truncate max-w-md">
            = {String(node.decodedValue).slice(0, 60)}
            {String(node.decodedValue).length > 60 ? '...' : ''}
          </span>
        )}
      </div>

      {hasChildren && expanded && node.children && (
        <div className="border-l border-[#1f2937]/50 ml-3">
          {node.children.map((child) => (
            <Asn1TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FormatInspectorView({ step }: FormatInspectorViewProps) {
  const x509Data = step.data.x509Data as { cert: X509CertificateDetails; phaseName: string } | undefined;
  const asn1Data = step.data.asn1Data as { rootNode: Asn1Node; totalNodes: number; maxDepth: number; tagCounts: Record<string, number>; totalBytes: number; label: string } | undefined;
  const jwkData = step.data.jwkData as { jwkDetails: JwkDetails } | undefined;
  const pemData = step.data.pemData as { label: string; byteLength: number; sha256Fingerprint: string; derHex: string; headers: Record<string, string> } | undefined;

  const [selectedAsn1Node, setSelectedAsn1Node] = useState<Asn1Node | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tree' | 'extensions' | 'raw'>('overview');

  // 1. X.509 Certificate View
  if (x509Data && x509Data.cert) {
    const cert = x509Data.cert;
    const isRootNode = selectedAsn1Node || cert.asn1Root;

    return (
      <div className="space-y-3 font-mono">
        {/* Certificate Telemetry Header Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="border border-[#1f2937] bg-[#0c1017] p-2.5 rounded-[2px]">
            <div className="text-[9px] uppercase tracking-wider text-[#64748b]">VALIDITY STATUS</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`h-2 w-2 rounded-none ${
                  cert.validity.status === 'VALID'
                    ? 'bg-[#34d399]'
                    : cert.validity.status === 'EXPIRED'
                    ? 'bg-[#f43f5e]'
                    : 'bg-[#e5a93b]'
                }`}
              />
              <span
                className={`text-xs font-bold ${
                  cert.validity.status === 'VALID'
                    ? 'text-[#34d399]'
                    : cert.validity.status === 'EXPIRED'
                    ? 'text-[#f43f5e]'
                    : 'text-[#e5a93b]'
                }`}
              >
                {cert.validity.status === 'VALID' ? `ACTIVE (${cert.validity.daysRemaining}d left)` : cert.validity.status}
              </span>
            </div>
          </div>

          <div className="border border-[#1f2937] bg-[#0c1017] p-2.5 rounded-[2px]">
            <div className="text-[9px] uppercase tracking-wider text-[#64748b]">CERTIFICATE TYPE</div>
            <div className="text-xs font-bold text-[#38bdf8] mt-1">
              {cert.isCa ? 'CERTIFICATE AUTHORITY (CA)' : 'END-ENTITY (TLS/SSL)'}
            </div>
          </div>

          <div className="border border-[#1f2937] bg-[#0c1017] p-2.5 rounded-[2px]">
            <div className="text-[9px] uppercase tracking-wider text-[#64748b]">PUBLIC KEY ALGORITHM</div>
            <div className="text-xs font-bold text-[#e5a93b] mt-1">
              {cert.subjectPublicKeyInfo.keyType} {cert.subjectPublicKeyInfo.keySizeBits}b
            </div>
          </div>

          <div className="border border-[#1f2937] bg-[#0c1017] p-2.5 rounded-[2px]">
            <div className="text-[9px] uppercase tracking-wider text-[#64748b]">MATH SIGNATURE CHECK</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`h-2 w-2 rounded-none ${cert.signatureVerified ? 'bg-[#34d399]' : 'bg-[#64748b]'}`} />
              <span className={`text-xs font-semibold ${cert.signatureVerified ? 'text-[#34d399]' : 'text-[#94a3b8]'}`}>
                {cert.signatureVerified ? 'VALID (AUTHENTIC)' : 'EXTERNAL ISSUER'}
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-[#1f2937] pb-1.5">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-[2px] transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#152238] text-[#38bdf8] border border-[#38bdf8]/50'
                  : 'text-[#64748b] hover:text-[#f8fafc] border border-transparent'
              }`}
            >
              CERTIFICATE OVERVIEW
            </button>
            <button
              onClick={() => setActiveTab('extensions')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-[2px] transition-all ${
                activeTab === 'extensions'
                  ? 'bg-[#152238] text-[#38bdf8] border border-[#38bdf8]/50'
                  : 'text-[#64748b] hover:text-[#f8fafc] border border-transparent'
              }`}
            >
              EXTENSIONS & SANS ({cert.extensions.length})
            </button>
            <button
              onClick={() => setActiveTab('tree')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-[2px] transition-all ${
                activeTab === 'tree'
                  ? 'bg-[#152238] text-[#38bdf8] border border-[#38bdf8]/50'
                  : 'text-[#64748b] hover:text-[#f8fafc] border border-transparent'
              }`}
            >
              ASN.1 DER TREE
            </button>
          </div>

          <span className="text-[10px] text-[#64748b] uppercase">
            VERSION: {cert.versionName} · SERIAL: {cert.serialNumberHex.slice(0, 16)}...
          </span>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Subject Identity */}
            <div className="border border-[#1f2937] bg-[#0c1017] p-3 rounded-[2px] space-y-2">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-1.5">
                <span className="text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider">SUBJECT IDENTITY (OWNER)</span>
                <span className="text-[9px] text-[#64748b]">RFC 5280 4.1.2.6</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="text-[#f8fafc] font-semibold">{cert.subject.commonName || '(No CN Stated)'}</div>
                <div className="text-[11px] text-[#94a3b8] break-all leading-tight">{cert.subject.dn}</div>
              </div>
            </div>

            {/* Issuer Identity */}
            <div className="border border-[#1f2937] bg-[#0c1017] p-3 rounded-[2px] space-y-2">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-1.5">
                <span className="text-[10px] font-bold text-[#e5a93b] uppercase tracking-wider">ISSUER IDENTITY (AUTHORITY)</span>
                <span className="text-[9px] text-[#64748b]">RFC 5280 4.1.2.4</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="text-[#f8fafc] font-semibold">{cert.issuer.commonName || '(No CN Stated)'}</div>
                <div className="text-[11px] text-[#94a3b8] break-all leading-tight">{cert.issuer.dn}</div>
              </div>
            </div>

            {/* Subject Public Key Info */}
            <div className="border border-[#1f2937] bg-[#0c1017] p-3 rounded-[2px] space-y-2">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-1.5">
                <span className="text-[10px] font-bold text-[#34d399] uppercase tracking-wider">SUBJECT PUBLIC KEY INFO (SPKI)</span>
                <span className="text-[9px] text-[#64748b]">{cert.subjectPublicKeyInfo.algorithmName}</span>
              </div>
              <div className="space-y-1.5 text-xs text-[#cbd5e1]">
                <div><span className="text-[#64748b]">Type:</span> {cert.subjectPublicKeyInfo.keyType} ({cert.subjectPublicKeyInfo.keySizeBits} bits)</div>
                {cert.subjectPublicKeyInfo.rsaParameters && (
                  <>
                    <div className="text-[11px]">
                      <span className="text-[#64748b]">Exponent (e):</span> {cert.subjectPublicKeyInfo.rsaParameters.exponent} (0x10001)
                    </div>
                    <div className="text-[10px] text-[#64748b] break-all bg-[#090c10] p-2 rounded-[2px] border border-[#1f2937]">
                      <div className="text-[9px] text-[#94a3b8] font-bold mb-0.5">MODULUS (n):</div>
                      0x{cert.subjectPublicKeyInfo.rsaParameters.modulusHex}
                    </div>
                  </>
                )}
                {cert.subjectPublicKeyInfo.ecParameters && (
                  <>
                    <div className="text-[11px]"><span className="text-[#64748b]">Curve:</span> {cert.subjectPublicKeyInfo.ecParameters.curveName}</div>
                    <div className="text-[10px] text-[#64748b] break-all bg-[#090c10] p-2 rounded-[2px] border border-[#1f2937]">
                      <div className="text-[9px] text-[#94a3b8] font-bold mb-0.5">UNCOMPRESSED PUBLIC POINT:</div>
                      0x{cert.subjectPublicKeyInfo.ecParameters.publicKeyHex}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Validity Timeline & Signature */}
            <div className="border border-[#1f2937] bg-[#0c1017] p-3 rounded-[2px] space-y-2">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-1.5">
                <span className="text-[10px] font-bold text-[#c084fc] uppercase tracking-wider">VALIDITY & SIGNATURE VALUE</span>
                <span className="text-[9px] text-[#64748b]">{cert.signatureAlgorithmName}</span>
              </div>
              <div className="space-y-1 text-xs text-[#cbd5e1]">
                <div><span className="text-[#64748b]">Not Before:</span> {cert.validity.notBeforeIso}</div>
                <div><span className="text-[#64748b]">Not After:</span> {cert.validity.notAfterIso} ({cert.validity.daysValid} total days)</div>
                <div className="text-[10px] text-[#64748b] break-all bg-[#090c10] p-2 rounded-[2px] border border-[#1f2937] mt-1.5">
                  <div className="text-[9px] text-[#94a3b8] font-bold mb-0.5">SIGNATURE HEX:</div>
                  0x{cert.signatureValueHex.slice(0, 64)}...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Extensions & SANs */}
        {activeTab === 'extensions' && (
          <div className="space-y-3">
            {cert.sanDnsNames.length > 0 && (
              <div className="border border-[#1f2937] bg-[#0c1017] p-3 rounded-[2px] space-y-2">
                <div className="text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider">
                  SUBJECT ALTERNATIVE NAMES (SANS: {cert.sanDnsNames.length} DOMAINS)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cert.sanDnsNames.map((dns, i) => (
                    <span key={i} className="px-2 py-0.5 bg-[#0f1d2e] border border-[#38bdf8]/40 text-xs text-[#38bdf8] font-medium rounded-[2px]">
                      {dns}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border border-[#1f2937] bg-[#0c1017] p-3 rounded-[2px] space-y-2">
              <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
                X.509 V3 EXTENSIONS REGISTRY ({cert.extensions.length})
              </div>
              <div className="space-y-2">
                {cert.extensions.map((ext, i) => (
                  <div key={i} className="p-2 bg-[#090c10] border border-[#1f2937] rounded-[2px] text-xs flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#f8fafc]">{ext.name}</span>
                      <div className="flex items-center gap-2">
                        {ext.critical && (
                          <span className="text-[9px] px-1 py-0.2 bg-[#201014] text-[#f43f5e] border border-[#f43f5e]/40 rounded-[2px] font-bold">
                            CRITICAL
                          </span>
                        )}
                        <span className="text-[10px] text-[#64748b]">{ext.oid}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-[#64748b] break-all font-mono">0x{ext.rawHex}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: ASN.1 DER Tree */}
        {activeTab === 'tree' && (
          <div className="border border-[#1f2937] bg-[#0c1017] p-3 rounded-[2px] space-y-3">
            <div className="flex items-center justify-between border-b border-[#1f2937] pb-2">
              <span className="text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider">
                HIERARCHICAL ASN.1 DER SYNTAX TREE
              </span>
              <span className="text-[10px] text-[#64748b]">CLICK ANY NODE TO INSPECT TLV VALUES</span>
            </div>
            <div className="max-h-96 overflow-y-auto pr-1">
              <Asn1TreeNode
                node={cert.asn1Root}
                selectedId={selectedAsn1Node?.id}
                onSelect={setSelectedAsn1Node}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Pure ASN.1 / DER Tree Inspector View
  if (asn1Data && asn1Data.rootNode) {
    const isRoot = selectedAsn1Node || asn1Data.rootNode;

    return (
      <div className="space-y-3 font-mono">
        {/* Telemetry Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="border border-[#1f2937] bg-[#0c1017] p-2.5 rounded-[2px]">
            <div className="text-[9px] uppercase tracking-wider text-[#64748b]">TOTAL TLV NODES</div>
            <div className="text-xs font-bold text-[#38bdf8] mt-1">{asn1Data.totalNodes} Nodes</div>
          </div>
          <div className="border border-[#1f2937] bg-[#0c1017] p-2.5 rounded-[2px]">
            <div className="text-[9px] uppercase tracking-wider text-[#64748b]">MAX TREE DEPTH</div>
            <div className="text-xs font-bold text-[#e5a93b] mt-1">{asn1Data.maxDepth} Levels</div>
          </div>
          <div className="border border-[#1f2937] bg-[#0c1017] p-2.5 rounded-[2px]">
            <div className="text-[9px] uppercase tracking-wider text-[#64748b]">BUFFER LENGTH</div>
            <div className="text-xs font-bold text-[#34d399] mt-1">{asn1Data.totalBytes} Bytes</div>
          </div>
          <div className="border border-[#1f2937] bg-[#0c1017] p-2.5 rounded-[2px]">
            <div className="text-[9px] uppercase tracking-wider text-[#64748b]">ENVELOPE TYPE</div>
            <div className="text-xs font-bold text-[#c084fc] mt-1 truncate">{asn1Data.label}</div>
          </div>
        </div>

        {/* Tree Container & Selected Node Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 border border-[#1f2937] bg-[#0c1017] p-3 rounded-[2px] space-y-2">
            <div className="flex items-center justify-between border-b border-[#1f2937] pb-1.5">
              <span className="text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider">
                NAVIGABLE ASN.1 DER TREE
              </span>
              <span className="text-[9px] text-[#64748b]">ITU-T X.690 SPECIFICATION</span>
            </div>
            <div className="max-h-96 overflow-y-auto pr-1">
              <Asn1TreeNode
                node={asn1Data.rootNode}
                selectedId={selectedAsn1Node?.id}
                onSelect={setSelectedAsn1Node}
              />
            </div>
          </div>

          {/* Right: Selected Node Telemetry */}
          <div className="border border-[#1f2937] bg-[#0c1017] p-3 rounded-[2px] space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#1f2937] pb-1.5">
              <span className="text-[10px] font-bold text-[#e5a93b] uppercase tracking-wider">
                NODE TELEMETRY
              </span>
              <span className="text-[9px] text-[#64748b]">
                OFFSET 0x{isRoot.offset.toString(16).toUpperCase()}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-[#cbd5e1]">
              <div><span className="text-[#64748b]">Tag Name:</span> <span className="font-semibold text-[#38bdf8]">{isRoot.tagName}</span></div>
              <div><span className="text-[#64748b]">Tag Class:</span> {isRoot.tagClass}</div>
              <div><span className="text-[#64748b]">Length:</span> {isRoot.length} bytes (Header: {isRoot.headerLength}B)</div>
              {isRoot.oidName && (
                <div><span className="text-[#64748b]">OID Meaning:</span> <span className="text-[#34d399] font-medium">{isRoot.oidName}</span></div>
              )}
              {isRoot.decodedValue !== undefined && (
                <div className="bg-[#090c10] p-2 rounded-[2px] border border-[#1f2937] break-all text-[11px] text-[#e5a93b]">
                  <div className="text-[9px] text-[#64748b] mb-0.5">DECODED VALUE:</div>
                  {String(isRoot.decodedValue)}
                </div>
              )}
              <div className="bg-[#090c10] p-2 rounded-[2px] border border-[#1f2937] break-all text-[10px] text-[#64748b]">
                <div className="text-[9px] text-[#94a3b8] mb-0.5">RAW VALUE HEX:</div>
                0x{isRoot.rawValueHex || '(None)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. JWK Formatter View
  if (jwkData && jwkData.jwkDetails) {
    const jwk = jwkData.jwkDetails;
    return (
      <div className="space-y-3 font-mono">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="border border-[#1f2937] bg-[#0c1017] p-2.5 rounded-[2px]">
            <div className="text-[9px] uppercase tracking-wider text-[#64748b]">KEY TYPE (KTY)</div>
            <div className="text-xs font-bold text-[#38bdf8] mt-1">{jwk.keyType} ({jwk.keyBitLength}b)</div>
          </div>
          <div className="border border-[#1f2937] bg-[#0c1017] p-2.5 rounded-[2px]">
            <div className="text-[9px] uppercase tracking-wider text-[#64748b]">KEY USAGE / ALGORITHM</div>
            <div className="text-xs font-bold text-[#e5a93b] mt-1">{jwk.jwk.alg || 'UNSPECIFIED'} ({jwk.jwk.use || 'sig'})</div>
          </div>
          <div className="border border-[#1f2937] bg-[#0c1017] p-2.5 rounded-[2px]">
            <div className="text-[9px] uppercase tracking-wider text-[#64748b]">KEY CLASSIFICATION</div>
            <div className="text-xs font-bold text-[#c084fc] mt-1">{jwk.isPrivate ? 'PRIVATE KEY (SECRET)' : 'PUBLIC KEY'}</div>
          </div>
          <div className="border border-[#1f2937] bg-[#0c1017] p-2.5 rounded-[2px]">
            <div className="text-[9px] uppercase tracking-wider text-[#64748b]">RFC 7638 THUMBPRINT</div>
            <div className="text-xs font-bold text-[#34d399] mt-1 truncate">{jwk.thumbprintBase64Url}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Decoded Parameters */}
          <div className="border border-[#1f2937] bg-[#0c1017] p-3 rounded-[2px] space-y-2">
            <div className="text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider">
              DECODED KEY PARAMETERS
            </div>
            <div className="space-y-1.5">
              {Object.entries(jwk.decodedParameters).map(([key, val]) => (
                <div key={key} className="p-2 bg-[#090c10] border border-[#1f2937] rounded-[2px] text-xs">
                  <div className="text-[10px] text-[#64748b]">{key}</div>
                  <div className="text-xs text-[#cbd5e1] font-mono break-all mt-0.5">{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Raw JSON Structure */}
          <div className="border border-[#1f2937] bg-[#0c1017] p-3 rounded-[2px] space-y-2">
            <div className="text-[10px] font-bold text-[#e5a93b] uppercase tracking-wider">
              FORMATTED RFC 7517 JWK JSON
            </div>
            <pre className="p-2.5 bg-[#090c10] border border-[#1f2937] text-xs text-[#38bdf8] rounded-[2px] overflow-x-auto max-h-80 whitespace-pre-wrap leading-tight">
              {JSON.stringify(jwk.jwk, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  // 4. PEM Decoder View
  if (pemData) {
    return (
      <div className="space-y-3 font-mono">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="border border-[#1f2937] bg-[#0c1017] p-2.5 rounded-[2px]">
            <div className="text-[9px] uppercase tracking-wider text-[#64748b]">PEM ARTIFACT LABEL</div>
            <div className="text-xs font-bold text-[#38bdf8] mt-1">{pemData.label}</div>
          </div>
          <div className="border border-[#1f2937] bg-[#0c1017] p-2.5 rounded-[2px]">
            <div className="text-[9px] uppercase tracking-wider text-[#64748b]">DER BYTE SIZE</div>
            <div className="text-xs font-bold text-[#e5a93b] mt-1">{pemData.byteLength} Bytes</div>
          </div>
          <div className="border border-[#1f2937] bg-[#0c1017] p-2.5 rounded-[2px]">
            <div className="text-[9px] uppercase tracking-wider text-[#64748b]">SHA-256 FINGERPRINT</div>
            <div className="text-xs font-bold text-[#34d399] mt-1 truncate">0x{pemData.sha256Fingerprint}</div>
          </div>
        </div>

        <div className="border border-[#1f2937] bg-[#0c1017] p-3 rounded-[2px] space-y-2">
          <div className="text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider">
            RAW DER STREAM HEXADECIMAL DUMP ({pemData.byteLength} BYTES)
          </div>
          <div className="p-2.5 bg-[#090c10] border border-[#1f2937] text-xs text-[#94a3b8] rounded-[2px] font-mono break-all max-h-64 overflow-y-auto leading-relaxed">
            0x{pemData.derHex}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[#1f2937] bg-[#0c1017] p-4 rounded-[2px] font-mono text-xs text-[#94a3b8]">
      PARSER READY. ENTER AN ARTIFACT TO INSPECT STRUCTURE.
    </div>
  );
}
