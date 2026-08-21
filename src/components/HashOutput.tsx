import { useState } from 'react';
import { formatHexGroups } from '../algorithms/utils';

interface HashOutputProps {
  digest: string;
  algorithmName: string;
  digestSize: number;
  isComplete: boolean;
}

export default function HashOutput({
  digest,
  algorithmName,
  digestSize,
  isComplete,
}: HashOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!digest) return;
    try {
      await navigator.clipboard.writeText(digest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS contexts
      const ta = document.createElement('textarea');
      ta.value = digest;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-full flex-col space-y-2">
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          {algorithmName} Hash Output
        </h2>
        <span className="text-xs text-gray-500 font-mono">{digestSize} bits</span>
      </div>
      <div
        className={`group relative flex-1 min-h-[88px] flex flex-col justify-center rounded-lg border px-4 py-3 font-mono text-sm transition-all ${
          isComplete
            ? 'border-green-500/40 bg-green-500/10 text-green-300'
            : 'border-gray-600 bg-gray-800/50 text-gray-400'
        }`}
      >
        <div className="break-all leading-relaxed font-mono select-all">
          {digest ? formatHexGroups(digest) : 'Waiting for computation...'}
        </div>
        {digest && (
          <button
            onClick={handleCopy}
            className="absolute right-2.5 top-2.5 rounded-md bg-gray-700/90 px-2.5 py-1 text-xs text-gray-200 opacity-0 transition-opacity hover:bg-gray-600 group-hover:opacity-100 border border-gray-600 shadow-sm"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
}
