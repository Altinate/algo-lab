import React from 'react';
import { formatBinaryGroups } from '../../algorithms/utils';

interface Props {
  label: string;
  binary?: string;
  hex?: string;
  opType?: 'input' | 'rot' | 'shr' | 'xor' | 'and' | 'not' | 'add' | 'result';
  tag?: string;
  isResult?: boolean;
}

const opStyles = {
  input: {
    bg: 'bg-[#0e131b]',
    border: 'border-[#1f2937]',
    tag: 'bg-[#1e293b] text-[#38bdf8] border-[#38bdf8]/30',
    hex: 'text-[#38bdf8]',
    bin: 'text-[#cbd5e1]',
  },
  rot: {
    bg: 'bg-[#121016]',
    border: 'border-[#fb923c]/25',
    tag: 'bg-[#fb923c]/15 text-[#fb923c] border-[#fb923c]/35',
    hex: 'text-[#fb923c]',
    bin: 'text-[#cbd5e1]',
  },
  shr: {
    bg: 'bg-[#140e12]',
    border: 'border-[#f43f5e]/25',
    tag: 'bg-[#f43f5e]/15 text-[#f43f5e] border-[#f43f5e]/35',
    hex: 'text-[#f43f5e]',
    bin: 'text-[#cbd5e1]',
  },
  xor: {
    bg: 'bg-[#0d1614]',
    border: 'border-[#34d399]/25',
    tag: 'bg-[#34d399]/15 text-[#34d399] border-[#34d399]/35',
    hex: 'text-[#34d399]',
    bin: 'text-[#34d399]',
  },
  and: {
    bg: 'bg-[#0e141d]',
    border: 'border-[#38bdf8]/25',
    tag: 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/35',
    hex: 'text-[#38bdf8]',
    bin: 'text-[#cbd5e1]',
  },
  not: {
    bg: 'bg-[#130f1a]',
    border: 'border-[#c084fc]/25',
    tag: 'bg-[#c084fc]/15 text-[#c084fc] border-[#c084fc]/35',
    hex: 'text-[#c084fc]',
    bin: 'text-[#cbd5e1]',
  },
  add: {
    bg: 'bg-[#13110d]',
    border: 'border-[#e5a93b]/20',
    tag: 'bg-[#e5a93b]/15 text-[#e5a93b] border-[#e5a93b]/35',
    hex: 'text-[#e5a93b]',
    bin: 'text-[#cbd5e1]',
  },
  result: {
    bg: 'bg-[#15120c]',
    border: 'border-[#e5a93b]/50',
    tag: 'bg-[#e5a93b]/20 text-[#e5a93b] border-[#e5a93b] phosphor-amber',
    hex: 'text-[#e5a93b] font-semibold phosphor-amber',
    bin: 'text-[#f8fafc] font-medium',
  },
};

export default function BitwiseOperationRow({
  label,
  binary,
  hex,
  opType = 'input',
  tag,
  isResult = false,
}: Props) {
  const cleanBinary = binary ? binary.replace(/\s+/g, '') : '';
  const formattedBinary = cleanBinary ? formatBinaryGroups(cleanBinary, 8) : '';
  const st = opStyles[opType] || opStyles.input;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2.5 rounded-[2px] px-2 py-0.5 font-mono text-[11px] border tabular-nums ${
        st.bg
      } ${st.border} ${isResult ? 'border-b-2' : ''}`}
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider min-w-[70px]">
          {label}
        </span>
        {tag && (
          <span
            className={`rounded-[2px] px-1 py-0.1 text-[9px] font-mono font-medium tracking-tight border ${st.tag}`}
          >
            {tag}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto">
        <span className={`tracking-widest tabular-nums select-all text-[11px] font-mono ${st.bin}`}>
          {formattedBinary}
        </span>
        {hex && (
          <span className={`tabular-nums shrink-0 font-medium text-[11px] ${st.hex}`}>
            0x{hex}
          </span>
        )}
      </div>
    </div>
  );
}
