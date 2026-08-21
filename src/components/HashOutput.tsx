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
    <div className="flex flex-col space-y-1 font-mono">
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`h-1 w-1 ${isComplete ? 'bg-[#34d399]' : 'bg-[#e5a93b]'}`} />
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
            DIGEST OUT: {algorithmName}
          </h2>
        </div>
        <span className="text-[10px] text-[#64748b] tabular-nums">{digestSize} BITS</span>
      </div>
      <div
        className={`group relative h-10 flex items-center justify-between rounded-[2px] border px-3 font-mono text-xs transition-all tabular-nums ${
          isComplete
            ? 'border-[#34d399]/40 bg-[#0c1813] text-[#34d399] phosphor-green'
            : 'border-[#1f2937] bg-[#0c1017] text-[#64748b]'
        }`}
      >
        <div className="truncate font-mono select-all pr-14 tracking-wider">
          {digest ? formatHexGroups(digest) : 'WAITING FOR COMPUTATION CYCLE...'}
        </div>
        {digest && (
          <button
            onClick={handleCopy}
            className="absolute right-1 top-1 bottom-1 my-auto flex items-center rounded-[2px] bg-[#1a2232] px-2 text-[10px] text-[#cbd5e1] hover:bg-[#253247] hover:text-white border border-[#1f2937] transition-all"
          >
            {copied ? '✓ COPIED' : 'COPY'}
          </button>
        )}
      </div>
    </div>
  );
}
