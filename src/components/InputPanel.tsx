import React from 'react';
import { stringToBytes } from '../algorithms/utils';

interface InputPanelProps {
  input: string;
  onInputChange: (value: string) => void;
  isXOF?: boolean;
  xofOutputBytes?: number;
  onXofOutputBytesChange?: (bytes: number) => void;
}

const XOF_PRESETS = [16, 32, 64, 128, 256];

export default function InputPanel({
  input,
  onInputChange,
  isXOF,
  xofOutputBytes = 32,
  onXofOutputBytesChange,
}: InputPanelProps) {
  const bytes = stringToBytes(input);

  return (
    <div className="flex flex-col space-y-1.5 font-mono">
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-1 w-1 bg-[#38bdf8]" />
          <label
            htmlFor="hash-input"
            className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]"
          >
            BUFFER IN: DATA STREAM
          </label>
        </div>
        <div className="flex gap-2 text-[10px] text-[#64748b] tabular-nums">
          <span>{input.length} CHARS</span>
          <span>·</span>
          <span>{bytes.length} BYTES ({bytes.length * 8} BITS)</span>
        </div>
      </div>

      <input
        id="hash-input"
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="ENTER DATA STREAM TO COMPUTE DIGEST..."
        className="h-10 w-full rounded-[2px] border border-[#1f2937] bg-[#0c1017] px-3 font-mono text-xs text-[#f8fafc] placeholder-[#475569] focus:border-[#38bdf8] focus:outline-none transition-colors tabular-nums"
      />

      {/* ─── XOF Variable Output Length Selector ───────────────────────── */}
      {isXOF && onXofOutputBytesChange && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[2px] border border-[#c084fc]/30 bg-[#120e18] px-2.5 py-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-[#c084fc]" />
            <span className="text-[9px] uppercase tracking-wider font-semibold text-[#c084fc]">
              XOF OUTPUT LENGTH:
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              {XOF_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onXofOutputBytesChange(preset)}
                  className={`rounded-[2px] px-1.5 py-0.5 text-[9px] font-mono tabular-nums transition-colors ${
                    xofOutputBytes === preset
                      ? 'bg-[#c084fc] text-black font-bold'
                      : 'bg-[#1e1528] text-[#c084fc] hover:bg-[#2e2040] border border-[#c084fc]/30'
                  }`}
                >
                  {preset}B
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 pl-1 border-l border-[#c084fc]/30">
              <input
                type="number"
                min="1"
                max="1024"
                value={xofOutputBytes}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) {
                    onXofOutputBytesChange(Math.min(val, 1024));
                  }
                }}
                className="w-12 rounded-[2px] border border-[#c084fc]/40 bg-[#0a080e] px-1 py-0.5 text-center text-[10px] text-[#f8fafc] focus:border-[#c084fc] focus:outline-none tabular-nums"
              />
              <span className="text-[9px] text-[#64748b] tabular-nums">
                BYTES ({xofOutputBytes * 8} BITS)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
