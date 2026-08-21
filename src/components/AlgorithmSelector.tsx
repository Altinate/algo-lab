import { useState, useEffect } from 'react';
import type { AlgorithmPlugin } from '../algorithms/types';

interface AlgorithmSelectorProps {
  algorithmsByFamily: Map<string, AlgorithmPlugin[]>;
  selectedAlgorithm: string;
  onSelect: (name: string) => void;
}

const securityColors: Record<string, string> = {
  secure: 'bg-green-500/20 text-green-400 border-green-500/30',
  weakened: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  broken: 'bg-red-500/20 text-red-400 border-red-500/30',
  'non-cryptographic': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const securityLabels: Record<string, string> = {
  secure: '✓ Secure',
  weakened: '⚠ Weakened',
  broken: '✗ Broken',
  'non-cryptographic': '○ Non-crypto',
};

export default function AlgorithmSelector({
  algorithmsByFamily,
  selectedAlgorithm,
  onSelect,
}: AlgorithmSelectorProps) {
  // Find which family currently owns the selected algorithm
  const findFamilyForAlgo = (algoName: string) => {
    for (const [family, algos] of algorithmsByFamily.entries()) {
      if (algos.some((a) => a.info.name === algoName)) {
        return family;
      }
    }
    return '';
  };

  const initialFamily = findFamilyForAlgo(selectedAlgorithm);

  // Expanded state map for families (default: only selected algorithm's family is expanded)
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const family of algorithmsByFamily.keys()) {
      map[family] = family === initialFamily;
    }
    return map;
  });

  // Ensure active family is expanded whenever selectedAlgorithm changes
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Algorithms ({Array.from(algorithmsByFamily.values()).flat().length})
        </h2>
        <button
          onClick={() => {
            const allExpanded = Object.values(expandedFamilies).every(Boolean);
            const next: Record<string, boolean> = {};
            for (const f of algorithmsByFamily.keys()) {
              next[f] = !allExpanded;
            }
            setExpandedFamilies(next);
          }}
          className="text-[10px] text-gray-500 hover:text-gray-300 font-mono transition-colors"
          title="Expand/Collapse all"
        >
          {Object.values(expandedFamilies).every(Boolean) ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {/* Mobile dropdown */}
      <div className="lg:hidden">
        <select
          value={selectedAlgorithm}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
      <div className="hidden lg:block space-y-1.5">
        {Array.from(algorithmsByFamily.entries()).map(([family, algos]) => {
          const isExpanded = !!expandedFamilies[family];
          const hasActiveChild = algos.some((a) => a.info.name === selectedAlgorithm);

          return (
            <div
              key={family}
              className={`rounded-lg border transition-all duration-200 ${
                hasActiveChild
                  ? 'border-gray-700/80 bg-gray-800/40'
                  : 'border-gray-800/60 bg-gray-900/30'
              }`}
            >
              {/* Family Accordion Header */}
              <button
                onClick={() => toggleFamily(family)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={hasActiveChild ? 'text-blue-400 font-bold' : ''}>
                    {family}
                  </span>
                  <span className="rounded-full bg-gray-800 px-1.5 py-0.2 text-[10px] text-gray-500 font-mono">
                    {algos.length}
                  </span>
                </div>
                <svg
                  className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180 text-gray-300' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Family Algorithm Items with smooth collapse */}
              {isExpanded && (
                <div className="px-1.5 pb-1.5 space-y-0.5 border-t border-gray-800/60 pt-1">
                  {algos.map((algo) => {
                    const isSelected = selectedAlgorithm === algo.info.name;
                    return (
                      <button
                        key={algo.info.name}
                        onClick={() => onSelect(algo.info.name)}
                        className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white font-semibold shadow-sm ring-1 ring-blue-400'
                            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                        }`}
                      >
                        <span className="font-medium">{algo.info.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-mono ${
                              isSelected ? 'text-blue-200' : 'text-gray-500'
                            }`}
                          >
                            {algo.info.digestSize}b
                          </span>
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-medium border ${
                              isSelected
                                ? 'bg-blue-700/80 border-blue-400 text-white'
                                : securityColors[algo.info.security]
                            }`}
                          >
                            {securityLabels[algo.info.security]}
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
