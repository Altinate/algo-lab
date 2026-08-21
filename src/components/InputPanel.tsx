import { stringToBytes } from '../algorithms/utils';

interface InputPanelProps {
  input: string;
  onInputChange: (value: string) => void;
}

export default function InputPanel({ input, onInputChange }: InputPanelProps) {
  const bytes = stringToBytes(input);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="hash-input"
          className="text-sm font-semibold uppercase tracking-wider text-gray-400"
        >
          Input
        </label>
        <div className="flex gap-3 text-xs text-gray-500">
          <span>{input.length} chars</span>
          <span>{bytes.length} bytes</span>
        </div>
      </div>
      <textarea
        id="hash-input"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="Type or paste text to hash..."
        rows={3}
        className="w-full resize-y rounded-lg border border-gray-600 bg-gray-800/50 px-4 py-3 font-mono text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
