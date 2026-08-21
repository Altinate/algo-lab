import React from 'react';
import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
}

/** Visualizes XOR / polynomial operations for CRC32 */
export default function XorTableView({ step }: Props) {
  const data = step.data;

  const byteValue = data.byte as number | undefined;
  const byteChar = data.char as string | undefined;
  const byteIndex = data.byteIndex as number | undefined;
  const prevCrc = data.prevCrc as string | undefined;
  const tableIndex = data.tableIndex as string | undefined;
  const tableValue = data.tableValue as string | undefined;
  const newCrc = data.newCrc as string | undefined;
  const xorInput = data.xorInput as string | undefined;

  return (
    <div className="space-y-2 font-mono">
      {byteIndex !== undefined && (
        <div className="flex items-center gap-2 text-xs pb-1 border-b border-[#1f2937] tabular-nums">
          <span className="text-[9px] uppercase tracking-wider text-[#64748b] font-medium">
            BYTE OFFSET 0x{byteIndex.toString(16).padStart(2, '0').toUpperCase()}
          </span>
          {byteChar && (
            <span className="rounded-[2px] bg-[#151c28] border border-[#1f2937] px-1.5 py-0.2 text-[10px] text-white">
              '{byteChar}'
            </span>
          )}
          {byteValue !== undefined && (
            <span className="text-[#38bdf8] font-medium text-[11px]">
              0x{byteValue.toString(16).padStart(2, '0')}
            </span>
          )}
        </div>
      )}

      <div className="grid gap-1 font-mono text-[11px] tabular-nums">
        {prevCrc && (
          <div className="flex items-center justify-between rounded-[2px] bg-[#0e131b] px-2 py-1 border border-[#1f2937]">
            <span className="text-[9px] uppercase tracking-wider text-[#64748b] font-medium">PREV CRC REGISTER</span>
            <span className="text-[#94a3b8] font-medium">{prevCrc}</span>
          </div>
        )}
        {xorInput && (
          <div className="flex items-center justify-between rounded-[2px] bg-[#0e131b] px-2 py-1 border border-[#1f2937]">
            <span className="text-[9px] uppercase tracking-wider text-[#64748b] font-medium">XOR INPUT STREAM</span>
            <span className="text-[#e5a93b] font-medium">{xorInput}</span>
          </div>
        )}
        {tableIndex && (
          <div className="flex items-center justify-between rounded-[2px] bg-[#0e131b] px-2 py-1 border border-[#1f2937]">
            <span className="text-[9px] uppercase tracking-wider text-[#64748b] font-medium">LOOKUP TABLE INDEX</span>
            <span className="text-[#c084fc] font-medium">{tableIndex}</span>
          </div>
        )}
        {tableValue && (
          <div className="flex items-center justify-between rounded-[2px] bg-[#0e131b] px-2 py-1 border border-[#1f2937]">
            <span className="text-[9px] uppercase tracking-wider text-[#64748b] font-medium">POLYNOMIAL VALUE</span>
            <span className="text-[#c084fc] font-medium">{tableValue}</span>
          </div>
        )}
        {newCrc && (
          <div className="flex items-center justify-between rounded-[2px] bg-[#0c1813] px-2 py-1 border border-[#34d399]/40">
            <span className="text-[9px] uppercase tracking-wider text-[#34d399] font-medium">UPDATED CRC32 STATE</span>
            <span className="text-[#34d399] font-semibold phosphor-green">{newCrc}</span>
          </div>
        )}
      </div>
    </div>
  );
}
