import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
}

/** Visualizes the final hash digest output */
export default function FinalDigestView({ step }: Props) {
  const data = step.data;
  const hashValues = data.hashValues as Array<{ label: string; hex: string }> | undefined;
  const digest = data.digest as string;
  const digestFormatted = data.digestFormatted as string | undefined;

  return (
    <div className="space-y-4">
      {/* Hash values that compose the digest */}
      {hashValues && (
        <div>
          <h4 className="mb-2 text-xs uppercase tracking-wider text-gray-500">
            Hash Values
          </h4>
          <div className="flex flex-wrap gap-1">
            {hashValues.map((h, i) => (
              <div
                key={i}
                className="rounded-md border border-green-500/20 bg-green-500/5 px-2 py-1 font-mono text-xs"
              >
                <span className="text-gray-500">{h.label}=</span>
                <span className="text-green-400">{h.hex}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Concatenation arrow */}
      <div className="flex items-center gap-2 text-gray-500">
        <div className="h-px flex-1 bg-gray-700" />
        <span className="text-xs">concatenate</span>
        <div className="h-px flex-1 bg-gray-700" />
      </div>

      {/* Final digest */}
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
        <h4 className="mb-1 text-xs uppercase tracking-wider text-green-400/70">
          Final Digest
        </h4>
        <p className="break-all font-mono text-lg leading-relaxed text-green-300">
          {digestFormatted || digest}
        </p>
        <p className="mt-2 text-xs text-gray-500">
          {digest.length * 4} bits ({digest.length / 2} bytes)
        </p>
      </div>
    </div>
  );
}
