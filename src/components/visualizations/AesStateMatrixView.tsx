import React, { useState } from 'react';
import type { ComputationStep } from '../../algorithms/types';
import { formatBinary } from '../../algorithms/utils';

interface AesStateMatrixViewProps {
  step: ComputationStep;
}

export default function AesStateMatrixView({ step }: AesStateMatrixViewProps) {
  const [binaryMode, setBinaryMode] = useState(false);
  const data = step.data as {
    roundIndex?: number;
    totalRounds?: number;
    phase?: string;
    subStep?: string;
    operationName?: string;
    stateMatrix: string[][];
    prevStateMatrix?: string[][];
    roundKeyMatrix?: string[][];
    plainMatrix?: string[][];
    chainMatrix?: string[][];
    decryptedMatrix?: string[][];
    blockIndex?: number;
    totalBlocks?: number;
  };

  const state = data.stateMatrix || [
    ['00', '00', '00', '00'],
    ['00', '00', '00', '00'],
    ['00', '00', '00', '00'],
    ['00', '00', '00', '00'],
  ];
  const prevState = data.prevStateMatrix;
  const roundKey = data.roundKeyMatrix;
  const opName = data.operationName || data.subStep || 'State Inspection';

  return (
    <div className="space-y-3 font-mono">
      {/* Telemetry Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f2937] pb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#38bdf8] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">
            AES-{data.totalRounds === 14 ? '256' : data.totalRounds === 12 ? '192' : '128'} CIPHER STATE ANALYZER
          </span>
          {data.roundIndex !== undefined && data.totalRounds !== undefined && (
            <span className="rounded-[2px] bg-[#121620] px-2 py-0.5 text-[9px] font-semibold text-[#e5a93b] border border-[#e5a93b]/30 tabular-nums">
              ROUND {data.roundIndex} / {data.totalRounds}
            </span>
          )}
          {data.blockIndex !== undefined && data.totalBlocks !== undefined && data.totalBlocks > 1 && (
            <span className="rounded-[2px] bg-[#161220] px-2 py-0.5 text-[9px] font-semibold text-[#c084fc] border border-[#c084fc]/30 tabular-nums">
              BLOCK {data.blockIndex + 1} / {data.totalBlocks}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBinaryMode(!binaryMode)}
            className={`rounded-[2px] px-2 py-0.5 text-[9px] font-mono transition-colors ${
              binaryMode
                ? 'bg-[#38bdf8] text-black font-bold'
                : 'bg-[#0e131b] text-[#94a3b8] hover:text-white border border-[#1f2937]'
            }`}
          >
            {binaryMode ? 'BIN OCTETS' : 'HEX RADIX'}
          </button>
        </div>
      </div>

      {/* Operation Formula / Substep Banner */}
      <div className="flex items-center justify-between rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="rounded-[2px] bg-[#152238] px-1.5 py-0.5 text-[9px] font-bold text-[#38bdf8] border border-[#38bdf8]/40 uppercase">
            {opName}
          </span>
          <span className="text-[10px] text-[#cbd5e1] font-medium">
            {data.subStep || step.title}
          </span>
        </div>
        <span className="text-[9px] text-[#64748b] tabular-nums">
          4×4 BYTE MATRIX (128-BIT STATE)
        </span>
      </div>

      {/* Multi-Matrix Flow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
        {/* Matrix 1: Pre-State or Input */}
        {prevState && (
          <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2.5 space-y-1.5">
            <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
                <span className="h-1 w-1 bg-[#94a3b8]" />
                PRE-ROUND STATE MATRIX
              </span>
              <span className="text-[8px] text-[#64748b]">IN (16 BYTES)</span>
            </div>
            <MatrixGrid matrix={prevState} binaryMode={binaryMode} accent="gray" />
          </div>
        )}

        {/* Matrix 2: Operation Matrix (Round Key or Chaining Vector or MDS Matrix) */}
        {roundKey && (
          <div className="rounded-[2px] border border-[#e5a93b]/30 bg-[#0e131b] p-2.5 space-y-1.5">
            <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#e5a93b] flex items-center gap-1.5">
                <span className="h-1 w-1 bg-[#e5a93b]" />
                ROUND KEY W[{data.roundIndex !== undefined ? `${4 * data.roundIndex}..${4 * data.roundIndex + 3}` : 'k'}]
              </span>
              <span className="text-[8px] text-[#e5a93b] font-mono">⊕ XOR MASK</span>
            </div>
            <MatrixGrid matrix={roundKey} binaryMode={binaryMode} accent="amber" />
          </div>
        )}

        {/* Matrix 3: Current / Output State Matrix */}
        <div className="rounded-[2px] border border-[#38bdf8]/40 bg-[#0e141f] p-2.5 space-y-1.5">
          <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-[#38bdf8]" />
              CURRENT STATE MATRIX (OUTPUT)
            </span>
            <span className="text-[8px] text-[#34d399] font-semibold">STATE OUT</span>
          </div>
          <MatrixGrid
            matrix={state}
            prevMatrix={prevState}
            binaryMode={binaryMode}
            accent="cyan"
            highlightDiff
          />
        </div>
      </div>

      {/* Row Shift Helper Diagram (For ShiftRows / InvShiftRows) */}
      {(opName.includes('ShiftRows') || (data.subStep && data.subStep.includes('ShiftRows'))) && (
        <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 text-xs">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-[#fb923c] mb-1.5 flex items-center gap-1">
            <span className="h-1 w-1 bg-[#fb923c]" />
            <span>CYCLIC ROW SHIFT OFFSETS:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] tabular-nums">
            <div className="rounded-[2px] bg-[#0e131b] p-1 border border-[#1f2937] flex items-center justify-between">
              <span className="text-[#64748b]">ROW 0:</span>
              <span className="text-[#cbd5e1] font-semibold">NO SHIFT (0 BYTES)</span>
            </div>
            <div className="rounded-[2px] bg-[#0e131b] p-1 border border-[#1f2937] flex items-center justify-between">
              <span className="text-[#64748b]">ROW 1:</span>
              <span className="text-[#fb923c] font-semibold">{opName.includes('Inv') ? '→ SHIFT RIGHT 1' : '← SHIFT LEFT 1'}</span>
            </div>
            <div className="rounded-[2px] bg-[#0e131b] p-1 border border-[#1f2937] flex items-center justify-between">
              <span className="text-[#64748b]">ROW 2:</span>
              <span className="text-[#fb923c] font-semibold">{opName.includes('Inv') ? '→ SHIFT RIGHT 2' : '← SHIFT LEFT 2'}</span>
            </div>
            <div className="rounded-[2px] bg-[#0e131b] p-1 border border-[#1f2937] flex items-center justify-between">
              <span className="text-[#64748b]">ROW 3:</span>
              <span className="text-[#fb923c] font-semibold">{opName.includes('Inv') ? '→ SHIFT RIGHT 3' : '← SHIFT LEFT 3'}</span>
            </div>
          </div>
        </div>
      )}

      {/* MixColumns Polynomial Constant Table (For MixColumns / InvMixColumns) */}
      {(opName.includes('MixColumns') || (data.subStep && data.subStep.includes('MixColumns'))) && (
        <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 text-xs">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-[#c084fc] mb-1.5 flex items-center gap-1">
            <span className="h-1 w-1 bg-[#c084fc]" />
            <span>GALOIS FIELD GF(2⁸) MDS MATRIX CONSTANTS:</span>
          </div>
          <div className="text-[10px] text-[#94a3b8] font-mono">
            {opName.includes('Inv') ? (
              <span className="tabular-nums">
                Matrix C(x) = [ [0E, 0B, 0D, 09], [09, 0E, 0B, 0D], [0D, 09, 0E, 0B], [0B, 0D, 09, 0E] ] over GF(2⁸) mod (x⁴ + 1)
              </span>
            ) : (
              <span className="tabular-nums">
                Matrix C(x) = [ [02, 03, 01, 01], [01, 02, 03, 01], [01, 01, 02, 03], [03, 01, 01, 02] ] over GF(2⁸) mod (x⁴ + 1)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MatrixGrid({
  matrix,
  prevMatrix,
  binaryMode,
  accent,
  highlightDiff = false,
}: {
  matrix: string[][];
  prevMatrix?: string[][];
  binaryMode: boolean;
  accent: 'cyan' | 'amber' | 'gray';
  highlightDiff?: boolean;
}) {
  const accentBorder = {
    cyan: 'border-[#38bdf8]/40 bg-[#0e141f]',
    amber: 'border-[#e5a93b]/40 bg-[#14120e]',
    gray: 'border-[#1f2937] bg-[#0e131b]',
  }[accent];

  const accentText = {
    cyan: 'text-[#38bdf8]',
    amber: 'text-[#e5a93b]',
    gray: 'text-[#cbd5e1]',
  }[accent];

  return (
    <div className="space-y-1">
      {/* Column Headers */}
      <div className="grid grid-cols-4 gap-1 text-center text-[8px] text-[#64748b]">
        <span>COL 0</span>
        <span>COL 1</span>
        <span>COL 2</span>
        <span>COL 3</span>
      </div>

      {/* 4 Rows */}
      {matrix.map((row, r) => (
        <div key={`row-${r}`} className="grid grid-cols-4 gap-1">
          {row.map((cellHex, c) => {
            const hasChanged = highlightDiff && prevMatrix && prevMatrix[r] && prevMatrix[r][c] !== cellHex;
            const byteVal = parseInt(cellHex || '0', 16);
            const binStr = !isNaN(byteVal) ? byteVal.toString(2).padStart(8, '0') : '00000000';

            return (
              <div
                key={`cell-${r}-${c}`}
                className={`rounded-[2px] border p-1 text-center tabular-nums transition-all ${
                  hasChanged
                    ? 'border-[#38bdf8] bg-[#152238] shadow-[0_0_8px_rgba(56,189,248,0.2)]'
                    : accentBorder
                }`}
              >
                <div className="text-[7.5px] text-[#64748b] mb-0.5">
                  S{r},{c}
                </div>
                <div
                  className={`text-xs font-bold font-mono ${
                    hasChanged ? 'text-[#38bdf8] phosphor-cyan' : accentText
                  }`}
                >
                  0x{cellHex}
                </div>
                {binaryMode && (
                  <div className="text-[7px] text-[#64748b] tracking-tighter truncate mt-0.5 select-all">
                    {binStr}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
