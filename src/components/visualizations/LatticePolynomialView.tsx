import React, { useState } from 'react';
import type { ComputationStep } from '../../algorithms/types';

interface LatticePolynomialViewProps {
  step: ComputationStep;
}

export default function LatticePolynomialView({ step }: LatticePolynomialViewProps) {
  const [selectedCoeff, setSelectedCoeff] = useState<{ index: number; val: number } | null>(null);

  const data = step.data as {
    stageName?: string;
    subTitle?: string;
    pipelineStage?: 'KeyGen' | 'Encapsulation' | 'Decapsulation';
    kRank?: number;
    k?: number;
    l?: number;
    matrixDims?: string;
    seedHex?: string;
    rhoHex?: string;
    sigmaHex?: string;
    polynomialSpectrum?: number[];
    polynomialCoeffs?: number[];
    polyLabel?: string;
    noiseEta?: number;
    gamma1?: number;
    gamma2?: number;
    matrixSampleA?: number[][];
    noiseHistogram?: number[] | Record<number, number>;
    nttStages?: Array<{ stage: number; subLength?: number; len?: number }>;
    normStats?: {
      zNorm?: number;
      zBound?: number;
      r0Norm?: number;
      r0Bound?: number;
      ct0Norm?: number;
      ct0Bound?: number;
      hintCount?: number;
      hintBound?: number;
      attempts?: number;
      accepted?: boolean;
    };
    ekHex?: string;
    cHex?: string;
    sharedKeyHex?: string;
    signatureHex?: string;
    decapsMatched?: boolean;
    verified?: boolean;
  };

  const spectrum = data.polynomialSpectrum || data.polynomialCoeffs || [];
  
  // Format noise histogram entries
  let histEntries: Array<{ val: number; count: number }> = [];
  if (Array.isArray(data.noiseHistogram)) {
    const eta = data.noiseEta || 2;
    histEntries = data.noiseHistogram.map((count, idx) => ({
      val: idx - eta,
      count,
    }));
  } else if (data.noiseHistogram && typeof data.noiseHistogram === 'object') {
    histEntries = Object.entries(data.noiseHistogram).map(([k, v]) => ({
      val: parseInt(k, 10),
      count: v,
    })).sort((a, b) => a.val - b.val);
  }

  const maxHistCount = Math.max(...histEntries.map((e) => e.count), 1);
  const isMlDsa = !!data.normStats || !!data.signatureHex || (data.l !== undefined && data.l !== data.k);
  const ringText = isMlDsa ? 'ℤ₈₃₈₀₄₁₇[X] / (X²⁵⁶ + 1)' : 'ℤ₃₃₂₉[X] / (X²⁵⁶ + 1)';

  return (
    <div className="space-y-3 font-mono">
      {/* Telemetry Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f2937] pb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#38bdf8] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">
            LATTICE LOGIC ANALYZER ({isMlDsa ? 'NIST FIPS 204 ML-DSA' : 'NIST FIPS 203 ML-KEM'})
          </span>
          {(data.kRank || data.k) && (
            <span className="rounded-[2px] bg-[#0c1824] px-2 py-0.5 text-[9px] font-semibold text-[#38bdf8] border border-[#38bdf8]/30">
              MODULE {data.l ? `k=${data.k}, l=${data.l}` : `k=${data.kRank || data.k}`}
            </span>
          )}
          {data.stageName && (
            <span className="rounded-[2px] bg-[#1a1224] px-2 py-0.5 text-[9px] font-bold text-[#c084fc] border border-[#c084fc]/40">
              STAGE: {data.stageName.toUpperCase()}
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
          {data.verified !== undefined && (
            <span
              className={`rounded-[2px] px-2 py-0.5 text-[9px] font-bold border tabular-nums ${
                data.verified
                  ? 'bg-[#132a1e] text-[#34d399] border-[#34d399]/40 phosphor-emerald'
                  : 'bg-[#2a1318] text-[#f87171] border-[#f87171]/40'
              }`}
            >
              {data.verified ? '✓ SIGNATURE VERIFIED (VALID)' : '✗ SIGNATURE REJECTED (INVALID)'}
            </span>
          )}
        </div>

        <span className="text-[9px] text-[#64748b]">
          RING: {ringText}
        </span>
      </div>

      {/* Module-level Flow Pipeline Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5 text-[8.5px]">
        {[
          { label: '1. SEED EXPANSION', desc: isMlDsa ? 'SHAKE256(ξ, k, l)' : 'SHA3-512 (ρ, σ)', active: step.phase === 'SEED EXPANSION' || data.pipelineStage === 'KeyGen' },
          { label: '2. LATTICE MATRIX', desc: isMlDsa ? 'ExpandA (SHAKE128)' : 'SampleNTT(Â)', active: step.phase === 'MATRIX GENERATION' },
          { label: '3. NOISE / MASK', desc: isMlDsa ? 'ExpandS / ExpandMask' : 'CBD(η₁, η₂)', active: step.phase === 'SECRET SAMPLING' || histEntries.length > 0 },
          { label: '4. NTT ALGEBRA', desc: isMlDsa ? 'Â·ŷ mod q' : 'Â·ŝ + ê mod q', active: !!data.nttStages || step.phase === 'ROUNDING' },
          { label: isMlDsa ? '5. REJECTION / SIG' : '5. KEM DERIVATION', desc: isMlDsa ? '||z||_∞ bound check' : 'Shared Key (K)', active: !!data.normStats || !!data.sharedKeyHex || !!data.signatureHex },
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
              {data.polyLabel || `POLYNOMIAL COEFFICIENT SPECTRUM (n=256, ${ringText})`}
            </span>
            <span className="text-[8px] text-[#64748b]">
              {selectedCoeff ? `COEFF [${selectedCoeff.index}]: ${selectedCoeff.val}` : 'HOVER CELL'}
            </span>
          </div>

          {/* 16x16 Heatmap Grid */}
          <div className="grid grid-cols-16 gap-[2px] p-1 bg-[#090c10] rounded-[2px] border border-[#1f2937]/60">
            {spectrum.length === 256 ? (
              spectrum.map((val, idx) => {
                let colorClass = 'bg-[#151c28] text-[#64748b]';
                const modulus = isMlDsa ? 8380417 : 3329;
                const normVal = val > modulus / 2 ? modulus - val : val;
                
                if (normVal === 0) colorClass = 'bg-[#151c28] text-[#64748b]';
                else if (normVal < (isMlDsa ? 10000 : 500)) colorClass = 'bg-[#0f2e22] text-[#34d399] border border-[#34d399]/40';
                else if (normVal < (isMlDsa ? 200000 : 1800)) colorClass = 'bg-[#0e2738] text-[#38bdf8] border border-[#38bdf8]/40';
                else colorClass = 'bg-[#33220f] text-[#e5a93b] border border-[#e5a93b]/40';

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setSelectedCoeff({ index: idx, val })}
                    className={`h-3.5 flex items-center justify-center text-[7px] font-bold cursor-pointer transition-all rounded-[1px] hover:scale-125 hover:z-10 ${colorClass}`}
                    title={`Index ${idx}: value = ${val}`}
                  >
                    {val > 999999 ? `${Math.floor(val / 1000000)}M` : val > 999 ? `${Math.floor(val / 1000)}k` : val}
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
              <span className="h-2 w-2 rounded-[1px] bg-[#0f2e22]" /> Short / Noise
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-[1px] bg-[#0e2738]" /> Mid Range
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-[1px] bg-[#33220f]" /> High (Upper q)
            </div>
          </div>
        </div>

        {/* Right Column: Rejection Sampling Norms / NTT Butterfly Stages (5 cols) */}
        <div className="space-y-2 md:col-span-5">
          {/* ML-DSA Rejection Sampling & Infinity Norm Telemetry */}
          {data.normStats && (
            <div className="rounded-[2px] border border-[#38bdf8]/40 bg-[#0c1824] p-2 space-y-2">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
                <span className="text-[9px] font-bold uppercase text-[#38bdf8]">
                  REJECTION SAMPLING & BOUNDS CHECK
                </span>
                {data.normStats.attempts && (
                  <span className="text-[8px] text-[#e5a93b] font-bold">
                    ITERATION #{data.normStats.attempts}
                  </span>
                )}
              </div>

              {/* ||z||_∞ check */}
              {data.normStats.zNorm !== undefined && data.normStats.zBound !== undefined && (
                <div className="space-y-0.5 text-[8px]">
                  <div className="flex justify-between text-[#94a3b8]">
                    <span>||z||_∞ (Mask + Challenge Vector):</span>
                    <span className={data.normStats.zNorm < data.normStats.zBound ? 'text-[#34d399] font-bold' : 'text-[#f87171] font-bold'}>
                      {data.normStats.zNorm} / {data.normStats.zBound} ({data.normStats.zNorm < data.normStats.zBound ? 'PASS' : 'FAIL'})
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-[1px] bg-[#1f2937] overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.round((data.normStats.zNorm / data.normStats.zBound) * 100))}%` }}
                      className={`h-full ${data.normStats.zNorm < data.normStats.zBound ? 'bg-[#34d399]' : 'bg-[#f87171]'}`}
                    />
                  </div>
                </div>
              )}

              {/* ||r0||_∞ check */}
              {data.normStats.r0Norm !== undefined && data.normStats.r0Bound !== undefined && (
                <div className="space-y-0.5 text-[8px]">
                  <div className="flex justify-between text-[#94a3b8]">
                    <span>||r₀||_∞ (Low-Bits Rounding Vector):</span>
                    <span className={data.normStats.r0Norm < data.normStats.r0Bound ? 'text-[#34d399] font-bold' : 'text-[#f87171] font-bold'}>
                      {data.normStats.r0Norm} / {data.normStats.r0Bound} ({data.normStats.r0Norm < data.normStats.r0Bound ? 'PASS' : 'FAIL'})
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-[1px] bg-[#1f2937] overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.round((data.normStats.r0Norm / data.normStats.r0Bound) * 100))}%` }}
                      className={`h-full ${data.normStats.r0Norm < data.normStats.r0Bound ? 'bg-[#34d399]' : 'bg-[#f87171]'}`}
                    />
                  </div>
                </div>
              )}

              {/* Hint Count check */}
              {data.normStats.hintCount !== undefined && data.normStats.hintBound !== undefined && (
                <div className="space-y-0.5 text-[8px]">
                  <div className="flex justify-between text-[#94a3b8]">
                    <span>HINT WEIGHT (# of 1s in h):</span>
                    <span className={data.normStats.hintCount <= data.normStats.hintBound ? 'text-[#38bdf8] font-bold' : 'text-[#f87171] font-bold'}>
                      {data.normStats.hintCount} / {data.normStats.hintBound} ({data.normStats.hintCount <= data.normStats.hintBound ? 'PASS' : 'FAIL'})
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-[1px] bg-[#1f2937] overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.round((data.normStats.hintCount / data.normStats.hintBound) * 100))}%` }}
                      className={`h-full ${data.normStats.hintCount <= data.normStats.hintBound ? 'bg-[#38bdf8]' : 'bg-[#f87171]'}`}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Noise Distribution Histogram */}
          {histEntries.length > 0 && (
            <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1.5">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
                <span className="text-[9px] font-bold uppercase text-[#e5a93b]">
                  BOUNDED NOISE DISTRIBUTION ([-η, η])
                </span>
                <span className="text-[7.5px] text-[#64748b]">η = {data.noiseEta || 2}</span>
              </div>
              <div className="flex items-end justify-center gap-1.5 h-16 pt-2">
                {histEntries.map((entry) => {
                  const heightPercent = Math.round((entry.count / maxHistCount) * 100);
                  return (
                    <div key={entry.val} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-[1px] bg-[#e5a93b]/70 border border-[#e5a93b] transition-all hover:bg-[#e5a93b]"
                        title={`Value ${entry.val}: ${entry.count} occurrences`}
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

          {/* Protocol Outputs */}
          <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1 text-[8.5px]">
            {data.seedHex && (
              <div>
                <span className="text-[7.5px] text-[#64748b] uppercase block">SEED (ξ / d):</span>
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

      {/* Signature / Shared Key Output */}
      {data.signatureHex && (
        <div className="rounded-[2px] border border-[#c084fc]/40 bg-[#160f24] p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#c084fc]">
              POST-QUANTUM DIGITAL SIGNATURE (σ = c̃ || z || h):
            </span>
            <span className="text-[8px] text-[#64748b]">{data.signatureHex.length / 2} BYTES</span>
          </div>
          <div className="rounded-[2px] bg-[#090c10] p-2 border border-[#1f2937] text-[10px] text-[#c084fc] font-mono font-bold break-all select-all max-h-24 overflow-y-auto">
            0x{data.signatureHex}
          </div>
        </div>
      )}

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
