import React from 'react';
import type { ComputationStep } from '../../algorithms/types';

/**
 * Canonical Data Contract for State Matrix Visualizer.
 * Serves both the Keccak-f[1600] 5×5 (64-bit lanes) sponge matrix and the
 * Whirlpool 8×8 (8-bit byte cells) cipher matrix. All geometry is derived from the
 * emitted stateMatrix shape, so the view adapts without hardcoded Keccak constants.
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

/** Formats a hex lane with smart middle-truncation fallback (width = lane hex digits) */
function formatLaneValue(rawHex: string, laneHexLen: number) {
  const cleanHex = rawHex.replace(/^0x/i, '').padStart(laneHexLen, '0');
  const fullHex = `0x${cleanHex}`;

  if (laneHexLen <= 2) {
    return { full: fullHex, mid: fullHex };
  }

  const midTruncated = `0x${cleanHex.slice(0, 4)}..${cleanHex.slice(-4)}`;
  return { full: fullHex, mid: midTruncated };
}

/** Visualizes a keccak-equivalent 5×5 or Whirlpool 8×8 state matrix */
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

  // ─── Derive matrix geometry from the emitted data shape ────────────────
  const dim = stateMatrix.length;               // 5 (Keccak) or 8 (Whirlpool)
  const sampleCell = (stateMatrix[0]?.[0] ?? '').replace(/^0x/i, '');
  const laneHexLen = sampleCell.length || (dim === 8 ? 2 : 16);
  const laneBits = laneHexLen * 4;              // 64 for Keccak lane, 8 for Whirlpool byte
  const totalBits = dim * dim * laneBits;       // 1600 or 512
  const cellCount = dim * dim;                  // 25 or 64
  const isKeccak = dim === 5 && laneBits === 64;
  const totalRounds = isKeccak ? 24 : 10;
  const cellWord = isKeccak ? 'LANES' : 'BYTES';
  const algoTitle = isKeccak
    ? `KECCAK-f[1600] ${dim}×${dim} STATE MATRIX (${totalBits} BITS)`
    : `WHIRLPOOL ${dim}×${dim} CIPHER MATRIX (${totalBits} BITS)`;

  return (
    <div className="space-y-2.5 font-mono text-[#f8fafc]">
      {/* ─── Hardware Telemetry Toolbar ───────────────────────────────── */}
      <div className="flex items-center justify-between bg-[#0b0e14] px-2.5 py-1 rounded-[2px] border border-[#1f2937] text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-[#38bdf8]" />
            <span className="text-[9px] uppercase tracking-wider text-[#64748b] font-medium">
              {algoTitle}
            </span>
          </div>
          {roundIndex !== undefined && (
            <span className="rounded-[2px] bg-[#15120c] border border-[#e5a93b]/40 text-[#e5a93b] px-1.5 py-0.1 text-[9px] font-semibold tabular-nums phosphor-amber">
              ROUND {roundIndex} OF {totalRounds}
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
      {(isKeccak && (subStep || roundConstant)) && (
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

      {/* ─── Dynamic State Matrix Tables (Pre / Post Round) ───────────── */}
      <div className={`grid gap-2.5 ${prevStateMatrix ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'} w-full`}>
        {prevStateMatrix && (
          <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1">
            <div className="flex items-center justify-between pb-1 border-b border-[#1f2937]">
              <span className="text-[9px] uppercase tracking-wider text-[#64748b] font-medium">
                PRE-ROUND {dim}×{dim} MATRIX: A[x, y]
              </span>
              <span className="text-[8px] text-[#475569]">{cellCount} {cellWord} ({totalBits} BITS)</span>
            </div>
            <StateGrid matrix={prevStateMatrix} laneHexLen={laneHexLen} />
          </div>
        )}
        <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1">
          <div className="flex items-center justify-between pb-1 border-b border-[#1f2937]">
            <span className="text-[9px] uppercase tracking-wider text-[#38bdf8] font-semibold">
              {prevStateMatrix ? `POST-ROUND ${dim}×${dim} MATRIX: A′[x, y]` : `CURRENT ${dim}×${dim} STATE MATRIX: A[x, y]`}
            </span>
            <span className="text-[8px] text-[#38bdf8] font-medium">{cellCount} {cellWord} ({totalBits} BITS)</span>
          </div>
          <StateGrid
            matrix={stateMatrix}
            prevMatrix={prevStateMatrix}
            laneHexLen={laneHexLen}
          />
        </div>
      </div>
    </div>
  );
}

function StateGrid({
  matrix,
  prevMatrix,
  laneHexLen,
}: {
  matrix: string[][];
  prevMatrix?: string[][];
  laneHexLen: number;
}) {
  const dim = matrix.length;
  return (
    <div className="overflow-x-auto w-full">
      <table className="border-collapse w-full table-fixed font-mono text-[10px] sm:text-[11px] tabular-nums">
        <thead>
          <tr>
            <th className="p-1 text-[8px] text-[#475569] font-medium text-left w-8">Y\X</th>
            {Array.from({ length: dim }, (_, x) => (
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
                const formatted = formatLaneValue(cell, laneHexLen);

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
                    {/* Full hex for 64-bit lanes on wide viewports, smart head+tail middle-truncation on compact */}
                    {formatted.full === formatted.mid ? (
                      <span className="inline tracking-tight select-all">{formatted.full}</span>
                    ) : (
                      <>
                        <span className="hidden 2xl:inline tracking-tight select-all">
                          {formatted.full}
                        </span>
                        <span className="inline 2xl:hidden tracking-tight select-all">
                          {formatted.mid}
                        </span>
                      </>
                    )}
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
