import { useState, useEffect } from 'react';
import type { AlgorithmPlugin } from '../algorithms/types';

interface AlgorithmSelectorProps {
  algorithmsByFamily: Map<string, AlgorithmPlugin[]>;
  selectedAlgorithm: string;
  onSelect: (name: string) => void;
}

const securityStyles: Record<string, { badge: string; symbol: string; label: string }> = {
  secure: {
    badge: 'bg-[#0f1f17] text-[#34d399] border-[#34d399]/40',
    symbol: '■',
    label: 'SECURE',
  },
  weakened: {
    badge: 'bg-[#1e170c] text-[#e5a93b] border-[#e5a93b]/40',
    symbol: '▲',
    label: 'WEAK',
  },
  broken: {
    badge: 'bg-[#201014] text-[#f43f5e] border-[#f43f5e]/40',
    symbol: '✖',
    label: 'BROKEN',
  },
  'non-cryptographic': {
    badge: 'bg-[#151c28] text-[#94a3b8] border-[#94a3b8]/40',
    symbol: '○',
    label: 'NON-CRYPTO',
  },
};

export default function AlgorithmSelector({
  algorithmsByFamily,
  selectedAlgorithm,
  onSelect,
}: AlgorithmSelectorProps) {
  const findFamilyForAlgo = (algoName: string) => {
    for (const [family, algos] of algorithmsByFamily.entries()) {
      if (algos.some((a) => a.info.name === algoName)) {
        return family;
      }
    }
    return '';
  };

  const initialFamily = findFamilyForAlgo(selectedAlgorithm);

  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const family of algorithmsByFamily.keys()) {
      map[family] = family === initialFamily;
    }
    return map;
  });

  useEffect(() => {
    const activeFamily = findFamilyForAlgo(selectedAlgorithm);
    if (activeFamily) {
      setExpandedFamilies((prev) => ({
        ...prev,
        [activeFamily]: true,
      }));
    }
  }, [selectedAlgorithm]);

  const toggleFamily = (family: string) => {
    setExpandedFamilies((prev) => ({
      ...prev,
      [family]: !prev[family],
    }));
  };

  return (
    <div className="space-y-2.5 font-mono">
      <div className="flex items-center justify-between pb-1 border-b border-[#1f2937]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
          ALGORITHM REGISTRY ({Array.from(algorithmsByFamily.values()).flat().length})
        </span>
        <button
          onClick={() => {
            const allExpanded = Object.values(expandedFamilies).every(Boolean);
            const next: Record<string, boolean> = {};
            for (const f of algorithmsByFamily.keys()) {
              next[f] = !allExpanded;
            }
            setExpandedFamilies(next);
          }}
          className="text-[9px] text-[#64748b] hover:text-[#94a3b8] transition-colors"
          title="Expand/Collapse all"
        >
          {Object.values(expandedFamilies).every(Boolean) ? 'COLLAPSE ALL' : 'EXPAND ALL'}
        </button>
      </div>

      {/* Mobile dropdown */}
      <div className="lg:hidden">
        <select
          value={selectedAlgorithm}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full rounded-[2px] border border-[#1f2937] bg-[#0c1017] px-3 py-1.5 text-xs text-white focus:border-[#38bdf8] focus:outline-none"
        >
          {Array.from(algorithmsByFamily.entries()).map(([family, algos]) => (
            <optgroup key={family} label={family}>
              {algos.map((algo) => (
                <option key={algo.info.name} value={algo.info.name}>
                  {algo.info.name} ({algo.info.digestSize}-bit)
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Desktop Accordion List */}
      <div className="hidden lg:block space-y-1">
        {Array.from(algorithmsByFamily.entries()).map(([family, algos]) => {
          const isExpanded = !!expandedFamilies[family];
          const hasActiveChild = algos.some((a) => a.info.name === selectedAlgorithm);

          return (
            <div
              key={family}
              className={`rounded-[2px] border transition-all ${
                hasActiveChild
                  ? 'border-[#38bdf8]/40 bg-[#0e141f]'
                  : 'border-[#1f2937] bg-[#0c1017]'
              }`}
            >
              {/* Family Accordion Header */}
              <button
                onClick={() => toggleFamily(family)}
                className="flex w-full items-center justify-between px-2.5 py-1.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span className={hasActiveChild ? 'text-[#38bdf8] font-bold' : ''}>
                    {family}
                  </span>
                  <span className="text-[9px] text-[#475569] tabular-nums">
                    [{algos.length}]
                  </span>
                </div>
                <span className="text-[10px] text-[#64748b] transition-transform duration-150">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>

              {/* Family Algorithm Items */}
              {isExpanded && (
                <div className="px-1 pb-1 space-y-0.5 border-t border-[#1f2937] pt-1">
                  {algos.map((algo) => {
                    const isSelected = selectedAlgorithm === algo.info.name;
                    const sec = securityStyles[algo.info.security] || securityStyles['non-cryptographic'];

                    return (
                      <button
                        key={algo.info.name}
                        onClick={() => onSelect(algo.info.name)}
                        className={`flex w-full items-center justify-between rounded-[2px] px-2 py-1 text-left text-[11px] transition-all tabular-nums ${
                          isSelected
                            ? 'bg-[#152238] border border-[#38bdf8]/60 text-white font-bold'
                            : 'text-[#cbd5e1] hover:bg-[#141a24] hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {isSelected && <span className="text-[#38bdf8] text-[9px]">▶</span>}
                          <span>{algo.info.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-[#64748b]">
                            {algo.info.digestSize}b
                          </span>
                          <span
                            className={`inline-flex items-center gap-0.5 rounded-[2px] px-1 py-0.1 text-[8px] font-bold border ${sec.badge}`}
                          >
                            <span>{sec.symbol}</span>
                            <span>{sec.label}</span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
