import React, { type ReactNode } from 'react';
import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
}

/** Generic fallback visualization — renders step data as labeled key-value pairs */
export default function GenericStepView({ step }: Props) {
  const data = step.data;

  return (
    <div className="space-y-4 rounded-lg bg-gray-900/60 p-4 border border-gray-800">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="space-y-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
            {formatLabel(key)}
          </h4>
          <div className="rounded-md bg-gray-800/80 p-3 border border-gray-700/70">
            {renderValue(value)}
          </div>
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
    return <span className="text-gray-600 text-xs italic font-mono">null</span>;
  }

  if (typeof value === 'string') {
    // Detect hex strings
    if (/^[0-9a-f]+$/i.test(value) && value.length % 2 === 0 && value.length >= 4) {
      return (
        <span className="font-mono text-xs text-cyan-300 font-bold break-all select-all">
          0x{value}
        </span>
      );
    }
    return (
      <span className="font-mono text-xs text-gray-200 break-all">
        {value}
      </span>
    );
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return <span className="font-mono text-xs text-amber-300 font-bold">{String(value)}</span>;
  }

  if (typeof value === 'boolean') {
    return (
      <span className={`font-mono text-xs font-bold ${value ? 'text-green-400' : 'text-red-400'}`}>
        {value ? 'true' : 'false'}
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-600 text-xs italic font-mono">(empty array)</span>;
    }

    // Array of indexed / labeled items with hex / binary
    if (typeof value[0] === 'object' && value[0] !== null) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
          {(value as Array<Record<string, unknown>>).map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded bg-gray-900/80 px-2.5 py-1.5 font-mono text-xs border border-gray-700/60"
            >
              <span className="text-gray-400 font-semibold">
                {String(item.label ?? item.name ?? (item.index !== undefined ? `[${item.index}]` : `Item ${i}`))}
              </span>
              <span className="text-cyan-300 font-bold truncate ml-2">
                {item.hex ? `0x${item.hex}` : item.value ? String(item.value) : JSON.stringify(item)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // Array of primitives
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, i) => (
          <span
            key={i}
            className="rounded bg-gray-900 px-2 py-0.5 font-mono text-xs text-gray-300 border border-gray-700"
          >
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;

    // Compact display for { label/name, hex/value }
    if (('label' in obj || 'name' in obj) && ('hex' in obj || 'value' in obj)) {
      const label = obj.label ?? obj.name;
      const val = obj.hex ? `0x${obj.hex}` : obj.value;
      return (
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-gray-400 font-bold">{String(label)}:</span>
          <span className="text-cyan-300 font-bold">{String(val)}</span>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.entries(obj).map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between rounded bg-gray-900/60 px-2.5 py-1.5 font-mono text-xs border border-gray-700/50"
          >
            <span className="text-gray-400 font-medium">{formatLabel(k)}:</span>
            <span className="text-gray-200 font-semibold truncate ml-2">
              {typeof v === 'object' && v !== null ? (Array.isArray(v) ? `${v.length} items` : 'Object') : String(v)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-xs text-gray-300 font-mono">{String(value)}</span>;
}
