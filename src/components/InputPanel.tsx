import { stringToBytes } from '../algorithms/utils';

interface InputPanelProps {
  input: string;
  onInputChange: (value: string) => void;
}

export default function InputPanel({ input, onInputChange }: InputPanelProps) {
  const bytes = stringToBytes(input);

  return (
    <div className="flex flex-col space-y-1 font-mono">
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
    </div>
  );
}
