import React from 'react';
import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
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
    <div className="space-y-2.5 font-mono">
      {roundIndex !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-medium text-[#64748b] tabular-nums">
            ROUND 0x{roundIndex.toString(16).padStart(2, '0').toUpperCase()}
          </span>
          {subStep && (
            <span className="rounded-[2px] bg-[#120e18] px-1.5 py-0.2 text-[9px] font-semibold text-[#c084fc] border border-[#c084fc]/35 uppercase tracking-wider">
              STEP: {subStep}
            </span>
          )}
        </div>
      )}

      <div className="grid gap-2.5 lg:grid-cols-2">
        {prevStateMatrix && (
          <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2">
            <h4 className="mb-1 text-[9px] uppercase tracking-wider text-[#64748b] font-medium">
              PRE-ROUND STATE (5×5 64-BIT LANES)
            </h4>
            <StateGrid matrix={prevStateMatrix} />
          </div>
        )}
        <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2">
          <h4 className="mb-1 text-[9px] uppercase tracking-wider text-[#38bdf8] font-semibold">
            {prevStateMatrix ? 'POST-ROUND STATE (5×5 LANES)' : 'CURRENT 5×5 STATE MATRIX'}
          </h4>
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
    <div className="overflow-x-auto">
      <table className="border-collapse w-full font-mono text-[11px] tabular-nums">
        <thead>
          <tr>
            <th className="p-0.5 text-[8px] text-[#475569] font-medium text-left">Y\X</th>
            {[0, 1, 2, 3, 4].map((x) => (
              <th key={x} className="p-0.5 text-[8px] text-[#475569] font-medium text-center">
                x={x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, y) => (
            <tr key={y}>
              <td className="p-0.5 text-[8px] text-[#475569] font-medium">y={y}</td>
              {row.map((cell, x) => {
                const changed = prevMatrix
                  ? prevMatrix[y]?.[x] !== cell
                  : false;
                return (
                  <td
                    key={x}
                    className={`border border-[#1f2937] px-1 py-0.5 text-center transition-colors ${
                      changed
                        ? 'bg-[#15120c] text-[#e5a93b] font-semibold phosphor-amber'
                        : 'bg-[#0e131b] text-[#38bdf8] font-medium'
                    }`}
                  >
                    0x{cell.length > 8 ? cell.slice(0, 8) + '..' : cell}
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
