import React, { useState } from 'react';
import type { ComputationStep } from '../../algorithms/types';

interface KeyExchangeViewProps {
  step: ComputationStep;
}

export default function KeyExchangeView({ step }: KeyExchangeViewProps) {
  const [showFullHex, setShowFullHex] = useState(false);

  const data = step.data as {
    protocolType?: string;
    curveName?: string;
    pHex?: string;
    gHex?: string;
    aHex?: string;
    bHex?: string;
    dAHex?: string;
    dBHex?: string;
    AHex?: string;
    BHex?: string;
    QAxHex?: string;
    QAyHex?: string;
    QBxHex?: string;
    QByHex?: string;
    transferAtoB?: string;
    transferBtoA?: string;
    SaHex?: string;
    SbHex?: string;
    SAxHex?: string;
    SAyHex?: string;
    SBxHex?: string;
    SByHex?: string;
    sharedSecretHex?: string;
    matched?: boolean;
  };

  const formatHex = (hexStr?: string, maxChars = 20) => {
    if (!hexStr) return '0x0';
    return hexStr.length > maxChars && !showFullHex
      ? `0x${hexStr.slice(0, 10)}...${hexStr.slice(-10)}`
      : `0x${hexStr}`;
  };

  return (
    <div className="space-y-3 font-mono">
      {/* Telemetry Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f2937] pb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#34d399] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#34d399]">
            TWO-PARTY KEY AGREEMENT PROTOCOL ANALYZER
          </span>
          {data.protocolType && (
            <span className="rounded-[2px] bg-[#11231a] px-2 py-0.5 text-[9px] font-semibold text-[#34d399] border border-[#34d399]/30">
              {data.protocolType} {data.curveName ? `(${data.curveName})` : ''}
            </span>
          )}
          {data.matched !== undefined && (
            <span
              className={`rounded-[2px] px-2 py-0.5 text-[9px] font-bold border tabular-nums ${
                data.matched
                  ? 'bg-[#132a1e] text-[#34d399] border-[#34d399]/40 phosphor-emerald'
                  : 'bg-[#2a1318] text-[#f87171] border-[#f87171]/40'
              }`}
            >
              {data.matched ? '✓ SHARED SECRETS MATCH IDENTICALLY' : '✗ SECRET MISMATCH'}
            </span>
          )}
        </div>

        <button
          onClick={() => setShowFullHex(!showFullHex)}
          className="rounded-[2px] bg-[#0e131b] px-2 py-0.5 text-[9px] text-[#94a3b8] hover:text-white border border-[#1f2937] transition-colors"
        >
          {showFullHex ? 'COLLAPSE PROTOCOL HEX' : 'EXPAND FULL HEX'}
        </button>
      </div>

      {/* 2-Party Swimlane Layout */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 text-xs items-stretch">
        {/* Alice Terminal (3 cols) */}
        <div className="rounded-[2px] border border-[#38bdf8]/30 bg-[#0e141d] p-2.5 space-y-2 md:col-span-3">
          <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
            <span className="text-[9px] font-bold uppercase text-[#38bdf8] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-[#38bdf8]" />
              ALICE'S TERMINAL
            </span>
            <span className="text-[7.5px] text-[#64748b]">PARTY A</span>
          </div>

          <div className="space-y-1.5 text-[9.5px]">
            {/* Alice Private */}
            <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
              <span className="text-[7.5px] text-[#e5a93b] uppercase block">
                {data.protocolType === 'ECDH' ? 'SECRET SCALAR (dA)' : 'SECRET EXPONENT (a)'}
              </span>
              <span className="text-[#e5a93b] font-mono break-all font-bold">
                {formatHex(data.dAHex || data.aHex, 18)}
              </span>
            </div>

            {/* Alice Public */}
            <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
              <span className="text-[7.5px] text-[#38bdf8] uppercase block">
                {data.protocolType === 'ECDH' ? 'PUBLIC POINT Q_A = dA · G' : 'PUBLIC KEY A = gᵃ mod p'}
              </span>
              <span className="text-[#38bdf8] font-mono break-all">
                {data.QAxHex ? `X: ${formatHex(data.QAxHex, 12)}` : formatHex(data.AHex, 18)}
              </span>
            </div>

            {/* Alice Derived Secret */}
            <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
              <span className="text-[7.5px] text-[#34d399] uppercase block">
                {data.protocolType === 'ECDH' ? 'DERIVED POINT S_A = dA · Q_B' : 'DERIVED SECRET S_A = Bᵃ mod p'}
              </span>
              <span className="text-[#34d399] font-mono break-all font-bold">
                {data.SAxHex ? `X: ${formatHex(data.SAxHex, 12)}` : formatHex(data.SaHex, 18)}
              </span>
            </div>
          </div>
        </div>

        {/* Public Insecure Channel (1 col) */}
        <div className="rounded-[2px] border border-[#1f2937] bg-[#090c10] p-2 flex flex-col items-center justify-center space-y-2 md:col-span-1 text-center">
          <span className="text-[7.5px] text-[#64748b] uppercase tracking-wider block">
            UNTRUSTED PUBLIC CHANNEL
          </span>
          <div className="w-full space-y-2 text-[8px] text-[#94a3b8]">
            <div className="rounded-[2px] bg-[#0c1017] p-1 border border-[#38bdf8]/30">
              <span className="text-[#38bdf8] block">A → Bob</span>
            </div>
            <div className="rounded-[2px] bg-[#0c1017] p-1 border border-[#c084fc]/30">
              <span className="text-[#c084fc] block">B → Alice</span>
            </div>
          </div>
        </div>

        {/* Bob Terminal (3 cols) */}
        <div className="rounded-[2px] border border-[#c084fc]/30 bg-[#140e1d] p-2.5 space-y-2 md:col-span-3">
          <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
            <span className="text-[9px] font-bold uppercase text-[#c084fc] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-[#c084fc]" />
              BOB'S TERMINAL
            </span>
            <span className="text-[7.5px] text-[#64748b]">PARTY B</span>
          </div>

          <div className="space-y-1.5 text-[9.5px]">
            {/* Bob Private */}
            <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
              <span className="text-[7.5px] text-[#e5a93b] uppercase block">
                {data.protocolType === 'ECDH' ? 'SECRET SCALAR (dB)' : 'SECRET EXPONENT (b)'}
              </span>
              <span className="text-[#e5a93b] font-mono break-all font-bold">
                {formatHex(data.dBHex || data.bHex, 18)}
              </span>
            </div>

            {/* Bob Public */}
            <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
              <span className="text-[7.5px] text-[#c084fc] uppercase block">
                {data.protocolType === 'ECDH' ? 'PUBLIC POINT Q_B = dB · G' : 'PUBLIC KEY B = gᵇ mod p'}
              </span>
              <span className="text-[#c084fc] font-mono break-all">
                {data.QBxHex ? `X: ${formatHex(data.QBxHex, 12)}` : formatHex(data.BHex, 18)}
              </span>
            </div>

            {/* Bob Derived Secret */}
            <div className="rounded-[2px] bg-[#090c10] p-1.5 border border-[#1f2937]">
              <span className="text-[7.5px] text-[#34d399] uppercase block">
                {data.protocolType === 'ECDH' ? 'DERIVED POINT S_B = dB · Q_A' : 'DERIVED SECRET S_B = Aᵇ mod p'}
              </span>
              <span className="text-[#34d399] font-mono break-all font-bold">
                {data.SBxHex ? `X: ${formatHex(data.SBxHex, 12)}` : formatHex(data.SbHex, 18)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Shared Secret Established Output */}
      {data.sharedSecretHex && (
        <div className="rounded-[2px] border border-[#34d399]/40 bg-[#0c1611] p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#34d399]">
              ESTABLISHED SYMMETRIC SHARED KEY (S):
            </span>
            <span className="text-[8px] text-[#64748b]">
              {data.sharedSecretHex.length * 4} BITS ({data.sharedSecretHex.length / 2} BYTES)
            </span>
          </div>
          <div className="rounded-[2px] bg-[#090c10] p-2 border border-[#1f2937] text-[10px] text-[#34d399] font-mono font-bold break-all select-all">
            0x{data.sharedSecretHex}
          </div>
        </div>
      )}
    </div>
  );
}
