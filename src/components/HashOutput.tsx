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
    <div className="flex flex-col space-y-1.5">
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          {algorithmName} Hash Output
        </h2>
        <span className="text-[11px] text-gray-500 font-mono">{digestSize} bits</span>
      </div>
      <div
        className={`group relative h-11 flex items-center justify-between rounded-lg border px-3.5 font-mono text-xs sm:text-sm transition-all ${
          isComplete
            ? 'border-green-500/40 bg-green-500/10 text-green-300'
            : 'border-gray-700 bg-gray-800/80 text-gray-400'
        }`}
      >
        <div className="truncate font-mono select-all pr-14">
          {digest ? formatHexGroups(digest) : 'Waiting for computation...'}
        </div>
        {digest && (
          <button
            onClick={handleCopy}
            className="absolute right-2 top-2 bottom-2 my-auto flex items-center rounded bg-gray-700/90 px-2.5 text-xs text-gray-200 opacity-90 transition-all hover:opacity-100 hover:bg-gray-600 border border-gray-600 shadow-sm"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
}
