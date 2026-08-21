import React, { useState } from 'react';
import type { ComputationStep } from '../../algorithms/types';
import BitwiseOperationRow from './BitwiseOperationRow';
import CompressionFlowDiagram from './CompressionFlowDiagram';
import { formatBinaryGroups } from '../../algorithms/utils';

export interface VariableItem {
  label: string;
  hex: string;
  binary?: string;
}

export interface ScheduleItem {
  index: number;
  hex: string;
  binary?: string;
  computed?: boolean;
  active?: boolean;
}

export interface ConstantItem {
  index: number;
  hex: string;
  binary?: string;
  active?: boolean;
}

interface Props {
  step: ComputationStep;
}

export default function RoundComputationView({ step }: Props) {
  const data = step.data;
  const [binaryMode, setBinaryMode] = useState(true);

  // Extract variables
  const prevVars = data.prevVariables as VariableItem[] | undefined;
  const newVars = data.newVariables as VariableItem[] | undefined;
  const initVars = data.variables as VariableItem[] | undefined;
  const displayVars = newVars || prevVars || initVars || [];

  // Detect word size (32-bit vs 64-bit)
  const is64Bit = displayVars.length > 0 ? (displayVars[0].hex.length > 8) : false;
  const wordBits = is64Bit ? 64 : 32;
  const wordBytes = is64Bit ? 8 : 4;

  // Extract schedule items (Left Column)
  const schedule = (data.schedule as ScheduleItem[] | undefined) || [];

  // Extract constants (Right Column)
  const constants = (data.constants as ConstantItem[] | undefined) || [];
  const activeK = data.activeK as ConstantItem | undefined;
  const activeW = data.activeW as ScheduleItem | undefined;

  // SHA-256 / SHA-512 / SHA-2 sub-computation details
  const temp1 = data.temp1 as any;
  const temp2 = data.temp2 as any;
  const sigma0Expansion = data.sigma0 as any;
  const sigma1Expansion = data.sigma1 as any;
  const wMinus16 = data.wMinus16 as any;
  const wMinus7 = data.wMinus7 as any;
  const scheduleResult = data.result as any;

  // MD5 sub-computation details
  const md5Step = data.md5Step as any;

  // SHA-1 sub-computation details
  const sha1Step = data.sha1Step as any;

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
    <div className="space-y-2.5 font-mono text-[#f8fafc]">
      {/* ─── Hardware Telemetry Toolbar ───────────────────────────────── */}
      <div className="flex items-center justify-between bg-[#0b0e14] px-2.5 py-1 rounded-[2px] border border-[#1f2937] text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-[#38bdf8]" />
            <span className="text-[9px] uppercase tracking-wider text-[#64748b] font-medium">
              3-BUS STATE INSPECTOR ({is64Bit ? '64-BIT PIPELINE' : '32-BIT PIPELINE'})
            </span>
          </div>
          {roundIdx !== undefined && (
            <span className="rounded-[2px] bg-[#15120c] border border-[#e5a93b]/40 text-[#e5a93b] px-1.5 py-0.1 text-[9px] font-semibold tabular-nums phosphor-amber">
              CYCLE: 0x{roundIdx.toString(16).padStart(2, '0').toUpperCase()} (R{roundIdx})
            </span>
          )}
        </div>
        <button
          onClick={() => setBinaryMode(!binaryMode)}
          className="rounded-[2px] border border-[#1f2937] bg-[#10141d] px-2 py-0.5 text-[9px] font-medium text-[#94a3b8] hover:bg-[#161d2b] hover:text-[#f8fafc] transition-colors"
        >
          {binaryMode ? 'MODE: HEX + BINARY' : 'MODE: HEX ONLY'}
        </button>
      </div>

      {/* ─── Main 3-Column Persistent Architecture ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_240px] gap-2.5 items-start">
        {/* ========================================================================= */}
        {/* COLUMN 1: MESSAGE BUFFER INSPECTOR (W / M) */}
        {/* ========================================================================= */}
        <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 flex flex-col h-[670px]">
          <div className="flex items-center justify-between pb-1 border-b border-[#1f2937] mb-1">
            <div className="flex items-center gap-1.5">
              <span className="h-1 w-1 bg-[#38bdf8]" />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#38bdf8]">
                BUFFER: {schedule.length <= 16 ? `M[00..${(schedule.length - 1).toString().padStart(2, '0')}]` : `W[00..${(schedule.length - 1).toString().padStart(2, '0')}]`}
              </span>
            </div>
            <span className="text-[8px] text-[#475569] tabular-nums font-medium">
              {schedule.length || 0} WORDS ({schedule.length * wordBits} BITS)
            </span>
          </div>

          {schedule.length > 0 ? (
            <div className="overflow-y-auto space-y-0.5 pr-0.5 flex-1 font-mono text-[11px]">
              {schedule.map((item) => {
                const isActive = item.active || (roundIdx !== undefined && item.index === roundIdx && !md5Step && !sha1Step);
                const offset = (item.index * wordBytes).toString(16).padStart(3, '0').toUpperCase();
                const prefix = schedule.length <= 16 ? 'M' : 'W';
                return (
                  <div
                    key={item.index}
                    className={`rounded-[2px] px-1.5 py-0.5 border transition-all tabular-nums ${
                      isActive
                        ? 'border-[#e5a93b]/60 bg-[#15120c] text-[#e5a93b] ring-1 ring-[#e5a93b]/35 phosphor-amber'
                        : item.computed
                          ? 'border-[#1f2937] bg-[#0e131b] text-[#38bdf8]'
                          : 'border-transparent bg-transparent text-[#475569]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] text-[#475569]">0x{offset}</span>
                        <span className="font-medium text-[9px]">
                          {prefix}[{item.index.toString().padStart(2, '0')}]
                        </span>
                        {isActive && <span className="text-[#e5a93b] text-[8px]">▶</span>}
                      </div>
                      <span className="font-medium tracking-wider text-[11px]">0x{item.hex}</span>
                    </div>
                    {binaryMode && item.binary && (
                      <div className="text-[8px] tracking-tight text-[#64748b] mt-0.5 select-all">
                        {formatBinaryGroups(item.binary, 8)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[9px] text-[#475569] uppercase p-4 text-center">
              MESSAGE BUFFER AWAITING INPUT
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 2: HARDWARE ALU & REGISTER BANK */}
        {/* ========================================================================= */}
        <div className="space-y-2.5 min-w-0">
          {/* Dynamic Register Bank (Registers a–h, a–e, a–d; 32-bit or 64-bit) */}
          <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2">
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#1f2937]">
              <div className="flex items-center gap-1.5">
                <span className="h-1 w-1 bg-[#e5a93b]" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#e5a93b]">
                  {displayVars.length > 0 ? `${wordBits}-BIT REGISTER BANK (${displayVars.map(v => v.label).join(', ')})` : 'REGISTER BANK'}
                </span>
              </div>
              <span className="text-[8px] text-[#475569] uppercase font-medium">
                WIDTH: {displayVars.length * wordBits}-BIT BUS
              </span>
            </div>

            <div className={`grid gap-1 ${displayVars.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : displayVars.length <= 5 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
              {displayVars.map((v, idx) => (
                <div
                  key={v.label}
                  className="rounded-[2px] border border-[#1f2937] bg-[#0e131b] p-1 tabular-nums"
                >
                  <div className="flex items-center justify-between text-[10px] font-medium mb-0.5">
                    <span className="text-[#64748b] text-[8px]">0x{idx} REG.{v.label}</span>
                    <span className="text-[#38bdf8] font-medium text-[11px]">0x{v.hex}</span>
                  </div>
                  {binaryMode && v.binary && (
                    <div className="text-[7.5px] text-[#64748b] tracking-tighter truncate select-all">
                      {formatBinaryGroups(v.binary, 8)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SHA-2 (SHA-256 / SHA-512) ALU Circuit Flow Diagram */}
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
          {/* SHA-1 ALU PIPELINE GATE BREAKDOWN */}
          {/* ===================================================================== */}
          {sha1Step && (
            <div className="space-y-2 rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2.5">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#38bdf8]">
                  SHA-1 ALU PIPELINE: {sha1Step.funcName}-FUNCTION (STEP {roundIdx !== undefined ? roundIdx + 1 : 1})
                </span>
                <span className="text-[8px] text-[#64748b] tabular-nums">
                  {sha1Step.formula}
                </span>
              </div>

              {/* 1. Logic Function Ch/Parity/Maj */}
              <div className="space-y-0.5">
                <div className="text-[9px] font-medium uppercase tracking-wider text-[#34d399] flex items-center gap-1">
                  <span className="h-1 w-1 bg-[#34d399]" />
                  <span>1. LOGIC FUNCTION: {sha1Step.funcName}(B, C, D)</span>
                </div>
                <BitwiseOperationRow
                  label="REG.B"
                  binary={sha1Step.b.binary}
                  hex={sha1Step.b.hex}
                  opType="input"
                />
                <BitwiseOperationRow
                  label="REG.C"
                  binary={sha1Step.c.binary}
                  hex={sha1Step.c.hex}
                  opType="input"
                />
                <BitwiseOperationRow
                  label="REG.D"
                  binary={sha1Step.d.binary}
                  hex={sha1Step.d.hex}
                  opType="input"
                />
                <BitwiseOperationRow
                  label={`${sha1Step.funcName} OUT`}
                  binary={sha1Step.fResult.binary}
                  hex={sha1Step.fResult.hex}
                  opType="xor"
                  tag={sha1Step.funcName}
                  isResult
                />
              </div>

              {/* 2. Barrel Shifter ROTL5(A) */}
              <div className="space-y-0.5 pt-1 border-t border-[#1f2937]">
                <div className="text-[9px] font-medium uppercase tracking-wider text-[#fb923c] flex items-center gap-1">
                  <span className="h-1 w-1 bg-[#fb923c]" />
                  <span>2. BARREL SHIFTER: ROTL⁵(A)</span>
                </div>
                <BitwiseOperationRow
                  label="REG.A"
                  binary={sha1Step.a.binary}
                  hex={sha1Step.a.hex}
                  opType="input"
                />
                <BitwiseOperationRow
                  label="ROTL⁵(A)"
                  binary={sha1Step.rot5A.binary}
                  hex={sha1Step.rot5A.hex}
                  opType="rot"
                  tag="ROTL 5"
                  isResult
                />
              </div>

              {/* 3. 5-Term Modulo 2^32 Addition */}
              <div className="space-y-0.5 pt-1 border-t border-[#1f2937]">
                <div className="text-[9px] font-medium uppercase tracking-wider text-[#c084fc] flex items-center gap-1">
                  <span className="h-1 w-1 bg-[#c084fc]" />
                  <span>3. ALU 5-TERM ACCUMULATOR: Temp = ROTL⁵(A) + {sha1Step.funcName} + E + K[t] + W[t] (mod 2³²)</span>
                </div>
                <BitwiseOperationRow
                  label="ROTL⁵(A)"
                  binary={sha1Step.rot5A.binary}
                  hex={sha1Step.rot5A.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label={`${sha1Step.funcName}(B,C,D)`}
                  binary={sha1Step.fResult.binary}
                  hex={sha1Step.fResult.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label="REG.E"
                  binary={sha1Step.e.binary}
                  hex={sha1Step.e.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label={`ROM K[${roundIdx ?? 't'}]`}
                  binary={sha1Step.k.binary}
                  hex={sha1Step.k.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label={`BUF W[${roundIdx ?? 't'}]`}
                  binary={sha1Step.w.binary}
                  hex={sha1Step.w.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label="Temp (NEW A)"
                  binary={sha1Step.temp.binary}
                  hex={sha1Step.temp.hex}
                  opType="result"
                  tag="ALU Temp"
                  isResult
                />
              </div>

              {/* 4. Barrel Shifter ROTL30(B) & Register Cascade */}
              <div className="space-y-0.5 pt-1 border-t border-[#1f2937]">
                <div className="text-[9px] font-medium uppercase tracking-wider text-[#e5a93b] flex items-center gap-1">
                  <span className="h-1 w-1 bg-[#e5a93b]" />
                  <span>4. CASCADE WRITEBACK: E ← D, D ← C, C ← ROTL³⁰(B), B ← A, A ← Temp</span>
                </div>
                <BitwiseOperationRow
                  label="ROTL³⁰(B)"
                  binary={sha1Step.rot30B.binary}
                  hex={sha1Step.rot30B.hex}
                  opType="rot"
                  tag="ROTL 30 (NEW C)"
                  isResult
                />
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* MD5 ALU PIPELINE GATE BREAKDOWN */}
          {/* ===================================================================== */}
          {md5Step && (
            <div className="space-y-2 rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2.5">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#38bdf8]">
                  MD5 ALU PIPELINE: {md5Step.funcName}-FUNCTION (STEP {roundIdx !== undefined ? roundIdx + 1 : 1})
                </span>
                <span className="text-[8px] text-[#64748b] tabular-nums">
                  {md5Step.formula}
                </span>
              </div>

              {/* 1. Logic Function F/G/H/I */}
              <div className="space-y-0.5">
                <div className="text-[9px] font-medium uppercase tracking-wider text-[#34d399] flex items-center gap-1">
                  <span className="h-1 w-1 bg-[#34d399]" />
                  <span>1. LOGIC FUNCTION: {md5Step.funcName}(B, C, D)</span>
                </div>
                <BitwiseOperationRow
                  label="REG.B"
                  binary={md5Step.b.binary}
                  hex={md5Step.b.hex}
                  opType="input"
                />
                <BitwiseOperationRow
                  label="REG.C"
                  binary={md5Step.c.binary}
                  hex={md5Step.c.hex}
                  opType="input"
                />
                <BitwiseOperationRow
                  label="REG.D"
                  binary={md5Step.d.binary}
                  hex={md5Step.d.hex}
                  opType="input"
                />
                <BitwiseOperationRow
                  label={`${md5Step.funcName} OUT`}
                  binary={md5Step.fResult.binary}
                  hex={md5Step.fResult.hex}
                  opType="xor"
                  tag={md5Step.funcName}
                  isResult
                />
              </div>

              {/* 2. 4-Term Modulo 2^32 Addition */}
              <div className="space-y-0.5 pt-1 border-t border-[#1f2937]">
                <div className="text-[9px] font-medium uppercase tracking-wider text-[#c084fc] flex items-center gap-1">
                  <span className="h-1 w-1 bg-[#c084fc]" />
                  <span>2. 4-TERM ACCUMULATOR: Temp = A + {md5Step.funcName}(B,C,D) + M[{md5Step.mIndex}] + K[{md5Step.kIndex}]</span>
                </div>
                <BitwiseOperationRow
                  label="REG.A"
                  binary={md5Step.a.binary}
                  hex={md5Step.a.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label={`${md5Step.funcName}(B,C,D)`}
                  binary={md5Step.fResult.binary}
                  hex={md5Step.fResult.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label={`BUF M[${md5Step.mIndex}]`}
                  binary={md5Step.m.binary}
                  hex={md5Step.m.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label={`ROM K[${md5Step.kIndex}]`}
                  binary={md5Step.k.binary}
                  hex={md5Step.k.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label="SUM OUT"
                  binary={md5Step.sum.binary}
                  hex={md5Step.sum.hex}
                  opType="result"
                  tag="ADD mod 2³²"
                  isResult
                />
              </div>

              {/* 3. Barrel Shifter & Register Update */}
              <div className="space-y-0.5 pt-1 border-t border-[#1f2937]">
                <div className="text-[9px] font-medium uppercase tracking-wider text-[#e5a93b] flex items-center gap-1">
                  <span className="h-1 w-1 bg-[#e5a93b]" />
                  <span>3. BARREL SHIFTER & B-WRITEBACK: B' = B + ROTL(Temp, {md5Step.shift})</span>
                </div>
                <BitwiseOperationRow
                  label={`ROTL^${md5Step.shift}`}
                  binary={md5Step.rotResult.binary}
                  hex={md5Step.rotResult.hex}
                  opType="rot"
                  tag={`ROTL ${md5Step.shift}`}
                />
                <BitwiseOperationRow
                  label="NEW REG.B"
                  binary={md5Step.newB.binary}
                  hex={md5Step.newB.hex}
                  opType="result"
                  tag="B' WRITEBACK"
                  isResult
                />
              </div>

              {/* Cascade Rotate Line */}
              <div className="text-center text-[9px] font-mono text-[#64748b] bg-[#090c10] rounded-[2px] py-0.5 border border-[#1f2937]">
                <span className="text-[#475569] uppercase font-medium mr-1.5">
                  REGISTER ROTATE:
                </span>
                A ← D &nbsp;·&nbsp; D ← C &nbsp;·&nbsp; C ← B &nbsp;·&nbsp; B ← B'
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SHA-2 (SHA-256 / SHA-512) Temp1 Sub-Operations */}
          {/* ===================================================================== */}
          {temp1 && (
            <div className="space-y-2 rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2.5">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#c084fc]">
                  ALU-R GATE MECHANICS: Temp1 (T1) PIPELINE
                </span>
                <span className="text-[8px] text-[#64748b] tabular-nums">
                  T1 = h + Σ₁(e) + Ch(e,f,g) + Kᵢ + Wᵢ
                </span>
              </div>

              {/* Sigma 1 (e) */}
              <div className="space-y-0.5">
                <div className="text-[9px] font-medium uppercase tracking-wider text-[#fb923c] flex items-center gap-1">
                  <span className="h-1 w-1 bg-[#fb923c]" />
                  <span>
                    1. BARREL SHIFTER: Σ₁(e) = {is64Bit ? 'ROTR¹⁴(e) ⊕ ROTR¹⁸(e) ⊕ ROTR⁴¹(e)' : 'ROTR⁶(e) ⊕ ROTR¹¹(e) ⊕ ROTR²⁵(e)'}
                  </span>
                </div>
                <BitwiseOperationRow
                  label="REG.e"
                  binary={temp1.sigma1.input.binary}
                  hex={temp1.sigma1.input.hex}
                  opType="input"
                />
                {is64Bit ? (
                  <>
                    <BitwiseOperationRow
                      label="ROTR¹⁴(e)"
                      binary={temp1.sigma1.rot14.binary}
                      hex={temp1.sigma1.rot14.hex}
                      opType="rot"
                      tag="ROTR 14"
                    />
                    <BitwiseOperationRow
                      label="ROTR¹⁸(e)"
                      binary={temp1.sigma1.rot18.binary}
                      hex={temp1.sigma1.rot18.hex}
                      opType="rot"
                      tag="ROTR 18"
                    />
                    <BitwiseOperationRow
                      label="ROTR⁴¹(e)"
                      binary={temp1.sigma1.rot41.binary}
                      hex={temp1.sigma1.rot41.hex}
                      opType="rot"
                      tag="ROTR 41"
                    />
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
              <div className="space-y-0.5 pt-1 border-t border-[#1f2937]">
                <div className="text-[9px] font-medium uppercase tracking-wider text-[#34d399] flex items-center gap-1">
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
              <div className="space-y-0.5 pt-1 border-t border-[#1f2937]">
                <div className="text-[9px] font-medium uppercase tracking-wider text-[#c084fc] flex items-center gap-1">
                  <span className="h-1 w-1 bg-[#c084fc]" />
                  <span>3. ALU 5-TERM ACCUMULATOR: Temp1 = h + Σ₁(e) + Ch + Kᵢ + Wᵢ (mod 2{is64Bit ? '⁶⁴' : '³²'})</span>
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

          {/* SHA-2 (SHA-256 / SHA-512) Temp2 Sub-Operations */}
          {temp2 && (
            <div className="space-y-2 rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2.5">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#38bdf8]">
                  ALU-L GATE MECHANICS: Temp2 (T2) PIPELINE
                </span>
                <span className="text-[8px] text-[#64748b] tabular-nums">
                  T2 = Σ₀(a) + Maj(a,b,c)
                </span>
              </div>

              {/* Sigma 0 (a) */}
              <div className="space-y-0.5">
                <div className="text-[9px] font-medium uppercase tracking-wider text-[#fb923c] flex items-center gap-1">
                  <span className="h-1 w-1 bg-[#fb923c]" />
                  <span>
                    1. BARREL SHIFTER: Σ₀(a) = {is64Bit ? 'ROTR²⁸(a) ⊕ ROTR³⁴(a) ⊕ ROTR³⁹(a)' : 'ROTR²(a) ⊕ ROTR¹³(a) ⊕ ROTR²²(a)'}
                  </span>
                </div>
                <BitwiseOperationRow
                  label="REG.a"
                  binary={temp2.sigma0.input.binary}
                  hex={temp2.sigma0.input.hex}
                  opType="input"
                />
                {is64Bit ? (
                  <>
                    <BitwiseOperationRow
                      label="ROTR²⁸(a)"
                      binary={temp2.sigma0.rot28.binary}
                      hex={temp2.sigma0.rot28.hex}
                      opType="rot"
                      tag="ROTR 28"
                    />
                    <BitwiseOperationRow
                      label="ROTR³⁴(a)"
                      binary={temp2.sigma0.rot34.binary}
                      hex={temp2.sigma0.rot34.hex}
                      opType="rot"
                      tag="ROTR 34"
                    />
                    <BitwiseOperationRow
                      label="ROTR³⁹(a)"
                      binary={temp2.sigma0.rot39.binary}
                      hex={temp2.sigma0.rot39.hex}
                      opType="rot"
                      tag="ROTR 39"
                    />
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
              <div className="space-y-0.5 pt-1 border-t border-[#1f2937]">
                <div className="text-[9px] font-medium uppercase tracking-wider text-[#34d399] flex items-center gap-1">
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
              <div className="space-y-0.5 pt-1 border-t border-[#1f2937]">
                <div className="text-[9px] font-medium uppercase tracking-wider text-[#38bdf8] flex items-center gap-1">
                  <span className="h-1 w-1 bg-[#38bdf8]" />
                  <span>3. ALU 2-TERM ACCUMULATOR: Temp2 = Σ₀(a) + Maj(a,b,c) (mod 2{is64Bit ? '⁶⁴' : '³²'})</span>
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
            <div className="space-y-2 rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2.5">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#38bdf8]">
                  SCHEDULE EXPANSION: W[i] COMPUTATION
                </span>
                <span className="text-[8px] text-[#64748b] tabular-nums">
                  W[i] = σ₁(W[i-2]) + W[i-7] + σ₀(W[i-15]) + W[i-16]
                </span>
              </div>

              {/* Lower Sigma 0 */}
              <div className="space-y-0.5">
                <div className="text-[9px] font-medium uppercase tracking-wider text-[#fb923c]">
                  1. LOWER SIGMA 0: σ₀(W[i-15]) = {is64Bit ? 'ROTR¹ ⊕ ROTR⁸ ⊕ SHR⁷' : 'ROTR⁷ ⊕ ROTR¹⁸ ⊕ SHR³'}
                </div>
                <BitwiseOperationRow
                  label={`W[${sigma0Expansion.input?.index ?? 'i-15'}]`}
                  binary={sigma0Expansion.input.binary}
                  hex={sigma0Expansion.input.hex}
                  opType="input"
                />
                {is64Bit ? (
                  <>
                    <BitwiseOperationRow
                      label="ROTR¹"
                      binary={sigma0Expansion.rot1.binary}
                      hex={sigma0Expansion.rot1.hex}
                      opType="rot"
                      tag="ROTR 1"
                    />
                    <BitwiseOperationRow
                      label="ROTR⁸"
                      binary={sigma0Expansion.rot8.binary}
                      hex={sigma0Expansion.rot8.hex}
                      opType="rot"
                      tag="ROTR 8"
                    />
                    <BitwiseOperationRow
                      label="SHR⁷"
                      binary={sigma0Expansion.shr7.binary}
                      hex={sigma0Expansion.shr7.hex}
                      opType="shr"
                      tag="SHR 7"
                    />
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
              <div className="space-y-0.5 pt-1 border-t border-[#1f2937]">
                <div className="text-[9px] font-medium uppercase tracking-wider text-[#fb923c]">
                  2. LOWER SIGMA 1: σ₁(W[i-2]) = {is64Bit ? 'ROTR¹⁹ ⊕ ROTR⁶¹ ⊕ SHR⁶' : 'ROTR¹⁷ ⊕ ROTR¹⁹ ⊕ SHR¹⁰'}
                </div>
                <BitwiseOperationRow
                  label={`W[${sigma1Expansion.input?.index ?? 'i-2'}]`}
                  binary={sigma1Expansion.input.binary}
                  hex={sigma1Expansion.input.hex}
                  opType="input"
                />
                {is64Bit ? (
                  <>
                    <BitwiseOperationRow
                      label="ROTR¹⁹"
                      binary={sigma1Expansion.rot19.binary}
                      hex={sigma1Expansion.rot19.hex}
                      opType="rot"
                      tag="ROTR 19"
                    />
                    <BitwiseOperationRow
                      label="ROTR⁶¹"
                      binary={sigma1Expansion.rot61.binary}
                      hex={sigma1Expansion.rot61.hex}
                      opType="rot"
                      tag="ROTR 61"
                    />
                    <BitwiseOperationRow
                      label="SHR⁶"
                      binary={sigma1Expansion.shr6.binary}
                      hex={sigma1Expansion.shr6.hex}
                      opType="shr"
                      tag="SHR 6"
                    />
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
                <div className="space-y-0.5 pt-1 border-t border-[#1f2937]">
                  <div className="text-[9px] font-medium uppercase tracking-wider text-[#e5a93b]">
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
            <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="h-1 w-1 bg-[#34d399]" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#34d399]">
                  BLOCK ACCUMULATION: H[i] ← H[i] + Variable[i]
                </span>
              </div>
              <div className="grid gap-0.5 font-mono text-[10px] tabular-nums">
                {updates.map((u) => (
                  <div
                    key={u.label}
                    className="flex items-center justify-between rounded-[2px] bg-[#0e131b] px-2 py-0.5 border border-[#1f2937]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#64748b] font-medium w-10">{u.label}</span>
                      <span className="text-[#94a3b8]">0x{u.prevHex}</span>
                      <span className="text-[#64748b]">+</span>
                      <span className="text-[#e5a93b]">0x{u.addHex}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[#64748b]">→</span>
                      <span className="text-[#34d399] font-medium">0x{u.newHex}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 3: FIRMWARE ROM CONSTANTS (K[00..N]) */}
        {/* ========================================================================= */}
        <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 flex flex-col h-[670px]">
          <div className="flex items-center justify-between pb-1 border-b border-[#1f2937] mb-1">
            <div className="flex items-center gap-1.5">
              <span className="h-1 w-1 bg-[#e5a93b]" />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#e5a93b]">
                ROM: K[00..{(constants.length - 1).toString().padStart(2, '0')}]
              </span>
            </div>
            <span className="text-[8px] text-[#475569] tabular-nums font-medium">
              {constants.length || 0} ENTRIES ({constants.length * wordBits} BITS)
            </span>
          </div>

          {constants.length > 0 ? (
            <div className="overflow-y-auto space-y-0.5 pr-0.5 flex-1 font-mono text-[11px]">
              {constants.map((item) => {
                const isActive = item.active || (roundIdx !== undefined && item.index === roundIdx && !md5Step && !sha1Step);
                const offset = (item.index * wordBytes).toString(16).padStart(3, '0').toUpperCase();
                return (
                  <div
                    key={item.index}
                    className={`rounded-[2px] px-1.5 py-0.5 border transition-all tabular-nums ${
                      isActive
                        ? 'border-[#e5a93b]/60 bg-[#15120c] text-[#e5a93b] ring-1 ring-[#e5a93b]/35 phosphor-amber'
                        : 'border-transparent bg-transparent text-[#94a3b8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] text-[#475569]">0x{offset}</span>
                        <span className="text-[#64748b] text-[9px] font-medium">
                          K[{item.index.toString().padStart(2, '0')}]
                        </span>
                        {isActive && <span className="text-[#e5a93b] text-[8px]">▶</span>}
                      </div>
                      <span className={isActive ? 'font-semibold text-[#e5a93b] text-[11px]' : 'text-[#cbd5e1] text-[11px] font-medium'}>
                        0x{item.hex}
                      </span>
                    </div>
                    {binaryMode && item.binary && (
                      <div className="text-[8px] tracking-tight text-[#475569] mt-0.5 select-all">
                        {formatBinaryGroups(item.binary, 8)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[9px] text-[#475569] uppercase p-4 text-center">
              ROM CONSTANTS TABLE
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
