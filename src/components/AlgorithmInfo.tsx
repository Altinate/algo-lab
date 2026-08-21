import { useState } from 'react';
import type { AlgorithmInfo } from '../algorithms/types';

interface AlgorithmInfoProps {
  info: AlgorithmInfo;
}

const securityBadge: Record<string, { className: string; label: string }> = {
  secure: {
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
    label: '✓ Cryptographically Secure',
  },
  weakened: {
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    label: '⚠ Weakened',
  },
  broken: {
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
    label: '✗ Cryptographically Broken',
  },
  'non-cryptographic': {
    className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    label: '○ Non-Cryptographic',
  },
};

export default function AlgorithmInfoPanel({ info }: AlgorithmInfoProps) {
  const [expanded, setExpanded] = useState(false);
  const badge = securityBadge[info.security];

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300"
      >
        <span>About {info.name}</span>
        <svg
          className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-800/30 p-4 text-sm">
          <p className="text-gray-300 leading-relaxed">{info.description}</p>

          <div
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </div>

          {info.securityNote && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-300 border border-red-500/20">
              ⚠ {info.securityNote}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500">Digest size</span>
              <p className="font-mono text-gray-300">{info.digestSize} bits</p>
            </div>
            <div>
              <span className="text-gray-500">Block size</span>
              <p className="font-mono text-gray-300">{info.blockSize} bits</p>
            </div>
            <div>
              <span className="text-gray-500">Year</span>
              <p className="text-gray-300">{info.year}</p>
            </div>
            <div>
              <span className="text-gray-500">Designer(s)</span>
              <p className="text-gray-300">{info.designers.join(', ')}</p>
            </div>
          </div>

          {info.useCases.length > 0 && (
            <div>
              <span className="text-xs text-gray-500">Common use cases</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {info.useCases.map((uc) => (
                  <span
                    key={uc}
                    className="rounded-full bg-gray-700/50 px-2 py-0.5 text-xs text-gray-400"
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
