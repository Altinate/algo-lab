import React, { useState } from 'react';
import type { ComputationStep } from '../../algorithms/types';
import BitwiseOperationRow from './BitwiseOperationRow';
import CompressionFlowDiagram from './CompressionFlowDiagram';
import { formatBinaryGroups } from '../../algorithms/utils';

interface Props {
  step: ComputationStep;
}

interface VariableItem {
  label: string;
  hex: string;
  binary?: string;
}

interface ScheduleItem {
  index: number;
  hex: string;
  binary?: string;
  computed?: boolean;
  active?: boolean;
}

interface ConstantItem {
  index: number;
  hex: string;
  binary?: string;
  active?: boolean;
}

export default function RoundComputationView({ step }: Props) {
  const data = step.data;
  const [binaryMode, setBinaryMode] = useState(true);

  // Extract variables
  const prevVars = data.prevVariables as VariableItem[] | undefined;
  const newVars = data.newVariables as VariableItem[] | undefined;
  const initVars = data.variables as VariableItem[] | undefined;
  const displayVars = newVars || prevVars || initVars || [];

  // Extract schedule items (Left Column)
  const schedule = (data.schedule as ScheduleItem[] | undefined) || [];

  // Extract constants (Right Column)
  const constants = (data.constants as ConstantItem[] | undefined) || [];
  const activeK = data.activeK as ConstantItem | undefined;
  const activeW = data.activeW as ScheduleItem | undefined;

  // Sub-computation details
  const temp1 = data.temp1 as any;
  const temp2 = data.temp2 as any;
  const sigma0Expansion = data.sigma0 as any;
  const sigma1Expansion = data.sigma1 as any;
  const wMinus16 = data.wMinus16 as any;
  const wMinus7 = data.wMinus7 as any;
  const scheduleResult = data.result as any;

  // Hash updates
  const updates = data.updates as Array<{
    label: string;
    prevHex: string;
    prevBinary?: string;
    addHex: string;
    addBinary?: string;
    newHex: string;
    newBinary?: string;
  }> | undefined;

  const roundIdx = data.roundIndex as number | undefined;

  return (
    <div className="space-y-3 font-mono text-[#f8fafc]">
      {/* ─── Hardware Telemetry Toolbar ───────────────────────────────── */}
      <div className="flex items-center justify-between bg-[#0b0e14] px-3 py-1.5 rounded-[2px] border border-[#1f2937] text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-none bg-[#38bdf8]" />
            <span className="text-[10px] uppercase tracking-wider text-[#64748b] font-bold">
              LOGIC ANALYZER: 3-BUS STATE INSPECTOR
            </span>
          </div>
          {roundIdx !== undefined && (
            <span className="rounded-[2px] bg-[#17140e] border border-[#e5a93b]/50 text-[#e5a93b] px-2 py-0.2 text-[10px] font-bold tabular-nums phosphor-amber">
              CYCLE: 0x{roundIdx.toString(16).padStart(2, '0').toUpperCase()} (R{roundIdx})
            </span>
          )}
        </div>
        <button
          onClick={() => setBinaryMode(!binaryMode)}
          className="rounded-[2px] border border-[#1f2937] bg-[#121620] px-2.5 py-0.5 text-[10px] text-[#94a3b8] hover:bg-[#1a2232] hover:text-[#f8fafc] transition-colors"
        >
          {binaryMode ? 'MODE: HEX + BINARY' : 'MODE: HEX ONLY'}
        </button>
      </div>

      {/* ─── Main 3-Column Persistent Architecture ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_240px] gap-3 items-start">
        {/* ========================================================================= */}
        {/* COLUMN 1: MESSAGE BUFFER INSPECTOR (W[00..63]) */}
        {/* ========================================================================= */}
        <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2.5 flex flex-col h-[680px]">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2937] mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="h-1 w-1 bg-[#38bdf8]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">
                BUFFER: W[00..63]
              </span>
            </div>
            <span className="text-[9px] text-[#475569] tabular-nums">
              {schedule.length || 64} WORDS
            </span>
          </div>

          {schedule.length > 0 ? (
            <div className="overflow-y-auto space-y-0.5 pr-0.5 flex-1 font-mono text-[11px]">
              {schedule.map((item) => {
                const isActive = item.active || (roundIdx !== undefined && item.index === roundIdx);
                const offset = (item.index * 4).toString(16).padStart(2, '0').toUpperCase();
                return (
                  <div
                    key={item.index}
                    className={`rounded-[2px] px-1.5 py-1 border transition-all tabular-nums ${
                      isActive
                        ? 'border-[#e5a93b]/70 bg-[#16120b] text-[#e5a93b] ring-1 ring-[#e5a93b]/40 phosphor-amber'
                        : item.computed
                          ? 'border-[#1f2937] bg-[#0e131b] text-[#38bdf8]'
                          : 'border-transparent bg-transparent text-[#475569]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-[#475569]">0x{offset}</span>
                        <span className="font-bold text-[10px]">
                          W[{item.index.toString().padStart(2, '0')}]
                        </span>
                        {isActive && <span className="text-[#e5a93b] text-[9px] font-bold">▶</span>}
                      </div>
                      <span className="font-bold tracking-wider">0x{item.hex}</span>
                    </div>
                    {binaryMode && item.binary && (
                      <div className="text-[8.5px] tracking-tight text-[#64748b] mt-0.5 select-all">
                        {formatBinaryGroups(item.binary, 8)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[10px] text-[#475569] italic p-4 text-center">
              Message buffer ready for expansion cycle
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 2: HARDWARE ALU & REGISTER BANK */}
        {/* ========================================================================= */}
        <div className="space-y-3 min-w-0">
          {/* Register Bank (Registers a–h) */}
          <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2.5 shadow-none">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#1f2937]">
              <div className="flex items-center gap-1.5">
                <span className="h-1 w-1 bg-[#e5a93b]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#e5a93b]">
                  32-BIT REGISTER BANK (REG a–h)
                </span>
              </div>
              <span className="text-[9px] text-[#475569] uppercase">
                BUS WIDTH: 256 BITS
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {displayVars.map((v, idx) => (
                <div
                  key={v.label}
                  className="rounded-[2px] border border-[#1f2937] bg-[#0e131b] p-1.5 tabular-nums"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold mb-0.5">
                    <span className="text-[#64748b] text-[9px]">0x0{idx} REG.{v.label}</span>
                    <span className="text-[#38bdf8] font-bold">0x{v.hex}</span>
                  </div>
                  {binaryMode && v.binary && (
                    <div className="text-[8px] text-[#64748b] tracking-tighter truncate select-all">
                      {formatBinaryGroups(v.binary, 8)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ALU Circuit Flow Diagram */}
          {(temp1 || temp2) && (
            <CompressionFlowDiagram
              prevVariables={prevVars}
              newVariables={newVars}
              t1Hex={temp1?.result?.hex}
              t2Hex={temp2?.result?.hex}
              kHex={activeK?.hex || temp1?.k?.hex}
              wHex={activeW?.hex || temp1?.w?.hex}
              sigma0Hex={temp2?.sigma0?.result?.hex}
              sigma1Hex={temp1?.sigma1?.result?.hex}
              chHex={temp1?.ch?.result?.hex}
              majHex={temp2?.maj?.result?.hex}
            />
          )}

          {/* ===================================================================== */}
          {/* BITWISE BARREL SHIFTER & GATES: Temp1 Sub-Operations */}
          {/* ===================================================================== */}
          {temp1 && (
            <div className="space-y-2.5 rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-3">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c084fc]">
                  ALU-R GATE MECHANICS: Temp1 (T1) PIPELINE
                </span>
                <span className="text-[9px] text-[#64748b] tabular-nums">
                  T1 = h + Σ₁(e) + Ch(e,f,g) + Kᵢ + Wᵢ
                </span>
              </div>

              {/* Sigma 1 (e) */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-[#fb923c] flex items-center gap-1.5">
                  <span className="h-1 w-1 bg-[#fb923c]" />
                  <span>1. BARREL SHIFTER: Σ₁(e) = ROTR⁶(e) ⊕ ROTR¹¹(e) ⊕ ROTR²⁵(e)</span>
                </div>
                <BitwiseOperationRow
                  label="REG.e"
                  binary={temp1.sigma1.input.binary}
                  hex={temp1.sigma1.input.hex}
                  opType="input"
                />
                <BitwiseOperationRow
                  label="ROTR⁶(e)"
                  binary={temp1.sigma1.rot6.binary}
                  hex={temp1.sigma1.rot6.hex}
                  opType="rot"
                  tag="ROTR 6"
                />
                <BitwiseOperationRow
                  label="ROTR¹¹(e)"
                  binary={temp1.sigma1.rot11.binary}
                  hex={temp1.sigma1.rot11.hex}
                  opType="rot"
                  tag="ROTR 11"
                />
                <BitwiseOperationRow
                  label="ROTR²⁵(e)"
                  binary={temp1.sigma1.rot25.binary}
                  hex={temp1.sigma1.rot25.hex}
                  opType="rot"
                  tag="ROTR 25"
                />
                <BitwiseOperationRow
                  label="Σ₁(e) OUT"
                  binary={temp1.sigma1.result.binary}
                  hex={temp1.sigma1.result.hex}
                  opType="xor"
                  tag="3-WAY XOR"
                  isResult
                />
              </div>

              {/* Choice Function */}
              <div className="space-y-1 pt-1.5 border-t border-[#1f2937]">
                <div className="text-[10px] font-bold text-[#34d399] flex items-center gap-1.5">
                  <span className="h-1 w-1 bg-[#34d399]" />
                  <span>2. LOGIC MUX: Ch(e, f, g) = (e ∧ f) ⊕ (¬e ∧ g)</span>
                </div>
                <BitwiseOperationRow
                  label="e ∧ f"
                  binary={temp1.ch.eAndF.binary}
                  hex={temp1.ch.eAndF.hex}
                  opType="and"
                  tag="AND"
                />
                <BitwiseOperationRow
                  label="¬e ∧ g"
                  binary={temp1.ch.notEAndG.binary}
                  hex={temp1.ch.notEAndG.hex}
                  opType="not"
                  tag="NOT+AND"
                />
                <BitwiseOperationRow
                  label="Ch OUT"
                  binary={temp1.ch.result.binary}
                  hex={temp1.ch.result.hex}
                  opType="xor"
                  tag="MUX XOR"
                  isResult
                />
              </div>

              {/* Temp 1 Sum */}
              <div className="space-y-1 pt-1.5 border-t border-[#1f2937]">
                <div className="text-[10px] font-bold text-[#c084fc] flex items-center gap-1.5">
                  <span className="h-1 w-1 bg-[#c084fc]" />
                  <span>3. ALU 5-TERM ACCUMULATOR: Temp1 = h + Σ₁(e) + Ch + Kᵢ + Wᵢ (mod 2³²)</span>
                </div>
                <BitwiseOperationRow
                  label="REG.h"
                  binary={temp1.h.binary}
                  hex={temp1.h.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label="Σ₁(e)"
                  binary={temp1.sigma1.result.binary}
                  hex={temp1.sigma1.result.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label="Ch(e,f,g)"
                  binary={temp1.ch.result.binary}
                  hex={temp1.ch.result.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label="ROM Kᵢ"
                  binary={temp1.k.binary}
                  hex={temp1.k.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label="BUF Wᵢ"
                  binary={temp1.w.binary}
                  hex={temp1.w.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label="Temp1 OUT"
                  binary={temp1.result.binary}
                  hex={temp1.result.hex}
                  opType="result"
                  tag="ALU T1"
                  isResult
                />
              </div>
            </div>
          )}

          {/* Temp2 Sub-Operations */}
          {temp2 && (
            <div className="space-y-2.5 rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-3">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">
                  ALU-L GATE MECHANICS: Temp2 (T2) PIPELINE
                </span>
                <span className="text-[9px] text-[#64748b] tabular-nums">
                  T2 = Σ₀(a) + Maj(a,b,c)
                </span>
              </div>

              {/* Sigma 0 (a) */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-[#fb923c] flex items-center gap-1.5">
                  <span className="h-1 w-1 bg-[#fb923c]" />
                  <span>1. BARREL SHIFTER: Σ₀(a) = ROTR²(a) ⊕ ROTR¹³(a) ⊕ ROTR²²(a)</span>
                </div>
                <BitwiseOperationRow
                  label="REG.a"
                  binary={temp2.sigma0.input.binary}
                  hex={temp2.sigma0.input.hex}
                  opType="input"
                />
                <BitwiseOperationRow
                  label="ROTR²(a)"
                  binary={temp2.sigma0.rot2.binary}
                  hex={temp2.sigma0.rot2.hex}
                  opType="rot"
                  tag="ROTR 2"
                />
                <BitwiseOperationRow
                  label="ROTR¹³(a)"
                  binary={temp2.sigma0.rot13.binary}
                  hex={temp2.sigma0.rot13.hex}
                  opType="rot"
                  tag="ROTR 13"
                />
                <BitwiseOperationRow
                  label="ROTR²²(a)"
                  binary={temp2.sigma0.rot22.binary}
                  hex={temp2.sigma0.rot22.hex}
                  opType="rot"
                  tag="ROTR 22"
                />
                <BitwiseOperationRow
                  label="Σ₀(a) OUT"
                  binary={temp2.sigma0.result.binary}
                  hex={temp2.sigma0.result.hex}
                  opType="xor"
                  tag="3-WAY XOR"
                  isResult
                />
              </div>

              {/* Majority Function */}
              <div className="space-y-1 pt-1.5 border-t border-[#1f2937]">
                <div className="text-[10px] font-bold text-[#34d399] flex items-center gap-1.5">
                  <span className="h-1 w-1 bg-[#34d399]" />
                  <span>2. MAJORITY GATE: Maj(a, b, c) = (a ∧ b) ⊕ (a ∧ c) ⊕ (b ∧ c)</span>
                </div>
                <BitwiseOperationRow
                  label="a ∧ b"
                  binary={temp2.maj.aAndB.binary}
                  hex={temp2.maj.aAndB.hex}
                  opType="and"
                  tag="AND"
                />
                <BitwiseOperationRow
                  label="a ∧ c"
                  binary={temp2.maj.aAndC.binary}
                  hex={temp2.maj.aAndC.hex}
                  opType="and"
                  tag="AND"
                />
                <BitwiseOperationRow
                  label="b ∧ c"
                  binary={temp2.maj.bAndC.binary}
                  hex={temp2.maj.bAndC.hex}
                  opType="and"
                  tag="AND"
                />
                <BitwiseOperationRow
                  label="Maj OUT"
                  binary={temp2.maj.result.binary}
                  hex={temp2.maj.result.hex}
                  opType="xor"
                  tag="MAJ XOR"
                  isResult
                />
              </div>

              {/* Temp 2 Sum */}
              <div className="space-y-1 pt-1.5 border-t border-[#1f2937]">
                <div className="text-[10px] font-bold text-[#38bdf8] flex items-center gap-1.5">
                  <span className="h-1 w-1 bg-[#38bdf8]" />
                  <span>3. ALU 2-TERM ACCUMULATOR: Temp2 = Σ₀(a) + Maj(a,b,c) (mod 2³²)</span>
                </div>
                <BitwiseOperationRow
                  label="Σ₀(a)"
                  binary={temp2.sigma0.result.binary}
                  hex={temp2.sigma0.result.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label="Maj(a,b,c)"
                  binary={temp2.maj.result.binary}
                  hex={temp2.maj.result.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label="Temp2 OUT"
                  binary={temp2.result.binary}
                  hex={temp2.result.hex}
                  opType="result"
                  tag="ALU T2"
                  isResult
                />
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* MESSAGE SCHEDULE EXPANSION MECHANICS (sigma0 / sigma1) */}
          {/* ===================================================================== */}
          {sigma0Expansion && sigma1Expansion && (
            <div className="space-y-2.5 rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-3">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">
                  SCHEDULE EXPANSION: W[i] COMPUTATION
                </span>
                <span className="text-[9px] text-[#64748b] tabular-nums">
                  W[i] = σ₁(W[i-2]) + W[i-7] + σ₀(W[i-15]) + W[i-16]
                </span>
              </div>

              {/* Lower Sigma 0 */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-[#fb923c]">
                  1. LOWER SIGMA 0: σ₀(W[i-15]) = ROTR⁷ ⊕ ROTR¹⁸ ⊕ SHR³
                </div>
                <BitwiseOperationRow
                  label={`W[${sigma0Expansion.input?.index ?? 'i-15'}]`}
                  binary={sigma0Expansion.input.binary}
                  hex={sigma0Expansion.input.hex}
                  opType="input"
                />
                <BitwiseOperationRow
                  label="ROTR⁷"
                  binary={sigma0Expansion.rot7.binary}
                  hex={sigma0Expansion.rot7.hex}
                  opType="rot"
                  tag="ROTR 7"
                />
                <BitwiseOperationRow
                  label="ROTR¹⁸"
                  binary={sigma0Expansion.rot18.binary}
                  hex={sigma0Expansion.rot18.hex}
                  opType="rot"
                  tag="ROTR 18"
                />
                <BitwiseOperationRow
                  label="SHR³"
                  binary={sigma0Expansion.shr3.binary}
                  hex={sigma0Expansion.shr3.hex}
                  opType="shr"
                  tag="SHR 3"
                />
                <BitwiseOperationRow
                  label="σ₀ OUT"
                  binary={sigma0Expansion.result.binary}
                  hex={sigma0Expansion.result.hex}
                  opType="xor"
                  tag="XOR"
                  isResult
                />
              </div>

              {/* Lower Sigma 1 */}
              <div className="space-y-1 pt-1.5 border-t border-[#1f2937]">
                <div className="text-[10px] font-bold text-[#fb923c]">
                  2. LOWER SIGMA 1: σ₁(W[i-2]) = ROTR¹⁷ ⊕ ROTR¹⁹ ⊕ SHR¹⁰
                </div>
                <BitwiseOperationRow
                  label={`W[${sigma1Expansion.input?.index ?? 'i-2'}]`}
                  binary={sigma1Expansion.input.binary}
                  hex={sigma1Expansion.input.hex}
                  opType="input"
                />
                <BitwiseOperationRow
                  label="ROTR¹⁷"
                  binary={sigma1Expansion.rot17.binary}
                  hex={sigma1Expansion.rot17.hex}
                  opType="rot"
                  tag="ROTR 17"
                />
                <BitwiseOperationRow
                  label="ROTR¹⁹"
                  binary={sigma1Expansion.rot19.binary}
                  hex={sigma1Expansion.rot19.hex}
                  opType="rot"
                  tag="ROTR 19"
                />
                <BitwiseOperationRow
                  label="SHR¹⁰"
                  binary={sigma1Expansion.shr10.binary}
                  hex={sigma1Expansion.shr10.hex}
                  opType="shr"
                  tag="SHR 10"
                />
                <BitwiseOperationRow
                  label="σ₁ OUT"
                  binary={sigma1Expansion.result.binary}
                  hex={sigma1Expansion.result.hex}
                  opType="xor"
                  tag="XOR"
                  isResult
                />
              </div>

              {/* Total Schedule Addition */}
              {wMinus16 && wMinus7 && scheduleResult && (
                <div className="space-y-1 pt-1.5 border-t border-[#1f2937]">
                  <div className="text-[10px] font-bold text-[#e5a93b]">
                    3. ALU 4-WORD ACCUMULATOR FOR W[i]
                  </div>
                  <BitwiseOperationRow
                    label="W[i-16]"
                    binary={wMinus16.binary}
                    hex={wMinus16.hex}
                    opType="add"
                  />
                  <BitwiseOperationRow
                    label="σ₀(W[i-15])"
                    binary={sigma0Expansion.result.binary}
                    hex={sigma0Expansion.result.hex}
                    opType="add"
                  />
                  <BitwiseOperationRow
                    label="W[i-7]"
                    binary={wMinus7.binary}
                    hex={wMinus7.hex}
                    opType="add"
                  />
                  <BitwiseOperationRow
                    label="σ₁(W[i-2])"
                    binary={sigma1Expansion.result.binary}
                    hex={sigma1Expansion.result.hex}
                    opType="add"
                  />
                  <BitwiseOperationRow
                    label="W[i] OUT"
                    binary={scheduleResult.binary}
                    hex={scheduleResult.hex}
                    opType="result"
                    tag="W[i]"
                    isResult
                  />
                </div>
              )}
            </div>
          )}

          {/* Hash Value Updates */}
          {updates && (
            <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="h-1 w-1 bg-[#34d399]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#34d399]">
                  BLOCK ACCUMULATION: H[i] ← H[i] + Variable[i]
                </span>
              </div>
              <div className="grid gap-1 font-mono text-[11px] tabular-nums">
                {updates.map((u) => (
                  <div
                    key={u.label}
                    className="flex items-center justify-between rounded-[2px] bg-[#0e131b] px-2 py-1 border border-[#1f2937]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#64748b] font-bold w-12">{u.label}</span>
                      <span className="text-[#94a3b8]">0x{u.prevHex}</span>
                      <span className="text-[#64748b]">+</span>
                      <span className="text-[#e5a93b]">0x{u.addHex}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#64748b]">→</span>
                      <span className="text-[#34d399] font-bold">0x{u.newHex}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 3: FIRMWARE ROM CONSTANTS (K[00..63]) */}
        {/* ========================================================================= */}
        <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2.5 flex flex-col h-[680px]">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2937] mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="h-1 w-1 bg-[#e5a93b]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#e5a93b]">
                ROM: K[00..63]
              </span>
            </div>
            <span className="text-[9px] text-[#475569] tabular-nums">
              {constants.length || 64} ENTRIES
            </span>
          </div>

          {constants.length > 0 ? (
            <div className="overflow-y-auto space-y-0.5 pr-0.5 flex-1 font-mono text-[11px]">
              {constants.map((item) => {
                const isActive = item.active || (roundIdx !== undefined && item.index === roundIdx);
                const offset = (item.index * 4).toString(16).padStart(2, '0').toUpperCase();
                return (
                  <div
                    key={item.index}
                    className={`rounded-[2px] px-1.5 py-1 border transition-all tabular-nums ${
                      isActive
                        ? 'border-[#e5a93b]/70 bg-[#16120b] text-[#e5a93b] ring-1 ring-[#e5a93b]/40 phosphor-amber'
                        : 'border-transparent bg-transparent text-[#94a3b8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-[#475569]">0x{offset}</span>
                        <span className="text-[#64748b] text-[10px]">
                          K[{item.index.toString().padStart(2, '0')}]
                        </span>
                        {isActive && <span className="text-[#e5a93b] text-[9px] font-bold">▶</span>}
                      </div>
                      <span className={isActive ? 'font-bold text-[#e5a93b]' : 'text-[#cbd5e1]'}>
                        0x{item.hex}
                      </span>
                    </div>
                    {binaryMode && item.binary && (
                      <div className="text-[8.5px] tracking-tight text-[#475569] mt-0.5 select-all">
                        {formatBinaryGroups(item.binary, 8)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[10px] text-[#475569] italic p-4 text-center">
              ROM constants table
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
