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
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
        Algorithm
      </h2>

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

      {/* Desktop sidebar list */}
      <div className="hidden lg:block space-y-3">
        {Array.from(algorithmsByFamily.entries()).map(([family, algos]) => (
          <div key={family}>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
              {family}
            </h3>
            <div className="space-y-0.5">
              {algos.map((algo) => (
                <button
                  key={algo.info.name}
                  onClick={() => onSelect(algo.info.name)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    selectedAlgorithm === algo.info.name
                      ? 'bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40'
                      : 'text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <span className="font-medium">{algo.info.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {algo.info.digestSize}b
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
                        securityColors[algo.info.security]
                      }`}
                    >
                      {securityLabels[algo.info.security]}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
