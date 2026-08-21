import React from 'react';
import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
}

/** Visualizes binary/hex transformations like padding, encoding, block splitting */
export default function BinaryTransformView({ step }: Props) {
  const data = step.data;

  // Input encoding step (check presence explicitly so empty strings don't fail)
  if (data.bytes !== undefined || (data.binary !== undefined && data.hex !== undefined)) {
    const rawHex = String(data.hex ?? '');
    const rawBinary = String(data.binary ?? '');
    const bitLen = data.bitLength !== undefined ? Number(data.bitLength) : 0;

    return (
      <div className="space-y-4 rounded-lg bg-gray-900/50 p-4 border border-gray-800">
        <DataRow label="Input Text" value={String(data.input ?? '') || '(empty string)'} type="text" />
        <DataRow label="Hexadecimal (UTF-8 Bytes)" value={rawHex || '(empty - 0 bytes)'} type="hex" />
        <DataRow label="Binary Representation" value={rawBinary || '(empty - 0 bits)'} type="binary" />
        <DataRow label="Bit Length" value={`${bitLen} bits (${Math.ceil(bitLen / 8)} bytes)`} type="text" />
      </div>
    );
  }

  // Padding step
  if (data.paddedHex !== undefined || data.paddedBinary !== undefined) {
    return (
      <div className="space-y-4 rounded-lg bg-gray-900/50 p-4 border border-gray-800">
        <DataRow label="Original Message Length" value={`${data.originalBits ?? 0} bits`} type="text" />
        {data.paddingByte != null && (
          <DataRow label="Padding Start Byte" value={String(data.paddingByte)} type="binary" />
        )}
        <DataRow label="Zero Padding" value={`${data.zeroPaddingBytes ?? 0} bytes of 0x00`} type="text" />
        {data.lengthField != null && (
          <DataRow label="Length Field (Big-Endian)" value={`0x${data.lengthField}`} type="hex" />
        )}
        <DataRow label="Full Padded Message (Hex)" value={String(data.paddedHex ?? '')} type="hex" />
        <DataRow
          label="Total Padded Size"
          value={`${data.totalBits ?? 0} bits (${data.totalBlocks ?? 1} block${Number(data.totalBlocks) > 1 ? 's' : ''} of 512 bits)`}
          type="text"
        />
      </div>
    );
  }

  // Message block step (words display)
  if (data.words && Array.isArray(data.words)) {
    return (
      <div className="space-y-3 rounded-lg bg-gray-900/50 p-4 border border-gray-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
          Block Words (16 32-bit Words)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {(data.words as Array<{ index: number; hex: string; binary?: string }>).map(
            (word) => (
              <div
                key={word.index}
                className="flex items-center justify-between rounded bg-gray-800/80 px-3 py-1.5 font-mono text-xs border border-gray-700/60"
              >
                <span className="w-12 shrink-0 font-bold text-gray-400">
                  W[{word.index.toString().padStart(2, '0')}]
                </span>
                <span className="text-cyan-300 font-bold">0x{word.hex}</span>
                {word.binary && (
                  <span className="hidden xl:inline text-gray-500 text-[10px]">
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

  // Fallback: structured key-value rendering
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
      ? 'text-cyan-300 bg-cyan-950/20 border-cyan-500/30'
      : type === 'binary'
        ? 'text-amber-300 bg-amber-950/20 border-amber-500/30'
        : 'text-gray-200 bg-gray-800/40 border-gray-700';

  return (
    <div className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <div
        className={`rounded-md border p-2.5 font-mono text-xs sm:text-sm break-all leading-relaxed ${colorClass}`}
      >
        {value}
      </div>
    </div>
  );
}

function FallbackDataView({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-2 rounded-lg bg-gray-900/50 p-4 border border-gray-800">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </span>
          <div className="rounded bg-gray-800/80 p-2 font-mono text-xs text-gray-300 break-all border border-gray-700">
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
