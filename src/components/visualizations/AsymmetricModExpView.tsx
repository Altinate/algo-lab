import React, { useState } from 'react';
import type { ComputationStep } from '../../algorithms/types';

interface AsymmetricModExpViewProps {
  step: ComputationStep;
}

export default function AsymmetricModExpView({ step }: AsymmetricModExpViewProps) {
  const [showFullHex, setShowFullHex] = useState(false);
  const [radixMode, setRadixMode] = useState<'hex' | 'dec'>('hex');

  const data = step.data as {
    keySizeBits?: number;
    nHex?: string;
    eHex?: string;
    dHex?: string;
    pHex?: string;
    qHex?: string;
    dPHex?: string;
    dQHex?: string;
    qInvHex?: string;
    baseHex?: string;
    expHex?: string;
    modHex?: string;
    resHex?: string;
    mHex?: string;
    m1Hex?: string;
    m2Hex?: string;
    hHex?: string;
    sigHex?: string;
    recoveredEmHex?: string;
    expectedEmHex?: string;
    isValid?: boolean;
    bitSteps?: Array<{
      bitIndex: number;
      bitValue: number;
      action: 'square' | 'square-and-multiply';
      accumulatorHex: string;
    }>;
  };

  const formatBigIntStr = (hexStr?: string) => {
    if (!hexStr) return '0x0';
    if (radixMode === 'dec') {
      try {
        const big = BigInt('0x' + hexStr);
        const dec = big.toString(10);
        return dec.length > 40 && !showFullHex ? `${dec.slice(0, 20)}...${dec.slice(-15)} (${dec.length} digits)` : dec;
      } catch {
        return hexStr;
      }
    }
    return hexStr.length > 48 && !showFullHex
      ? `0x${hexStr.slice(0, 20)}...${hexStr.slice(-16)} (${hexStr.length * 4} bits)`
      : `0x${hexStr}`;
  };

  return (
    <div className="space-y-3 font-mono">
      {/* Telemetry Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f2937] pb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#c084fc] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#c084fc]">
            ASYMMETRIC MODULAR EXPONENTIATION ANALYZER
          </span>
          {data.keySizeBits && (
            <span className="rounded-[2px] bg-[#1a1224] px-2 py-0.5 text-[9px] font-semibold text-[#c084fc] border border-[#c084fc]/30 tabular-nums">
              {data.keySizeBits}-BIT MODULUS
            </span>
          )}
          {data.isValid !== undefined && (
            <span
              className={`rounded-[2px] px-2 py-0.5 text-[9px] font-bold border tabular-nums ${
                data.isValid
                  ? 'bg-[#132a1e] text-[#34d399] border-[#34d399]/40 phosphor-emerald'
                  : 'bg-[#2a1318] text-[#f87171] border-[#f87171]/40'
              }`}
            >
              {data.isValid ? '✓ SIGNATURE VERIFIED' : '✗ INVALID SIGNATURE'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowFullHex(!showFullHex)}
            className="rounded-[2px] bg-[#0e131b] px-2 py-0.5 text-[9px] text-[#94a3b8] hover:text-white border border-[#1f2937] transition-colors"
          >
            {showFullHex ? 'COLLAPSE BIGINTS' : 'EXPAND FULL BIGINTS'}
          </button>
          <button
            onClick={() => setRadixMode(radixMode === 'hex' ? 'dec' : 'hex')}
            className="rounded-[2px] bg-[#0e131b] px-2 py-0.5 text-[9px] text-[#38bdf8] hover:text-white border border-[#1f2937] transition-colors"
          >
            {radixMode === 'hex' ? 'RADIX: HEX' : 'RADIX: BASE-10'}
          </button>
        </div>
      </div>

      {/* 1. Key Registry Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        {data.nHex && (
          <div className="rounded-[2px] bg-[#090c10] p-2 border border-[#1f2937] space-y-0.5 col-span-1 md:col-span-2">
            <span className="text-[8px] text-[#64748b] uppercase block">MODULUS N = p · q</span>
            <span className="text-[#38bdf8] font-mono text-[11px] font-bold tabular-nums break-all">
              {formatBigIntStr(data.nHex)}
            </span>
          </div>
        )}
        {data.eHex && (
          <div className="rounded-[2px] bg-[#090c10] p-2 border border-[#1f2937] space-y-0.5">
            <span className="text-[8px] text-[#34d399] uppercase block">PUBLIC EXPONENT (e)</span>
            <span className="text-[#34d399] font-mono font-bold tabular-nums break-all">
              {formatBigIntStr(data.eHex)}
            </span>
          </div>
        )}
        {data.dHex && (
          <div className="rounded-[2px] bg-[#090c10] p-2 border border-[#1f2937] space-y-0.5">
            <span className="text-[8px] text-[#e5a93b] uppercase block">PRIVATE EXPONENT (d)</span>
            <span className="text-[#e5a93b] font-mono font-bold tabular-nums break-all">
              {formatBigIntStr(data.dHex)}
            </span>
          </div>
        )}
      </div>

      {/* 2. CRT Parameters Decomposition (if available) */}
      {(data.pHex || data.dPHex) && (
        <div className="rounded-[2px] border border-[#c084fc]/30 bg-[#0e1219] p-2.5 space-y-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#c084fc] block">
            CHINESE REMAINDER THEOREM (CRT) DECOMPOSITION DECK:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {data.pHex && (
              <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
                <span className="text-[7.5px] text-[#64748b] uppercase block">PRIME p</span>
                <span className="text-[#cbd5e1] font-mono text-[10px] font-semibold break-all">
                  {formatBigIntStr(data.pHex)}
                </span>
              </div>
            )}
            {data.qHex && (
              <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
                <span className="text-[7.5px] text-[#64748b] uppercase block">PRIME q</span>
                <span className="text-[#cbd5e1] font-mono text-[10px] font-semibold break-all">
                  {formatBigIntStr(data.qHex)}
                </span>
              </div>
            )}
            {data.dPHex && (
              <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
                <span className="text-[7.5px] text-[#e5a93b] uppercase block">dP = d mod (p-1)</span>
                <span className="text-[#e5a93b] font-mono text-[10px] font-semibold break-all">
                  {formatBigIntStr(data.dPHex)}
                </span>
              </div>
            )}
            {data.dQHex && (
              <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
                <span className="text-[7.5px] text-[#e5a93b] uppercase block">dQ = d mod (q-1)</span>
                <span className="text-[#e5a93b] font-mono text-[10px] font-semibold break-all">
                  {formatBigIntStr(data.dQHex)}
                </span>
              </div>
            )}
            {data.qInvHex && (
              <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
                <span className="text-[7.5px] text-[#38bdf8] uppercase block">qInv = q⁻¹ mod p</span>
                <span className="text-[#38bdf8] font-mono text-[10px] font-semibold break-all">
                  {formatBigIntStr(data.qInvHex)}
                </span>
              </div>
            )}
            {data.hHex && (
              <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
                <span className="text-[7.5px] text-[#34d399] uppercase block">GARNER h = qInv·(m₁-m₂) mod p</span>
                <span className="text-[#34d399] font-mono text-[10px] font-semibold break-all">
                  {formatBigIntStr(data.hHex)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Square-and-Multiply Bit Ladder (if available) */}
      {data.bitSteps && data.bitSteps.length > 0 && (
        <div className="rounded-[2px] border border-[#1f2937] bg-[#090c10] p-2.5 space-y-2">
          <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-[#38bdf8]" />
              SQUARE-AND-MULTIPLY MODULAR ACCUMULATOR LADDER
            </span>
            <span className="text-[8px] text-[#64748b]">
              {data.bitSteps.length} ACCUMULATOR SAMPLE STEPS
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {data.bitSteps.map((bStep, idx) => (
              <div
                key={`bstep-${idx}`}
                className={`flex items-center justify-between rounded-[2px] px-2 py-1 text-[10px] tabular-nums border ${
                  bStep.bitValue === 1
                    ? 'bg-[#121c2e] border-[#38bdf8]/40 text-[#cbd5e1]'
                    : 'bg-[#0c1017] border-[#1f2937] text-[#94a3b8]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#64748b] text-[8px]">BIT #{bStep.bitIndex}</span>
                  <span className="font-bold text-[#e5a93b]">[{bStep.bitValue}]</span>
                  <span className="text-[9px] uppercase font-semibold text-[#38bdf8]">
                    {bStep.action}
                  </span>
                </div>
                <span className="font-mono text-[#cbd5e1] text-[9.5px] truncate max-w-[200px] sm:max-w-[320px]">
                  Acc: 0x{bStep.accumulatorHex}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
