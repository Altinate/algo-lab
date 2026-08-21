import React from 'react';
import { formatBinaryGroups } from '../../algorithms/utils';

interface Props {
  label: string;
  binary: string;
  hex?: string;
  opType?: 'input' | 'rot' | 'shr' | 'xor' | 'and' | 'not' | 'add' | 'result';
  tag?: string;
  isResult?: boolean;
}

const opColors = {
  input: 'text-cyan-300 border-cyan-500/30 bg-cyan-950/30',
  rot: 'text-orange-300 border-orange-500/30 bg-orange-950/30',
  shr: 'text-rose-300 border-rose-500/30 bg-rose-950/30',
  xor: 'text-emerald-300 border-emerald-500/30 bg-emerald-950/30',
  and: 'text-blue-300 border-blue-500/30 bg-blue-950/30',
  not: 'text-purple-300 border-purple-500/30 bg-purple-950/30',
  add: 'text-amber-300 border-amber-500/30 bg-amber-950/30',
  result: 'text-yellow-300 border-yellow-500/40 bg-yellow-950/40 font-semibold',
};

const tagBadges = {
  input: 'bg-cyan-500/20 text-cyan-400',
  rot: 'bg-orange-500/20 text-orange-400',
  shr: 'bg-rose-500/20 text-rose-400',
  xor: 'bg-emerald-500/20 text-emerald-400',
  and: 'bg-blue-500/20 text-blue-400',
  not: 'bg-purple-500/20 text-purple-400',
  add: 'bg-amber-500/20 text-amber-400',
  result: 'bg-yellow-500/20 text-yellow-300',
};

export default function BitwiseOperationRow({
  label,
  binary,
  hex,
  opType = 'input',
  tag,
  isResult = false,
}: Props) {
  const cleanBinary = binary.replace(/\s+/g, '');
  const formattedBinary = formatBinaryGroups(cleanBinary, 8);

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 rounded px-2.5 py-1.5 font-mono text-xs border ${
        opColors[opType]
      } ${isResult ? 'border-b-2 shadow-sm' : ''}`}
    >
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-medium text-gray-400 min-w-[70px]">{label}</span>
        {tag && (
          <span
            className={`rounded px-1.5 py-0.2 text-[10px] uppercase font-bold tracking-wider ${
              tagBadges[opType]
            }`}
          >
            {tag}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 overflow-x-auto">
        <span className="tracking-widest text-[11px] font-mono select-all">
          {formattedBinary}
        </span>
        {hex && (
          <span className="text-[11px] text-gray-400 shrink-0 font-bold">
            0x{hex}
          </span>
        )}
      </div>
    </div>
  );
}
