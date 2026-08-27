/**
 * EntropyAnalysisView Component
 * Cryptographic Logic Analyzer UI for Entropy & CSPRNG Tools
 * Conforms to the Hardware Instrument Design System (Obsidian Substrate, Phosphor Signals, Micro-Geometry)
 */

import React, { useState, useMemo } from 'react';
import type { ComputationStep } from '../../algorithms/types';
import { generateCsprngBytes } from '../../algorithms/tools/entropy-csprng/csprng';

interface EntropyAnalysisViewProps {
  step: ComputationStep;
  input?: string;
  onNavigateToAlgorithm?: (algoName: string, initialInput?: string) => void;
}

export const EntropyAnalysisView: React.FC<EntropyAnalysisViewProps> = ({
  step,
  onNavigateToAlgorithm,
}) => {
  const data = (step.data || {}) as Record<string, any>;
  const toolType = data.toolType || 'shannon';

  // State for live CSPRNG interactive generation inside visualizer
  const [csprngLen, setCsprngLen] = useState<number>(data.byteLength || 256);
  const [liveCsprngData, setLiveCsprngData] = useState<any>(null);

  // Active data source (either from live visualizer pulse or step payload)
  const activeCsprng = liveCsprngData || data;

  const handleGeneratePulse = (length: number) => {
    setCsprngLen(length);
    const generated = generateCsprngBytes(length);
    setLiveCsprngData({
      toolType: 'csprng',
      byteLength: generated.byteLength,
      uniqueBytes: generated.shannon.uniqueBytes,
      shannonEntropy: generated.shannon.shannonEntropy,
      maxEntropy: generated.shannon.maxEntropy,
      entropyRatioPercent: generated.shannon.entropyRatioPercent,
      chiSquareStat: generated.chiSquare.chiSquareStat,
      degreesOfFreedom: generated.chiSquare.degreesOfFreedom,
      pValue: generated.chiSquare.pValue,
      verdict: generated.chiSquare.verdict,
      verdictMessage: generated.chiSquare.verdictMessage,
      csprngHex: generated.hex,
      bitRaster: generated.bitRaster,
      histogramBins: generated.chiSquare.observedFrequencies,
      entropySource: generated.entropySource,
    });
  };

  // Hover state for 256-bin histogram
  const [hoveredBin, setHoveredBin] = useState<{ bin: number; count: number } | null>(null);

  return (
    <div className="space-y-6 font-mono text-xs text-gray-300">
      {/* ─── TOOL TYPE 1: SHANNON ENTROPY CALCULATOR ─── */}
      {toolType === 'shannon' && (
        <div className="space-y-6">
          {/* Top Telemetry Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px]">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Shannon Entropy (H)</div>
              <div className="text-2xl font-bold text-[#e5a93b] phosphor-amber tabular-nums">
                {(data.shannonEntropy ?? 0).toFixed(4)}
                <span className="text-xs text-gray-500 font-normal ml-1">/ 8.0000</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-1">bits of entropy per byte</div>
            </div>

            <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px]">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Information Density</div>
              <div className="text-2xl font-bold text-[#38bdf8] tabular-nums">
                {(data.entropyRatioPercent ?? 0).toFixed(1)}%
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                {data.theoreticalCompressionRatio ? `${data.theoreticalCompressionRatio}% compressibility` : 'Max efficiency'}
              </div>
            </div>

            <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px]">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Sample Byte Volume</div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {data.byteLength ?? 0}
                <span className="text-xs text-gray-500 font-normal ml-1">bytes</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-1">{data.totalBits ?? 0} total bits</div>
            </div>

            <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px]">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Alphabet Diversity</div>
              <div className="text-2xl font-bold text-[#34d399] tabular-nums">
                {data.uniqueBytes ?? 0}
                <span className="text-xs text-gray-500 font-normal ml-1">/ 256</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-1">distinct byte values observed</div>
            </div>
          </div>

          {/* Contextual Benchmark Gauge */}
          <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px] space-y-3">
            <div className="flex justify-between items-center text-[10px] uppercase text-gray-400 tracking-wider">
              <span>Entropy Benchmark Scale (0.0 → 8.0 bits/byte)</span>
              <span className="text-[#e5a93b] font-bold">H = {(data.shannonEntropy ?? 0).toFixed(4)}</span>
            </div>

            {/* Gauge Bar */}
            <div className="relative h-4 bg-[#090c10] border border-[#1f2937] rounded-[1px] overflow-hidden">
              {/* Reference color zones */}
              <div className="absolute inset-0 flex">
                <div className="w-[31.25%] bg-red-950/40 border-r border-[#1f2937]" title="Low Entropy (0.0-2.5)" />
                <div className="w-[25%] bg-amber-950/40 border-r border-[#1f2937]" title="Natural Language (2.5-4.5)" />
                <div className="w-[25%] bg-blue-950/40 border-r border-[#1f2937]" title="Code / Formats (4.5-6.5)" />
                <div className="w-[18.75%] bg-emerald-950/40" title="Cipher / CSPRNG (6.5-8.0)" />
              </div>
              {/* Active Marker Indicator */}
              <div
                className="absolute top-0 bottom-0 w-[3px] bg-[#e5a93b] shadow-[0_0_8px_#e5a93b] z-10 transition-all duration-300"
                style={{ left: `${Math.min(100, Math.max(0, ((data.shannonEntropy ?? 0) / 8.0) * 100))}%` }}
              />
            </div>

            {/* Scale legend */}
            <div className="grid grid-cols-4 text-[10px] text-gray-500 pt-1">
              <div>0.0: Redundant / Zeroes</div>
              <div className="text-center">~4.0 - 4.5: English Text</div>
              <div className="text-center">~5.5: Code / JSON</div>
              <div className="text-right text-[#34d399]">7.9 - 8.0: Ciphertext / CSPRNG</div>
            </div>
          </div>

          {/* Top Symbol Probability & Partial Contribution Table */}
          {data.topFrequencies && data.topFrequencies.length > 0 && (
            <div className="bg-[#0c1017] border border-[#1f2937] rounded-[2px] overflow-hidden">
              <div className="bg-[#0e131b] px-4 py-2.5 border-b border-[#1f2937] flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                  Top Symbol Frequencies & Entropy Contribution (-p log₂ p)
                </span>
                <span className="text-[10px] text-gray-500">Top {data.topFrequencies.length} Symbols</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#090c10] text-[10px] uppercase text-gray-500 border-b border-[#1f2937]">
                    <tr>
                      <th className="px-4 py-2">Symbol</th>
                      <th className="px-4 py-2">Hex</th>
                      <th className="px-4 py-2 text-right">Count</th>
                      <th className="px-4 py-2 text-right">Probability p(x)</th>
                      <th className="px-4 py-2 text-right">Partial Entropy Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f2937]/50 font-mono">
                    {data.topFrequencies.map((f: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#121824] transition-colors">
                        <td className="px-4 py-2 font-bold text-white">
                          <span className="bg-[#1e293b] px-2 py-0.5 rounded-[1px]">{f.char}</span>
                        </td>
                        <td className="px-4 py-2 text-[#38bdf8]">{f.hex}</td>
                        <td className="px-4 py-2 text-right text-gray-300 tabular-nums">{f.count}</td>
                        <td className="px-4 py-2 text-right text-gray-400 tabular-nums">
                          {(f.probability * 100).toFixed(2)}%
                        </td>
                        <td className="px-4 py-2 text-right text-[#e5a93b] tabular-nums font-bold">
                          {f.partialEntropy.toFixed(5)} bits
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TOOL TYPE 2: CHI-SQUARE DISTRIBUTION TEST ─── */}
      {toolType === 'chi-square' && (
        <div className="space-y-6">
          {/* Verdict Status Banner */}
          <div
            className={`p-4 border rounded-[2px] flex items-center justify-between ${
              data.verdict === 'uniform'
                ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-300'
                : data.verdict === 'too-flat'
                ? 'bg-purple-950/30 border-purple-800/80 text-purple-300'
                : data.verdict === 'suspect'
                ? 'bg-amber-950/30 border-amber-800/80 text-amber-300'
                : 'bg-red-950/30 border-red-800/80 text-red-300'
            }`}
          >
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-widest">
                NIST SP 800-22 Hypothesis Verdict
              </div>
              <div className="text-sm font-bold">{data.verdictMessage}</div>
            </div>
            <div className="text-right tabular-nums">
              <div className="text-[10px] text-gray-400 uppercase">p-value</div>
              <div className="text-xl font-bold font-mono">{(data.pValue ?? 0).toFixed(6)}</div>
            </div>
          </div>

          {/* Statistics Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px]">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Chi-Square (χ²)</div>
              <div className="text-2xl font-bold text-[#e5a93b] tabular-nums">
                {(data.chiSquareStat ?? 0).toFixed(2)}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">Expected: ~255.0 for uniform</div>
            </div>

            <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px]">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Degrees of Freedom (ν)</div>
              <div className="text-2xl font-bold text-white tabular-nums">{data.degreesOfFreedom ?? 255}</div>
              <div className="text-[10px] text-gray-400 mt-1">256 byte bins - 1</div>
            </div>

            <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px]">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Expected Per Bin (E)</div>
              <div className="text-2xl font-bold text-[#38bdf8] tabular-nums">
                {(data.expectedFrequency ?? 0).toFixed(2)}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">N / 256 bytes</div>
            </div>

            <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px]">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Tail Probability (p)</div>
              <div className="text-2xl font-bold text-[#34d399] tabular-nums">{(data.pValue ?? 0).toFixed(4)}</div>
              <div className="text-[10px] text-gray-400 mt-1">Acceptance: 0.01 ≤ p ≤ 0.99</div>
            </div>
          </div>

          {/* 256-Bin Interactive Byte Distribution Histogram */}
          {data.histogramBins && data.histogramBins.length === 256 && (
            <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px] space-y-3">
              <div className="flex justify-between items-center text-[10px] uppercase text-gray-400 tracking-wider">
                <span>256-Bin Byte Frequency Spectrum (0x00 → 0xFF)</span>
                {hoveredBin && (
                  <span className="text-[#38bdf8]">
                    Bin 0x{hoveredBin.bin.toString(16).padStart(2, '0').toUpperCase()} ({hoveredBin.bin}): {hoveredBin.count} hits (Expected: {data.expectedFrequency})
                  </span>
                )}
              </div>

              {/* Histogram rendering */}
              <div className="relative h-32 bg-[#090c10] border border-[#1f2937] p-2 flex items-end gap-[1px]">
                {/* Expected baseline dashed indicator */}
                {data.expectedFrequency > 0 && (
                  <div
                    className="absolute left-0 right-0 border-b border-dashed border-[#e5a93b]/70 z-10 pointer-events-none"
                    style={{
                      bottom: `${Math.min(95, Math.max(5, (data.expectedFrequency / Math.max(...data.histogramBins, 1)) * 100))}%`,
                    }}
                  />
                )}

                {/* 256 Bars */}
                {data.histogramBins.map((count: number, binIdx: number) => {
                  const maxCount = Math.max(...data.histogramBins, 1);
                  const heightPercent = Math.min(100, Math.max(2, (count / maxCount) * 100));
                  const isExpected = Math.abs(count - data.expectedFrequency) <= Math.sqrt(data.expectedFrequency || 1) * 2;

                  return (
                    <div
                      key={binIdx}
                      className={`flex-1 transition-all ${
                        isExpected ? 'bg-[#38bdf8]/80 hover:bg-[#38bdf8]' : 'bg-[#e5a93b]/90 hover:bg-[#e5a93b]'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                      onMouseEnter={() => setHoveredBin({ bin: binIdx, count })}
                      onMouseLeave={() => setHoveredBin(null)}
                    />
                  );
                })}
              </div>

              <div className="flex justify-between text-[10px] text-gray-500">
                <span>0x00 (0)</span>
                <span className="text-[#e5a93b]">--- Expected Uniform Line (E = {data.expectedFrequency})</span>
                <span>0xFF (255)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TOOL TYPE 3: CSPRNG LIVE GENERATOR ─── */}
      {toolType === 'csprng' && (
        <div className="space-y-6">
          {/* CSPRNG Control Toolbar */}
          <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Draw Cryptographic Randomness:</span>
              <div className="flex gap-1.5">
                {[16, 32, 64, 256, 1024].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleGeneratePulse(size)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded-[1px] border transition-colors ${
                      csprngLen === size
                        ? 'bg-[#e5a93b]/20 border-[#e5a93b] text-[#e5a93b]'
                        : 'bg-[#090c10] border-[#1f2937] text-gray-400 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    {size}B {size === 16 ? '(AES-128)' : size === 32 ? '(AES-256)' : ''}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleGeneratePulse(csprngLen)}
              className="px-4 py-1.5 bg-[#34d399]/20 border border-[#34d399] text-[#34d399] hover:bg-[#34d399]/30 text-xs font-bold rounded-[1px] transition-colors flex items-center gap-2"
            >
              <span>⚡ Generate CSPRNG Pulse</span>
            </button>
          </div>

          {/* Security Guarantee Note */}
          <div className="bg-[#0c1017] border border-[#1f2937] p-3 rounded-[2px] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 text-emerald-400">
              <span>🔒 Source:</span>
              <span className="text-white font-bold">{activeCsprng.entropySource || 'crypto.getRandomValues (Browser CSPRNG)'}</span>
            </div>
            <span className="text-gray-500 text-[10px]">Cryptographically Secure • Suitable for Keys, Salts & Nonces</span>
          </div>

          {/* Real-time 2D Bit Raster Matrix */}
          {activeCsprng.bitRaster && activeCsprng.bitRaster.length > 0 && (
            <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px] space-y-3">
              <div className="flex justify-between items-center text-[10px] uppercase text-gray-400 tracking-wider">
                <span>2D Bit Raster Matrix (First {Math.min(activeCsprng.bitRaster.length, 1024)} Bits)</span>
                <span className="text-[#34d399]">Bit 1 = Phosphor Emerald • Bit 0 = Substrate Dark</span>
              </div>

              <div
                className="grid gap-[1px] bg-[#1f2937] p-2 rounded-[1px]"
                style={{
                  gridTemplateColumns: `repeat(32, minmax(0, 1fr))`,
                }}
              >
                {activeCsprng.bitRaster.slice(0, 1024).map((bit: number, bitIdx: number) => (
                  <div
                    key={bitIdx}
                    className={`aspect-square transition-colors ${
                      bit === 1 ? 'bg-[#34d399] shadow-[0_0_2px_#34d399]' : 'bg-[#090c10]'
                    }`}
                    title={`Bit #${bitIdx}: ${bit}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quick Cross-Tool Transfer Actions */}
          <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Cross-Tool Statistical Analysis</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Transfer this generated stream directly into our analytical suites:</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onNavigateToAlgorithm?.('Shannon Entropy Calculator', activeCsprng.csprngHex)}
                className="px-3 py-1.5 bg-[#090c10] border border-[#1f2937] hover:border-[#38bdf8] text-[#38bdf8] text-xs rounded-[1px] transition-colors"
              >
                Inspect in Shannon Entropy →
              </button>
              <button
                type="button"
                onClick={() => onNavigateToAlgorithm?.('Chi-Square Distribution Test', activeCsprng.csprngHex)}
                className="px-3 py-1.5 bg-[#090c10] border border-[#1f2937] hover:border-[#e5a93b] text-[#e5a93b] text-xs rounded-[1px] transition-colors"
              >
                Inspect in Chi-Square Test →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOOL TYPE 4: PASSWORD STRENGTH ESTIMATOR ─── */}
      {toolType === 'password' && (
        <div className="space-y-6">
          {/* Top Strength Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px]">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Theoretical Entropy</div>
              <div className="text-2xl font-bold text-[#e5a93b] tabular-nums">
                {(data.shannonEntropy ?? 0).toFixed(1)}
                <span className="text-xs text-gray-500 font-normal ml-1">bits</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-1">H = L × log₂(|R|)</div>
            </div>

            <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px]">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Password Length</div>
              <div className="text-2xl font-bold text-white tabular-nums">{data.passwordLength ?? 0} chars</div>
              <div className="text-[10px] text-gray-400 mt-1">Pool Size |R| = {data.poolSize ?? 0}</div>
            </div>

            <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px]">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Offline GPU Crack Time</div>
              <div className="text-xl font-bold text-[#34d399] truncate tabular-nums">
                {data.crackTimes?.offlineSingleGpu || 'Instant'}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">At 100M guesses/sec</div>
            </div>

            <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px]">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Security Rating</div>
              <div
                className={`text-xl font-bold uppercase ${
                  data.strengthCategory === 'very-strong' || data.strengthCategory === 'cryptographic'
                    ? 'text-emerald-400'
                    : data.strengthCategory === 'strong'
                    ? 'text-cyan-400'
                    : data.strengthCategory === 'moderate'
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {data.strengthCategory || 'Weak'}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">Score: {data.strengthScore ?? 0}/100</div>
            </div>
          </div>

          {/* Strength Bar Gauge */}
          <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px] space-y-2">
            <div className="flex justify-between text-[10px] uppercase text-gray-400">
              <span>Entropy Strength Score ({data.strengthScore ?? 0}/100)</span>
              <span className="text-[#38bdf8] font-bold">{data.searchSpaceSize} total combinations</span>
            </div>
            <div className="w-full bg-[#090c10] h-3 border border-[#1f2937] rounded-[1px] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  (data.strengthScore ?? 0) >= 80
                    ? 'bg-emerald-500 shadow-[0_0_8px_#34d399]'
                    : (data.strengthScore ?? 0) >= 60
                    ? 'bg-cyan-500 shadow-[0_0_8px_#38bdf8]'
                    : (data.strengthScore ?? 0) >= 40
                    ? 'bg-amber-500 shadow-[0_0_8px_#e5a93b]'
                    : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, data.strengthScore ?? 0))}%` }}
              />
            </div>
          </div>

          {/* Character Pool Composition Chips */}
          {data.poolComposition && (
            <div className="bg-[#0c1017] border border-[#1f2937] p-4 rounded-[2px] space-y-3">
              <div className="text-[10px] uppercase text-gray-400 tracking-wider">Detected Character Sets</div>
              <div className="flex flex-wrap gap-2">
                {data.poolComposition.breakdown.map((item: string, idx: number) => (
                  <span key={idx} className="px-2.5 py-1 bg-[#1e293b] text-[#38bdf8] text-xs rounded-[1px] border border-[#38bdf8]/30">
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Attack Tier Breakdown Table */}
          {data.crackTimes && (
            <div className="bg-[#0c1017] border border-[#1f2937] rounded-[2px] overflow-hidden">
              <div className="bg-[#0e131b] px-4 py-2.5 border-b border-[#1f2937] text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                Brute-Force Attack Resistance by Hardware Tier
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                <div className="bg-[#090c10] p-3 border border-[#1f2937] rounded-[1px]">
                  <div className="text-[10px] text-gray-500 uppercase">Online Rate-Limited</div>
                  <div className="text-base font-bold text-white mt-1">{data.crackTimes.onlineThrottled}</div>
                  <div className="text-[10px] text-gray-500 mt-1">1,000 attempts / sec</div>
                </div>

                <div className="bg-[#090c10] p-3 border border-[#1f2937] rounded-[1px]">
                  <div className="text-[10px] text-gray-500 uppercase">Single Modern GPU</div>
                  <div className="text-base font-bold text-[#34d399] mt-1">{data.crackTimes.offlineSingleGpu}</div>
                  <div className="text-[10px] text-gray-500 mt-1">100,000,000 attempts / sec</div>
                </div>

                <div className="bg-[#090c10] p-3 border border-[#1f2937] rounded-[1px]">
                  <div className="text-[10px] text-gray-500 uppercase">Distributed GPU Cluster</div>
                  <div className="text-base font-bold text-[#e5a93b] mt-1">{data.crackTimes.offlineCluster}</div>
                  <div className="text-[10px] text-gray-500 mt-1">10,000,000,000 attempts / sec</div>
                </div>
              </div>
            </div>
          )}

          {/* NIST SP 800-63B Guidance Callout */}
          <div className="bg-[#0c1017] border-l-2 border-l-[#e5a93b] border-[#1f2937] p-4 rounded-[2px] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#e5a93b]">
              <span>ℹ️ Architectural & NIST SP 800-63B Guidance Note</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {data.nistGuidanceNotes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntropyAnalysisView;
