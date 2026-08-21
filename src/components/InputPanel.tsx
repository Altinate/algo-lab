import { stringToBytes } from '../algorithms/utils';

interface InputPanelProps {
  input: string;
  onInputChange: (value: string) => void;
}

export default function InputPanel({ input, onInputChange }: InputPanelProps) {
  const bytes = stringToBytes(input);

  return (
    <div className="flex flex-col space-y-1.5">
      <div className="flex shrink-0 items-center justify-between">
        <label
          htmlFor="hash-input"
          className="text-xs font-bold uppercase tracking-wider text-gray-400"
        >
          Input
        </label>
        <div className="flex gap-2.5 text-[11px] text-gray-500 font-mono">
          <span>{input.length} chars</span>
          <span>{bytes.length} bytes</span>
        </div>
      </div>
      <input
        id="hash-input"
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="Type or paste text to hash..."
        className="h-11 w-full rounded-lg border border-gray-700 bg-gray-800/80 px-3.5 font-mono text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
      />
    </div>
  );
}
