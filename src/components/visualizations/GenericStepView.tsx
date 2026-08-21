import type { ReactNode } from 'react';
import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
}

/** Generic fallback visualization — renders step data as labeled key-value pairs */
export default function GenericStepView({ step }: Props) {
  const data = step.data;

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <h4 className="text-xs uppercase tracking-wider text-gray-500">
            {formatLabel(key)}
          </h4>
          <div className="mt-1">{renderValue(value)}</div>
        </div>
      ))}
    </div>
  );
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim();
}

function renderValue(value: unknown, depth: number = 0): ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-600 text-sm italic">null</span>;
  }

  if (typeof value === 'string') {
    // Detect hex strings (even-length, only hex chars)
    if (/^[0-9a-f]+$/i.test(value) && value.length % 2 === 0 && value.length >= 4) {
      return (
        <span className="font-mono text-sm text-cyan-400 break-all">
          {value}
        </span>
      );
    }
    return (
      <span className="font-mono text-sm text-gray-300 break-all">
        {value}
      </span>
    );
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return <span className="font-mono text-sm text-amber-400">{String(value)}</span>;
  }

  if (typeof value === 'boolean') {
    return (
      <span className={`font-mono text-sm ${value ? 'text-green-400' : 'text-red-400'}`}>
        {String(value)}
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-600 text-sm italic">[]</span>;
    }

    // If array of objects with label/hex, render as compact list
    if (typeof value[0] === 'object' && value[0] !== null && 'hex' in value[0]) {
      return (
        <div className="grid gap-0.5">
          {(value as Array<{ label?: string; index?: number; hex: string }>).map(
            (item, i) => (
              <div key={i} className="flex items-center gap-2 font-mono text-xs">
                <span className="w-16 shrink-0 text-gray-500">
                  {item.label ?? `[${item.index ?? i}]`}
                </span>
                <span className="text-cyan-400">{item.hex}</span>
              </div>
            ),
          )}
        </div>
      );
    }

    // Generic array rendering
    return (
      <div className="space-y-1 pl-2 border-l border-gray-700">
        {value.map((item, i) => (
          <div key={i}>{renderValue(item, depth + 1)}</div>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    // Compact display for { label, hex } objects
    if ('label' in obj && 'hex' in obj) {
      return (
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-gray-500">{String(obj.label)}</span>
          <span className="text-cyan-400">{String(obj.hex)}</span>
        </div>
      );
    }

    return (
      <div className="space-y-1 pl-2 border-l border-gray-700">
        {Object.entries(obj).map(([k, v]) => (
          <div key={k} className="flex items-start gap-2">
            <span className="text-xs text-gray-500 shrink-0">{k}:</span>
            {renderValue(v, depth + 1)}
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-sm text-gray-400">{String(value)}</span>;
}
