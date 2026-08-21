import React from 'react';
import type { ComputationStep } from '../../algorithms/types';

/**
 * Canonical Data Contract for 5×5 State Matrix Visualizer (Keccak-f[1600] / SHA-3)
 */
export interface StateMatrixData {
  roundIndex?: number;
  subStep?: string;
  roundConstant?: string;
  rateBits?: number;
  capacityBits?: number;
  absorbLanes?: number;
  spongePhase?: string;
  stateMatrix?: string[][];
  prevStateMatrix?: string[][];
}

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
  const data = step.data as unknown as StateMatrixData;
  const stateMatrix = data.stateMatrix;
  const prevStateMatrix = data.prevStateMatrix;
  const roundIndex = data.roundIndex;
  const subStep = data.subStep;
  const roundConstant = data.roundConstant;
  const spongePhase = data.spongePhase;
  const rateBits = data.rateBits;
  const capacityBits = data.capacityBits;

  if (!stateMatrix) {
    return (
      <div className="text-[11px] text-[#64748b] font-mono p-4 text-center">
        STATE MATRIX DATA UNAVAILABLE
      </div>
    );
  }

  return (
    <div className="space-y-2.5 font-mono text-[#f8fafc]">
      {/* ─── Hardware Telemetry Toolbar ───────────────────────────────── */}
      <div className="flex items-center justify-between bg-[#0b0e14] px-2.5 py-1 rounded-[2px] border border-[#1f2937] text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-[#38bdf8]" />
            <span className="text-[9px] uppercase tracking-wider text-[#64748b] font-medium">
              KECCAK-f[1600] 5×5 STATE MATRIX (1600 BITS)
            </span>
          </div>
          {roundIndex !== undefined && (
            <span className="rounded-[2px] bg-[#15120c] border border-[#e5a93b]/40 text-[#e5a93b] px-1.5 py-0.1 text-[9px] font-semibold tabular-nums phosphor-amber">
              ROUND {roundIndex} OF 24
            </span>
          )}
          {spongePhase && (
            <span className="rounded-[2px] bg-[#120e18] px-1.5 py-0.2 text-[9px] font-semibold text-[#c084fc] border border-[#c084fc]/35 uppercase tracking-wider">
              {spongePhase}
            </span>
          )}
        </div>
        {rateBits && capacityBits && (
          <div className="flex items-center gap-2 text-[9px] text-[#64748b] tabular-nums">
            <span>RATE: <strong className="text-[#38bdf8]">{rateBits}b</strong></span>
            <span>·</span>
            <span>CAPACITY: <strong className="text-[#94a3b8]">{capacityBits}b</strong></span>
          </div>
        )}
      </div>

      {/* ─── Sub-step & Round Constant Banner ─────────────────────────── */}
      {(subStep || roundConstant) && (
        <div className="flex items-center justify-between bg-[#0c1017] px-2.5 py-1 rounded-[2px] border border-[#1f2937] text-[10px] tabular-nums">
          <div className="flex items-center gap-2">
            <span className="text-[#64748b] uppercase font-medium">PERMUTATION GATES:</span>
            <span className="text-[#34d399] font-medium">{subStep || 'θ → ρ → π → χ → ι'}</span>
          </div>
          {roundConstant && (
            <div className="flex items-center gap-1.5">
              <span className="text-[#64748b] text-[9px]">ROUND CONSTANT ι (RC):</span>
              <span className="text-[#e5a93b] font-semibold">{roundConstant}</span>
            </div>
          )}
        </div>
      )}

      {/* ─── Dynamic 5x5 State Matrix Tables (Pre / Post Round) ───────── */}
      <div className={`grid gap-2.5 ${prevStateMatrix ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'} w-full`}>
        {prevStateMatrix && (
          <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1">
            <div className="flex items-center justify-between pb-1 border-b border-[#1f2937]">
              <span className="text-[9px] uppercase tracking-wider text-[#64748b] font-medium">
                PRE-ROUND 5×5 MATRIX: A[x, y]
              </span>
              <span className="text-[8px] text-[#475569]">25 LANES (1600 BITS)</span>
            </div>
            <StateGrid matrix={prevStateMatrix} />
          </div>
        )}
        <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1">
          <div className="flex items-center justify-between pb-1 border-b border-[#1f2937]">
            <span className="text-[9px] uppercase tracking-wider text-[#38bdf8] font-semibold">
              {prevStateMatrix ? 'POST-ROUND 5×5 MATRIX: A′[x, y]' : 'CURRENT 5×5 STATE MATRIX: A[x, y]'}
            </span>
            <span className="text-[8px] text-[#38bdf8] font-medium">25 LANES (1600 BITS)</span>
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
            <th className="p-1 text-[8px] text-[#475569] font-medium text-left w-8">Y\X</th>
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
                    className={`border border-[#1f2937] px-1 py-1 text-center transition-colors overflow-hidden ${
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
