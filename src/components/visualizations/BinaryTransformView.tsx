import React from 'react';
import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
}

/** Visualizes binary/hex transformations like padding, encoding, block splitting */
export default function BinaryTransformView({ step }: Props) {
  const data = step.data;

  // Input encoding step
  if (data.bytes !== undefined || (data.binary !== undefined && data.hex !== undefined)) {
    const rawHex = String(data.hex ?? '');
    const rawBinary = String(data.binary ?? '');
    const bitLen = data.bitLength !== undefined ? Number(data.bitLength) : 0;

    return (
      <div className="space-y-2.5 rounded-[2px] bg-[#0c1017] p-3 border border-[#1f2937] font-mono">
        <DataRow label="INPUT STREAM (ASCII/UTF-8)" value={String(data.input ?? '') || '(EMPTY STREAM)'} type="text" />
        <DataRow label="HEXADECIMAL BYTES" value={rawHex || '(0 BYTES)'} type="hex" />
        <DataRow label="BINARY BITSTREAM" value={rawBinary || '(0 BITS)'} type="binary" />
        <DataRow label="STREAM BIT LENGTH" value={`${bitLen} BITS (${Math.ceil(bitLen / 8)} BYTES)`} type="text" />
      </div>
    );
  }

  // Padding step
  if (data.paddedHex !== undefined || data.paddedBinary !== undefined) {
    return (
      <div className="space-y-2.5 rounded-[2px] bg-[#0c1017] p-3 border border-[#1f2937] font-mono">
        <DataRow label="ORIGINAL BIT LENGTH (L)" value={`${data.originalBits ?? 0} BITS`} type="text" />
        {data.paddingByte != null && (
          <DataRow label="PADDING DELIMITER (1-BIT + 7-ZEROS)" value={String(data.paddingByte)} type="binary" />
        )}
        <DataRow label="ZERO FILL BYTES (K)" value={`${data.zeroPaddingBytes ?? 0} BYTES (0x00)`} type="text" />
        {data.lengthField != null && (
          <DataRow label="LENGTH FIELD (64-BIT BIG-ENDIAN)" value={`0x${data.lengthField}`} type="hex" />
        )}
        <DataRow label="PADDED BUFFER" value={String(data.paddedHex ?? '')} type="hex" />
        <DataRow
          label="TOTAL BUFFER CAPACITY"
          value={`${data.totalBits ?? 0} BITS (${data.totalBlocks ?? 1} BLOCK${Number(data.totalBlocks) > 1 ? 'S' : ''} OF 512 BITS)`}
          type="text"
        />
      </div>
    );
  }

  // Message block step (words display)
  if (data.words && Array.isArray(data.words)) {
    return (
      <div className="space-y-2 rounded-[2px] bg-[#0c1017] p-3 border border-[#1f2937] font-mono">
        <div className="flex items-center justify-between pb-1 border-b border-[#1f2937]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">
            512-BIT BLOCK BUFFER: 16 32-BIT WORDS
          </span>
          <span className="text-[9px] text-[#475569] uppercase">BIG-ENDIAN PARSE</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 tabular-nums">
          {(data.words as Array<{ index: number; hex: string; binary?: string }>).map(
            (word) => (
              <div
                key={word.index}
                className="flex items-center justify-between rounded-[2px] bg-[#0e131b] px-2.5 py-1 text-xs border border-[#1f2937]"
              >
                <span className="text-[10px] text-[#64748b] font-bold">
                  W[{word.index.toString().padStart(2, '0')}]
                </span>
                <span className="text-[#38bdf8] font-bold">0x{word.hex}</span>
                {word.binary && (
                  <span className="hidden xl:inline text-[#475569] text-[9px]">
                    {word.binary}
                  </span>
                )}
              </div>
            ),
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return <FallbackDataView data={data} />;
}

function DataRow({
  label,
  value,
  type,
}: {
  label: string;
  value: string;
  type: 'hex' | 'binary' | 'text';
}) {
  const colorClass =
    type === 'hex'
      ? 'text-[#38bdf8] bg-[#0e141f] border-[#38bdf8]/30'
      : type === 'binary'
        ? 'text-[#34d399] bg-[#0c1813] border-[#34d399]/30'
        : 'text-[#f8fafc] bg-[#0e131b] border-[#1f2937]';

  return (
    <div className="space-y-0.5">
      <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748b]">
        {label}
      </span>
      <div
        className={`rounded-[2px] border px-2.5 py-1 text-xs break-all leading-relaxed tabular-nums select-all ${colorClass}`}
      >
        {value}
      </div>
    </div>
  );
}

function FallbackDataView({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-1.5 rounded-[2px] bg-[#0c1017] p-3 border border-[#1f2937] font-mono">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="space-y-0.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748b]">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </span>
          <div className="rounded-[2px] bg-[#0e131b] p-1.5 text-xs text-[#cbd5e1] break-all border border-[#1f2937] tabular-nums">
            {typeof value === 'object' && value !== null
              ? Array.isArray(value)
                ? `${value.length} items`
                : Object.entries(value).map(([k, v]) => `${k}: ${String(v)}`).join(' | ')
              : String(value)}
          </div>
        </div>
      ))}
    </div>
  );
}
