import React, { useState } from 'react';
import { hexToString } from '../algorithms/utils';

interface CipherOutputProps {
  outputHex: string;
  tagHex?: string;
  tagValid?: boolean;
  algorithmName: string;
  direction?: 'encrypt' | 'decrypt';
  isComplete: boolean;
}

export default function CipherOutput({
  outputHex,
  tagHex,
  tagValid,
  algorithmName,
  direction = 'encrypt',
  isComplete,
}: CipherOutputProps) {
  const [copied, setCopied] = useState(false);
  const [viewAscii, setViewAscii] = useState(direction === 'decrypt');

  const isEncrypt = direction !== 'decrypt';
  const byteCount = Math.floor(outputHex.length / 2);
  const asciiText = hexToString(outputHex);

  const handleCopy = () => {
    if (!outputHex) return;
    const textToCopy = viewAscii ? asciiText : outputHex;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col space-y-1.5 font-mono">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 ${isEncrypt ? 'bg-[#34d399]' : 'bg-[#38bdf8]'}`} />
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isEncrypt ? 'text-[#34d399]' : 'text-[#38bdf8]'
            }`}
          >
            {isEncrypt ? 'CIPHERTEXT STREAM (HEX)' : 'RECOVERED PLAINTEXT'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewAscii(!viewAscii)}
            className="text-[9px] text-[#94a3b8] hover:text-white underline transition-colors"
          >
            {viewAscii ? 'VIEW RAW HEX' : 'VIEW ASCII TEXT'}
          </button>
          <span className="text-[10px] text-[#64748b] tabular-nums">
            {byteCount} BYTES ({byteCount * 8} BITS)
          </span>
        </div>
      </div>

      {/* Main Output Box */}
      <div className="relative">
        <div
          className={`flex min-h-9 items-center justify-between rounded-[2px] border bg-[#0c1017] px-3 py-1.5 font-mono text-xs tabular-nums select-all break-all ${
            isComplete ? 'border-[#34d399]/60' : 'border-[#1f2937]'
          }`}
        >
          <span
            className={`font-semibold tracking-wide ${
              outputHex
                ? isEncrypt
                  ? 'text-[#34d399] phosphor-emerald'
                  : 'text-[#38bdf8] phosphor-cyan'
                : 'text-[#475569]'
            }`}
          >
            {outputHex
              ? viewAscii
                ? asciiText || `[0x${outputHex}]`
                : outputHex
              : 'COMPUTING CIPHER STREAM...'}
          </span>

          {outputHex && (
            <button
              onClick={handleCopy}
              className="ml-2 shrink-0 rounded-[2px] bg-[#1a2232] px-2 py-0.5 text-[9px] font-medium text-[#38bdf8] hover:bg-[#243044] transition-colors border border-[#1f2937]"
            >
              {copied ? 'COPIED ✓' : 'COPY'}
            </button>
          )}
        </div>
      </div>

      {/* GCM Authentication Tag Banner (if present) */}
      {tagHex && (
        <div className="flex items-center justify-between rounded-[2px] border border-[#c084fc]/40 bg-[#120e18] px-2.5 py-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-[#c084fc]" />
            <span className="text-[9px] uppercase tracking-wider font-semibold text-[#c084fc]">
              AEAD AUTHENTICATION TAG:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#f8fafc] font-bold select-all tabular-nums">
              0x{tagHex}
            </span>
            {tagValid !== undefined && (
              <span
                className={`rounded-[2px] px-1.5 py-0.2 text-[8px] font-bold uppercase ${
                  tagValid
                    ? 'bg-[#0f1f17] text-[#34d399] border border-[#34d399]/40'
                    : 'bg-[#201014] text-[#f43f5e] border border-[#f43f5e]/40'
                }`}
              >
                {tagValid ? 'TAG MATCH (AUTHENTIC)' : 'TAG MISMATCH (FORGERY)'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
