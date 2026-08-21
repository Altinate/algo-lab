import React, { type ReactNode } from 'react';
import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
}

/** Generic fallback visualization — renders step data as labeled key-value pairs */
export default function GenericStepView({ step }: Props) {
  const data = step.data;

  return (
    <div className="space-y-2 rounded-[2px] bg-[#0c1017] p-2.5 border border-[#1f2937] font-mono">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="space-y-1">
          <h4 className="text-[9px] font-semibold uppercase tracking-wider text-[#38bdf8]">
            {formatLabel(key)}
          </h4>
          <div className="rounded-[2px] bg-[#0e131b] p-2 border border-[#1f2937]">
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
    return <span className="text-[#475569] text-[10px] italic font-mono">null</span>;
  }

  if (typeof value === 'string') {
    // Detect hex strings
    if (/^[0-9a-f]+$/i.test(value) && value.length % 2 === 0 && value.length >= 4) {
      return (
        <span className="font-mono text-[11px] text-[#38bdf8] font-medium break-all select-all tabular-nums">
          0x{value}
        </span>
      );
    }
    return (
      <span className="font-mono text-[11px] text-[#cbd5e1] break-all">
        {value}
      </span>
    );
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return <span className="font-mono text-[11px] text-[#e5a93b] font-medium tabular-nums">{String(value)}</span>;
  }

  if (typeof value === 'boolean') {
    return (
      <span className={`font-mono text-[11px] font-medium ${value ? 'text-[#34d399]' : 'text-[#f43f5e]'}`}>
        {value ? 'true' : 'false'}
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-[#475569] text-[10px] italic font-mono">(empty array)</span>;
    }

    // Array of indexed / labeled items with hex / binary
    if (typeof value[0] === 'object' && value[0] !== null) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-1.5 max-h-56 overflow-y-auto pr-0.5 tabular-nums">
          {(value as Array<Record<string, unknown>>).map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-[2px] bg-[#0c1017] px-2 py-1 font-mono text-[10px] border border-[#1f2937]"
            >
              <span className="text-[#64748b] font-medium">
                {String(item.label ?? item.name ?? (item.index !== undefined ? `[${item.index}]` : `Item ${i}`))}
              </span>
              <span className="text-[#38bdf8] font-medium truncate ml-1.5">
                {item.hex ? `0x${item.hex}` : item.value ? String(item.value) : JSON.stringify(item)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // Array of primitives
    return (
      <div className="flex flex-wrap gap-1 tabular-nums">
        {value.map((item, i) => (
          <span
            key={i}
            className="rounded-[2px] bg-[#0c1017] px-1.5 py-0.2 font-mono text-[10px] text-[#94a3b8] border border-[#1f2937]"
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
        <div className="flex items-center gap-1.5 font-mono text-[10px] tabular-nums">
          <span className="text-[#64748b] font-medium">{String(label)}:</span>
          <span className="text-[#38bdf8] font-medium">{String(val)}</span>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {Object.entries(obj).map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between rounded-[2px] bg-[#0c1017] px-2 py-1 font-mono text-[10px] border border-[#1f2937] tabular-nums"
          >
            <span className="text-[#64748b] font-medium">{formatLabel(k)}:</span>
            <span className="text-[#cbd5e1] font-medium truncate ml-1.5">
              {typeof v === 'object' && v !== null ? (Array.isArray(v) ? `${v.length} items` : 'Object') : String(v)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-[10px] text-[#94a3b8] font-mono">{String(value)}</span>;
}
