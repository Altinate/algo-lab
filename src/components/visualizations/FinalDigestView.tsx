import React from 'react';
import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
}

/** Visualizes the final hash digest output */
export default function FinalDigestView({ step }: Props) {
  const data = step.data;
  const hashValues = data.hashValues as Array<{ label: string; hex: string }> | undefined;
  const digest = data.digest as string;
  const digestFormatted = data.digestFormatted as string | undefined;

  return (
    <div className="space-y-3 font-mono">
      {/* Hash values that compose the digest */}
      {hashValues && (
        <div className="rounded-[2px] bg-[#0c1017] p-3 border border-[#1f2937]">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2937] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">
              STATE ACCUMULATOR REGISTERS
            </span>
            <span className="text-[9px] text-[#64748b] tabular-nums">
              {hashValues.length} WORDS ({hashValues.length * 32} BITS)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 tabular-nums">
            {hashValues.map((h, i) => (
              <div
                key={i}
                className="rounded-[2px] border border-[#1f2937] bg-[#0e131b] px-2 py-1 text-xs"
              >
                <span className="text-[9px] text-[#64748b] block">{h.label}</span>
                <span className="text-[#38bdf8] font-bold">0x{h.hex}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Bus Concatenation indicator */}
      <div className="flex items-center gap-2 text-[#64748b] text-[10px] uppercase font-bold">
        <div className="h-px flex-1 bg-[#1f2937]" />
        <span>CONCATENATE REGISTERS TO FINAL BUS DIGEST</span>
        <div className="h-px flex-1 bg-[#1f2937]" />
      </div>

      {/* Final digest banner */}
      <div className="rounded-[2px] border border-[#34d399]/40 bg-[#0c1813] p-4 text-[#34d399] tabular-nums">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#34d399]">
            FINAL CRYPTOGRAPHIC DIGEST
          </span>
          <span className="text-[9px] text-[#64748b] uppercase">
            {digest.length * 4} BITS ({digest.length / 2} BYTES)
          </span>
        </div>
        <p className="break-all font-mono text-base sm:text-lg leading-relaxed text-[#34d399] font-bold tracking-wider phosphor-green select-all">
          {digestFormatted || digest}
        </p>
      </div>
    </div>
  );
}
