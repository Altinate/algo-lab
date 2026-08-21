import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
}

/** Visualizes XOR / polynomial operations for CRC32 */
export default function XorTableView({ step }: Props) {
  const data = step.data;

  const byteValue = data.byte as number | undefined;
  const byteChar = data.char as string | undefined;
  const byteIndex = data.byteIndex as number | undefined;
  const prevCrc = data.prevCrc as string | undefined;
  const tableIndex = data.tableIndex as string | undefined;
  const tableValue = data.tableValue as string | undefined;
  const newCrc = data.newCrc as string | undefined;
  const xorInput = data.xorInput as string | undefined;

  return (
    <div className="space-y-3">
      {byteIndex !== undefined && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">Byte {byteIndex}:</span>
          {byteChar && (
            <span className="rounded bg-gray-700 px-2 py-0.5 font-mono text-white">
              '{byteChar}'
            </span>
          )}
          {byteValue !== undefined && (
            <span className="font-mono text-cyan-400">
              0x{byteValue.toString(16).padStart(2, '0')}
            </span>
          )}
        </div>
      )}

      <div className="grid gap-1 font-mono text-xs">
        {prevCrc && (
          <div className="flex items-center gap-2">
            <span className="w-28 text-gray-500">Previous CRC</span>
            <span className="text-gray-400">{prevCrc}</span>
          </div>
        )}
        {xorInput && (
          <div className="flex items-center gap-2">
            <span className="w-28 text-gray-500">XOR input</span>
            <span className="text-amber-400">{xorInput}</span>
          </div>
        )}
        {tableIndex && (
          <div className="flex items-center gap-2">
            <span className="w-28 text-gray-500">Table index</span>
            <span className="text-purple-400">{tableIndex}</span>
          </div>
        )}
        {tableValue && (
          <div className="flex items-center gap-2">
            <span className="w-28 text-gray-500">Table value</span>
            <span className="text-purple-400">{tableValue}</span>
          </div>
        )}
        {newCrc && (
          <div className="flex items-center gap-2">
            <span className="w-28 text-gray-500">New CRC</span>
            <span className="text-green-400 font-semibold">{newCrc}</span>
          </div>
        )}
      </div>
    </div>
  );
}
