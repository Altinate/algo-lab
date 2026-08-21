import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
}

/** Visualizes binary/hex transformations like padding, encoding, block splitting */
export default function BinaryTransformView({ step }: Props) {
  const data = step.data;

  // Input encoding step
  if (data.binary && data.hex && data.bytes) {
    return (
      <div className="space-y-4">
        {data.input != null && (
          <DataRow label="Input" value={String(data.input)} type="text" />
        )}
        <DataRow label="Hex" value={String(data.hex)} type="hex" />
        <DataRow label="Binary" value={String(data.binary)} type="binary" />
        {data.bitLength !== undefined && (
          <DataRow label="Bit length" value={`${data.bitLength} bits`} type="text" />
        )}
      </div>
    );
  }

  // Padding step
  if (data.paddedHex || data.paddedBinary) {
    return (
      <div className="space-y-4">
        <DataRow label="Original bits" value={`${data.originalBits}`} type="text" />
        {data.paddingByte != null && (
          <DataRow label="Padding byte" value={String(data.paddingByte)} type="binary" />
        )}
        <DataRow label="Zero padding" value={`${data.zeroPaddingBytes} bytes`} type="text" />
        {data.lengthField != null && (
          <DataRow label="Length field" value={String(data.lengthField)} type="hex" />
        )}
        <DataRow label="Padded message (hex)" value={String(data.paddedHex)} type="hex" />
        <DataRow
          label="Total"
          value={`${data.totalBits} bits (${data.totalBlocks} block${Number(data.totalBlocks) > 1 ? 's' : ''})`}
          type="text"
        />
      </div>
    );
  }

  // Message block step (words display)
  if (data.words && Array.isArray(data.words)) {
    return (
      <div className="space-y-2">
        <div className="grid gap-1">
          {(data.words as Array<{ index: number; hex: string; binary?: string }>).map(
            (word) => (
              <div
                key={word.index}
                className="flex items-center gap-3 font-mono text-xs"
              >
                <span className="w-10 shrink-0 text-gray-500">
                  W[{word.index}]
                </span>
                <span className="text-cyan-400">{word.hex}</span>
                {word.binary && (
                  <span className="hidden xl:inline text-gray-600">
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

  // Fallback: render all data as key-value pairs
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
      ? 'text-cyan-400'
      : type === 'binary'
        ? 'text-amber-400'
        : 'text-gray-300';

  return (
    <div className="space-y-1">
      <span className="text-xs uppercase tracking-wider text-gray-500">
        {label}
      </span>
      <p
        className={`font-mono text-sm break-all leading-relaxed ${colorClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function FallbackDataView({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="space-y-0.5">
          <span className="text-xs uppercase tracking-wider text-gray-500">
            {key}
          </span>
          <p className="font-mono text-sm text-gray-300 break-all">
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </p>
        </div>
      ))}
    </div>
  );
}
