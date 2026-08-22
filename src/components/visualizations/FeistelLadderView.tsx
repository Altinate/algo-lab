import React, { useState } from 'react';
import type { ComputationStep } from '../../algorithms/types';
import { formatBinary } from '../../algorithms/utils';

interface FeistelLadderViewProps {
  step: ComputationStep;
}

export default function FeistelLadderView({ step }: FeistelLadderViewProps) {
  const [binaryMode, setBinaryMode] = useState(false);
  const data = step.data as {
    roundIndex?: number;
    totalRounds?: number;
    prevLHex?: string;
    prevRHex?: string;
    newLHex?: string;
    newRHex?: string;
    subkeyHex?: string;
    eExpansionHex?: string;
    sboxInHex?: string;
    sboxOutputs?: number[];
    fOutputHex?: string;
    outputHex?: string;
    blockIndex?: number;
    totalBlocks?: number;
  };

  const prevL = data.prevLHex || '00000000';
  const prevR = data.prevRHex || '00000000';
  const nextL = data.newLHex || '00000000';
  const nextR = data.newRHex || '00000000';
  const round = data.roundIndex ?? 0;
  const isRoundStep = round > 0 && data.subkeyHex;

  return (
    <div className="space-y-3 font-mono">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f2937] pb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#e5a93b] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#e5a93b]">
            FEISTEL NETWORK STATE LADDER
          </span>
          {round > 0 && (
            <span className="rounded-[2px] bg-[#1a1710] px-2 py-0.5 text-[9px] font-semibold text-[#e5a93b] border border-[#e5a93b]/30 tabular-nums">
              ROUND {round} / 16
            </span>
          )}
          {data.blockIndex !== undefined && data.totalBlocks !== undefined && data.totalBlocks > 1 && (
            <span className="rounded-[2px] bg-[#161220] px-2 py-0.5 text-[9px] font-semibold text-[#c084fc] border border-[#c084fc]/30 tabular-nums">
              BLOCK {data.blockIndex + 1} / {data.totalBlocks}
            </span>
          )}
        </div>

        <button
          onClick={() => setBinaryMode(!binaryMode)}
          className={`rounded-[2px] px-2 py-0.5 text-[9px] font-mono transition-colors ${
            binaryMode
              ? 'bg-[#e5a93b] text-black font-bold'
              : 'bg-[#0e131b] text-[#94a3b8] hover:text-white border border-[#1f2937]'
          }`}
        >
          {binaryMode ? 'BIN OCTETS' : 'HEX RADIX'}
        </button>
      </div>

      {/* 2-Branch Feistel Ladder (L_i and R_i) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Left Branch Card */}
        <div className="rounded-[2px] border border-[#38bdf8]/40 bg-[#0c121c] p-2.5 space-y-2">
          <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-[#38bdf8]" />
              LEFT REGISTER BRANCH (L)
            </span>
            <span className="text-[8px] text-[#64748b]">32 BITS</span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
              <span className="text-[#64748b] text-[9px]">L_{round - 1}:</span>
              <span className="font-bold text-[#cbd5e1] tabular-nums">0x{prevL}</span>
            </div>
            {isRoundStep && (
              <div className="flex items-center justify-center text-[10px] text-[#38bdf8]">
                <span>↓ (Passes R_{round - 1} directly)</span>
              </div>
            )}
            <div className="flex items-center justify-between rounded-[2px] bg-[#121c2e] p-1.5 border border-[#38bdf8]/50">
              <span className="text-[#38bdf8] text-[9px] font-semibold">L_{round}:</span>
              <span className="font-bold text-[#38bdf8] tabular-nums phosphor-cyan">0x{nextL}</span>
            </div>
          </div>
        </div>

        {/* Right Branch Card */}
        <div className="rounded-[2px] border border-[#34d399]/40 bg-[#0c1914] p-2.5 space-y-2">
          <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#34d399] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-[#34d399]" />
              RIGHT REGISTER BRANCH (R)
            </span>
            <span className="text-[8px] text-[#64748b]">32 BITS</span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
              <span className="text-[#64748b] text-[9px]">R_{round - 1}:</span>
              <span className="font-bold text-[#cbd5e1] tabular-nums">0x{prevR}</span>
            </div>
            {isRoundStep && (
              <div className="flex items-center justify-center text-[10px] text-[#34d399]">
                <span>↓ L_{round - 1} ⊕ F(R_{round - 1}, K_{round})</span>
              </div>
            )}
            <div className="flex items-center justify-between rounded-[2px] bg-[#12281e] p-1.5 border border-[#34d399]/50">
              <span className="text-[#34d399] text-[9px] font-semibold">R_{round}:</span>
              <span className="font-bold text-[#34d399] tabular-nums phosphor-emerald">0x{nextR}</span>
            </div>
          </div>
        </div>
      </div>

      {/* F-Function Telemetry Breakdown (if round > 0) */}
      {isRoundStep && (
        <div className="rounded-[2px] border border-[#e5a93b]/30 bg-[#0e1219] p-3 space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#e5a93b] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-[#e5a93b]" />
              FEISTEL F-FUNCTION TELEMETRY: F(R_{round - 1}, K_{round})
            </span>
            <span className="text-[9px] text-[#64748b]">32b → 48b → 8×(6b→4b S-BOX) → 32b</span>
          </div>

          {/* 1. Expansion & Subkey XOR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="rounded-[2px] bg-[#090c10] p-2 border border-[#1f2937]">
              <span className="text-[8px] text-[#64748b] uppercase block">E-Expansion (32b → 48b)</span>
              <span className="text-[#cbd5e1] font-mono font-bold tabular-nums">
                0x{data.eExpansionHex}
              </span>
            </div>
            <div className="rounded-[2px] bg-[#090c10] p-2 border border-[#e5a93b]/30">
              <span className="text-[8px] text-[#e5a93b] uppercase block">Subkey K_{round} (48b)</span>
              <span className="text-[#e5a93b] font-mono font-bold tabular-nums">
                0x{data.subkeyHex}
              </span>
            </div>
            <div className="rounded-[2px] bg-[#090c10] p-2 border border-[#38bdf8]/30">
              <span className="text-[8px] text-[#38bdf8] uppercase block">E(R) ⊕ K_{round} (S-Box In)</span>
              <span className="text-[#38bdf8] font-mono font-bold tabular-nums">
                0x{data.sboxInHex}
              </span>
            </div>
          </div>

          {/* 2. 8 S-Boxes Substitution Ribbon */}
          {data.sboxOutputs && (
            <div className="space-y-1">
              <span className="text-[8.5px] font-semibold text-[#94a3b8] uppercase tracking-wider block">
                8 S-BOX SUBSTITUTION NIBBLES (6-BIT IN → 4-BIT OUT):
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center text-xs">
                {data.sboxOutputs.map((nibble, sIdx) => (
                  <div
                    key={`sbox-${sIdx}`}
                    className="rounded-[2px] bg-[#121620] p-1 border border-[#1f2937] space-y-0.5"
                  >
                    <span className="text-[7.5px] text-[#64748b] block">S{sIdx + 1}</span>
                    <span className="text-[#34d399] font-bold font-mono">0x{nibble.toString(16)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Permutation P Output */}
          <div className="flex items-center justify-between rounded-[2px] bg-[#141a24] p-2 border border-[#1f2937] text-xs">
            <span className="text-[9px] text-[#cbd5e1] font-semibold">
              P-BOX PERMUTATION OUTPUT F(R, K):
            </span>
            <span className="text-[#38bdf8] font-mono font-bold tabular-nums phosphor-cyan">
              0x{data.fOutputHex}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
