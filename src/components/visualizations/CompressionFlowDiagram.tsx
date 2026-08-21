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
    <div className="rounded-lg border border-gray-700/80 bg-gray-900/90 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
          Compression Round Dataflow Mechanics
        </h4>
        <span className="text-[11px] text-gray-500 font-mono">
          FIPS 180-4 Architecture
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Branch: Temp2 Computation */}
        <div className="rounded-md border border-cyan-500/20 bg-cyan-950/20 p-3 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
              Branch 1: Temp2 Computation
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              T2 = Σ₀(a) + Maj(a,b,c)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-xs">
            <div className="rounded border border-gray-700 bg-gray-800/80 p-1">
              <div className="text-[10px] text-gray-400">a</div>
              <div className="text-cyan-300 font-bold">{a?.hex?.slice(0, 6) || '...'}..</div>
            </div>
            <div className="rounded border border-gray-700 bg-gray-800/80 p-1">
              <div className="text-[10px] text-gray-400">b</div>
              <div className="text-cyan-300 font-bold">{b?.hex?.slice(0, 6) || '...'}..</div>
            </div>
            <div className="rounded border border-gray-700 bg-gray-800/80 p-1">
              <div className="text-[10px] text-gray-400">c</div>
              <div className="text-cyan-300 font-bold">{c?.hex?.slice(0, 6) || '...'}..</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="rounded border border-orange-500/30 bg-orange-950/40 p-1.5">
              <div className="text-[10px] text-orange-400 font-bold">Σ₀(a) [ROTR 2,13,22]</div>
              <div className="text-orange-200">{sigma0Hex ? `0x${sigma0Hex}` : '—'}</div>
            </div>
            <div className="rounded border border-emerald-500/30 bg-emerald-950/40 p-1.5">
              <div className="text-[10px] text-emerald-400 font-bold">Maj(a,b,c)</div>
              <div className="text-emerald-200">{majHex ? `0x${majHex}` : '—'}</div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded border border-cyan-500/40 bg-cyan-900/30 p-2 font-mono text-xs">
            <span className="font-bold text-cyan-300">Temp2 (T2)</span>
            <span className="font-bold text-cyan-200">
              {t2Hex ? `0x${t2Hex}` : '—'}
            </span>
          </div>
        </div>

        {/* Right Branch: Temp1 Computation */}
        <div className="rounded-md border border-purple-500/20 bg-purple-950/20 p-3 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
              Branch 2: Temp1 Computation
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              T1 = h + Σ₁(e) + Ch(e,f,g) + Kᵢ + Wᵢ
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 text-center font-mono text-xs">
            <div className="rounded border border-gray-700 bg-gray-800/80 p-1">
              <div className="text-[10px] text-gray-400">e</div>
              <div className="text-purple-300 font-bold">{e?.hex?.slice(0, 4) || '...'}..</div>
            </div>
            <div className="rounded border border-gray-700 bg-gray-800/80 p-1">
              <div className="text-[10px] text-gray-400">f</div>
              <div className="text-purple-300 font-bold">{f?.hex?.slice(0, 4) || '...'}..</div>
            </div>
            <div className="rounded border border-gray-700 bg-gray-800/80 p-1">
              <div className="text-[10px] text-gray-400">g</div>
              <div className="text-purple-300 font-bold">{g?.hex?.slice(0, 4) || '...'}..</div>
            </div>
            <div className="rounded border border-gray-700 bg-gray-800/80 p-1">
              <div className="text-[10px] text-gray-400">h</div>
              <div className="text-purple-300 font-bold">{h?.hex?.slice(0, 4) || '...'}..</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
            <div className="rounded border border-orange-500/30 bg-orange-950/40 p-1">
              <div className="text-[9px] text-orange-400 font-bold">Σ₁(e)</div>
              <div className="text-orange-200 truncate">{sigma1Hex ? `0x${sigma1Hex.slice(0, 4)}..` : '—'}</div>
            </div>
            <div className="rounded border border-emerald-500/30 bg-emerald-950/40 p-1">
              <div className="text-[9px] text-emerald-400 font-bold">Ch(e,f,g)</div>
              <div className="text-emerald-200 truncate">{chHex ? `0x${chHex.slice(0, 4)}..` : '—'}</div>
            </div>
            <div className="rounded border border-amber-500/30 bg-amber-950/40 p-1">
              <div className="text-[9px] text-amber-400 font-bold">Kᵢ</div>
              <div className="text-amber-200 truncate">{kHex ? `0x${kHex.slice(0, 4)}..` : '—'}</div>
            </div>
            <div className="rounded border border-blue-500/30 bg-blue-950/40 p-1">
              <div className="text-[9px] text-blue-400 font-bold">Wᵢ</div>
              <div className="text-blue-200 truncate">{wHex ? `0x${wHex.slice(0, 4)}..` : '—'}</div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded border border-purple-500/40 bg-purple-900/30 p-2 font-mono text-xs">
            <span className="font-bold text-purple-300">Temp1 (T1)</span>
            <span className="font-bold text-purple-200">
              {t1Hex ? `0x${t1Hex}` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Merged Outputs */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-800">
        <div className="flex items-center justify-between rounded border border-yellow-500/40 bg-yellow-950/30 px-3 py-2 font-mono text-xs">
          <div>
            <span className="text-yellow-400 font-bold">New a = T1 + T2</span>
            <div className="text-[10px] text-gray-400">Replaces a for next round</div>
          </div>
          <span className="text-yellow-300 font-bold text-sm">
            {newA ? `0x${newA.hex}` : '—'}
          </span>
        </div>

        <div className="flex items-center justify-between rounded border border-yellow-500/40 bg-yellow-950/30 px-3 py-2 font-mono text-xs">
          <div>
            <span className="text-yellow-400 font-bold">New e = d + T1</span>
            <div className="text-[10px] text-gray-400">Replaces e for next round</div>
          </div>
          <span className="text-yellow-300 font-bold text-sm">
            {newE ? `0x${newE.hex}` : '—'}
          </span>
        </div>
      </div>

      {/* Register Shifts */}
      <div className="mt-2 text-center text-[11px] font-mono text-gray-400 bg-gray-800/40 rounded py-1 px-2 border border-gray-800">
        <span className="text-gray-500 font-sans text-[10px] uppercase font-bold mr-2">
          Register Cascade:
        </span>
        h ← g &nbsp;·&nbsp; g ← f &nbsp;·&nbsp; f ← e &nbsp;·&nbsp; d ← c &nbsp;·&nbsp; c ← b &nbsp;·&nbsp; b ← a
      </div>
    </div>
  );
}
