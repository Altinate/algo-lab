import React from 'react';
import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
}

/** Formats a 64-bit hex lane with smart middle-truncation fallback */
function formatLaneValue(rawHex: string) {
  const cleanHex = rawHex.replace(/^0x/i, '').padStart(16, '0');
  const fullHex = `0x${cleanHex}`;
  const midTruncated = `0x${cleanHex.slice(0, 4)}..${cleanHex.slice(-4)}`;

  return {
    full: fullHex,
    mid: midTruncated,
  };
}

/** Visualizes a 5×5 state matrix for Keccak/SHA-3 algorithms */
export default function StateMatrixView({ step }: Props) {
  const data = step.data;
  const stateMatrix = data.stateMatrix as string[][] | undefined;
  const prevStateMatrix = data.prevStateMatrix as string[][] | undefined;
  const roundIndex = data.roundIndex as number | undefined;
  const subStep = data.subStep as string | undefined;

  if (!stateMatrix) {
    return (
      <div className="text-[11px] text-[#64748b] font-mono">
        STATE MATRIX DATA UNAVAILABLE
      </div>
    );
  }

  return (
    <div className="space-y-3 font-mono">
      {/* Step and Round Indicator Header */}
      {roundIndex !== undefined && (
        <div className="flex items-center justify-between pb-1 border-b border-[#1f2937] text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-medium text-[#64748b] tabular-nums">
              KECCAK-F[1600] ROUND 0x{roundIndex.toString(16).padStart(2, '0').toUpperCase()}
            </span>
            {subStep && (
              <span className="rounded-[2px] bg-[#120e18] px-2 py-0.5 text-[9px] font-semibold text-[#c084fc] border border-[#c084fc]/40 uppercase tracking-wider">
                STEP: {subStep}
              </span>
            )}
          </div>
          <span className="text-[9px] text-[#475569] uppercase tracking-wider">
            STATE: 1600 BITS (5×5 64-BIT LANES)
          </span>
        </div>
      )}

      {/* Dynamic 5x5 State Matrix Tables (Side-by-side on wide screens) */}
      <div className="grid gap-3 xl:grid-cols-2 w-full">
        {prevStateMatrix && (
          <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2.5 space-y-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-[#1f2937]">
              <span className="text-[9px] uppercase tracking-wider text-[#64748b] font-medium">
                PRE-ROUND STATE: A[x, y]
              </span>
              <span className="text-[8px] text-[#475569]">25 LANES</span>
            </div>
            <StateGrid matrix={prevStateMatrix} />
          </div>
        )}
        <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2.5 space-y-1.5">
          <div className="flex items-center justify-between pb-1 border-b border-[#1f2937]">
            <span className="text-[9px] uppercase tracking-wider text-[#38bdf8] font-semibold">
              {prevStateMatrix ? 'POST-ROUND STATE: A′[x, y]' : 'CURRENT 5×5 STATE MATRIX: A[x, y]'}
            </span>
            <span className="text-[8px] text-[#475569]">25 LANES (1600 BITS)</span>
          </div>
          <StateGrid
            matrix={stateMatrix}
            prevMatrix={prevStateMatrix}
          />
        </div>
      </div>
    </div>
  );
}

function StateGrid({
  matrix,
  prevMatrix,
}: {
  matrix: string[][];
  prevMatrix?: string[][];
}) {
  return (
    <div className="overflow-x-auto w-full">
      <table className="border-collapse w-full table-fixed font-mono text-[10px] sm:text-[11px] tabular-nums">
        <thead>
          <tr>
            <th className="p-1 text-[8px] text-[#475569] font-medium text-left w-9">Y\X</th>
            {[0, 1, 2, 3, 4].map((x) => (
              <th key={x} className="p-1 text-[8px] text-[#475569] font-medium text-center">
                x={x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, y) => (
            <tr key={y}>
              <td className="p-1 text-[8px] text-[#475569] font-medium border-r border-[#1f2937]">
                y={y}
              </td>
              {row.map((cell, x) => {
                const changed = prevMatrix
                  ? prevMatrix[y]?.[x] !== cell
                  : false;
                const formatted = formatLaneValue(cell);

                return (
                  <td
                    key={x}
                    title={`A[${x}, ${y}] = ${formatted.full}`}
                    className={`border border-[#1f2937] px-1.5 py-1 text-center transition-colors overflow-hidden ${
                      changed
                        ? 'bg-[#16120b] text-[#e5a93b] font-semibold border-[#e5a93b]/40 phosphor-amber'
                        : 'bg-[#0e131b] text-[#38bdf8] font-medium'
                    }`}
                  >
                    {/* Full 18-char hex on medium/wide viewports, smart head+tail middle-truncation on compact */}
                    <span className="hidden 2xl:inline tracking-tight select-all">
                      {formatted.full}
                    </span>
                    <span className="inline 2xl:hidden tracking-tight select-all">
                      {formatted.mid}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
