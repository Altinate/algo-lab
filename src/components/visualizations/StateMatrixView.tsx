import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
}

/** Visualizes a 5×5 state matrix for Keccak/SHA-3 algorithms */
export default function StateMatrixView({ step }: Props) {
  const data = step.data;
  const stateMatrix = data.stateMatrix as string[][] | undefined;
  const prevStateMatrix = data.prevStateMatrix as string[][] | undefined;
  const roundIndex = data.roundIndex as number | undefined;
  const subStep = data.subStep as string | undefined;

  if (!stateMatrix) {
    return (
      <div className="text-sm text-gray-400">
        <pre className="overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {roundIndex !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Round {roundIndex}</span>
          {subStep && (
            <span className="rounded bg-purple-600/20 px-2 py-0.5 text-xs font-medium text-purple-400 border border-purple-500/30">
              {subStep}
            </span>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {prevStateMatrix && (
          <div>
            <h4 className="mb-2 text-xs uppercase tracking-wider text-gray-500">
              Before
            </h4>
            <StateGrid matrix={prevStateMatrix} />
          </div>
        )}
        <div>
          <h4 className="mb-2 text-xs uppercase tracking-wider text-gray-500">
            {prevStateMatrix ? 'After' : 'State'}
          </h4>
          <StateGrid
            matrix={stateMatrix}
            prevMatrix={prevStateMatrix}
          />
        </div>
      </div>
    </div>
  );
}

function StateGrid({
  matrix,
  prevMatrix,
}: {
  matrix: string[][];
  prevMatrix?: string[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <tbody>
          {matrix.map((row, y) => (
            <tr key={y}>
              {row.map((cell, x) => {
                const changed = prevMatrix
                  ? prevMatrix[y]?.[x] !== cell
                  : false;
                return (
                  <td
                    key={x}
                    className={`border border-gray-700 px-1.5 py-1 font-mono text-[10px] ${
                      changed
                        ? 'bg-yellow-500/10 text-yellow-300'
                        : 'text-cyan-400'
                    }`}
                  >
                    {cell.length > 8 ? cell.slice(0, 8) + '…' : cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
