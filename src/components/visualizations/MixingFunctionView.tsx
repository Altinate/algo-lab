import React from 'react';
import type { ComputationStep } from '../../algorithms/types';
import type { GCallDetail } from '../../algorithms/blake2/engine';

interface Props {
  step: ComputationStep;
}

function truncateMiddle(hex: string, maxLen: number = 10): string {
  if (hex.length <= maxLen) return hex;
  const charsToShow = maxLen - 2; // leave room for '..'
  const front = Math.ceil(charsToShow / 2);
  const back = Math.floor(charsToShow / 2);
  return `${hex.slice(0, front)}..${hex.slice(hex.length - back)}`;
}

export default function MixingFunctionView({ step }: Props) {
  const data = step.data;
  const roundIndex = data.roundIndex as number | undefined;
  const state = data.state as string[] | undefined;
  const prevState = data.prevState as string[] | undefined;
  const gCalls = data.gCalls as GCallDetail[] | undefined;
  const mixType = data.mixType as string | undefined;
  const sigmaIndex = data.sigmaIndex as number | undefined;
  const sigma = data.sigma as number[] | undefined;

  const is64Bit = state && state.length > 0 && state[0].length > 8;

  const colCalls = gCalls?.filter(g => g.stepType === 'column') || [];
  const diagCalls = gCalls?.filter(g => g.stepType === 'diagonal') || [];

  return (
    <div className="space-y-2.5 font-mono text-[#f8fafc]">
      {/* ─── Telemetry Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-[#0b0e14] px-2.5 py-1 rounded-[2px] border border-[#1f2937] text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-[#38bdf8]" />
            <span className="text-[9px] uppercase tracking-wider text-[#64748b] font-medium">
              4×4 STATE MIXING ENGINE ({is64Bit ? '64-BIT / BLAKE2b' : '32-BIT / BLAKE2s'})
            </span>
          </div>
          {roundIndex !== undefined && (
            <span className="rounded-[2px] bg-[#15120c] border border-[#e5a93b]/40 text-[#e5a93b] px-1.5 py-0.1 text-[9px] font-semibold tabular-nums phosphor-amber">
              ROUND {roundIndex} {sigmaIndex !== undefined ? `(SIGMA[${sigmaIndex}])` : ''}
            </span>
          )}
        </div>
        {mixType && (
          <span className="rounded-[2px] bg-[#120e18] px-1.5 py-0.5 text-[9px] font-semibold text-[#c084fc] border border-[#c084fc]/35 uppercase tracking-wider">
            {mixType}
          </span>
        )}
      </div>

      {/* ─── 4×4 State Matrix Grid (Pre / Post Round) ──────────────────── */}
      {state && (
        <div className={`grid gap-2.5 ${prevState ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {prevState && (
            <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1">
              <div className="flex items-center justify-between pb-1 border-b border-[#1f2937]">
                <span className="text-[9px] uppercase tracking-wider text-[#64748b] font-medium">
                  PRE-ROUND 4×4 WORK MATRIX
                </span>
                <span className="text-[8px] text-[#475569]">16 WORDS</span>
              </div>
              <Matrix4x4 values={prevState} is64Bit={is64Bit} />
            </div>
          )}

          <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1">
            <div className="flex items-center justify-between pb-1 border-b border-[#1f2937]">
              <span className="text-[9px] uppercase tracking-wider text-[#38bdf8] font-semibold">
                {prevState ? 'POST-ROUND 4×4 WORK MATRIX' : 'CURRENT 4×4 WORK MATRIX'}
              </span>
              <span className="text-[8px] text-[#38bdf8] font-medium">MODIFIED</span>
            </div>
            <Matrix4x4 values={state} prevValues={prevState} is64Bit={is64Bit} />
          </div>
        </div>
      )}

      {/* ─── Sigma Permutation Indices ──────────────────────────────────── */}
      {sigma && (
        <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] px-2 py-1 flex items-center justify-between text-[9px]">
          <span className="text-[#64748b] uppercase font-medium">MESSAGE PERMUTATION Σ[{sigmaIndex}]:</span>
          <div className="flex items-center gap-1 tabular-nums">
            {sigma.map((sIdx, i) => (
              <span key={i} className="rounded-[2px] bg-[#0e131b] border border-[#1f2937] px-1 py-0.2 text-[#e5a93b]">
                {sIdx}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── G Function Mixing Calls (Columns & Diagonals) ──────────────── */}
      {gCalls && gCalls.length > 0 && (
        <div className="space-y-2">
          {/* Column Step */}
          {colCalls.length > 0 && (
            <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-[#1f2937]">
                <div className="flex items-center gap-1.5">
                  <span className="h-1 w-1 bg-[#34d399]" />
                  <span className="text-[9px] uppercase tracking-wider text-[#34d399] font-semibold">
                    1. COLUMN STEP: G-FUNCTIONS ACROSS VERTICAL LANES
                  </span>
                </div>
                <span className="text-[8px] text-[#64748b]">G(0,4,8,12) · G(1,5,9,13) · G(2,6,10,14) · G(3,7,11,15)</span>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
                {colCalls.map((g) => (
                  <GCallCard key={g.label} g={g} is64Bit={is64Bit} />
                ))}
              </div>
            </div>
          )}

          {/* Diagonal Step */}
          {diagCalls.length > 0 && (
            <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-[#1f2937]">
                <div className="flex items-center gap-1.5">
                  <span className="h-1 w-1 bg-[#c084fc]" />
                  <span className="text-[9px] uppercase tracking-wider text-[#c084fc] font-semibold">
                    2. DIAGONAL STEP: G-FUNCTIONS ACROSS DIAGONAL LANES
                  </span>
                </div>
                <span className="text-[8px] text-[#64748b]">G(0,5,10,15) · G(1,6,11,12) · G(2,7,8,13) · G(3,4,9,14)</span>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
                {diagCalls.map((g) => (
                  <GCallCard key={g.label} g={g} is64Bit={is64Bit} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Matrix4x4({
  values,
  prevValues,
  is64Bit,
}: {
  values: string[];
  prevValues?: string[];
  is64Bit?: boolean;
}) {
  const rows = [];
  for (let i = 0; i < values.length; i += 4) {
    rows.push(values.slice(i, i + 4));
  }

  return (
    <div className="space-y-1 font-mono text-[10px]">
      {rows.map((row, ri) => (
        <div key={ri} className="grid grid-cols-4 gap-1">
          {row.map((val, ci) => {
            const idx = ri * 4 + ci;
            const changed = prevValues ? prevValues[idx] !== val : false;
            const displayVal = is64Bit ? truncateMiddle(val, 8) : val;
            return (
              <div
                key={ci}
                className={`rounded-[2px] border px-1.5 py-0.5 tabular-nums flex items-center justify-between ${
                  changed
                    ? 'border-[#e5a93b]/60 bg-[#15120c] text-[#e5a93b] font-semibold phosphor-amber'
                    : 'border-[#1f2937] bg-[#0e131b] text-[#38bdf8] font-medium'
                }`}
                title={`v[${idx}]: 0x${val}`}
              >
                <span className="text-[8px] text-[#64748b]">v{idx}</span>
                <span className="text-[10px]">0x{displayVal}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function GCallCard({ g, is64Bit }: { g: GCallDetail; is64Bit?: boolean }) {
  const [a, b, c, d] = g.indices;
  const rotText = g.rotations.join(', ');

  return (
    <div className="rounded-[2px] border border-[#1f2937] bg-[#0e131b] p-1.5 space-y-1 font-mono text-[9px] tabular-nums">
      <div className="flex items-center justify-between border-b border-[#1f2937] pb-0.5">
        <span className="font-semibold text-[#e5a93b]">{g.label}</span>
        <span className="text-[7.5px] text-[#64748b]">ROTR({rotText})</span>
      </div>

      <div className="space-y-0.5 text-[8.5px]">
        <div className="flex items-center justify-between text-[#64748b]">
          <span>M IN:</span>
          <span className="text-[#94a3b8]">
            m[{g.inputs.xIdx}], m[{g.inputs.yIdx}]
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#64748b]">v[{a}]:</span>
          <span className="text-[#38bdf8]">0x{truncateMiddle(g.inputs.va, is64Bit ? 6 : 8)} → <span className="text-[#34d399]">0x{truncateMiddle(g.outputs.va, is64Bit ? 6 : 8)}</span></span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#64748b]">v[{b}]:</span>
          <span className="text-[#38bdf8]">0x{truncateMiddle(g.inputs.vb, is64Bit ? 6 : 8)} → <span className="text-[#34d399]">0x{truncateMiddle(g.outputs.vb, is64Bit ? 6 : 8)}</span></span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#64748b]">v[{c}]:</span>
          <span className="text-[#38bdf8]">0x{truncateMiddle(g.inputs.vc, is64Bit ? 6 : 8)} → <span className="text-[#34d399]">0x{truncateMiddle(g.outputs.vc, is64Bit ? 6 : 8)}</span></span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#64748b]">v[{d}]:</span>
          <span className="text-[#38bdf8]">0x{truncateMiddle(g.inputs.vd, is64Bit ? 6 : 8)} → <span className="text-[#34d399]">0x{truncateMiddle(g.outputs.vd, is64Bit ? 6 : 8)}</span></span>
        </div>
      </div>
    </div>
  );
}
