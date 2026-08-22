import React, { useState } from 'react';
import type { ComputationStep } from '../../algorithms/types';

interface EccPointViewProps {
  step: ComputationStep;
}

export default function EccPointView({ step }: EccPointViewProps) {
  const [showFullHex, setShowFullHex] = useState(false);

  const data = step.data as {
    curveName?: string;
    pHex?: string;
    aHex?: string;
    bHex?: string;
    nHex?: string;
    GxHex?: string;
    GyHex?: string;
    QxHex?: string;
    QyHex?: string;
    dHex?: string;
    zHex?: string;
    kHex?: string;
    RxHex?: string;
    RyHex?: string;
    rHex?: string;
    sHex?: string;
    sigHex?: string;
    wHex?: string;
    u1Hex?: string;
    u2Hex?: string;
    PxHex?: string;
    PyHex?: string;
    recoveredXHex?: string;
    expectedRHex?: string;
    isValid?: boolean;
    scalarSteps?: Array<{
      bitIndex: number;
      bitValue: number;
      operation: 'double' | 'double-and-add';
      currentPointHex: { x: string; y: string };
    }>;
  };

  const formatHex = (hexStr?: string, maxChars = 24) => {
    if (!hexStr) return '0x0';
    return hexStr.length > maxChars && !showFullHex
      ? `0x${hexStr.slice(0, 12)}...${hexStr.slice(-12)}`
      : `0x${hexStr}`;
  };

  return (
    <div className="space-y-3 font-mono">
      {/* Telemetry Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f2937] pb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#38bdf8] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">
            ELLIPTIC CURVE POINT LOGIC ANALYZER
          </span>
          {data.curveName && (
            <span className="rounded-[2px] bg-[#102030] px-2 py-0.5 text-[9px] font-semibold text-[#38bdf8] border border-[#38bdf8]/30">
              CURVE: {data.curveName}
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

        <button
          onClick={() => setShowFullHex(!showFullHex)}
          className="rounded-[2px] bg-[#0e131b] px-2 py-0.5 text-[9px] text-[#94a3b8] hover:text-white border border-[#1f2937] transition-colors"
        >
          {showFullHex ? 'COLLAPSE POINT COORDINATES' : 'EXPAND FULL COORDINATES'}
        </button>
      </div>

      {/* Static Default Nonce Security Notice (present only on the ECDSA sign ephemeral-point step) */}
      {data.kHex && (
        <div className="rounded-[2px] border border-[#e5a93b]/40 bg-[#15120c] px-2.5 py-1.5 text-[9.5px] leading-relaxed text-[#e5a93b]">
          <span className="font-bold uppercase tracking-wider">⚠ Statistical nonce (k): </span>
          The default static nonce shown here is fixed for reproducible KAT-vector verification.
          Reusing a nonce across messages lets an attacker recover the private key — for
          production signature generation supply a fresh random nonce via{" "}
          <span className="font-semibold text-[#f8fafc]">options.kNonceHex</span>.
        </div>
      )}

      {/* 1. Curve Parameters Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
        {data.pHex && (
          <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
            <span className="text-[7.5px] text-[#64748b] uppercase block">FIELD PRIME (p)</span>
            <span className="text-[#38bdf8] font-mono text-[9.5px] font-bold tabular-nums break-all">
              {formatHex(data.pHex)}
            </span>
          </div>
        )}
        {data.nHex && (
          <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
            <span className="text-[7.5px] text-[#64748b] uppercase block">BASE POINT ORDER (n)</span>
            <span className="text-[#cbd5e1] font-mono text-[9.5px] font-bold tabular-nums break-all">
              {formatHex(data.nHex)}
            </span>
          </div>
        )}
        {data.GxHex && data.GyHex && (
          <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937] col-span-1 sm:col-span-2">
            <span className="text-[7.5px] text-[#34d399] uppercase block">BASE GENERATOR POINT G = (Gx, Gy)</span>
            <span className="text-[#34d399] font-mono text-[9px] block truncate">
              X: {formatHex(data.GxHex, 16)} | Y: {formatHex(data.GyHex, 16)}
            </span>
          </div>
        )}
      </div>

      {/* 2. Key Pair & Signature Parameters */}
      <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {data.dHex && (
            <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
              <span className="text-[7.5px] text-[#e5a93b] uppercase block">PRIVATE KEY SCALAR (d)</span>
              <span className="text-[#e5a93b] font-mono text-[10px] font-bold tabular-nums break-all">
                {formatHex(data.dHex)}
              </span>
            </div>
          )}
          {data.QxHex && data.QyHex && (
            <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
              <span className="text-[7.5px] text-[#c084fc] uppercase block">PUBLIC KEY POINT Q = d · G</span>
              <span className="text-[#c084fc] font-mono text-[9px] block truncate">
                X: {formatHex(data.QxHex, 14)} | Y: {formatHex(data.QyHex, 14)}
              </span>
            </div>
          )}
        </div>

        {/* Signature (r, s) Deck */}
        {(data.rHex || data.sHex) && (
          <div className="rounded-[2px] border border-[#38bdf8]/30 bg-[#0e1219] p-2 space-y-1.5">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#38bdf8] block">
              ECDSA SIGNATURE VECTOR (r, s):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {data.rHex && (
                <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
                  <span className="text-[7.5px] text-[#34d399] uppercase block">SIGNATURE r = (k·G).x mod n</span>
                  <span className="text-[#34d399] font-mono text-[9.5px] font-bold break-all">
                    {formatHex(data.rHex, 20)}
                  </span>
                </div>
              )}
              {data.sHex && (
                <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
                  <span className="text-[7.5px] text-[#e5a93b] uppercase block">SIGNATURE s = k⁻¹(z + r·d) mod n</span>
                  <span className="text-[#e5a93b] font-mono text-[9.5px] font-bold break-all">
                    {formatHex(data.sHex, 20)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verification Point Linear Combination P = u1*G + u2*Q */}
        {data.PxHex && (
          <div className="rounded-[2px] border border-[#34d399]/30 bg-[#0e1612] p-2 space-y-1 text-xs">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#34d399] block">
              RECOVERED VERIFICATION POINT P = u₁·G + u₂·Q
            </span>
            <div className="text-[9.5px] text-[#cbd5e1] font-mono space-y-0.5">
              <div>Point X: <span className="text-[#34d399] font-bold">{formatHex(data.PxHex, 24)}</span></div>
              <div>Point Y: <span className="text-[#94a3b8]">{formatHex(data.PyHex, 24)}</span></div>
              <div className="pt-1 text-[8.5px] text-[#94a3b8]">
                Match Condition: X mod n (<span className="text-[#34d399]">{formatHex(data.recoveredXHex, 14)}</span>) === r (
                <span className="text-[#34d399]">{formatHex(data.expectedRHex, 14)}</span>)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Double-and-Add Scalar Progression Ladder */}
      {data.scalarSteps && data.scalarSteps.length > 0 && (
        <div className="rounded-[2px] border border-[#1f2937] bg-[#090c10] p-2.5 space-y-2">
          <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-[#38bdf8]" />
              DOUBLE-AND-ADD POINT MULTIPLICATION LADDER
            </span>
            <span className="text-[8px] text-[#64748b]">
              {data.scalarSteps.length} PROGRESSION SAMPLE STEPS
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {data.scalarSteps.map((sStep, idx) => (
              <div
                key={`sstep-${idx}`}
                className={`flex items-center justify-between rounded-[2px] px-2 py-1 text-[10px] tabular-nums border ${
                  sStep.bitValue === 1
                    ? 'bg-[#121c2e] border-[#38bdf8]/40 text-[#cbd5e1]'
                    : 'bg-[#0c1017] border-[#1f2937] text-[#94a3b8]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#64748b] text-[8px]">BIT #{sStep.bitIndex}</span>
                  <span className="font-bold text-[#e5a93b]">[{sStep.bitValue}]</span>
                  <span className="text-[8.5px] uppercase font-semibold text-[#38bdf8]">
                    {sStep.operation}
                  </span>
                </div>
                <span className="font-mono text-[#cbd5e1] text-[9px] truncate max-w-[200px] sm:max-w-[300px]">
                  P: ({sStep.currentPointHex.x.slice(0, 8)}..., {sStep.currentPointHex.y.slice(0, 8)}...)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
