import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
}

interface VarDisplay {
  label: string;
  hex: string;
}

interface IntermediateValue {
  label: string;
  hex: string;
}

/** Visualizes compression round computations with working variables and intermediate values */
export default function RoundComputationView({ step }: Props) {
  const data = step.data;

  // Check for round computation data (SHA-256 style with prev/new variables)
  const prevVars = data.prevVariables as VarDisplay[] | undefined;
  const newVars = data.newVariables as VarDisplay[] | undefined;
  const vars = data.variables as VarDisplay[] | undefined;

  // Intermediate computation values
  const intermediates: IntermediateValue[] = [];
  for (const key of ['bigSigma1', 'ch', 'T1', 'bigSigma0', 'maj', 'T2', 'K', 'W', 'sigma0Value', 'sigma1Value', 'result', 'F', 'g_index']) {
    const val = data[key] as IntermediateValue | undefined;
    if (val && typeof val === 'object' && 'hex' in val) {
      intermediates.push(val);
    }
  }

  // Also check for source values (message schedule)
  const sourceValues: IntermediateValue[] = [];
  for (const key of ['wMinus16', 'wMinus15', 'wMinus7', 'wMinus2']) {
    const val = data[key] as IntermediateValue | undefined;
    if (val && typeof val === 'object' && 'hex' in val) {
      sourceValues.push(val);
    }
  }

  // Update hash values step
  const updates = data.updates as Array<{
    label: string;
    prevHex: string;
    addHex: string;
    newHex: string;
  }> | undefined;

  return (
    <div className="space-y-4">
      {/* Source values (for message schedule) */}
      {sourceValues.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs uppercase tracking-wider text-gray-500">
            Source Values
          </h4>
          <div className="grid gap-1">
            {sourceValues.map((v) => (
              <ValueRow key={v.label} label={v.label} hex={v.hex} />
            ))}
          </div>
        </div>
      )}

      {/* Intermediate computations */}
      {intermediates.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs uppercase tracking-wider text-gray-500">
            Computations
          </h4>
          <div className="grid gap-1">
            {intermediates.map((v) => (
              <ValueRow
                key={v.label}
                label={v.label}
                hex={v.hex}
                highlight={v.label === 'T1' || v.label === 'T2'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Working variables (init display) */}
      {vars && !prevVars && (
        <div>
          <h4 className="mb-2 text-xs uppercase tracking-wider text-gray-500">
            Working Variables
          </h4>
          <div className="flex flex-wrap gap-2">
            {vars.map((v) => (
              <VariableBadge key={v.label} label={v.label} hex={v.hex} />
            ))}
          </div>
        </div>
      )}

      {/* Previous → New state transition */}
      {prevVars && newVars && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs uppercase tracking-wider text-gray-500">
              Before
            </h4>
            <div className="flex flex-wrap gap-2">
              {prevVars.map((v) => (
                <VariableBadge key={v.label} label={v.label} hex={v.hex} />
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-xs uppercase tracking-wider text-gray-500">
              After
            </h4>
            <div className="flex flex-wrap gap-2">
              {newVars.map((v, i) => (
                <VariableBadge
                  key={v.label}
                  label={v.label}
                  hex={v.hex}
                  changed={prevVars[i]?.hex !== v.hex}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hash value updates */}
      {updates && (
        <div>
          <h4 className="mb-2 text-xs uppercase tracking-wider text-gray-500">
            Hash Value Updates
          </h4>
          <div className="grid gap-1">
            {updates.map((u) => (
              <div
                key={u.label}
                className="flex items-center gap-2 font-mono text-xs"
              >
                <span className="w-10 text-gray-500">{u.label}</span>
                <span className="text-gray-500">{u.prevHex}</span>
                <span className="text-gray-600">+</span>
                <span className="text-amber-400">{u.addHex}</span>
                <span className="text-gray-600">=</span>
                <span className="text-green-400">{u.newHex}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ValueRow({
  label,
  hex,
  highlight,
}: {
  label: string;
  hex: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 font-mono text-xs">
      <span className="w-24 shrink-0 text-gray-500">{label}</span>
      <span className={highlight ? 'text-yellow-300 font-semibold' : 'text-cyan-400'}>
        {hex}
      </span>
    </div>
  );
}

function VariableBadge({
  label,
  hex,
  changed,
}: {
  label: string;
  hex: string;
  changed?: boolean;
}) {
  return (
    <div
      className={`rounded-md border px-2 py-1 font-mono text-xs ${
        changed
          ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
          : 'border-gray-600 bg-gray-800 text-cyan-400'
      }`}
    >
      <span className="text-gray-500">{label}=</span>
      {hex}
    </div>
  );
}
