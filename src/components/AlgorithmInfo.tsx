import { useState } from 'react';
import type { AlgorithmInfo } from '../algorithms/types';

interface AlgorithmInfoProps {
  info: AlgorithmInfo;
}

const securityStyles: Record<string, { badge: string; symbol: string; label: string }> = {
  secure: {
    badge: 'bg-[#0f1f17] text-[#34d399] border-[#34d399]/40',
    symbol: '■',
    label: 'CRYPTOGRAPHICALLY SECURE',
  },
  weakened: {
    badge: 'bg-[#1e170c] text-[#e5a93b] border-[#e5a93b]/40',
    symbol: '▲',
    label: 'COLLISION RISKS DETECTED',
  },
  broken: {
    badge: 'bg-[#201014] text-[#f43f5e] border-[#f43f5e]/40',
    symbol: '✖',
    label: 'CRYPTOGRAPHICALLY BROKEN',
  },
  'non-cryptographic': {
    badge: 'bg-[#151c28] text-[#94a3b8] border-[#94a3b8]/40',
    symbol: '○',
    label: 'NON-CRYPTOGRAPHIC CHECKSUM',
  },
};

export default function AlgorithmInfoPanel({ info }: AlgorithmInfoProps) {
  const [expanded, setExpanded] = useState(true);
  const sec = securityStyles[info.security] || securityStyles['non-cryptographic'];

  return (
    <div className="space-y-1.5 font-mono">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-[#64748b] hover:text-[#94a3b8]"
      >
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-1 bg-[#38bdf8]" />
          <span>SPECS: {info.name}</span>
        </span>
        <span className="text-[10px]">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="space-y-2 rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2.5 text-xs">
          <p className="text-[#94a3b8] text-[11px] leading-relaxed font-sans">{info.description}</p>

          <div
            className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5 text-[9px] font-bold ${sec.badge}`}
          >
            <span>{sec.symbol}</span>
            <span>{sec.label}</span>
          </div>

          {info.securityNote && (
            <p className="rounded-[2px] bg-[#201014] px-2 py-1 text-[10px] text-[#f43f5e] border border-[#f43f5e]/30">
              ✖ {info.securityNote}
            </p>
          )}

          <div className="grid grid-cols-2 gap-1.5 text-[10px] tabular-nums pt-1 border-t border-[#1f2937]">
            <div className="rounded-[2px] bg-[#0e131b] p-1.5 border border-[#1f2937]">
              <span className="text-[#64748b] block text-[8px] uppercase">Digest Size</span>
              <span className="text-[#38bdf8] font-bold">{info.digestSize} BITS</span>
            </div>
            <div className="rounded-[2px] bg-[#0e131b] p-1.5 border border-[#1f2937]">
              <span className="text-[#64748b] block text-[8px] uppercase">Block Size</span>
              <span className="text-[#cbd5e1] font-bold">{info.blockSize} BITS</span>
            </div>
            <div className="rounded-[2px] bg-[#0e131b] p-1.5 border border-[#1f2937]">
              <span className="text-[#64748b] block text-[8px] uppercase">Standardized</span>
              <span className="text-[#cbd5e1] font-bold">{info.year}</span>
            </div>
            <div className="rounded-[2px] bg-[#0e131b] p-1.5 border border-[#1f2937]">
              <span className="text-[#64748b] block text-[8px] uppercase">Designer</span>
              <span className="text-[#cbd5e1] font-bold truncate block">{info.designers.join(', ')}</span>
            </div>
          </div>

          {info.useCases.length > 0 && (
            <div className="pt-1">
              <span className="text-[8px] text-[#64748b] uppercase block mb-1">Standard Applications:</span>
              <div className="flex flex-wrap gap-1">
                {info.useCases.map((uc) => (
                  <span
                    key={uc}
                    className="rounded-[2px] bg-[#121824] px-1.5 py-0.2 text-[9px] text-[#94a3b8] border border-[#1f2937]"
                  >
                    {uc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
