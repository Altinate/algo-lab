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
  const wMinus15 = data.wMinus15 as any;
  const wMinus7 = data.wMinus7 as any;
  const wMinus2 = data.wMinus2 as any;
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
    <div className="space-y-4 font-sans text-gray-200">
      {/* View Toolbar */}
      <div className="flex items-center justify-between bg-gray-900/60 p-2.5 rounded-lg border border-gray-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-400 uppercase tracking-wider text-[11px]">
            Persistent Multi-Column Architecture
          </span>
          {roundIdx !== undefined && (
            <span className="rounded bg-blue-500/20 text-blue-300 px-2 py-0.5 font-mono font-bold">
              Round {roundIdx}
            </span>
          )}
        </div>
        <button
          onClick={() => setBinaryMode(!binaryMode)}
          className="rounded border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          {binaryMode ? '🔠 Binary + Hex' : '🔢 Hex Only'}
        </button>
      </div>

      {/* Main 3-Column Persistent Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr_230px] gap-4 items-start">
        {/* ========================================================================= */}
        {/* COLUMN 1: MESSAGE SCHEDULE (W[0..63]) */}
        {/* ========================================================================= */}
        <div className="rounded-lg border border-gray-800 bg-gray-900/70 p-3 flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Message Schedule W
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              {schedule.length || 64} words
            </span>
          </div>

          {schedule.length > 0 ? (
            <div className="overflow-y-auto space-y-1 pr-1 flex-1 font-mono text-xs">
              {schedule.map((item) => {
                const isActive = item.active || (roundIdx !== undefined && item.index === roundIdx);
                return (
                  <div
                    key={item.index}
                    className={`rounded px-2 py-1.5 border transition-all ${
                      isActive
                        ? 'border-yellow-400/70 bg-yellow-950/40 text-yellow-300 ring-1 ring-yellow-400/30'
                        : item.computed
                          ? 'border-cyan-500/20 bg-gray-800/50 text-cyan-300'
                          : 'border-gray-800/60 bg-gray-900/30 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-400">
                        W[{item.index.toString().padStart(2, '0')}]
                      </span>
                      <span className="font-bold">0x{item.hex}</span>
                    </div>
                    {binaryMode && item.binary && (
                      <div className="text-[9px] tracking-tight text-gray-400 mt-0.5 truncate select-all">
                        {formatBinaryGroups(item.binary, 8)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-500 italic p-4 text-center">
              Message schedule will populate during computation
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 2: MIDDLE - WORKING VARIABLES & DETAILED BITWISE MECHANICS */}
        {/* ========================================================================= */}
        <div className="space-y-4 min-w-0">
          {/* Top Working Variables Register Strip */}
          <div className="rounded-lg border border-gray-800 bg-gray-900/80 p-3 shadow-lg">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-800">
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                Working Variables (Registers a–h)
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                32-bit state registers
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {displayVars.map((v) => (
                <div
                  key={v.label}
                  className="rounded-md border border-gray-700/80 bg-gray-800/80 p-2 font-mono"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-0.5">
                    <span className="text-yellow-400 uppercase">{v.label}</span>
                    <span className="text-cyan-300">0x{v.hex}</span>
                  </div>
                  {binaryMode && v.binary && (
                    <div className="text-[9px] text-gray-400 tracking-tighter truncate select-all">
                      {formatBinaryGroups(v.binary, 8)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Flow Diagram (for compression rounds) */}
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
          {/* INLINE BIT-LEVEL EXPANSION: Compression Round Computations */}
          {/* ===================================================================== */}
          {temp1 && (
            <div className="space-y-4 rounded-lg border border-purple-500/30 bg-gray-900/80 p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Bit-Level Mechanics: Temp1 Sub-Operations
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  T1 = h + Σ₁(e) + Ch(e,f,g) + K[i] + W[i]
                </span>
              </div>

              {/* Sigma 1 (e) */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-orange-400 flex items-center gap-2">
                  <span>1. Upper Sigma 1: Σ₁(e) = ROTR⁶(e) ⊕ ROTR¹¹(e) ⊕ ROTR²⁵(e)</span>
                </div>
                <BitwiseOperationRow
                  label="e"
                  binary={temp1.sigma1.input.binary}
                  hex={temp1.sigma1.input.hex}
                  opType="input"
                />
                <BitwiseOperationRow
                  label="ROTR⁶(e)"
                  binary={temp1.sigma1.rot6.binary}
                  hex={temp1.sigma1.rot6.hex}
                  opType="rot"
                  tag="Rotate 6"
                />
                <BitwiseOperationRow
                  label="ROTR¹¹(e)"
                  binary={temp1.sigma1.rot11.binary}
                  hex={temp1.sigma1.rot11.hex}
                  opType="rot"
                  tag="Rotate 11"
                />
                <BitwiseOperationRow
                  label="ROTR²⁵(e)"
                  binary={temp1.sigma1.rot25.binary}
                  hex={temp1.sigma1.rot25.hex}
                  opType="rot"
                  tag="Rotate 25"
                />
                <BitwiseOperationRow
                  label="Σ₁(e) Result"
                  binary={temp1.sigma1.result.binary}
                  hex={temp1.sigma1.result.hex}
                  opType="xor"
                  tag="3-way XOR"
                  isResult
                />
              </div>

              {/* Choice Function */}
              <div className="space-y-1.5 pt-2 border-t border-gray-800">
                <div className="text-xs font-semibold text-emerald-400">
                  2. Choice Function: Ch(e, f, g) = (e ∧ f) ⊕ (¬e ∧ g)
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
                  tag="NOT + AND"
                />
                <BitwiseOperationRow
                  label="Ch Result"
                  binary={temp1.ch.result.binary}
                  hex={temp1.ch.result.hex}
                  opType="xor"
                  tag="XOR"
                  isResult
                />
              </div>

              {/* Temp 1 Sum */}
              <div className="space-y-1.5 pt-2 border-t border-gray-800">
                <div className="text-xs font-semibold text-purple-300">
                  3. Addition: Temp1 = h + Σ₁(e) + Ch(e,f,g) + Kᵢ + Wᵢ (mod 2³²)
                </div>
                <BitwiseOperationRow
                  label="h"
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
                  label="K[i]"
                  binary={temp1.k.binary}
                  hex={temp1.k.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label="W[i]"
                  binary={temp1.w.binary}
                  hex={temp1.w.hex}
                  opType="add"
                />
                <BitwiseOperationRow
                  label="Temp1 Total"
                  binary={temp1.result.binary}
                  hex={temp1.result.hex}
                  opType="result"
                  tag="SUM (T1)"
                  isResult
                />
              </div>
            </div>
          )}

          {/* Temp2 Sub-Operations */}
          {temp2 && (
            <div className="space-y-4 rounded-lg border border-cyan-500/30 bg-gray-900/80 p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Bit-Level Mechanics: Temp2 Sub-Operations
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  T2 = Σ₀(a) + Maj(a,b,c)
                </span>
              </div>

              {/* Sigma 0 (a) */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-orange-400">
                  1. Upper Sigma 0: Σ₀(a) = ROTR²(a) ⊕ ROTR¹³(a) ⊕ ROTR²²(a)
                </div>
                <BitwiseOperationRow
                  label="a"
                  binary={temp2.sigma0.input.binary}
                  hex={temp2.sigma0.input.hex}
                  opType="input"
                />
                <BitwiseOperationRow
                  label="ROTR²(a)"
                  binary={temp2.sigma0.rot2.binary}
                  hex={temp2.sigma0.rot2.hex}
                  opType="rot"
                  tag="Rotate 2"
                />
                <BitwiseOperationRow
                  label="ROTR¹³(a)"
                  binary={temp2.sigma0.rot13.binary}
                  hex={temp2.sigma0.rot13.hex}
                  opType="rot"
                  tag="Rotate 13"
                />
                <BitwiseOperationRow
                  label="ROTR²²(a)"
                  binary={temp2.sigma0.rot22.binary}
                  hex={temp2.sigma0.rot22.hex}
                  opType="rot"
                  tag="Rotate 22"
                />
                <BitwiseOperationRow
                  label="Σ₀(a) Result"
                  binary={temp2.sigma0.result.binary}
                  hex={temp2.sigma0.result.hex}
                  opType="xor"
                  tag="3-way XOR"
                  isResult
                />
              </div>

              {/* Majority Function */}
              <div className="space-y-1.5 pt-2 border-t border-gray-800">
                <div className="text-xs font-semibold text-emerald-400">
                  2. Majority Function: Maj(a, b, c) = (a ∧ b) ⊕ (a ∧ c) ⊕ (b ∧ c)
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
                  label="Maj Result"
                  binary={temp2.maj.result.binary}
                  hex={temp2.maj.result.hex}
                  opType="xor"
                  tag="3-way XOR"
                  isResult
                />
              </div>

              {/* Temp 2 Sum */}
              <div className="space-y-1.5 pt-2 border-t border-gray-800">
                <div className="text-xs font-semibold text-cyan-300">
                  3. Addition: Temp2 = Σ₀(a) + Maj(a,b,c) (mod 2³²)
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
                  label="Temp2 Total"
                  binary={temp2.result.binary}
                  hex={temp2.result.hex}
                  opType="result"
                  tag="SUM (T2)"
                  isResult
                />
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* INLINE BIT-LEVEL EXPANSION: Message Schedule Expansion (sigma0/sigma1) */}
          {/* ===================================================================== */}
          {sigma0Expansion && sigma1Expansion && (
            <div className="space-y-4 rounded-lg border border-cyan-500/30 bg-gray-900/80 p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Message Schedule Bit Mechanics
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  W[i] = σ₁(W[i-2]) + W[i-7] + σ₀(W[i-15]) + W[i-16]
                </span>
              </div>

              {/* Lower Sigma 0 */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-orange-400">
                  1. Lower Sigma 0: σ₀(W[i-15]) = ROTR⁷ ⊕ ROTR¹⁸ ⊕ SHR³
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
                  tag="Rotate 7"
                />
                <BitwiseOperationRow
                  label="ROTR¹⁸"
                  binary={sigma0Expansion.rot18.binary}
                  hex={sigma0Expansion.rot18.hex}
                  opType="rot"
                  tag="Rotate 18"
                />
                <BitwiseOperationRow
                  label="SHR³"
                  binary={sigma0Expansion.shr3.binary}
                  hex={sigma0Expansion.shr3.hex}
                  opType="shr"
                  tag="Shift 3"
                />
                <BitwiseOperationRow
                  label="σ₀ Result"
                  binary={sigma0Expansion.result.binary}
                  hex={sigma0Expansion.result.hex}
                  opType="xor"
                  tag="XOR"
                  isResult
                />
              </div>

              {/* Lower Sigma 1 */}
              <div className="space-y-1.5 pt-2 border-t border-gray-800">
                <div className="text-xs font-semibold text-orange-400">
                  2. Lower Sigma 1: σ₁(W[i-2]) = ROTR¹⁷ ⊕ ROTR¹⁹ ⊕ SHR¹⁰
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
                  tag="Rotate 17"
                />
                <BitwiseOperationRow
                  label="ROTR¹⁹"
                  binary={sigma1Expansion.rot19.binary}
                  hex={sigma1Expansion.rot19.hex}
                  opType="rot"
                  tag="Rotate 19"
                />
                <BitwiseOperationRow
                  label="SHR¹⁰"
                  binary={sigma1Expansion.shr10.binary}
                  hex={sigma1Expansion.shr10.hex}
                  opType="shr"
                  tag="Shift 10"
                />
                <BitwiseOperationRow
                  label="σ₁ Result"
                  binary={sigma1Expansion.result.binary}
                  hex={sigma1Expansion.result.hex}
                  opType="xor"
                  tag="XOR"
                  isResult
                />
              </div>

              {/* Total Schedule Addition */}
              {wMinus16 && wMinus7 && scheduleResult && (
                <div className="space-y-1.5 pt-2 border-t border-gray-800">
                  <div className="text-xs font-semibold text-yellow-300">
                    3. Combine 4 Words for W[i]
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
                    label="W[i] Result"
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
            <div className="rounded-lg border border-green-500/30 bg-gray-900/80 p-4 shadow-xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-green-400">
                Final Block Accumulation: H[i] = H[i] + Variable[i]
              </span>
              <div className="grid gap-1.5 font-mono text-xs">
                {updates.map((u) => (
                  <div
                    key={u.label}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 rounded bg-gray-800/60 p-2 border border-gray-700/60"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-bold w-12">{u.label}</span>
                      <span className="text-gray-500">0x{u.prevHex}</span>
                      <span className="text-gray-400">+</span>
                      <span className="text-amber-400">0x{u.addHex}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">=</span>
                      <span className="text-green-300 font-bold">0x{u.newHex}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 3: RIGHT - ROUND CONSTANTS (K[0..63]) */}
        {/* ========================================================================= */}
        <div className="rounded-lg border border-gray-800 bg-gray-900/70 p-3 flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Round Constants K
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              {constants.length || 64} constants
            </span>
          </div>

          {constants.length > 0 ? (
            <div className="overflow-y-auto space-y-1 pr-1 flex-1 font-mono text-xs">
              {constants.map((item) => {
                const isActive = item.active || (roundIdx !== undefined && item.index === roundIdx);
                return (
                  <div
                    key={item.index}
                    className={`rounded px-2 py-1.5 border transition-all ${
                      isActive
                        ? 'border-yellow-400/80 bg-yellow-950/40 text-yellow-300 ring-1 ring-yellow-400/40'
                        : 'border-gray-800/60 bg-gray-900/30 text-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-500">
                        K[{item.index.toString().padStart(2, '0')}]
                      </span>
                      <span className={isActive ? 'font-bold text-yellow-300' : 'text-gray-300'}>
                        0x{item.hex}
                      </span>
                    </div>
                    {binaryMode && item.binary && (
                      <div className="text-[9px] tracking-tight text-gray-500 mt-0.5 truncate select-all">
                        {formatBinaryGroups(item.binary, 8)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-500 italic p-4 text-center">
              Constants table
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
