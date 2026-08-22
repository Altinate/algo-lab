import React, { useState } from 'react';
import type { ComputationStep } from '../../algorithms/types';

interface LatticePolynomialViewProps {
  step: ComputationStep;
}

export default function LatticePolynomialView({ step }: LatticePolynomialViewProps) {
  const [selectedCoeff, setSelectedCoeff] = useState<{ index: number; val: number } | null>(null);

  const data = step.data as {
    pipelineStage?: 'KeyGen' | 'Encapsulation' | 'Decapsulation';
    kRank?: number;
    matrixDims?: string;
    seedHex?: string;
    rhoHex?: string;
    sigmaHex?: string;
    polynomialSpectrum?: number[];
    polyLabel?: string;
    nttStages?: Array<{ stage: number; subLength: number }>;
    cbdHistogram?: Record<number, number>;
    ekHex?: string;
    cHex?: string;
    sharedKeyHex?: string;
    decapsMatched?: boolean;
  };

  const spectrum = data.polynomialSpectrum || [];
  const cbdEntries = Object.entries(data.cbdHistogram || {}).map(([k, v]) => ({
    val: parseInt(k, 10),
    count: v,
  })).sort((a, b) => a.val - b.val);

  const maxCbdCount = Math.max(...cbdEntries.map((e) => e.count), 1);

  return (
    <div className="space-y-3 font-mono">
      {/* Telemetry Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f2937] pb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#38bdf8] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">
            LATTICE POLYNOMIAL LOGIC ANALYZER (NIST FIPS 203 ML-KEM)
          </span>
          {data.kRank && (
            <span className="rounded-[2px] bg-[#0c1824] px-2 py-0.5 text-[9px] font-semibold text-[#38bdf8] border border-[#38bdf8]/30">
              MODULE RANK k={data.kRank} ({data.matrixDims})
            </span>
          )}
          {data.pipelineStage && (
            <span className="rounded-[2px] bg-[#1a1224] px-2 py-0.5 text-[9px] font-bold text-[#c084fc] border border-[#c084fc]/40">
              STAGE: {data.pipelineStage.toUpperCase()}
            </span>
          )}
          {data.decapsMatched !== undefined && (
            <span
              className={`rounded-[2px] px-2 py-0.5 text-[9px] font-bold border tabular-nums ${
                data.decapsMatched
                  ? 'bg-[#132a1e] text-[#34d399] border-[#34d399]/40 phosphor-emerald'
                  : 'bg-[#2a1318] text-[#f87171] border-[#f87171]/40'
              }`}
            >
              {data.decapsMatched ? '✓ SHARED KEY VERIFIED' : '✗ REJECTED'}
            </span>
          )}
        </div>

        <span className="text-[9px] text-[#64748b]">
          RING: ℤ₃₃₂₉[X] / (X²⁵⁶ + 1)
        </span>
      </div>

      {/* Module-level Flow Pipeline Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5 text-[8.5px]">
        {[
          { label: '1. SEED EXPANSION', desc: 'SHA3-512 (ρ, σ)', active: data.pipelineStage === 'KeyGen' },
          { label: '2. LATTICE MATRIX', desc: 'SampleNTT(Â)', active: data.pipelineStage === 'KeyGen' },
          { label: '3. NOISE SAMPLING', desc: 'CBD(η₁, η₂)', active: !!data.cbdHistogram },
          { label: '4. NTT ALGEBRA', desc: 'Â·ŝ + ê mod q', active: !!data.nttStages },
          { label: '5. KEM DERIVATION', desc: 'Shared Key (K)', active: !!data.sharedKeyHex },
        ].map((item, idx) => (
          <div
            key={idx}
            className={`rounded-[2px] p-1.5 border transition-all ${
              item.active
                ? 'border-[#38bdf8] bg-[#0c1824] text-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.15)]'
                : 'border-[#1f2937] bg-[#090c10] text-[#64748b]'
            }`}
          >
            <div className="font-bold truncate">{item.label}</div>
            <div className="text-[7.5px] text-[#94a3b8] truncate">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Main 2-Column Grid: Polynomial Heatmap & Protocol Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-xs">
        {/* Left Column: 256-Coefficient Polynomial Spectrum Heatmap (7 cols) */}
        <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2.5 md:col-span-7 space-y-2">
          <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
            <span className="text-[9px] font-bold uppercase text-[#cbd5e1] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-[#38bdf8]" />
              {data.polyLabel || 'ACTIVE POLYNOMIAL COEFFICIENT SPECTRUM (n=256, q=3329)'}
            </span>
            <span className="text-[8px] text-[#64748b]">
              {selectedCoeff ? `COEFF [${selectedCoeff.index}]: ${selectedCoeff.val}` : 'HOVER CELL'}
            </span>
          </div>

          {/* 16x16 Heatmap Grid */}
          <div className="grid grid-cols-16 gap-[2px] p-1 bg-[#090c10] rounded-[2px] border border-[#1f2937]/60">
            {spectrum.length === 256 ? (
              spectrum.map((val, idx) => {
                // Color mapping: low (slate), mid (emerald/cyan), high (amber)
                let colorClass = 'bg-[#151c28] text-[#64748b]';
                if (val > 0 && val < 500) colorClass = 'bg-[#0f2e22] text-[#34d399] border border-[#34d399]/40';
                else if (val >= 500 && val < 1800) colorClass = 'bg-[#0e2738] text-[#38bdf8] border border-[#38bdf8]/40';
                else if (val >= 1800) colorClass = 'bg-[#33220f] text-[#e5a93b] border border-[#e5a93b]/40';

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setSelectedCoeff({ index: idx, val })}
                    className={`h-3.5 flex items-center justify-center text-[7px] font-bold cursor-pointer transition-all rounded-[1px] hover:scale-125 hover:z-10 ${colorClass}`}
                    title={`Index ${idx}: value = ${val}`}
                  >
                    {val > 999 ? `${Math.floor(val / 1000)}k` : val}
                  </div>
                );
              })
            ) : (
              <div className="col-span-16 py-6 text-center text-[10px] text-[#64748b]">
                POLYNOMIAL COEFFICIENT DATA BUFFER READY FOR CLOCK PULSE.
              </div>
            )}
          </div>

          {/* Color Scale Legend */}
          <div className="flex items-center justify-between text-[7.5px] text-[#64748b] pt-1">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-[1px] bg-[#151c28]" /> 0 (Zero)
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-[1px] bg-[#0f2e22]" /> &lt; 500 (Noise)
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-[1px] bg-[#0e2738]" /> 500-1800 (Mid)
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-[1px] bg-[#33220f]" /> &gt; 1800 (Upper q)
            </div>
          </div>
        </div>

        {/* Right Column: NTT Butterfly Stages & CBD Noise Distribution (5 cols) */}
        <div className="space-y-2 md:col-span-5">
          {/* NTT 7-Stage Butterfly Telemetry */}
          {data.nttStages && data.nttStages.length > 0 && (
            <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1.5">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
                <span className="text-[9px] font-bold uppercase text-[#38bdf8]">
                  NTT 7-STAGE COOLEY-TUKEY BUTTERFLIES
                </span>
                <span className="text-[7.5px] text-[#64748b]">FIPS 203 ALG 9</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-[8px] text-center">
                {data.nttStages.map((stage) => (
                  <div
                    key={stage.stage}
                    className="rounded-[2px] bg-[#090c10] p-1 border border-[#38bdf8]/30"
                  >
                    <div className="text-[#38bdf8] font-bold">S{stage.stage}</div>
                    <div className="text-[7px] text-[#64748b]">L={stage.subLength}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CBD Noise Distribution Histogram */}
          {cbdEntries.length > 0 && (
            <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1.5">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
                <span className="text-[9px] font-bold uppercase text-[#e5a93b]">
                  CENTERED BINOMIAL NOISE DISTRIBUTION (CBD)
                </span>
                <span className="text-[7.5px] text-[#64748b]">DIFFERENCE (a - b)</span>
              </div>
              <div className="flex items-end justify-center gap-1.5 h-16 pt-2">
                {cbdEntries.map((entry) => {
                  const heightPercent = Math.round((entry.count / maxCbdCount) * 100);
                  return (
                    <div key={entry.val} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-[1px] bg-[#e5a93b]/70 border border-[#e5a93b] transition-all hover:bg-[#e5a93b]"
                        title={`Diff ${entry.val}: ${entry.count} occurrences`}
                      />
                      <span className="text-[7.5px] text-[#94a3b8] font-bold">
                        {entry.val > 0 ? `+${entry.val}` : entry.val}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Protocol Seeds / Hex Parameters */}
          <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1 text-[8.5px]">
            {data.seedHex && (
              <div>
                <span className="text-[7.5px] text-[#64748b] uppercase block">ORIGINAL SEED (d):</span>
                <span className="text-[#94a3b8] font-mono break-all">0x{data.seedHex}</span>
              </div>
            )}
            {data.cHex && (
              <div>
                <span className="text-[7.5px] text-[#38bdf8] uppercase block">CIPHERTEXT (c):</span>
                <span className="text-[#38bdf8] font-mono break-all">0x{data.cHex}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shared Secret Established Output */}
      {data.sharedKeyHex && (
        <div className="rounded-[2px] border border-[#34d399]/40 bg-[#0c1611] p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#34d399]">
              DERIVED POST-QUANTUM SHARED SECRET KEY (K):
            </span>
            <span className="text-[8px] text-[#64748b]">256 BITS (32 BYTES)</span>
          </div>
          <div className="rounded-[2px] bg-[#090c10] p-2 border border-[#1f2937] text-[10px] text-[#34d399] font-mono font-bold break-all select-all">
            0x{data.sharedKeyHex}
          </div>
        </div>
      )}
    </div>
  );
}
