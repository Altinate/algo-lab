import React from 'react';

interface VariableItem {
  label: string;
  hex: string;
  binary?: string;
}

interface Props {
  prevVariables?: VariableItem[];
  newVariables?: VariableItem[];
  t1Hex?: string;
  t2Hex?: string;
  kHex?: string;
  wHex?: string;
  sigma0Hex?: string;
  sigma1Hex?: string;
  chHex?: string;
  majHex?: string;
}

export default function CompressionFlowDiagram({
  prevVariables,
  newVariables,
  t1Hex,
  t2Hex,
  kHex,
  wHex,
  sigma0Hex,
  sigma1Hex,
  chHex,
  majHex,
}: Props) {
  const getVar = (label: string, list?: VariableItem[]) =>
    list?.find((v) => v.label.toLowerCase() === label.toLowerCase());

  const a = getVar('a', prevVariables);
  const b = getVar('b', prevVariables);
  const c = getVar('c', prevVariables);
  const d = getVar('d', prevVariables);
  const e = getVar('e', prevVariables);
  const f = getVar('f', prevVariables);
  const g = getVar('g', prevVariables);
  const h = getVar('h', prevVariables);

  const newA = getVar('a', newVariables);
  const newE = getVar('e', newVariables);

  return (
    <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2.5 font-mono">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#1f2937] pb-1 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-[#38bdf8]" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#94a3b8]">
            ALU DATAFLOW & PIPELINE GATES
          </span>
        </div>
        <span className="text-[9px] text-[#475569] uppercase tracking-wider">
          ARCH: FIPS 180-4 32-BIT
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Branch 1: Temp2 Computation */}
        <div className="rounded-[2px] border border-[#1f2937] bg-[#0e141f] p-2 space-y-1.5">
          <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
            <span className="text-[10px] font-semibold text-[#38bdf8] uppercase tracking-wider">
              BRANCH 1: T2 (ACCUMULATOR)
            </span>
            <span className="text-[9px] text-[#64748b] tabular-nums">
              T2 = Σ₀(a) + Maj(a,b,c)
            </span>
          </div>

          {/* Register Source Inset */}
          <div className="grid grid-cols-3 gap-1 text-[10px] tabular-nums">
            <div className="rounded-[2px] border border-[#1f2937] bg-[#151c28] px-1.5 py-0.5">
              <span className="text-[8px] text-[#64748b] block font-medium">REG.a</span>
              <span className="text-[#38bdf8] font-medium text-[11px]">0x{a?.hex?.slice(0, 6) || '...'}</span>
            </div>
            <div className="rounded-[2px] border border-[#1f2937] bg-[#151c28] px-1.5 py-0.5">
              <span className="text-[8px] text-[#64748b] block font-medium">REG.b</span>
              <span className="text-[#38bdf8] font-medium text-[11px]">0x{b?.hex?.slice(0, 6) || '...'}</span>
            </div>
            <div className="rounded-[2px] border border-[#1f2937] bg-[#151c28] px-1.5 py-0.5">
              <span className="text-[8px] text-[#64748b] block font-medium">REG.c</span>
              <span className="text-[#38bdf8] font-medium text-[11px]">0x{c?.hex?.slice(0, 6) || '...'}</span>
            </div>
          </div>

          {/* Sub-gate Results */}
          <div className="grid grid-cols-2 gap-1 text-[10px] tabular-nums">
            <div className="rounded-[2px] border border-[#fb923c]/20 bg-[#151217] p-1">
              <span className="text-[8px] text-[#fb923c] uppercase block font-medium">
                Σ₀(a) [ROTR 2,13,22]
              </span>
              <span className="text-[#fb923c] font-medium text-[11px]">
                {sigma0Hex ? `0x${sigma0Hex}` : '—'}
              </span>
            </div>
            <div className="rounded-[2px] border border-[#34d399]/20 bg-[#0d1614] p-1">
              <span className="text-[8px] text-[#34d399] uppercase block font-medium">
                Maj(a,b,c) [AND/XOR]
              </span>
              <span className="text-[#34d399] font-medium text-[11px]">
                {majHex ? `0x${majHex}` : '—'}
              </span>
            </div>
          </div>

          {/* Sum Result */}
          <div className="flex items-center justify-between rounded-[2px] border border-[#38bdf8]/35 bg-[#101724] px-2 py-1 text-xs">
            <span className="text-[10px] font-medium text-[#38bdf8] uppercase tracking-wider">OUT: Temp2 (T2)</span>
            <span className="font-semibold text-[#38bdf8] text-[11px] tabular-nums">
              {t2Hex ? `0x${t2Hex}` : '—'}
            </span>
          </div>
        </div>

        {/* Branch 2: Temp1 Computation */}
        <div className="rounded-[2px] border border-[#1f2937] bg-[#120e18] p-2 space-y-1.5">
          <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
            <span className="text-[10px] font-semibold text-[#c084fc] uppercase tracking-wider">
              BRANCH 2: T1 (ACCUMULATOR)
            </span>
            <span className="text-[9px] text-[#64748b] tabular-nums">
              T1 = h + Σ₁(e) + Ch + Kᵢ + Wᵢ
            </span>
          </div>

          {/* Register Source Inset */}
          <div className="grid grid-cols-4 gap-1 text-[9px] tabular-nums">
            <div className="rounded-[2px] border border-[#1f2937] bg-[#171120] p-0.5 text-center">
              <span className="text-[8px] text-[#64748b] block font-medium">REG.e</span>
              <span className="text-[#c084fc] font-medium text-[10px]">0x{e?.hex?.slice(0, 4) || '..'}</span>
            </div>
            <div className="rounded-[2px] border border-[#1f2937] bg-[#171120] p-0.5 text-center">
              <span className="text-[8px] text-[#64748b] block font-medium">REG.f</span>
              <span className="text-[#c084fc] font-medium text-[10px]">0x{f?.hex?.slice(0, 4) || '..'}</span>
            </div>
            <div className="rounded-[2px] border border-[#1f2937] bg-[#171120] p-0.5 text-center">
              <span className="text-[8px] text-[#64748b] block font-medium">REG.g</span>
              <span className="text-[#c084fc] font-medium text-[10px]">0x{g?.hex?.slice(0, 4) || '..'}</span>
            </div>
            <div className="rounded-[2px] border border-[#1f2937] bg-[#171120] p-0.5 text-center">
              <span className="text-[8px] text-[#64748b] block font-medium">REG.h</span>
              <span className="text-[#c084fc] font-medium text-[10px]">0x{h?.hex?.slice(0, 4) || '..'}</span>
            </div>
          </div>

          {/* Sub-term Inputs */}
          <div className="grid grid-cols-4 gap-1 text-[9px] tabular-nums">
            <div className="rounded-[2px] border border-[#fb923c]/20 bg-[#151217] p-0.5 text-center">
              <span className="text-[7px] text-[#fb923c] uppercase block font-medium">Σ₁(e)</span>
              <span className="text-[#fb923c] text-[10px] truncate block font-medium">{sigma1Hex ? `0x${sigma1Hex.slice(0, 4)}..` : '—'}</span>
            </div>
            <div className="rounded-[2px] border border-[#34d399]/20 bg-[#0d1614] p-0.5 text-center">
              <span className="text-[7px] text-[#34d399] uppercase block font-medium">Ch</span>
              <span className="text-[#34d399] text-[10px] truncate block font-medium">{chHex ? `0x${chHex.slice(0, 4)}..` : '—'}</span>
            </div>
            <div className="rounded-[2px] border border-[#e5a93b]/20 bg-[#15120c] p-0.5 text-center">
              <span className="text-[7px] text-[#e5a93b] uppercase block font-medium">Kᵢ</span>
              <span className="text-[#e5a93b] text-[10px] truncate block font-medium">{kHex ? `0x${kHex.slice(0, 4)}..` : '—'}</span>
            </div>
            <div className="rounded-[2px] border border-[#38bdf8]/20 bg-[#0e141d] p-0.5 text-center">
              <span className="text-[7px] text-[#38bdf8] uppercase block font-medium">Wᵢ</span>
              <span className="text-[#38bdf8] text-[10px] truncate block font-medium">{wHex ? `0x${wHex.slice(0, 4)}..` : '—'}</span>
            </div>
          </div>

          {/* Sum Result */}
          <div className="flex items-center justify-between rounded-[2px] border border-[#c084fc]/35 bg-[#171022] px-2 py-1 text-xs">
            <span className="text-[10px] font-medium text-[#c084fc] uppercase tracking-wider">OUT: Temp1 (T1)</span>
            <span className="font-semibold text-[#c084fc] text-[11px] tabular-nums">
              {t1Hex ? `0x${t1Hex}` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Bus Writeback Cycle */}
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-[#1f2937] pt-1.5">
        <div className="flex items-center justify-between rounded-[2px] border border-[#e5a93b]/35 bg-[#141009] px-2.5 py-1 text-xs">
          <div>
            <span className="text-[10px] text-[#e5a93b] font-medium uppercase tracking-wider block">
              WRITEBACK: REG.a ← T1 + T2
            </span>
            <span className="text-[8px] text-[#64748b]">NEXT CYCLE INPUT FOR REG A</span>
          </div>
          <span className="font-semibold text-[#e5a93b] tabular-nums text-xs phosphor-amber">
            {newA ? `0x${newA.hex}` : '—'}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-[2px] border border-[#e5a93b]/35 bg-[#141009] px-2.5 py-1 text-xs">
          <div>
            <span className="text-[10px] text-[#e5a93b] font-medium uppercase tracking-wider block">
              WRITEBACK: REG.e ← d + T1
            </span>
            <span className="text-[8px] text-[#64748b]">NEXT CYCLE INPUT FOR REG E</span>
          </div>
          <span className="font-semibold text-[#e5a93b] tabular-nums text-xs phosphor-amber">
            {newE ? `0x${newE.hex}` : '—'}
          </span>
        </div>
      </div>

      {/* Register Cascade Bus Line */}
      <div className="mt-1.5 text-center text-[9px] font-mono text-[#64748b] bg-[#090c10] rounded-[2px] py-0.5 border border-[#1f2937]">
        <span className="text-[#475569] uppercase font-medium mr-1.5">
          CASCADE BUS:
        </span>
        h ← g &nbsp;·&nbsp; g ← f &nbsp;·&nbsp; f ← e &nbsp;·&nbsp; d ← c &nbsp;·&nbsp; c ← b &nbsp;·&nbsp; b ← a
      </div>
    </div>
  );
}
