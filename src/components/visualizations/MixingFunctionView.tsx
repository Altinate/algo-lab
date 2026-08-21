import React from 'react';
import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
}

/** Visualizes BLAKE2/BLAKE3 G mixing function with state columns */
export default function MixingFunctionView({ step }: Props) {
  const data = step.data;
  const roundIndex = data.roundIndex as number | undefined;
  const state = data.state as string[] | undefined;
  const prevState = data.prevState as string[] | undefined;
  const gCalls = data.gCalls as Array<{
    label: string;
    inputs: string[];
    outputs: string[];
  }> | undefined;
  const mixType = data.mixType as string | undefined;

  return (
    <div className="space-y-2.5 font-mono">
      {roundIndex !== undefined && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] uppercase font-medium text-[#64748b] tabular-nums">
            ROUND 0x{roundIndex.toString(16).padStart(2, '0').toUpperCase()}
          </span>
          {mixType && (
            <span className="rounded-[2px] bg-[#120e18] px-1.5 py-0.2 text-[9px] font-semibold text-[#c084fc] border border-[#c084fc]/35 uppercase tracking-wider">
              {mixType}
            </span>
          )}
        </div>
      )}

      {/* G function calls */}
      {gCalls && gCalls.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-[9px] uppercase tracking-wider text-[#64748b] font-medium">
            G MIXING OPERATIONS
          </h4>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {gCalls.map((g) => (
              <div
                key={g.label}
                className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1"
              >
                <span className="text-[9px] uppercase font-semibold text-[#94a3b8]">{g.label}</span>
                <div className="flex items-center gap-1 font-mono text-[10px] tabular-nums">
                  <span className="text-[#64748b] text-[8px] uppercase font-medium">IN:</span>
                  {g.inputs.map((v, i) => (
                    <span key={i} className="text-[#38bdf8] font-medium">
                      0x{v.slice(0, 8)}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px] tabular-nums">
                  <span className="text-[#64748b] text-[8px] uppercase font-medium">OUT:</span>
                  {g.outputs.map((v, i) => (
                    <span key={i} className="text-[#34d399] font-medium">
                      0x{v.slice(0, 8)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* State display */}
      {state && (
        <div className={prevState ? 'grid gap-2.5 md:grid-cols-2' : ''}>
          {prevState && (
            <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2">
              <h4 className="mb-1 text-[9px] uppercase tracking-wider text-[#64748b] font-medium">
                PRE-ROUND 16-WORD STATE
              </h4>
              <StateColumn values={prevState} />
            </div>
          )}
          <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2">
            <h4 className="mb-1 text-[9px] uppercase tracking-wider text-[#38bdf8] font-semibold">
              {prevState ? 'POST-ROUND 16-WORD STATE' : 'CURRENT 16-WORD STATE'}
            </h4>
            <StateColumn values={state} prevValues={prevState} />
          </div>
        </div>
      )}

      {!state && !gCalls && (
        <div className="text-[11px] text-[#64748b] font-mono">
          MIXING OPERATION DATA READY
        </div>
      )}
    </div>
  );
}

function StateColumn({
  values,
  prevValues,
}: {
  values: string[];
  prevValues?: string[];
}) {
  const rows = [];
  for (let i = 0; i < values.length; i += 4) {
    rows.push(values.slice(i, i + 4));
  }

  return (
    <div className="space-y-1">
      {rows.map((row, ri) => (
        <div key={ri} className="grid grid-cols-4 gap-1">
          {row.map((val, ci) => {
            const idx = ri * 4 + ci;
            const changed = prevValues ? prevValues[idx] !== val : false;
            return (
              <span
                key={ci}
                className={`rounded-[2px] border px-1 py-0.5 font-mono text-[10px] tabular-nums text-center ${
                  changed
                    ? 'border-[#e5a93b]/50 bg-[#15120c] text-[#e5a93b] font-semibold phosphor-amber'
                    : 'border-[#1f2937] bg-[#0e131b] text-[#38bdf8] font-medium'
                }`}
              >
                v{idx}: 0x{val.slice(0, 6)}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
