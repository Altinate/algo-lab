import React from 'react';
import type { ComputationStep } from '../../algorithms/types';
import { CRC32_TABLE } from '../../algorithms/crc32';
import { uint32ToHex } from '../../algorithms/utils';

export interface XorTableData {
  byteIndex?: number;
  byteValue?: number;
  char?: string;
  prevCrc?: string;
  xorInput?: string;
  tableIndex?: string;
  tableValue?: string;
  shiftedCrc?: string;
  newCrc?: string;
}

interface Props {
  step: ComputationStep;
}

/** Visualizes XOR / polynomial operations for CRC32 */
export default function XorTableView({ step }: Props) {
  const data = step.data as XorTableData;

  const byteValue = data.byteValue;
  const byteChar = data.char;
  const byteIndex = data.byteIndex;
  const prevCrc = data.prevCrc;
  const xorInput = data.xorInput;
  const tableIndex = data.tableIndex;
  const tableValue = data.tableValue;
  const shiftedCrc = data.shiftedCrc;
  const newCrc = data.newCrc;

  // Extract raw numeric table index for table highlight
  let activeIndexNum: number | null = null;
  if (tableIndex) {
    const match = tableIndex.match(/\((\d+)\)/);
    if (match) {
      activeIndexNum = parseInt(match[1], 10);
    } else if (tableIndex.startsWith('0x')) {
      activeIndexNum = parseInt(tableIndex.slice(2), 16);
    }
  }

  return (
    <div className="space-y-2.5 font-mono text-[#f8fafc]">
      {/* ─── Hardware Telemetry Toolbar ───────────────────────────────── */}
      <div className="flex items-center justify-between bg-[#0b0e14] px-2.5 py-1 rounded-[2px] border border-[#1f2937] text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-[#38bdf8]" />
            <span className="text-[9px] uppercase tracking-wider text-[#64748b] font-medium">
              CRC32 POLYNOMIAL ENGINE (0xEDB88320)
            </span>
          </div>
          {byteIndex !== undefined && (
            <span className="rounded-[2px] bg-[#15120c] border border-[#e5a93b]/40 text-[#e5a93b] px-1.5 py-0.1 text-[9px] font-semibold tabular-nums phosphor-amber">
              BYTE OFFSET: 0x{byteIndex.toString(16).padStart(2, '0').toUpperCase()} (BYTE {byteIndex + 1})
            </span>
          )}
        </div>
        {byteValue !== undefined && (
          <div className="flex items-center gap-1.5 text-[10px] tabular-nums">
            <span className="text-[#64748b] text-[9px]">OCTET:</span>
            <span className="text-[#38bdf8] font-semibold">
              0x{byteValue.toString(16).padStart(2, '0').toUpperCase()}
            </span>
            {byteChar && (
              <span className="rounded-[2px] bg-[#10141d] border border-[#1f2937] px-1 text-white">
                '{byteChar}'
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── Main 2-Column Split: Telemetry vs 256-Entry ROM Table ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-2.5 items-start">
        {/* Left Column: Register Transformation Pipeline */}
        <div className="space-y-2">
          <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2.5 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#1f2937]">
              <span className="text-[9px] uppercase tracking-wider text-[#38bdf8] font-semibold">
                POLYNOMIAL TRANSFORMATION PIPELINE
              </span>
              <span className="text-[8px] text-[#64748b]">FCS-32 BITSTREAM</span>
            </div>

            <div className="grid gap-1.5 font-mono text-[10px] tabular-nums">
              {/* Step 1: Prev CRC */}
              {prevCrc && (
                <div className="flex items-center justify-between rounded-[2px] bg-[#0e131b] px-2 py-1.5 border border-[#1f2937]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-[#64748b]">1.</span>
                    <span className="text-[9px] uppercase tracking-wider text-[#94a3b8] font-medium">PREV CRC REGISTER</span>
                  </div>
                  <span className="text-[#38bdf8] font-medium">{prevCrc}</span>
                </div>
              )}

              {/* Step 2: XOR Index Calculation */}
              {xorInput && (
                <div className="flex items-center justify-between rounded-[2px] bg-[#0e131b] px-2 py-1.5 border border-[#1f2937]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-[#64748b]">2.</span>
                    <span className="text-[9px] uppercase tracking-wider text-[#94a3b8] font-medium">XOR LOOKUP INDEX</span>
                  </div>
                  <span className="text-[#e5a93b] font-medium">{xorInput}</span>
                </div>
              )}

              {/* Step 3: Polynomial ROM Lookup */}
              {tableValue && (
                <div className="flex items-center justify-between rounded-[2px] bg-[#0e131b] px-2 py-1.5 border border-[#1f2937]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-[#64748b]">3.</span>
                    <span className="text-[9px] uppercase tracking-wider text-[#94a3b8] font-medium">
                      TABLE[{tableIndex || 'INDEX'}]
                    </span>
                  </div>
                  <span className="text-[#c084fc] font-medium">{tableValue}</span>
                </div>
              )}

              {/* Step 4: Shifted CRC */}
              {shiftedCrc && (
                <div className="flex items-center justify-between rounded-[2px] bg-[#0e131b] px-2 py-1.5 border border-[#1f2937]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-[#64748b]">4.</span>
                    <span className="text-[9px] uppercase tracking-wider text-[#94a3b8] font-medium">CRC SHR 8</span>
                  </div>
                  <span className="text-[#94a3b8] font-medium">{shiftedCrc}</span>
                </div>
              )}

              {/* Step 5: Updated State */}
              {newCrc && (
                <div className="flex items-center justify-between rounded-[2px] bg-[#0c1813] px-2 py-2 border border-[#34d399]/40">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-[#34d399]">5.</span>
                    <span className="text-[9px] uppercase tracking-wider text-[#34d399] font-semibold">UPDATED CRC32 STATE</span>
                  </div>
                  <span className="text-[#34d399] font-bold text-xs phosphor-green">{newCrc}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 256-Entry ROM Table */}
        <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 flex flex-col h-[340px]">
          <div className="flex items-center justify-between pb-1 border-b border-[#1f2937] mb-1">
            <div className="flex items-center gap-1.5">
              <span className="h-1 w-1 bg-[#c084fc]" />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#c084fc]">
                POLYNOMIAL ROM [00..FF]
              </span>
            </div>
            <span className="text-[8px] text-[#475569] tabular-nums font-medium">256 WORDS</span>
          </div>

          <div className="overflow-y-auto space-y-0.5 pr-0.5 flex-1 font-mono text-[10px] tabular-nums">
            {Array.from(CRC32_TABLE).map((val, idx) => {
              const isActive = activeIndexNum === idx;
              const hexVal = uint32ToHex(val);
              const hexIdx = idx.toString(16).padStart(2, '0').toUpperCase();
              return (
                <div
                  key={idx}
                  className={`rounded-[2px] px-1.5 py-0.5 border transition-all ${
                    isActive
                      ? 'border-[#c084fc]/60 bg-[#140e1a] text-[#c084fc] ring-1 ring-[#c084fc]/40 phosphor-purple font-semibold'
                      : 'border-transparent bg-transparent text-[#64748b]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] text-[#475569]">0x{hexIdx}</span>
                      {isActive && <span className="text-[#c084fc] text-[8px]">▶</span>}
                    </div>
                    <span className={isActive ? 'text-[#c084fc]' : 'text-[#94a3b8]'}>
                      0x{hexVal}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
