import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
}

/** Visualizes BLAKE2/BLAKE3 G mixing function with state columns */
export default function MixingFunctionView({ step }: Props) {
  const data = step.data;
  const roundIndex = data.roundIndex as number | undefined;
  const state = data.state as string[] | undefined;
  const prevState = data.prevState as string[] | undefined;
  const gCalls = data.gCalls as Array<{
    label: string;
    inputs: string[];
    outputs: string[];
  }> | undefined;
  const mixType = data.mixType as string | undefined;

  return (
    <div className="space-y-4">
      {roundIndex !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Round {roundIndex}</span>
          {mixType && (
            <span className="rounded bg-purple-600/20 px-2 py-0.5 text-xs text-purple-400 border border-purple-500/30">
              {mixType}
            </span>
          )}
        </div>
      )}

      {/* G function calls */}
      {gCalls && gCalls.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-gray-500">
            G Mixing Calls
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {gCalls.map((g) => (
              <div
                key={g.label}
                className="rounded-md border border-gray-700 bg-gray-800/50 p-2"
              >
                <span className="text-xs text-gray-500">{g.label}</span>
                <div className="mt-1 flex items-center gap-1 font-mono text-[10px]">
                  <span className="text-gray-500">in:</span>
                  {g.inputs.map((v, i) => (
                    <span key={i} className="text-cyan-400">
                      {v.slice(0, 8)}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <span className="text-gray-500">out:</span>
                  {g.outputs.map((v, i) => (
                    <span key={i} className="text-green-400">
                      {v.slice(0, 8)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* State display */}
      {state && (
        <div className={prevState ? 'grid gap-4 md:grid-cols-2' : ''}>
          {prevState && (
            <div>
              <h4 className="mb-2 text-xs uppercase tracking-wider text-gray-500">
                Before
              </h4>
              <StateColumn values={prevState} />
            </div>
          )}
          <div>
            <h4 className="mb-2 text-xs uppercase tracking-wider text-gray-500">
              {prevState ? 'After' : 'State'}
            </h4>
            <StateColumn values={state} prevValues={prevState} />
          </div>
        </div>
      )}

      {/* Fallback for simple data */}
      {!state && !gCalls && (
        <div className="text-sm text-gray-400">
          <pre className="overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

function StateColumn({
  values,
  prevValues,
}: {
  values: string[];
  prevValues?: string[];
}) {
  // Display as 4×4 grid (BLAKE2/3 uses 16-word state)
  const rows = [];
  for (let i = 0; i < values.length; i += 4) {
    rows.push(values.slice(i, i + 4));
  }

  return (
    <div className="space-y-0.5">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.map((val, ci) => {
            const idx = ri * 4 + ci;
            const changed = prevValues ? prevValues[idx] !== val : false;
            return (
              <span
                key={ci}
                className={`rounded border px-1 py-0.5 font-mono text-[10px] ${
                  changed
                    ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                    : 'border-gray-700 text-cyan-400'
                }`}
              >
                v{idx}: {val.slice(0, 8)}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
